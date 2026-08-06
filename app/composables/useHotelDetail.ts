import type { HotelDetail, HotelDetailApiResponse } from '~/types/api'
import { getHotelPath, normalizeHotelDetail } from '~/utils/hotel'

const HOTEL_DETAIL_TIMEOUT_MS = 4000

export interface HotelDetailParams {
  locationSlug: string
  hotelSlug: string
}

export async function fetchHotelDetail(params: HotelDetailParams): Promise<HotelDetail | null> {
  const { hotels } = useApi()
  const { locationSlug, hotelSlug } = params

  if (!locationSlug || !hotelSlug) {
    return null
  }

  try {
    const response = await hotels.getHotelDetail(locationSlug, hotelSlug, {
      timeout: HOTEL_DETAIL_TIMEOUT_MS,
    }) as HotelDetailApiResponse

    if (response.success && response.data) {
      const normalized = normalizeHotelDetail(response.data, params)

      if (normalized) {
        return normalized
      }
    }
  }
  catch {
    // Network / timeout — caller shows error UI, never cache mock as real data
  }

  return null
}

function getHotelDetailKey(params: HotelDetailParams) {
  return `hotel-detail-${params.locationSlug}-${params.hotelSlug}`
}

function getCachedHotelData<T>(key: string, nuxtApp: ReturnType<typeof useNuxtApp>) {
  const cached = nuxtApp.payload?.data?.[key] ?? nuxtApp.static?.data?.[key]

  // Prefetch may leave a Promise in payload — never treat it as ready data
  if (!cached || typeof (cached as { then?: unknown }).then === 'function') {
    return undefined
  }

  // Failed fetches store null — do not reuse, allow refetch
  if (cached === null) {
    return undefined
  }

  return cached as T
}

export function useHotelDetail(params: MaybeRefOrGetter<HotelDetailParams>) {
  const resolved = computed(() => toValue(params))

  return useAsyncData(
    () => getHotelDetailKey(resolved.value),
    () => fetchHotelDetail(resolved.value),
    {
      watch: [resolved],
      lazy: true,
      // Reuse payload on client navigations (browser back) without re-blurring
      getCachedData: (key, nuxtApp) => getCachedHotelData(key, nuxtApp),
    },
  )
}

export function prefetchHotelDetail(locationSlug?: string, hotelSlug?: string) {
  if (!import.meta.client || !locationSlug || !hotelSlug) {
    return
  }

  preloadRouteComponents(getHotelPath(locationSlug, hotelSlug))

  const params = { locationSlug, hotelSlug }
  const key = getHotelDetailKey(params)
  const nuxtApp = useNuxtApp()
  const existing = nuxtApp.payload?.data?.[key]

  // Already resolved hotel data
  if (existing && typeof (existing as { then?: unknown }).then !== 'function') {
    return
  }

  // Prefetch already in flight
  if (existing && typeof (existing as { then?: unknown }).then === 'function') {
    return
  }

  const request = fetchHotelDetail(params)
  nuxtApp.payload.data[key] = request

  void request.then((data) => {
    if (data) {
      nuxtApp.payload.data[key] = data
      return
    }

    // Do not cache failed loads — otherwise mock-shaped null blocks refetch
    delete nuxtApp.payload.data[key]
  }).catch(() => {
    delete nuxtApp.payload.data[key]
  })
}
