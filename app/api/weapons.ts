import type { ApiErrorResponse, ApiSuccessResponse } from '~/types/api'
import type { UserWeapon, WeaponOption } from '~/types/user'
import { useApiClient } from './client'
import { normalizeWeaponOptions, normalizeWeapons } from '~/utils/user'

export type WeaponsResponse =
  | ApiSuccessResponse<unknown[]>
  | ApiErrorResponse

export type CalibersResponse =
  | ApiSuccessResponse<unknown[]>
  | ApiErrorResponse

export type UserWeaponsResponse =
  | ApiSuccessResponse<unknown[]>
  | ApiErrorResponse

export interface SaveUserWeaponPayload {
  hunter_billet_number?: string | null
  hunter_license_number?: string | null
  hunter_license_date?: string | null
  weapon_type_id?: number | null
  caliber_id?: number | null
}

export type SaveUserWeaponResponse =
  | ApiSuccessResponse<unknown>
  | ApiErrorResponse

export interface UserWeaponsBundle {
  weapons: UserWeapon[]
  hunterBilletNumber: string
}

async function mapOptionsResponse(response: WeaponsResponse | CalibersResponse) {
  if (!('success' in response) || !response.success) {
    return []
  }

  return normalizeWeaponOptions(response.data)
}

function unwrapWeaponsList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload
  }

  if (payload && typeof payload === 'object') {
    const source = payload as Record<string, unknown>

    if (Array.isArray(source.weapons)) {
      return source.weapons
    }

    if (Array.isArray(source.data)) {
      return source.data
    }

    if (source.data && typeof source.data === 'object') {
      return unwrapWeaponsList(source.data)
    }
  }

  return []
}

function extractHunterBilletNumber(payload: unknown, list: unknown[]): string {
  const readBillet = (value: unknown) =>
    typeof value === 'string' && value.trim() ? value.trim() : ''

  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const root = payload as Record<string, unknown>
    const fromRoot = readBillet(root.hunter_billet_number)

    if (fromRoot) {
      return fromRoot
    }

    if (root.data && typeof root.data === 'object' && !Array.isArray(root.data)) {
      const fromData = readBillet((root.data as Record<string, unknown>).hunter_billet_number)

      if (fromData) {
        return fromData
      }
    }
  }

  for (const item of list) {
    if (!item || typeof item !== 'object') {
      continue
    }

    const fromItem = readBillet((item as { hunter_billet_number?: unknown }).hunter_billet_number)

    if (fromItem) {
      return fromItem
    }
  }

  return ''
}

export function useWeaponsApi() {
  const { apiFetch } = useApiClient()

  function getWeapons() {
    return apiFetch<WeaponsResponse>('/weapons')
  }

  function getCalibers() {
    return apiFetch<CalibersResponse>('/calibers')
  }

  function getUserWeapons() {
    return apiFetch<UserWeaponsResponse>('/user/weapons')
  }

  function saveUserWeapon(payload: SaveUserWeaponPayload) {
    return apiFetch<SaveUserWeaponResponse>('/user/weapons', {
      method: 'POST',
      body: payload,
    })
  }

  function updateUserWeapon(id: number, payload: SaveUserWeaponPayload) {
    return apiFetch<SaveUserWeaponResponse>(`/user/weapons/${id}`, {
      method: 'PUT',
      body: payload,
    })
  }

  function deleteUserWeapon(id: number) {
    return apiFetch<SaveUserWeaponResponse>(`/user/weapons/${id}`, {
      method: 'DELETE',
    })
  }

  async function getWeaponTypeOptions(): Promise<WeaponOption[]> {
    return mapOptionsResponse(await getWeapons())
  }

  async function getCaliberOptions(): Promise<WeaponOption[]> {
    return mapOptionsResponse(await getCalibers())
  }

  async function getUserWeaponsBundle(): Promise<UserWeaponsBundle> {
    const response = await getUserWeapons()

    if (!('success' in response) || !response.success) {
      throw new Error(
        ('message' in response && response.message) || 'Не удалось загрузить оружие',
      )
    }

    const list = unwrapWeaponsList(response.data)

    return {
      weapons: normalizeWeapons(list),
      hunterBilletNumber: extractHunterBilletNumber(response.data, list),
    }
  }

  async function getUserWeaponList(): Promise<UserWeapon[]> {
    const bundle = await getUserWeaponsBundle()
    return bundle.weapons
  }

  return {
    getWeapons,
    getCalibers,
    getUserWeapons,
    saveUserWeapon,
    updateUserWeapon,
    deleteUserWeapon,
    getWeaponTypeOptions,
    getCaliberOptions,
    getUserWeaponList,
    getUserWeaponsBundle,
  }
}
