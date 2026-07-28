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
    const monthName = russianMatch[2].toLowerCase()
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
