<script setup lang="ts">
import type { HotelRoomAvailability } from '~/types/api'
import type { HotelRoomOption } from '~/types/hotelBooking'
import { parseDisplayDateToApiDate } from '~/utils/date'

const props = withDefaults(defineProps<{
  /** Ширина всего блока, например `100%`, `90%`, `720px` */
  width?: string
  /** Ширина внутренних форм (поля и кнопка) */
  blocksWidth?: string
}>(), {
  width: '90%',
  blocksWidth: '100%',
})

const emit = defineEmits<{
  book: []
}>()

const route = useRoute()
const { hotels } = useApi()

const hotelParams = computed(() => ({
  locationSlug: String(route.params.location || ''),
  hotelSlug: String(route.params.slug || ''),
}))

const { data: hotel } = useHotelDetail(hotelParams)

const sectionStyle = computed(() => ({
  width: props.width,
  '--hotel-booking-blocks-width': props.blocksWidth,
}))

const confirmationPath = computed(() => {
  const location = String(route.params.location || '')
  const slug = String(route.params.slug || '')

  if (!location || !slug) {
    return '/'
  }

  return `/hotel/${location}/${slug}/confirmation`
})

const availableRooms = ref<HotelRoomOption[]>([])
const isCheckingAvailability = ref(false)
const isNoHuntConfirmOpen = ref(false)
const hasSelectedRooms = ref(false)
const animalsSearchRef = ref<{ getSelectedAnimalId: () => string } | null>(null)

function mapAvailabilityRoom(room: HotelRoomAvailability): HotelRoomOption {
  const gallery = Array.isArray(room.gallery)
    ? room.gallery.map(item => ({
        large: item.large || item.medium || item.thumb || '',
        medium: item.medium || item.large || item.thumb || '',
        thumb: item.thumb || item.medium || item.large || '',
      })).filter(item => item.large || item.medium || item.thumb)
    : []

  if (!gallery.length && room.image_url) {
    gallery.push({
      large: room.image_url,
      medium: room.image_url,
      thumb: room.image_url,
    })
  }

  return {
    id: String(room.id),
    title: room.title,
    area: room.size > 0 ? `${room.size} м²` : '',
    capacity: room.adults,
    price: room.price,
    nights: room.nights,
    image: room.image_url || gallery[0]?.medium || undefined,
    photosCount: gallery.length,
    gallery,
    maxQuantity: Math.max(1, Number(room.number) || 1),
  }
}

async function handleCheck(payload: { checkIn: string, checkOut: string, adults: number }) {
  const hotelId = hotel.value?.id

  if (!hotelId || isCheckingAvailability.value) {
    return
  }

  const checkIn = parseDisplayDateToApiDate(payload.checkIn)
  const checkOut = parseDisplayDateToApiDate(payload.checkOut)

  if (!checkIn || !checkOut) {
    return
  }

  isCheckingAvailability.value = true

  try {
    const response = await hotels.checkAvailability({
      hotel_id: hotelId,
      check_in: checkIn,
      check_out: checkOut,
      adults: payload.adults,
    })

    availableRooms.value = response.success
      ? response.data.rooms.map(mapAvailabilityRoom)
      : []
  }
  catch {
    availableRooms.value = []
  }
  finally {
    isCheckingAvailability.value = false
  }
}

function proceedBook() {
  isNoHuntConfirmOpen.value = false
  emit('book')
  void navigateTo(confirmationPath.value)
}

function handleBook() {
  const animalId = animalsSearchRef.value?.getSelectedAnimalId() || ''

  if (!animalId) {
    isNoHuntConfirmOpen.value = true
    return
  }

  proceedBook()
}

function closeNoHuntConfirm() {
  isNoHuntConfirmOpen.value = false
}

function handleConfirmKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeNoHuntConfirm()
  }
}

watch(isNoHuntConfirmOpen, (isOpen) => {
  if (!import.meta.client) {
    return
  }

  if (isOpen) {
    window.addEventListener('keydown', handleConfirmKeydown)
    return
  }

  window.removeEventListener('keydown', handleConfirmKeydown)
})

onBeforeUnmount(() => {
  if (!import.meta.client) {
    return
  }

  window.removeEventListener('keydown', handleConfirmKeydown)
})

useBodyScrollLock(isNoHuntConfirmOpen)
</script>

