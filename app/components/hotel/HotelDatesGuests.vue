<script setup lang="ts">
import { formatDisplayDate, parseDisplayDate, startOfDay } from '~/utils/date'

const props = withDefaults(defineProps<{

  blocksWidth?: string
  loading?: boolean
}>(), {
  blocksWidth: '100%',
  loading: false,
})

const emit = defineEmits<{
  check: [payload: { checkIn: string, checkOut: string, adults: number }]
  clear: []
  'dates-change': [payload: { checkIn: Date | null, checkOut: Date | null }]
  'adults-change': [adults: number]
}>()

const route = useRoute()

const blocksStyle = computed(() => ({
  '--hotel-booking-blocks-width': props.blocksWidth,
}))

const maxAdults = 20
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

const hasDatesFromSearch = ref(Boolean(checkIn.value && checkOut.value))

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

watch(
  [checkIn, checkOut],
  ([nextCheckIn, nextCheckOut]) => {
    emit('dates-change', {
      checkIn: nextCheckIn,
      checkOut: nextCheckOut,
    })
  },
  { immediate: true },
)

watch(
  adultsCount,
  (count) => {
    emit('adults-change', count)
  },
  { immediate: true },
)

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

function openDatesDropdown() {
  const seedingCheckIn = !checkIn.value

  if (!seedingCheckIn && isDatesOpen.value) {
    closeDatesDropdown()
    return
  }

  if (seedingCheckIn) {
    checkIn.value = startOfDay(new Date())
    checkOut.value = null
  }

  activeDatePart.value = 'start'
  isDatesOpen.value = true
  closeOtherDropdowns('dates')

  if (seedingCheckIn) {
    void nextTick(() => {
      isDatesOpen.value = true
      activeDatePart.value = 'start'
    })
  }
}

function toggleDatesDropdown() {
  if (isDatesOpen.value) {
    closeDatesDropdown()
    return
  }

  openDatesDropdown()
}

function onDatesFieldClick(event: MouseEvent) {
  const target = event.target as HTMLElement

  if (target.closest('.hotel-dates-guests__clear, .hotel-dates-guests__dates-chevron, .hotel-dates-guests__dropdown')) {
    return
  }

  if (isDatesOpen.value) {
    closeDatesDropdown()
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

function clampAdults(value: number) {
  return Math.min(maxAdults, Math.max(1, Math.floor(value)))
}

function onAdultsInput(event: Event) {
  const target = event.target as HTMLInputElement
  const digits = target.value.replace(/\D/g, '').slice(0, 2)
  target.value = digits
  if (digits === '') {
    return
  }
  const next = Number(digits)
  if (Number.isFinite(next) && next >= 1) {
    adultsCount.value = clampAdults(next)
    target.value = String(adultsCount.value)
  }
}

function onAdultsBlur(event: Event) {
  const target = event.target as HTMLInputElement
  const next = Number(target.value)
  adultsCount.value = Number.isFinite(next) && next >= 1 ? clampAdults(next) : 1
  target.value = String(adultsCount.value)
}

function clearDates(event: MouseEvent) {
  event.stopPropagation()
  checkIn.value = null
  checkOut.value = null
  closeDatesDropdown()
  emit('clear')
}

function clearGuests(event: MouseEvent) {
  event.stopPropagation()
  adultsCount.value = 1
  isGuestsOpen.value = false
}

function handleDocumentClick(event: MouseEvent) {
  const target = event.target

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
  if (props.loading) {
    return
  }

  emit('check', {
    checkIn: checkIn.value ? formatDisplayDate(checkIn.value) : '',
    checkOut: checkOut.value ? formatDisplayDate(checkOut.value) : '',
    adults: adultsCount.value,
  })
}

defineExpose({
  getAdults: () => adultsCount.value,
  getCheckPayload: () => {
    if (!hasDatesFromSearch.value || !checkIn.value || !checkOut.value) {
      return null
    }

    return {
      checkIn: formatDisplayDate(checkIn.value),
      checkOut: formatDisplayDate(checkOut.value),
      adults: adultsCount.value,
    }
  },
  getBookingPayload: () => {
    if (!checkIn.value || !checkOut.value) {
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
            <span class="hotel-dates-guests__date-part">{{ checkInLabel }}</span>
            <span class="hotel-dates-guests__dates-sep" aria-hidden="true">-</span>
            <span class="hotel-dates-guests__date-part">{{ checkOutLabel }}</span>
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
                <input
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  class="hotel-dates-guests__guest-count"
                  :value="adultsCount"
                  aria-label="Количество взрослых"
                  @input="onAdultsInput"
                  @blur="onAdultsBlur"
                  @keydown.enter.prevent="onAdultsBlur"
                  @click.stop
                >
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
        :class="{ 'hotel-dates-guests__submit--loading': loading }"
        :disabled="loading"
        :aria-busy="loading"
      >
        <CommonSpinner
          v-if="loading"
          variant="ring"
          :size="22"
          color="var(--wh-white)"
          label="Проверяем наличие"
        />
        <template v-else>
          <span class="hotel-dates-guests__submit-label hotel-dates-guests__submit-label--desktop">
            Проверить наличие
          </span>
          <span class="hotel-dates-guests__submit-label hotel-dates-guests__submit-label--mobile">
            Искать
          </span>
        </template>
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

  font-family: UNCAGE, Manrope, system-ui, sans-serif;
  font-size: 32px;
  font-weight: 400;
  font-style: normal;
  line-height: 130%;
  letter-spacing: -0.96px;
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
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.05em;
  color: #1c211c;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: none;
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
  pointer-events: none;
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
  box-sizing: border-box;
  width: 2rem;
  min-width: 2rem;
  margin: 0;
  padding: 0;
  border: none;
  appearance: none;
  background: transparent;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.05em;
  color: var(--wh-black-text);
  text-align: center;
}

.hotel-dates-guests__guest-count:focus {
  outline: 1px solid currentColor;
  outline-offset: 2px;
  border-radius: 2px;
}

.hotel-dates-guests__submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 397px;
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

.hotel-dates-guests__submit--loading,
.hotel-dates-guests__submit:disabled {
  cursor: wait;
}

.hotel-dates-guests__submit:disabled:hover,
.hotel-dates-guests__submit--loading:hover {
  background: var(--wh-orange-500);
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
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
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
