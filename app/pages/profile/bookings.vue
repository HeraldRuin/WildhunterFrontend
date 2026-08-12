<script setup lang="ts">
import type { UserSearchItem } from '~/api/user'
import type { BookingStatusUpdatedPayload } from '~/composables/useBookingStatusChannel'
import type { BookingAction, BookingHistoryItem } from '~/types/booking'
import { ROLE_BASE_ADMIN, ROLE_HUNTER } from '~/utils/roles'
import { mapBookingHistoryItem } from '~/utils/bookingHistory'

definePageMeta({
  layout: 'profile',
  middleware: 'auth',
})

useHead({
  title: 'Бронирования — WH',
})

const route = useRoute()
const { bookings: bookingsApi } = useApi()
const { user } = useAuth()
const notifications = useNotifications()

const notificationCount = 2
const { open: openCollectionModal } = useCollectionModal()
const { open: openCancelBookingModal } = useCancelBookingModal()
const { open: openAddServicesModal } = useAddServicesModal()
const { open: openConfirmModal } = useConfirmModal()

const breadcrumbs = [
  { label: 'Главная', to: '/' },
  { label: 'Бронирования' },
]
const routeStatus = computed(() => {
  const status = route.query.status
  return Array.isArray(status) ? status[0] : status
})
const statusFilter = ref<string | undefined>(
  routeStatus.value === 'invitation' ? 'invitation' : undefined,
)
const page = ref(1)
const timerNow = ref(Date.now())
const customerModalBooking = ref<BookingHistoryItem | null>(null)
const invitationModalBooking = ref<BookingHistoryItem | null>(null)
const collectionInvitationsModalBooking = ref<BookingHistoryItem | null>(null)
const finishedCollectionModalBooking = ref<BookingHistoryItem | null>(null)
const prepaymentModalBooking = ref<BookingHistoryItem | null>(null)
const expiredPrepaymentRequests = new Map<string, Promise<boolean>>()
const completedPrepaymentExpirations = reactive(new Set<string>())
let timerInterval: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  timerNow.value = Date.now()
  timerInterval = setInterval(() => {
    timerNow.value = Date.now()
  }, 1_000)
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})

const bookingIdFilter = computed(() => {
  const raw = route.query.booking_id
  const value = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isFinite(value) && value > 0 ? value : undefined
})

const invitationCode = computed(() => {
  const raw = route.query.code
  const value = String(Array.isArray(raw) ? raw[0] ?? '' : raw ?? '').trim()
  return value || undefined
})

const {
  data: historyResponse,
  pending: historyPending,
  error: historyError,
  refresh: refreshHistory,
} = await useAsyncData(
  () => `profile-booking-history-${statusFilter.value ?? 'all'}-${page.value}-${bookingIdFilter.value ?? 'none'}-${invitationCode.value ?? 'no-code'}`,
  () => bookingsApi.history({
    page: page.value,
    status: statusFilter.value,
    booking_id: bookingIdFilter.value,
    code: invitationCode.value,
  }),
  {
    watch: [statusFilter, page, bookingIdFilter, invitationCode],
  },
)

const historyRole = computed(() =>
  historyResponse.value?.data?.role || ROLE_HUNTER,
)
const isHunter = computed(() =>
  historyRole.value.trim().toLowerCase() === ROLE_HUNTER,
)
const isBaseAdmin = computed(() =>
  historyRole.value.trim().toLowerCase() === ROLE_BASE_ADMIN,
)

const tabStatuses = computed(() =>
  historyResponse.value?.data?.statuses ?? [],
)

const dropdownStatuses = computed(() =>
  historyResponse.value?.data?.dropdown_statuses ?? [],
)

const bookings = computed<BookingHistoryItem[]>(() => {
  const rootHotel = historyResponse.value?.data?.hotel

  return (historyResponse.value?.data?.bookings?.items ?? []).map((item) => {
    const booking = mapBookingHistoryItem(item, {
      hotelSlug: rootHotel?.slug,
      locationSlug: rootHotel?.location?.slug,
    }, timerNow.value)

    if (completedPrepaymentExpirations.has(booking.code)) {
      return {
        ...booking,
        status: {
          ...booking.status,
          timer: '00 мин 00 сек',
        },
      }
    }

    return booking
  })
})

const expiredPrepaymentCodes = computed(() =>
  bookings.value
    .filter(booking =>
      booking.status.code === 'prepayment_collection'
      && booking.isMasterHunter
      && booking.status.timer === '00 мин 00 сек',
    )
    .map(booking => booking.code),
)

