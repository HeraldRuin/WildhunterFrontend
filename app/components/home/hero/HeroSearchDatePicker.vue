<script setup lang="ts">
import {
  addMonths,
  getCalendarDays,
  getMonthTitle,
  getWeekdayNames,
  isSameDay,
  startOfDay,
} from '~/utils/date'

const props = withDefaults(defineProps<{
  mode?: 'range' | 'single'
  minDate?: Date | null
  maxDate?: Date | null
}>(), {
  mode: 'range',
  minDate: null,
  maxDate: null,
})

const emit = defineEmits<{
  select: [date: Date]
}>()

const start = defineModel<Date | null>('start', { default: null })
const end = defineModel<Date | null>('end', { default: null })
const activePart = defineModel<'start' | 'end' | null>('activePart', { default: 'start' })

const viewMonth = ref(startOfDay(start.value ?? props.minDate ?? new Date()))
const weekdays = getWeekdayNames()
const isSingle = computed(() => props.mode === 'single')
const hasDateLimits = computed(() => Boolean(props.minDate || props.maxDate))

const currentMonth = computed(() => new Date(viewMonth.value.getFullYear(), viewMonth.value.getMonth(), 1))

const month = computed(() => ({
  key: `${currentMonth.value.getFullYear()}-${currentMonth.value.getMonth()}`,
  title: getMonthTitle(currentMonth.value),
  days: getCalendarDays(currentMonth.value.getFullYear(), currentMonth.value.getMonth()),
}))

function isBetween(date: Date, from: Date, to: Date) {
  const value = startOfDay(date).getTime()
  return value > startOfDay(from).getTime() && value < startOfDay(to).getTime()
}

function getDayState(date: Date) {
  const normalized = startOfDay(date)
  const rangeStart = start.value ? startOfDay(start.value) : null
  const rangeEnd = end.value ? startOfDay(end.value) : null

  if (rangeStart && isSameDay(normalized, rangeStart)) {
    return isSingle.value ? 'selected' : 'start'
  }

  if (isSingle.value) {
    return 'default'
  }

  if (rangeEnd && isSameDay(normalized, rangeEnd)) {
    return 'end'
  }

  if (rangeStart && rangeEnd && isBetween(normalized, rangeStart, rangeEnd)) {
    return 'in-range'
  }

  return 'default'
}

function focusMonthForPart(part: 'start' | 'end' | null) {
  const target = part === 'end'
    ? (end.value ?? start.value)
    : (start.value ?? end.value)

  if (target) {
    viewMonth.value = startOfDay(target)
    return
  }

  if (props.minDate) {
    viewMonth.value = startOfDay(props.minDate)
  }
}

watch(
  activePart,
  (part) => {
    focusMonthForPart(part)
  },
  { immediate: true },
)

function isDateDisabled(date: Date) {
  const normalized = startOfDay(date)

  if (props.minDate && normalized.getTime() < startOfDay(props.minDate).getTime()) {
    return true
  }

  if (props.maxDate && normalized.getTime() > startOfDay(props.maxDate).getTime()) {
    return true
  }

  return false
}

function selectDate(date: Date) {
  const normalized = startOfDay(date)

  if (isDateDisabled(normalized)) {
    return
  }

  if (isSingle.value) {
    start.value = normalized
    end.value = null
    activePart.value = 'start'
    emit('select', normalized)
    return
  }

  const rangeComplete = Boolean(start.value && end.value)

  if (!start.value || rangeComplete) {
    start.value = normalized
    end.value = null
    activePart.value = 'end'
    return
  }

  const currentStart = startOfDay(start.value)

  if (normalized.getTime() <= currentStart.getTime()) {
    start.value = normalized
    end.value = null
    activePart.value = 'end'
    return
  }

  end.value = normalized
  activePart.value = null
}

function goToPreviousMonth() {
  viewMonth.value = addMonths(viewMonth.value, -1)
}

function goToNextMonth() {
  viewMonth.value = addMonths(viewMonth.value, 1)
}

function goToPreviousYear() {
  viewMonth.value = addMonths(viewMonth.value, -12)
}

function goToNextYear() {
  viewMonth.value = addMonths(viewMonth.value, 12)
}
</script>

