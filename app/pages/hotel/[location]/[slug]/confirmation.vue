<script setup lang="ts">
import { formatHotelPrice } from '~/utils/hotel'

definePageMeta({
  layout: 'home',
})

useHead({
  title: 'Бронирование отправлено — WH',
})

/** Моковые данные для вёрстки — потом заменим на ответ API */
const booking = {
  bookingNumber: '274',
  bookingDate: '16.04.2026',
  paymentMethod: 'Pay Keeper',
  statusLabel: 'Обработка',
  email: 'bugaginio@gmail.com',
  hotelTitle: 'Хромой кабан 2',
  hotelImage: '',
  checkIn: '10.04.2026',
  checkOut: '11.04.2026',
  nights: 1,
  adults: 2,
  roomLabel: '4-х местный × 1',
  accommodationTotal: 4000,
  animalTitle: 'Кабан',
  huntDate: '10.04.2026',
  hunters: 3,
  organizationFee: 10_000,
  trophyFee: 30_000,
  specialRequirements: '',
}

const emailLine = `Информация о бронировании отправлена по адресу: ${booking.email}`
const bookingsLink = '/profile/bookings'
</script>

<template>
  <div class="booking-confirmation">
    <div class="booking-confirmation__header">
      <HomeHeroHeader />
    </div>

    <div class="booking-confirmation__body">
      <section class="booking-confirmation__hero">
        <div class="booking-confirmation__success">
          <span class="booking-confirmation__success-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <circle cx="12" cy="12" r="11" fill="currentColor" />
              <path
                d="M7 12.5 10.2 15.7 17 8.8"
                fill="none"
                stroke="#fff"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          <h1 class="booking-confirmation__title">
            ВАШЕ БРОНИРОВАНИЕ БЫЛО УСПЕШНО ОТПРАВЛЕНО!
          </h1>
        </div>

        <p class="booking-confirmation__subtitle">{{ emailLine }}</p>

        <div class="booking-confirmation__summary-row">
          <div class="booking-confirmation__summary">
            <div class="booking-confirmation__summary-item">
              <span class="booking-confirmation__summary-label">Номер брони:</span>
              <span class="booking-confirmation__summary-value">{{ booking.bookingNumber }}</span>
            </div>
            <div class="booking-confirmation__summary-item">
              <span class="booking-confirmation__summary-label">Дата бронирования:</span>
              <span class="booking-confirmation__summary-value">{{ booking.bookingDate }}</span>
            </div>
            <div class="booking-confirmation__summary-item">
              <span class="booking-confirmation__summary-label">Способ оплаты:</span>
              <span class="booking-confirmation__summary-value">{{ booking.paymentMethod }}</span>
            </div>
            <div class="booking-confirmation__summary-item">
              <span class="booking-confirmation__summary-label">Статус бронирования:</span>
              <span class="booking-confirmation__status">{{ booking.statusLabel }}</span>
            </div>
          </div>

          <div class="booking-confirmation__cta-wrap">
            <NuxtLink :to="bookingsLink" class="booking-confirmation__cta">
              Перейти в бронирования
            </NuxtLink>
          </div>
        </div>

        <div class="booking-confirmation__cards">
          <article class="booking-confirmation__card">
            <h2 class="booking-confirmation__card-title">Ваше проживание</h2>

            <div class="booking-confirmation__card-panel">
              <div class="booking-confirmation__card-content">
                <div class="booking-confirmation__card-media">
                  <div
                    class="booking-confirmation__card-placeholder"
                    :class="{ 'booking-confirmation__card-placeholder--image': booking.hotelImage }"
                  >
                    <img
                      v-if="booking.hotelImage"
                      :src="booking.hotelImage"
                      :alt="booking.hotelTitle"
                      loading="lazy"
                      decoding="async"
                    >
                  </div>
                  <p class="booking-confirmation__card-caption">{{ booking.hotelTitle }}</p>
                </div>

                <dl class="booking-confirmation__details">
                  <div class="booking-confirmation__detail-row">
                    <dt>Заезд</dt>
                    <dd>{{ booking.checkIn }}</dd>
                  </div>
                  <div class="booking-confirmation__detail-row">
                    <dt>Выезд</dt>
                    <dd>{{ booking.checkOut }}</dd>
                  </div>
                  <div class="booking-confirmation__detail-row">
                    <dt>Ночи</dt>
                    <dd>{{ booking.nights }}</dd>
                  </div>
                  <div class="booking-confirmation__detail-row booking-confirmation__detail-row--divider">
                    <dt>Взрослые</dt>
                    <dd>{{ booking.adults }}</dd>
                  </div>
                  <div class="booking-confirmation__detail-row booking-confirmation__detail-row--divider booking-confirmation__detail-row--room">
                    <dt>{{ booking.roomLabel }}</dt>
                    <dd>{{ formatHotelPrice(booking.accommodationTotal) }} ₽</dd>
                  </div>
                  <div class="booking-confirmation__detail-row booking-confirmation__detail-row--total">
                    <dt>Всего:</dt>
                    <dd>{{ formatHotelPrice(booking.accommodationTotal) }} ₽</dd>
                  </div>
                </dl>
              </div>
            </div>
          </article>

          <article class="booking-confirmation__card">
            <h2 class="booking-confirmation__card-title">Ваша охота</h2>

            <div class="booking-confirmation__card-panel">
              <div class="booking-confirmation__card-content">
                <div class="booking-confirmation__card-media">
                  <div class="booking-confirmation__card-placeholder" aria-hidden="true" />
                  <p class="booking-confirmation__card-caption">{{ booking.animalTitle }}</p>
                </div>

                <dl class="booking-confirmation__details">
                  <div class="booking-confirmation__detail-row">
                    <dt>Дата охоты</dt>
                    <dd>{{ booking.huntDate }}</dd>
                  </div>
                  <div class="booking-confirmation__detail-row">
                    <dt>Количество охотников</dt>
                    <dd>{{ booking.hunters }}</dd>
                  </div>
                  <div class="booking-confirmation__detail-row">
                    <dt>Организация охоты</dt>
                    <dd>{{ formatHotelPrice(booking.organizationFee) }} ₽</dd>
                  </div>
                  <div class="booking-confirmation__detail-row">
                    <dt>Трофей</dt>
                    <dd>{{ formatHotelPrice(booking.trophyFee) }} ₽</dd>
                  </div>
                </dl>
              </div>
            </div>
          </article>
        </div>

        <section class="booking-confirmation__requirements">
          <h2 class="booking-confirmation__requirements-title">Особые требования</h2>
          <div class="booking-confirmation__requirements-field">
            {{ booking.specialRequirements }}
          </div>
        </section>
      </section>
    </div>

    <HomeBlocksCommunityBlock variant="centered" />
    <LayoutAppFooter />
  </div>
