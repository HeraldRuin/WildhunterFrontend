<script setup lang="ts">
definePageMeta({
  layout: 'home',
})

const { reviews } = useApi()

const { data: reviewItems } = await useAsyncData('home-reviews', () =>
  reviews.getReviewItems({
    type: 'hotel',
    order_by: 'created_at',
    order_direction: 'desc',
    limit: 3,
  }),
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
    <HomeBlocksBestLocationsBlock />
    <HomeBlocksHowItWorksBlock />
    <HomeBlocksCommunityBlock />
    <HomeBlocksReviewsBlock :items="reviewItems ?? []" />
    <HomeBlocksFaqBlock />
    <HomeBlocksProjectDescriptionBlock />
    <LayoutAppFooter />
  </div>
</template>
