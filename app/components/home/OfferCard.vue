<script setup lang="ts">
import type { OfferItem } from '~/types/api'

defineProps<{
  item: OfferItem
}>()

function formatPrice(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value)
}
</script>

<template>
  <NuxtLink :to="`/${item.object_model}/${item.id}`" class="offer-card">
    <div class="offer-card__media">
      <img :src="item.image" :alt="item.title" loading="lazy">
      <button type="button" class="offer-card__favorite" aria-label="В избранное" @click.prevent>
        <svg width="16" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 20.25s-7.5-4.35-7.5-10.05c0-2.85 2.25-5.1 5.1-5.1 1.58 0 3.08.75 4.05 1.95.97-1.2 2.47-1.95 4.05-1.95 2.85 0 5.1 2.25 5.1 5.1 0 5.7-7.5 10.05-7.5 10.05z"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <div class="offer-card__rating">
        <span class="offer-card__reviews">{{ item.reviews }} отзыва</span>
        <span class="offer-card__star">★</span>
        <span class="offer-card__score">{{ item.rating.toFixed(1).replace('.', ',') }}</span>
      </div>
    </div>

    <div class="offer-card__body">
      <div class="offer-card__row">
        <h3 class="offer-card__title">{{ item.title }}</h3>
        <p class="offer-card__price">{{ formatPrice(item.price) }} ₽ / ночь</p>
      </div>
      <p class="offer-card__location">{{ item.location }}</p>
    </div>
  </NuxtLink>
</template>

<style scoped>
.offer-card {
  display: block;
  color: inherit;
}

.offer-card__media {
  position: relative;
  overflow: hidden;
  aspect-ratio: 1 / 1;
  border-radius: 18px;
  background: var(--wh-gray-100);
}

.offer-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.offer-card:hover .offer-card__media img {
  transform: scale(1.03);
}

.offer-card__favorite {
  position: absolute;
  top: 14px;
  right: 14px;
  display: grid;
  place-items: center;
  width: 16px;
  height: 18px;
  padding: 0;
  border: none;
  background: transparent;
  color: #ffffff;
  cursor: pointer;
}

.offer-card__favorite svg {
  display: block;
  width: 16px;
  height: 18px;
}

.offer-card__rating {
  position: absolute;
  right: 14px;
  bottom: 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
}

.offer-card__reviews {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: -0.05em;
  color: rgb(255 255 255 / 80%);
}

.offer-card__star {
  color: #f2c100;
  font-size: 0.875rem;
}

.offer-card__score {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.3;
  letter-spacing: -0.05em;
  color: #ffffff;
}

.offer-card__body {
  padding-top: 14px;
}

.offer-card__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.offer-card__title {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.35;
  font-weight: 700;
  color: var(--wh-gray-900);
}

.offer-card__price {
  margin: 0;
  flex-shrink: 0;
  font-size: 0.98rem;
  font-weight: 600;
  color: var(--wh-gray-900);
  white-space: nowrap;
}

.offer-card__location {
  margin: 6px 0 0;
  color: var(--wh-gray-500);
  font-size: 0.92rem;
}
</style>
