<script setup lang="ts">
import { formatDisplayDate, parseDisplayDate, startOfDay } from '~/utils/date'

const props = withDefaults(defineProps<{
  /** Ширина внутренних блоков (поля и кнопка), например `100%`, `720px`, `75%` */
  blocksWidth?: string
  loading?: boolean
}>(), {
  blocksWidth: '100%',
  loading: false,
})

const emit = defineEmits<{
  check: [payload: { checkIn: string, checkOut: string, adults: number }]
}>()

const route = useRoute()

const blocksStyle = computed(() => ({
  '--hotel-booking-blocks-width': props.blocksWidth,
}))

const maxAdults = 100
const emptyDatesLabel = 'Пожалуйста выберите дату'

function queryString(key: string): string {
  const value = route.query[key]
  return Array.isArray(value) ? String(value[0] || '') : String(value || '')
}

function adultsFromQuery() {
  const count = Number(queryString('guests'))

  if (!Number.isFinite(count) || count < 1) {
    return 1
  }

  return Math.min(maxAdults, Math.floor(count))
}

const checkIn = ref<Date | null>(parseDisplayDate(queryString('checkIn')))
const checkOut = ref<Date | null>(parseDisplayDate(queryString('checkOut')))
const adultsCount = ref(adultsFromQuery())
const hasDatesFromSearch = Boolean(checkIn.value && checkOut.value)

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

const checkInLabel = computed(() =>
  checkIn.value ? formatDisplayDate(checkIn.value) : 'Заезд',
)

const checkOutLabel = computed(() =>
  checkOut.value ? formatDisplayDate(checkOut.value) : 'Выезд',
)

const hasSelectedDates = computed(() => Boolean(checkIn.value || checkOut.value))

const hasCustomDates = computed(() => Boolean(checkIn.value && checkOut.value))

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

function closeDatesDropdown() {
  isDatesOpen.value = false
  activeDatePart.value = null
}

function toggleGuestsDropdown() {
  isGuestsOpen.value = !isGuestsOpen.value
  closeOtherDropdowns(isGuestsOpen.value ? 'guests' : undefined)
}

