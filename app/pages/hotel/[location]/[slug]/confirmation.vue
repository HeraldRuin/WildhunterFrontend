<script setup lang="ts">
import type { BookingCheckoutData } from '~/types/api'
import type { HotelBookingDraft } from '~/types/hotelBooking'
import {
  countNightsBetween,
  formatBookingDate,
  parseBirthdayDate,
} from '~/utils/date'
import { formatHotelPriceLabel } from '~/utils/hotel'

definePageMeta({
  layout: 'home',
})

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  unpaid: 'Не оплачено',
  paid: 'Оплачено',
  processing: 'Ожидается подтверждение базой',
  completed: 'Завершено',
  confirmed: 'Подтверждено',
  cancelled: 'Отменено',
  partial_payment: 'Частичная оплата',
  collection: 'Сбор охотников',
  finished_collection: 'Сбор завершен',
  invitation: 'Приглашения',
  prepayment: 'Предоплата',
  prepayment_collection: 'Сбор предоплаты',
  finish_prepayment: 'Предоплата собрана',
  bed_collection: 'Выбор койко-мест',
  finish_bed_collection: 'Койко-места выбраны',
}

const route = useRoute()
const { bookings } = useApi()
const { user } = useAuth()
const notifications = useNotifications()
const { draft, pendingNotes, clearDraft, setPendingNotes, clearPendingNotes } = useHotelBookingDraft()

const specialRequirements = ref(
  draft.value?.specialRequirements || pendingNotes.value || '',
)
const isConfirmingBooking = ref(false)

const bookingCode = computed(() => String(route.query.code || '').trim())
const isPreview = computed(() => {
  if (isConfirmingBooking.value && draft.value) {
    return true
  }

  return !bookingCode.value && Boolean(draft.value)
})

useHead(() => ({
  title: isPreview.value
    ? 'Подтверждение бронирования — WH'
    : 'Бронирование отправлено — WH',
}))

const { data: checkout, pending: checkoutPending } = useAsyncData(
  () => `booking-checkout-${bookingCode.value}`,
  async () => {
    if (!bookingCode.value) {
      return null
    }

    try {
      const response = await bookings.checkout(bookingCode.value)
      return response.success ? response.data : null
    }
    catch {
      return null
    }
  },
  {
    watch: [bookingCode],
  },
)

function applyNotesFromCheckout(data: BookingCheckoutData | null | undefined) {
  if (!bookingCode.value || !data) {
    return
  }

  const notes = typeof data.customer_notes === 'string'
    ? data.customer_notes.trim()
    : ''

  if (!notes) {
    return
  }

  specialRequirements.value = notes
  clearPendingNotes()
}

watch(
  checkout,
  (data) => {
    applyNotesFromCheckout(data)
  },
  { immediate: true },
)

watch(
  [bookingCode, pendingNotes],
  () => {
    if (!bookingCode.value || !pendingNotes.value) {
      return
    }

    if (!specialRequirements.value.trim()) {
      specialRequirements.value = pendingNotes.value
    }
  },
  { immediate: true },
)

function formatCheckoutDate(value: string | null | undefined) {
  if (!value) {
    return ''
  }

  const parsed = parseBirthdayDate(value)
  return parsed ? formatBookingDate(parsed) : value
}

function mapCheckoutToView(data: BookingCheckoutData | null) {
  if (!data) {
    return null
  }

  const checkInDate = parseBirthdayDate(data.check_in)
  const checkOutDate = parseBirthdayDate(data.check_out)
  const nights = checkInDate && checkOutDate
    ? countNightsBetween(checkInDate, checkOutDate)
    : 0

  const roomLabel = data.rooms
    .map((room) => {
      const title = room.title?.trim() || 'Номер'
      return `${title} × ${room.number}`
    })
    .join(', ')

  return {
    bookingNumber: String(data.booking_number ?? ''),
    bookingDate: formatCheckoutDate(data.created_at),
    paymentMethod: data.gateway?.trim() || '—',
    statusLabel: STATUS_LABELS[data.status] || data.status,
    email: user.value?.email || '',
    hotelTitle: data.hotel?.title || '',
    hotelImage: data.hotel?.image_url || '',
    checkIn: formatCheckoutDate(data.check_in),
    checkOut: formatCheckoutDate(data.check_out),
    nights,
    adults: data.total_guests,
    roomLabel,
    accommodationTotal: data.total,
    animalTitle: data.animal?.title || '',
    animalImage: data.animal?.image_url || '',
    huntDate: formatCheckoutDate(data.start_date_animal || data.check_in),
    hunters: data.total_hunting ?? 0,
    organizationFee: data.amount_hunting,
    trophyFee: 0,
    hasAccommodation: data.type === 'hotel' || data.type === 'hotel_animal',
    hasHunt: data.type === 'animal' || data.type === 'hotel_animal',
  }
}