</template>

<style scoped>
.booking-confirmation {
  background: var(--wh-white);
}

.booking-confirmation__header {
  display: flex;
  justify-content: center;
  padding: 0 12px;
}

.booking-confirmation__header :deep(.hero-header) {
  width: min(100%, calc(100vw - 160px));
  border: 1px solid var(--wh-gray-400);
  border-top: none;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: var(--wh-shadow);
}

.booking-confirmation__body {
  padding: 28px 0 72px;
}

.booking-confirmation__hero {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: min(calc(100% - 48px), calc(100vw - 220px));
  margin-inline: auto;
}

.booking-confirmation__success {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 0;
}

.booking-confirmation__success-icon {
  flex: none;
  color: var(--wh-green);
}

.booking-confirmation__title {
  margin: 0;
  font-family: 'UNCAGE', 'Manrope', system-ui, sans-serif;
  font-weight: 400;
  font-style: normal;
  font-size: 32px;
  line-height: 130%;
  letter-spacing: -0.03em;
  color: var(--wh-black-text);
  text-transform: uppercase;
}

.booking-confirmation__subtitle {
  margin: -12px 0 24px;
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 400;
  font-style: normal;
  font-size: 18px;
  line-height: 130%;
  letter-spacing: -0.05em;
  color: var(--wh-black-text);
}

.booking-confirmation__summary-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: stretch;
  gap: 16px;
  margin-bottom: 32px;
}

.booking-confirmation__summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: center;
  gap: 12px 20px;
  padding: 20px 24px;
  height: 94px;
  border-radius: var(--wh-radius-lg);
  background: var(--wh-green);
  color: var(--wh-white);
  box-sizing: border-box;
}

.booking-confirmation__cta-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.booking-confirmation__summary-label {
  display: block;
  margin-bottom: 8px;
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 500;
  font-style: normal;
  font-size: 18px;
  line-height: 120%;
  letter-spacing: -0.05em;
  color: var(--wh-white);
}

.booking-confirmation__summary-value {
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 400;
  font-style: normal;
  font-size: 18px;
  line-height: 130%;
  letter-spacing: -0.05em;
  opacity: 0.8;
}

.booking-confirmation__status {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--wh-orange-500);
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 400;
  font-style: normal;
  font-size: 12px;
  line-height: 120%;
  letter-spacing: -0.05em;
}

.booking-confirmation__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: auto;
  min-width: 360px;
  height: 70px;
  padding: 0 24px;
  border-radius: var(--wh-radius-lg);
  background: var(--wh-orange-500);
  color: var(--wh-white);
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 500;
  font-style: normal;
  font-size: 18px;
  line-height: 100%;
  letter-spacing: -0.05em;
  text-align: center;
  text-decoration: none;
  transition: background 0.15s ease;
}

.booking-confirmation__cta:hover {
  background: var(--wh-orange-600);
}

