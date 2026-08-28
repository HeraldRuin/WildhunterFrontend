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
  const { isBaseAdmin } = useUserRole()

  if (isBaseAdmin.value) {
    return
  }

  // Не форсим API: при офлайне/ошибке оставляем кэш роли, иначе ломаем все /profile/*
  await loadProfile()

  if (!isBaseAdmin.value) {
    window.location.replace('/404')
  }
})
