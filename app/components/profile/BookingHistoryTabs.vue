<script setup lang="ts">
import type { BookingTab } from '~/types/booking'

const model = defineModel<BookingTab>({ required: true })

const tabs: { id: BookingTab, label: string }[] = [
  { id: 'my', label: 'Мои брони' },
  { id: 'invitations', label: 'Приглашения' },
]
</script>

<template>
  <div class="booking-history-tabs" role="tablist" aria-label="Разделы бронирований">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      role="tab"
      class="booking-history-tabs__tab"
      :class="{ 'booking-history-tabs__tab--active': model === tab.id }"
      :aria-selected="model === tab.id"
      @click="model = tab.id"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped>
.booking-history-tabs {
  display: flex;
  gap: 28px;
  margin-bottom: 16px;
}

.booking-history-tabs__tab {
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

.booking-history-tabs__tab:hover {
  color: var(--wh-gray-600);
}

.booking-history-tabs__tab--active {
  color: var(--wh-orange-500);
}

.booking-history-tabs__tab--active::after {
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
  .booking-history-tabs {
    width: 100%;
    gap: 20px;
  }
}
</style>
