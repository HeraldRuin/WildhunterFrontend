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

function mapAvailabilityRoom(room: HotelRoomAvailability): HotelRoomOption {
  return {
    id: String(room.id),
    title: room.title,
    area: room.size > 0 ? `${room.size} м²` : '',
    capacity: room.adults,
    price: room.price,
    nights: room.nights,
    image: room.image_url || undefined,
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

function handleBook() {
  emit('book')
  void navigateTo(confirmationPath.value)
}
</script>

<template>
  <section class="hotel-booking-section" :style="sectionStyle">
    <div class="hotel-booking-section__card">
      <div class="hotel-booking-section__blocks">
        <HotelDatesGuests
          :loading="isCheckingAvailability"
          @check="handleCheck"
        />
        <HotelAnimalsSearch />
      </div>

      <HotelRoomSelection :rooms="availableRooms" />

      <button
        type="button"
        class="hotel-booking-section__book"
        @click="handleBook"
      >
        Забронировать сейчас
      </button>
    </div>
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