watch(expiredPrepaymentCodes, (codes) => {
  for (const code of codes) {
    if (expiredPrepaymentRequests.has(code)) continue

    void expirePrepaymentOnce(code)
  }
}, { immediate: true })

function expirePrepaymentOnce(code: string) {
  const activeRequest = expiredPrepaymentRequests.get(code)
  if (activeRequest) return activeRequest

  const request = expirePrepayment(code)

  expiredPrepaymentRequests.set(code, request)

  return request
}

async function expirePrepayment(code: string): Promise<boolean> {
  try {
    const response = await bookingsApi.expirePrepayment(code)

    if (response.success) {
      completedPrepaymentExpirations.add(code)

      const openedBooking = finishedCollectionModalBooking.value?.code === code
        ? finishedCollectionModalBooking.value
        : null

      const [, refreshedBookingResponse] = await Promise.all([
        refreshHistory(),
        openedBooking
          ? bookingsApi.history({ booking_id: openedBooking.id })
          : Promise.resolve(null),
      ])

      if (openedBooking && refreshedBookingResponse?.success) {
        const refreshedItem = refreshedBookingResponse.data.bookings.items.find(
          item => item.code === code,
        )
        const rootHotel = refreshedBookingResponse.data.hotel

        if (refreshedItem) {
          finishedCollectionModalBooking.value = mapBookingHistoryItem(refreshedItem, {
            hotelSlug: rootHotel?.slug,
            locationSlug: rootHotel?.location?.slug,
          }, timerNow.value)
        }
      }

      return true
    }

    notifications.error(response.message || 'Не удалось завершить сбор предоплаты')
  }
  catch (error) {
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || 'Не удалось завершить сбор предоплаты')
  }

  return false
}

async function openFinishedCollectionModal(booking: BookingHistoryItem) {
  if (
    booking.isMasterHunter
    && booking.status.code === 'prepayment_collection'
    && booking.status.timer === '00 мин 00 сек'
  ) {
    const wasAlreadyRequested = expiredPrepaymentRequests.has(booking.code)
    const success = await expirePrepaymentOnce(booking.code)

    if (!success && wasAlreadyRequested) {
      expiredPrepaymentRequests.delete(booking.code)
      await expirePrepaymentOnce(booking.code)
    }
  }

  finishedCollectionModalBooking.value = bookings.value.find(item => item.code === booking.code)
    ?? booking
}

function applyBookingStatusUpdate(payload: BookingStatusUpdatedPayload) {
  const response = historyResponse.value

  if (!response?.data.bookings.items.some(booking => booking.id === payload.booking_id)) {
    return
  }

  historyResponse.value = {
    ...response,
    data: {
      ...response.data,
      bookings: {
        ...response.data.bookings,
        items: response.data.bookings.items.map(booking =>
          booking.id === payload.booking_id
            ? {
                ...booking,
                status: payload.status,
                status_for_user: payload.status,
                status_label: payload.status_label,
                display_status: payload.status,
              }
            : booking,
        ),
      },
    },
  }
}

const { syncSubscriptions } = useBookingStatusChannel(applyBookingStatusUpdate)

async function refreshHistoryFromChannel() {
  const openedFinishedCollectionCode = finishedCollectionModalBooking.value?.code

  await refreshHistory()

  if (
    openedFinishedCollectionCode
    && !bookings.value.some(booking => booking.code === openedFinishedCollectionCode)
  ) {
    finishedCollectionModalBooking.value = null
  }
}

const { subscribe: subscribeToHistory } = useBookingHistoryChannel(() => {
  void refreshHistoryFromChannel()
})

watch(
  () => historyResponse.value?.data?.bookings?.items.map(item => item.id) ?? [],
  syncSubscriptions,
  { immediate: true },
)

watch(
  () => user.value?.id,
  subscribeToHistory,
  { immediate: true },
)

const emptyText = computed(() => {
  if (historyError.value) {
    return 'Не удалось загрузить бронирования'
  }

  return statusFilter.value === 'invitation'
    ? 'Нет активных приглашений'
    : 'Список истории бронирований пуст'
})

watch(statusFilter, () => {
  page.value = 1
})

watch(routeStatus, (status) => {
  statusFilter.value = status === 'invitation' ? 'invitation' : undefined
})

