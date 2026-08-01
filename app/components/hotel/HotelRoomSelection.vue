<script setup lang="ts">
import { formatHotelPrice } from '~/utils/hotel'

interface HotelRoomOption {
  id: string
  title: string
  area: string
  capacity: number
  price: number
  nights: number
  image?: string
  maxQuantity: number
}

const MOCK_ROOMS: HotelRoomOption[] = [
  {
    id: 'quad',
    title: '4-х местный',
    area: '70 кв. футов',
    capacity: 4,
    price: 4000,
    nights: 1,
    maxQuantity: 5,
  },
]

const rooms = MOCK_ROOMS

const quantities = ref<Record<string, number>>(
  Object.fromEntries(rooms.map(room => [room.id, 0])),
)

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

function quantityOptions(max: number) {
  return Array.from({ length: max + 1 }, (_, index) => index)
}
</script>

<template>
  <div class="hotel-room-selection">
    <article
      v-for="room in rooms"
      :key="room.id"
      class="hotel-room-selection__card"
    >
      <div class="hotel-room-selection__media">
        <img
          v-if="room.image"
          :src="room.image"
          :alt="room.title"
          loading="lazy"
          decoding="async"
        >
      </div>

      <div class="hotel-room-selection__body">
        <div class="hotel-room-selection__info">
          <h3 class="hotel-room-selection__title">{{ room.title }}</h3>

          <div class="hotel-room-selection__meta">
            <span class="hotel-room-selection__badge">
              <img
                class="hotel-room-selection__badge-icon"
                src="/icons/wordpress_square.png"
                alt=""
                width="16"
                height="16"
                aria-hidden="true"
              >
              {{ room.area }}
            </span>

            <span class="hotel-room-selection__badge">
              <img
                class="hotel-room-selection__badge-icon"
                src="/icons/mdi_people.png"
                alt=""
                width="16"
                height="16"
                aria-hidden="true"
              >
              x{{ room.capacity }}
            </span>
          </div>
        </div>

        <div class="hotel-room-selection__booking">
          <p class="hotel-room-selection__price">
            {{ formatHotelPrice(room.price) }} ₽ / {{ nightsLabel(room.nights) }}
          </p>

          <label class="hotel-room-selection__quantity">
            <span class="visually-hidden">Количество: {{ room.title }}</span>
            <select v-model.number="quantities[room.id]">
              <option
                v-for="value in quantityOptions(room.maxQuantity)"
                :key="value"
                :value="value"
              >
                {{ value }}
              </option>
            </select>
            <svg class="hotel-room-selection__chevron" viewBox="0 0 12 8" aria-hidden="true">
              <path
                d="M1 2 6 6.5 11 2"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </label>
        </div>
      </div>
    </article>
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

.hotel-room-selection__card {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  height: 212px;
  padding: 16px;
  border: 1px solid var(--wh-field-border);
  border-radius: var(--wh-radius-lg);
  background: var(--wh-white);
  box-sizing: border-box;
}

.hotel-room-selection__media {
  flex: 0 0 288px;
  width: 288px;
  height: 172px;
  border-radius: 12px;
  background: var(--wh-gray-300);
  overflow: hidden;
}

.hotel-room-selection__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  object-fit: contain;
}

.hotel-room-selection__quantity {
  position: relative;
  display: block;
  width: 172px;
  height: 46px;
  flex-shrink: 0;
}

.hotel-room-selection__quantity select {
  width: 100%;
  height: 100%;
  padding: 8px 34px 8px 16px;
  border: 1px solid var(--wh-field-border);
  border-radius: var(--wh-radius-lg);
  background: var(--wh-white);
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.05em;
  color: var(--wh-black-text);
  text-align: left;
  text-align-last: left;
  appearance: none;
  cursor: pointer;
}

.hotel-room-selection__quantity select:focus-visible {
  outline: 2px solid var(--wh-green);
  outline-offset: 2px;
}

.hotel-room-selection__chevron {
  position: absolute;
  top: 50%;
  right: 14px;
  width: 12px;
  height: 8px;
  color: var(--wh-black-text);
  pointer-events: none;
  transform: translateY(-50%);
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
}

@media (--wh-mobile) {
  .hotel-room-selection__card {
    flex-direction: column;
    gap: 16px;
  }

  .hotel-room-selection__media {
    flex: none;
    width: 100%;
    max-width: 288px;
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
