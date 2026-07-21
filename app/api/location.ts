import type { ApiSuccessResponse, SearchLocation } from '~/types/api'
import { useApiClient } from './client'

export function useLocationApi() {
  const { apiFetch } = useApiClient()

  function getLocations(params?: Record<string, unknown>) {
    return apiFetch<ApiSuccessResponse<SearchLocation[]>>('/locations', { query: params })
  }

  async function getLocationItems(params?: Record<string, unknown>) {
    const response = await getLocations(params)

    if (!response.success) {
      return []
    }

    return response.data
  }

  function getDetail(id: number | string) {
    return apiFetch<ApiSuccessResponse<unknown>>(`/location/${id}`)
  }

  return {
    getLocations,
    getLocationItems,
    getDetail,
    search: getLocations,
  }
}
