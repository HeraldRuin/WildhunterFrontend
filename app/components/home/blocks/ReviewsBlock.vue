<script setup lang="ts">
import type { ReviewItem } from '~/types/api'

const props = defineProps<{
  items?: ReviewItem[]
}>()

const reviews = computed(() => props.items ?? [])
const trackRef = ref<HTMLElement | null>(null)

function scrollBy(direction: 'prev' | 'next') {
  const track = trackRef.value
  if (!track) return
  const offset = track.clientWidth * 0.8 * (direction === 'next' ? 1 : -1)
  track.scrollBy({ left: offset, behavior: 'smooth' })
}
</script>

<template>
  <section class="reviews-block">
    <div class="container reviews-block__inner">
      <h2 class="reviews-block__title">Отзывы</h2>

      <div class="reviews-block__slider-wrap">
        <button
          type="button"
          class="reviews-block__arrow reviews-block__arrow--prev"
          aria-label="Предыдущие отзывы"
          @click="scrollBy('prev')"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>

        <div ref="trackRef" class="reviews-block__track">
          <HomeReviewCard
            v-for="item in reviews"
            :key="item.id"
            :item="item"
            class="reviews-block__slide"
          />
        </div>

        <button
          type="button"
          class="reviews-block__arrow reviews-block__arrow--next"
          aria-label="Следующие отзывы"
          @click="scrollBy('next')"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
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
  grid-template-columns: 48px minmax(0, 1fr) 48px;
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

.reviews-block__arrow {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  padding: 0;
  border: 1px solid var(--wh-gray-200);
  border-radius: 999px;
  background: var(--wh-white);
  box-shadow: 0 8px 24px rgba(17, 24, 39, 0.08);
  color: var(--wh-gray-900);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.reviews-block__arrow:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 28px rgba(17, 24, 39, 0.12);
}

@media (max-width: 1024px) {
  .reviews-block__slider-wrap {
    grid-template-columns: 40px minmax(0, 1fr) 40px;
    gap: 12px;
  }

  .reviews-block__arrow {
    width: 40px;
    height: 40px;
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
