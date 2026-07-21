import { useApiClient } from './client'

export interface FavoriteResponse {
  success?: boolean
  message?: string
}

export function useServicesApi() {
  const { apiFetch } = useApiClient()

  function toggleFavorite(serviceId: number) {
    return apiFetch<FavoriteResponse>(`/services/${serviceId}/favorite`, {
      method: 'POST',
    })
  }

  return {
    toggleFavorite,
  }
}
