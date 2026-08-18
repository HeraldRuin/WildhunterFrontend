<script setup lang="ts">
import type { UserSearchItem } from '~/api/user'
import type {
  BookingInvitationUpdatedPayload,
  BookingStatusUpdatedPayload,
} from '~/composables/useBookingStatusChannel'
import type { BookingAction, BookingHistoryItem } from '~/types/booking'
import { ROLE_BASE_ADMIN, ROLE_HUNTER } from '~/utils/roles'
import { FINISHED_COLLECTION_MODAL_STATUSES, mapBookingHistoryItem } from '~/utils/bookingHistory'

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
const { open: openCollectionModal, applyInvitationUpdate } = useCollectionModal()
const { open: openCancelBookingModal } = useCancelBookingModal()
const { open: openAddServicesModal } = useAddServicesModal()
const { open: openCalculationModal } = useCalculationModal()
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
const bedSelectionModalBooking = ref<BookingHistoryItem | null>(null)
const expiredPrepaymentRequests = new Map<string, Promise<boolean>>()
const completedPrepaymentExpirations = reactive(new Set<string>())
const collectionLoadingBookingId = ref<number | null>(null)
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
  error: historyError,
  refresh: refreshHistory,
} = useAsyncData(
  () => `profile-booking-history-${statusFilter.value ?? 'all'}-${page.value}-${bookingIdFilter.value ?? 'none'}-${invitationCode.value ?? 'no-code'}`,
  () => bookingsApi.history({
    page: page.value,
    status: statusFilter.value,
    booking_id: bookingIdFilter.value,
    code: invitationCode.value,
  }),
  {
    lazy: true,
    watch: [statusFilter, page, bookingIdFilter, invitationCode],
  },
)

const { isBaseAdmin } = useUserRole()
const isHunter = computed(() => !isBaseAdmin.value)

const tabStatuses = computed(() => {
  if (!isBaseAdmin.value) {
    return historyResponse.value?.data?.statuses ?? []
  }

  const fromApi = (historyResponse.value?.data?.statuses ?? []).filter(
    code => code !== 'invitation',
  )

  return fromApi.length ? fromApi : ['completed']
})

const dropdownStatuses = computed(() =>
  historyResponse.value?.data?.dropdown_statuses ?? [],
)

