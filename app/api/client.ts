export function useApiClient() {
  const config = useRuntimeConfig()
  const { authorizationHeader } = useAuthToken()
  const base = (config.public.apiBase as string).replace(/\/$/, '')
  const version = (config.public.apiVersion as string).replace(/^\//, '').replace(/\/$/, '')
  const baseURL = `${base}/${version}`

  function apiFetch<T>(path: string, options: Parameters<typeof $fetch>[1] = {}) {
    const headers = new Headers(options.headers as HeadersInit | undefined)

    headers.set('Accept', 'application/json')

    if (authorizationHeader.value) {
      headers.set('Authorization', authorizationHeader.value)
    }

    return $fetch<T>(path, {
      baseURL,
      ...options,
      headers,
    })
  }

  return {
    baseURL,
    apiFetch,
  }
}