async function confirmBooking(booking: BookingHistoryItem) {
  try {
    const response = await bookingsApi.confirm(booking.code)

    if ('success' in response && response.success) {
      notifications.success(response.message || 'Бронь успешно подтверждена')
      await refreshHistory()
      return
    }

    notifications.error(response.message || 'Не удалось подтвердить бронь')
  }
  catch (error) {
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || 'Не удалось подтвердить бронь')
    throw error
  }

  throw new Error('confirm_failed')
}

async function cancelBooking(booking: BookingHistoryItem) {
  try {
    const response = await bookingsApi.cancel(booking.code)

    if ('success' in response && response.success) {
      notifications.success(response.message || 'Бронь успешно отменена')
      await refreshHistory()
      return
    }

    notifications.error(response.message || 'Не удалось отменить бронь')
  }
  catch (error) {
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || 'Не удалось отменить бронь')
    throw error
  }

  throw new Error('cancel_failed')
}

async function startCollection(booking: BookingHistoryItem) {
  try {
    const response = await bookingsApi.startCollection(booking.code)

    if (response.success) {
      notifications.success(response.message || 'Сбор охотников запущен')
      await refreshHistory()
      return
    }

    notifications.error(response.message || 'Не удалось запустить сбор охотников')
  }
  catch (error) {
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || 'Не удалось запустить сбор охотников')
  }
}

function handleBookingAction({ booking, action }: { booking: BookingHistoryItem, action: BookingAction }) {
  if (
    booking.status.code === 'prepayment_collection'
    && (action.id === 'open_collection' || action.id === 'start_collection')
  ) {
    void openFinishedCollectionModal(booking)
    return
  }

  if (action.id === 'start_collection') {
    void startCollection(booking)
    return
  }

  if (action.id === 'open_collection') {
    if (booking.isInvitation && booking.invitationAccepted) {
      collectionInvitationsModalBooking.value = booking
      return
    }

    openCollectionModal(booking)
    return
  }

  if (action.id === 'open_invitation') {
    if (booking.invitationAccepted) {
      collectionInvitationsModalBooking.value = booking
    } else {
      invitationModalBooking.value = booking
    }
    return
  }

  if (action.id === 'prepayment') {
    prepaymentModalBooking.value = booking
    return
  }

  if (action.id === 'cancel_booking') {
    openCancelBookingModal(booking, () => cancelBooking(booking))
    return
  }

  if (action.id === 'confirm_booking') {
    openConfirmModal({
      title: 'Вы уверены, что хотите подтвердить бронь?',
      onConfirm: () => confirmBooking(booking),
    })
    return
  }

  if (action.id === 'add_services') {
    openAddServicesModal(booking)
  }
}

function openCustomerModal(booking: BookingHistoryItem) {
  customerModalBooking.value = booking
}

async function handleHunterReplaced(
  { oldHunterId, hunter }: { oldHunterId: number, hunter: UserSearchItem },
  done: () => void,
) {
  const currentBooking = finishedCollectionModalBooking.value
  if (!currentBooking) {
    done()
    return
  }

  const bookingCode = currentBooking.code
  completedPrepaymentExpirations.delete(bookingCode)
  expiredPrepaymentRequests.delete(bookingCode)
  const hunterName = [hunter.first_name, hunter.last_name].filter(Boolean).join(' ')
    || hunter.nik
    || hunter.user_name
    || 'Имя не указано'

  finishedCollectionModalBooking.value = {
    ...currentBooking,
    collectionInvitations: currentBooking.collectionInvitations?.map(invitation =>
      invitation.hunterId === oldHunterId
        ? {
            ...invitation,
            hunterId: hunter.id,
            userName: hunter.nik || hunter.user_name || undefined,
            name: hunterName,
            email: hunter.email || undefined,
            status: 'pending',
            isAccepted: false,
            prepaymentPaid: false,
            prepaymentPaidStatus: 'pending',
          }
        : invitation,
    ),
  }

  await nextTick()
  done()

  await refreshHistory()
  if (finishedCollectionModalBooking.value?.code === bookingCode) {
    finishedCollectionModalBooking.value = bookings.value.find(
      booking => booking.code === bookingCode,
    ) ?? null
  }
}