function openDatesFor(part: 'start' | 'end') {
  const seedingCheckIn = !checkIn.value

  if (!seedingCheckIn && isDatesOpen.value && activeDatePart.value === part) {
    closeDatesDropdown()
    return
  }

  if (seedingCheckIn) {
    const today = startOfDay(new Date())
    const tomorrow = startOfDay(new Date(today))
    tomorrow.setDate(tomorrow.getDate() + 1)

    checkIn.value = today
    checkOut.value = tomorrow
    activeDatePart.value = 'end'
  }
  else {
    activeDatePart.value = part
  }

  isDatesOpen.value = true
  closeOtherDropdowns('dates')

  if (seedingCheckIn) {
    // Re-assert after DOM swap (placeholder → dates), so the same click
    // that removed the target cannot leave the calendar closed.
    void nextTick(() => {
      isDatesOpen.value = true
      activeDatePart.value = 'end'
    })
  }
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

  if (target.closest('.hotel-dates-guests__date-part, .hotel-dates-guests__clear, .hotel-dates-guests__dates-chevron, .hotel-dates-guests__dropdown')) {
    return
  }

  if (!checkIn.value || !checkOut.value) {
    openDatesFor(checkIn.value ? 'end' : 'start')
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

function clearDates(event: MouseEvent) {
  event.stopPropagation()
  checkIn.value = null
  checkOut.value = null
  closeDatesDropdown()
}

function clearGuests(event: MouseEvent) {
  event.stopPropagation()
  adultsCount.value = 1
  isGuestsOpen.value = false
}

function handleDocumentClick(event: MouseEvent) {
  const target = event.target

  // Ignore detached nodes from the same click that replaced the placeholder.
  if (!(target instanceof Node) || !document.contains(target)) {
    return
  }

  if (!datesFieldRef.value?.contains(target)) {
    closeDatesDropdown()
  }

  if (!guestsFieldRef.value?.contains(target)) {
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
  if (!checkIn.value || !checkOut.value || props.loading) {
    return
  }

  emit('check', {
    checkIn: formatDisplayDate(checkIn.value),
    checkOut: formatDisplayDate(checkOut.value),
    adults: adultsCount.value,
  })
}

defineExpose({
  getCheckPayload: () => {
    if (!hasDatesFromSearch || !checkIn.value || !checkOut.value) {
      return null
    }

    return {
      checkIn: formatDisplayDate(checkIn.value),
      checkOut: formatDisplayDate(checkOut.value),
      adults: adultsCount.value,
    }
  },
})
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
          @click="onDatesFieldClick"
        >
          <span class="hotel-dates-guests__label">Заезд – Выезд</span>
          <div
            v-if="hasSelectedDates"
            class="hotel-dates-guests__dates-control"
          >
            <button
              type="button"
              class="hotel-dates-guests__date-part"
              :class="{ 'hotel-dates-guests__date-part--active': isDatesOpen && activeDatePart === 'start' }"
              aria-label="Выбрать дату заезда"
              @click="openDatesFor('start')"
            >
              {{ checkInLabel }}
            </button>
            <span class="hotel-dates-guests__dates-sep" aria-hidden="true">-</span>
            <button
              type="button"
              class="hotel-dates-guests__date-part"
              :class="{ 'hotel-dates-guests__date-part--active': isDatesOpen && activeDatePart === 'end' }"
              aria-label="Выбрать дату выезда"
              @click="openDatesFor('end')"
            >
              {{ checkOutLabel }}
            </button>
          </div>
          <span
            v-else
            class="hotel-dates-guests__placeholder"
          >
            {{ emptyDatesLabel }}
          </span>
          <button
            v-if="hasCustomDates"
            type="button"
            class="hotel-dates-guests__clear"
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
            class="hotel-dates-guests__dates-chevron"
            aria-label="Открыть календарь"
            @click="toggleDatesDropdown"
          >
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
          </button>

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
          <button
            v-if="adultsCount > 1"
            type="button"
            class="hotel-dates-guests__clear"
            aria-label="Сбросить количество гостей"
            @click="clearGuests"
          >
            <svg viewBox="0 0 12 12" aria-hidden="true">
              <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </button>
          <svg v-else class="hotel-dates-guests__chevron" viewBox="0 0 12 8" aria-hidden="true">
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

      <button
        type="submit"
        class="hotel-dates-guests__submit"
        :disabled="loading"
      >
        <span class="hotel-dates-guests__submit-label hotel-dates-guests__submit-label--desktop">
          {{ loading ? 'Проверяем…' : 'Проверить наличие' }}
        </span>
        <span class="hotel-dates-guests__submit-label hotel-dates-guests__submit-label--mobile">
          {{ loading ? '…' : 'Искать' }}
        </span>
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
  font-family: 'UNCAGE', 'Manrope', system-ui, sans-serif;
  font-size: 32px;
  font-weight: 400;
  font-style: normal;
  line-height: 1.3;
  letter-spacing: -0.03em;
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
  border: 1px solid var(--wh-field-border);
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

.hotel-dates-guests__placeholder {
  display: block;
  width: 100%;
  padding-right: 28px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.05em;
  color: #1c211c;
  text-align: left;
  cursor: pointer;
}

.hotel-dates-guests__dates-control {
  display: flex;
  align-items: center;
  gap: 0;
  min-width: 0;
  padding-right: 28px;
}

.hotel-dates-guests__date-part {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 50%;
  padding: 2px 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.05em;
  color: #1c211c;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  outline: none;
  transition: color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.hotel-dates-guests__date-part--active {
  color: var(--wh-orange-500);
  animation: hotel-dates-guests-date-part-pulse 1.4s ease-in-out infinite;
}

.hotel-dates-guests__dates-sep {
  flex-shrink: 0;
  margin: 0 6px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.05em;
  color: #1c211c;
  opacity: 0.45;
  user-select: none;
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

.hotel-dates-guests__dates-chevron {
  position: absolute;
  top: 50%;
  right: 22px;
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

.hotel-dates-guests__dates-chevron .hotel-dates-guests__chevron {
  position: static;
  transform: none;
}

.hotel-dates-guests__field--open .hotel-dates-guests__dates-chevron .hotel-dates-guests__chevron {
  transform: rotate(180deg);
}

.hotel-dates-guests__clear {
  position: absolute;
  top: 50%;
  right: 22px;
  z-index: 1;
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
  transition: opacity 0.15s ease;
}

.hotel-dates-guests__clear svg {
  width: 12px;
  height: 12px;
}

.hotel-dates-guests__clear:hover {
  opacity: 0.6;
}

.hotel-dates-guests__field--open .hotel-dates-guests__chevron {
  transform: translateY(-50%) rotate(180deg);
}

@keyframes hotel-dates-guests-date-part-pulse {
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

.hotel-dates-guests__dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 100;
  padding: 14px 16px;
  border: 1px solid var(--wh-field-border);
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

.hotel-dates-guests__submit:hover:not(:disabled) {
  background: var(--wh-orange-600);
}

.hotel-dates-guests__submit:disabled {
  opacity: 0.7;
  cursor: wait;
}

.hotel-dates-guests__submit-label--mobile {
  display: none;
}

@media (--wh-tablet) {
  .hotel-dates-guests__title {
    font-size: 28px;
  }

  .hotel-dates-guests__form {
    flex-direction: column;
    gap: 2px;
    height: auto;
  }

  .hotel-dates-guests__panel {
    flex-direction: row;
    gap: 2px;
  }

  .hotel-dates-guests__field--guests .hotel-dates-guests__dropdown:not(.hotel-dates-guests__dropdown--calendar) {
    border-radius: 0 var(--wh-radius-lg) var(--wh-radius-lg) 0;
  }

  .hotel-dates-guests__dropdown--calendar {
    border-radius: var(--wh-radius-lg) 0 0 var(--wh-radius-lg);
  }

  .hotel-dates-guests__submit {
    flex: none;
    width: 100%;
    min-height: 72px;
    height: auto;
  }
}

@media (--wh-mobile) {
  .hotel-dates-guests__title {
    font-size: 24px;
  }

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
