<script setup lang="ts">
import type { SearchAnimal, SearchLocation } from '~/types/api'
import { formatDisplayDate, parseDisplayDate, startOfDay } from '~/utils/date'

withDefaults(defineProps<{
  layout?: 'inline' | 'split'
  loading?: boolean
}>(), {
  layout: 'inline',
  loading: false,
})

const emit = defineEmits<{
  search: [payload: Record<string, string>]
}>()

const route = useRoute()
const { location: locationApi, animals: animalsApi } = useApi()

const DEFAULT_CHECK_IN = '04.02.26'
const DEFAULT_CHECK_OUT = '05.02.26'
const maxAdults = 100

function queryString(key: string): string {
  const value = route.query[key]
  return Array.isArray(value) ? String(value[0] || '') : String(value || '')
}

function hasSearchQuery() {
  return (
    'location' in route.query
    || 'animal' in route.query
    || 'checkIn' in route.query
    || 'checkOut' in route.query
    || 'guests' in route.query
  )
}

function adultsFromQuery() {
  const count = Number(queryString('guests'))
  if (!Number.isFinite(count) || count < 1) {
    return 1
  }

  return Math.min(maxAdults, Math.floor(count))
}

const location = ref(hasSearchQuery() ? queryString('location') : '')
const animal = ref(hasSearchQuery() ? queryString('animal') : '')
const checkIn = ref<Date | null>(
  hasSearchQuery()
    ? (parseDisplayDate(queryString('checkIn')) ?? parseDisplayDate(DEFAULT_CHECK_IN))
    : parseDisplayDate(DEFAULT_CHECK_IN),
)
const checkOut = ref<Date | null>(
  hasSearchQuery()
    ? (parseDisplayDate(queryString('checkOut')) ?? parseDisplayDate(DEFAULT_CHECK_OUT))
    : parseDisplayDate(DEFAULT_CHECK_OUT),
)
const adultsCount = ref(hasSearchQuery() ? adultsFromQuery() : 1)

function hydrateFromRoute() {
  if (!hasSearchQuery()) {
    return
  }

  location.value = queryString('location')
  animal.value = queryString('animal')
  checkIn.value = parseDisplayDate(queryString('checkIn')) ?? parseDisplayDate(DEFAULT_CHECK_IN)
  checkOut.value = parseDisplayDate(queryString('checkOut')) ?? parseDisplayDate(DEFAULT_CHECK_OUT)
  adultsCount.value = adultsFromQuery()
}

watch(
  () => [
    route.query.location,
    route.query.animal,
    route.query.checkIn,
    route.query.checkOut,
    route.query.guests,
  ],
  () => {
    hydrateFromRoute()
  },
)
const isLocationOpen = ref(false)
const isAnimalOpen = ref(false)
const isGuestsOpen = ref(false)
const isDatesOpen = ref(false)
const activeDatePart = ref<'start' | 'end' | null>(null)
const locationFieldRef = ref<HTMLElement | null>(null)
const animalFieldRef = ref<HTMLElement | null>(null)
const guestsFieldRef = ref<HTMLElement | null>(null)
const datesFieldRef = ref<HTMLElement | null>(null)
const hoveredLocationId = ref<string | null>(null)
const hoveredAnimalId = ref<string | null>(null)

const { data: locations, pending: locationsLoading } = useAsyncData<SearchLocation[]>(
  'search-locations',
  () => locationApi.getLocationItems(),
  {
    lazy: true,
    default: () => [],
  },
)

const { data: animals, pending: animalsLoading } = useAsyncData<SearchAnimal[]>(
  'search-animals',
  () => animalsApi.getAnimalItems(),
  {
    lazy: true,
    default: () => [],
  },
)

const selectedLocation = computed(() =>
  locations.value?.find(item => String(item.id) === location.value),
)

const locationLabel = computed(() => {
  if (selectedLocation.value) {
    return selectedLocation.value.name
  }

  return 'Куда вы собираетесь?'
})

const selectedAnimal = computed(() =>
  animals.value?.find(item => String(item.id) === animal.value),
)

const animalLabel = computed(() => {
  if (selectedAnimal.value) {
    return selectedAnimal.value.title
  }

  return 'На кого будет охота?'
})

