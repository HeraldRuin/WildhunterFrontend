const CANONICAL_ORIGIN = 'https://wild-hunter.ru'
const LEGACY_HOME_PATHS = new Set([
  '/page/home-page-v2',
  '/page/space',
  '/page/polzovatelskoe-soglashenie',
  '/page/home-tour-agency',
  '/hotel',
])

function normalizePath(path: string) {
  const collapsed = path.replace(/\/{2,}/g, '/') || '/'
  const lower = collapsed.toLowerCase()
  const bare = lower.length > 1 ? lower.replace(/\/+$/, '') : '/'

  if (LEGACY_HOME_PATHS.has(bare)) {
    return '/'
  }

  const lastSegment = bare.split('/').pop() || ''
  if (bare !== '/' && !lastSegment.includes('.')) {
    return `${bare}/`
  }

  return bare
}

export default defineEventHandler((event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') {
    return
  }

  const raw = event.node.req.url || '/'
  const queryIndex = raw.indexOf('?')
  const path = queryIndex === -1 ? raw : raw.slice(0, queryIndex)
  const search = queryIndex === -1 ? '' : raw.slice(queryIndex)

  if (path.startsWith('/_nuxt') || path.startsWith('/__nuxt') || path.startsWith('/api')) {
    return
  }

  const host = getRequestHost(event, { xForwardedHost: true }).split(':')[0].toLowerCase()
  const onProduction = host === 'wild-hunter.ru' || host === 'www.wild-hunter.ru'
  if (onProduction && /^\/+$/.test(path)) {
    return
  }

  const normalized = normalizePath(path)
  const fromWww = host === 'www.wild-hunter.ru'

  if (!fromWww && normalized === path) {
    return
  }

  const targetPath = normalized === '/' ? '/' : normalized
  if (fromWww || host === 'wild-hunter.ru') {
    const home = targetPath === '/' ? CANONICAL_ORIGIN : `${CANONICAL_ORIGIN}${targetPath}`
    return sendRedirect(event, `${home}${search}`, 301)
  }

  return sendRedirect(event, `${targetPath}${search}`, 301)
})
