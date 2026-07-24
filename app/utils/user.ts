import type { Role } from '~/types/api'
import type { ProfileUser, UserWeapon, WeaponOption } from '~/types/user'

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

export function unwrapProfilePayload(data: unknown): Record<string, unknown> {
  const root = asRecord(data)

  if (root.user) {
    return asRecord(root.user)
  }

  if (root.data) {
    const nested = asRecord(root.data)

    if (nested.user) {
      return asRecord(nested.user)
    }

    return nested
  }

  return root
}

export function extractRoleCode(source: Record<string, unknown>): string {
  if (typeof source.role_code === 'string' && source.role_code.trim()) {
    return source.role_code.trim()
  }

  if (typeof source.role === 'string' && source.role.trim()) {
    return source.role.trim()
  }

  const role = asRecord(source.role)

  if (typeof role.code === 'string' && role.code.trim()) {
    return role.code.trim()
  }

  return ''
}

export function extractRoleName(source: Record<string, unknown>): string {
  if (typeof source.role_name === 'string' && source.role_name.trim()) {
    return source.role_name.trim()
  }

  const role = source.role

  if (role && typeof role === 'object') {
    const roleObject = asRecord(role)

    if (typeof roleObject.name === 'string' && roleObject.name.trim()) {
      return roleObject.name.trim()
    }

    if (typeof roleObject.title === 'string' && roleObject.title.trim()) {
      return roleObject.title.trim()
    }
  }

  if (Array.isArray(source.roles) && source.roles.length > 0) {
    const firstRole = asRecord(source.roles[0])

    if (typeof firstRole.name === 'string' && firstRole.name.trim()) {
      return firstRole.name.trim()
    }
  }

  if (typeof source.user_role === 'string' && source.user_role.trim()) {
    return source.user_role.trim()
  }

  return extractRoleCode(source)
}

export function extractAvatarUrl(source: Record<string, unknown>): string | null {
  const avatar = source.avatar ?? source.avatar_url ?? source.avatar_thumb_url

  return typeof avatar === 'string' && avatar.length > 0 ? avatar : null
}

export function resolveRoleLabel(roleName: string, roleCode: string, roles: Role[]): string {
  if (roleName && roleName !== roleCode) {
    const matchedByName = roles.find((role) => role.name === roleName)

    if (matchedByName?.name) {
      return matchedByName.name
    }

    return roleName
  }

  const matchedByCode = roles.find((role) => role.code === roleCode || role.code === roleName)

  if (matchedByCode?.name) {
    return matchedByCode.name
  }

  return roleName || roleCode
}

export function formatBirthdayDisplay(value: unknown): string {
  if (!value || typeof value !== 'string') {
    return ''
  }

  if (value.includes('.')) {
    return value
  }

  const [year, month, day] = value.split('-')

  if (year && month && day) {
    return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year}`
  }

  return value
}

export function extractCreatedAt(source: Record<string, unknown>): string {
  const value = source.created_at
    ?? source.createdAt
    ?? source.registered_at
    ?? source.registration_date

  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  if (typeof value === 'number') {
    return new Date(value * 1000).toISOString()
  }

  return ''
}

export function formatMemberSince(value: string): string {
  const trimmed = value.trim()

  if (!trimmed) {
    return ''
  }

  const date = new Date(trimmed)

  if (Number.isNaN(date.getTime())) {
    // API may already return a localized date string, e.g. "24 июня 2026 г."
    return trimmed
  }

  return date.toLocaleDateString('ru-RU', {
    month: 'short',
    year: 'numeric',
  })
}

function normalizeWeaponOptions(value: unknown): WeaponOption[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      const source = asRecord(item)

      return {
        value: String(source.id ?? source.value ?? ''),
        label: String(source.title ?? source.name ?? source.label ?? ''),
      }
    })
    .filter(option => option.value && option.label)
}

function normalizeWeapons(value: unknown): UserWeapon[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((item) => {
    const source = asRecord(item)

    return {
      id: typeof source.id === 'number' ? source.id : source.id ? Number(source.id) : null,
      hunter_license_number: String(source.hunter_license_number ?? ''),
      hunter_license_date: String(source.hunter_license_date ?? ''),
      weapon_type_id: String(source.weapon_type_id ?? ''),
      caliber: String(source.caliber ?? ''),
    }
  })
}

export function normalizeUserProfile(data: unknown): ProfileUser {
  const source = unwrapProfilePayload(data)

  return {
    id: Number(source.id ?? 0),
    user_name: String(source.user_name ?? source.nik ?? ''),
    email: String(source.email ?? ''),
    first_name: String(source.first_name ?? ''),
    last_name: String(source.last_name ?? ''),
    phone: String(source.phone ?? ''),
    birthday: formatBirthdayDisplay(source.birthday),
    bio: String(source.bio ?? ''),
    avatar: extractAvatarUrl(source),
    hunter_billet_number: String(source.hunter_billet_number ?? ''),
    role_name: extractRoleName(source),
    role_code: extractRoleCode(source),
    created_at: extractCreatedAt(source),
    weapons: normalizeWeapons(source.user_weapons ?? source.userWeapons ?? source.weapons_list),
    weapon_types: normalizeWeaponOptions(source.weapon_types ?? source.weapons_types ?? source.weapons),
    calibers: normalizeWeaponOptions(source.calibers),
  }
}

export function createEmptyWeapon(): UserWeapon {
  return {
    id: null,
    hunter_license_number: '',
    hunter_license_date: '',
    weapon_type_id: '',
    caliber: '',
    isNew: true,
  }
}
