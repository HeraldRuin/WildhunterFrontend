import type { ApiErrorResponse, ApiSuccessResponse } from '~/types/api'
import type { WeaponOption } from '~/types/user'
import { useApiClient } from './client'
import { normalizeWeaponOptions } from '~/utils/user'

export type WeaponsResponse =
  | ApiSuccessResponse<unknown[]>
  | ApiErrorResponse

export type CalibersResponse =
  | ApiSuccessResponse<unknown[]>
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

  async function getWeaponTypeOptions(): Promise<WeaponOption[]> {
    return mapOptionsResponse(await getWeapons())
  }

  async function getCaliberOptions(): Promise<WeaponOption[]> {
    return mapOptionsResponse(await getCalibers())
  }

  return {
    getWeapons,
    getCalibers,
    getWeaponTypeOptions,
    getCaliberOptions,
  }
}
