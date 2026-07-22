<script setup lang="ts">
import {
  addMonths,
  getCalendarDays,
  getMonthTitle,
  getWeekdayNames,
  isSameDay,
  startOfDay,
} from '~/utils/date'

const start = defineModel<Date | null>('start', { default: null })
const end = defineModel<Date | null>('end', { default: null })

const viewMonth = ref(startOfDay(start.value ?? new Date()))
const weekdays = getWeekdayNames()

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
    return 'start'
  }

  if (rangeEnd && isSameDay(normalized, rangeEnd)) {
    return 'end'
  }

  if (rangeStart && rangeEnd && isBetween(normalized, rangeStart, rangeEnd)) {
    return 'in-range'
  }

  return 'default'
}

function selectDate(date: Date) {
  const normalized = startOfDay(date)

  if (!start.value || (start.value && end.value)) {
    start.value = normalized
    end.value = null
    return
  }

  const currentStart = startOfDay(start.value)

  if (normalized.getTime() < currentStart.getTime()) {
    end.value = currentStart
    start.value = normalized
    return
  }

  if (isSameDay(normalized, currentStart)) {
    end.value = normalized
    return
  }

  end.value = normalized
}

function goToPreviousMonth() {
  viewMonth.value = addMonths(viewMonth.value, -1)
}

function goToNextMonth() {
  viewMonth.value = addMonths(viewMonth.value, 1)
}
</script>

<template>
  <div class="hero-search-calendar">
    <div class="hero-search-calendar__months">
      <section class="hero-search-calendar__month">
        <div class="hero-search-calendar__header">
          <button
            type="button"
            class="hero-search-calendar__nav"
            aria-label="Предыдущий месяц"
            @click="goToPreviousMonth"
          >
            ‹
          </button>

          <h3 class="hero-search-calendar__title">
            {{ month.title }}
          </h3>

          <button
            type="button"
            class="hero-search-calendar__nav"
            aria-label="Следующий месяц"
            @click="goToNextMonth"
          >
            ›
          </button>
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
              [`hero-search-calendar__cell--${getDayState(day.date)}`]: getDayState(day.date) !== 'default',
            }"
          >
            <button
              type="button"
              class="hero-search-calendar__day"
              :class="{
                'hero-search-calendar__day--selected': getDayState(day.date) === 'start' || getDayState(day.date) === 'end',
              }"
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
}

.hero-search-calendar__months {
  display: grid;
  grid-template-columns: 1fr;
}

.hero-search-calendar__header {
  display: grid;
  grid-template-columns: 24px 1fr 24px;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--wh-gray);
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
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--wh-black-text);
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.hero-search-calendar__cell--outside .hero-search-calendar__day {
  color: rgb(28 33 28 / 35%);
}

.hero-search-calendar__day--selected {
  background: var(--wh-orange-500);
  color: var(--wh-white);
}

.hero-search-calendar__day:not(.hero-search-calendar__day--selected):hover {
  background: rgb(209 101 16 / 12%);
}
</style>
