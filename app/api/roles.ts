import type { ApiSuccessResponse, Role } from '~/types/api'
import { useApiClient } from './client'

export function useRolesApi() {
  const { apiFetch } = useApiClient()

  function getRoles() {
    return apiFetch<ApiSuccessResponse<Role[]>>('/roles')
  }

  return {
    getRoles,
  }
}