function mapDraftToView(data: HotelBookingDraft) {
  const roomLabel = data.rooms
    .map(room => `${room.title} × ${room.quantity}`)
    .join(', ')

  return {
    bookingNumber: data.bookingNumber,
    bookingDate: data.bookingDate,
    paymentMethod: data.paymentMethod,
    statusLabel: data.statusLabel,
    email: data.email || user.value?.email || '',
    hotelTitle: data.hotelTitle,
    hotelImage: data.hotelImage || data.rooms[0]?.image || '',
    checkIn: data.checkIn,
    checkOut: data.checkOut,
    nights: data.nights,
    adults: data.adults,
    roomLabel,
    accommodationTotal: data.accommodationTotal,
    animalTitle: data.animalTitle,
    animalImage: data.animalImage,
    huntDate: data.huntDate,
    hunters: data.hunters,
    organizationFee: data.organizationFee,
    trophyFee: data.trophyFee,
    hasAccommodation: data.hasAccommodation,
    hasHunt: data.hasHunt,
  }
}

const booking = computed(() => {
  if (isConfirmingBooking.value && draft.value) {
    return mapDraftToView(draft.value)
  }

  if (bookingCode.value) {
    return mapCheckoutToView(checkout.value ?? null)
  }

  return draft.value ? mapDraftToView(draft.value) : null
})

const isLoading = computed(() => Boolean(bookingCode.value) && checkoutPending.value && !isConfirmingBooking.value)

const isNotesFieldReadonly = computed(() => !isPreview.value)

const pageTitle = computed(() => {
  if (isPreview.value) {
    return 'Подтвердите бронирование вашего мероприятия'
  }

  return 'ВАШЕ БРОНИРОВАНИЕ БЫЛО УСПЕШНО ОТПРАВЛЕНО!'
})

const emailLine = computed(() => {
  const email = booking.value?.email

  if (isPreview.value) {
    return email
      ? `Информация о бронировании будет отправлена по адресу: ${email}`
      : 'Информация о бронировании будет отправлена по адресу'
  }

  return email
    ? `Информация о бронировании отправлена по адресу: ${email}`
    : 'Информация о бронировании отправлена'
})

const bookingsLink = '/profile/bookings'

function getResponseMessage(error: unknown) {
  if (!error || typeof error !== 'object') {
    return ''
  }

  const fetchError = error as {
    data?: { message?: string }
    message?: string
  }

  return fetchError.data?.message || fetchError.message || ''
}

async function confirmSaveBooking() {
  const currentDraft = draft.value

  if (!currentDraft || isConfirmingBooking.value || bookingCode.value) {
    return
  }

  isConfirmingBooking.value = true
  await nextTick()

  try {
    const response = await bookings.create(currentDraft.createPayload)
    const code = response.data.booking_code
    const notes = specialRequirements.value.trim() || currentDraft.specialRequirements.trim()

    if (notes) {
      setPendingNotes(notes)
      specialRequirements.value = notes

      try {
        await bookings.updateCustomerNotes(code, notes)
      }
      catch {
      }
    }

    clearNuxtData(`booking-checkout-${code}`)

    await navigateTo({
      path: route.path,
      query: {
        code,
      },
    })

    clearDraft()
  }
  catch (error) {
    notifications.error(getResponseMessage(error) || 'Не удалось создать бронирование')
  }
  finally {
    isConfirmingBooking.value = false
  }
}
</script>

