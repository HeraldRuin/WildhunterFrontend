export interface HotelRoomAttributeTermOption {
  id: number
  name: string
  icon: string
  imageUrl: string
}

export interface HotelRoomAttributeGroupOption {
  id: number
  name: string
  terms: HotelRoomAttributeTermOption[]
}

export interface HotelRoomOption {
  id: string
  title: string
  area: string
  capacity: number
  price: number
  nights: number
  image?: string
  photosCount: number
  gallery: Array<{
    large: string
    medium: string
    thumb: string
  }>
  maxQuantity: number
  attributes: HotelRoomAttributeGroupOption[]
}

export interface HotelBookingRoomSelection {
  id: string
  title: string
  quantity: number
  price: number
  nights: number
  image?: string
}

export interface HotelBookingFormSnapshot {
  checkIn: string
  checkOut: string
  adults: number
  huntCheckIn: string
  huntCheckOut: string
  hunters: number
  animalTitle: string
  rooms: HotelBookingRoomSelection[]
}

export interface HotelBookingCreatePayload {
  hotel_id: number
  animal_id?: number
  check_in: string
  check_out: string
  adults: number
  hunters: number
  rooms: Array<{ room_id: number, number: number }>
}

export interface HotelBookingDraft {
  hotelId: number
  hotelTitle: string
  hotelSlug: string
  locationSlug: string
  hotelImage: string
  checkIn: string
  checkOut: string
  nights: number
  adults: number
  rooms: HotelBookingRoomSelection[]
  accommodationTotal: number
  huntCheckIn: string
  huntCheckOut: string
  hunters: number
  animalTitle: string
  animalImage: string
  huntDate: string
  organizationFee: number
  trophyFee: number
  bookingNumber: string
  bookingDate: string
  paymentMethod: string
  statusLabel: string
  email: string
  specialRequirements: string
  hasAccommodation: boolean
  hasHunt: boolean
  createPayload: HotelBookingCreatePayload
}
