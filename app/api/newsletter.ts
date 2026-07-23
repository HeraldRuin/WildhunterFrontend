import type { ApiErrorResponse } from '~/types/api'
import { useApiClient } from './client'

export interface NewsletterSubscribePayload {
  email: string
  privacy_policy: boolean
}

export type NewsletterSubscribeResponse =
  | { success: true, message?: string }
  | ApiErrorResponse

export function useNewsletterApi() {
  const { apiFetch } = useApiClient()

  function subscribe(payload: NewsletterSubscribePayload) {
    return apiFetch<NewsletterSubscribeResponse>('/user/newsletter/subscribe', {
      method: 'POST',
      body: payload,
      skipAuth: true,
    })
  }

  return {
    subscribe,
  }
}
