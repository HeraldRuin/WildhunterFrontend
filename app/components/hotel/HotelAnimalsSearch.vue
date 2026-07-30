<script setup lang="ts">
import type { SearchAnimal } from '~/types/api'
import { formatDisplayDate, parseDisplayDate } from '~/utils/date'

const emit = defineEmits<{
  check: [payload: { checkIn: string, checkOut: string, adults: number, animalId: string }]
}>()

const DEFAULT_CHECK_IN = '04.02.26'
const DEFAULT_CHECK_OUT = '05.02.26'
const maxAdults = 100

const { animals: animalsApi } = useApi()

const checkIn = ref<Date | null>(parseDisplayDate(DEFAULT_CHECK_IN))
const checkOut = ref<Date | null>(parseDisplayDate(DEFAULT_CHECK_OUT))
const adultsCount = ref(1)
const animal = ref('')

const isDatesOpen = ref(false)
const isHuntersOpen = ref(false)
const isAnimalOpen = ref(false)
const activeDatePart = ref<'start' | 'end' | null>(null)
const hoveredAnimalId = ref<string | null>(null)

const datesFieldRef = ref<HTMLElement | null>(null)
const huntersFieldRef = ref<HTMLElement | null>(null)
const animalFieldRef = ref<HTMLElement | null>(null)

const { data: animals, pending: animalsLoading } = useAsyncData<SearchAnimal[]>(
  'hotel-animals-search',
  () => animalsApi.getAnimalItems(),
  {
    lazy: true,
    default: () => [],
  },
)

const selectedAnimal = computed(() =>
  animals.value?.find(item => String(item.id) === animal.value),
)

