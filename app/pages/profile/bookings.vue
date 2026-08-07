<script setup lang="ts">
import type { BookingAction, BookingHistoryItem, BookingTab } from '~/types/booking'
import { getBookingsByTab } from '~/utils/bookings'

definePageMeta({
  layout: 'profile',
  middleware: 'auth',
})

useHead({
  title: 'Бронирования — WH',
})

const notificationCount = 2
const { open: openCollectionModal } = useCollectionModal()
const { open: openCancelBookingModal } = useCancelBookingModal()
const { open: openAddServicesModal } = useAddServicesModal()

const breadcrumbs = [
  { label: 'Главная', to: '/' },
  { label: 'Бронирования' },
]
const activeTab = ref<BookingTab>('my')

const tabs: { id: BookingTab, label: string }[] = [
  { id: 'my', label: 'Мои брони' },
  { id: 'invitations', label: 'Приглашения' },
]

const bookings = computed(() => getBookingsByTab(activeTab.value))

const emptyText = computed(() =>
  activeTab.value === 'invitations'
    ? 'Нет активных приглашений'
    : 'Нет бронирований',
)

function handleBookingAction({ booking, action }: { booking: BookingHistoryItem, action: BookingAction }) {
  if (action.id === 'open_collection') {
    openCollectionModal(booking)
    return
  }

  if (action.id === 'cancel_booking') {
    openCancelBookingModal(booking)
    return
  }

  if (action.id === 'add_services') {
    openAddServicesModal(booking)
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

    <div class="bookings-page__tabs" role="tablist" aria-label="Разделы бронирований">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        role="tab"
        class="bookings-page__tab"
        :class="{ 'bookings-page__tab--active': activeTab === tab.id }"
        :aria-selected="activeTab === tab.id"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <ProfileBookingHistoryTable
      :items="bookings"
      :empty-text="emptyText"
      @action="handleBookingAction"
    />

    <ProfileCollectionModal />
    <ProfileCancelBookingModal />
    <ProfileAddServicesModal />
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

.bookings-page__tabs {
  display: flex;
  gap: 28px;
  margin-bottom: 16px;
}

.bookings-page__tab {
  position: relative;
  padding: 10px 0 12px;
  border: none;
  background: none;
  color: var(--wh-gray-400);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s ease;
}

.bookings-page__tab:hover {
  color: var(--wh-gray-600);
}

.bookings-page__tab--active {
  color: var(--wh-orange-500);
}

.bookings-page__tab--active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  border-radius: 2px 2px 0 0;
  background: var(--wh-orange-500);
}

@media (--wh-tablet) {
  .bookings-page {
    padding: 12px 8px 32px;
  }

  .bookings-page__header,
  .bookings-page__tabs {
    width: 100%;
  }

  .bookings-page__tabs {
    gap: 20px;
  }
}
</style>
