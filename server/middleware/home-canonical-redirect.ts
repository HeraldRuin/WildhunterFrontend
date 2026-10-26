const PRODUCTION_HOSTS = new Set(['wild-hunter.ru', 'www.wild-hunter.ru'])
const CANONICAL_ORIGIN = 'https://wild-hunter.ru'
const SEARCH_KEYS = new Set(['location', 'animal', 'checkIn', 'checkOut', 'guests'])

function isTrackingKey(key: string) {
  const name = key.toLowerCase()
  return name === 'utm'
    || name.startsWith('utm_')
    || name === 'gclid'
    || name === 'yclid'
    || name === 'ysclid'
    || name === 'fbclid'
    || name === '_openstat'
}

function searchWithoutTracking(search: string) {
  const params = new URLSearchParams(search)
  let removedTracking = false
  for (const key of [...params.keys()]) {
    if (!SEARCH_KEYS.has(key) && isTrackingKey(key)) {
      params.delete(key)
      removedTracking = true
    }
  }
  return { search: params.toString(), removedTracking }
}

export default defineEventHandler((event) => {
  const host = getRequestHost(event, { xForwardedHost: true }).toLowerCase()
  if (!PRODUCTION_HOSTS.has(host)) {
    return
  }

  const raw = event.node.req.url || '/'
  const queryIndex = raw.indexOf('?')
  const path = queryIndex === -1 ? raw : raw.slice(0, queryIndex)
  const search = queryIndex === -1 ? '' : raw.slice(queryIndex + 1)

  if (!/^\/+$/.test(path)) {
    return
  }

  const fromWww = host === 'www.wild-hunter.ru'
  const hasExtraSlashes = path.length > 1
  const hasEmptyQuery = queryIndex !== -1 && search === ''
  const { search: keptSearch, removedTracking } = searchWithoutTracking(search)

  if (!fromWww && !hasExtraSlashes && !hasEmptyQuery && !removedTracking) {
    return
  }

  const query = keptSearch === '' ? '' : `?${keptSearch}`
  return sendRedirect(event, `${CANONICAL_ORIGIN}${query}`, 301)
})
