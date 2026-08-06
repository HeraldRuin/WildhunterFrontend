export type BookingTab = 'my' | 'invitations'

export type BookingType = 'hotel' | 'hotel_animal' | 'animal'

export type BookingActionVariant = 'danger' | 'primary' | 'success'

export type BookingActionId = 'open_collection' | 'cancel_booking' | 'open_invitation' | 'select_seat' | 'add_services'

export interface BookingAction {
  id?: BookingActionId
  label: string
  variant: BookingActionVariant
}

export type CollectionParticipantStatus = 'confirmed' | 'pending'

export interface CollectionParticipant {
  id?: number
  name: string
  email?: string
  status: CollectionParticipantStatus
}

export interface CollectionModalState {
  bookingId: number
  bookingNumber: string
  collectionUrl?: string
  slotsTotal: number
  participants: CollectionParticipant[]
}

export interface BookingAccommodationDetails {
  checkIn: string
  checkOut: string
  nights: number
  guests: number
  rooms?: string
}

export interface BookingHuntDetails {
  date: string
  animal: string
  hunters: number
}

export interface BookingStatusInfo {
  label: string
  timer?: string
  collected?: string
  paid?: string
  subStatus?: string
}

export interface BookingHistoryItem {
  id: number
  number: string
  date: string
  baseName: string
  baseUrl?: string
  type: BookingType
  typeLabel: string
  accommodation?: BookingAccommodationDetails
  hunt?: BookingHuntDetails
  status: BookingStatusInfo
  paymentAction?: string
  actions: BookingAction[]
  isInvitation?: boolean
}
