const CACHE_KEY = 'wh_current_password'

export function useCurrentPassword() {
  const { user: userApi } = useApi()

  const cachedPassword = useState<string | null>('cached_current_password', () => {
    if (!import.meta.client) {
      return null
    }

    return sessionStorage.getItem(CACHE_KEY)
  })

  function persist(password: string | null) {
    cachedPassword.value = password

    if (!import.meta.client) {
      return
    }

    if (password) {
      sessionStorage.setItem(CACHE_KEY, password)
      return
    }

    sessionStorage.removeItem(CACHE_KEY)
  }

  async function loadCurrentPassword(force = false) {
    if (!force && cachedPassword.value) {
      return cachedPassword.value
    }

    try {
      const response = await userApi.getCurrentPassword()

      if ('success' in response && response.success) {
        const password = response.data?.current_password || null
        persist(password)
        return password
      }
    } catch {
      // Поле остаётся пустым — пользователь введёт пароль вручную.
    }

    return cachedPassword.value
  }

  async function refreshCurrentPassword() {
    persist(null)
    return loadCurrentPassword(true)
  }

  function clearCurrentPassword() {
    persist(null)
  }

  return {
    cachedPassword,
    loadCurrentPassword,
    refreshCurrentPassword,
    clearCurrentPassword,
  }
}
