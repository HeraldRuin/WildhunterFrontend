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
  hunter_license_number: string
  hunter_license_date: string
  weapon_type_id: number | null
  caliber_id: number | null
}

export type SaveUserWeaponResponse =
  | ApiSuccessResponse<unknown>
  | ApiErrorResponse

async function mapOptionsResponse(response: WeaponsResponse | CalibersResponse) {
  if (!('success' in response) || !response.success) {
    return []
  }

  return normalizeWeaponOptions(response.data)
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

  async function getWeaponTypeOptions(): Promise<WeaponOption[]> {
    return mapOptionsResponse(await getWeapons())
  }

  async function getCaliberOptions(): Promise<WeaponOption[]> {
    return mapOptionsResponse(await getCalibers())
  }

  async function getUserWeaponList(): Promise<UserWeapon[]> {
    const response = await getUserWeapons()

    if (!('success' in response) || !response.success) {
      throw new Error(
        ('message' in response && response.message) || 'Не удалось загрузить оружие',
      )
    }

    const payload = response.data
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { data?: unknown[] })?.data)
        ? (payload as { data: unknown[] }).data
        : []

    return normalizeWeapons(list)
  }

  return {
    getWeapons,
    getCalibers,
    getUserWeapons,
    saveUserWeapon,
    updateUserWeapon,
    getWeaponTypeOptions,
    getCaliberOptions,
    getUserWeaponList,
  }
}
