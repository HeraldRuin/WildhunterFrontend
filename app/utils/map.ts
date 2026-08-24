import type { OfferItem } from '~/types/api'
import { toMediaImageSize } from '~/utils/image'

/** Map engine: Leaflet/OSM or Yandex Maps JS API 2.1. */
export type MapProvider = 'leaflet' | 'yandex'

export interface BasesMapMarker {
  id: number
  title: string
  lat: number
  lng: number
}

/** Default map center (central Russia) when no hotels are selected. */
export const DEFAULT_MAP_CENTER = {
  lat: 57.6261,
  lng: 39.8845,
  zoom: 10,
} as const

export interface MapHotelItem {
  id: number
  title: string
  slug?: string
  location: string
  locationSlug?: string
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
    slug: item.slug,
    location: item.location,
    locationSlug: item.locationSlug,
    price: item.price,
    image: toMediaImageSize(item.image, 'medium'),
    lat,
    lng,
    rating: item.rating,
    reviews: item.reviews,
  }
}

/** Format a map distance (meters) for map UI. */
export function formatMapDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) {
    return ''
  }

  if (meters < 1000) {
    return `${Math.round(meters)} м`
  }

  const km = meters / 1000
  const rounded = km < 10 ? Math.round(km * 10) / 10 : Math.round(km)

  return `${String(rounded).replace('.', ',')} км`
}

/** Parse "55.75, 37.61" / "55.75 37.61" style coordinates. */
export function parseMapCoordinates(input: string): { lat: number, lng: number } | null {
  const match = input.trim().match(
    /^(-?\d+(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d+(?:[.,]\d+)?)$/,
  )

  if (!match) {
    return null
  }

  const lat = Number(match[1]!.replace(',', '.'))
  const lng = Number(match[2]!.replace(',', '.'))

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null
  }

  return { lat, lng }
}
