import type { UserWeapon } from '~/types/user'

const WEAPONS_LIST_CACHE_PREFIX = 'wh_user_weapons_list'
const WEAPONS_COUNT_CACHE_PREFIX = 'wh_user_weapons_count'
const HUNTER_BILLET_CACHE_PREFIX = 'wh_user_hunter_billet'

function listKey(userId: number | string) {
  return `${WEAPONS_LIST_CACHE_PREFIX}:${userId}`
}

function countKey(userId: number | string) {
  return `${WEAPONS_COUNT_CACHE_PREFIX}:${userId}`
}

function billetKey(userId: number | string) {
  return `${HUNTER_BILLET_CACHE_PREFIX}:${userId}`
}

function readJson<T>(key: string): T | null {
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

function writeJson(key: string, value: unknown) {
  if (!import.meta.client) {
    return
  }

  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
  }
}

function removeKey(key: string) {
  if (!import.meta.client) {
    return
  }

  try {
    localStorage.removeItem(key)
  } catch {
  }
}

export function readUserWeaponsCache(userId: number): UserWeapon[] | null {
  const cached = readJson<UserWeapon[]>(listKey(userId))

  if (!Array.isArray(cached)) {
    return null
  }

  return cached.map(weapon => ({
    ...weapon,
    id: weapon.id == null || Number.isNaN(Number(weapon.id)) ? null : Number(weapon.id),
    hunter_license_number: String(weapon.hunter_license_number ?? ''),
    hunter_license_date: String(weapon.hunter_license_date ?? ''),
    weapon_type_id: String(weapon.weapon_type_id ?? ''),
    caliber: String(weapon.caliber ?? ''),
    isNew: false,
  }))
}

export function writeUserWeaponsCache(userId: number, list: UserWeapon[]) {
  const persisted = list
    .filter(weapon => !weapon.isNew)
    .map(weapon => ({
      id: weapon.id,
      hunter_license_number: weapon.hunter_license_number,
      hunter_license_date: weapon.hunter_license_date,
      weapon_type_id: weapon.weapon_type_id,
      caliber: weapon.caliber,
      isNew: false,
    }))

  writeJson(listKey(userId), persisted)
  writeJson(countKey(userId), persisted.length)
}

export function readUserWeaponsCountCache(userId: number): number {
  const list = readUserWeaponsCache(userId)

  if (list) {
    return list.length
  }

  const raw = readJson<number | string>(countKey(userId))
  const count = Number.parseInt(String(raw ?? ''), 10)

  if (!Number.isFinite(count) || count < 0) {
    return 0
  }

  return Math.min(count, 40)
}

export function readHunterBilletCache(userId: number): string | null {
  const raw = readJson<string>(billetKey(userId))

  if (typeof raw !== 'string') {
    return null
  }

  const trimmed = raw.trim()

  return trimmed || null
}

export function writeHunterBilletCache(userId: number, value: string) {
  writeJson(billetKey(userId), value.trim())
}

export function clearUserWeaponsCache(userId?: number | null) {
  if (!userId) {
    return
  }

  removeKey(listKey(userId))
  removeKey(countKey(userId))
  removeKey(billetKey(userId))
}