<template>
  <div class="booking-confirmation">
    <div class="booking-confirmation__header">
      <HomeHeroHeader />
    </div>

    <div
      class="booking-confirmation__body"
      :class="{ 'booking-confirmation__body--confirming': isConfirmingBooking }"
      :aria-busy="isConfirmingBooking || undefined"
    >
      <div v-if="isLoading && !isConfirmingBooking" class="booking-confirmation__loading" aria-busy="true">
        <CommonSpinner variant="ring" :size="32" color="var(--wh-green)" label="Загружаем бронирование" />
      </div>

      <section
        v-else-if="booking"
        class="booking-confirmation__hero"
      >
        <div class="booking-confirmation__success">
          <span
            class="booking-confirmation__success-icon"
            :class="{ 'booking-confirmation__success-icon--pending': isPreview }"
            aria-hidden="true"
          >
            <svg v-if="isPreview" viewBox="0 0 24 24" width="22" height="22">
              <circle cx="12" cy="12" r="11" fill="currentColor" />
              <path
                d="M12 7v5.2l3.2 1.8"
                fill="none"
                stroke="#fff"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <svg v-else viewBox="0 0 24 24" width="22" height="22">
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
            {{ pageTitle }}
          </h1>
        </div>

        <p class="booking-confirmation__subtitle">{{ emailLine }}</p>

        <div
          v-if="!isPreview"
          class="booking-confirmation__summary-row"
        >
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

        <div
          class="booking-confirmation__cards"
          :class="{ 'booking-confirmation__cards--single': !(booking.hasAccommodation && booking.hasHunt) }"
        >
          <article v-if="booking.hasAccommodation" class="booking-confirmation__card">
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
                    <dd>{{ formatHotelPriceLabel(booking.accommodationTotal) }}</dd>
                  </div>
                  <div class="booking-confirmation__detail-row booking-confirmation__detail-row--total">
                    <dt>Всего:</dt>
                    <dd>{{ formatHotelPriceLabel(booking.accommodationTotal) }}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </article>

          <article v-if="booking.hasHunt" class="booking-confirmation__card">
            <h2 class="booking-confirmation__card-title">Ваша охота</h2>

            <div class="booking-confirmation__card-panel">
              <div class="booking-confirmation__card-content">
                <div class="booking-confirmation__card-media">
                  <div
                    class="booking-confirmation__card-placeholder"
                    :class="{ 'booking-confirmation__card-placeholder--image': booking.animalImage }"
                    :aria-hidden="booking.animalImage ? undefined : 'true'"
                  >
                    <img
                      v-if="booking.animalImage"
                      :src="booking.animalImage"
                      :alt="booking.animalTitle"
                      loading="lazy"
                      decoding="async"
                    >
                  </div>
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
                    <dd>{{ formatHotelPriceLabel(booking.organizationFee) }}</dd>
                  </div>
                  <div v-if="booking.trophyFee > 0" class="booking-confirmation__detail-row">
                    <dt>Трофей</dt>
                    <dd>{{ formatHotelPriceLabel(booking.trophyFee) }}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </article>
        </div>

        <section class="booking-confirmation__requirements">
          <h2 class="booking-confirmation__requirements-title">Особые требования</h2>
          <div class="booking-confirmation__requirements-row">
            <input
              v-model="specialRequirements"
              type="text"
              class="booking-confirmation__requirements-field"
              :class="{ 'booking-confirmation__requirements-field--readonly': isNotesFieldReadonly }"
              aria-label="Особые требования"
              :readonly="isNotesFieldReadonly"
            >
          </div>

          <button
            v-if="isPreview"
            type="button"
            class="booking-confirmation__confirm-save"
            :disabled="isConfirmingBooking"
            @click="confirmSaveBooking"
          >
            Подтвердить сохранение брони
          </button>
        </section>
      </section>

      <section v-else-if="!isConfirmingBooking" class="booking-confirmation__hero">
        <h1 class="booking-confirmation__title">
          Не удалось загрузить бронирование
        </h1>
        <p class="booking-confirmation__subtitle">
          Проверьте ссылку или создайте бронирование заново.
        </p>
        <div class="booking-confirmation__cta-wrap">
          <NuxtLink :to="bookingsLink" class="booking-confirmation__cta">
            Перейти в бронирования
          </NuxtLink>
        </div>
      </section>

      <Transition name="booking-confirmation-saving-fade">
        <div
          v-if="isConfirmingBooking"
          class="booking-confirmation__saving-overlay"
          aria-hidden="true"
        >
          <div class="booking-confirmation__saving-overlay-bg" />
          <div class="booking-confirmation__saving-overlay-spinner">
            <CommonSpinner
              variant="ring"
              :size="48"
              color="var(--wh-green)"
              label="Сохраняем бронь"
            />
          </div>
        </div>
      </Transition>
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
  position: relative;
  z-index: 40;
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
  position: relative;
  padding: 28px 0 72px;
}

.booking-confirmation__body--confirming {
  pointer-events: none;
  user-select: none;
}

.booking-confirmation__loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 240px;
}

.booking-confirmation__hero {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: min(calc(100% - 48px), calc(100vw - 220px));
  margin-inline: auto;
}

.booking-confirmation__saving-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  pointer-events: none;
}

.booking-confirmation__saving-overlay-bg {
  position: absolute;
  inset: 0;
  background: #fff;
  opacity: 0.5;
}

.booking-confirmation__saving-overlay-spinner {
  position: relative;
  z-index: 1;
}

.booking-confirmation-saving-fade-enter-active,
.booking-confirmation-saving-fade-leave-active {
  transition: opacity 0.2s ease;
}

