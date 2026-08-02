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
  huntDate: string
  organizationFee: number
  trophyFee: number
  bookingNumber: string
  bookingDate: string
  paymentMethod: string
  statusLabel: string
  email: string
  specialRequirements: string
}
