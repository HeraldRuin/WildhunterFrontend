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

  // Роль и 404 только на клиенте — createError/navigateTo здесь давали 500
  if (!import.meta.client) {
    return
  }

  const { loadProfile } = useProfile()
  const { isBaseAdmin, roleCode, roleName } = useUserRole()
  const roleKnown = Boolean(roleCode.value || roleName.value)

  if (isBaseAdmin.value) {
    return
  }

  // Роль уже известна и это не админ базы (охотник и др.)
  if (roleKnown) {
    window.location.replace('/404')
    return
  }

  await loadProfile()

  if (!isBaseAdmin.value) {
    window.location.replace('/404')
  }
})
