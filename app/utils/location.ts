export function getLocationPath(slug: string | null | undefined) {
  const safeSlug = String(slug || '').trim()

  return safeSlug ? `/locations/${safeSlug}` : '/locations'
}

export function getLocationMapPath(slug: string | null | undefined) {
  const safeSlug = String(slug || '').trim()

  return safeSlug ? `/locations/${safeSlug}/map` : '/locations'
}

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
