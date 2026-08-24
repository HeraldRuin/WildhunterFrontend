import type { ApiSuccessResponse, HotelRoomAttribute } from '~/types/api'
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

  function getAttributes(type = 'hotel') {
    return apiFetch<ApiSuccessResponse<HotelRoomAttribute[]>>('/services/attributes', {
      method: 'POST',
      body: { type },
      skipAuth: true,
    })
  }

  async function getAttributeGroups(type = 'hotel') {
    try {
      const response = await getAttributes(type)

      if (!response.success) {
        return []
      }

      return response.data
    }
    catch {
      return []
    }
  }

  return {
    addFavorite,
    removeFavorite,
    getFavorites,
    getAttributes,
    getAttributeGroups,
  }
}
