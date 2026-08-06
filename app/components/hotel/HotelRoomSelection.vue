<script setup lang="ts">
import type { HotelGalleryImage } from '~/types/api'
import type { HotelRoomOption } from '~/types/hotelBooking'
import { formatHotelPriceLabel } from '~/utils/hotel'
import { pluralizeRu } from '~/utils/pluralize'

const props = withDefaults(defineProps<{
  rooms?: HotelRoomOption[]
}>(), {
  rooms: () => [],
})

const emit = defineEmits<{
  'selection-change': [hasSelectedRooms: boolean]
}>()

const quantities = ref<Record<string, number>>({})
const lightboxOpen = ref(false)
const lightboxImages = ref<HotelGalleryImage[]>([])
const lightboxTitle = ref('')

const hasSelectedRooms = computed(() =>
  Object.values(quantities.value).some(quantity => quantity > 0),
)

const selectedRoomsSummary = computed(() => {
  let guests = 0
  let total = 0

  for (const room of props.rooms) {
    const quantity = quantities.value[room.id] ?? 0
    if (quantity <= 0) {
      continue
    }

    guests += room.capacity * quantity
    total += room.price * quantity
  }

  return { guests, total }
})

watch(
  () => props.rooms,
  (rooms) => {
    quantities.value = Object.fromEntries(rooms.map(room => [room.id, 0]))
  },
  { immediate: true },
)

watch(
  hasSelectedRooms,
  (value) => {
    emit('selection-change', value)
  },
  { immediate: true },
)

function openRoomGallery(room: HotelRoomOption) {
  if (!room.gallery.length) {
    return
  }

  lightboxImages.value = room.gallery
  lightboxTitle.value = room.title
  lightboxOpen.value = true
}

