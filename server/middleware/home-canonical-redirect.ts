const PRODUCTION_HOSTS = new Set(['wild-hunter.ru', 'www.wild-hunter.ru'])
const CANONICAL_ORIGIN = 'https://wild-hunter.ru'

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

  if (!fromWww && !hasExtraSlashes && !hasEmptyQuery) {
    return
  }

  const query = search === '' ? '' : `?${search}`
  return sendRedirect(event, `${CANONICAL_ORIGIN}${query}`, 301)
})
