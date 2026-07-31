import type { Role } from '~/types/api'
import type { UpdateUserPayload } from '~/api/user'
import type { ProfileUser } from '~/types/user'
import {
  createEmptyWeapon,
  extractAvatarUrl,
  isBrokenMediaAvatarUrl,
  normalizeUserProfile,
  resolveAvatarUrl,
  resolveRoleLabel,
  unwrapProfilePayload,
} from '~/utils/user'
import {
  clearUserWeaponsCache,
  readHunterBilletCache,
  writeHunterBilletCache,
} from '~/utils/userWeaponsCache'

const PROFILE_CACHE_PREFIX = 'wh_profile_user'
const ROLES_CACHE_KEY = 'wh_profile_roles'

/** Общий на все вызовы useProfile — иначе layout + page стартуют два параллельных запроса */
let loadProfilePromise: Promise<void> | null = null

function readStorageJson<T>(key: string): T | null {
  if (!import.meta.client) {
    return null
  }

  try {
    const raw = localStorage.getItem(key)

    if (!raw) {
      return null
    }

    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeStorageJson(key: string, value: unknown) {
  if (!import.meta.client) {
    return
  }

  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore quota / private mode
  }
}

function removeStorageKey(key: string) {
  if (!import.meta.client) {
    return
  }

  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

function profileCacheKey(userId: number | string) {
  return `${PROFILE_CACHE_PREFIX}:${userId}`
}

export function useProfile() {
  const config = useRuntimeConfig()
  const { user } = useAuth()
  const { user: userApi, roles: rolesApi, auth: authApi } = useApi()
  const { updateUser: updateAuthUser } = useAuthToken()

  const uploadsOrigin = new URL(config.public.apiBase as string).origin

  const profile = useState<ProfileUser | null>('profile_user', () => null)
  const pending = useState('profile_pending', () => false)
  const error = useState<string | null>('profile_error', () => null)
  const roleOptions = useState<Role[]>('profile_roles', () => [])

  function readCachedProfile(userId: number): ProfileUser | null {
    const cached = readStorageJson<ProfileUser>(profileCacheKey(userId))

    if (!cached || typeof cached !== 'object' || Number(cached.id) !== Number(userId)) {
      return null
    }

    return cached
  }

  function writeCachedProfile(profileData: ProfileUser) {
    writeStorageJson(profileCacheKey(profileData.id), profileData)
  }

  function clearCachedProfile(userId?: number | null) {
    if (userId) {
      removeStorageKey(profileCacheKey(userId))
    }
  }

  function hydrateRolesFromCache() {
    if (roleOptions.value.length > 0) {
      return roleOptions.value
    }

    const cached = readStorageJson<Role[]>(ROLES_CACHE_KEY)

    if (Array.isArray(cached) && cached.length > 0) {
      roleOptions.value = cached
      return cached
    }

    return []
  }

  async function ensureRoles(force = false) {
    if (!force) {
      const fromMemoryOrCache = hydrateRolesFromCache()

      if (fromMemoryOrCache.length > 0) {
        return fromMemoryOrCache
      }
    }

    try {
      const response = await rolesApi.getRoles()

      if (response.success) {
        roleOptions.value = response.data
        writeStorageJson(ROLES_CACHE_KEY, response.data)
      }
    } catch {
      // Справочник ролей не обязателен для отображения профиля.
    }

    return roleOptions.value
  }

  function applyRoleLabel(profileData: ProfileUser, source: Record<string, unknown>, roles: Role[]): ProfileUser {
    return {
      ...profileData,
      role_name: resolveRoleLabel(profileData.role_name, profileData.role_code, roles),
    }
  }

  function avatarFallbacks(userId?: number | null) {
    return [
      profile.value?.avatar,
      userId ? readCachedProfile(userId)?.avatar : null,
      user.value?.avatar,
    ]
  }

  function withPreservedAvatar(profileData: ProfileUser, fallbacks: Array<string | null | undefined>): ProfileUser {
    const avatar = profileData.avatar ?? resolveAvatarUrl({}, fallbacks, uploadsOrigin)

    if (avatar === profileData.avatar) {
      return profileData
    }

    return {
      ...profileData,
      avatar,
    }
  }

  async function syncAvatarFromMe(): Promise<string | null> {
    try {
      const response = await authApi.getMe() as { success?: boolean, data?: unknown }
      const payload = response.success === false ? null : (response.data ?? response)
      const source = unwrapProfilePayload(payload)

      return extractAvatarUrl(source, uploadsOrigin)
    } catch {
      return null
    }
  }

  async function ensureProfileAvatar(userId: number) {
    if (profile.value?.avatar) {
      return
    }

    const meAvatar = await syncAvatarFromMe()

    if (!meAvatar) {
      return
    }

    if (profile.value) {
      patchCachedProfile({ avatar: meAvatar })
      return
    }

    const cached = readCachedProfile(userId)

    if (cached) {
      applyProfile(withPreservedAvatar(cached, [meAvatar, user.value?.avatar]))
    }
  }

  function resolveHunterBilletNumber(profileData: ProfileUser): string {
    const fromPayload = profileData.hunter_billet_number.trim()
    const fromMemory = profile.value?.id === profileData.id
      ? profile.value.hunter_billet_number.trim()
      : ''
    const fromProfileCache = readCachedProfile(profileData.id)?.hunter_billet_number.trim() ?? ''
    const fromBilletCache = readHunterBilletCache(profileData.id) ?? ''

    return fromPayload || fromMemory || fromProfileCache || fromBilletCache
  }

  function applyProfile(profileData: ProfileUser) {
    const preservedBillet = resolveHunterBilletNumber(profileData)

    const merged = withPreservedAvatar({
      ...profileData,
      hunter_billet_number: preservedBillet,
    }, avatarFallbacks(profileData.id))
    profile.value = merged
    writeCachedProfile(merged)

    if (preservedBillet) {
      writeHunterBilletCache(profileData.id, preservedBillet)
    }

    const authPatch: Parameters<typeof updateAuthUser>[0] = {
      id: profileData.id,
      first_name: merged.first_name,
      last_name: merged.last_name,
      email: merged.email,
      role: merged.role_code || user.value?.role || null,
      role_name: merged.role_name || null,
      created_at: merged.created_at || null,
    }

    if (merged.avatar) {
      authPatch.avatar = merged.avatar
    }

    updateAuthUser(authPatch)
  }

  function cacheNeedsAvatarRefresh(userId: number) {
    const cached = readCachedProfile(userId)

    if (!cached) {
      return false
    }

    if (isBrokenMediaAvatarUrl(cached.avatar) || isBrokenMediaAvatarUrl(user.value?.avatar ?? null)) {
      return true
    }

    return !cached.avatar && !user.value?.avatar
  }

  function hydrateFromCache(userId: number) {
    if (profile.value) {
      hydrateRolesFromCache()

      if (profile.value.avatar || user.value?.avatar) {
        return true
      }

      const cached = readCachedProfile(userId)

      if (cached?.avatar) {
        profile.value = withPreservedAvatar(profile.value, [cached.avatar])
        writeCachedProfile(profile.value)
        return true
      }

      return false
    }

    const cached = readCachedProfile(userId)

    if (!cached) {
      return false
    }

    const hydrated = withPreservedAvatar(
      {
        ...cached,
        hunter_billet_number: resolveHunterBilletNumber(cached),
      },
      avatarFallbacks(userId),
    )
    profile.value = hydrated
    writeCachedProfile(hydrated)
    hydrateRolesFromCache()
    return true
  }

  async function loadProfile(force = false) {
    const userId = user.value?.id

    if (!userId) {
      return
    }

    const shouldUseCacheOnly = !force && !cacheNeedsAvatarRefresh(userId)

    // Обычный заход: кэш без запроса, но если в кэше нет аватара — идём в API
    if (shouldUseCacheOnly && hydrateFromCache(userId)) {
      return
    }

    if (!profile.value) {
      hydrateFromCache(userId)
    }

    if (loadProfilePromise && !force && !cacheNeedsAvatarRefresh(userId)) {
      await loadProfilePromise
      return
    }

    pending.value = true
    error.value = null

    const request = (async () => {
      try {
        const [response, roles] = await Promise.all([
          userApi.getUser(userId),
          // Справочник ролей кэшируем отдельно; при обновлении профиля не дёргаем /roles снова
          ensureRoles(false),
        ])

        if (!response.success) {
          error.value = response.message || 'Не удалось загрузить профиль'
          await ensureProfileAvatar(userId)
          return
        }

        const source = unwrapProfilePayload(response.data)
        const normalized = applyRoleLabel(
          normalizeUserProfile(response.data, uploadsOrigin),
          source,
          roles,
        )
        applyProfile(normalized)
        await ensureProfileAvatar(userId)
      } catch {
        error.value = 'Не удалось загрузить профиль'
        await ensureProfileAvatar(userId)
      } finally {
        pending.value = false

        if (loadProfilePromise === request) {
          loadProfilePromise = null
        }
      }
    })()

    loadProfilePromise = request
    await request
  }

  function patchCachedProfile(patch: Partial<ProfileUser>) {
    if (!profile.value) {
      return
    }

    const next = {
      ...profile.value,
      ...patch,
    }

    applyProfile(next)
  }

  async function saveProfile(payload: UpdateUserPayload) {
    const previousAvatar = profile.value?.avatar ?? user.value?.avatar ?? null
    const uploadedNewAvatar = payload.avatar instanceof File
    const selectedExistingAvatar = payload.avatar_id != null
    const response = await userApi.updateUser(payload)

    if ('success' in response && response.success) {
      const responseAvatar = extractAvatarUrl(
        unwrapProfilePayload('data' in response ? response.data : response),
        uploadsOrigin,
      )

      if (responseAvatar) {
        patchCachedProfile({ avatar: responseAvatar })
      }

      // Сразу пишем номер билета в кэш — не ждём ответ GET /user
      if (profile.value && payload.hunter_billet_number != null) {
        patchCachedProfile({
          hunter_billet_number: String(payload.hunter_billet_number).trim(),
        })
      }

      await loadProfile(true)

      // После POST /user API иногда не возвращает avatar_url — не затираем старый аватар
      if (!uploadedNewAvatar && !selectedExistingAvatar && profile.value && !profile.value.avatar && previousAvatar) {
        patchCachedProfile({ avatar: previousAvatar })
      } else if ((uploadedNewAvatar || selectedExistingAvatar) && responseAvatar && profile.value && !profile.value.avatar) {
        patchCachedProfile({ avatar: responseAvatar })
      }
    }

    return response
  }

  function invalidateProfileCache(userId?: number | null) {
    clearCachedProfile(userId ?? profile.value?.id ?? user.value?.id ?? null)
    profile.value = null
    error.value = null
  }

  function resetProfile() {
    const userId = profile.value?.id ?? user.value?.id ?? null
    clearCachedProfile(userId)
    clearUserWeaponsCache(userId)
    profile.value = null
    error.value = null
  }

  function addWeaponRow() {
    if (!profile.value) {
      return
    }

    profile.value.weapons.push(createEmptyWeapon())
  }

  return {
    profile,
    pending,
    error,
    loadProfile,
    saveProfile,
    patchCachedProfile,
    invalidateProfileCache,
    resetProfile,
    addWeaponRow,
  }
}
