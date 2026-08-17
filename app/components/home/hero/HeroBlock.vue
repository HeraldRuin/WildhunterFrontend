<script setup lang="ts">
withDefaults(defineProps<{
  loading?: boolean
}>(), {
  loading: false,
})

const emit = defineEmits<{
  search: [payload: Record<string, string>]
}>()

const bgImage = '/images/headBlock.jpg'

const bgStyle = computed(() => ({
  backgroundImage: `linear-gradient(180deg, rgba(17, 24, 39, 0.08) 0%, rgba(17, 24, 39, 0.18) 100%), url(${bgImage})`,
}))

function handleSearch(payload: Record<string, string>) {
  emit('search', payload)
}
</script>

<template>
  <section class="hero-block" :style="bgStyle">
    <div class="hero-block__inner">
      <HomeHeroHeader />
    </div>
    <div class="hero-block__title">
      <HomeHeroTitle />
    </div>
    <div class="hero-block__search">
      <HomeHeroSearchForm :loading="loading" @search="handleSearch" />
    </div>
  </section>
</template>

<style scoped>
.hero-block {
  position: relative;
  width: 100%;
  height: 810px;
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
  color: var(--wh-white);
}

.hero-block__inner {
  position: relative;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-inline: auto;
  padding-inline: 12px;
  pointer-events: none;
}

.hero-block__inner > * {
  pointer-events: auto;
}

.hero-block__title {
  position: absolute;
  top: 346px;
  left: 50%;
  z-index: 1;
  width: 100%;
  max-width: calc(100% - 24px);
  transform: translateX(-50%);
}

.hero-block__search {
  position: absolute;
  top: 518px;
  left: 50%;
  z-index: 21;
  width: 1500px;
  max-width: calc(100% - 24px);
  transform: translateX(-50%);
}

@media (--wh-tablet) {
  .hero-block {
    height: auto;
    min-height: 1100px;
  }

  .hero-block__inner {
    width: 100%;
    height: auto;
    min-height: auto;
    padding-inline: 12px;
    padding-bottom: 0;
  }

  .hero-block__title {
    position: absolute;
    top: 410px;
    left: 50%;
    z-index: 1;
    width: 100%;
    max-width: none;
    margin-top: 0;
    padding-inline: 12px;
    transform: translateX(-50%);
  }

  .hero-block__search {
    position: absolute;
    top: 626px;
    left: 50%;
    z-index: 21;
    width: 100%;
    max-width: none;
    margin-top: 0;
    padding-inline: 12px;
    transform: translateX(-50%);
  }
}

@media (--wh-mobile) {
  .hero-block {
    height: auto;
    min-height: 870px;
  }

  .hero-block__inner {
    min-height: auto;
    padding-bottom: 0;
  }

  .hero-block__title {
    position: static;
    top: auto;
    margin-top: 124px;
    max-width: none;
    padding-inline: 12px;
    transform: none;
  }

  .hero-block__search {
    position: static;
    top: auto;
    margin-top: 24px;
    padding-inline: 12px;
    transform: none;
  }
}
</style>
