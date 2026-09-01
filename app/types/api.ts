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
  has_food?: boolean
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
  has_food?: boolean
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

export interface HotelSearchPrice {
  min?: number
  max?: number
}

export interface HotelSearchBody {
  location_id?: number
  animal_id?: number
  check_in?: string
  check_out?: string
  adults?: number
  /** Selected attribute term ids (OR semantics on backend). */
  term_ids?: number[]
  price?: HotelSearchPrice
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

export interface HotelRoomAttributeTermTranslation {
  id: number
  origin_id: number
  locale: string
  name: string
  content: string | null
}

export interface HotelRoomAttributeTerm {
  id: number
  name: string
  slug: string
  content: string | null
  icon: string | null
  image_url: string
  translation?: HotelRoomAttributeTermTranslation | null
}

export interface HotelRoomAttribute {
  id: number
  name: string
  slug: string
  service: string
  position: number
  terms: HotelRoomAttributeTerm[]
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
  attributes?: HotelRoomAttribute[]
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

export type ConfirmBookingResponse = ApiSuccessResponse<{
  id: number
  code: string
  status: string
}>

export type MarkPaidBookingResponse = ApiSuccessResponse<{
  id: number
  code: string
  status: string
  is_paid: boolean
}>

export type CompleteBookingResponse = ApiSuccessResponse<{
  id: number
  code: string
  status: string
}>

export interface BookingCalculationLine {
  name: string
  total_cost: number
  my_cost: number
  has_tooltip?: boolean
}

export interface BookingCalculatingData {
  success?: boolean
  is_baseAdmin: boolean
  items: BookingCalculationLine[]
  trophy_show?: boolean
  trophies?: BookingCalculationLine[]
  penalties_show?: boolean
  penalties?: BookingCalculationLine[]
  additional_services_show?: boolean
  meals?: BookingCalculationLine[]
  preparation?: BookingCalculationLine[]
  addetionals?: BookingCalculationLine[]
  spendings_show?: boolean
  spendings?: BookingCalculationLine[]
  all_items: BookingCalculationLine[]
  prepaid_total?: number
  base_total?: number
  total?: number
}

export type BookingCalculatingResponse = ApiSuccessResponse<BookingCalculatingData>

export type CancelBookingResponse = ApiSuccessResponse<{
  id: number
  code: string
  status: string
}>

export type StartCollectionResponse = ApiSuccessResponse<{
  id: number
  code: string
  status: string
}>

export type ExtendCollectionResponse = ApiSuccessResponse<{
  id: number
  code: string
  status: string
}>

export interface BookingPlaceUser {
  id: number
  first_name?: string | null
  last_name?: string | null
  user_name?: string | null
}

export interface BookingPlaceAssignment {
  id: number
  booking_id: number
  room_index: number
  room_id: number
  place_number: number
  user_id: number
  user?: BookingPlaceUser | null
}

export interface BookingPlaceRoom {
  booking_total_guests: number
  booking_room_id: number
  booking_number: number
  room_id: number
  title: string
  number: number
  total_guests_in_type: number
}

/** room_index → room_id → place_number → assignments */
export type BookingPlacesMap = Record<
  string,
  Record<string, Record<string, BookingPlaceAssignment[]>>
>

export interface BookingPlacesData {
  rooms: BookingPlaceRoom[]
  places: BookingPlacesMap
}

export type BookingPlacesResponse = ApiSuccessResponse<BookingPlacesData>

export type BookingServiceType =
  | 'trophy'
  | 'penalty'
  | 'preparation'
  | 'food'
  | 'addetional'
  | 'spending'

export type BookingServicesRole = 'baseadmin' | 'hunter'

export interface BookingServiceOption {
  id: number
  type: string
}

export interface BookingServiceAnimalCatalog {
  id: number
  title: string
  trophies?: BookingServiceOption[]
  fines?: BookingServiceOption[]
  preparations?: BookingServiceOption[]
}

export interface BookingServiceHunterCatalog {
  id: number
  name: string
}

export interface BookingServiceAdditionalCatalog {
  id: number
  name: string
  calculation_type: 'individual' | 'per_person' | null
  count: number | null
  price: number
  is_system?: boolean | number | null
}

export interface BookingServicesCatalogs {
  trophy_animals: BookingServiceAnimalCatalog[]
  penalty_animals: BookingServiceAnimalCatalog[]
  preparation_animals: BookingServiceAnimalCatalog[]
  hunters: BookingServiceHunterCatalog[]
  additionals: BookingServiceAdditionalCatalog[]
}

export interface BookingServiceTrophyItem {
  id: number
  animal_id: number | null
  animal_title: string
  type: string
  count: number
}

export interface BookingServicePenaltyItem {
  id: number
  animal_id?: number | null
  animal_title: string
  type: string
  count?: number
  hunter_id: number | null
  hunter_name: string
}

export interface BookingServicePreparationItem {
  id: number
  animal_id: number | null
  animal_title: string
  count: number
}

export interface BookingServiceFoodItem {
  id: number
  type?: string
  count: number
}

export interface BookingServiceAdditionalItem {
  id: number
  type: string
  calculation_type?: string | null
  count: number
  hunter_id?: number | null
  hunter_name?: string
}

export interface BookingServiceSpendingItem {
  id: number
  price: number
  comment: string
  hunter_id?: number | null
  hunter_name?: string
}

export interface BookingServicesItems {
  trophies: BookingServiceTrophyItem[]
  penalties: BookingServicePenaltyItem[]
  preparations: BookingServicePreparationItem[]
  foods: BookingServiceFoodItem[]
  additionals: BookingServiceAdditionalItem[]
  spendings: BookingServiceSpendingItem[]
}

export interface BookingServicesData {
  role: BookingServicesRole
  booking_type: 'hotel' | 'animal' | 'hotel_animal'
  allowed_types: BookingServiceType[]
  catalogs: BookingServicesCatalogs
  items: BookingServicesItems
}

export type BookingServicesResponse = ApiSuccessResponse<BookingServicesData>

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
  customer_notes: string | null
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
  code?: string
  page?: number
}

export interface BookingHistoryActionDto {
  code: string
  label: string
}

export interface BookingCollectionInvitationDto {
  invitation_id: number
  hunter_id: number
  user_name?: string | null
  name: string
  email: string | null
  status: string | number
  is_accepted: boolean
  prepayment_paid?: boolean
  prepayment_paid_status?: string | null
  invitation_status?: string | number | null
  accept_status?: string | number | null
  action?: string | null
  is_declined?: boolean
  declined_at?: string | null
}

export interface BookingHistoryRoomDto {
  room_id: number
  title: string | null
  number: number
  price: number
  price_total?: number | null
  price_per_person?: number | null
  adults: number
  beds?: number | null
}

export interface BookingHistoryHotelDto {
  id: number
  title: string
  slug?: string | null
  location?: {
    slug?: string | null
  } | null
  collection_timer_hours?: number | null
  paid_timer_hours?: number | null
  bed_timer_hours?: number | null
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
  invitation_accepted_at?: string | null
  invitation_url?: string | null
  hotel: BookingHistoryHotelDto | null
  location?: {
    slug?: string | null
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
    amount_hunting?: number | null
    amount_hunting_per_person?: number | null
    amount_accommodation?: number | null
    amount_accommodation_per_person?: number | null
    animal: {
      id: number
      title: string
      price?: number | null
      price_total?: number | null
      price_per_person?: number | null
    } | null
    rooms: BookingHistoryRoomDto[]
  }
  collection: {
    accepted_count: number
    total_needed: number
    paid_count: number
    invitations?: BookingCollectionInvitationDto[]
    collection_end_at: string | null
    paid_end_at: string | null
    beds_end_at: string | null
  }
  payment?: {
    prepaid_total: number
    base_total: number
    total: number
  } | null
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
  hotel: BookingHistoryHotelDto | null
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
  image_url?: string
  hunters_count?: number
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

export type InboxNotificationTypeFilter = 'all' | 'unread' | 'read'

export interface InboxNotification {
  id: string
  title: string
  message: string
  link: string | null
  category: string | null
  entity_type: string | null
  entity_id: number | null
  event: string | null
  unread: boolean
  read_at: string | null
  created_at: string
  time_ago: string
}

export interface InboxNotificationsPagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface InboxNotificationsListData {
  unread_count: number
  notifications: InboxNotification[]
  pagination: InboxNotificationsPagination
}

export type InboxNotificationsListResponse =
  | ApiSuccessResponse<InboxNotificationsListData>
  | ApiErrorResponse

export interface InboxUnreadCountData {
  unread_count: number
}

export type InboxUnreadCountResponse =
  | ApiSuccessResponse<InboxUnreadCountData>
  | ApiErrorResponse

export type InboxNotificationActionResponse =
  | ApiSuccessResponse<unknown>
  | ApiErrorResponse

export interface InboxNotificationCreatedPayload {
  id: string
  title: string
  message: string
  link: string | null
  category: string | null
  entity_type?: string | null
  entity_id?: number | null
  event?: string | null
  unread: true
  created_at: string
  time_ago: string
}
