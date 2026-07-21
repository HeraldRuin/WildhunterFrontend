<script setup lang="ts">
import type { OfferItem } from '~/types/api'

const props = defineProps<{
  items?: OfferItem[]
}>()

const defaultItems: OfferItem[] = [
  {
    id: 1,
    object_model: 'tour',
    title: 'Хромой кабан-2',
    location: 'Ярославская область',
    price: 4000,
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
    reviews: 32,
    rating: 4.9,
  },
  {
    id: 2,
    object_model: 'tour',
    title: 'Хромой кабан-2',
    location: 'Ярославская область',
    price: 4000,
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
    reviews: 32,
    rating: 4.9,
  },
  {
    id: 3,
    object_model: 'tour',
    title: 'Хромой кабан-2',
    location: 'Ярославская область',
    price: 4000,
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
    reviews: 32,
    rating: 4.9,
  },
  {
    id: 4,
    object_model: 'tour',
    title: 'Хромой кабан-2',
    location: 'Ярославская область',
    price: 4000,
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
    reviews: 32,
    rating: 4.9,
  },
  {
    id: 5,
    object_model: 'tour',
    title: 'Хромой кабан-2',
    location: 'Ярославская область',
    price: 4000,
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
    reviews: 32,
    rating: 4.9,
  },
]

const offers = computed(() => props.items?.length ? props.items : defaultItems)
const trackRef = ref<HTMLElement | null>(null)

function scrollBy(direction: 'prev' | 'next') {
  const track = trackRef.value
  if (!track) return
  const offset = track.clientWidth * 0.8 * (direction === 'next' ? 1 : -1)
  track.scrollBy({ left: offset, behavior: 'smooth' })
}
</script>

<template>
  <section class="best-offers">
    <div class="container best-offers__inner">
      <h2 class="best-offers__title">Лучшие предложения сейчас</h2>

      <div class="best-offers__slider-wrap">
        <button
          type="button"
          class="best-offers__arrow best-offers__arrow--prev"
          aria-label="Предыдущие предложения"
          @click="scrollBy('prev')"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>

        <div ref="trackRef" class="best-offers__track">
          <HomeOfferCard
            v-for="(item, index) in offers"
            :key="`${item.id}-${index}`"
            :item="item"
            class="best-offers__slide"
          />
        </div>

        <button
          type="button"
          class="best-offers__arrow best-offers__arrow--next"
          aria-label="Следующие предложения"
          @click="scrollBy('next')"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
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
  grid-template-columns: 48px minmax(0, 1fr) 48px;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.best-offers__track {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: calc((100% - 60px) / 4);
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
  scroll-snap-align: start;
  min-width: 0;
}

.best-offers__arrow {
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

.best-offers__arrow:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 28px rgba(17, 24, 39, 0.12);
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
    grid-template-columns: 40px minmax(0, 1fr) 40px;
    gap: 12px;
  }

  .best-offers__arrow {
    width: 40px;
    height: 40px;
  }

  .best-offers__track {
    grid-auto-columns: calc((100% - 20px) / 2);
  }
}

@media (max-width: 640px) {
  .best-offers__track {
    grid-auto-columns: 100%;
  }
}
</style>
