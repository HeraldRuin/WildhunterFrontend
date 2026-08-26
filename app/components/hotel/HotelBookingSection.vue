<script setup lang="ts">
import type { HotelRoomAvailability } from '~/types/api'
import type { HotelRoomAttributeGroupOption, HotelRoomOption } from '~/types/hotelBooking'
import {
  countNightsBetween,
  formatApiDate,
  formatBookingDate,
  formatBookingDateFromDisplay,
  parseDisplayDate,
  parseDisplayDateToApiDate,
  startOfDay,
} from '~/utils/date'
import { formatHotelPriceLabel } from '~/utils/hotel'

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
const { hotels, animals } = useApi()
const { user } = useAuth()
const { setDraft } = useHotelBookingDraft()

const hotelParams = computed(() => ({
  locationSlug: String(route.params.location || ''),
  hotelSlug: String(route.params.slug || ''),
}))

const { data: hotel, pending: hotelPending } = useHotelDetail(hotelParams)

const hotelAnimals = computed(() => hotel.value?.animals ?? [])
const animalWarningTitle = computed(() =>
  hotelAnimals.value.length
    ? 'Пожалуйста, выберите животное'
    : 'У этой базы нет животных для охоты',
)

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
const hasCheckedAvailability = ref(false)
const isCheckingAvailability = ref(false)
const isCheckingAnimals = ref(false)
const isNoHuntConfirmOpen = ref(false)
const isNoRoomConfirmOpen = ref(false)
const isAnimalWarningOpen = ref(false)
const isHuntDateWarningOpen = ref(false)
const isStayDateWarningOpen = ref(false)
const apiMessage = ref('')
const animalAvailability = ref<{
  hunters: number
  price: number
} | null>(null)
/** Stay dates that were set when animal availability was last confirmed. */
const animalAvailabilityStay = ref<{
  checkIn: number
  checkOut: number
} | null>(null)
const hasSelectedRooms = ref(false)
const selectedRoomsCount = ref(0)
const stayAdults = ref(1)
const didAutoCheckFromSearch = ref(false)
const stayCheckIn = ref<Date | null>(null)
const stayCheckOut = ref<Date | null>(null)

const animalAvailabilityTotal = computed(() => {
  if (!animalAvailability.value) {
    return 0
  }

  return animalAvailability.value.price * animalAvailability.value.hunters
})
const datesGuestsRef = ref<{
  getAdults: () => number
  getCheckPayload: () => { checkIn: string, checkOut: string, adults: number } | null
  getBookingPayload: () => { checkIn: string, checkOut: string, adults: number } | null
} | null>(null)
const animalsSearchRef = ref<{
  getSelectedAnimalId: () => string
  getHunters: () => number
  getHuntDate: () => string
} | null>(null)
const roomSelectionRef = ref<{
  getSelectedRooms: () => { room_id: number, number: number }[]
} | null>(null)
const roomsExceedGuests = computed(() =>
  hasSelectedRooms.value && selectedRoomsCount.value > stayAdults.value,
)
const ROOMS_EXCEED_GUESTS_MESSAGE = 'Количество номеров не может быть больше количества гостей'
const isApiMessageOpen = computed(() => Boolean(apiMessage.value))
const isAnyModalOpen = computed(() =>
  isNoHuntConfirmOpen.value
  || isNoRoomConfirmOpen.value
  || isAnimalWarningOpen.value
  || isHuntDateWarningOpen.value
  || isStayDateWarningOpen.value
  || isApiMessageOpen.value,
)

function handleAdultsChange(adults: number) {
  stayAdults.value = adults
}

function handleRoomSelectionChange(payload: { hasSelectedRooms: boolean, totalRooms: number }) {
  hasSelectedRooms.value = payload.hasSelectedRooms
  selectedRoomsCount.value = payload.totalRooms
}

function getBookingAdults(stayAdultsCount: number | undefined, hunters: number, hasRooms: boolean) {
  if (hasRooms) {
    return stayAdultsCount ?? datesGuestsRef.value?.getAdults() ?? 1
  }

  return hunters
}

function validateRoomsAgainstGuests(adults: number, rooms: { number: number }[]) {
  const totalRooms = rooms.reduce((sum, room) => sum + room.number, 0)

  if (totalRooms > adults) {
    showApiMessage(ROOMS_EXCEED_GUESTS_MESSAGE)
    return false
  }

  return true
}

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

