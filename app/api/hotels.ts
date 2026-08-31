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

export interface ManagedHotelGalleryImage {
  id: number
  large: string
  medium: string
  thumb: string
}

export interface ManagedHotelPolicyItem {
  title?: string | null
  content?: string | null
}

export interface ManagedHotelSurroundingItem {
  name?: string | null
  content?: string | null
  value?: string | number | null
  type?: string | null
}

export type ManagedHotelSurrounding =
  | ManagedHotelSurroundingItem[]
  | Record<string, ManagedHotelSurroundingItem[]>
  | null

export type ManagedHotelExtraPriceType = 'one_time' | 'per_day'

export interface ManagedHotelExtraPriceItem {
  name?: string | null
  price?: number | string | null
  type?: ManagedHotelExtraPriceType | string | null
  per_person?: boolean | string | null
}

export interface ManagedHotelDetail {
  id: number
  slug: string
  title: string
  content: string | null
  star_rate: number | string | null
  image_id: number | null
  image_url: string | null
  gallery: ManagedHotelGalleryImage[]
  policy: ManagedHotelPolicyItem[] | null
  surrounding: ManagedHotelSurrounding
  price: number | string | null
  extra_price: ManagedHotelExtraPriceItem[] | null
  service_fee: unknown
  check_in_time?: string | null
  check_out_time?: string | null
  min_day_before_booking?: number | string | null
  min_day_stays?: number | string | null
  enable_extra_price?: boolean | number | null
  enable_service_fee?: boolean | number | null
  address: string | null
  map_lat: number | string | null
  map_lng: number | string | null
  map_zoom?: number | string | null
  location_id: number | null
  location: ManagedHotelLocation | null
  term_ids: number[]
  status: string
  status_label: string
  has_food: boolean
}

export type HotelsManageResponse =
  | ApiSuccessResponse<ManagedHotel[]>
  | ApiErrorResponse

export type HotelManageDetailResponse =
  | ApiSuccessResponse<ManagedHotelDetail>
  | ApiErrorResponse

export type HotelManageDeleteResponse =
  | ApiSuccessResponse<{ id: number }>
  | ApiErrorResponse

export type HotelManageStatus = 'publish' | 'draft' | 'pending'

export interface HotelManageUpdatePayload {
  title?: string
  slug?: string
  content?: string | null
  star_rate?: number
  address?: string | null
  image_id?: number | null
  gallery?: number[]
  policy?: ManagedHotelPolicyItem[]
  surrounding?: ManagedHotelSurroundingItem[]
  price?: number | string | null
  extra_price?: ManagedHotelExtraPriceItem[]
  service_fee?: unknown
  check_in_time?: string | null
  check_out_time?: string | null
  min_day_before_booking?: number | null
  min_day_stays?: number | null
  enable_extra_price?: boolean
  enable_service_fee?: boolean
  map_lat?: string | number | null
  map_lng?: string | number | null
  map_zoom?: string | number | null
  location_id?: number | null
  status?: HotelManageStatus | string
  has_food?: boolean
  term_ids?: number[]
}

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

  function getManageById(hotelId: number | string) {
    return apiFetch<HotelManageDetailResponse>(
      `/hotels/manage/${encodeURIComponent(String(hotelId))}`,
      {
        method: 'GET',
      },
    )
  }

  function createManage(payload: HotelManageUpdatePayload) {
    return apiFetch<HotelManageDetailResponse>('/hotels/manage', {
      method: 'POST',
      body: payload,
    })
  }

  function updateManage(
    hotelId: number | string,
    payload: HotelManageUpdatePayload,
  ) {
    return apiFetch<HotelManageDetailResponse>(
      `/hotels/manage/${encodeURIComponent(String(hotelId))}`,
      {
        method: 'PUT',
        body: payload,
      },
    )
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
    getManageById,
    createManage,
    updateManage,
    deleteManage,
  }
}
