import type { ApiErrorResponse } from '~/types/api'
import { useApiClient } from './client'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  first_name: string
  last_name: string
  email: string
  password: string
  phone: string
  role: string
  term: boolean
}

export interface RegisterSuccessResponse {
  success: true
  token: string
  token_type: string
  expires_in_minutes: number | null
  user: {
    id: number
    first_name: string
    last_name: string
    email: string
    avatar: string | null
  }
}

export type RegisterResponse = RegisterSuccessResponse | ApiErrorResponse

export interface AuthTokens {
  access_token: string
  token_type: string
  expires_in: number
}

export function useAuthApi() {
  const { apiFetch } = useApiClient()

  function login(payload: LoginPayload) {
    return apiFetch<AuthTokens>('/auth/login', {
      method: 'POST',
      body: payload,
    })
  }

  function register(payload: RegisterPayload) {
    return apiFetch<RegisterResponse>('/register', {
      method: 'POST',
      body: payload,
    })
  }

  function logout() {
    return apiFetch<ApiErrorResponse | { success: true }>('/auth/logout', {
      method: 'POST',
    })
  }

  function getMe() {
    return apiFetch<unknown>('/auth/me')
  }

  return {
    login,
    register,
    logout,
    getMe,
  }
}
