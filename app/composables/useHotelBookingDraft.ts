import type { HotelBookingDraft } from '~/types/hotelBooking'

export interface HotelBookingCheckoutHuntMeta {
  code: string
  huntCount: number
  huntingPerPerson: number | null
}

export function useHotelBookingDraft() {
  const draft = useState<HotelBookingDraft | null>('hotel_booking_confirmation', () => null)
  const pendingNotes = useState('hotel_booking_pending_notes', () => '')
  const pendingCheckoutHuntMeta = useState<HotelBookingCheckoutHuntMeta | null>(
    'hotel_booking_checkout_hunt_meta',
    () => null,
  )

  function setDraft(value: HotelBookingDraft) {
    draft.value = value
  }

  function clearDraft() {
    draft.value = null
  }

  function setPendingCheckoutHuntMeta(value: HotelBookingCheckoutHuntMeta) {
    pendingCheckoutHuntMeta.value = value
  }

  function clearPendingCheckoutHuntMeta() {
    pendingCheckoutHuntMeta.value = null
  }

  function setPendingNotes(value: string) {
    pendingNotes.value = value
  }

  function clearPendingNotes() {
    pendingNotes.value = ''
  }

  return {
    draft,
    pendingNotes,
    pendingCheckoutHuntMeta,
    setDraft,
    clearDraft,
    setPendingNotes,
    clearPendingNotes,
    setPendingCheckoutHuntMeta,
    clearPendingCheckoutHuntMeta,
  }
}
