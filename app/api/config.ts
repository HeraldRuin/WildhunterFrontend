import type { ApiConfigs } from '~/types/api'
import { useApiClient } from './client'

export function useConfigApi() {
  const { apiFetch } = useApiClient()

  function getConfigs() {
    return apiFetch<ApiConfigs>('/configs')
  }

  return {
    getConfigs,
  }
}