.booking-confirmation-saving-fade-enter-from,
.booking-confirmation-saving-fade-leave-to {
  opacity: 0;
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

.booking-confirmation__success-icon--pending {
  color: var(--wh-orange-500);
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
  margin: -12px 0 0;
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

.booking-confirmation__cards--single {
  grid-template-columns: minmax(0, 1fr);
  justify-items: center;
}

.booking-confirmation__cards--single .booking-confirmation__card {
  width: min(100%, calc((100% - 24px) / 2));
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
  min-height: 256px;
  height: auto;
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
  align-items: flex-start;
  gap: 16px;
  min-width: 0;
}

.booking-confirmation__card-media {
  flex: 0 0 287px;
  width: 287px;
}

.booking-confirmation__card-placeholder {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 287 / 191;
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
  gap: 8px;
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

.booking-confirmation__requirements-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: stretch;
}

.booking-confirmation__requirements-field {
  width: 100%;
  height: 70px;
  min-height: 70px;
  padding: 16px 18px;
  border: 1px solid var(--wh-gray-400);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: var(--wh-shadow);
  color: var(--wh-black-text);
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 22px;
  line-height: 1.4;
  letter-spacing: -0.05em;
  box-sizing: border-box;
  outline: none;
}

.booking-confirmation__requirements-field::placeholder {
  color: var(--wh-gray-600);
}

.booking-confirmation__requirements-field:focus {
  border-color: var(--wh-orange-500);
}

.booking-confirmation__requirements-field--readonly,
.booking-confirmation__requirements-field:disabled {
  background: var(--wh-gray-100, #f3f4f3);
  color: var(--wh-black-text);
  cursor: default;
}

.booking-confirmation__requirements-field--readonly:focus {
  border-color: var(--wh-gray-400);
}

.booking-confirmation__confirm-save {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 200px;
  height: 70px;
  margin-top: 16px;
  padding: 0 24px;
  border: none;
  border-radius: var(--wh-radius-lg);
  background: var(--wh-green);
  color: var(--wh-white);
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 500;
  font-style: normal;
  font-size: 18px;
  line-height: 100%;
  letter-spacing: -0.05em;
  cursor: pointer;
  transition: background 0.15s ease;
}

.booking-confirmation__confirm-save:hover:not(:disabled) {
  background: color-mix(in srgb, var(--wh-green) 78%, white);
}

.booking-confirmation__confirm-save:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 1440px) and (min-width: 1025px) {
  .booking-confirmation__summary {
    gap: 10px 12px;
    padding: 16px 18px;
  }

  .booking-confirmation__summary-label,
  .booking-confirmation__summary-value {
    font-size: 15px;
  }

  .booking-confirmation__cta {
    min-width: 260px;
    width: 260px;
    padding: 0 16px;
    font-size: 16px;
  }

  .booking-confirmation__card-media {
    flex: 0 0 180px;
    width: 180px;
  }

  .booking-confirmation__card-caption {
    font-size: 16px;
  }

  .booking-confirmation__detail-row dt,
  .booking-confirmation__detail-row dd {
    font-size: 15px;
  }

  .booking-confirmation__detail-row--total dt {
    font-size: 16px;
  }
}

@media (max-width: 1280px) and (min-width: 1025px) {
  .booking-confirmation__summary {
    gap: 8px 8px;
    padding: 14px 14px;
  }

  .booking-confirmation__summary-label,
  .booking-confirmation__summary-value {
    font-size: 14px;
  }

  .booking-confirmation__cta {
    min-width: 200px;
    width: 200px;
    height: 64px;
    padding: 0 12px;
    font-size: 15px;
  }

  .booking-confirmation__card-media {
    flex: 0 0 140px;
    width: 140px;
  }

  .booking-confirmation__card-content {
    gap: 12px;
  }
}

@media (--wh-tablet) {
  .booking-confirmation__header :deep(.hero-header) {
    width: calc(100% - 24px);
  }

  .booking-confirmation__hero {
    width: min(calc(100% - 32px), calc(100vw - 48px));
  }

  .booking-confirmation__title {
    font-size: 28px;
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

  .booking-confirmation__cards--single .booking-confirmation__card {
    width: 100%;
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

  .booking-confirmation__title {
    font-size: 24px;
  }

  .booking-confirmation__subtitle {
    font-size: 16px;
  }

  .booking-confirmation__card-title,
  .booking-confirmation__requirements-title {
    font-size: 22px;
  }

  .booking-confirmation__summary-row,
  .booking-confirmation__requirements-row {
    grid-template-columns: 1fr;
  }

  .booking-confirmation__cta,
  .booking-confirmation__confirm-save {
    width: 100%;
    height: 56px;
    min-height: 56px;
  }

  .booking-confirmation__card-content {
    flex-direction: column;
  }

  .booking-confirmation__card-media {
    width: 100%;
    max-width: none;
    flex: none;
  }

  .booking-confirmation__card-placeholder {
    width: 100%;
    max-width: none;
    height: auto;
    aspect-ratio: 287 / 191;
  }
}
</style>
