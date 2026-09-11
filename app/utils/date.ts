const MONTH_NAMES = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
]

const MONTH_NAMES_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
]

const WEEKDAY_NAMES = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']

export function formatDisplayDate(date: Date) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2)

  return `${day}.${month}.${year}`
}

export function parseDisplayDate(value: string) {
  const [day, month, year] = value.split('.').map(Number)

  if (!day || !month || !year) {
    return null
  }

  return new Date(2000 + year, month - 1, day)
}

export function formatApiDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function formatBirthdayDate(date: Date) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear())

  return `${day}.${month}.${year}`
}

/** Маска дд.мм.гггг: автоточка, день ≤ 31, месяц ≤ 12 */
export function maskDotDateInput(value: string) {
  const cleaned = String(value ?? '').replace(/[^\d.]/g, '')
  let day = ''
  let hasDayDot = false
  let month = ''
  let hasMonthDot = false
  let year = ''

  function canAppend(current: string, digit: string, max: number) {
    const next = `${current}${digit}`
    const numeric = Number.parseInt(next, 10)

    if (Number.isNaN(numeric)) {
      return false
    }

    if (next.length === 1) {
      return numeric <= max
    }

    return numeric >= 1 && numeric <= max
  }

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

  for (const char of cleaned) {
    if (char === '.') {
      if (day.length > 0 && !hasDayDot) {
        hasDayDot = true
        if (day.length === 1) {
          day = `0${day}`
        }
      } else if (hasDayDot && month.length > 0 && !hasMonthDot) {
        hasMonthDot = true
        if (month.length === 1) {
          month = `0${month}`
        }
      }
      continue
    }

    if (!hasDayDot) {
      if (day.length >= 2) {
        hasDayDot = true
        if (!canAppend(month, char, 12)) {
          continue
        }
        month += char
        if (month.length === 1 && month >= '2') {
          month = `0${month}`
          hasMonthDot = true
        } else if (month.length === 2) {
          hasMonthDot = true
        }
        continue
      }

      if (!canAppend(day, char, 31)) {
        continue
      }

      day += char

      if (day.length === 2) {
        hasDayDot = true
      }
      continue
    }

    if (!hasMonthDot) {
      if (month.length >= 2) {
        hasMonthDot = true
        if (year.length < 4) {
          year += char
        }
        continue
      }

      if (!canAppend(month, char, 12)) {
        continue
      }

      month += char

      if (month.length === 1 && month >= '2') {
        month = `0${month}`
        hasMonthDot = true
      } else if (month.length === 2) {
        hasMonthDot = true
      }
      continue
    }

    if (year.length < 4) {
      year += char
    }
  }

  day = clampPart(day, 31)
  month = clampPart(month, 12)

  if (!hasDayDot && !month && !year) {
    return day
  }

  if (!hasMonthDot && !year) {
    return `${day}.${month}`
  }

  return `${day}.${month}.${year}`
}

export function parseBirthdayDate(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    const year = Number(isoMatch[1])
    const month = Number(isoMatch[2])
    const day = Number(isoMatch[3])
    const date = new Date(year, month - 1, day)
    return Number.isNaN(date.getTime()) ? null : startOfDay(date)
  }

  const dottedMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (dottedMatch) {
    const day = Number(dottedMatch[1])
    const month = Number(dottedMatch[2])
    const year = Number(dottedMatch[3])
    const date = new Date(year, month - 1, day)
    return Number.isNaN(date.getTime()) ? null : startOfDay(date)
  }

  const russianMatch = trimmed.match(/^(\d{1,2})\s+([а-яё]+)\s+(\d{4})/i)
  if (russianMatch) {
    const day = Number(russianMatch[1])
    const monthName = russianMatch[2]!.toLowerCase()
    const year = Number(russianMatch[3])
    const month = MONTH_NAMES_GENITIVE.findIndex(name => name === monthName)

    if (month >= 0) {
      const date = new Date(year, month, day)
      return Number.isNaN(date.getTime()) ? null : startOfDay(date)
    }
  }

  return parseDisplayDate(trimmed)
}

export function parseDisplayDateToApiDate(value: string) {
  const date = parseDisplayDate(value)

  return date ? formatApiDate(date) : undefined
}

export function isSameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate()
}

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function getDefaultStayCheckIn() {
  return startOfDay(new Date())
}

export function getDefaultStayCheckOut() {
  const tomorrow = startOfDay(new Date())
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow
}

export function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

export function getMonthTitle(date: Date) {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`
}

export function getWeekdayNames() {
  return WEEKDAY_NAMES
}

export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
}

export function getCalendarDays(year: number, month: number): CalendarDay[] {
  const firstDay = new Date(year, month, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const gridStart = new Date(year, month, 1 - startOffset)
  const days: CalendarDay[] = []

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index)
    days.push({
      date,
      isCurrentMonth: date.getMonth() === month,
    })
  }

  return days
}

export function formatBookingDate(date: Date) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${day}.${month}.${year}`
}

export function formatBookingDateFromDisplay(value: string) {
  const parsed = parseDisplayDate(value)

  if (!parsed) {
    return value
  }

  return formatBookingDate(parsed)
}

export function countNightsBetween(checkIn: Date, checkOut: Date) {
  const start = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate())
  const end = new Date(checkOut.getFullYear(), checkOut.getMonth(), checkOut.getDate())
  const diff = end.getTime() - start.getTime()

  if (diff <= 0) {
    return 1
  }

  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)))
}

