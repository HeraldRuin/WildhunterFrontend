import type { ApiResponse, ApiSuccessResponse, HotelSearchBody, HotelSearchResultData } from '~/types/api'
import { useApiClient } from './client'

export function useSearchApi() {
  const { apiFetch } = useApiClient()

  function searchServices(params?: Record<string, unknown>) {
    return apiFetch<ApiSuccessResponse<unknown>>('/services', { query: params })
  }

  function searchHotels(page: number, body: HotelSearchBody) {
    return apiFetch<ApiSuccessResponse<HotelSearchResultData>>('/hotels/search', {
      method: 'POST',
      query: { page },
      body,
    })
  }

  function searchByType(type: string, params?: Record<string, unknown>) {
    return apiFetch<ApiResponse<unknown>>(`/${type}/search`, { query: params })
  }

  function getDetail(type: string, id: number | string) {
    return apiFetch<ApiResponse<unknown>>(`/${type}/detail/${id}`)
  }

  function getFilters(type: string) {
    return apiFetch<ApiResponse<unknown>>(`/${type}/filters`)
  }

  function getFormSearch(type: string) {
    return apiFetch<ApiResponse<unknown>>(`/${type}/form-search`)
  }

  return {
    searchServices,
    searchHotels,
    searchByType,
    getDetail,
    getFilters,
    getFormSearch,
  }
}