<template>
  <div class="hero-search-calendar" :class="{ 'hero-search-calendar--single': isSingle }">
    <div class="hero-search-calendar__months">
      <section class="hero-search-calendar__month">
        <div class="hero-search-calendar__header">
          <div class="hero-search-calendar__nav-group">
            <button
              v-if="isSingle"
              type="button"
              class="hero-search-calendar__nav"
              aria-label="Предыдущий год"
              @click="goToPreviousYear"
            >
              «
            </button>
            <button
              type="button"
              class="hero-search-calendar__nav"
              aria-label="Предыдущий месяц"
              @click="goToPreviousMonth"
            >
              ‹
            </button>
          </div>

          <h3 class="hero-search-calendar__title">
            {{ month.title }}
          </h3>

          <div class="hero-search-calendar__nav-group hero-search-calendar__nav-group--end">
            <button
              type="button"
              class="hero-search-calendar__nav"
              aria-label="Следующий месяц"
              @click="goToNextMonth"
            >
              ›
            </button>
            <button
              v-if="isSingle"
              type="button"
              class="hero-search-calendar__nav"
              aria-label="Следующий год"
              @click="goToNextYear"
            >
              »
            </button>
          </div>
        </div>

        <div class="hero-search-calendar__weekdays">
          <span v-for="weekday in weekdays" :key="weekday">{{ weekday }}</span>
        </div>

        <div class="hero-search-calendar__grid">
          <div
            v-for="day in month.days"
            :key="`${month.key}-${day.date.toISOString()}`"
            class="hero-search-calendar__cell"
            :class="{
              'hero-search-calendar__cell--outside': !day.isCurrentMonth,
              [`hero-search-calendar__cell--${getDayState(day.date)}`]:
                getDayState(day.date) !== 'default' && getDayState(day.date) !== 'selected',
            }"
          >
            <button
              type="button"
              class="hero-search-calendar__day"
              :class="{
                'hero-search-calendar__day--selected':
                  getDayState(day.date) === 'selected'
                  || getDayState(day.date) === 'start'
                  || getDayState(day.date) === 'end',
                'hero-search-calendar__day--available':
                  hasDateLimits
                  && !isSingle
                  && !isDateDisabled(day.date),
                'hero-search-calendar__day--disabled': isDateDisabled(day.date),
              }"
              :disabled="isDateDisabled(day.date)"
              @click="selectDate(day.date)"
            >
              {{ day.date.getDate() }}
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.hero-search-calendar {
  width: 100%;
  min-width: 0;
  cursor: default;
}

.hero-search-calendar__months {
  display: grid;
  grid-template-columns: 1fr;
}

.hero-search-calendar__header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--wh-gray);
}

.hero-search-calendar__nav-group {
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 24px;
}

.hero-search-calendar__nav-group--end {
  justify-content: flex-end;
}

.hero-search-calendar__title {
  margin: 0;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.05em;
  color: var(--wh-black-text);
  text-align: center;
}

.hero-search-calendar__nav {
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
  transition: opacity 0.15s ease;
}

.hero-search-calendar__nav:hover {
  opacity: 0.6;
}

.hero-search-calendar__weekdays,
.hero-search-calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.hero-search-calendar__weekdays {
  margin-bottom: 8px;
  color: rgb(28 33 28 / 40%);
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 0.75rem;
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.05em;
  text-transform: lowercase;
  text-align: center;
}

.hero-search-calendar__weekdays span {
  padding: 4px 0;
}

.hero-search-calendar__cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
}

.hero-search-calendar__cell--in-range::before,
.hero-search-calendar__cell--start::before,
.hero-search-calendar__cell--end::before {
  content: '';
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 0;
  right: 0;
  background: #d9d9d9;
  z-index: 0;
}

.hero-search-calendar__cell--start::before {
  left: 50%;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.hero-search-calendar__cell--end::before {
  right: 50%;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.hero-search-calendar__cell--start.hero-search-calendar__cell--end::before {
  display: none;
}

.hero-search-calendar__day {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--wh-black-text);
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.2s ease;
}

.hero-search-calendar__cell--outside .hero-search-calendar__day {
  color: rgb(28 33 28 / 35%);
}

.hero-search-calendar__day--selected {
  background: var(--wh-orange-500);
  color: var(--wh-white);
}

.hero-search-calendar__day--available {
  width: 30px;
  height: 30px;
  color: var(--wh-black-text);
  font-weight: 700;
  box-shadow: inset 0 0 0 1.5px rgb(28 33 28 / 35%);
}

.hero-search-calendar__day--available:hover {
  box-shadow: inset 0 0 0 1.5px var(--wh-orange-500);
}

.hero-search-calendar__day--available.hero-search-calendar__day--selected {
  box-shadow: none;
  color: var(--wh-white);
}

.hero-search-calendar__day:not(.hero-search-calendar__day--selected):not(.hero-search-calendar__day--disabled):not(:disabled):hover {
  background: rgb(209 101 16 / 12%);
}

.hero-search-calendar__day--disabled,
.hero-search-calendar__day:disabled {
  color: rgb(28 33 28 / 28%);
  font-weight: 500;
  cursor: not-allowed;
  background: transparent;
}

.hero-search-calendar__day--disabled:hover,
.hero-search-calendar__day:disabled:hover {
  background: transparent;
  cursor: not-allowed;
}
</style>
