<script setup lang="ts">
const emit = defineEmits<{
  search: [payload: Record<string, string>]
}>()
</script>

<template>
  <section class="search-top">
    <div class="search-top__inner">
      <HomeHeroHeader />

      <p class="search-top__tagline">
        Онлайн-платформа для настоящих охотников
      </p>

      <HomeHeroSearchForm layout="split" @search="emit('search', $event)" />
    </div>
  </section>
</template>

<style scoped>
.search-top {
  position: relative;
  height: 375px;
  background: var(--wh-green);
}

.search-top__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: min(100%, 1440px);
  margin-inline: auto;
  padding: 172px 24px 48px;
}

.search-top__inner :deep(.hero-header) {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
}

.search-top__tagline {
  margin: 0;
  width: 859px;
  font-family: "UNCAGE", sans-serif;
  font-size: 40px;
  font-weight: 400;
  line-height: 130%;
  letter-spacing: -0.03em;
  text-align: center;
  color: rgba(255, 255, 255, 0.92);
}

@media (max-width: 1024px) {
  .search-top__inner {
    gap: 20px;
    padding-inline: 16px;
    padding-bottom: 36px;
  }
}

@media (max-width: 640px) {
  .search-top__tagline {
    font-size: 12px;
    letter-spacing: 0.12em;
  }
}
</style>
