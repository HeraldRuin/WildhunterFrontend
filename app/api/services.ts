import type { ApiSuccessResponse } from '~/types/api'
import { useApiClient } from './client'

export interface FavoriteResponse {
  success?: boolean
  message?: string
}

export interface FavoriteServiceItem {
  service_id: number
  service_model: string
  user_id: number
}

export function useServicesApi() {
  const { apiFetch } = useApiClient()

  function toggleFavorite(serviceId: number) {
    return apiFetch<FavoriteResponse>(`/services/${serviceId}/favorite`, {
      method: 'POST',
    })
  }

  function getFavorites(type = 'hotel') {
    return apiFetch<ApiSuccessResponse<FavoriteServiceItem[]>>(`/services/favorites?type=${type}`, {
      method: 'POST',
    })
  }

  return {
    toggleFavorite,
    getFavorites,
  }
}
