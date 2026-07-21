<script setup lang="ts">
import type { SearchAnimal, SearchLocation } from '~/types/api'
import { formatDisplayDate, parseDisplayDate, startOfDay } from '~/utils/date'

withDefaults(defineProps<{
  layout?: 'inline' | 'split'
}>(), {
  layout: 'inline',
})

const emit = defineEmits<{
  search: [payload: Record<string, string>]
}>()

const { location: locationApi, animals: animalsApi } = useApi()

const location = ref('')
const animal = ref('')
const checkIn = ref<Date | null>(parseDisplayDate('04.02.26'))
const checkOut = ref<Date | null>(parseDisplayDate('05.02.26'))
const adultsCount = ref(1)
const maxAdults = 100
const isLocationOpen = ref(false)
const isAnimalOpen = ref(false)
const isGuestsOpen = ref(false)
const isDatesOpen = ref(false)
const locationFieldRef = ref<HTMLElement | null>(null)
const animalFieldRef = ref<HTMLElement | null>(null)
const guestsFieldRef = ref<HTMLElement | null>(null)
const datesFieldRef = ref<HTMLElement | null>(null)

const { data: locations, pending: locationsLoading } = useAsyncData<SearchLocation[]>(
  'search-locations',
  () => locationApi.getLocationItems(),
  {
    default: () => [],
  },
)

const { data: animals, pending: animalsLoading } = useAsyncData<SearchAnimal[]>(
  'search-animals',
  () => animalsApi.getAnimalItems(),
  {
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

  return locationsLoading.value ? 'Загрузка...' : 'Куда вы собираетесь?'
})

const selectedAnimal = computed(() =>
  animals.value?.find(item => String(item.id) === animal.value),
)

const animalLabel = computed(() => {
  if (selectedAnimal.value) {
    return selectedAnimal.value.title
  }

  return animalsLoading.value ? 'Загрузка...' : 'На кого будет охота?'
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

const dateRangeLabel = computed(() => {
  if (!checkIn.value) {
    return 'Выберите даты'
  }

  const startLabel = formatDisplayDate(checkIn.value)

  if (!checkOut.value) {
    return startLabel
  }

  return `${startLabel} - ${formatDisplayDate(checkOut.value)}`
})

const hasCustomDates = computed(() => {
  if (!checkIn.value || !checkOut.value) {
    return false
  }

  const defaultStart = parseDisplayDate('04.02.26')
  const defaultEnd = parseDisplayDate('05.02.26')

  if (!defaultStart || !defaultEnd) {
    return true
  }

  return !(
    startOfDay(checkIn.value).getTime() === startOfDay(defaultStart).getTime()
    && startOfDay(checkOut.value).getTime() === startOfDay(defaultEnd).getTime()
  )
})

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

function toggleDatesDropdown() {
  isDatesOpen.value = !isDatesOpen.value
  closeOtherDropdowns(isDatesOpen.value ? 'dates' : undefined)
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

function closeLocationDropdown() {
  isLocationOpen.value = false
}

function closeAnimalDropdown() {
  isAnimalOpen.value = false
}

function closeGuestsDropdown() {
  isGuestsOpen.value = false
}

function closeDatesDropdown() {
  isDatesOpen.value = false
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
  checkIn.value = parseDisplayDate('04.02.26')
  checkOut.value = parseDisplayDate('05.02.26')
  isDatesOpen.value = false
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
    :class="{ 'hero-search--split': layout === 'split' }"
    @submit.prevent="submitSearch"
  >
    <div class="hero-search__panel">
      <div
        ref="locationFieldRef"
        class="hero-search__field hero-search__field--location"
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

      <ul v-if="isLocationOpen && locations?.length" class="hero-search__dropdown-list">
        <li v-for="item in locations" :key="item.id">
          <button
            type="button"
            class="hero-search__dropdown-option"
            :class="{ 'hero-search__dropdown-option--active': String(item.id) === location }"
            @click="selectLocation(item)"
          >
            {{ item.name }}
          </button>
        </li>
      </ul>
    </div>

    <div
      ref="animalFieldRef"
      class="hero-search__field hero-search__field--animals"
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

      <ul v-if="isAnimalOpen && animals?.length" class="hero-search__dropdown-list">
        <li v-for="item in animals" :key="item.id">
          <button
            type="button"
            class="hero-search__dropdown-option"
            :class="{ 'hero-search__dropdown-option--active': String(item.id) === animal }"
            @click="selectAnimal(item)"
          >
            {{ item.title }}
          </button>
        </li>
      </ul>
    </div>

    <div
      ref="datesFieldRef"
      class="hero-search__field hero-search__field--dates"
    >
      <span class="hero-search__label">Заезд - Выезд</span>
      <button
        type="button"
        class="hero-search__control hero-search__dropdown-trigger"
        @click="toggleDatesDropdown"
      >
        <span class="hero-search__dropdown-value">{{ dateRangeLabel }}</span>
      </button>
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
      <svg v-else class="hero-search__chevron" viewBox="0 0 12 8" aria-hidden="true">
        <path d="M1 2 6 6.5 11 2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>

      <div v-if="isDatesOpen" class="hero-search__dropdown-panel hero-search__dropdown-panel--calendar">
        <HomeHeroSearchDatePicker v-model:start="checkIn" v-model:end="checkOut" />
      </div>
    </div>

    <div
      ref="guestsFieldRef"
      class="hero-search__field hero-search__field--guests"
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

    <button type="submit" class="hero-search__submit">
      Искать
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
  z-index: 20;
  margin: 0;
  padding: 6px 8px;
  list-style: none;
  border: 1px solid var(--wh-gray);
  border-radius: 14px;
  background: var(--wh-white);
  color: var(--wh-black-text);
  overflow: hidden;
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
  right: auto;
  width: max-content;
  max-width: min(640px, calc(100vw - 32px));
  padding: 18px 20px;
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
  background: transparent;
  color: var(--wh-black-text);
  font: inherit;
  font-size: 0.98rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.hero-search__dropdown-option::before {
  content: '';
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: transparent;
}

.hero-search__dropdown-option:hover {
  background: var(--wh-orange-500);
  color: var(--wh-white);
}

.hero-search__dropdown-option--active::before {
  background: var(--wh-orange-500);
}

.hero-search__dropdown-option--active:hover {
  background: var(--wh-orange-500);
  color: var(--wh-white);
}

.hero-search__dropdown-option--active:hover::before {
  background: var(--wh-white);
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

@media (max-width: 1024px) {
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
  }

  .hero-search__field--animals {
    grid-column: 6 / 11;
    grid-row: 1;
  }

  .hero-search__field--dates {
    grid-column: 1 / 5;
    grid-row: 2;
    margin-top: 2px;
  }

  .hero-search__field--guests {
    grid-column: 5 / 9;
    grid-row: 2;
    margin-top: 2px;
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

@media (max-width: 640px) {
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
  }

  .hero-search__field--animals {
    grid-column: 1 / -1;
    grid-row: 2;
    margin-top: 0;
  }

  .hero-search__field--dates {
    grid-column: 1 / -1;
    grid-row: 3;
    margin-top: 0;
  }

  .hero-search__field--guests {
    grid-column: 1;
    grid-row: 4;
    margin-top: 0;
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
  }
}
</style>
