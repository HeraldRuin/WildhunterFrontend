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
  slug?: string
  location: string
  locationSlug?: string
  price: number
  image: string
  reviews: number
  rating: number
  map_lat?: number
  map_lng?: number
}

export interface BookableItem {
  id: number
  object_model: string
  title: string
  slug?: string
  price: number
  sale_price?: number
  discount_percent?: number
  image: string
  content?: string
  location?: {
    id: number
    name: string
    slug?: string
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
  map_lat?: number | string | null
  map_lng?: number | string | null
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

export interface HotelPriceRange {
  min_price: string
  max_price: string
}

export interface HotelPriceRangeBounds {
  min: number
  max: number
}

export interface HotelSearchBody {
  location_id?: number
  animal_id?: number
  check_in?: string
  check_out?: string
  adults?: number
  price_range?: string
  star_rate?: string[]
}

export interface HotelRoomAvailabilityRequest {
  hotel_id: number
  check_in: string
  check_out: string
  adults: number
}

export interface HotelRoomAvailabilityGalleryImage {
  large: string
  medium: string
  thumb: string
}

export interface HotelRoomAvailability {
  id: number
  title: string
  price: number
  nights: number
  size: number
  beds: number
  adults: number
  children: number
  number_selected: number
  number: number
  image_url: string
  gallery: HotelRoomAvailabilityGalleryImage[]
}

export interface HotelRoomAvailabilityData {
  rooms: HotelRoomAvailability[]
}

export type HotelRoomAvailabilityResponse = ApiSuccessResponse<HotelRoomAvailabilityData>

export interface AnimalAvailabilityRequest {
  hotel_id: number
  animal_id: number
  hunter_data: string
  hunters: number
  check_in?: string
  check_out?: string
}

export interface AnimalAvailabilityData {
  available: boolean
  price: number
}

export type AnimalAvailabilityResponse = ApiSuccessResponse<AnimalAvailabilityData> | ApiErrorResponse

export interface CreateBookingRoom {
  room_id: number
  number: number
}

export interface CreateBookingRequest {
  hotel_id: number
  animal_id?: number
  check_in: string
  check_out: string
  adults: number
  hunters: number
  rooms: CreateBookingRoom[]
}

export type CreateBookingResponse = ApiSuccessResponse<{
  booking_code: string
}>

export type UpdateCustomerNotesResponse = ApiSuccessResponse<{
  customer_notes: string | null
}>

export interface BookingCheckoutLocation {
  id: number
  name: string
  slug?: string
}

export interface BookingCheckoutHotel {
  id: number
  title: string
  slug?: string
  image_url?: string | null
}

export interface BookingCheckoutAnimal {
  id: number
  title: string
  slug?: string
  image_url?: string | null
  content?: string | null
}

export interface BookingCheckoutRoom {
  room_id: number
  title: string | null
  number: number
  price: number
}

export interface BookingCheckoutData {
  code: string
  booking_number: string | number
  gateway: string | null
  created_at: string
  status: string
  type: string
  check_in: string
  check_out: string
  start_date_animal: string | null
  location: BookingCheckoutLocation | null
  hotel: BookingCheckoutHotel | null
  animal: BookingCheckoutAnimal | null
  total: number
  amount_hunting: number
  all_total: number
  deposit: number
  total_guests: number
  total_hunting: number | null
  rooms: BookingCheckoutRoom[]
}

export type BookingCheckoutResponse = ApiSuccessResponse<BookingCheckoutData>

export type BookingHistoryStatusFilter =
  | 'invitation'
  | 'cancelled'
  | 'processing'
  | 'confirmed'
  | 'collection'
  | 'finished_collection'
  | 'prepayment_collection'
  | 'finish_prepayment'
  | 'bed_collection'
  | 'finish_bed_collection'
  | 'paid'
  | 'completed'
  | string

export interface BookingHistoryQuery {
  status?: BookingHistoryStatusFilter
  booking_id?: number
  page?: number
}

export interface BookingHistoryActionDto {
  code: string
  label: string
}

export interface BookingHistoryRoomDto {
  room_id: number
  title: string | null
  number: number
  price: number
  adults: number
}

export interface BookingHistoryItemDto {
  id: number
  booking_number: string | number
  code: string
  created_at: string
  type: string
  type_text: string
  status: string
  status_for_user: string
  status_label: string
  display_status: string
  is_paid: boolean
  is_master_hunter: boolean
  is_invited: boolean
  invitation_accepted: boolean
  hotel: {
    id: number
    title: string
    slug?: string
    collection_timer_hours?: number | null
    paid_timer_hours?: number | null
    bed_timer_hours?: number | null
  } | null
  creator: {
    id: number
    user_name?: string | null
    first_name?: string | null
    last_name?: string | null
    email?: string | null
    phone?: string | null
  } | null
  details: {
    start_date: string | null
    end_date: string | null
    duration_days: number
    total_guests: number
    start_date_animal: string | null
    total_hunting: number | null
    animal: {
      id: number
      title: string
    } | null
    rooms: BookingHistoryRoomDto[]
  }
  collection: {
    accepted_count: number
    total_needed: number
    paid_count: number
    collection_end_at: string | null
    paid_end_at: string | null
    beds_end_at: string | null
  }
  payment: {
    prepaid_total: number
    base_total: number
    total: number
  }
  available_actions: BookingHistoryActionDto[]
}

export interface BookingHistoryPagination {
  current_page: number
  per_page: number
  total: number
  last_page: number
  has_more_pages: boolean
}

export interface BookingHistoryData {
  role: string
  hotel: {
    id: number
    title: string
    slug?: string
  } | null
  statuses: string[]
  dropdown_statuses: string[]
  bookings: {
    items: BookingHistoryItemDto[]
    pagination: BookingHistoryPagination
  }
}

export type BookingHistoryResponse = ApiSuccessResponse<BookingHistoryData>

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

export interface HotelGalleryImage {
  large: string
  medium: string
  thumb: string
}

export interface HotelDetail {
  id: number
  object_model: string
  title: string
  slug: string
  price: number
  sale_price?: number
  image: string
  content?: string
  address?: string
  location?: {
    id: number
    name: string
    slug?: string
  }
  gallery: HotelGalleryImage[]
  map_lat?: number
  map_lng?: number
  review_score?: HotelReviewScore
  terms: HotelTermGroup[]
  animals: HotelAnimalItem[]
  related: BookableItem[]
  check_in_time?: string
  check_out_time?: string
}

export type HotelDetailApiResponse = ApiSuccessResponse<HotelDetail>
