export type HunterDocumentKind = 'billet' | 'license'

export const HUNTER_BILLET_NUMBER_MAX_LENGTH = 14

export const HUNTER_LICENSE_NUMBER_MAX_LENGTH = 12

const DOCUMENT_NUMBER_DISALLOWED = /[^0-9A-Za-zА-Яа-яЁё\s\-№Nn]/g
const SERIES_PATTERN = /[A-ZА-ЯЁ]/
const SEPARATOR_PATTERN = /[\s\-№N]/
const DIGIT_PATTERN = /\d/

const RULES: Record<HunterDocumentKind, {
  seriesMin: number
  seriesMax: number
  numberMin: number
  numberMax: number
  maxLength: number
}> = {
  billet: {
    seriesMin: 1,
    seriesMax: 2,
    numberMin: 4,
    numberMax: 11,
    maxLength: HUNTER_BILLET_NUMBER_MAX_LENGTH,
  },
  license: {
    seriesMin: 2,
    seriesMax: 3,
    numberMin: 4,
    numberMax: 8,
    maxLength: HUNTER_LICENSE_NUMBER_MAX_LENGTH,
  },
}

type ParsedHunterDocumentNumber = {
  series: string
  separator: string
  number: string
}

function getRules(kind: HunterDocumentKind) {
  return RULES[kind]
}

function parseHunterDocumentNumber(value: string, kind: HunterDocumentKind): ParsedHunterDocumentNumber {
  const cleaned = value.replace(DOCUMENT_NUMBER_DISALLOWED, '').toUpperCase()
  const { seriesMax, numberMax } = getRules(kind)

  let index = 0
  let series = ''

  while (index < cleaned.length && SERIES_PATTERN.test(cleaned[index] ?? '')) {
    series += cleaned[index]
    index += 1

    if (series.length >= seriesMax) {
      break
    }
  }

  let rest = cleaned.slice(index)

  let separator = ''

  while (rest.length > 0 && SEPARATOR_PATTERN.test(rest[0] ?? '')) {
    separator += rest[0]
    rest = rest.slice(1)

    if (separator.length >= 2) {
      break
    }
  }

  const number = rest.replace(/\D/g, '').slice(0, numberMax)

  return { series, separator, number }
}

function formatHunterDocumentNumber(parts: ParsedHunterDocumentNumber) {
  return `${parts.series}${parts.separator}${parts.number}`
}

export function normalizeHunterDocumentNumber(value: string, kind: HunterDocumentKind) {
  return formatHunterDocumentNumber(parseHunterDocumentNumber(value, kind))
}

export function isValidHunterDocumentNumber(value: string, kind: HunterDocumentKind) {
  const normalized = normalizeHunterDocumentNumber(value, kind)

  if (!normalized) {
    return false
  }

  const { seriesMin, seriesMax, numberMin, numberMax } = getRules(kind)
  const { series, number } = parseHunterDocumentNumber(normalized, kind)

  return (
    series.length >= seriesMin
    && series.length <= seriesMax
    && number.length >= numberMin
    && number.length <= numberMax
  )
}

export function isDocumentNumberKeyAllowed(
  key: string,
  currentValue: string,
  kind: HunterDocumentKind,
) {
  const { seriesMax, numberMax } = getRules(kind)
  const current = parseHunterDocumentNumber(currentValue, kind)

  if (SERIES_PATTERN.test(key)) {
    if (current.series.length >= seriesMax || current.number.length > 0) {
      return false
    }

    return true
  }

  if (DIGIT_PATTERN.test(key)) {
    if (current.number.length >= numberMax) {
      return false
    }

    return true
  }

  if (SEPARATOR_PATTERN.test(key)) {
    if (!current.series.length || current.number.length > 0 || current.separator.length >= 2) {
      return false
    }

    return true
  }

  return false
}

export function hunterDocumentMaxLength(kind: HunterDocumentKind) {
  return getRules(kind).maxLength
}
