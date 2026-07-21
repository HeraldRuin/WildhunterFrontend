<script setup lang="ts">
import type { LocationItem } from '~/types/api'

const props = defineProps<{
  items?: LocationItem[]
}>()

const defaultItems: LocationItem[] = [
  {
    id: 1,
    title: 'Тверская область',
    bases_count: 3,
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800',
  },
  {
    id: 2,
    title: 'Ярославская область',
    bases_count: 3,
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
  },
  {
    id: 3,
    title: 'Московская область',
    bases_count: 3,
    image: 'https://images.unsplash.com/photo-1511497584788-876760111969?w=800',
  },
  {
    id: 4,
    title: 'Вологодская область',
    bases_count: 5,
    image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
  },
  {
    id: 5,
    title: 'Карелия',
    bases_count: 8,
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
  },
]

const locations = computed(() => props.items?.length ? props.items : defaultItems)
const trackRef = ref<HTMLElement | null>(null)

function scrollBy(direction: 'prev' | 'next') {
  const track = trackRef.value
  if (!track) return
  const offset = track.clientWidth * 0.8 * (direction === 'next' ? 1 : -1)
  track.scrollBy({ left: offset, behavior: 'smooth' })
}
</script>

<template>
  <section class="best-locations">
    <div class="container best-locations__inner">
      <h2 class="best-locations__title">Лучшие локации</h2>

      <div class="best-locations__slider-wrap">
        <button
          type="button"
          class="best-locations__arrow best-locations__arrow--prev"
          aria-label="Предыдущие локации"
          @click="scrollBy('prev')"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>

        <div ref="trackRef" class="best-locations__track">
          <HomeLocationCard
            v-for="(item, index) in locations"
            :key="`${item.id}-${index}`"
            :item="item"
            class="best-locations__slide"
          />
        </div>

        <button
          type="button"
          class="best-locations__arrow best-locations__arrow--next"
          aria-label="Следующие локации"
          @click="scrollBy('next')"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <div class="best-locations__action">
        <NuxtLink to="/regions" class="btn btn--primary best-locations__button">
          Смотреть все
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.best-locations {
  padding-block: 72px 80px;
  background: var(--wh-white);
}

.best-locations__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
}

.best-locations__title {
  margin: 0;
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-align: center;
  color: var(--wh-gray-900);
}

.best-locations__slider-wrap {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) 48px;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.best-locations__track {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: calc((100% - 40px) / 3);
  gap: 20px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  min-width: 0;
}

.best-locations__track::-webkit-scrollbar {
  display: none;
}

.best-locations__slide {
  scroll-snap-align: start;
  min-width: 0;
}

.best-locations__arrow {
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

.best-locations__arrow:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 28px rgba(17, 24, 39, 0.12);
}

.best-locations__action {
  display: flex;
  justify-content: center;
}

.best-locations__button {
  min-width: 180px;
}

@media (max-width: 1024px) {
  .best-locations__slider-wrap {
    grid-template-columns: 40px minmax(0, 1fr) 40px;
    gap: 12px;
  }

  .best-locations__arrow {
    width: 40px;
    height: 40px;
  }

  .best-locations__track {
    grid-auto-columns: calc((100% - 20px) / 2);
  }
}

@media (max-width: 640px) {
  .best-locations__track {
    grid-auto-columns: 100%;
  }
}
</style>