function showApiMessage(message: string) {
  if (!message) {
    return
  }

  apiMessage.value = message
}

function closeApiMessage() {
  apiMessage.value = ''
}

function clearAnimalAvailability() {
  animalAvailability.value = null
  animalAvailabilityStay.value = null
}

function handleStayDatesChange(payload: { checkIn: Date | null, checkOut: Date | null }) {
  const prevCheckIn = stayCheckIn.value
  const prevCheckOut = stayCheckOut.value

  stayCheckIn.value = payload.checkIn
  stayCheckOut.value = payload.checkOut

  const datesChanged = prevCheckIn?.getTime() !== payload.checkIn?.getTime()
    || prevCheckOut?.getTime() !== payload.checkOut?.getTime()
  const hasNewDates = Boolean(payload.checkIn && payload.checkOut)

  // Clearing stay dates keeps hunt result.
  if (!datesChanged || !hasNewDates || !animalAvailability.value || !payload.checkIn || !payload.checkOut) {
    return
  }

  const stayAtCheck = animalAvailabilityStay.value
  const sameStayAsCheck = Boolean(
    stayAtCheck
    && stayAtCheck.checkIn === startOfDay(payload.checkIn).getTime()
    && stayAtCheck.checkOut === startOfDay(payload.checkOut).getTime(),
  )

  // Restore the same stay (e.g. 6–7 after clear) and hunt date still fits — keep result.
  // A different period (e.g. 6–8) clears it.
  if (!sameStayAsCheck) {
    clearAnimalAvailability()
  }
}

function tryAutoCheckFromSearch() {
  if (didAutoCheckFromSearch.value || !hotel.value?.id) {
    return
  }

  const payload = datesGuestsRef.value?.getCheckPayload()

  if (!payload) {
    return
  }

  didAutoCheckFromSearch.value = true
  void handleCheck(payload)
}

function mapAvailabilityAttributes(room: HotelRoomAvailability): HotelRoomAttributeGroupOption[] {
  if (!Array.isArray(room.attributes)) {
    return []
  }

  return room.attributes.map((group) => {
    const terms = Array.isArray(group.terms)
      ? group.terms.map(term => ({
          id: term.id,
          name: (term.translation?.name || term.name || '').trim(),
          icon: (term.icon || '').trim(),
          imageUrl: (term.image_url || '').trim(),
        })).filter(term => term.name)
      : []

    return {
      id: group.id,
      name: (group.name || '').trim(),
      terms,
    }
  }).filter(group => group.name && group.terms.length)
}

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
    attributes: mapAvailabilityAttributes(room),
  }
}

async function handleCheck(payload: { checkIn: string, checkOut: string, adults: number }) {
  stayAdults.value = payload.adults

  if (!payload.checkIn || !payload.checkOut) {
    isStayDateWarningOpen.value = true
    return
  }

  const hotelId = hotel.value?.id

  if (!hotelId || isCheckingAvailability.value) {
    return
  }

  const checkIn = parseDisplayDateToApiDate(payload.checkIn)
  const checkOut = parseDisplayDateToApiDate(payload.checkOut)

  if (!checkIn || !checkOut) {
    isStayDateWarningOpen.value = true
    return
  }

  isCheckingAvailability.value = true
  hasSelectedRooms.value = false
  selectedRoomsCount.value = 0

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
    hasCheckedAvailability.value = true
    isCheckingAvailability.value = false
  }
}

async function handleAnimalsCheck(payload: {
  huntDate: string
  hunters: number
  animalId: string
}) {
  if (!payload.animalId) {
    isAnimalWarningOpen.value = true
    return
  }

  if (!payload.huntDate) {
    isHuntDateWarningOpen.value = true
    return
  }

  const hotelId = hotel.value?.id
  const hunterData = parseDisplayDateToApiDate(payload.huntDate)
  const animalId = Number(payload.animalId)
  const stay = datesGuestsRef.value?.getCheckPayload()
  const checkIn = stay ? parseDisplayDateToApiDate(stay.checkIn) : null
  const checkOut = stay ? parseDisplayDateToApiDate(stay.checkOut) : null

  if (!hotelId || !hunterData || !Number.isFinite(animalId) || isCheckingAnimals.value) {
    return
  }

  isCheckingAnimals.value = true
  clearAnimalAvailability()

  try {
    const response = await animals.checkAvailability({
      hotel_id: hotelId,
      animal_id: animalId,
      hunter_data: hunterData,
      hunters: payload.hunters,
      ...(checkIn && checkOut ? { check_in: checkIn, check_out: checkOut } : {}),
    })

    if (response.success && response.data?.available) {
      animalAvailability.value = {
        hunters: payload.hunters,
        price: Number(response.data.price) || 0,
      }
      animalAvailabilityStay.value = stayCheckIn.value && stayCheckOut.value
        ? {
            checkIn: startOfDay(stayCheckIn.value).getTime(),
            checkOut: startOfDay(stayCheckOut.value).getTime(),
          }
        : null
      return
    }

    if (response.message) {
      showApiMessage(response.message)
    }
  }
  catch (error) {
    showApiMessage(getResponseMessage(error) || 'Не удалось проверить доступность')
  }
  finally {
    isCheckingAnimals.value = false
  }
}

