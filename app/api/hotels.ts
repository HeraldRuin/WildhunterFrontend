import type {
  ApiSuccessResponse,
  HotelOffer,
  HotelPriceRange,
  HotelPriceRangeBounds,
  OfferItem,
} from '~/types/api'
import { useApiClient } from './client'

const DEFAULT_PRICE_BOUNDS: HotelPriceRangeBounds = {
  min: 0,
  max: 15000,
}

export function mapHotelOfferToItem(offer: HotelOffer): OfferItem {
  const price = Number(offer.price) || 0

  return {
    id: offer.id,
    object_model: 'hotel',
    title: offer.title,
    location: offer.location?.name ?? '',
    price,
    image: offer.image_url,
    reviews: Number(offer.review_count) || 0,
    rating: Number(offer.star_rate) || 0,
  }
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

  return {
    getHotelOffers,
    getHotelOfferItems,
    getPriceRange,
    getPriceRangeBounds,
  }
}
