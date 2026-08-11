<script setup lang="ts">
definePageMeta({
  layout: 'home',
})

useHead({
  title: 'Условия использования',
})
</script>

<template>
  <div class="terms-page">
    <section class="terms-hero">
      <div class="terms-hero__header">
        <HomeHeroHeader />
      </div>
      <div class="terms-hero__title">
        <HomeHeroTitle />
      </div>
    </section>

    <main class="terms-content container" />

    <LayoutAppFooter />
  </div>
</template>

<style scoped>
.terms-hero {
  position: relative;
  min-height: 520px;
  background:
    linear-gradient(180deg, rgba(17, 24, 39, 0.08) 0%, rgba(17, 24, 39, 0.18) 100%),
    url('/images/headBlock.jpg') center / 100% 100% no-repeat;
  color: var(--wh-white);
}

.terms-hero__header {
  display: flex;
  justify-content: center;
  padding-inline: 12px;
}

.terms-hero__title {
  position: absolute;
  top: 300px;
  left: 50%;
  width: 100%;
  max-width: calc(100% - 24px);
  transform: translateX(-50%);
}

.terms-content {
  min-height: 240px;
}

@media (--wh-tablet) {
  .terms-hero {
    min-height: 500px;
  }

  .terms-hero__title {
    top: 290px;
  }
}

@media (--wh-mobile) {
  .terms-hero {
    min-height: 390px;
    background-size: cover;
  }

  .terms-hero__title {
    top: 220px;
  }
}
</style>
