<script setup lang="ts">
import type { ReviewItem } from '~/types/api'

const props = defineProps<{
  items?: ReviewItem[]
}>()

const reviews = computed(() => props.items ?? [])
const trackRef = ref<HTMLElement | null>(null)
const { canScrollPrev, canScrollNext } = useSliderScrollState(trackRef, reviews)

function getCardWidth(track: HTMLElement) {
  const slide = track.querySelector('.reviews-block__slide') as HTMLElement | null
  return slide?.offsetWidth || 0
}

function getTrackGap(track: HTMLElement) {
  const styles = getComputedStyle(track)
  return Number.parseFloat(styles.columnGap || styles.gap) || 20
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
  <section class="reviews-block">
    <div class="container reviews-block__inner">
      <h2 class="reviews-block__title">Отзывы</h2>

      <div class="reviews-block__slider-wrap">
        <CommonSliderArrow
          class="reviews-block__arrow"
          direction="prev"
          label="Предыдущие отзывы"
          :disabled="!canScrollPrev"
          @click="scrollBy('prev')"
        />

        <div ref="trackRef" class="reviews-block__track">
          <HomeReviewCard
            v-for="item in reviews"
            :key="item.id"
            :item="item"
            class="reviews-block__slide"
          />
        </div>

        <CommonSliderArrow
          class="reviews-block__arrow"
          direction="next"
          label="Следующие отзывы"
          :disabled="!canScrollNext"
          @click="scrollBy('next')"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.reviews-block {
  padding-block: 72px 88px;
  background: var(--wh-white);
}

.reviews-block__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
}

.reviews-block__title {
  margin: 0;
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-align: center;
  color: var(--wh-gray-900);
}

.reviews-block__slider-wrap {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) 30px;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.reviews-block__track {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: calc((100% - 40px) / 3);
  gap: 20px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  min-width: 0;
}

.reviews-block__track::-webkit-scrollbar {
  display: none;
}

.reviews-block__slide {
  scroll-snap-align: start;
  min-width: 0;
}

@media (max-width: 1024px) {
  .reviews-block__slider-wrap {
    grid-template-columns: minmax(0, 1fr);
  }

  .reviews-block__arrow {
    display: none;
  }

  .reviews-block__track {
    grid-auto-columns: calc((100% - 20px) / 2);
  }
}

@media (max-width: 640px) {
  .reviews-block__track {
    grid-auto-columns: 100%;
  }
}
</style>
