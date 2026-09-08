<script setup lang="ts">
const props = defineProps<{
  modelValue?: string | null
  ariaLabel?: string
  /** Короткая полоска по ширине даты, не на всю колонку */
  inline?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function clampPart(raw: string, max: number) {
  if (!raw) {
    return ''
  }

  if (raw.length === 1) {
    return raw
  }

  const numeric = Number.parseInt(raw, 10)

  if (Number.isNaN(numeric)) {
    return ''
  }

  if (numeric > max) {
    return String(max)
  }

  if (numeric === 0) {
    return '0'
  }

  return raw.slice(0, 2)
}

function canAppend(current: string, digit: string, max: number) {
  const next = `${current}${digit}`
  const value = Number.parseInt(next, 10)

  if (Number.isNaN(value)) {
    return false
  }

  if (next.length === 1) {
    return value <= max
  }

  return value >= 1 && value <= max
}

function parseDotDate(value: string) {
  const trimmed = String(value ?? '').trim()

  if (!trimmed) {
    return {
      day: '',
      month: '',
      year: '',
    }
  }

  if (trimmed.includes('.')) {
    const segments = trimmed.split('.')

    return {
      day: (segments[0] ?? '').replace(/\D/g, '').slice(0, 2),
      month: (segments[1] ?? '').replace(/\D/g, '').slice(0, 2),
      year: (segments[2] ?? '').replace(/\D/g, '').slice(0, 4),
    }
  }

  const digits = trimmed.replace(/\D/g, '').slice(0, 8)

  return {
    day: digits.slice(0, 2),
    month: digits.slice(2, 4),
    year: digits.slice(4, 8),
  }
}

function formatDotDate(day: string, month: string, year: string) {
  if (!day && !month && !year) {
    return ''
  }

  if (!month && !year) {
    return day
  }

  if (!year) {
    return `${day}.${month}`
  }

  return `${day}.${month}.${year}`
}

/** День и месяц внутри « »: DD.MM = 5 знаков; точку вручную или после 2 цифр дня */
function sanitizeDayMonth(value: string) {
  const cleaned = value.replace(/[^\d.]/g, '')
  let day = ''
  let hasDot = false
  let month = ''

  for (const char of cleaned) {
    if (char === '.') {
      if (day.length > 0 && !hasDot) {
        // одна цифра дня + точка → дополняем нулём (1. → 01.)
        if (day.length === 1) {
          day = `0${day}`
        }
        hasDot = true
      }
      continue
    }

    if (!hasDot) {
      if (day.length >= 2) {
        hasDot = true
        if (!canAppend(month, char, 12)) {
          continue
        }
        month += char
        // месяц 2–9: второй цифры быть не может → 02–09
        if (month.length === 1 && month >= '2') {
          month = `0${month}`
        }
        continue
      }

      if (!canAppend(day, char, 31)) {
        continue
      }

      day += char

      if (day.length === 2) {
        hasDot = true
      }
      continue
    }

    if (month.length >= 2) {
      continue
    }

    if (!canAppend(month, char, 12)) {
      continue
    }

    month += char

    // после точки одна цифра 2–9 = неполный месяц → сразу 02–09
    if (month.length === 1 && month >= '2') {
      month = `0${month}`
    }
  }

  day = clampPart(day, 31)
  month = clampPart(month, 12)

  if (hasDot || month) {
    return `${day}.${month}`
  }

  return day
}

function padDayMonthParts(day: string, month: string) {
  let nextDay = day
  let nextMonth = month

  if (nextDay.length === 1) {
    nextDay = `0${nextDay}`
  }

  if (nextMonth.length === 1) {
    nextMonth = `0${nextMonth}`
  }

  return {
    day: nextDay,
    month: nextMonth,
  }
}

const parts = computed(() => parseDotDate(props.modelValue ?? ''))

const dayMonthDisplay = computed(() => {
  const { day, month } = parts.value

  if (!day && !month) {
    return ''
  }

  if (month) {
    return `${day}.${month}`
  }

  // две цифры дня — показываем точку сразу
  if (day.length === 2) {
    return `${day}.`
  }

  return day
})

function emitParts(day: string, month: string, year: string) {
  emit('update:modelValue', formatDotDate(day, month, year))
}

function onDayMonthInput(event: Event) {
  const input = event.target as HTMLInputElement
  const next = sanitizeDayMonth(input.value)
  const [day = '', month = ''] = next.split('.')
  const selection = input.selectionStart

  input.value = next
  emitParts(day, month ?? '', parts.value.year)

  // курсор после автоточки
  if (next.endsWith('.') && !(month ?? '')) {
    const pos = next.length
    requestAnimationFrame(() => {
      input.setSelectionRange(pos, pos)
    })
    return
  }

  if (selection != null) {
    const pos = Math.min(selection, next.length)
    requestAnimationFrame(() => {
      input.setSelectionRange(pos, pos)
    })
  }
}

function onDayMonthBlur() {
  const { day, month } = padDayMonthParts(parts.value.day, parts.value.month)

  if (day === parts.value.day && month === parts.value.month) {
    return
  }

  emitParts(day, month, parts.value.year)
}

function onYearFocus() {
  const { day, month } = padDayMonthParts(parts.value.day, parts.value.month)
  emitParts(day, month, parts.value.year)
}

function onYearInput(event: Event) {
  const input = event.target as HTMLInputElement
  const padded = padDayMonthParts(parts.value.day, parts.value.month)
  const year = input.value.replace(/\D/g, '').slice(0, 4)
  input.value = year
  emitParts(padded.day, padded.month, year)
}
</script>

<template>
  <div
    class="billet-date"
    :class="{ 'billet-date--inline': inline }"
    :aria-label="ariaLabel"
  >
    <span class="billet-date__mark">«</span>
    <input
      class="billet-date__input billet-date__input--day-month"
      type="text"
      inputmode="decimal"
      maxlength="5"
      :value="dayMonthDisplay"
      :aria-label="ariaLabel ? `${ariaLabel}: день и месяц` : 'День и месяц'"
      @input="onDayMonthInput"
      @blur="onDayMonthBlur"
    >
    <span class="billet-date__mark">»</span>
    <input
      class="billet-date__input billet-date__input--year"
      type="text"
      inputmode="numeric"
      maxlength="4"
      :value="parts.year"
      :aria-label="ariaLabel ? `${ariaLabel}: год` : 'Год'"
      @focus="onYearFocus"
      @input="onYearInput"
    >
    <span class="billet-date__mark">г.</span>
  </div>
</template>

<style scoped>
.billet-date {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 3px;
  width: 100%;
  min-height: 1.35em;
  padding: 0 0 3px;
  border-bottom: 1px solid var(--hunter-billet-line, #9a9a9a);
  color: var(--hunter-billet-ink, #5c5c5c);
  font-family: 'Times New Roman', 'Liberation Serif', 'Noto Serif', Georgia, serif;
  font-size: var(--hunter-billet-field-size, 16px);
  font-weight: var(--hunter-billet-field-weight, 600);
  font-style: normal;
  line-height: 1.25;
  white-space: nowrap;
  box-sizing: border-box;
}

.billet-date--inline {
  width: auto;
  justify-content: flex-start;
}

.billet-date__mark {
  flex: 0 0 auto;
}

.billet-date__input {
  margin: 0;
  padding: 0;
  border: none;
  border-bottom: none;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: center;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  box-sizing: content-box;
}

.billet-date__input--day-month {
  width: 5.2ch;
  min-width: 5.2ch;
  max-width: 5.2ch;
}

.billet-date__input--year {
  width: 4.2ch;
  min-width: 4.2ch;
  max-width: 4.2ch;
  margin-left: 2px;
}
</style>
