import type { ApiSuccessResponse, HotelOffer, OfferItem } from '~/types/api'
import { useApiClient } from './client'

export function mapHotelOfferToItem(offer: HotelOffer): OfferItem {
  const price = Number(offer.price) || 0

  return {
    id: offer.id,
    object_model: 'hotel',
    title: offer.title,
    location: offer.location?.name ?? '',
    price,
    image: offer.image_url,
    reviews: offer.review_count ?? 0,
    rating: offer.star_rate ?? 0,
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

  return {
    getHotelOffers,
    getHotelOfferItems,
  }
}
