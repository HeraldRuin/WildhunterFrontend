import type { Role } from '~/types/api'
import type { UpdateUserPayload } from '~/api/user'
import type { ProfileUser } from '~/types/user'
import { createEmptyWeapon, normalizeUserProfile, resolveRoleLabel, unwrapProfilePayload } from '~/utils/user'
import { clearUserWeaponsCache } from '~/utils/userWeaponsCache'

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
  const { user } = useAuth()
  const { user: userApi, roles: rolesApi } = useApi()
  const { updateUser: updateAuthUser } = useAuthToken()

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

  function applyProfile(profileData: ProfileUser) {
    profile.value = profileData
    writeCachedProfile(profileData)

    updateAuthUser({
      id: profileData.id,
      first_name: profileData.first_name,
      last_name: profileData.last_name,
      email: profileData.email,
      avatar: profileData.avatar,
      role: profileData.role_code || user.value?.role || null,
      role_name: profileData.role_name || null,
      created_at: profileData.created_at || null,
    })
  }

  function hydrateFromCache(userId: number) {
    if (profile.value) {
      hydrateRolesFromCache()
      return true
    }

    const cached = readCachedProfile(userId)

    if (!cached) {
      return false
    }

    profile.value = cached
    hydrateRolesFromCache()
    return true
  }

  async function loadProfile(force = false) {
    const userId = user.value?.id

    if (!userId) {
      return
    }

    // Обычный заход: только кэш, без запросов к /user и /roles
    if (!force && hydrateFromCache(userId)) {
      return
    }

    if (loadProfilePromise && !force) {
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
          return
        }

        const source = unwrapProfilePayload(response.data)
        const normalized = applyRoleLabel(normalizeUserProfile(response.data), source, roles)
        applyProfile(normalized)
      } catch {
        error.value = 'Не удалось загрузить профиль'
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
    const response = await userApi.updateUser(payload)

    if ('success' in response && response.success) {
      // Сразу пишем номер билета в кэш — не ждём ответ GET /user
      if (profile.value && payload.hunter_billet_number != null) {
        patchCachedProfile({
          hunter_billet_number: String(payload.hunter_billet_number).trim(),
        })
      }

      await loadProfile(true)
    }

    return response
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
    resetProfile,
    addWeaponRow,
  }
}
