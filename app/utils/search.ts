import type {
  BookableItem,
  HotelSearchBody,
  HotelSearchPrice,
  OfferItem,
  SearchFiltersState,
} from '~/types/api'

export const DEFAULT_SEARCH_FILTERS: SearchFiltersState = {
  sort: 'recommended',
  priceMin: 0,
  priceMax: 15000,
  ratings: [],
  amenities: [],
  hasMeals: '',
}

export function toSearchTermIds(amenities: string[]): number[] {
  return amenities
    .map(Number)
    .filter(id => Number.isFinite(id) && id > 0)
}

export function toSearchPriceFilter(
  filters: Pick<SearchFiltersState, 'priceMin' | 'priceMax'>,
  bounds: { min: number, max: number },
): HotelSearchPrice | undefined {
  const hasActivePrice = (
    filters.priceMin > bounds.min
    || filters.priceMax < bounds.max
  )

  if (!hasActivePrice) {
    return undefined
  }

  return {
    min: filters.priceMin,
    max: filters.priceMax,
  }
}

export function buildHotelSearchBody(options: {
  filters: SearchFiltersState
  priceBounds: { min: number, max: number }
  locationId?: number
  animalId?: number
  checkIn?: string
  checkOut?: string
  adults?: number
}): HotelSearchBody {
  const body: HotelSearchBody = {}

  if (options.locationId != null && Number.isFinite(options.locationId) && options.locationId > 0) {
    body.location_id = options.locationId
  }

  if (options.animalId != null && Number.isFinite(options.animalId) && options.animalId > 0) {
    body.animal_id = options.animalId
  }

  if (options.checkIn) {
    body.check_in = options.checkIn
  }

  if (options.checkOut) {
    body.check_out = options.checkOut
  }

  if (options.adults != null && Number.isFinite(options.adults) && options.adults > 0) {
    body.adults = options.adults
  }

  const price = toSearchPriceFilter(options.filters, options.priceBounds)
  if (price) {
    body.price = price
  }

  if (options.filters.ratings.length) {
    body.star_rate = options.filters.ratings
  }

  const termIds = toSearchTermIds(options.filters.amenities)
  if (termIds.length) {
    body.term_ids = termIds
  }

  return body
}

export const MOCK_SEARCH_ITEMS: BookableItem[] = [
  {
    id: 1,
    object_model: 'hotel',
    title: 'Хромой кабан-2',
    price: 4000,
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
    location: { id: 1, name: 'Ярославская область' },
    is_featured: true,
  },
  {
    id: 2,
    object_model: 'hotel',
    title: 'База «Северный лес»',
    price: 5500,
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
    location: { id: 2, name: 'Карелия' },
  },
  {
    id: 3,
    object_model: 'hotel',
    title: 'Охотничье хозяйство «Бор»',
    price: 3200,
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800',
    location: { id: 3, name: 'Тверская область' },
  },
  {
    id: 4,
    object_model: 'hotel',
    title: 'База «Лесная поляна»',
    price: 4800,
    image: 'https://images.unsplash.com/photo-1510798832321-aac75343ca5a?w=800',
    location: { id: 4, name: 'Владимирская область' },
  },
  {
    id: 5,
    object_model: 'hotel',
    title: 'Хозяйство «Медведь»',
    price: 6200,
    image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d0192?w=800',
    location: { id: 5, name: 'Костромская область' },
    is_featured: true,
  },
  {
    id: 6,
    object_model: 'hotel',
    title: 'База «Речной излучина»',
    price: 3900,
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
    location: { id: 6, name: 'Нижегородская область' },
  },
  {
    id: 7,
    object_model: 'hotel',
    title: 'Охотбаза «Тайга»',
    price: 7100,
    image: 'https://images.unsplash.com/photo-1426604966848-d7ad8d69b550?w=800',
    location: { id: 7, name: 'Архангельская область' },
  },
  {
    id: 8,
    object_model: 'hotel',
    title: 'База «Озёрная»',
    price: 4500,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    location: { id: 8, name: 'Ленинградская область' },
  },
  {
    id: 9,
    object_model: 'hotel',
    title: 'Хозяйство «Волк»',
    price: 5200,
    image: 'https://images.unsplash.com/photo-1518173946687-a4c036bc4d30?w=800',
    location: { id: 9, name: 'Смоленская область' },
  },
  {
    id: 10,
    object_model: 'hotel',
    title: 'База «Сосновый бор»',
    price: 3600,
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
    location: { id: 10, name: 'Рязанская область' },
  },
  {
    id: 11,
    object_model: 'hotel',
    title: 'Охотничья база «Русь»',
    price: 5800,
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800',
    location: { id: 11, name: 'Тульская область' },
  },
  {
    id: 12,
    object_model: 'hotel',
    title: 'База «Золотая осень»',
    price: 4200,
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800',
    location: { id: 12, name: 'Калужская область' },
  },
]

const MOCK_RATINGS = [9.8, 9.2, 8.7, 9.5, 8.9, 9.1, 8.4, 9.0, 8.6, 9.3, 8.8, 9.4]
const MOCK_REVIEWS = [32, 18, 45, 27, 51, 14, 38, 22, 29, 16, 41, 33]

const REVIEW_RATING_RANGES: Record<string, { min: number, max: number }> = {
  excellent: { min: 4.5, max: 5 },
  very_good: { min: 4, max: 4.5 },
  average: { min: 3.5, max: 4 },
  poor: { min: 3, max: 3.5 },
}

export function matchesReviewRatingFilter(score: number, selected: string[]): boolean {
  if (!selected.length || !Number.isFinite(score) || score <= 0) {
    return !selected.length
  }

  return selected.some((key) => {
    const asNumber = Number(key)
    if (Number.isFinite(asNumber) && key.trim() !== '') {
      return score >= asNumber
    }

    const range = REVIEW_RATING_RANGES[key]
    if (!range) {
      return false
    }

    return score >= range.min && (range.max >= 5 ? score <= range.max : score < range.max)
  })
}

export function matchesFoodFilter(
  hasFood: boolean | undefined,
  hasMeals: SearchFiltersState['hasMeals'],
): boolean {
  const has = Boolean(hasFood)

  switch (hasMeals) {
    case '':
      return true
    case 'yes':
      return has
    case 'no':
      return !has
    default: {
      const _exhaustive: never = hasMeals
      return _exhaustive
    }
  }
}

export function countOffersByReviewRating(items: OfferItem[]): Record<string, number> {
  return Object.fromEntries(
    Object.keys(REVIEW_RATING_RANGES).map(key => [
      key,
      items.filter(item => matchesReviewRatingFilter(item.rating, [key])).length,
    ]),
  )
}

export function toOfferItem(item: BookableItem, index = 0): OfferItem {
  return {
    id: item.id,
    object_model: item.object_model,
    title: item.title,
    slug: item.slug,
    location: item.location?.name ?? '',
    locationSlug: item.location?.slug,
    price: item.sale_price ?? item.price,
    image: item.image,
    reviews: MOCK_REVIEWS[index % MOCK_REVIEWS.length] ?? 0,
    rating: MOCK_RATINGS[index % MOCK_RATINGS.length] ?? 0,
  }
}
