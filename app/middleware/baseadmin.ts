export default defineNuxtRouteMiddleware(async () => {
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

  if (!import.meta.client) {
    return
  }

  const { loadProfile } = useProfile()
  const { isBaseAdmin } = useUserRole()

  if (isBaseAdmin.value) {
    return
  }

  await loadProfile()

  if (!isBaseAdmin.value) {
    window.location.replace('/404')
  }
})
