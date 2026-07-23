import type { ApiErrorResponse } from '~/types/api'
import type { AuthSuccessResponse } from '~/types/auth'
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

export interface PasswordEmailPayload {
  email: string
}

export interface PasswordResetPayload {
  email: string
  code: string
  password: string
  password_confirmation: string
}

export type LoginResponse = AuthSuccessResponse | ApiErrorResponse
export type RegisterResponse = AuthSuccessResponse | ApiErrorResponse
export type PasswordResponse = { success: true, message?: string } | ApiErrorResponse

export function useAuthApi() {
  const { apiFetch } = useApiClient()

  function login(payload: LoginPayload) {
    return apiFetch<LoginResponse>('/login', {
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
    return apiFetch<ApiErrorResponse | { success: true }>('/logout', {
      method: 'POST',
    })
  }

  function getMe() {
    return apiFetch<unknown>('/me')
  }

  function sendPasswordResetEmail(payload: PasswordEmailPayload) {
    return apiFetch<PasswordResponse>('/password/email', {
      method: 'POST',
      body: payload,
    })
  }

  function resetPassword(payload: PasswordResetPayload) {
    return apiFetch<PasswordResponse>('/password/reset', {
      method: 'POST',
      body: payload,
    })
  }

  return {
    login,
    register,
    logout,
    getMe,
    sendPasswordResetEmail,
    resetPassword,
  }
}
