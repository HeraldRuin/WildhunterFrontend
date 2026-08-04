<script setup lang="ts">
definePageMeta({
  layout: 'home',
})

const { reviews, location, hotels } = useApi()

function getCachedPageData<T>(key: string, nuxtApp: ReturnType<typeof useNuxtApp>) {
  return nuxtApp.payload.data[key] as T | undefined
    ?? nuxtApp.static.data[key] as T | undefined
}

// lazy + getCachedData: назад с /bases|/locations не блокирует переход повторным API.
const { data: locationItems } = useAsyncData(
  'home-location-offers',
  () => location.getLocationOfferItems(),
  {
    lazy: true,
    default: () => [],
    getCachedData: (key, nuxtApp) => getCachedPageData(key, nuxtApp),
  },
)

const { data: offerItems } = useAsyncData(
  'home-hotel-offers',
  () => hotels.getHotelOfferItems(),
  {
    lazy: true,
    default: () => [],
    getCachedData: (key, nuxtApp) => getCachedPageData(key, nuxtApp),
  },
)

// Пока пользователь смотрит главную — подгружаем чанк /bases (кнопка «Смотреть все»).
onMounted(() => {
  void preloadRouteComponents('/bases')
})

const { data: reviewItems } = useAsyncData(
  'home-reviews',
  () =>
    reviews.getReviewItems({
      type: 'hotel',
      order_by: 'created_at',
      order_direction: 'desc',
    }),
  {
    lazy: true,
    default: () => [],
    getCachedData: (key, nuxtApp) => getCachedPageData(key, nuxtApp),
  },
)

const isSearching = ref(false)

async function handleSearch(payload: Record<string, string>) {
  if (isSearching.value) {
    return
  }

  isSearching.value = true

  try {
    await navigateTo({
      path: '/bases',
      query: payload,
    })
  }
  catch {
    isSearching.value = false
  }
}
</script>

<template>
  <div class="home">
    <HomeHeroSearch :loading="isSearching" @search="handleSearch" />
    <HomeBlocksWhyUsBlock />
    <HomeBlocksBestOffersBlock :items="offerItems ?? []" />
    <HomeBlocksBestLocationsBlock :items="locationItems ?? []" />
    <HomeBlocksHowItWorksBlock />
    <HomeBlocksCommunityBlock />
    <HomeBlocksReviewsBlock :items="reviewItems ?? []" />
    <HomeBlocksFaqBlock />
    <HomeBlocksProjectDescriptionBlock />
    <LayoutAppFooter />
  </div>
</template>
