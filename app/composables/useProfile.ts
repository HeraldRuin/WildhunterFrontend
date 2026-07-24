import type { Role } from '~/types/api'
import type { ProfileUser } from '~/types/user'
import { createEmptyWeapon, normalizeUserProfile, resolveRoleLabel, unwrapProfilePayload } from '~/utils/user'

export function useProfile() {
  const { user } = useAuth()
  const { user: userApi, roles: rolesApi } = useApi()
  const { updateUser } = useAuthToken()

  const profile = useState<ProfileUser | null>('profile_user', () => null)
  const pending = useState('profile_pending', () => false)
  const error = useState<string | null>('profile_error', () => null)
  const roleOptions = useState<Role[]>('profile_roles', () => [])

  async function ensureRoles() {
    if (roleOptions.value.length > 0) {
      return roleOptions.value
    }

    try {
      const response = await rolesApi.getRoles()

      if (response.success) {
        roleOptions.value = response.data
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

  async function loadProfile(force = false) {
    const userId = user.value?.id

    if (!userId) {
      return
    }

    if (profile.value && !force) {
      return
    }

    pending.value = true
    error.value = null

    try {
      const [response, roles] = await Promise.all([
        userApi.getUser(userId),
        ensureRoles(),
      ])

      if (!response.success) {
        error.value = response.message || 'Не удалось загрузить профиль'
        return
      }

      const source = unwrapProfilePayload(response.data)
      const normalized = applyRoleLabel(normalizeUserProfile(response.data), source, roles)
      profile.value = normalized

      updateUser({
        id: normalized.id,
        first_name: normalized.first_name,
        last_name: normalized.last_name,
        email: normalized.email,
        avatar: normalized.avatar,
        role: normalized.role_code || user.value?.role || null,
        role_name: normalized.role_name || null,
        created_at: normalized.created_at || null,
      })
    } catch {
      error.value = 'Не удалось загрузить профиль'
    } finally {
      pending.value = false
    }
  }

  function resetProfile() {
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
    resetProfile,
    addWeaponRow,
  }
}
