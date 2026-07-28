import type { ApiErrorResponse, ApiSuccessResponse } from '~/types/api'
import type { WeaponOption } from '~/types/user'
import { useApiClient } from './client'
import { normalizeWeaponOptions } from '~/utils/user'

export type WeaponsResponse =
  | ApiSuccessResponse<unknown[]>
  | ApiErrorResponse

export function useWeaponsApi() {
  const { apiFetch } = useApiClient()

  function getWeapons() {
    return apiFetch<WeaponsResponse>('/weapons')
  }

  async function getWeaponTypeOptions(): Promise<WeaponOption[]> {
    const response = await getWeapons()

    if (!('success' in response) || !response.success) {
      return []
    }

    return normalizeWeaponOptions(response.data)
  }

  return {
    getWeapons,
    getWeaponTypeOptions,
  }
}
