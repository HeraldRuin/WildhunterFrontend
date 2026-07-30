<script setup lang="ts">
import { formatDisplayDate, parseDisplayDate } from '~/utils/date'

const props = withDefaults(defineProps<{
  /** Ширина внутренних блоков (поля и кнопка), например `100%`, `720px`, `75%` */
  blocksWidth?: string
}>(), {
  blocksWidth: '100%',
})

const emit = defineEmits<{
  check: [payload: { checkIn: string, checkOut: string, adults: number }]
}>()

const blocksStyle = computed(() => ({
  '--hotel-booking-blocks-width': props.blocksWidth,
}))

const DEFAULT_CHECK_IN = '04.02.26'
const DEFAULT_CHECK_OUT = '05.02.26'
const maxAdults = 100

const checkIn = ref<Date | null>(parseDisplayDate(DEFAULT_CHECK_IN))
const checkOut = ref<Date | null>(parseDisplayDate(DEFAULT_CHECK_OUT))
const adultsCount = ref(1)

const isDatesOpen = ref(false)
const isGuestsOpen = ref(false)
const activeDatePart = ref<'start' | 'end' | null>(null)

const datesFieldRef = ref<HTMLElement | null>(null)
const guestsFieldRef = ref<HTMLElement | null>(null)

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
  if (!checkIn.value || !checkOut.value) {
    return 'Выберите даты'
  }

  return `${formatDisplayDate(checkIn.value)} - ${formatDisplayDate(checkOut.value)}`
})

const isAnyDropdownOpen = computed(() => isDatesOpen.value || isGuestsOpen.value)

function closeOtherDropdowns(except?: 'guests' | 'dates') {
  if (except !== 'guests') {
    isGuestsOpen.value = false
  }

  if (except !== 'dates') {
    isDatesOpen.value = false
    activeDatePart.value = null
  }
}

function toggleGuestsDropdown() {
  isGuestsOpen.value = !isGuestsOpen.value
  closeOtherDropdowns(isGuestsOpen.value ? 'guests' : undefined)
}

function openDatesDropdown() {
  isDatesOpen.value = true
  activeDatePart.value = 'start'
  closeOtherDropdowns('dates')
}

function toggleDatesDropdown() {
  if (isDatesOpen.value) {
    isDatesOpen.value = false
    activeDatePart.value = null
    return
  }

  openDatesDropdown()
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

function handleDocumentClick(event: MouseEvent) {
  if (!datesFieldRef.value?.contains(event.target as Node)) {
    isDatesOpen.value = false
    activeDatePart.value = null
  }

  if (!guestsFieldRef.value?.contains(event.target as Node)) {
    isGuestsOpen.value = false
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
  })
}
</script>

<template>
  <div
    class="hotel-dates-guests"
    :class="{ 'hotel-dates-guests--dropdown-open': isAnyDropdownOpen }"
    :style="blocksStyle"
  >
    <h2 class="hotel-dates-guests__title">Даты и гости</h2>

    <form class="hotel-dates-guests__form" @submit.prevent="handleSubmit">
      <div class="hotel-dates-guests__panel">
        <div
          ref="datesFieldRef"
          class="hotel-dates-guests__field hotel-dates-guests__field--dates"
          :class="{ 'hotel-dates-guests__field--open': isDatesOpen }"
        >
          <span class="hotel-dates-guests__label">Заезд – Выезд</span>
          <button
            type="button"
            class="hotel-dates-guests__value"
            @click="toggleDatesDropdown"
          >
            {{ dateRangeLabel }}
          </button>
          <svg class="hotel-dates-guests__chevron" viewBox="0 0 12 8" aria-hidden="true">
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
            class="hotel-dates-guests__dropdown hotel-dates-guests__dropdown--calendar"
          >
            <HomeHeroSearchDatePicker
              v-model:start="checkIn"
              v-model:end="checkOut"
              v-model:active-part="activeDatePart"
            />
          </div>
        </div>

        <div
          ref="guestsFieldRef"
          class="hotel-dates-guests__field hotel-dates-guests__field--guests"
          :class="{ 'hotel-dates-guests__field--open': isGuestsOpen }"
        >
          <span class="hotel-dates-guests__label">Гости</span>
          <button
            type="button"
            class="hotel-dates-guests__value"
            @click="toggleGuestsDropdown"
          >
            {{ guestsLabel }}
          </button>
          <svg class="hotel-dates-guests__chevron" viewBox="0 0 12 8" aria-hidden="true">
            <path
              d="M1 2 6 6.5 11 2"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>

          <div v-if="isGuestsOpen" class="hotel-dates-guests__dropdown">
            <div class="hotel-dates-guests__guest-row">
              <span class="hotel-dates-guests__guest-label">Взрослые</span>
              <div class="hotel-dates-guests__guest-stepper">
                <button
                  type="button"
                  class="hotel-dates-guests__guest-btn"
                  aria-label="Уменьшить количество взрослых"
                  :disabled="adultsCount <= 1"
                  @click="decrementAdults"
                >
                  −
                </button>
                <span class="hotel-dates-guests__guest-count">{{ adultsCount }}</span>
                <button
                  type="button"
                  class="hotel-dates-guests__guest-btn"
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

      <button type="submit" class="hotel-dates-guests__submit">
        <span class="hotel-dates-guests__submit-label hotel-dates-guests__submit-label--desktop">Проверить наличие</span>
        <span class="hotel-dates-guests__submit-label hotel-dates-guests__submit-label--mobile">Искать</span>
      </button>
    </form>
  </div>
