<script setup lang="ts">
definePageMeta({
  layout: 'home',
})

useHead({
  title: 'Оферта',
})
</script>

<template>
  <div class="offer-page">
    <section class="offer-hero">
      <div class="offer-hero__header">
        <HomeHeroHeader />
      </div>
      <div class="offer-hero__title">
        <HomeHeroTitle />
      </div>
    </section>

    <main class="offer-content container" />

    <LayoutAppFooter />
  </div>
</template>

<style scoped>
.offer-hero {
  position: relative;
  min-height: 520px;
  background:
    linear-gradient(180deg, rgba(17, 24, 39, 0.08) 0%, rgba(17, 24, 39, 0.18) 100%),
    url('/images/headBlock.jpg') center / 100% 100% no-repeat;
  color: var(--wh-white);
}

.offer-hero__header {
  display: flex;
  justify-content: center;
  padding-inline: 12px;
}

.offer-hero__title {
  position: absolute;
  top: 300px;
  left: 50%;
  width: 100%;
  max-width: calc(100% - 24px);
  transform: translateX(-50%);
}

.offer-content {
  min-height: 240px;
}

@media (--wh-tablet) {
  .offer-hero {
    min-height: 500px;
  }

  .offer-hero__title {
    top: 290px;
  }
}

@media (--wh-mobile) {
  .offer-hero {
    min-height: 390px;
    background-size: cover;
  }

  .offer-hero__title {
    top: 220px;
  }
}
</style>
