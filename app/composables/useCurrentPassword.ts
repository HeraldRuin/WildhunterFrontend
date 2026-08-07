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

  function readSessionCache() {
    if (!import.meta.client) {
      return null
    }

    return sessionStorage.getItem(CACHE_KEY)
  }

  async function loadCurrentPassword(force = false) {
    if (!force) {
      if (cachedPassword.value) {
        return cachedPassword.value
      }

      // useState после SSR может остаться null — подтягиваем sessionStorage
      const fromStorage = readSessionCache()
      if (fromStorage) {
        cachedPassword.value = fromStorage
        return fromStorage
      }
    }

    try {
      const response = await userApi.getCurrentPassword()

      if ('success' in response && response.success) {
        const password = response.data?.current_password || null

        // Не затираем локальный кэш (логин/регистрация), если API вернул null
        if (password) {
          persist(password)
          return password
        }

        return cachedPassword.value || readSessionCache()
      }
    } catch {
      // Поле остаётся пустым — пользователь введёт пароль вручную.
    }

    return cachedPassword.value || readSessionCache()
  }

  async function refreshCurrentPassword() {
    persist(null)
    return loadCurrentPassword(true)
  }

  function setCurrentPassword(password: string | null) {
    persist(password)
  }

  function clearCurrentPassword() {
    persist(null)
  }

  return {
    cachedPassword,
    loadCurrentPassword,
    refreshCurrentPassword,
    setCurrentPassword,
    clearCurrentPassword,
  }
}