</template>

<style scoped>
.hotel-dates-guests {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: 100%;
}

.hotel-dates-guests__title {
  width: min(100%, var(--hotel-booking-blocks-width, 100%));
  margin: 0;
  font-size: clamp(1.1rem, 2vw, 1.35rem);
  font-weight: 800;
  letter-spacing: 0.06em;
  text-align: center;
  text-transform: uppercase;
  color: var(--wh-gray-900);
}

.hotel-dates-guests__form {
  display: flex;
  align-items: stretch;
  gap: 2px;
  width: min(100%, var(--hotel-booking-blocks-width, 100%));
  height: 81px;
}

.hotel-dates-guests__panel {
  display: flex;
  flex: 1;
  align-items: stretch;
  gap: 2px;
  min-width: 0;
  background: transparent;
  overflow: visible;
}

.hotel-dates-guests__field {
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

.hotel-dates-guests__field--dates {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.hotel-dates-guests__field--guests {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.hotel-dates-guests__field--open {
  z-index: 30;
  isolation: isolate;
}

.hotel-dates-guests--dropdown-open .hotel-dates-guests__field:not(.hotel-dates-guests__field--open) {
  pointer-events: none;
}

.hotel-dates-guests--dropdown-open .hotel-dates-guests__submit {
  pointer-events: none;
}

.hotel-dates-guests__label {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: -0.05em;
  color: #1c211c;
  opacity: 0.4;
}

.hotel-dates-guests__value {
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

.hotel-dates-guests__chevron {
  position: absolute;
  top: 50%;
  right: 22px;
  width: 12px;
  height: 8px;
  color: #1c211c;
  pointer-events: none;
  transform: translateY(-50%);
}

.hotel-dates-guests__field--open .hotel-dates-guests__chevron {
  transform: translateY(-50%) rotate(180deg);
}

.hotel-dates-guests__dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 100;
  padding: 14px 16px;
  border: 1px solid var(--wh-gray);
  border-radius: 14px;
  background: var(--wh-white);
  color: var(--wh-black-text);
  pointer-events: auto;
}

.hotel-dates-guests__field--guests .hotel-dates-guests__dropdown:not(.hotel-dates-guests__dropdown--calendar) {
  border-radius: 0 var(--wh-radius-lg) var(--wh-radius-lg) 0;
}

.hotel-dates-guests__dropdown--calendar {
  padding: 18px 20px;
  border-radius: var(--wh-radius-lg) 0 0 var(--wh-radius-lg);
}

.hotel-dates-guests__guest-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.hotel-dates-guests__guest-label {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.05em;
  color: var(--wh-black-text);
}

.hotel-dates-guests__guest-stepper {
  display: flex;
  align-items: center;
  gap: 18px;
}

.hotel-dates-guests__guest-btn {
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

.hotel-dates-guests__guest-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.hotel-dates-guests__guest-count {
  min-width: 12px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.05em;
  color: var(--wh-black-text);
  text-align: center;
}

.hotel-dates-guests__submit {
  flex: 0 0 200px;
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

.hotel-dates-guests__submit:hover {
  background: var(--wh-orange-600);
}

.hotel-dates-guests__submit-label--mobile {
  display: none;
}

@media (--wh-tablet) {
  .hotel-dates-guests__form {
    flex-direction: column;
    gap: 2px;
    height: auto;
  }

  .hotel-dates-guests__panel {
    flex-direction: column;
    gap: 2px;
  }

  .hotel-dates-guests__field,
  .hotel-dates-guests__field--dates,
  .hotel-dates-guests__field--guests {
    border-radius: var(--wh-radius-lg);
  }

  .hotel-dates-guests__field--guests .hotel-dates-guests__dropdown:not(.hotel-dates-guests__dropdown--calendar) {
    border-radius: var(--wh-radius-lg);
  }

  .hotel-dates-guests__dropdown--calendar {
    border-radius: var(--wh-radius-lg);
  }

  .hotel-dates-guests__submit {
    flex: none;
    width: 100%;
    min-height: 72px;
    height: auto;
  }
}

@media (--wh-mobile) {
  .hotel-dates-guests__form {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
    gap: 2px;
    height: auto;
  }

  .hotel-dates-guests__panel {
    display: contents;
  }

  .hotel-dates-guests__field--dates {
    grid-column: 1 / -1;
    border-radius: var(--wh-radius-lg);
  }

  .hotel-dates-guests__field--guests {
    grid-column: 1;
    grid-row: 2;
    border-radius: var(--wh-radius-lg);
  }

  .hotel-dates-guests__field--guests .hotel-dates-guests__dropdown:not(.hotel-dates-guests__dropdown--calendar) {
    border-radius: var(--wh-radius-lg);
  }

  .hotel-dates-guests__dropdown--calendar {
    border-radius: var(--wh-radius-lg);
  }

  .hotel-dates-guests__submit {
    grid-column: 2;
    grid-row: 2;
    width: auto;
    min-height: 81px;
    height: 81px;
  }

  .hotel-dates-guests__submit-label--desktop {
    display: none;
  }

  .hotel-dates-guests__submit-label--mobile {
    display: inline;
  }
}
</style>
