<script setup lang="ts">
import type { OfferItem } from '~/types/api'

const props = defineProps<{
  items?: OfferItem[]
}>()

const offers = computed(() => props.items ?? [])
const trackRef = ref<HTMLElement | null>(null)

const CARD_WIDTH = 288
const CARD_GAP = 20

function scrollBy(direction: 'prev' | 'next') {
  const track = trackRef.value
  if (!track) return
  const offset = (CARD_WIDTH + CARD_GAP) * (direction === 'next' ? 1 : -1)
  track.scrollBy({ left: offset, behavior: 'smooth' })
}
</script>

<template>
  <section v-if="offers.length" class="best-offers">
    <div class="container best-offers__inner">
      <h2 class="best-offers__title">Лучшие предложения сейчас</h2>

      <div class="best-offers__slider-wrap">
        <CommonSliderArrow
          class="best-offers__arrow"
          direction="prev"
          label="Предыдущие предложения"
          @click="scrollBy('prev')"
        />

        <div ref="trackRef" class="best-offers__track">
          <HomeOfferCard
            v-for="item in offers"
            :key="item.id"
            :item="item"
            class="best-offers__slide"
          />
        </div>

        <CommonSliderArrow
          class="best-offers__arrow"
          direction="next"
          label="Следующие предложения"
          @click="scrollBy('next')"
        />
      </div>

      <div class="best-offers__action">
        <NuxtLink to="/bases" class="btn btn--primary best-offers__button">
          Смотреть все
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.best-offers {
  padding-block: 72px 80px;
  background: var(--wh-white);
}

.best-offers__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
}

.best-offers__title {
  margin: 0;
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-align: center;
  color: var(--wh-gray-900);
}

.best-offers__slider-wrap {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) 30px;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.best-offers__track {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 288px;
  gap: 20px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  min-width: 0;
}

.best-offers__track::-webkit-scrollbar {
  display: none;
}

.best-offers__slide {
  width: 288px;
  flex-shrink: 0;
  scroll-snap-align: start;
}

.best-offers__slide :deep(.offer-card__media) {
  width: 100%;
  height: 300px;
  aspect-ratio: auto;
}

.best-offers__action {
  display: flex;
  justify-content: center;
}

.best-offers__button {
  min-width: 180px;
}

@media (max-width: 1024px) {
  .best-offers__slider-wrap {
    grid-template-columns: minmax(0, 1fr);
  }

  .best-offers__arrow {
    display: none;
  }
}
</style>