async function proceedBook() {
  const currentHotel = hotel.value
  const hotelId = currentHotel?.id
  const stay = datesGuestsRef.value?.getBookingPayload()
  const rooms = roomSelectionRef.value?.getSelectedRooms() || []
  const stayCheckIn = stay ? parseDisplayDateToApiDate(stay.checkIn) : null
  const stayCheckOut = stay ? parseDisplayDateToApiDate(stay.checkOut) : null
  const animalIdRaw = animalsSearchRef.value?.getSelectedAnimalId() || ''
  const animalId = animalIdRaw ? Number(animalIdRaw) : undefined
  const hunters = animalsSearchRef.value?.getHunters() ?? 1
  const hasAnimal = animalId != null && Number.isFinite(animalId)
  const huntDateRaw = animalsSearchRef.value?.getHuntDate() || ''
  const huntDate = huntDateRaw ? parseDisplayDateToApiDate(huntDateRaw) : null
  const huntOnly = hasAnimal && !rooms.length
  const bookingAdults = getBookingAdults(stay?.adults, hunters, rooms.length > 0)

  if (rooms.length > 0 && !validateRoomsAgainstGuests(bookingAdults, rooms)) {
    return
  }

  let checkIn = stayCheckIn
  let checkOut = stayCheckOut
  let adults = bookingAdults

  if (huntOnly) {
    if (!huntDate) {
      isNoHuntConfirmOpen.value = false
      isNoRoomConfirmOpen.value = false
      isHuntDateWarningOpen.value = true
      return
    }

    // API still expects a stay range; for hunt-only use hunt day → next day.
    const huntDay = parseDisplayDate(huntDateRaw)
    checkIn = huntDate
    checkOut = huntDay
      ? formatApiDate(new Date(huntDay.getFullYear(), huntDay.getMonth(), huntDay.getDate() + 1))
      : null
    adults = hunters
  }
  else if (!stayCheckIn || !stayCheckOut) {
    isNoHuntConfirmOpen.value = false
    isNoRoomConfirmOpen.value = false
    isStayDateWarningOpen.value = true
    return
  }

  if (!currentHotel || !hotelId || !checkIn || !checkOut || (!rooms.length && !hasAnimal)) {
    return
  }

  isNoHuntConfirmOpen.value = false
  isNoRoomConfirmOpen.value = false

  const selectedRooms = rooms.map((selection) => {
    const room = availableRooms.value.find(item => Number(item.id) === selection.room_id)

    return {
      id: String(selection.room_id),
      title: room?.title || 'Номер',
      quantity: selection.number,
      price: room?.price || 0,
      nights: room?.nights || 0,
      image: room?.image,
    }
  })

  const checkInDate = parseDisplayDate(stay?.checkIn || '')
    || (huntDateRaw ? parseDisplayDate(huntDateRaw) : null)
  const checkOutDate = parseDisplayDate(stay?.checkOut || '')
    || (checkInDate
      ? new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate() + 1)
      : null)

  const nights = checkInDate && checkOutDate
    ? countNightsBetween(checkInDate, checkOutDate)
    : (selectedRooms[0]?.nights || 1)

  const accommodationTotal = selectedRooms.reduce(
    (sum, room) => sum + room.price * room.quantity,
    0,
  )

  const selectedAnimal = hasAnimal
    ? hotelAnimals.value.find(item => item.id === animalId)
    : undefined

  const huntDateLabel = huntDateRaw
    ? formatBookingDateFromDisplay(huntDateRaw)
    : ''

  const stayCheckInLabel = stay?.checkIn
    ? formatBookingDateFromDisplay(stay.checkIn)
    : (huntDateLabel || formatBookingDate(new Date()))
  const stayCheckOutLabel = stay?.checkOut
    ? formatBookingDateFromDisplay(stay.checkOut)
    : (checkOutDate ? formatBookingDate(checkOutDate) : '')

  setDraft({
    hotelId,
    hotelTitle: currentHotel.title,
    hotelSlug: currentHotel.slug,
    locationSlug: String(route.params.location || ''),
    hotelImage: currentHotel.image || '',
    checkIn: stayCheckInLabel,
    checkOut: stayCheckOutLabel,
    nights,
    adults,
    rooms: selectedRooms,
    accommodationTotal,
    huntCheckIn: huntDateLabel,
    huntCheckOut: huntDateLabel,
    hunters: hasAnimal ? hunters : 0,
    animalTitle: selectedAnimal?.title || '',
    animalImage: selectedAnimal?.image_url || '',
    huntDate: huntDateLabel,
    organizationFee: animalAvailabilityTotal.value,
    trophyFee: 0,
    bookingNumber: '—',
    bookingDate: formatBookingDate(new Date()),
    paymentMethod: '—',
    statusLabel: 'Ожидает подтверждения',
    email: user.value?.email || '',
    specialRequirements: '',
    hasAccommodation: selectedRooms.length > 0,
    hasHunt: hasAnimal,
    createPayload: {
      hotel_id: hotelId,
      ...(hasAnimal ? { animal_id: animalId } : {}),
      check_in: checkIn,
      check_out: checkOut,
      adults,
      hunters,
      rooms,
    },
  })

  emit('book')

  await navigateTo({
    path: confirmationPath.value,
  })
}

