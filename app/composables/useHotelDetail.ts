import type { HotelDetailApiResponse } from '~/types/api'
import { createMockHotelDetail, getHotelPath, normalizeHotelDetail } from '~/utils/hotel'

const HOTEL_DETAIL_TIMEOUT_MS = 4000

export interface HotelDetailParams {
  locationSlug: string
  hotelSlug: string
}

export async function fetchHotelDetail(params: HotelDetailParams) {
  const { hotels } = useApi()
  const { locationSlug, hotelSlug } = params

  if (!locationSlug || !hotelSlug) {
    return createMockHotelDetail(params)
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
    // API недоступен — используем мок-данные
  }

  return createMockHotelDetail(params)
}

function getHotelDetailKey(params: HotelDetailParams) {
  return `hotel-detail-${params.locationSlug}-${params.hotelSlug}`
}

export function useHotelDetail(params: MaybeRefOrGetter<HotelDetailParams>) {
  const resolved = computed(() => toValue(params))

  return useAsyncData(
    () => getHotelDetailKey(resolved.value),
    () => fetchHotelDetail(resolved.value),
    {
      watch: [resolved],
      lazy: true,
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

  if (key in nuxtApp.payload.data) {
    return
  }

  nuxtApp.payload.data[key] = fetchHotelDetail(params)
}
