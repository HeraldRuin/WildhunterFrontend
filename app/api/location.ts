import type { ApiSuccessResponse, LocationItem, LocationOffer, SearchLocation } from '~/types/api'
import { useApiClient } from './client'

const DEFAULT_LOCATION_IMAGE =
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800'

export function mapLocationOfferToItem(location: LocationOffer): LocationItem {
  return {
    id: location.id,
    title: location.name,
    image: location.image_url || DEFAULT_LOCATION_IMAGE,
    bases_count: location.hotel_count,
  }
}

export function useLocationApi() {
  const { apiFetch } = useApiClient()

  function getLocations(params?: Record<string, unknown>) {
    return apiFetch<ApiSuccessResponse<SearchLocation[]>>('/locations', { query: params })
  }

  async function getLocationItems(params?: Record<string, unknown>) {
    const response = await getLocations(params)

    if (!response.success) {
      return []
    }

    return response.data
  }

  function getLocationOffers(body: Record<string, unknown> = {}) {
    return apiFetch<ApiSuccessResponse<LocationOffer[]>>('/locations/offers', {
      method: 'POST',
      body,
    })
  }

  async function getLocationOfferItems(body: Record<string, unknown> = {}) {
    const response = await getLocationOffers(body)

    if (!response.success) {
      return []
    }

    return response.data.map(mapLocationOfferToItem)
  }

  function getDetail(id: number | string) {
    return apiFetch<ApiSuccessResponse<unknown>>(`/location/${id}`)
  }

  return {
    getLocations,
    getLocationItems,
    getLocationOffers,
    getLocationOfferItems,
    getDetail,
    search: getLocations,
  }
}
