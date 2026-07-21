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
  background: #586a41;
}

.search-top__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: min(100%, 1440px);
  margin-inline: auto;
  padding: 0 24px 48px;
}

.search-top__tagline {
  margin: 0;
  max-width: 860px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.16em;
  text-align: center;
  text-transform: uppercase;
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