function formatAdultsLabel(count: number) {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} взрослый`
  }

  return `${count} взрослых`
}

const guestsLabel = computed(() => formatAdultsLabel(adultsCount.value))

const checkInLabel = computed(() =>
  checkIn.value ? formatDisplayDate(checkIn.value) : 'Заезд',
)

const checkOutLabel = computed(() =>
  checkOut.value ? formatDisplayDate(checkOut.value) : 'Выезд',
)

const dateRangeLabel = computed(() => {
  if (!checkIn.value) {
    return 'Выберите даты'
  }

  if (!checkOut.value) {
    return checkInLabel.value
  }

  return `${checkInLabel.value} - ${checkOutLabel.value}`
})

const hasCustomDates = computed(() => {
  if (!checkIn.value || !checkOut.value) {
    return false
  }

  const defaultStart = parseDisplayDate(DEFAULT_CHECK_IN)
  const defaultEnd = parseDisplayDate(DEFAULT_CHECK_OUT)

  if (!defaultStart || !defaultEnd) {
    return true
  }

  return !(
    startOfDay(checkIn.value).getTime() === startOfDay(defaultStart).getTime()
    && startOfDay(checkOut.value).getTime() === startOfDay(defaultEnd).getTime()
  )
})

const isAnyDropdownOpen = computed(() =>
  isLocationOpen.value || isAnimalOpen.value || isGuestsOpen.value || isDatesOpen.value,
)

function closeOtherDropdowns(except?: 'location' | 'animal' | 'guests' | 'dates') {
  if (except !== 'location') {
    isLocationOpen.value = false
  }

  if (except !== 'animal') {
    isAnimalOpen.value = false
  }

  if (except !== 'guests') {
    isGuestsOpen.value = false
  }

  if (except !== 'dates') {
    isDatesOpen.value = false
    activeDatePart.value = null
  }
}

function toggleLocationDropdown() {
  if (locationsLoading.value) {
    return
  }

  isLocationOpen.value = !isLocationOpen.value
  closeOtherDropdowns(isLocationOpen.value ? 'location' : undefined)
}

function toggleAnimalDropdown() {
  if (animalsLoading.value) {
    return
  }

  isAnimalOpen.value = !isAnimalOpen.value
  closeOtherDropdowns(isAnimalOpen.value ? 'animal' : undefined)
}

function toggleGuestsDropdown() {
  isGuestsOpen.value = !isGuestsOpen.value
  closeOtherDropdowns(isGuestsOpen.value ? 'guests' : undefined)
}

function openDatesFor(part: 'start' | 'end') {
  if (isDatesOpen.value && activeDatePart.value === part) {
    closeDatesDropdown()
    return
  }

  isDatesOpen.value = true
  activeDatePart.value = part
  closeOtherDropdowns('dates')
}

function toggleDatesDropdown() {
  if (isDatesOpen.value) {
    closeDatesDropdown()
    return
  }

  openDatesFor('start')
}

function onDatesFieldClick(event: MouseEvent) {
  const target = event.target as HTMLElement

  if (target.closest('.hero-search__date-part, .hero-search__clear, .hero-search__dates-chevron, .hero-search__dropdown-panel')) {
    return
  }

  openDatesFor('start')
}

function incrementAdults() {
  if (adultsCount.value < maxAdults) {
    adultsCount.value += 1
  }
}

function decrementAdults() {
  if (adultsCount.value > 1) {
    adultsCount.value -= 1
  }
}

function selectLocation(item: SearchLocation) {
  location.value = String(item.id)
  isLocationOpen.value = false
}

function selectAnimal(item: SearchAnimal) {
  animal.value = String(item.id)
  isAnimalOpen.value = false
}

function clearLocationHover() {
  hoveredLocationId.value = null
}

function clearAnimalHover() {
  hoveredAnimalId.value = null
}

function setLocationHover(id: string | number) {
  hoveredLocationId.value = String(id)
}

function setAnimalHover(id: string | number) {
  hoveredAnimalId.value = String(id)
}

function setLocationHoverFromEvent(event: MouseEvent) {
  const option = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-location-id]')
  hoveredLocationId.value = option?.dataset.locationId ?? null
}

function setAnimalHoverFromEvent(event: MouseEvent) {
  const option = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-animal-id]')
  hoveredAnimalId.value = option?.dataset.animalId ?? null
}

function closeLocationDropdown() {
  isLocationOpen.value = false
  clearLocationHover()
}

function closeAnimalDropdown() {
  isAnimalOpen.value = false
  clearAnimalHover()
}

function closeGuestsDropdown() {
  isGuestsOpen.value = false
}

function closeDatesDropdown() {
  isDatesOpen.value = false
  activeDatePart.value = null
}

function handleDocumentClick(event: MouseEvent) {
  if (!locationFieldRef.value?.contains(event.target as Node)) {
    closeLocationDropdown()
  }

  if (!animalFieldRef.value?.contains(event.target as Node)) {
    closeAnimalDropdown()
  }

  if (!guestsFieldRef.value?.contains(event.target as Node)) {
    closeGuestsDropdown()
  }

  if (!datesFieldRef.value?.contains(event.target as Node)) {
    closeDatesDropdown()
  }
}

function clearLocation(event: MouseEvent) {
  event.stopPropagation()
  location.value = ''
  isLocationOpen.value = false
}

function clearAnimal(event: MouseEvent) {
  event.stopPropagation()
  animal.value = ''
  isAnimalOpen.value = false
}

function clearGuests(event: MouseEvent) {
  event.stopPropagation()
  adultsCount.value = 1
  isGuestsOpen.value = false
}

function clearDates(event: MouseEvent) {
  event.stopPropagation()
  checkIn.value = parseDisplayDate(DEFAULT_CHECK_IN)
  checkOut.value = parseDisplayDate(DEFAULT_CHECK_OUT)
  closeDatesDropdown()
}

function submitSearch() {
  emit('search', {
    location: location.value,
    animal: animal.value,
    dates: dateRangeLabel.value,
    checkIn: checkIn.value ? formatDisplayDate(checkIn.value) : '',
    checkOut: checkOut.value ? formatDisplayDate(checkOut.value) : '',
    guests: String(adultsCount.value),
  })
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <form
    class="hero-search"
    :class="{
      'hero-search--split': layout === 'split',
      'hero-search--dropdown-open': isAnyDropdownOpen,
    }"
    @submit.prevent="submitSearch"
  >
    <div class="hero-search__panel">
      <div
        ref="locationFieldRef"
        class="hero-search__field hero-search__field--location"
        :class="{ 'hero-search__field--open': isLocationOpen }"
      >
      <span class="hero-search__label">Локация</span>
      <button
        type="button"
        class="hero-search__control hero-search__dropdown-trigger"
        :class="{ 'hero-search__dropdown-trigger--placeholder': !selectedLocation }"
        :disabled="locationsLoading"
        @click="toggleLocationDropdown"
      >
        <span class="hero-search__dropdown-value">{{ locationLabel }}</span>
      </button>

      <button
        v-if="selectedLocation"
        type="button"
        class="hero-search__clear"
        aria-label="Очистить локацию"
        @click="clearLocation"
      >
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
      <svg v-else class="hero-search__chevron" viewBox="0 0 12 8" aria-hidden="true">
        <path d="M1 2 6 6.5 11 2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>

      <ul
        v-if="isLocationOpen && locations?.length"
        class="hero-search__dropdown-list"
        role="listbox"
        aria-label="Локация"
        @pointerleave="clearLocationHover"
        @mouseleave="clearLocationHover"
        @mousemove="setLocationHoverFromEvent"
        @pointermove="setLocationHoverFromEvent"
      >
        <li v-for="item in locations" :key="item.id">
          <button
            type="button"
            class="hero-search__dropdown-option"
            :data-location-id="item.id"
            :class="{
              'hero-search__dropdown-option--active': String(item.id) === location,
              'hero-search__dropdown-option--hovered': hoveredLocationId === String(item.id),
            }"
            @pointerenter="setLocationHover(item.id)"
            @pointerdown="setLocationHover(item.id)"
            @click="selectLocation(item)"
          >
            <span class="hero-search__dropdown-option-dot" aria-hidden="true" />
            <span class="hero-search__dropdown-option-label">{{ item.name }}</span>
          </button>
        </li>
      </ul>
    </div>

    <div
      ref="animalFieldRef"
      class="hero-search__field hero-search__field--animals"
      :class="{ 'hero-search__field--open': isAnimalOpen }"
    >
      <span class="hero-search__label">Животные</span>
      <button
        type="button"
        class="hero-search__control hero-search__dropdown-trigger"
        :class="{ 'hero-search__dropdown-trigger--placeholder': !selectedAnimal }"
        :disabled="animalsLoading"
        @click="toggleAnimalDropdown"
      >
        <span class="hero-search__dropdown-value">{{ animalLabel }}</span>
      </button>

      <button
        v-if="selectedAnimal"
        type="button"
        class="hero-search__clear"
        aria-label="Очистить животное"
        @click="clearAnimal"
      >
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
      <svg v-else class="hero-search__chevron" viewBox="0 0 12 8" aria-hidden="true">
        <path d="M1 2 6 6.5 11 2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>

      <ul
        v-if="isAnimalOpen && animals?.length"
        class="hero-search__dropdown-list"
        role="listbox"
        aria-label="Животные"
        @pointerleave="clearAnimalHover"
        @mouseleave="clearAnimalHover"
        @mousemove="setAnimalHoverFromEvent"
        @pointermove="setAnimalHoverFromEvent"
      >
        <li v-for="item in animals" :key="item.id">
          <button
            type="button"
            class="hero-search__dropdown-option"
            :data-animal-id="item.id"
            :class="{
              'hero-search__dropdown-option--active': String(item.id) === animal,
              'hero-search__dropdown-option--hovered': hoveredAnimalId === String(item.id),
            }"
            @pointerenter="setAnimalHover(item.id)"
            @pointerdown="setAnimalHover(item.id)"
            @click="selectAnimal(item)"
          >
            <span class="hero-search__dropdown-option-dot" aria-hidden="true" />
            <span class="hero-search__dropdown-option-label">{{ item.title }}</span>
          </button>
        </li>
      </ul>
    </div>

    <div
      ref="datesFieldRef"
      class="hero-search__field hero-search__field--dates"
      :class="{ 'hero-search__field--open': isDatesOpen }"
      @click="onDatesFieldClick"
    >
      <span class="hero-search__label">Заезд - Выезд</span>
      <div class="hero-search__control hero-search__dates-control">
        <button
          type="button"
          class="hero-search__date-part"
          :class="{ 'hero-search__date-part--active': isDatesOpen && activeDatePart === 'start' }"
          aria-label="Выбрать дату заезда"
          @click="openDatesFor('start')"
        >
          {{ checkInLabel }}
        </button>
        <span class="hero-search__dates-sep" aria-hidden="true">-</span>
        <button
          type="button"
          class="hero-search__date-part"
          :class="{ 'hero-search__date-part--active': isDatesOpen && activeDatePart === 'end' }"
          aria-label="Выбрать дату выезда"
          @click="openDatesFor('end')"
        >
          {{ checkOutLabel }}
        </button>
      </div>
      <button
        v-if="hasCustomDates"
        type="button"
        class="hero-search__clear"
        aria-label="Сбросить даты"
        @click="clearDates"
      >
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
      <button
        v-else
        type="button"
        class="hero-search__dates-chevron"
        aria-label="Открыть календарь"
        @click="toggleDatesDropdown"
      >
        <svg class="hero-search__chevron" viewBox="0 0 12 8" aria-hidden="true">
          <path d="M1 2 6 6.5 11 2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <div v-if="isDatesOpen" class="hero-search__dropdown-panel hero-search__dropdown-panel--calendar">
        <HomeHeroSearchDatePicker
          v-model:start="checkIn"
          v-model:end="checkOut"
          v-model:active-part="activeDatePart"
        />
      </div>
    </div>

    <div
      ref="guestsFieldRef"
      class="hero-search__field hero-search__field--guests"
      :class="{ 'hero-search__field--open': isGuestsOpen }"
    >
      <span class="hero-search__label">Гости</span>
      <button
        type="button"
        class="hero-search__control hero-search__dropdown-trigger"
        @click="toggleGuestsDropdown"
      >
        <span class="hero-search__dropdown-value">{{ guestsLabel }}</span>
      </button>
      <button
        v-if="adultsCount > 1"
        type="button"
        class="hero-search__clear"
        aria-label="Сбросить количество гостей"
        @click="clearGuests"
      >
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
      <svg v-else class="hero-search__chevron" viewBox="0 0 12 8" aria-hidden="true">
        <path d="M1 2 6 6.5 11 2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>

      <div v-if="isGuestsOpen" class="hero-search__dropdown-panel">
        <div class="hero-search__guest-row">
          <span class="hero-search__guest-label">Взрослые</span>
          <div class="hero-search__guest-stepper">
            <button
              type="button"
              class="hero-search__guest-btn"
              aria-label="Уменьшить количество взрослых"
              :disabled="adultsCount <= 1"
              @click="decrementAdults"
            >
              −
            </button>
            <span class="hero-search__guest-count">{{ adultsCount }}</span>
            <button
              type="button"
              class="hero-search__guest-btn"
              aria-label="Увеличить количество взрослых"
              :disabled="adultsCount >= maxAdults"
              @click="incrementAdults"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>

    <button
      type="submit"
      class="hero-search__submit"
      :class="{ 'hero-search__submit--loading': loading }"
      :disabled="loading"
      :aria-busy="loading"
    >
      <CommonSpinner
        v-if="loading"
        variant="ring"
        :size="22"
        color="var(--wh-white)"
        label="Поиск"
      />
      <span v-else>Искать</span>
    </button>
  </form>
</template>

<style scoped>
.hero-search {
  display: flex;
  align-items: stretch;
  gap: 2px;
  width: 1200px;
  max-width: 100%;
  height: 81px;
  background: transparent;
  box-shadow: none;
  overflow: visible;
}

.hero-search__panel {
  display: flex;
  flex: 1;
  align-items: stretch;
  gap: 2px;
  min-width: 0;
  background: transparent;
  box-shadow: none;
  overflow: visible;
}

.hero-search--split {
  gap: 2px;
  width: 1200px;
  max-width: 100%;
  background: transparent;
  box-shadow: none;
}

.hero-search--split .hero-search__panel {
  gap: 2px;
  background: transparent;
  box-shadow: none;
  overflow: visible;
}

.hero-search--split .hero-search__submit {
  flex: 0 0 148px;
  height: 81px;
  border-radius: var(--wh-radius-lg);
  box-shadow: var(--wh-shadow);
}

.hero-search__field {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  height: 81px;
  padding: 16px 22px;
  border-radius: var(--wh-radius-lg);
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
  cursor: pointer;
}

.hero-search__field--location,
.hero-search__field--animals,
.hero-search__field--guests,
.hero-search__field--dates {
  z-index: 2;
}

.hero-search__field--open {
  z-index: 50;
}

.hero-search--dropdown-open .hero-search__field:not(.hero-search__field--open) {
  pointer-events: none;
}

.hero-search--dropdown-open .hero-search__submit {
  pointer-events: none;
}

.hero-search__field--open .hero-search__dropdown-list,
.hero-search__field--open .hero-search__dropdown-panel {
  z-index: 60;
}

.hero-search__field--location {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.hero-search__field--animals .hero-search__dropdown-list {
  border-radius: 0;
}

.hero-search__field--animals,
.hero-search__field--dates {
  border-radius: 0;
}

.hero-search__field--guests {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.hero-search__field--guests .hero-search__dropdown-panel {
  border-radius: 0 var(--wh-radius-lg) var(--wh-radius-lg) 0;
}

.hero-search__label {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: -0.05em;
  color: #1c211c;
  opacity: 0.4;
}

.hero-search__control {
  display: flex;
  align-items: center;
  min-height: 18px;
  padding-right: 28px;
}

.hero-search__control input,
.hero-search__control select,
.hero-search__dropdown-trigger {
  flex: 1;
  min-width: 0;
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.05em;
  color: #1c211c;
  outline: none;
  cursor: pointer;
}

.hero-search__control input:not([readonly]) {
  cursor: text;
}

.hero-search__dropdown-trigger {
  cursor: pointer;
  text-align: left;
}

.hero-search__dropdown-trigger--placeholder .hero-search__dropdown-value {
  color: #1c211c;
}

.hero-search__dropdown-trigger:disabled {
  cursor: not-allowed;
}

.hero-search__dropdown-trigger:disabled .hero-search__dropdown-value {
  color: rgb(28 33 28 / 50%);
}

.hero-search__dropdown-value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
  letter-spacing: inherit;
  color: inherit;
}

.hero-search__dates-control {
  gap: 0;
  padding-right: 28px;
}

.hero-search__date-part {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 50%;
  padding: 2px 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.05em;
  color: #1c211c;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  outline: none;
  transition: color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.hero-search__date-part--active {
  color: var(--wh-orange-500);
  animation: hero-search-date-part-pulse 1.4s ease-in-out infinite;
}

.hero-search__dates-sep {
  flex-shrink: 0;
  margin: 0 6px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.05em;
  color: #1c211c;
  opacity: 0.45;
  user-select: none;
}

.hero-search__dates-chevron {
  position: absolute;
  top: 50%;
  right: 18px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  transform: translateY(-50%);
}

.hero-search__dates-chevron .hero-search__chevron {
  position: static;
  transform: none;
}

.hero-search__field--open .hero-search__dates-chevron .hero-search__chevron {
  transform: rotate(180deg);
}

@keyframes hero-search-date-part-pulse {
  0%,
  100% {
    background: rgb(209 101 16 / 0%);
    box-shadow: 0 0 0 0 rgb(209 101 16 / 0%);
  }

  50% {
    background: rgb(209 101 16 / 10%);
    box-shadow: 0 0 0 3px rgb(209 101 16 / 8%);
  }
}

.hero-search__control input::placeholder {
  color: #1c211c;
  opacity: 1;
}

.hero-search__control select {
  appearance: none;
}

.hero-search__dropdown-list {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 50;
  margin: 0;
  padding: 6px 8px;
  list-style: none;
  border: 1px solid var(--wh-gray);
  border-radius: 14px 0 0 14px;
  background: var(--wh-white);
  color: var(--wh-black-text);
  overflow: hidden;
  pointer-events: auto;
}

.hero-search__dropdown-panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 20;
  padding: 14px 16px;
  border: 1px solid var(--wh-gray);
  border-radius: 14px;
  background: var(--wh-white);
  color: var(--wh-black-text);
}

.hero-search__dropdown-panel--calendar {
  padding: 18px 20px;
  border-radius: 0;
}

.hero-search__guest-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.hero-search__guest-label {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.05em;
  color: var(--wh-black-text);
}

.hero-search__guest-stepper {
  display: flex;
  align-items: center;
  gap: 18px;
}

.hero-search__guest-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--wh-black-text);
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 1.25rem;
  font-weight: 400;
  line-height: 1;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.hero-search__guest-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.hero-search__guest-btn:not(:disabled):hover {
  opacity: 0.6;
}

.hero-search__guest-count {
  min-width: 12px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.05em;
  color: var(--wh-black-text);
  text-align: center;
}

.hero-search__dropdown-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  border: none;
  border-radius: 10px;
  appearance: none;
  -webkit-appearance: none;
  background-color: transparent;
  color: var(--wh-black-text);
  font: inherit;
  font-size: 0.98rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.hero-search__dropdown-option-dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: transparent;
}

.hero-search__dropdown-option-label {
  min-width: 0;
}

.hero-search__dropdown-option:hover,
.hero-search__dropdown-option--hovered,
.hero-search__dropdown-option:focus-visible {
  background-color: #e8883a;
  color: #ffffff;
}

.hero-search__dropdown-option--active .hero-search__dropdown-option-dot {
  background-color: #d16510;
}

.hero-search__dropdown-option--active:hover .hero-search__dropdown-option-dot,
.hero-search__dropdown-option--active.hero-search__dropdown-option--hovered .hero-search__dropdown-option-dot,
.hero-search__dropdown-option--active:focus-visible .hero-search__dropdown-option-dot {
  background-color: #ffffff;
}

.hero-search__chevron {
  position: absolute;
  top: 50%;
  right: 22px;
  flex-shrink: 0;
  width: 12px;
  height: 8px;
  color: #1c211c;
  pointer-events: none;
  transform: translateY(-50%);
  transition: transform 0.2s ease;
}

.hero-search__field--open .hero-search__chevron {
  transform: translateY(-50%) rotate(180deg);
}

.hero-search__clear {
  position: absolute;
  top: 50%;
  right: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: transparent;
  color: #1c211c;
  cursor: pointer;
  transform: translateY(-50%);
  transition: opacity 0.15s ease;
}

.hero-search__clear svg {
  width: 12px;
  height: 12px;
}

.hero-search__clear:hover {
  opacity: 0.6;
}

.hero-search__submit {
  position: relative;
  z-index: 1;
  flex: 0 0 148px;
  height: 81px;
  border: none;
  border-radius: var(--wh-radius-lg);
  background: var(--wh-orange-500);
  color: var(--wh-white);
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--wh-shadow);
  transition: background 0.15s ease;
}

.hero-search__submit:hover {
  background: var(--wh-orange-600);
}

.hero-search__submit:disabled,
.hero-search__submit--loading {
  cursor: wait;
}

.hero-search__submit:disabled:hover,
.hero-search__submit--loading:hover {
  background: var(--wh-orange-500);
}

@media (--wh-tablet) {
  .hero-search,
  .hero-search.hero-search--split {
    display: grid;
    grid-template-columns: repeat(10, minmax(0, 1fr));
    column-gap: 2px;
    row-gap: 0;
    width: 100%;
    height: auto;
  }

  .hero-search__panel,
  .hero-search--split .hero-search__panel {
    display: contents;
  }

  .hero-search__field {
    height: auto;
    min-height: 72px;
  }

  .hero-search__field--location {
    grid-column: 1 / 6;
    grid-row: 1;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }

  .hero-search__field--animals {
    grid-column: 6 / 11;
    grid-row: 1;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-top-right-radius: var(--wh-radius-lg);
    border-bottom-right-radius: var(--wh-radius-lg);
  }

  .hero-search__field--animals .hero-search__dropdown-list {
    border-radius: 0 var(--wh-radius-lg) var(--wh-radius-lg) 0;
  }

  .hero-search__field--dates {
    grid-column: 1 / 5;
    grid-row: 2;
    margin-top: 2px;
    border-top-left-radius: var(--wh-radius-lg);
    border-bottom-left-radius: var(--wh-radius-lg);
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }

  .hero-search__field--dates .hero-search__dropdown-panel--calendar {
    border-radius: var(--wh-radius-lg) 0 0 var(--wh-radius-lg);
  }

  .hero-search__field--guests {
    grid-column: 5 / 9;
    grid-row: 2;
    margin-top: 2px;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-top-right-radius: var(--wh-radius-lg);
    border-bottom-right-radius: var(--wh-radius-lg);
  }

  .hero-search__field--guests .hero-search__dropdown-panel {
    border-radius: 0 var(--wh-radius-lg) var(--wh-radius-lg) 0;
  }

  .hero-search__submit,
  .hero-search--split .hero-search__submit {
    grid-column: 9 / 11;
    grid-row: 2;
    width: auto;
    flex: none;
    min-height: 72px;
    height: auto;
    margin-top: 2px;
    border-radius: var(--wh-radius-lg);
  }
}

@media (--wh-mobile) {
  .hero-search,
  .hero-search.hero-search--split {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
    column-gap: 2px;
    row-gap: 2px;
    width: 100%;
    height: auto;
  }

  .hero-search__panel,
  .hero-search--split .hero-search__panel {
    display: contents;
  }

  .hero-search__field--location {
    grid-column: 1 / -1;
    grid-row: 1;
    margin-top: 0;
    border-radius: var(--wh-radius-lg);
  }

  .hero-search__field--location .hero-search__dropdown-list {
    border-radius: var(--wh-radius-lg);
  }

  .hero-search__field--animals {
    grid-column: 1 / -1;
    grid-row: 2;
    margin-top: 0;
    border-radius: var(--wh-radius-lg);
  }

  .hero-search__field--animals .hero-search__dropdown-list {
    top: auto;
    bottom: calc(100% + 4px);
    border-radius: var(--wh-radius-lg);
  }

  .hero-search__field--dates {
    grid-column: 1 / -1;
    grid-row: 3;
    margin-top: 0;
    border-radius: var(--wh-radius-lg);
  }

  .hero-search__field--dates .hero-search__dropdown-panel--calendar {
    top: auto;
    bottom: calc(100% + 4px);
    left: 0;
    right: 0;
    width: 100%;
    max-width: none;
    border-radius: var(--wh-radius-lg);
  }

  .hero-search__field--guests {
    grid-column: 1;
    grid-row: 4;
    margin-top: 0;
    border-top-left-radius: var(--wh-radius-lg);
    border-bottom-left-radius: var(--wh-radius-lg);
    border-top-right-radius: var(--wh-radius-lg);
    border-bottom-right-radius: var(--wh-radius-lg);
  }

  .hero-search__field--guests .hero-search__dropdown-panel {
    border-radius: var(--wh-radius-lg);
  }

  .hero-search__submit,
  .hero-search--split .hero-search__submit {
    grid-column: 2;
    grid-row: 4;
    width: auto;
    flex: none;
    min-height: 72px;
    height: auto;
    margin-top: 0;
    border-radius: var(--wh-radius-lg);
  }
}
</style>
