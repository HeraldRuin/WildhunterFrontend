<script setup lang="ts">
import type { LocationItem } from '~/types/api'

const props = defineProps<{
  items?: LocationItem[]
}>()

const locations = computed(() => props.items ?? [])
const trackRef = ref<HTMLElement | null>(null)
const { canScrollPrev, canScrollNext } = useSliderScrollState(trackRef, locations)

function getCardWidth(track: HTMLElement) {
  const slide = track.querySelector('.best-locations__slide') as HTMLElement | null
  return slide?.offsetWidth || 0
}

function getTrackGap(track: HTMLElement) {
  const styles = getComputedStyle(track)
  return Number.parseFloat(styles.columnGap || styles.gap) || 16
}

function scrollBy(direction: 'prev' | 'next') {
  if (direction === 'prev' && !canScrollPrev.value) return
  if (direction === 'next' && !canScrollNext.value) return

  const track = trackRef.value
  if (!track) return

  const cardWidth = getCardWidth(track)
  if (!cardWidth) return

  const offset = (cardWidth + getTrackGap(track)) * (direction === 'next' ? 1 : -1)
  track.scrollBy({ left: offset, behavior: 'smooth' })
}
</script>

<template>
  <section class="best-locations">
    <div class="container best-locations__inner">
      <h2 class="best-locations__title">Лучшие локации</h2>

      <div class="best-locations__slider-wrap">
        <CommonSliderArrow
          class="best-locations__arrow"
          direction="prev"
          label="Предыдущие локации"
          :disabled="!canScrollPrev"
          @click="scrollBy('prev')"
        />

        <div ref="trackRef" class="best-locations__track">
          <HomeLocationCard
            v-for="(item, index) in locations"
            :key="`${item.id}-${index}`"
            :item="item"
            class="best-locations__slide"
          />
        </div>

        <CommonSliderArrow
          class="best-locations__arrow"
          direction="next"
          label="Следующие локации"
          :disabled="!canScrollNext"
          @click="scrollBy('next')"
        />
      </div>

      <div class="best-locations__action">
        <NuxtLink to="/locations" class="btn btn--primary best-locations__button">
          Смотреть все
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.best-locations {
  padding-block: 48px 56px;
  background: var(--wh-white);
}

.best-locations__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
}

@media (--wh-desktop) {
  .best-locations__inner.container {

    width: min(100% - 32px, 1292px);
  }
}

.best-locations__title {
  margin: 0;
  font-family: UNCAGE;
  font-weight: 400;
  font-style: normal;
  font-size: 44px;
  line-height: 110%;
  letter-spacing: -2.2px;
  text-transform: uppercase;
  text-align: center;
  color: var(--wh-gray-900);
}

.best-locations__slider-wrap {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) 30px;
  align-items: center;
  gap: 16px;
  width: 131%;
  max-width: calc(100vw - 32px);
}

.best-locations__track {
  --best-locations-card-width: 389px;
  --best-locations-card-height: 389px;

  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: var(--best-locations-card-width);
  gap: 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  min-width: 0;
}

.best-locations__track::-webkit-scrollbar {
  display: none;
}

.best-locations__slide {
  width: var(--best-locations-card-width);
  height: var(--best-locations-card-height);
  aspect-ratio: auto;
  flex-shrink: 0;
  scroll-snap-align: start;
}

.best-locations__slide :deep(.location-card) {
  width: 100%;
  height: var(--best-locations-card-height);
  aspect-ratio: auto;
}

.best-locations__action {
  display: flex;
  justify-content: center;
}

.best-locations__button {
  min-width: 180px;
  border-radius: var(--wh-radius-lg);
}

@media (--wh-tablet) {
  .best-locations__slider-wrap {
    grid-template-columns: minmax(0, 1fr);
    width: 100%;
  }

  .best-locations__arrow {
    display: none;
  }

  .best-locations__track {
    --best-locations-card-width: 237px;
    --best-locations-card-height: 237px;
    gap: 8px;
    grid-auto-columns: var(--best-locations-card-width);
  }

  .best-locations__slide {
    width: var(--best-locations-card-width);
    flex-shrink: 0;
  }

  .best-locations__slide :deep(.location-card) {
    height: var(--best-locations-card-height);
    aspect-ratio: auto;
  }
}

@media (--wh-mobile) {
  .best-locations__track {
    --best-locations-card-width: 325px;
    --best-locations-card-height: 345px;
    gap: 10px;
    grid-auto-columns: var(--best-locations-card-width);
  }

  .best-locations__slide {
    width: var(--best-locations-card-width);
    flex-shrink: 0;
  }

  .best-locations__slide :deep(.location-card) {
    height: var(--best-locations-card-height);
    aspect-ratio: auto;
  }
}
</style>
