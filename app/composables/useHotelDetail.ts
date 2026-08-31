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
  }

  return null
}

function getHotelDetailKey(params: HotelDetailParams) {
  return `hotel-detail-${params.locationSlug}-${params.hotelSlug}`
}

function getCachedHotelData<T>(key: string, nuxtApp: ReturnType<typeof useNuxtApp>) {
  const cached = nuxtApp.payload?.data?.[key] ?? nuxtApp.static?.data?.[key]

  if (!cached || typeof (cached as { then?: unknown }).then === 'function') {
    return undefined
  }

  if (cached === null) {
    return undefined
  }

  const hotel = cached as { animals?: unknown }
  if (Array.isArray(hotel.animals) && hotel.animals.length === 0) {
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

  if (existing && typeof (existing as { then?: unknown }).then !== 'function') {
    return
  }

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

    delete nuxtApp.payload.data[key]
  }).catch(() => {
    delete nuxtApp.payload.data[key]
  })
}