function formatAdultsLabel(count: number) {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} взрослый`
  }

  return `${count} взрослых`
}

const huntersLabel = computed(() => formatAdultsLabel(adultsCount.value))

const animalLabel = computed(() => {
  if (selectedAnimal.value) {
    return selectedAnimal.value.title
  }

  return animalsLoading.value ? 'Загрузка...' : 'На кого будет охота?'
})

const dateRangeLabel = computed(() => {
  if (!checkIn.value || !checkOut.value) {
    return 'Выберите даты'
  }

  return `${formatDisplayDate(checkIn.value)} - ${formatDisplayDate(checkOut.value)}`
})

const isAnyDropdownOpen = computed(() =>
  isDatesOpen.value || isHuntersOpen.value || isAnimalOpen.value,
)

function closeOtherDropdowns(except?: 'hunters' | 'dates' | 'animal') {
  if (except !== 'hunters') {
    isHuntersOpen.value = false
  }

  if (except !== 'dates') {
    isDatesOpen.value = false
    activeDatePart.value = null
  }

  if (except !== 'animal') {
    isAnimalOpen.value = false
    hoveredAnimalId.value = null
  }
}

function toggleHuntersDropdown() {
  isHuntersOpen.value = !isHuntersOpen.value
  closeOtherDropdowns(isHuntersOpen.value ? 'hunters' : undefined)
}

function toggleAnimalDropdown() {
  if (animalsLoading.value) {
    return
  }

  isAnimalOpen.value = !isAnimalOpen.value
  closeOtherDropdowns(isAnimalOpen.value ? 'animal' : undefined)
}

function toggleDatesDropdown() {
  if (isDatesOpen.value) {
    isDatesOpen.value = false
    activeDatePart.value = null
    return
  }

  isDatesOpen.value = true
  activeDatePart.value = 'start'
  closeOtherDropdowns('dates')
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

function selectAnimal(item: SearchAnimal) {
  animal.value = String(item.id)
  isAnimalOpen.value = false
  hoveredAnimalId.value = null
}

function clearAnimal() {
  animal.value = ''
}

function setAnimalHover(id: string | number) {
  hoveredAnimalId.value = String(id)
}

function clearAnimalHover() {
  hoveredAnimalId.value = null
}

function setAnimalHoverFromEvent(event: MouseEvent) {
  const option = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-animal-id]')
  hoveredAnimalId.value = option?.dataset.animalId ?? null
}

function handleDocumentClick(event: MouseEvent) {
  if (!datesFieldRef.value?.contains(event.target as Node)) {
    isDatesOpen.value = false
    activeDatePart.value = null
  }

  if (!huntersFieldRef.value?.contains(event.target as Node)) {
    isHuntersOpen.value = false
  }

  if (!animalFieldRef.value?.contains(event.target as Node)) {
    isAnimalOpen.value = false
    hoveredAnimalId.value = null
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})

function handleSubmit() {
  if (!checkIn.value || !checkOut.value) {
    return
  }

  emit('check', {
    checkIn: formatDisplayDate(checkIn.value),
    checkOut: formatDisplayDate(checkOut.value),
    adults: adultsCount.value,
    animalId: animal.value,
  })
}
</script>

<template>
  <div
    class="hotel-animals-search"
    :class="{ 'hotel-animals-search--dropdown-open': isAnyDropdownOpen }"
  >
    <h2 class="hotel-animals-search__title">Доступные животные</h2>

    <form class="hotel-animals-search__form" @submit.prevent="handleSubmit">
      <div class="hotel-animals-search__panel">
        <div
          ref="datesFieldRef"
          class="hotel-animals-search__field hotel-animals-search__field--dates"
          :class="{ 'hotel-animals-search__field--open': isDatesOpen }"
        >
          <span class="hotel-animals-search__label">Заезд – Выезд</span>
          <button
            type="button"
            class="hotel-animals-search__value"
            @click="toggleDatesDropdown"
          >
            {{ dateRangeLabel }}
          </button>
          <svg class="hotel-animals-search__chevron" viewBox="0 0 12 8" aria-hidden="true">
            <path
              d="M1 2 6 6.5 11 2"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>

          <div
            v-if="isDatesOpen"
            class="hotel-animals-search__dropdown hotel-animals-search__dropdown--calendar"
          >
            <HomeHeroSearchDatePicker
              v-model:start="checkIn"
              v-model:end="checkOut"
              v-model:active-part="activeDatePart"
            />
          </div>
        </div>

        <div
          ref="huntersFieldRef"
          class="hotel-animals-search__field hotel-animals-search__field--hunters"
          :class="{ 'hotel-animals-search__field--open': isHuntersOpen }"
        >
          <span class="hotel-animals-search__label">Охотники</span>
          <button
            type="button"
            class="hotel-animals-search__value"
            @click="toggleHuntersDropdown"
          >
            {{ huntersLabel }}
          </button>
          <svg class="hotel-animals-search__chevron" viewBox="0 0 12 8" aria-hidden="true">
            <path
              d="M1 2 6 6.5 11 2"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>

          <div v-if="isHuntersOpen" class="hotel-animals-search__dropdown">
            <div class="hotel-animals-search__stepper-row">
              <span class="hotel-animals-search__stepper-label">Взрослые</span>
              <div class="hotel-animals-search__stepper">
                <button
                  type="button"
                  class="hotel-animals-search__stepper-btn"
                  aria-label="Уменьшить количество взрослых"
                  :disabled="adultsCount <= 1"
                  @click="decrementAdults"
                >
                  −
                </button>
                <span class="hotel-animals-search__stepper-count">{{ adultsCount }}</span>
                <button
                  type="button"
                  class="hotel-animals-search__stepper-btn"
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

        <div
          ref="animalFieldRef"
          class="hotel-animals-search__field hotel-animals-search__field--animal"
          :class="{
            'hotel-animals-search__field--open': isAnimalOpen,
            'hotel-animals-search__field--placeholder': !selectedAnimal,
          }"
        >
          <span class="hotel-animals-search__label">Животные</span>
          <button
            type="button"
            class="hotel-animals-search__value"
            :disabled="animalsLoading"
            @click="toggleAnimalDropdown"
          >
            {{ animalLabel }}
          </button>

          <button
            v-if="selectedAnimal"
            type="button"
            class="hotel-animals-search__clear"
            aria-label="Очистить животное"
            @click="clearAnimal"
          >
            <svg viewBox="0 0 12 12" aria-hidden="true">
              <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </button>
          <svg v-else class="hotel-animals-search__chevron" viewBox="0 0 12 8" aria-hidden="true">
            <path
              d="M1 2 6 6.5 11 2"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>

          <ul
            v-if="isAnimalOpen && animals?.length"
            class="hotel-animals-search__dropdown-list"
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
                class="hotel-animals-search__dropdown-option"
                :data-animal-id="item.id"
                :class="{
                  'hotel-animals-search__dropdown-option--active': String(item.id) === animal,
                  'hotel-animals-search__dropdown-option--hovered': hoveredAnimalId === String(item.id),
                }"
                @pointerenter="setAnimalHover(item.id)"
                @pointerdown="setAnimalHover(item.id)"
                @click="selectAnimal(item)"
              >
                <span class="hotel-animals-search__dropdown-option-dot" aria-hidden="true" />
                <span class="hotel-animals-search__dropdown-option-label">{{ item.title }}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <button type="submit" class="hotel-animals-search__submit">
        <span class="hotel-animals-search__submit-label hotel-animals-search__submit-label--desktop">Проверить доступность</span>
        <span class="hotel-animals-search__submit-label hotel-animals-search__submit-label--mobile">Искать</span>
      </button>
    </form>
  </div>
</template>

<style scoped>
.hotel-animals-search {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: 100%;
}

.hotel-animals-search__title {
  width: min(100%, var(--hotel-booking-blocks-width, 100%));
  margin: 0;
  font-size: clamp(1.1rem, 2vw, 1.35rem);
  font-weight: 800;
  letter-spacing: 0.06em;
  text-align: center;
  text-transform: uppercase;
  color: var(--wh-gray-900);
}

.hotel-animals-search__form {
  display: flex;
  align-items: stretch;
  gap: 2px;
  width: min(100%, var(--hotel-booking-blocks-width, 100%));
  height: 81px;
}

.hotel-animals-search__panel {
  display: flex;
  flex: 1;
  align-items: stretch;
  gap: 2px;
  min-width: 0;
  overflow: visible;
}

.hotel-animals-search__field {
  position: relative;
  z-index: 2;
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  height: 81px;
  padding: 16px 22px;
  border: 1px solid var(--wh-gray);
  border-radius: var(--wh-radius-lg);
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
  cursor: pointer;
}

.hotel-animals-search__field--dates {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.hotel-animals-search__field--hunters {
  border-radius: 0;
}

.hotel-animals-search__field--animal {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.hotel-animals-search__field--open {
  z-index: 30;
  isolation: isolate;
}

.hotel-animals-search--dropdown-open .hotel-animals-search__field:not(.hotel-animals-search__field--open) {
  pointer-events: none;
}

.hotel-animals-search--dropdown-open .hotel-animals-search__submit {
  pointer-events: none;
}

.hotel-animals-search__label {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: -0.05em;
  color: #1c211c;
  opacity: 0.4;
}

.hotel-animals-search__value {
  width: 100%;
  padding-right: 28px;
  border: none;
  background: transparent;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.05em;
  color: #1c211c;
  text-align: left;
  cursor: pointer;
}

.hotel-animals-search__field--placeholder .hotel-animals-search__value {
  opacity: 0.72;
}

.hotel-animals-search__value:disabled {
  cursor: wait;
}

.hotel-animals-search__chevron {
  position: absolute;
  top: 50%;
  right: 22px;
  width: 12px;
  height: 8px;
  color: #1c211c;
  pointer-events: none;
  transform: translateY(-50%);
}

.hotel-animals-search__clear {
  position: absolute;
  top: 50%;
  right: 22px;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: transparent;
  color: #1c211c;
  cursor: pointer;
  transform: translateY(-50%);
}

.hotel-animals-search__field--open .hotel-animals-search__chevron {
  transform: translateY(-50%) rotate(180deg);
}

.hotel-animals-search__dropdown,
.hotel-animals-search__dropdown-list {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 100;
  border: 1px solid var(--wh-gray);
  background: var(--wh-white);
  color: var(--wh-black-text);
  pointer-events: auto;
}

.hotel-animals-search__dropdown {
  padding: 14px 16px;
  border-radius: 14px;
}

.hotel-animals-search__dropdown--calendar {
  padding: 18px 20px;
  border-radius: var(--wh-radius-lg) 0 0 var(--wh-radius-lg);
}

.hotel-animals-search__field--hunters .hotel-animals-search__dropdown {
  border-radius: 0;
}

.hotel-animals-search__field--animal .hotel-animals-search__dropdown-list {
  margin: 0;
  padding: 6px 8px;
  list-style: none;
  border-radius: 0 var(--wh-radius-lg) var(--wh-radius-lg) 0;
  overflow: hidden;
}

.hotel-animals-search__stepper-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.hotel-animals-search__stepper-label {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.05em;
  color: var(--wh-black-text);
}

.hotel-animals-search__stepper {
  display: flex;
  align-items: center;
  gap: 18px;
}

.hotel-animals-search__stepper-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--wh-black-text);
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
}

.hotel-animals-search__stepper-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.hotel-animals-search__stepper-count {
  min-width: 12px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.05em;
  color: var(--wh-black-text);
  text-align: center;
}

.hotel-animals-search__dropdown-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--wh-black-text);
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.05em;
  text-align: left;
  cursor: pointer;
}

.hotel-animals-search__dropdown-option--hovered,
.hotel-animals-search__dropdown-option:hover {
  background: var(--wh-gray-100);
}

.hotel-animals-search__dropdown-option--active {
  background: rgb(209 101 16 / 10%);
}

.hotel-animals-search__dropdown-option-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: transparent;
}

.hotel-animals-search__dropdown-option--active .hotel-animals-search__dropdown-option-dot {
  background: var(--wh-orange-500);
}

.hotel-animals-search__submit {
  flex: 0 0 240px;
  height: 81px;
  padding: 0 16px;
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

.hotel-animals-search__submit:hover {
  background: var(--wh-orange-600);
}

.hotel-animals-search__submit-label--mobile {
  display: none;
}

@media (--wh-tablet) {
  .hotel-animals-search__form {
    flex-direction: column;
    gap: 2px;
    height: auto;
  }

  .hotel-animals-search__panel {
    flex-direction: column;
    gap: 2px;
  }

  .hotel-animals-search__field,
  .hotel-animals-search__field--dates,
  .hotel-animals-search__field--hunters,
  .hotel-animals-search__field--animal {
    border-radius: var(--wh-radius-lg);
  }

  .hotel-animals-search__field--animal .hotel-animals-search__dropdown-list {
    border-radius: var(--wh-radius-lg);
  }

  .hotel-animals-search__dropdown--calendar {
    border-radius: var(--wh-radius-lg);
  }

  .hotel-animals-search__submit {
    flex: none;
    width: 100%;
    min-height: 72px;
    height: auto;
  }
}

@media (--wh-mobile) {
  .hotel-animals-search__form {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
    gap: 2px;
    height: auto;
  }

  .hotel-animals-search__panel {
    display: contents;
  }

  .hotel-animals-search__field--dates {
    grid-column: 1 / -1;
    grid-row: 1;
    border-radius: var(--wh-radius-lg);
  }

  .hotel-animals-search__field--animal {
    grid-column: 1 / -1;
    grid-row: 2;
    border-radius: var(--wh-radius-lg);
  }

  .hotel-animals-search__field--hunters {
    grid-column: 1;
    grid-row: 3;
    border-radius: var(--wh-radius-lg);
  }

  .hotel-animals-search__submit {
    grid-column: 2;
    grid-row: 3;
    width: auto;
    min-height: 81px;
    height: 81px;
  }

  .hotel-animals-search__field--animal .hotel-animals-search__dropdown-list {
    border-radius: var(--wh-radius-lg);
  }

  .hotel-animals-search__dropdown--calendar {
    border-radius: var(--wh-radius-lg);
  }

  .hotel-animals-search__submit-label--desktop {
    display: none;
  }

  .hotel-animals-search__submit-label--mobile {
    display: inline;
  }
}
</style>
