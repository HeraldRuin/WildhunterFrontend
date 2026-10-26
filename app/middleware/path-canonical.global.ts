const LEGACY_HOME_PATHS = new Set([
  '/page/home-page-v2',
  '/page/space',
  '/page/polzovatelskoe-soglashenie',
  '/page/home-tour-agency',
  '/hotel',
])

export default defineNuxtRouteMiddleware((to) => {
  const collapsed = to.path.replace(/\/{2,}/g, '/') || '/'
  const lower = collapsed.toLowerCase()
  const bare = lower.length > 1 ? lower.replace(/\/+$/, '') : '/'
  const lastSegment = bare.split('/').pop() || ''

  if (bare !== '/' && lastSegment.includes('.')) {
    return
  }

  const normalized = LEGACY_HOME_PATHS.has(bare) || bare === '/'
    ? '/'
    : `${bare}/`

  if (normalized === to.path) {
    return
  }

  return navigateTo(
    { path: normalized, query: to.query, hash: to.hash },
    { redirectCode: 301, replace: true },
  )
})
