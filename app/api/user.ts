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

export interface UpdateUserPayload {
  first_name?: string
  last_name?: string
  nik?: string
  birthday?: string
  email: string
  phone?: string
  city?: string
  address?: string
  hunter_billet_number?: string
  bio?: string
  avatar?: File | null
  avatar_id?: number | null
}

export interface AvatarHistoryItem {
  id: number
  url: string
  created_at?: string | null
}

export type AvatarHistoryResponse =
  | ApiSuccessResponse<AvatarHistoryItem[]>
  | ApiErrorResponse

export type UpdateUserResponse =
  | ApiSuccessResponse<unknown>
  | ApiErrorResponse

function appendFormValue(body: FormData, key: string, value: string | undefined) {
  if (value == null) {
    return
  }

  body.append(key, value)
}

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

  function updateUser(payload: UpdateUserPayload) {
    const body = new FormData()

    appendFormValue(body, 'email', payload.email)
    appendFormValue(body, 'first_name', payload.first_name)
    appendFormValue(body, 'last_name', payload.last_name)
    appendFormValue(body, 'nik', payload.nik)
    appendFormValue(body, 'birthday', payload.birthday)
    appendFormValue(body, 'phone', payload.phone)
    appendFormValue(body, 'city', payload.city)
    appendFormValue(body, 'address', payload.address)
    appendFormValue(body, 'hunter_billet_number', payload.hunter_billet_number)
    appendFormValue(body, 'bio', payload.bio)

    if (payload.avatar instanceof File) {
      body.append('avatar', payload.avatar)
    } else if (payload.avatar_id != null) {
      body.append('avatar_id', String(payload.avatar_id))
    }

    return apiFetch<UpdateUserResponse>('/user', {
      method: 'POST',
      body,
    })
  }

  function getAvatarHistory() {
    return apiFetch<AvatarHistoryResponse>('/user/avatars')
  }

  return {
    getUser,
    getCurrentPassword,
    changePassword,
    updateUser,
    getAvatarHistory,
  }
}
