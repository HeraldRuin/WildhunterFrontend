export function extractPhoneDigits(value: string) {
  let digits = value.replace(/\D/g, '')

  if (digits.startsWith('7') || digits.startsWith('8')) {
    digits = digits.slice(1)
  }

  return digits.slice(0, 10)
}

export function formatPhone(value: string) {
  const normalized = extractPhoneDigits(value)

  if (!normalized.length) {
    return ''
  }

  let formatted = '+7'

  formatted += ` (${normalized.slice(0, 3)}`

  if (normalized.length >= 3) {
    formatted += ')'
  }

  if (normalized.length > 3) {
    formatted += ` ${normalized.slice(3, 6)}`
  }

  if (normalized.length > 6) {
    formatted += `-${normalized.slice(6, 8)}`
  }

  if (normalized.length > 8) {
    formatted += `-${normalized.slice(8, 10)}`
  }

  return formatted
}
