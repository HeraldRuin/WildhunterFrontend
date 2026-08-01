<script setup lang="ts">
import type { MapHotelItem } from '~/utils/map'

const props = defineProps<{
  item: MapHotelItem
  active?: boolean
  compact?: boolean
}>()

const emit = defineEmits<{
  select: [id: number]
}>()

function formatPrice(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value)
}

function formatRating(value: number) {
  return value.toFixed(1).replace('.', ',')
}
</script>

<template>
  <button
    type="button"
    class="map-hotel-card"
    :class="{
      'map-hotel-card--active': active,
      'map-hotel-card--compact': compact,
    }"
    @click="emit('select', props.item.id)"
  >
    <div class="map-hotel-card__media">
      <img
        :src="item.image"
        :alt="item.title"
        loading="lazy"
        decoding="async"
      >
    </div>

    <div class="map-hotel-card__body">
      <div class="map-hotel-card__row">
        <h3 class="map-hotel-card__title">
          {{ item.title }}
        </h3>
        <p class="map-hotel-card__price">
          {{ formatPrice(item.price) }} ₽
        </p>
      </div>
      <p class="map-hotel-card__location">
        {{ item.location }}
      </p>
      <p
        v-if="item.rating > 0"
        class="map-hotel-card__rating"
      >
        <span class="map-hotel-card__star">★</span>
        {{ formatRating(item.rating) }}
      </p>
    </div>
  </button>
</template>

<style scoped>
.map-hotel-card {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 12px;
  width: 100%;
  padding: 11px;
  border: 1px solid var(--wh-field-border);
  border-radius: 12px;
  background: var(--wh-white);
  text-align: left;
  cursor: pointer;
  will-change: grid-template-columns, gap, padding;
  transition:
    border-color 0.15s ease,
    grid-template-columns 0.75s cubic-bezier(0.16, 1, 0.3, 1),
    gap 0.65s cubic-bezier(0.16, 1, 0.3, 1),
    padding 0.65s cubic-bezier(0.16, 1, 0.3, 1);
}

.map-hotel-card:hover:not(.map-hotel-card--active) {
  border-color: var(--wh-field-border-active);
}

.map-hotel-card--active,
.map-hotel-card--active:hover {
  border-color: #e8883a;
}

.map-hotel-card--compact {
  grid-template-columns: 1fr;
  gap: 8px;
  padding: 8px;
}

.map-hotel-card__media {
  overflow: hidden;
  width: 96px;
  height: 96px;
  border-radius: 8px;
  background: var(--wh-gray-100, #f5f5f5);
  transition:
    width 0.7s cubic-bezier(0.16, 1, 0.3, 1),
    height 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}

.map-hotel-card--compact .map-hotel-card__media {
  width: 100%;
  height: auto;
  aspect-ratio: 1 / 1;
}

.map-hotel-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.map-hotel-card__body {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
  justify-content: center;
}

.map-hotel-card__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.map-hotel-card__title {
  margin: 0;
  min-width: 0;
  flex: 1 1 auto;
  font-family: "Inter", sans-serif;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.25;
  color: var(--wh-gray-900);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: font-size 0.55s cubic-bezier(0.16, 1, 0.3, 1);
}

.map-hotel-card--compact .map-hotel-card__title {
  font-size: 13px;
}

.map-hotel-card__price {
  margin: 0;
  flex-shrink: 0;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--wh-gray-900);
  white-space: nowrap;
  transition: font-size 0.55s cubic-bezier(0.16, 1, 0.3, 1);
}

.map-hotel-card--compact .map-hotel-card__price {
  font-size: 12px;
}

.map-hotel-card__location {
  margin: 0;
  font-family: "Inter", sans-serif;
  font-size: 13px;
  line-height: 1.3;
  color: var(--wh-gray-600, #6b7280);
  transition: font-size 0.55s cubic-bezier(0.16, 1, 0.3, 1);
}

.map-hotel-card--compact .map-hotel-card__location,
.map-hotel-card--compact .map-hotel-card__rating {
  font-size: 12px;
}

.map-hotel-card__rating {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 2px 0 0;
  font-family: "Inter", sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: var(--wh-gray-900);
  transition: font-size 0.55s cubic-bezier(0.16, 1, 0.3, 1);
}

.map-hotel-card__star {
  color: #e8b84a;
}
</style>