function nightsLabel(count: number) {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} ночь`
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return `${count} ночи`
  }

  return `${count} ночей`
}

function quantityOptions(max: number, price: number) {
  return Array.from({ length: max + 1 }, (_, index) => ({
    value: String(index),
    label: String(index),
    ...(index > 0
      ? {
          triggerLabel: pluralizeRu(index, ['номер', 'номера', 'номеров']),
          suffix: formatHotelPriceLabel(price * index),
        }
      : {}),
  }))
}

function quantityValue(roomId: string) {
  return String(quantities.value[roomId] ?? 0)
}

function setQuantity(roomId: string, value: string) {
  quantities.value[roomId] = Number(value) || 0
}

function roomTotalPrice(room: HotelRoomOption) {
  const quantity = quantities.value[room.id] ?? 0
  return quantity > 0 ? room.price * quantity : room.price
}

defineExpose({
  getSelectedRooms: () =>
    Object.entries(quantities.value)
      .filter(([, quantity]) => quantity > 0)
      .map(([roomId, quantity]) => ({
        room_id: Number(roomId),
        number: quantity,
      })),
})
</script>

<template>
  <div class="hotel-room-selection">
    <article
      v-for="room in rooms"
      :key="room.id"
      class="hotel-room-selection__card"
    >
      <button
        type="button"
        class="hotel-room-selection__media"
        :aria-label="`Открыть фото: ${room.title}`"
        :disabled="!room.gallery.length"
        @click="openRoomGallery(room)"
      >
        <img
          v-if="room.image"
          :src="room.image"
          :alt="room.title"
          loading="lazy"
          decoding="async"
        >
        <span
          v-if="room.photosCount > 0"
          class="hotel-room-selection__photos"
        >
          <svg
            class="hotel-room-selection__photos-icon"
            viewBox="0 0 24 24"
            width="14"
            height="14"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2M8.5 13.5l2.5 3.01L14.5 12l4.5 6H5z"
            />
          </svg>
          {{ room.photosCount }}
        </span>
      </button>

      <div class="hotel-room-selection__body">
        <div class="hotel-room-selection__info">
          <h3 class="hotel-room-selection__title">{{ room.title }}</h3>

          <div class="hotel-room-selection__meta">
            <span v-if="room.area" class="hotel-room-selection__badge">
              <svg
                class="hotel-room-selection__badge-icon"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                aria-hidden="true"
              >
                <path
                  d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              {{ room.area }}
            </span>

            <span class="hotel-room-selection__badge">
              <svg
                class="hotel-room-selection__badge-icon"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M16.5 12c1.38 0 2.49-1.12 2.49-2.5S17.88 7 16.5 7 14 8.12 14 9.5s1.12 2.5 2.5 2.5M9 11c1.66 0 2.99-1.34 2.99-3S10.66 5 9 5C7.34 5 6 6.34 6 8s1.34 3 3 3m7.5 3c-1.83 0-5.5.92-5.5 2.75V19h11v-2.25c0-1.83-3.67-2.75-5.5-2.75M9 13c-2.33 0-7 1.17-7 3.5V19h7v-2.25c0-.85.33-2.34 2.37-3.47C10.5 13.1 9.66 13 9 13"
                />
              </svg>
              x{{ room.capacity }}
            </span>
          </div>
        </div>

        <div class="hotel-room-selection__booking">
          <p class="hotel-room-selection__price">
            {{ formatHotelPriceLabel(roomTotalPrice(room)) }} / {{ nightsLabel(room.nights) }}
          </p>

          <div class="hotel-room-selection__quantity">
            <span class="visually-hidden">Количество: {{ room.title }}</span>
            <CommonSelectField
              :model-value="quantityValue(room.id)"
              :options="quantityOptions(room.maxQuantity, room.price)"
              placeholder="0"
              no-margin
              @update:model-value="setQuantity(room.id, $event)"
            />
          </div>
        </div>
      </div>
    </article>

    <div
      v-if="hasSelectedRooms"
      class="hotel-room-selection__summary"
    >
      <div class="hotel-room-selection__summary-item">
        <span class="hotel-room-selection__summary-label">Всего гостей:</span>
        <span class="hotel-room-selection__summary-value">{{ selectedRoomsSummary.guests }}</span>
      </div>
      <div class="hotel-room-selection__summary-item">
        <span class="hotel-room-selection__summary-label">Общая стоимость:</span>
        <span class="hotel-room-selection__summary-price">{{ formatHotelPriceLabel(selectedRoomsSummary.total) }}</span>
      </div>
    </div>

    <HotelGalleryLightbox
      v-model:open="lightboxOpen"
      :images="lightboxImages"
      :title="lightboxTitle"
    />
  </div>
</template>

<style scoped>
.hotel-room-selection {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: min(100%, var(--hotel-booking-blocks-width, 100%));
  margin-inline: auto;
}

.hotel-room-selection__summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  min-height: 72px;
  border: 1px solid var(--wh-field-border);
  border-radius: var(--wh-radius-lg);
  background: var(--wh-white);
  overflow: hidden;
}

.hotel-room-selection__summary-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
  padding: 20px 28px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: -0.03em;
  color: var(--wh-black-text);
}

.hotel-room-selection__summary-item + .hotel-room-selection__summary-item {
  border-left: 1px solid var(--wh-field-border);
}

.hotel-room-selection__summary-label {
  color: var(--wh-black-text);
}

.hotel-room-selection__summary-value {
  font-weight: 600;
}

.hotel-room-selection__summary-price {
  font-weight: 700;
  color: var(--wh-orange-500);
  white-space: nowrap;
}

.hotel-room-selection__card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 20px;
  height: 212px;
  padding: 16px;
  border: 1px solid var(--wh-field-border);
  border-radius: var(--wh-radius-lg);
  background: var(--wh-white);
  box-sizing: border-box;
  overflow: visible;
}

.hotel-room-selection__card:has(.select-field--open) {
  z-index: 4;
}

.hotel-room-selection__media {
  position: relative;
  flex: 0 0 288px;
  width: 288px;
  height: 172px;
  padding: 0;
  border: none;
  border-radius: 12px;
  background: var(--wh-gray-300);
  overflow: hidden;
  cursor: pointer;
}

.hotel-room-selection__media:disabled {
  cursor: default;
}

.hotel-room-selection__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hotel-room-selection__photos {
  position: absolute;
  right: 10px;
  bottom: 10px;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 26px;
  padding: 4px 8px;
  border-radius: 8px;
  background: rgb(0 0 0 / 55%);
  color: #fff;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.02em;
}

.hotel-room-selection__photos-icon {
  display: block;
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  color: #fff;
}

.hotel-room-selection__body {
  display: flex;
  flex: 1;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  min-width: 0;
  height: 172px;
}

.hotel-room-selection__booking {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  flex-shrink: 0;
}

.hotel-room-selection__price {
  margin: 0;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.05em;
  color: var(--wh-black-text);
  white-space: nowrap;
}

.hotel-room-selection__info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.hotel-room-selection__title {
  margin: 0;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: clamp(1.25rem, 2vw, 1.5rem);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.05em;
  color: var(--wh-black-text);
}

.hotel-room-selection__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hotel-room-selection__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 6px 12px;
  border: 1px solid var(--wh-field-border);
  border-radius: 10px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.05em;
  color: var(--wh-black-text);
  white-space: nowrap;
}

.hotel-room-selection__badge-icon {
  display: block;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  color: #1c211c;
}

.hotel-room-selection__quantity {
  position: relative;
  z-index: 1;
  width: 172px;
  flex-shrink: 0;
}

.hotel-room-selection__quantity:focus-within,
.hotel-room-selection__card:has(.select-field--open) .hotel-room-selection__quantity {
  z-index: 5;
}

.hotel-room-selection__quantity :deep(.select-field__trigger) {
  min-height: 46px;
  height: 46px;
  padding: 8px 14px 8px 20px;
  border-radius: var(--wh-radius-lg);
  font-size: 16px;
  font-weight: 500;
  line-height: 1;
}

.hotel-room-selection__quantity :deep(.select-field__list) {
  border-radius: var(--wh-radius-lg);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (--wh-tablet) {
  .hotel-room-selection__summary {
    grid-template-columns: 1fr;
  }

  .hotel-room-selection__summary-item + .hotel-room-selection__summary-item {
    border-left: none;
    border-top: 1px solid var(--wh-field-border);
  }

  .hotel-room-selection__card {
     gap: 16px;
    height: auto;
    min-height: 212px;
  }

  .hotel-room-selection__media {
    flex: 0 0 min(240px, 38%);
    width: min(240px, 38%);
    height: auto;
    aspect-ratio: 288 / 172;
  }

  .hotel-room-selection__body {
    flex: 1;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    height: auto;
    min-height: 0;
  }

  .hotel-room-selection__booking {
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
  }

  .hotel-room-selection__quantity {
    width: 172px;
    max-width: none;
    margin-inline: 0;
  }

  .hotel-room-selection__quantity :deep(.select-field__list) {
    top: auto;
    bottom: calc(100% + 4px);
  }
}

@media (--wh-mobile) {
  .hotel-room-selection__card {
    flex-direction: column;
    gap: 16px;
  }

  .hotel-room-selection__media {
    flex: none;
    width: 100%;
    max-width: none;
    height: auto;
    aspect-ratio: 288 / 172;
  }

  .hotel-room-selection__body {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    width: 100%;
  }

  .hotel-room-selection__booking {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .hotel-room-selection__quantity {
    width: 100%;
    max-width: 172px;
    margin-inline: auto;
  }
}
</style>
