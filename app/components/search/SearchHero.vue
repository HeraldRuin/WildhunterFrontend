<script setup lang="ts">
const props = withDefaults(defineProps<{
  title?: string
  hideSearch?: boolean
  backgroundImage?: string
}>(), {
  title: undefined,
  hideSearch: false,
  backgroundImage: undefined,
})

const emit = defineEmits<{
  search: [payload: Record<string, string>]
}>()

const backgroundStyle = computed(() => {
  if (!props.backgroundImage) {
    return undefined
  }

  return {
    backgroundImage: `url(${props.backgroundImage})`,
  }
})
</script>

<template>
  <section
    class="search-top"
    :class="{
      'search-top--compact': hideSearch,
      'search-top--image': Boolean(backgroundImage),
    }"
    :style="backgroundStyle"
  >
    <div class="search-top__inner">
      <HomeHeroHeader />

      <p
        v-if="title || !hideSearch"
        class="search-top__tagline"
      >
        <template v-if="title">
          {{ title }}
        </template>
        <template v-else>
          Онлайн-платформа<br class="search-top__tagline-br">
          <span class="search-top__tagline-rest">для настоящих<br class="search-top__tagline-br--mobile"> охотников</span>
        </template>
      </p>

      <HomeHeroSearchForm
        v-if="!hideSearch"
        layout="split"
        @search="emit('search', $event)"
      />
    </div>
  </section>
</template>

<style scoped>
.search-top {
  position: relative;
  z-index: 40;
  height: 375px;
  overflow: visible;
  background: var(--wh-green);
}

.search-top--compact {
  height: 280px;
}

.search-top--image {
  background-color: transparent;
  background-position: center 52%;
  background-size: cover;
  background-repeat: no-repeat;
}

.search-top__inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: min(100%, 1440px);
  margin-inline: auto;
  padding: 172px 24px 48px;
  overflow: visible;
}

.search-top--compact .search-top__inner {
  padding-bottom: 56px;
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

.search-top__tagline-br--mobile {
  display: none;
}

@media (--wh-tablet) {
  .search-top {
    height: 445px;
  }

  .search-top--compact {
    height: 260px;
  }

  .search-top__inner {
    gap: 20px;
    padding: 140px 16px 36px;
  }

  .search-top--compact .search-top__inner {
    padding-bottom: 48px;
  }

  .search-top__inner :deep(.hero-header) {
    width: calc(100% - 24px);
  }

  .search-top__tagline {
    width: auto;
    font-size: 38px;
  }

  .search-top__tagline-br {
    display: block;
  }

  .search-top__tagline-rest {
    white-space: nowrap;
  }
}

@media (--wh-mobile) {
  .search-top {
    height: auto;
    min-height: 567px;
  }

  .search-top--compact {
    min-height: 220px;
  }

  .search-top__inner {
    padding: 110px 12px 40px;
  }

  .search-top--compact .search-top__inner {
    padding-bottom: 40px;
  }

  .search-top__tagline {
    font-size: 28px;
    line-height: 130%;
    letter-spacing: 0.12em;
  }

  .search-top__tagline-rest {
    white-space: normal;
  }

  .search-top__tagline-br--mobile {
    display: block;
  }
}
</style>
