<script setup lang="ts">
import type { MapHotelItem } from '~/utils/map'

const props = defineProps<{
  item: MapHotelItem
  active?: boolean
  compact?: boolean
  imageOnly?: boolean
}>()

const emit = defineEmits<{
  select: [id: number]
}>()

const tipVisible = ref(false)
const tipStyle = ref<Record<string, string>>({})

function formatPrice(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value)
}

function formatRating(value: number) {
  return value.toFixed(1).replace('.', ',')
}

const imageOnlyLabel = computed(() => {
  const parts = [
    props.item.title,
    `${formatPrice(props.item.price)} ₽`,
    props.item.location,
  ]

  if (props.item.rating > 0) {
    parts.push(`★ ${formatRating(props.item.rating)}`)
  }

  return parts.filter(Boolean).join(', ')
})

function showTip(event: Event) {
  if (!props.imageOnly) {
    return
  }

  const target = event.currentTarget as HTMLElement | null
  if (!target) {
    return
  }

  const rect = target.getBoundingClientRect()
  tipStyle.value = {
    left: `${Math.round(rect.right + 8)}px`,
    top: `${Math.round(rect.top + rect.height / 2)}px`,
  }
  tipVisible.value = true
}

function hideTip() {
  tipVisible.value = false
}
</script>

<template>
  <button
    type="button"
    class="map-hotel-card"
    :class="{
      'map-hotel-card--active': active,
      'map-hotel-card--compact': compact && !imageOnly,
      'map-hotel-card--image-only': imageOnly,
      'map-hotel-card--image-only-compact': imageOnly && compact,
    }"
    :aria-label="imageOnly ? imageOnlyLabel : undefined"
    @click="emit('select', props.item.id)"
    @mouseenter="showTip"
    @mouseleave="hideTip"
    @focus="showTip"
    @blur="hideTip"
  >
    <div class="map-hotel-card__media">
      <img
        :src="item.image"
        :alt="item.title"
        loading="lazy"
        decoding="async"
      >
    </div>

    <div
      class="map-hotel-card__body"
      :aria-hidden="imageOnly ? 'true' : undefined"
    >
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

  <Teleport to="body">
    <div
      v-if="imageOnly && tipVisible"
      class="map-hotel-card-tip"
      :style="tipStyle"
      aria-hidden="true"
    >
      <div class="map-hotel-card-tip__row">
        <p class="map-hotel-card-tip__title">
          {{ item.title }}
        </p>
        <p class="map-hotel-card-tip__price">
          {{ formatPrice(item.price) }} ₽
        </p>
      </div>
      <p class="map-hotel-card-tip__location">
        {{ item.location }}
      </p>
      <p
        v-if="item.rating > 0"
        class="map-hotel-card-tip__rating"
      >
        <span class="map-hotel-card-tip__star">★</span>
        {{ formatRating(item.rating) }}
      </p>
    </div>
  </Teleport>
</template>

<style scoped>
.map-hotel-card {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  grid-template-rows: 96px;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 122px;
  height: auto;
  padding: 11px;
  border: 1px solid var(--wh-field-border);
  border-radius: 12px;
  background: var(--wh-white);
  text-align: left;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  transition:
    border-color 0.15s ease,
    grid-template-columns 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    grid-template-rows 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    gap 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    padding 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    min-height 0.35s cubic-bezier(0.22, 1, 0.36, 1);
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
  grid-template-rows: auto auto;
  align-items: stretch;
  align-self: start;
  gap: 8px;
  min-height: min-content;
  padding: 8px;
}

/*
 * Snap card width immediately; animate only the media 96px → 120px.
 * Animating card width while media is 100% made the photo briefly fill the wide sidebar.
 */
.map-hotel-card--image-only {
  position: relative;
  grid-template-columns: 120px;
  grid-template-rows: 120px;
  align-items: stretch;
  gap: 0;
  width: 120px;
  min-height: 120px;
  max-width: 100%;
  padding: 0;
  overflow: hidden;
}

.map-hotel-card__media {
  overflow: hidden;
  width: 96px;
  height: 96px;
  min-width: 96px;
  min-height: 96px;
  border-radius: 8px;
  background: var(--wh-gray-100, #f5f5f5);
  transition:
    width 0.4s cubic-bezier(0.22, 1, 0.36, 1),
    height 0.4s cubic-bezier(0.22, 1, 0.36, 1),
    min-width 0.4s cubic-bezier(0.22, 1, 0.36, 1),
    min-height 0.4s cubic-bezier(0.22, 1, 0.36, 1),
    border-radius 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.map-hotel-card--compact .map-hotel-card__media {
  width: 100%;
  height: auto;
  min-width: 0;
  min-height: auto;
  aspect-ratio: 1 / 1;
}

.map-hotel-card--image-only .map-hotel-card__media {
  width: 120px;
  height: 120px;
  min-width: 120px;
  min-height: 120px;
  border-radius: 12px;
}

/* Collapsed sidebar + compact mode: fill half-width grid cell (~56px). */
.map-hotel-card--image-only-compact {
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto;
  width: 100%;
  min-height: 0;
  aspect-ratio: 1 / 1;
}

.map-hotel-card--image-only-compact .map-hotel-card__media {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  border-radius: 8px;
}

.map-hotel-card__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}

.map-hotel-card__body {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
  justify-content: center;
}

.map-hotel-card--image-only .map-hotel-card__body {
  display: none;
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
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
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

<!-- Teleported tip is outside the component root subtree for positioning; unscoped block. -->
<style>
.map-hotel-card-tip {
  position: fixed;
  z-index: 40;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 180px;
  max-width: 260px;
  padding: 10px 12px;
  border: 1px solid var(--wh-field-border, #dddddd);
  border-radius: 12px;
  background: var(--wh-white, #fff);
  box-shadow: 0 8px 24px rgb(0 0 0 / 14%);
  transform: translateY(-50%);
  pointer-events: none;
  text-align: left;
}

.map-hotel-card-tip__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.map-hotel-card-tip__title {
  margin: 0;
  min-width: 0;
  flex: 1 1 auto;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.25;
  color: var(--wh-gray-900, #1c211c);
}

.map-hotel-card-tip__price {
  margin: 0;
  flex-shrink: 0;
  font-family: "Inter", sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: var(--wh-gray-900, #1c211c);
  white-space: nowrap;
}

.map-hotel-card-tip__location {
  margin: 0;
  font-family: "Inter", sans-serif;
  font-size: 12px;
  line-height: 1.3;
  color: var(--wh-gray-600, #6b7280);
}

.map-hotel-card-tip__rating {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  font-family: "Inter", sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: var(--wh-gray-900, #1c211c);
}

.map-hotel-card-tip__star {
  color: #e8b84a;
}
</style>
