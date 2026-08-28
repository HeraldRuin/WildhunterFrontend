import type { AuthSession, AuthUser } from '~/types/auth'
import { normalizeAvatarUrl, resolveAvatarUrl, unwrapProfilePayload } from '~/utils/user'

const TOKEN_KEY = 'wh_auth_token'
const TOKEN_TYPE_KEY = 'wh_auth_token_type'
const USER_KEY = 'wh_auth_user'
const AUTH_FLAG_KEY = 'wh_auth'
const THIRTY_DAYS = 60 * 60 * 24 * 30
const MAX_TOKEN_COOKIE_LENGTH = 3500

function readUser(raw: string | null): AuthUser | null {
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

function pickUserForStorage(
  user: AuthUser | null | undefined,
  uploadsOrigin = '',
): AuthUser | null {
  if (!user) {
    return null
  }

  const source = unwrapProfilePayload(user)
  const avatar = resolveAvatarUrl(source, [user.avatar], uploadsOrigin)

  return {
    id: user.id,
    first_name: user.first_name ?? '',
    last_name: user.last_name ?? '',
    email: user.email ?? '',
    avatar,
    role: user.role ?? null,
    role_name: user.role_name ?? null,
    created_at: user.created_at ?? null,
  }
}

function readBrowserStorage(): AuthSession | null {
  if (!import.meta.client) {
    return null
  }

  for (const storage of [localStorage, sessionStorage]) {
    const storedToken = storage.getItem(TOKEN_KEY)

    if (!storedToken) {
      continue
    }

    return {
      token: storedToken,
      token_type: storage.getItem(TOKEN_TYPE_KEY) || 'Bearer',
      user: readUser(storage.getItem(USER_KEY)),
    }
  }

  return null
}

function persistBrowserStorage(session: AuthSession, remember: boolean, uploadsOrigin = '') {
  if (!import.meta.client) {
    return
  }

  const storage = remember ? localStorage : sessionStorage
  const otherStorage = remember ? sessionStorage : localStorage

  storage.setItem(TOKEN_KEY, session.token)
  storage.setItem(TOKEN_TYPE_KEY, session.token_type || 'Bearer')

  const compactUser = pickUserForStorage(session.user, uploadsOrigin)

  if (compactUser) {
    storage.setItem(USER_KEY, JSON.stringify(compactUser))
  } else {
    storage.removeItem(USER_KEY)
  }

  otherStorage.removeItem(TOKEN_KEY)
  otherStorage.removeItem(TOKEN_TYPE_KEY)
  otherStorage.removeItem(USER_KEY)
}

function clearBrowserStorage() {
  if (!import.meta.client) {
    return
  }

  for (const storage of [localStorage, sessionStorage]) {
    storage.removeItem(TOKEN_KEY)
    storage.removeItem(TOKEN_TYPE_KEY)
    storage.removeItem(USER_KEY)
  }
}

export function useAuthToken() {
  const config = useRuntimeConfig()
  const uploadsOrigin = new URL(config.public.apiBase as string).origin

  const tokenCookie = useCookie<string | null>('wh_auth_token', {
    default: () => null,
    sameSite: 'lax',
    maxAge: THIRTY_DAYS,
    watch: true,
  })

  const tokenTypeCookie = useCookie<string>('wh_auth_token_type', {
    default: () => 'Bearer',
    sameSite: 'lax',
    maxAge: THIRTY_DAYS,
    watch: true,
  })

  const userJson = useCookie<string | null>('wh_auth_user', {
    default: () => null,
    sameSite: 'lax',
    maxAge: THIRTY_DAYS,
    watch: true,
  })

  const authFlag = useCookie<string | null>(AUTH_FLAG_KEY, {
    default: () => null,
    sameSite: 'lax',
    maxAge: THIRTY_DAYS,
    watch: true,
  })

  const token = useState<string | null>('auth_token', () => tokenCookie.value)
  const tokenType = useState<string>('auth_token_type', () => tokenTypeCookie.value || 'Bearer')

  if (!token.value && tokenCookie.value) {
    token.value = tokenCookie.value
  }

  if (!tokenType.value && tokenTypeCookie.value) {
    tokenType.value = tokenTypeCookie.value
  }

  const user = computed<AuthUser | null>({
    get() {
      return readUser(userJson.value)
    },
    set(value) {
      const compactUser = pickUserForStorage(value, uploadsOrigin)
      userJson.value = compactUser ? JSON.stringify(compactUser) : null
    },
  })

  const isAuthenticated = computed(() => Boolean(token.value || authFlag.value))

  const authorizationHeader = computed(() => {
    if (!token.value) {
      return null
    }

    return `${tokenType.value} ${token.value}`
  })

  function applySession(session: AuthSession, remember = true) {
    const compactUser = pickUserForStorage(session.user, uploadsOrigin)

    token.value = session.token
    tokenType.value = session.token_type || 'Bearer'
    user.value = compactUser
    authFlag.value = '1'

    tokenCookie.value = session.token.length <= MAX_TOKEN_COOKIE_LENGTH
      ? session.token
      : null
    tokenTypeCookie.value = session.token_type || 'Bearer'

    persistBrowserStorage({
      token: session.token,
      token_type: session.token_type,
      user: compactUser,
    }, remember, uploadsOrigin)
  }

  function setSession(session: AuthSession, remember = true) {
    applySession(session, remember)
  }

  function clearSession() {
    token.value = null
    tokenType.value = 'Bearer'
    user.value = null
    authFlag.value = null
    tokenCookie.value = null
    tokenTypeCookie.value = 'Bearer'
    clearBrowserStorage()
  }

  function updateUser(nextUser: Partial<AuthUser>) {
    const current = user.value

    if (!current) {
      return
    }

    const { avatar, ...rest } = nextUser
    const merged: AuthUser = {
      ...current,
      ...rest,
    }

    if (avatar) {
      merged.avatar = normalizeAvatarUrl(avatar, uploadsOrigin) ?? avatar
    }

    user.value = merged

    const stored = readBrowserStorage()

    if (stored?.token) {
      persistBrowserStorage({
        ...stored,
        user: user.value,
      }, Boolean(localStorage.getItem(TOKEN_KEY)), uploadsOrigin)
    }
  }

  function initFromStorage() {
    if (!import.meta.client) {
      return
    }

    const stored = readBrowserStorage()

    if (!stored) {
      return
    }

    // Токен может уже быть из cookie, а user — только в localStorage.
    // Раньше при наличии token гидрация пропускалась → baseadmin слал на /404.
    const needsToken = !token.value
    const needsUser = !user.value

    if (needsToken || needsUser) {
      applySession(stored, Boolean(localStorage.getItem(TOKEN_KEY)))
    }
  }

  return {
    token: readonly(token),
    tokenType: readonly(tokenType),
    user: readonly(user),
    isAuthenticated,
    authorizationHeader,
    initFromStorage,
    setSession,
    clearSession,
    updateUser,
  }
}
