export default defineNuxtRouteMiddleware((to) => {
  const authToken = useAuthToken()

  if (import.meta.client) {
    authToken.initFromStorage()
  }

  if (authToken.isAuthenticated.value) {
    return
  }

  if (import.meta.client) {
    const { open: openLoginModal } = useLoginModal()
    nextTick(() => openLoginModal())
  }

  return navigateTo('/', { replace: true })
})
