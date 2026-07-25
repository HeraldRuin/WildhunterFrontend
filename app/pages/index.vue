<script setup lang="ts">
definePageMeta({
  layout: 'home',
})

const { reviews, location, hotels } = useApi()

function getCachedPageData<T>(key: string, nuxtApp: ReturnType<typeof useNuxtApp>) {
  return nuxtApp.payload.data[key] as T | undefined
    ?? nuxtApp.static.data[key] as T | undefined
}

// Без await: назад с /locations не ждёт повторный API (~4с).
const { data: locationItems } = useAsyncData(
  'home-location-offers',
  () => location.getLocationOfferItems(),
  {
    default: () => [],
    getCachedData: (key, nuxtApp) => getCachedPageData(key, nuxtApp),
  },
)

const { data: offerItems } = useAsyncData(
  'home-hotel-offers',
  () => hotels.getHotelOfferItems(),
  {
    default: () => [],
    getCachedData: (key, nuxtApp) => getCachedPageData(key, nuxtApp),
  },
)

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

function handleSearch(payload: Record<string, string>) {
  navigateTo({
    path: '/bases',
    query: payload,
  })
}
</script>

<template>
  <div class="home">
    <HomeHeroSearch @search="handleSearch" />
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