<template>
  <section class="hotel-booking-section" :style="sectionStyle">
    <div class="hotel-booking-section__card">
      <div class="hotel-booking-section__blocks">
        <HotelDatesGuests
          :loading="isCheckingAvailability"
          @check="handleCheck"
        />
        <HotelAnimalsSearch ref="animalsSearchRef" />
      </div>

      <HotelRoomSelection
        :rooms="availableRooms"
        @selection-change="hasSelectedRooms = $event"
      />

      <Transition name="hotel-booking-book">
        <button
          v-if="hasSelectedRooms"
          type="button"
          class="hotel-booking-section__book"
          @click="handleBook"
        >
          Забронировать сейчас
        </button>
      </Transition>
    </div>

    <Teleport to="body">
      <Transition name="hotel-booking-confirm">
        <div
          v-if="isNoHuntConfirmOpen"
          class="hotel-booking-confirm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="hotel-booking-confirm-title"
          @click.self="closeNoHuntConfirm"
        >
          <div class="hotel-booking-confirm__card">
            <CommonModalCloseButton @click="closeNoHuntConfirm" />

            <h2 id="hotel-booking-confirm-title" class="hotel-booking-confirm__title">
              Вы уверены, что хотите забронировать номер без охоты?
            </h2>

            <div class="hotel-booking-confirm__actions">
              <button
                type="button"
                class="hotel-booking-confirm__btn hotel-booking-confirm__btn--secondary"
                @click="closeNoHuntConfirm"
              >
                Нет
              </button>
              <button
                type="button"
                class="hotel-booking-confirm__btn hotel-booking-confirm__btn--primary"
                @click="proceedBook"
              >
                Да
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
.hotel-booking-section {
  max-width: 100%;
  margin-inline: auto;
}

.hotel-booking-section__card {
  display: flex;
  flex-direction: column;
  gap: 32px;
  width: 100%;
  padding: 24px;
  border-radius: var(--wh-radius-lg);
  background: var(--wh-white);
}

.hotel-booking-section__blocks {
  display: flex;
  flex-direction: column;
  gap: 64px;
}

.hotel-booking-section__book {
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(100%, var(--hotel-booking-blocks-width, 100%));
  height: 81px;
  margin-inline: auto;
  padding: 0 24px;
  border: none;
  border-radius: var(--wh-radius-lg);
  background: var(--wh-green);
  color: var(--wh-white);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.2;
  cursor: pointer;
  box-sizing: border-box;
  transition: background 0.15s ease, transform 0.15s ease;
}

.hotel-booking-section__book:hover {
  background: color-mix(in srgb, var(--wh-green) 78%, white);
  transform: var(--wh-button-hover-lift);
}

.hotel-booking-book-enter-active,
.hotel-booking-book-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.hotel-booking-book-enter-from,
.hotel-booking-book-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.hotel-booking-confirm {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(17, 24, 39, 0.45);
  backdrop-filter: blur(6px);
}

.hotel-booking-confirm__card {
  position: relative;
  width: min(100%, 420px);
  padding: 40px 32px 28px;
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
  text-align: center;
}

.hotel-booking-confirm__title {
  margin: 0 0 28px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.35;
  letter-spacing: -0.03em;
  color: var(--wh-black-text);
}

.hotel-booking-confirm__actions {
  display: flex;
  gap: 12px;
}

.hotel-booking-confirm__btn {
  flex: 1;
  min-height: 52px;
  padding: 12px 16px;
  border: none;
  border-radius: var(--wh-radius-lg);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.2;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.hotel-booking-confirm__btn--secondary {
  border: 1px solid var(--wh-field-border);
  background: var(--wh-white);
  color: var(--wh-black-text);
}

.hotel-booking-confirm__btn--secondary:hover {
  border-color: var(--wh-field-border-active);
  box-shadow: 0 0 0 3px var(--wh-field-focus-ring);
  background: #f5f5f5;
}

.hotel-booking-confirm__btn--primary {
  background: var(--wh-orange-500);
  color: var(--wh-white);
}

.hotel-booking-confirm__btn--primary:hover {
  background: var(--wh-orange-600);
  transform: var(--wh-button-hover-lift);
}

.hotel-booking-confirm-enter-active,
.hotel-booking-confirm-leave-active {
  transition: opacity 0.2s ease;
}

.hotel-booking-confirm-enter-from,
.hotel-booking-confirm-leave-to {
  opacity: 0;
}

@media (--wh-tablet) {
  .hotel-booking-section {
    width: 100% !important;
  }

  .hotel-booking-section__card {
    padding: 20px 12px;
    gap: 24px;
  }

  .hotel-booking-section__blocks {
    gap: 48px;
  }
}

@media (--wh-mobile) {
  .hotel-booking-section {
    width: 100% !important;
  }

  .hotel-booking-section__card {
    padding: 16px 12px;
    gap: 20px;
    border-radius: var(--wh-radius-lg);
  }

  .hotel-booking-section__blocks {
    gap: 32px;
  }
}
</style>
