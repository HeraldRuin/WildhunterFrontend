<script setup lang="ts">
import type { HotelDetail } from '~/types/api'
import { formatHotelPrice } from '~/utils/hotel'

defineProps<{
  hotel: HotelDetail
}>()

const dateRange = ref('04.02.26 - 05.02.26')
const guests = ref('1 взрослый')
const animal = ref('Кабан')

function handleBook() {
  // TODO: подключить бронирование
}
</script>

<template>
  <aside class="hotel-booking">
    <div class="hotel-booking__price-row">
      <p class="hotel-booking__price">
        {{ formatHotelPrice(hotel.sale_price ?? hotel.price) }} ₽
        <span>/ ночь</span>
      </p>
    </div>

    <form class="hotel-booking__form" @submit.prevent="handleBook">
      <label class="hotel-booking__field">
        <span class="hotel-booking__label">Заезд — выезд</span>
        <span class="hotel-booking__control">
          <input v-model="dateRange" type="text" readonly>
          <svg class="hotel-booking__chevron" viewBox="0 0 8 13" aria-hidden="true">
            <path d="M1.5 4.5 4 7.5 6.5 4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </label>

      <label class="hotel-booking__field">
        <span class="hotel-booking__label">Гости</span>
        <span class="hotel-booking__control">
          <select v-model="guests">
            <option>1 взрослый</option>
            <option>2 взрослых</option>
            <option>3 взрослых</option>
            <option>4+ гостей</option>
          </select>
          <svg class="hotel-booking__chevron" viewBox="0 0 8 13" aria-hidden="true">
            <path d="M1.5 4.5 4 7.5 6.5 4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </label>

      <label class="hotel-booking__field">
        <span class="hotel-booking__label">Охота</span>
        <span class="hotel-booking__control">
          <select v-model="animal">
            <option v-for="item in hotel.animals" :key="item.id" :value="item.title">
              {{ item.title }}
            </option>
          </select>
          <svg class="hotel-booking__chevron" viewBox="0 0 8 13" aria-hidden="true">
            <path d="M1.5 4.5 4 7.5 6.5 4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </label>

      <button type="submit" class="hotel-booking__submit btn btn--primary">
        Забронировать
      </button>
    </form>

    <p class="hotel-booking__note">
      Оплата на месте · Бесплатная отмена за 48 часов
    </p>
  </aside>
</template>

<style scoped>
.hotel-booking {
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  border: 1px solid var(--wh-gray-200);
  border-radius: var(--wh-radius-lg);
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
}

.hotel-booking__price-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.hotel-booking__price {
  margin: 0;
  font-size: clamp(1.5rem, 2.4vw, 1.85rem);
  font-weight: 800;
  color: var(--wh-gray-900);
}

.hotel-booking__price span {
  font-size: 1rem;
  font-weight: 600;
  color: var(--wh-gray-500);
}

.hotel-booking__form {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid var(--wh-gray-200);
  border-radius: var(--wh-radius);
  overflow: hidden;
}

.hotel-booking__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--wh-gray-200);
  cursor: pointer;
}

.hotel-booking__field:last-of-type {
  border-bottom: none;
}

.hotel-booking__label {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: -0.05em;
  color: #1c211c;
  opacity: 0.4;
}

.hotel-booking__control {
  position: relative;
  display: flex;
  align-items: center;
}

.hotel-booking__control input,
.hotel-booking__control select {
  flex: 1;
  min-width: 0;
  width: 100%;
  padding: 0 18px 0 0;
  border: none;
  background: transparent;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.05em;
  color: #1c211c;
  outline: none;
  cursor: pointer;
}

.hotel-booking__control select {
  appearance: none;
}

.hotel-booking__chevron {
  position: absolute;
  top: 50%;
  right: 0;
  width: 7px;
  height: 13px;
  color: #1c211c;
  pointer-events: none;
  transform: translateY(-50%);
}

.hotel-booking__submit {
  width: 100%;
  min-height: 52px;
  margin-top: 4px;
  border-radius: var(--wh-radius);
  font-size: 1rem;
}

.hotel-booking__note {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  text-align: center;
  color: var(--wh-gray-500);
}

@media (--wh-tablet) {
  .hotel-booking {
    position: static;
  }
}
</style>
