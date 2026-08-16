<script setup lang="ts">
import type { BaseHotelItem } from '~/components/profile/BaseHotelCard.vue'

definePageMeta({
  layout: 'profile',
  middleware: 'baseadmin',
})

useHead({
  title: 'Управление базой — WH',
})

const notificationCount = 0

const breadcrumbs = [
  { label: 'Главная', to: '/' },
  { label: 'Параметр' },
  { label: 'Управление базой' },
]

const hotels: BaseHotelItem[] = [
  {
    id: 1,
    title: 'Хромой кабан-2',
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
    location: 'Ярославская область',
    price: 4000,
    status: 'publish',
    updatedAt: '04.08.2026 09:45',
    isFavorite: true,
  },
]

const hotelsCount = hotels.length
</script>

<template>
  <div class="profile-page">
    <header class="profile-page__header">
      <AppBreadcrumbs :items="breadcrumbs" />

      <button type="button" class="profile-page__notifications" aria-label="Уведомления">
        <img
          src="/icons/bell.png"
          alt=""
          aria-hidden="true"
          class="profile-page__notifications-icon"
          width="18"
          height="22"
        >
        <span class="profile-page__notifications-badge">{{ notificationCount }}</span>
      </button>
    </header>

    <CommonPageTitle divider>Управление базой</CommonPageTitle>

    <div v-if="hotelsCount > 0" class="base-hotels">
      <div class="base-hotels__list">
        <ProfileBaseHotelCard
          v-for="hotel in hotels"
          :key="hotel.id"
          :item="hotel"
        />
      </div>
    </div>

    <p v-else class="base-hotels__empty">Нет отелей</p>
  </div>
</template>

<style scoped>
.profile-page {
  padding: 20px 40px 48px;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
}

.profile-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 896px;
  max-width: 100%;
  height: 31px;
  margin-bottom: 20px;
  padding: 0;
  box-sizing: border-box;
  background: var(--wh-white);
  border-radius: var(--wh-radius);
  overflow: visible;
}

.profile-page__notifications {
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

.profile-page__notifications-icon {
  display: block;
  width: 18px;
  height: 22px;
  object-fit: contain;
}

.profile-page__notifications-badge {
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

.profile-page :deep(.page-title--divider) {
  width: 100%;
}

.base-hotels__list {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.base-hotels__empty {
  margin: 0;
  color: rgba(0, 0, 0, 0.55);
  font-size: 16px;
}

@media (--wh-tablet) {
  .profile-page {
    padding: 12px 8px 32px;
  }

  .profile-page__header {
    width: 100%;
  }
}

@media (--wh-mobile) {
  .profile-page {
    padding: 16px 20px 32px;
  }

  .profile-page__header {
    height: auto;
    min-height: 31px;
    padding: 0;
    background: transparent;
    border-radius: 0;
  }
}
</style>
