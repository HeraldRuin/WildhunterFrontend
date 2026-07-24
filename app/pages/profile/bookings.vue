<script setup lang="ts">
import type { BookingTab } from '~/types/booking'
import { getBookingsByTab } from '~/utils/bookings'

definePageMeta({
  layout: 'profile',
  middleware: 'auth',
})

useHead({
  title: 'Бронирования — WH',
})

const notificationCount = 2
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
</script>

<template>
  <div class="bookings-page">
    <header class="bookings-page__header">
      <nav class="bookings-page__breadcrumbs" aria-label="Хлебные крошки">
        <NuxtLink to="/">Главная</NuxtLink>
        <span aria-hidden="true">&gt;</span>
        <span>Бронирования</span>
      </nav>

      <button type="button" class="bookings-page__notifications" aria-label="Уведомления">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3a5 5 0 00-5 5v3.5l-1.5 2.5h13L17 11.5V8a5 5 0 00-5-5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
          <path d="M10 18a2 2 0 004 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
        <span v-if="notificationCount" class="bookings-page__notifications-badge">{{ notificationCount }}</span>
      </button>
    </header>

    <h1 class="bookings-page__title">Бронирования</h1>

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
  margin-bottom: 20px;
  padding: 10px 16px;
  background: var(--wh-white);
  border: 1px solid var(--wh-gray-200);
  border-radius: var(--wh-radius);
}

.bookings-page__breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  color: var(--wh-gray-500);
}

.bookings-page__breadcrumbs a {
  color: var(--wh-green);
  transition: opacity 0.15s ease;
}

.bookings-page__breadcrumbs a:hover {
  opacity: 0.8;
}

.bookings-page__notifications {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--wh-gray-900);
  cursor: pointer;
}

.bookings-page__notifications svg {
  width: 22px;
  height: 22px;
}

.bookings-page__notifications-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: #e74c3c;
  color: var(--wh-white);
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1;
}

.bookings-page__title {
  margin: 0 0 20px;
  font-size: clamp(1.5rem, 2.5vw, 2rem);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: var(--wh-gray-900);
}

.bookings-page__tabs {
  display: flex;
  gap: 28px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--wh-gray-200);
}

.bookings-page__tab {
  position: relative;
  margin-bottom: -1px;
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

@media (max-width: 900px) {
  .bookings-page {
    padding: 16px 20px 40px;
  }

  .bookings-page__tabs {
    gap: 20px;
  }
}
</style>
