import type { ApiErrorResponse, ApiSuccessResponse } from '~/types/api'
import { useApiClient } from './client'

export interface ChangePasswordPayload {
  current_password: string
  new_password: string
  new_password_confirmation: string
}

export type ChangePasswordResponse =
  | ApiSuccessResponse<unknown>
  | ApiErrorResponse

export type CurrentPasswordResponse =
  | ApiSuccessResponse<{ current_password: string | null }>
  | ApiErrorResponse

export function useUserApi() {
  const { apiFetch } = useApiClient()

  function getUser(id: number | string) {
    return apiFetch<ApiSuccessResponse<unknown> | ApiErrorResponse>(`/user/${id}`)
  }

  function getCurrentPassword() {
    return apiFetch<CurrentPasswordResponse>('/user/current-password')
  }

  function changePassword(payload: ChangePasswordPayload) {
    return apiFetch<ChangePasswordResponse>('/user/change-password', {
      method: 'POST',
      body: payload,
    })
  }

  return {
    getUser,
    getCurrentPassword,
    changePassword,
  }
}
