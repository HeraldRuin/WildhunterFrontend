<script setup lang="ts">
import type { OfferItem } from '~/types/api'

definePageMeta({
  layout: 'profile',
  middleware: 'auth',
  path: '/profile/favorites',
})

useHead({
  title: 'Избранное — WH',
})

const { hotels } = useApi()
const {
  favoriteHotelIds,
  loadFavorites,
} = useFavoriteHotels()

const breadcrumbs = [
  { label: 'Главная', to: '/' },
  { label: 'Избранное' },
]

const favoriteOffers = ref<OfferItem[]>([])
const isPageLoading = ref(true)

async function refreshOffers() {
  const ids = favoriteHotelIds.value

  if (!ids.length) {
    favoriteOffers.value = []
    return
  }

  const offers = await hotels.getHotelOfferItems()
  const idSet = new Set(ids)
  favoriteOffers.value = offers.filter(item => idSet.has(item.id))
}

onMounted(async () => {
  isPageLoading.value = true

  try {
    await loadFavorites()
    await refreshOffers()
  }
  catch {
    favoriteOffers.value = []
  }
  finally {
    isPageLoading.value = false
  }
})

watch(favoriteHotelIds, (ids) => {
  if (isPageLoading.value) {
    return
  }

  const idSet = new Set(ids)
  favoriteOffers.value = favoriteOffers.value.filter(item => idSet.has(item.id))
})
</script>

<template>
  <div class="profile-page">
    <header class="profile-page__header">
      <AppBreadcrumbs :items="breadcrumbs" />

      <ProfileNotificationsBell />
    </header>

    <CommonPageTitle divider>Избранное</CommonPageTitle>

    <div
      v-if="isPageLoading"
      class="favorites-page__state favorites-page__state--loading"
    >
      <CommonSpinner
        variant="ring"
        size="lg"
      />
    </div>

    <p
      v-else-if="!favoriteOffers.length"
      class="favorites-page__empty"
    >
      В избранном пока нет баз. Добавляйте понравившиеся отели на главной или в каталоге.
    </p>

    <div
      v-else
      class="favorites-page__grid"
    >
      <HomeOfferCard
        v-for="item in favoriteOffers"
        :key="item.id"
        :item="item"
      />
    </div>
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
  width: 100%;
  max-width: 1100px;
  height: 31px;
  margin-bottom: 20px;
  padding: 0;
  box-sizing: border-box;
  background: var(--wh-white);
  border-radius: var(--wh-radius);
  overflow: visible;
}

.profile-page :deep(.page-title--divider) {
  width: 100%;
  max-width: 1100px;
}

.favorites-page__state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
}

.favorites-page__empty {
  margin: 24px 0 0;
  color: rgba(0, 0, 0, 0.55);
  font-size: 16px;
  line-height: 1.5;
}

@media (--wh-desktop) {
  .favorites-page__empty {
    white-space: nowrap;
  }
}

.favorites-page__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px 20px;
  width: 100%;
  max-width: 1100px;
  margin-top: 24px;
}

@media (--wh-tablet) {
  .favorites-page__empty {
    max-width: 520px;
  }

  .profile-page {
    padding: 12px 8px 32px;
  }

  .favorites-page__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (--wh-mobile) {
  .favorites-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>
