
export function formatLocationInPrepositional(name: string) {
  const trimmed = name.trim()

  if (!trimmed) {
    return ''
  }

  if (/ая\s+область$/i.test(trimmed)) {
    return trimmed.replace(/ая\s+область$/i, 'ой области')
  }

  if (/ия$/i.test(trimmed)) {
    return trimmed.replace(/ия$/i, 'ии')
  }

  return trimmed
}