function handleBook() {
  const animalId = animalsSearchRef.value?.getSelectedAnimalId() || ''
  const rooms = roomSelectionRef.value?.getSelectedRooms() || []
  const hasRooms = rooms.length > 0
  const stay = datesGuestsRef.value?.getBookingPayload()
  const hunters = animalsSearchRef.value?.getHunters() ?? 1
  const bookingAdults = getBookingAdults(stay?.adults, hunters, hasRooms)

  if (hasRooms && !validateRoomsAgainstGuests(bookingAdults, rooms)) {
    return
  }

  if (!hasRooms) {
    isNoRoomConfirmOpen.value = true
    return
  }

  if (!animalId) {
    isNoHuntConfirmOpen.value = true
    return
  }

  void proceedBook()
}

function closeNoHuntConfirm() {
  isNoHuntConfirmOpen.value = false
}

function closeNoRoomConfirm() {
  isNoRoomConfirmOpen.value = false
}

function closeAnimalWarning() {
  isAnimalWarningOpen.value = false
}

function closeHuntDateWarning() {
  isHuntDateWarningOpen.value = false
}

function closeStayDateWarning() {
  isStayDateWarningOpen.value = false
}

function handleConfirmKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeNoHuntConfirm()
    closeNoRoomConfirm()
    closeAnimalWarning()
    closeHuntDateWarning()
    closeStayDateWarning()
    closeApiMessage()
  }
}

