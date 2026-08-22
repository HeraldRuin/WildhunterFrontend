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
  padding-block: 48px 64px;
  background: var(--wh-white);
  overflow-x: clip;
}

.reviews-block__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
}

.reviews-block__title {
  margin: 0;
  font-family: UNCAGE;
  font-weight: 400;
  font-style: normal;
  font-size: 44px;
  line-height: 110%;
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

@media (min-width: 1724px) {
  .reviews-block__slider-wrap {
    width: 139%;
  }
}

.reviews-block__track {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 388px;
  gap: 20px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  min-width: 0;
  align-items: start;
}

.reviews-block__track::-webkit-scrollbar {
  display: none;
}

.reviews-block__slide {
  width: 388px;
  height: 277px;
  scroll-snap-align: start;
  min-width: 0;
}

@media (--wh-tablet) {
  .reviews-block__slider-wrap {
    grid-template-columns: minmax(0, 1fr);
    width: 100vw;
    max-width: 100vw;
    margin-inline: calc(50% - 50vw);
    padding-inline: 16px;
    box-sizing: border-box;
  }

  .reviews-block__arrow {
    display: none;
  }

  .reviews-block__track {
    grid-auto-columns: calc((100% - 20px) / 2);
    scroll-padding-inline: 16px;
  }

  .reviews-block__slide {
    width: 100%;
  }
}

@media (--wh-mobile) {
  .reviews-block__track {
    grid-auto-columns: 100%;
  }
}
</style>
