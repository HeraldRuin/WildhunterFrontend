export function useApiClient() {
  const config = useRuntimeConfig()
  const base = (config.public.apiBase as string).replace(/\/$/, '')
  const version = (config.public.apiVersion as string).replace(/^\//, '').replace(/\/$/, '')
  const baseURL = `${base}/${version}`

  function apiFetch<T>(path: string, options: Parameters<typeof $fetch>[1] = {}) {
    return $fetch<T>(path, {
      baseURL,
      ...options,
    })
  }

  return {
    baseURL,
    apiFetch,
  }
}