watch(isAnyModalOpen, (isOpen) => {
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

useBodyScrollLock(isAnyModalOpen)

watch(
  [() => hotel.value?.id, datesGuestsRef],
  () => {
    tryAutoCheckFromSearch()
  },
  // Template ref обновляется после render — без post автопоиск часто пропускается.
  { flush: 'post' },
)

onMounted(() => {
  tryAutoCheckFromSearch()
})
</script>

<template>
  <section class="hotel-booking-section" :style="sectionStyle">
    <div class="hotel-booking-section__card">
      <div class="hotel-booking-section__blocks">
        <div class="hotel-booking-section__rooms-block">
          <HotelDatesGuests
            ref="datesGuestsRef"
            :loading="isCheckingAvailability"
            @check="handleCheck"
            @clear="availableRooms = []; hasCheckedAvailability = false; hasSelectedRooms = false; selectedRoomsCount = 0"
            @dates-change="handleStayDatesChange"
            @adults-change="handleAdultsChange"
          />

          <p
            v-if="hasCheckedAvailability && !isCheckingAvailability && !availableRooms.length"
            class="hotel-booking-section__rooms-empty"
            role="status"
          >
            По запросу свободных номеров не найдено
          </p>

          <HotelRoomSelection
            v-else
            ref="roomSelectionRef"
            :rooms="availableRooms"
            :adults="stayAdults"
            @selection-change="handleRoomSelectionChange"
          />

          <p
            v-if="roomsExceedGuests"
            class="hotel-booking-section__rooms-error"
            role="alert"
          >
            {{ ROOMS_EXCEED_GUESTS_MESSAGE }}
          </p>
        </div>

        <div class="hotel-booking-section__animals-block">
          <HotelAnimalsSearch
            ref="animalsSearchRef"
            :animals="hotelAnimals"
            :animals-pending="hotelPending && !hotel"
            :stay-check-in="stayCheckIn"
            :stay-check-out="stayCheckOut"
            :loading="isCheckingAnimals"
            @check="handleAnimalsCheck"
          />

          <div
            v-if="animalAvailability"
            class="hotel-booking-section__animal-result"
          >
            <div class="hotel-booking-section__animal-success" role="status">
              На этот день есть охота на животное. Можете продолжить бронирование
            </div>

            <div class="hotel-booking-section__animal-summary">
              <div class="hotel-booking-section__animal-summary-item">
                <span class="hotel-booking-section__animal-summary-label">Всего охотников:</span>
                <span class="hotel-booking-section__animal-summary-value">{{ animalAvailability.hunters }}</span>
              </div>
              <div class="hotel-booking-section__animal-summary-item">
                <span class="hotel-booking-section__animal-summary-label">Общая стоимость:</span>
                <span class="hotel-booking-section__animal-summary-price">{{ formatHotelPriceLabel(animalAvailabilityTotal) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Transition name="hotel-booking-book">
        <button
          type="button"
          class="hotel-booking-section__book"
          :disabled="roomsExceedGuests || !(hasSelectedRooms || animalAvailability)"
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

      <Transition name="hotel-booking-confirm">
        <div
          v-if="isNoRoomConfirmOpen"
          class="hotel-booking-confirm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="hotel-no-room-confirm-title"
          @click.self="closeNoRoomConfirm"
        >
          <div class="hotel-booking-confirm__card">
            <CommonModalCloseButton @click="closeNoRoomConfirm" />

            <h2 id="hotel-no-room-confirm-title" class="hotel-booking-confirm__title">
              Вы уверены, что хотите забронировать охоту без номера?
            </h2>

            <div class="hotel-booking-confirm__actions">
              <button
                type="button"
                class="hotel-booking-confirm__btn hotel-booking-confirm__btn--secondary"
                @click="closeNoRoomConfirm"
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

      <Transition name="hotel-booking-confirm">
        <div
          v-if="isStayDateWarningOpen"
          class="hotel-booking-confirm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="hotel-stay-date-warning-title"
          @click.self="closeStayDateWarning"
        >
          <div class="hotel-booking-confirm__card">
            <CommonModalCloseButton @click="closeStayDateWarning" />

            <h2 id="hotel-stay-date-warning-title" class="hotel-booking-confirm__title">
              Пожалуйста, выберите дату
            </h2>

            <div class="hotel-booking-confirm__actions">
              <button
                type="button"
                class="hotel-booking-confirm__btn hotel-booking-confirm__btn--primary"
                @click="closeStayDateWarning"
              >
                Хорошо
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <Transition name="hotel-booking-confirm">
        <div
          v-if="isAnimalWarningOpen"
          class="hotel-booking-confirm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="hotel-animal-warning-title"
          @click.self="closeAnimalWarning"
        >
          <div class="hotel-booking-confirm__card">
            <CommonModalCloseButton @click="closeAnimalWarning" />

            <h2 id="hotel-animal-warning-title" class="hotel-booking-confirm__title">
              {{ animalWarningTitle }}
            </h2>

            <div class="hotel-booking-confirm__actions">
              <button
                type="button"
                class="hotel-booking-confirm__btn hotel-booking-confirm__btn--primary"
                @click="closeAnimalWarning"
              >
                Хорошо
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <Transition name="hotel-booking-confirm">
        <div
          v-if="isHuntDateWarningOpen"
          class="hotel-booking-confirm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="hotel-hunt-date-warning-title"
          @click.self="closeHuntDateWarning"
        >
          <div class="hotel-booking-confirm__card">
            <CommonModalCloseButton @click="closeHuntDateWarning" />

            <h2 id="hotel-hunt-date-warning-title" class="hotel-booking-confirm__title">
              Пожалуйста, выберите дату охоты
            </h2>

            <div class="hotel-booking-confirm__actions">
              <button
                type="button"
                class="hotel-booking-confirm__btn hotel-booking-confirm__btn--primary"
                @click="closeHuntDateWarning"
              >
                Хорошо
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <Transition name="hotel-booking-confirm">
        <div
          v-if="isApiMessageOpen"
          class="hotel-booking-confirm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="hotel-api-message-title"
          @click.self="closeApiMessage"
        >
          <div class="hotel-booking-confirm__card">
            <CommonModalCloseButton @click="closeApiMessage" />

            <h2 id="hotel-api-message-title" class="hotel-booking-confirm__title">
              {{ apiMessage }}
            </h2>

            <div class="hotel-booking-confirm__actions">
              <button
                type="button"
                class="hotel-booking-confirm__btn hotel-booking-confirm__btn--primary"
                @click="closeApiMessage"
              >
                Хорошо
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

.hotel-booking-section__rooms-block {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
}

.hotel-booking-section__rooms-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(100%, var(--hotel-booking-blocks-width, 100%));
  margin-inline: auto;
  min-height: 72px;
  padding: 20px 28px;
  border: 1px solid var(--wh-field-border);
  border-radius: var(--wh-radius-lg);
  background: var(--wh-white);
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: -0.03em;
  color: var(--wh-black-text);
  text-align: center;
}

.hotel-booking-section__rooms-error {
  width: min(100%, var(--hotel-booking-blocks-width, 100%));
  margin: 0 auto;
  padding: 16px 20px;
  border-radius: var(--wh-radius-lg);
  background: color-mix(in srgb, var(--wh-orange-500) 12%, white);
  color: var(--wh-orange-600);
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: -0.02em;
  text-align: center;
}

.hotel-booking-section__animals-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.hotel-booking-section__animal-result {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: min(100%, var(--hotel-booking-blocks-width, 100%));
}

.hotel-booking-section__animal-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  min-height: 72px;
  border: 1px solid var(--wh-field-border);
  border-radius: var(--wh-radius-lg);
  background: var(--wh-white);
  overflow: hidden;
}

.hotel-booking-section__animal-summary-item {
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

.hotel-booking-section__animal-summary-item + .hotel-booking-section__animal-summary-item {
  border-left: 1px solid var(--wh-field-border);
}

.hotel-booking-section__animal-summary-label {
  color: var(--wh-black-text);
}

.hotel-booking-section__animal-summary-value {
  font-weight: 600;
}

.hotel-booking-section__animal-summary-price {
  font-weight: 700;
  color: var(--wh-orange-500);
  white-space: nowrap;
}

.hotel-booking-section__animal-success {
  padding: 16px 20px;
  border-radius: var(--wh-radius-lg);
  background: color-mix(in srgb, var(--wh-green) 12%, white);
  color: var(--wh-green);
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: -0.02em;
  text-align: center;
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

.hotel-booking-section__book:hover:not(:disabled) {
  background: color-mix(in srgb, var(--wh-green) 78%, white);
  transform: var(--wh-button-hover-lift);
}

.hotel-booking-section__book:disabled {
  opacity: 0.7;
  cursor: wait;
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
  /* Blur stays on a non-fading layer; animating opacity + backdrop-filter
     briefly inflates box-shadows on the search blocks behind. */
  isolation: isolate;
}

.hotel-booking-confirm::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: rgba(17, 24, 39, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  pointer-events: none;
}

.hotel-booking-confirm__card {
  position: relative;
  width: 480px;
  min-width: min(100%, var(--wh-auth-modal-width));
  max-width: 100%;
  padding: 48px 36px 32px;
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
  text-align: center;
  transition: opacity 0.2s ease, transform 0.2s ease;
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
  /* Duration only — root opacity stays 1 so backdrop-filter does not bloom. */
  transition: visibility 0.2s linear;
}

.hotel-booking-confirm-enter-from,
.hotel-booking-confirm-leave-to {
  visibility: visible;
}

.hotel-booking-confirm-enter-from .hotel-booking-confirm__card,
.hotel-booking-confirm-leave-to .hotel-booking-confirm__card {
  opacity: 0;
  transform: translateY(8px);
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

  .hotel-booking-section__animal-summary {
    grid-template-columns: 1fr;
  }

  .hotel-booking-section__animal-summary-item + .hotel-booking-section__animal-summary-item {
    border-left: none;
    border-top: 1px solid var(--wh-field-border);
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
