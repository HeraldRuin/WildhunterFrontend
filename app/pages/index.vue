<script setup lang="ts">
definePageMeta({
  layout: 'home',
})

const { reviews, location, hotels } = useApi()

const [
  { data: locationItems },
  { data: offerItems },
] = await Promise.all([
  useAsyncData('home-location-offers', () => location.getLocationOfferItems()),
  useAsyncData('home-hotel-offers', () => hotels.getHotelOfferItems()),
])

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
