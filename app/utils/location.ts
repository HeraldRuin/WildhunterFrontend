export function getLocationPath(slug: string | null | undefined, id: number | string) {
  const safeSlug = String(slug || '').trim() || String(id)

  return `/locations/${safeSlug}/${id}`
}

export function getLocationMapPath(slug: string | null | undefined, id: number | string) {
  return `${getLocationPath(slug, id)}/map`
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
