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
    <div class="hero-block__search">
      <h1 class="hero-block__heading">Организуйте охоту с понятными расходами для каждого</h1>
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
  z-index: 30;
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

.hero-block__search {
  position: absolute;
  top: 392px;
  left: 50%;
  z-index: 21;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 1500px;
  max-width: calc(100% - 24px);
  transform: translateX(-50%);
}

.hero-block__heading {
  width: 100%;
  margin: 0 0 28px;
  text-align: center;
  color: var(--wh-white);
  font-size: 48px;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45), 0 4px 18px rgba(0, 0, 0, 0.35);
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

  .hero-block__search {
    position: absolute;
    top: 470px;
    left: 50%;
    z-index: 21;
    width: 100%;
    max-width: none;
    margin-top: 0;
    padding-inline: 12px;
    transform: translateX(-50%);
  }

  .hero-block__heading {
    margin-bottom: 28px;
    font-size: 32px;
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

  .hero-block__search {
    position: static;
    top: auto;
    margin-top: 48px;
    padding-inline: 12px;
    transform: none;
  }

  .hero-block__heading {
    margin-bottom: 20px;
    font-size: 26px;
  }
}
</style>
