<script setup lang="ts">
definePageMeta({
  layout: 'home',
})

const { reviews, location } = useApi()

const { data: reviewItems } = await useAsyncData('home-reviews', () =>
  reviews.getReviewItems({
    type: 'hotel',
    order_by: 'created_at',
    order_direction: 'desc',
    limit: 3,
  }),
)

const { data: locationItems } = await useAsyncData('home-location-offers', () =>
  location.getLocationOfferItems(),
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
    <HomeBlocksBestOffersBlock />
    <HomeBlocksBestLocationsBlock :items="locationItems ?? []" />
    <HomeBlocksHowItWorksBlock />
    <HomeBlocksCommunityBlock />
    <HomeBlocksReviewsBlock :items="reviewItems ?? []" />
    <HomeBlocksFaqBlock />
    <HomeBlocksProjectDescriptionBlock />
    <LayoutAppFooter />
  </div>
</template>
