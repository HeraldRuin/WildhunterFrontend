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
        Онлайн-платформа<br class="search-top__tagline-br"> для настоящих охотников
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
  max-width: 100%;
  font-family: "UNCAGE", sans-serif;
  font-size: 40px;
  font-weight: 400;
  line-height: 130%;
  letter-spacing: -0.03em;
  text-align: center;
  color: rgba(255, 255, 255, 0.92);
}

.search-top__tagline-br {
  display: none;
}

@media (max-width: 1024px) {
  .search-top {
    height: 445px;
  }

  .search-top__inner {
    gap: 20px;
    padding: 140px 16px 36px;
  }

  .search-top__tagline {
    width: auto;
    font-size: 38px;
  }

  .search-top__tagline-br {
    display: block;
  }
}

@media (max-width: 640px) {
  .search-top__tagline {
    font-size: 12px;
    letter-spacing: 0.12em;
  }
}
</style>
