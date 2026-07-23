import type { ApiSuccessResponse } from '~/types/api'
import { useApiClient } from './client'

export interface FavoriteResponse {
  success?: boolean
  message?: string
  data?: FavoriteServiceItem | FavoriteServiceItem[]
}

export interface FavoriteServiceItem {
  service_id: number
  service_model: string
  user_id: number
}

export function useServicesApi() {
  const { apiFetch } = useApiClient()

  function addFavorite(serviceId: number) {
    return apiFetch<FavoriteResponse>(`/services/${serviceId}/favorite`, {
      method: 'POST',
      body: {},
    })
  }

  function removeFavorite(serviceId: number) {
    return apiFetch<FavoriteResponse>(`/services/${serviceId}/favorite`, {
      method: 'DELETE',
    })
  }

  function getFavorites(type = 'hotel') {
    return apiFetch<ApiSuccessResponse<FavoriteServiceItem[]>>(`/services/favorites?type=${type}`, {
      method: 'POST',
    })
  }

  return {
    addFavorite,
    removeFavorite,
    getFavorites,
  }
}
