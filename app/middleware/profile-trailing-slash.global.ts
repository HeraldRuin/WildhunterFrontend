export default defineNuxtRouteMiddleware((to) => {
  const { path } = to

  const isAdminPage = path === '/profile'
    || path.startsWith('/profile/')
    || path === '/rooms'
    || path.startsWith('/rooms/')

  if (!isAdminPage) {
    return
  }

  if (path.endsWith('/')) {
    return
  }

  return navigateTo(
    { path: `${path}/`, query: to.query, hash: to.hash },
    { redirectCode: 301, replace: true },
  )
})
