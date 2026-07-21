import type { ApiSuccessResponse, SearchAnimal } from '~/types/api'
import { useApiClient } from './client'

export function useAnimalsApi() {
  const { apiFetch } = useApiClient()

  function getAnimals(params?: Record<string, unknown>) {
    return apiFetch<ApiSuccessResponse<SearchAnimal[]>>('/animals', { query: params })
  }

  async function getAnimalItems(params?: Record<string, unknown>) {
    const response = await getAnimals(params)

    if (!response.success) {
      return []
    }

    return response.data
  }

  function getDetail(id: number | string) {
    return apiFetch<ApiSuccessResponse<SearchAnimal>>(`/animals/${id}`)
  }

  return {
    getAnimals,
    getAnimalItems,
    getDetail,
  }
}