async function handleHunterRemoved(hunterId: number, done: () => void) {
  const currentBooking = finishedCollectionModalBooking.value
  if (!currentBooking) {
    done()
    return
  }

  const bookingCode = currentBooking.code
  finishedCollectionModalBooking.value = {
    ...currentBooking,
    collectionInvitations: currentBooking.collectionInvitations?.filter(
      invitation => invitation.hunterId !== hunterId,
    ),
  }

  await nextTick()
  done()

  await refreshHistory()
  if (finishedCollectionModalBooking.value?.code === bookingCode) {
    finishedCollectionModalBooking.value = bookings.value.find(
      booking => booking.code === bookingCode,
    ) ?? null
  }
}
</script>

<template>
  <div class="bookings-page">
    <header class="bookings-page__header">
      <AppBreadcrumbs :items="breadcrumbs" />

      <button type="button" class="bookings-page__notifications" aria-label="Уведомления">
        <img
          src="/icons/bell.png"
          alt=""
          aria-hidden="true"
          class="bookings-page__notifications-icon"
          width="18"
          height="22"
        >
        <span v-if="notificationCount" class="bookings-page__notifications-badge">{{ notificationCount }}</span>
      </button>
    </header>

    <CommonPageTitle divider>Бронирования</CommonPageTitle>

    <ProfileBookingHistoryTabs
      v-model="statusFilter"
      :role="historyRole"
      :tab-statuses="tabStatuses"
      :dropdown-statuses="dropdownStatuses"
    />

    <div class="bookings-page__content">
      <Transition name="bookings-fade" mode="out-in" appear>
        <div v-if="historyPending" class="bookings-page__loading" aria-live="polite">
          <CommonSpinner variant="ring" size="lg" label="Загрузка бронирований" />
        </div>

        <ProfileBookingHistoryTable
          v-else
          :items="bookings"
          :empty-text="emptyText"
          :show-details-buttons="isHunter"
          :show-customer="isBaseAdmin"
          :show-calculation="isBaseAdmin"
          @action="handleBookingAction"
          @customer="openCustomerModal"
        />
      </Transition>
    </div>

    <ProfileCollectionModal
      @extended="refreshHistory"
      @cancelled="refreshHistory"
      @finished="refreshHistory"
    />
    <ProfileInvitationModal
      :booking="invitationModalBooking"
      @close="invitationModalBooking = null"
      @accepted="refreshHistory"
      @declined="refreshHistory"
    />
    <ProfileCollectionInvitationsModal
      :booking="collectionInvitationsModalBooking"
      @close="collectionInvitationsModalBooking = null"
    />
    <ProfileFinishedCollectionModal
      :booking="finishedCollectionModalBooking"
      @close="finishedCollectionModalBooking = null"
      @replaced="handleHunterReplaced"
      @removed="handleHunterRemoved"
    />
    <ProfilePrepaymentModal
      :booking="prepaymentModalBooking"
      @close="prepaymentModalBooking = null"
    />
    <CommonConfirmModal />
    <ProfileAddServicesModal />
    <ProfileCustomerModal
      :booking="customerModalBooking"
      @close="customerModalBooking = null"
      @saved="refreshHistory"
    />
  </div>
</template>

<style scoped>
.bookings-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 20px 40px 48px;
  box-sizing: border-box;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
}

.bookings-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  height: 31px;
  margin-bottom: 20px;
  padding: 0;
  box-sizing: border-box;
  overflow: visible;
}

.bookings-page :deep(.page-title--divider) {
  width: 100%;
}

.bookings-page__notifications {
  position: relative;
  flex-shrink: 0;
  width: 18px;
  height: 22px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  overflow: visible;
}

.bookings-page__notifications-icon {
  display: block;
  width: 18px;
  height: 22px;
  object-fit: contain;
}

.bookings-page__notifications-badge {
  position: absolute;
  top: -6px;
  right: -8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  min-width: 16px;
  height: 16px;
  padding: 0;
  border-radius: 50%;
  background: #e74c3c;
  color: var(--wh-white);
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1;
}

.bookings-page__content {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--wh-gray-400);
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  overflow: hidden;
}

.bookings-page__content :deep(.booking-table-wrap) {
  border: none;
  border-radius: 0;
}

.bookings-page__loading {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 220px;
}

.bookings-fade-enter-active,
.bookings-fade-leave-active {
  transition: opacity 0.25s ease;
}

.bookings-fade-enter-from,
.bookings-fade-leave-to {
  opacity: 0;
}

@media (--wh-tablet) {
  .bookings-page {
    padding: 12px 8px 32px;
  }

  .bookings-page__header {
    width: 100%;
  }
}
</style>
