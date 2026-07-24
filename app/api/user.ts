import type { ApiErrorResponse, ApiSuccessResponse } from '~/types/api'
import { useApiClient } from './client'

export function useUserApi() {
  const { apiFetch } = useApiClient()

  function getUser(id: number | string) {
    return apiFetch<ApiSuccessResponse<unknown> | ApiErrorResponse>(`/user/${id}`)
  }

  return {
    getUser,
  }
}
