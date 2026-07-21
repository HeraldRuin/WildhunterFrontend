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
        <CommonSliderArrow
          direction="prev"
          label="Предыдущие предложения"
          @click="scrollBy('prev')"
        />

        <div ref="trackRef" class="best-offers__track">
          <HomeOfferCard
            v-for="(item, index) in offers"
            :key="`${item.id}-${index}`"
            :item="item"
            class="best-offers__slide"
          />
        </div>

        <CommonSliderArrow
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

.best-offers__action {
  display: flex;
  justify-content: center;
}

.best-offers__button {
  min-width: 180px;
}

@media (max-width: 1024px) {
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
