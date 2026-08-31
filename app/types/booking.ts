export type BookingTab = 'my' | 'invitations'

export type BookingType = 'hotel' | 'hotel_animal' | 'animal'

export type BookingActionVariant = 'danger' | 'primary' | 'success'

export type BookingActionId =
  | 'open_collection'
  | 'start_collection'
  | 'cancel_booking'
  | 'confirm_booking'
  | 'open_invitation'
  | 'select_seat'
  | 'add_services'
  | 'prepayment'
  | 'calculating'
  | 'mark_paid'
  | 'complete'

export interface BookingAction {
  id?: BookingActionId
  label: string
  variant: BookingActionVariant
}

export type CollectionParticipantStatus = 'confirmed' | 'pending' | 'declined'

export interface CollectionParticipant {
  id?: number
  invitationId?: number
  name: string
  email?: string
  status: CollectionParticipantStatus
}

export interface BookingInvitationParticipant {
  invitationId: number
  hunterId: number
  userName?: string
  name: string
  email?: string
  status: string | number
  isAccepted: boolean
  prepaymentPaid: boolean
  prepaymentPaidStatus?: string
  isDeclined?: boolean
  action?: string
  declinedAt?: string
}

export interface CollectionModalState {
  bookingId: number
  bookingCode: string
  bookingNumber: string
  collectionUrl?: string
  timerEndAt?: string
  timerExpired: boolean
  slotsTotal: number
  participants: CollectionParticipant[]
}

export interface BookingRoomDetail {
  name: string
  capacity: number
  quantity: number
  pricePerDay: number
  priceTotal?: number | null
  pricePerPerson?: number | null
}

export interface BookingAccommodationDetails {
  checkIn: string
  checkOut: string
  nights: number
  guests: number
  roomsTotal?: number
  rooms?: BookingRoomDetail[]
  total?: number | null
  totalPerPerson?: number | null
}

export interface BookingHuntDetails {
  date: string
  animal: string
  hunters: number
  pricePerHunter?: number | null
  priceTotal?: number | null
  pricePerPerson?: number | null
  total?: number | null
  totalPerPerson?: number | null
}

export interface BookingStatusInfo {
  code?: string
  label: string
  timer?: string
  timerEndAt?: string
  timerHours?: number
  collected?: string
  paid?: string
  subStatus?: string
  collectionStatus?: string
}

export interface BookingPaymentInfo {
  prepaidTotal: number
  baseTotal: number
  total: number
}

export interface BookingHistoryItem {
  id: number
  code: string
  number: string
  date: string
  baseName: string
  baseUrl?: string
  customerName?: string
  type: BookingType
  typeLabel: string
  accommodation?: BookingAccommodationDetails
  hunt?: BookingHuntDetails
  status: BookingStatusInfo
  payment?: BookingPaymentInfo
  paymentAction?: string
  actions: BookingAction[]
  isMasterHunter?: boolean
  isInvitation?: boolean
  invitationAccepted?: boolean
  invitationAcceptedAt?: string
  collectionInvitations?: BookingInvitationParticipant[]
  collectionUrl?: string
}
