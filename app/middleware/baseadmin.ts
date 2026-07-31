export default defineNuxtRouteMiddleware(() => {
  const authToken = useAuthToken()

  if (import.meta.client) {
    authToken.initFromStorage()
  }

  if (!authToken.isAuthenticated.value) {
    if (import.meta.client) {
      const { open: openLoginModal } = useLoginModal()
      nextTick(() => openLoginModal())
    }

    return navigateTo('/', { replace: true })
  }

  const { isBaseAdmin } = useUserRole()

  if (!isBaseAdmin.value) {
    return navigateTo('/profile', { replace: true })
  }
})
