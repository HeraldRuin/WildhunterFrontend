export interface ApiResponse<T> {
  status: 0 | 1
  message?: string
  errors?: Record<string, string[]>
}

export interface ApiSuccessResponse<T> {
  success: boolean
  message?: string
  data: T
}

export interface ApiErrorResponse {
  success: false
  message?: string
  error_code?: string
  errors?: Record<string, string[]>
}

export interface Role {
  id: number
  name: string
  code: string
}

export interface ApiConfigs extends ApiResponse<unknown> {
  languages: Array<{ locale: string, name: string }>
  booking_types: Record<string, {
    icon: string
    name: string
    search_fields: unknown[]
  }>
  country: unknown[]
  app_layout: unknown
  is_enable_guest_checkout: number
  service_search_forms: Record<string, unknown>
  locale: string
  currency_main: string
  currency: unknown[]
}

export interface OfferItem {
  id: number
  object_model: string
  title: string
  location: string
  price: number
  image: string
  reviews: number
  rating: number
}

export interface BookableItem {
  id: number
  object_model: string
  title: string
  price: number
  sale_price?: number
  discount_percent?: number
  image: string
  content?: string
  location?: {
    id: number
    name: string
  }
  is_featured?: boolean
  is_wishlist?: boolean
  duration?: string
}

export interface LocationItem {
  id: number
  title: string
  image: string
  bases_count: number
  content?: string
}

export interface LocationOffer {
  id: number
  name: string
  slug: string
  image_url: string
  hotel_count: number
}

export interface HotelOffer {
  id: number
  title: string
  slug: string
  image_url: string
  star_rate: number | string | null
  location: SearchLocation
  price?: number | string
  review_count?: number
  is_in_wishList?: boolean
}

export interface HotelSearchPagination {
  current_page: number
  per_page: number
  total: number
  last_page: number
  has_more_pages: boolean
}

export interface HotelSearchResultData {
  items: HotelOffer[]
  pagination: HotelSearchPagination
}

export interface SearchLocation {
  id: number
  name: string
  slug: string
}

export interface SearchAnimal {
  id: number
  title: string
  slug: string | null
  image_url: string
  content: string | null
}

export interface ReviewItem {
  id: number
  name: string
  role: string
  text: string
  rating: number
  ratingText: string
  avatar?: string
}

export interface ServiceReviewAuthor {
  is_guest: boolean
  id: number | null
  name: string | null
  first_name: string | null
  last_name: string | null
  nik: string | null
  avatar_url: string | null
  bio: string | null
}

export interface ServiceReview {
  id: number
  title: string
  content: string
  rate_number: number
  rate_text: string
  author: ServiceReviewAuthor
  created_at: string
  updated_at: string
}

export interface ReviewsQuery {
  type: string
  order_by?: string
  order_direction?: 'asc' | 'desc'
  limit?: number
}

export interface ReviewRatingOption {
  value: string
  label: string
}

export interface HomeBlock {
  type: string
  name?: string
  model: Record<string, unknown>
}

export interface HomePageResponse extends ApiResponse<unknown> {
  data: HomeBlock[]
}

export interface HotelSearchBody {
  location_id?: number
  animal_id?: number
  check_in?: string
  check_out?: string
  adults?: number
  price_range?: string
  review_score?: string[]
}

export interface SearchResultData {
  total: number
  total_pages: number
  data: BookableItem[]
}

export interface SearchApiResponse extends ApiResponse<SearchResultData> {
  data: SearchResultData
}

export type SearchSortOption = 'recommended' | 'price_asc' | 'price_desc' | 'rating'

export interface SearchFiltersState {
  sort: SearchSortOption
  priceMin: number
  priceMax: number
  ratings: string[]
  amenities: string[]
  hasMeals: '' | 'yes' | 'no'
}

export interface HotelReviewScore {
  score_total: number
  score_text: string
  total_review: number
}

export interface HotelTermItem {
  id: number
  title: string
  icon?: string
}

export interface HotelTermGroup {
  id: number
  title: string
  terms: HotelTermItem[]
}

export interface HotelAnimalItem {
  id: number
  title: string
  season?: string
  price?: number
}

export interface HotelDetail {
  id: number
  object_model: string
  title: string
  price: number
  sale_price?: number
  image: string
  content?: string
  address?: string
  location?: {
    id: number
    name: string
  }
  gallery: string[]
  map_lat?: number
  map_lng?: number
  review_score?: HotelReviewScore
  terms: HotelTermGroup[]
  animals: HotelAnimalItem[]
  related: BookableItem[]
  check_in_time?: string
  check_out_time?: string
}

export interface HotelDetailApiResponse extends ApiResponse<unknown> {
  data: HotelDetail
}
