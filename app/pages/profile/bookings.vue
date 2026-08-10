<script setup lang="ts">
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
const statusFilter = ref<string | undefined>(undefined)
const page = ref(1)
const timerNow = ref(Date.now())
const customerModalBooking = ref<BookingHistoryItem | null>(null)
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

const {
  data: historyResponse,
  pending: historyPending,
  error: historyError,
  refresh: refreshHistory,
} = await useAsyncData(
  () => `profile-booking-history-${statusFilter.value ?? 'all'}-${page.value}-${bookingIdFilter.value ?? 'none'}`,
  () => bookingsApi.history({
    page: page.value,
    status: statusFilter.value,
    booking_id: bookingIdFilter.value,
  }),
  {
    watch: [statusFilter, page, bookingIdFilter],
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

  return (historyResponse.value?.data?.bookings?.items ?? []).map(item =>
    mapBookingHistoryItem(item, {
      hotelSlug: rootHotel?.slug,
      locationSlug: rootHotel?.location?.slug,
    }, timerNow.value),
  )
})

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

watch(
  () => historyResponse.value?.data?.bookings?.items.map(item => item.id) ?? [],
  syncSubscriptions,
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
  if (action.id === 'start_collection') {
    void startCollection(booking)
    return
  }

  if (action.id === 'open_collection') {
    openCollectionModal(booking)
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

    <div v-if="historyPending && !bookings.length" class="bookings-page__loading" aria-live="polite">
      <CommonSpinner variant="ring" size="lg" label="Загрузка бронирований" />
    </div>

    <ProfileBookingHistoryTable
      v-else
      :items="bookings"
      :empty-text="emptyText"
      :show-details-buttons="isHunter"
      :show-customer="isBaseAdmin"
      @action="handleBookingAction"
      @customer="openCustomerModal"
    />

    <ProfileCollectionModal @extended="refreshHistory" />
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
  padding: 20px 40px 48px;
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

.bookings-page__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  border: 1px solid var(--wh-gray-200);
  border-radius: var(--wh-radius);
  background: var(--wh-white);
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
