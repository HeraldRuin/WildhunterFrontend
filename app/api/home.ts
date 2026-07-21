import type { HomePageResponse } from '~/types/api'
import { useApiClient } from './client'

export function useHomeApi() {
  const { apiFetch } = useApiClient()

  function getHomePage() {
    return apiFetch<HomePageResponse>('/home-page')
  }

  return {
    getHomePage,
  }
}