.booking-confirmation__cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.booking-confirmation__card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.booking-confirmation__card-title {
  margin: 0;
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 600;
  font-style: normal;
  font-size: 24px;
  line-height: 130%;
  letter-spacing: -0.05em;
  color: var(--wh-black-text);
}

.booking-confirmation__card-panel {
  height: 256px;
  padding: 20px;
  border: 1px solid var(--wh-gray-400);
  border-radius: var(--wh-radius-lg);
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: var(--wh-shadow);
  box-sizing: border-box;
}

.booking-confirmation__card-content {
  display: flex;
  gap: 20px;
}

.booking-confirmation__card-media {
  flex: 0 0 287px;
  width: 287px;
}

.booking-confirmation__card-placeholder {
  display: block;
  width: 287px;
  height: 191px;
  border-radius: 12px;
  background: var(--wh-gray-300);
  overflow: hidden;
}

.booking-confirmation__card-placeholder--image img {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: cover;
}

.booking-confirmation__card-caption {
  margin: 8px 0 0;
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 600;
  font-style: normal;
  font-size: 20px;
  line-height: 130%;
  letter-spacing: -0.05em;
  color: var(--wh-black-text);
}

.booking-confirmation__details {
  flex: 1;
  min-width: 0;
  margin: 0;
}

.booking-confirmation__detail-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  padding: 6px 0;
  font-size: 0.875rem;
  line-height: 1.4;
}

.booking-confirmation__detail-row--divider {
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
}

.booking-confirmation__detail-row--room {
  padding-top: 14px;
  padding-bottom: 14px;
}

.booking-confirmation__detail-row dt {
  margin: 0;
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 500;
  font-style: normal;
  font-size: 18px;
  line-height: 120%;
  letter-spacing: -0.05em;
  color: var(--wh-black-text);
}

.booking-confirmation__detail-row dd {
  margin: 0;
  text-align: right;
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 400;
  font-style: normal;
  font-size: 18px;
  line-height: 130%;
  letter-spacing: -0.05em;
  color: var(--wh-black-text);
}

.booking-confirmation__detail-row--total dt {
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 600;
  font-style: normal;
  font-size: 20px;
  line-height: 130%;
  letter-spacing: -0.05em;
  color: var(--wh-black-text);
}

.booking-confirmation__detail-row--total dd {
  color: var(--wh-orange-text);
  font-weight: 800;
}

.booking-confirmation__requirements-title {
  margin: 0 0 12px;
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 600;
  font-style: normal;
  font-size: 24px;
  line-height: 130%;
  letter-spacing: -0.05em;
  color: var(--wh-black-text);
}

.booking-confirmation__requirements-field {
  height: 70px;
  min-height: 70px;
  padding: 16px 18px;
  border: 1px solid var(--wh-gray-400);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: var(--wh-shadow);
  color: var(--wh-gray-600);
  font-size: 0.9375rem;
  line-height: 1.5;
  box-sizing: border-box;
}

@media (--wh-tablet) {
  .booking-confirmation__header :deep(.hero-header) {
    width: calc(100% - 24px);
  }

  .booking-confirmation__hero {
    width: min(calc(100% - 32px), calc(100vw - 48px));
  }

  .booking-confirmation__summary {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    height: auto;
    gap: 8px 8px;
    padding: 16px 12px;
  }

  .booking-confirmation__summary-label {
    margin-bottom: 2px;
  }

  .booking-confirmation__summary-label,
  .booking-confirmation__summary-value {
    font-size: 15px;
  }

  .booking-confirmation__summary-row {
    grid-template-columns: 1fr;
  }

  .booking-confirmation__cta-wrap {
    justify-content: flex-start;
    height: auto;
  }

  .booking-confirmation__cta {
    width: 360px;
    min-width: 360px;
    max-width: 100%;
    height: 48px;
    min-height: 48px;
    padding: 0 28px;
    font-size: 16px;
    white-space: nowrap;
  }

  .booking-confirmation__cards {
    grid-template-columns: 1fr;
  }

  .booking-confirmation__card-panel {
    height: auto;
    min-height: 256px;
  }
}

@media (--wh-mobile) {
  .booking-confirmation__header {
    padding: 0;
  }

  .booking-confirmation__header :deep(.hero-header) {
    width: 100%;
    max-width: 100%;
    margin-inline: 0;
    border-left: none;
    border-right: none;
    border-radius: 0 0 12px 12px;
  }

  .booking-confirmation__body {
    padding: 20px 0 48px;
  }

  .booking-confirmation__hero {
    width: 100%;
    padding-inline: 16px;
    box-sizing: border-box;
  }

  .booking-confirmation__success {
    align-items: flex-start;
  }

  .booking-confirmation__card-content {
    flex-direction: column;
  }

  .booking-confirmation__card-media {
    width: 100%;
    max-width: 287px;
    flex-basis: auto;
  }

  .booking-confirmation__card-placeholder {
    width: 100%;
    max-width: 287px;
  }
}
</style>
