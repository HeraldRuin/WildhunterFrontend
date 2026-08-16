import type { ApiErrorResponse } from '~/types/api'
import { useApiClient } from './client'

export interface ContactMessagePayload {
  name: string
  email: string
  message: string
}

export type ContactMessageResponse =
  | { success: true, message?: string }
  | ApiErrorResponse

export function useContactApi() {
  const { apiFetch } = useApiClient()

  function sendMessage(payload: ContactMessagePayload) {
    return apiFetch<ContactMessageResponse>('/contact', {
      method: 'POST',
      body: payload,
      skipAuth: true,
    })
  }

  return {
    sendMessage,
  }
}
