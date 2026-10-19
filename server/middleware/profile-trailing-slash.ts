export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const { pathname } = url

  const isAdminPage = pathname === '/profile'
    || pathname.startsWith('/profile/')
    || pathname === '/rooms'
    || pathname.startsWith('/rooms/')

  if (!isAdminPage) {
    return
  }

  if (pathname.endsWith('/') || pathname.includes('.')) {
    return
  }

  return sendRedirect(event, `${pathname}/${url.search}`, 301)
})
