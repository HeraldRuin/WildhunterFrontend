import type { OfferItem } from '~/types/api'
import { toMediaImageSize } from '~/utils/image'

/** Default map center (central Russia) when no hotels are selected. */
export const DEFAULT_MAP_CENTER = {
  lat: 57.6261,
  lng: 39.8845,
  zoom: 10,
} as const

export interface MapHotelItem {
  id: number
  title: string
  location: string
  price: number
  image: string
  lat: number
  lng: number
  rating: number
  reviews: number
}

export function offerToMapHotel(item: OfferItem): MapHotelItem | null {
  const lat = Number(item.map_lat)
  const lng = Number(item.map_lng)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  return {
    id: item.id,
    title: item.title,
    location: item.location,
    price: item.price,
    image: toMediaImageSize(item.image, 'medium'),
    lat,
    lng,
    rating: item.rating,
    reviews: item.reviews,
  }
}
