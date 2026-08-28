import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  HotelDetailApiResponse,
  HotelOffer,
  HotelPriceRange,
  HotelPriceRangeBounds,
  HotelRoomAvailabilityRequest,
  HotelRoomAvailabilityResponse,
  OfferItem,
} from '~/types/api'
import { useApiClient } from './client'

const DEFAULT_PRICE_BOUNDS: HotelPriceRangeBounds = {
  min: 0,
  max: 15000,
}

function parseCoord(value: number | string | null | undefined): number | undefined {
  if (value == null || value === '') {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function mapHotelOfferToItem(offer: HotelOffer): OfferItem {
  const price = Number(offer.price) || 0

  return {
    id: offer.id,
    object_model: 'hotel',
    title: offer.title,
    slug: offer.slug,
    location: offer.location?.name ?? '',
    locationSlug: offer.location?.slug,
    price,
    image: offer.image_url,
    reviews: Number(offer.review_count) || 0,
    rating: Number(offer.star_rate) || 0,
    has_food: Boolean(offer.has_food),
    map_lat: parseCoord(offer.map_lat),
    map_lng: parseCoord(offer.map_lng),
  }
}

export interface ManagedHotelLocation {
  id: number
  name: string
  slug: string
}

export interface ManagedHotel {
  id: number
  title: string
  slug: string
  image_url: string
  price: number
  status: string
  status_label: string
  updated_at: string
  location: ManagedHotelLocation | null
}

export type HotelsManageResponse =
  | ApiSuccessResponse<ManagedHotel[]>
  | ApiErrorResponse

export type HotelManageDeleteResponse =
  | ApiSuccessResponse<{ id: number }>
  | ApiErrorResponse

export function useHotelsApi() {
  const { apiFetch } = useApiClient()

  function getHotelOffers(body: Record<string, unknown> = {}) {
    return apiFetch<ApiSuccessResponse<HotelOffer[]>>('/hotels/offers', {
      method: 'POST',
      body,
    })
  }

  async function getHotelOfferItems(body: Record<string, unknown> = {}) {
    const response = await getHotelOffers(body)

    if (!response.success) {
      return []
    }

    return response.data.map(mapHotelOfferToItem)
  }

  function getHotelDetail(
    locationSlug: string,
    hotelSlug: string,
    options: Parameters<typeof apiFetch>[1] = {},
  ) {
    return apiFetch<HotelDetailApiResponse>(
      `/hotels/${encodeURIComponent(locationSlug)}/${encodeURIComponent(hotelSlug)}`,
      {
        method: 'GET',
        ...options,
      },
    )
  }

  function getPriceRange() {
    return apiFetch<ApiSuccessResponse<HotelPriceRange>>('/hotels/price-range', {
      method: 'GET',
      skipAuth: true,
    })
  }

  async function getPriceRangeBounds(): Promise<HotelPriceRangeBounds> {
    try {
      const response = await getPriceRange()

      if (!response.success) {
        return { ...DEFAULT_PRICE_BOUNDS }
      }

      const min = Math.floor(Number(response.data.min_price))
      const max = Math.ceil(Number(response.data.max_price))

      return {
        min: Number.isFinite(min) ? min : DEFAULT_PRICE_BOUNDS.min,
        max: Number.isFinite(max) ? max : DEFAULT_PRICE_BOUNDS.max,
      }
    }
    catch {
      return { ...DEFAULT_PRICE_BOUNDS }
    }
  }

  function checkAvailability(body: HotelRoomAvailabilityRequest) {
    return apiFetch<HotelRoomAvailabilityResponse>('/hotels/rooms/check-availability', {
      method: 'POST',
      body,
    })
  }

  function getManage() {
    return apiFetch<HotelsManageResponse>('/hotels/manage', {
      method: 'GET',
    })
  }

  function deleteManage(hotelId: number | string) {
    return apiFetch<HotelManageDeleteResponse>(
      `/hotels/manage/${encodeURIComponent(String(hotelId))}`,
      {
        method: 'DELETE',
      },
    )
  }

  return {
    getHotelOffers,
    getHotelOfferItems,
    getHotelDetail,
    getPriceRange,
    getPriceRangeBounds,
    checkAvailability,
    getManage,
    deleteManage,
  }
}