const bookings = computed<BookingHistoryItem[]>(() => {
  const rootHotel = historyResponse.value?.data?.hotel

  return (historyResponse.value?.data?.bookings?.items ?? []).map((item) => {
    const booking = mapBookingHistoryItem(item, {
      hotelSlug: rootHotel?.slug,
      locationSlug: rootHotel?.location?.slug,
      isHunter: isHunter.value,
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

const selectedMobileBookingId = ref<number | null>(null)

const expiredPrepaymentCodes = computed(() =>
  bookings.value
    .filter(booking =>
      booking.status.code === 'prepayment_collection'
      && booking.isMasterHunter
      && booking.status.timer === '00 мин 00 сек',
    )
    .map(booking => booking.code),
)

watch(expiredPrepaymentCodes, (codes, previousCodes) => {
  const previouslyExpired = new Set(previousCodes)

  for (const code of codes) {
    if (previouslyExpired.has(code)) continue
    if (expiredPrepaymentRequests.has(code)) continue

    void expirePrepaymentOnce(code)
  }
})

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
            isHunter: isHunter.value,
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
  if (collectionLoadingBookingId.value !== null) return

  collectionLoadingBookingId.value = booking.id

  try {
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
  finally {
    collectionLoadingBookingId.value = null
  }
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

  const openedBedSelection = bedSelectionModalBooking.value
  if (openedBedSelection && openedBedSelection.id === payload.booking_id) {
    bedSelectionModalBooking.value = {
      ...openedBedSelection,
      status: {
        ...openedBedSelection.status,
        code: payload.status,
        label: payload.status_label,
      },
    }
  }

  void refreshHistoryFromChannel()
}

function invitationMatchesDto(
  invitation: { invitation_id: number, hunter_id: number },
  payload: BookingInvitationUpdatedPayload,
) {
  return Number(invitation.invitation_id) === Number(payload.invitation_id)
    || Number(invitation.hunter_id) === Number(payload.hunter_id)
}

function bookingMatchesInvitationPayload(
  booking: { id: number, code: string, booking_number: string | number },
  payload: BookingInvitationUpdatedPayload,
) {
  return booking.id === payload.booking_id
    || Number(booking.booking_number) === Number(payload.booking_id)
    || Boolean(payload.code && booking.code === payload.code)
}

function nextAcceptedCount(
  current: number,
  invitations: Array<{ is_accepted: boolean }>,
  found: boolean,
  payload: BookingInvitationUpdatedPayload,
) {
  if (invitations.length > 0) {
    const accepted = invitations.filter(invitation => invitation.is_accepted).length
    return !found && payload.is_accepted ? accepted + 1 : accepted
  }

  if (payload.is_accepted) {
    return current + 1
  }

  return current
}

function applyBookingInvitationUpdate(payload: BookingInvitationUpdatedPayload) {
  const response = historyResponse.value

  if (response?.data.bookings.items.some(booking => bookingMatchesInvitationPayload(booking, payload))) {
    historyResponse.value = {
      ...response,
      data: {
        ...response.data,
        bookings: {
          ...response.data.bookings,
          items: response.data.bookings.items.map((booking) => {
            if (!bookingMatchesInvitationPayload(booking, payload)) {
              return booking
            }

            const invitations = booking.collection.invitations ?? []
            let found = false
            const nextInvitations = invitations.map((invitation) => {
              if (!invitationMatchesDto(invitation, payload)) {
                return invitation
              }

              found = true
              return {
                ...invitation,
                status: payload.status,
                is_accepted: payload.is_accepted,
              }
            })

            return {
              ...booking,
              collection: {
                ...booking.collection,
                invitations: nextInvitations,
                accepted_count: nextAcceptedCount(
                  booking.collection.accepted_count,
                  nextInvitations,
                  found,
                  payload,
                ),
              },
            }
          }),
        },
      },
    }
  }

  applyInvitationUpdate(payload)
}

const { syncSubscriptions } = useBookingStatusChannel(
  applyBookingStatusUpdate,
  applyBookingInvitationUpdate,
)

async function refreshHistoryFromChannel() {
  const openedFinishedCollectionCode = finishedCollectionModalBooking.value?.code
  const openedBedSelectionCode = bedSelectionModalBooking.value?.code

  await refreshHistory()

  if (openedFinishedCollectionCode) {
    finishedCollectionModalBooking.value = bookings.value.find(
      booking => booking.code === openedFinishedCollectionCode,
    ) ?? null
  }

  if (openedBedSelectionCode) {
    bedSelectionModalBooking.value = bookings.value.find(
      booking => booking.code === openedBedSelectionCode,
    ) ?? null
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

const isHistoryInitialLoading = computed(
  () => !historyError.value && historyResponse.value == null,
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
  historyResponse.value = null
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

async function markPaid(booking: BookingHistoryItem) {
  try {
    const response = await bookingsApi.markPaid(booking.code)

    if ('success' in response && response.success) {
      notifications.success(response.message || 'Бронь отмечена как оплаченная')
      await refreshHistory()
      return
    }

    notifications.error(response.message || 'Не удалось отметить бронь как оплаченную')
  }
  catch (error) {
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || 'Не удалось отметить бронь как оплаченную')
    throw error
  }

  throw new Error('mark_paid_failed')
}

async function completeBooking(booking: BookingHistoryItem) {
  try {
    const response = await bookingsApi.complete(booking.code)

    if ('success' in response && response.success) {
      notifications.success(response.message || 'Бронь успешно завершена')
      await refreshHistory()
      return
    }

    notifications.error(response.message || 'Не удалось завершить бронь')
  }
  catch (error) {
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || 'Не удалось завершить бронь')
    throw error
  }

  throw new Error('complete_failed')
}

async function startCollection(booking: BookingHistoryItem) {
  if (collectionLoadingBookingId.value !== null) return

  collectionLoadingBookingId.value = booking.id

  try {
    const response = await bookingsApi.startCollection(booking.code)

    if (response.success) {
      notifications.success(response.message || 'Сбор охотников запущен')
      await refreshHistory()
      const updatedBooking = bookings.value.find(item => item.code === booking.code) ?? booking
      openCollectionModal(updatedBooking)
      return
    }

    notifications.error(response.message || 'Не удалось запустить сбор охотников')
  }
  catch (error) {
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || 'Не удалось запустить сбор охотников')
  }
  finally {
    collectionLoadingBookingId.value = null
  }
}

function handleBookingAction({ booking, action }: { booking: BookingHistoryItem, action: BookingAction }) {
  if (
    booking.status.code
    && FINISHED_COLLECTION_MODAL_STATUSES.has(booking.status.code)
    && (action.id === 'open_collection' || action.id === 'start_collection')
  ) {
    void openFinishedCollectionModal(booking)
    return
  }

  if (action.id === 'start_collection') {
    if (booking.status.code === 'collection') {
      openCollectionModal(booking)
      return
    }

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

  if (action.id === 'mark_paid') {
    openConfirmModal({
      title: 'Это действие переведет бронь в статус «Оплачено». Продолжить?',
      onConfirm: () => markPaid(booking),
    })
    return
  }

  if (action.id === 'complete') {
    openConfirmModal({
      title: 'Это действие переведет бронь в статус «Завершено». Продолжить?',
      onConfirm: () => completeBooking(booking),
    })
    return
  }

  if (action.id === 'select_seat') {
    bedSelectionModalBooking.value = booking
    return
  }

  if (action.id === 'add_services') {
    openAddServicesModal(booking)
    return
  }

  if (action.id === 'calculating') {
    openCalculationModal(booking)
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
      :role="isBaseAdmin ? ROLE_BASE_ADMIN : ROLE_HUNTER"
      :tab-statuses="tabStatuses"
      :dropdown-statuses="dropdownStatuses"
    />

    <ProfileBookingMobileSelect
      v-model="selectedMobileBookingId"
      :items="bookings"
    />

    <Transition name="bookings-fade" mode="out-in">
      <div
        v-if="isHistoryInitialLoading"
        key="bookings-loading"
        class="bookings-page__loading"
        aria-live="polite"
      >
        <CommonSpinner variant="ring" size="lg" label="Загрузка бронирований" />
      </div>

      <div v-else key="bookings-content" class="bookings-page__content">
        <ProfileBookingHistoryTable
          :items="bookings"
          :selected-id="selectedMobileBookingId"
          :empty-text="emptyText"
          :show-details-buttons="isHunter"
          :show-customer="isBaseAdmin"
          :show-calculation="isBaseAdmin"
          :show-hunter-calculation="isHunter"
          :loading-collection-booking-id="collectionLoadingBookingId"
          @action="handleBookingAction"
          @customer="openCustomerModal"
        />
      </div>
    </Transition>

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
    <ProfileBedSelectionModal
      :booking="bedSelectionModalBooking"
      @close="bedSelectionModalBooking = null"
    />
    <CommonConfirmModal />
    <ProfileAddServicesModal />
    <ProfileCalculationModal />
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
  flex-shrink: 0;
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
  flex-shrink: 0;
  width: 100%;
}

.bookings-page :deep(.booking-history-tabs) {
  flex-shrink: 0;
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
  margin-top: 8px;
  padding: 1px;
  border: 1px solid var(--wh-gray-400);
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  overflow: hidden;
}

.bookings-page__content :deep(.booking-table-wrap) {
  border: none;
  border-radius: calc(var(--wh-radius) - 2px);
  overflow: hidden;
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
  transition: opacity 0.4s ease;
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

@media (--wh-mobile) {
  .bookings-page__loading {
    flex: none;
    align-items: flex-start;
    min-height: 0;
    padding-top: 160px;
  }
}
</style>
