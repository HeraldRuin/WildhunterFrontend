export function useApiClient() {
  const config = useRuntimeConfig()
  const { authorizationHeader } = useAuthToken()
  const base = (config.public.apiBase as string).replace(/\/$/, '')
  const version = (config.public.apiVersion as string).replace(/^\//, '').replace(/\/$/, '')
  const baseURL = `${base}/${version}`

  function apiFetch<T>(
    path: string,
    options: Parameters<typeof $fetch>[1] & { skipAuth?: boolean } = {},
  ) {
    const { skipAuth, ...fetchOptions } = options
    const headers = new Headers(fetchOptions.headers as HeadersInit | undefined)

    headers.set('Accept', 'application/json')

    if (!skipAuth && authorizationHeader.value) {
      headers.set('Authorization', authorizationHeader.value)
    }

    return $fetch<T>(path, {
      baseURL,
      ...fetchOptions,
      headers,
    })
  }

  return {
    baseURL,
    apiFetch,
  }
}
