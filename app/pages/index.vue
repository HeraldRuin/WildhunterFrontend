<script setup lang="ts">
definePageMeta({
  layout: 'home',
})

const { reviews, location, hotels } = useApi()

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

const { data: offerItems } = await useAsyncData('home-hotel-offers', () =>
  hotels.getHotelOfferItems(),
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
