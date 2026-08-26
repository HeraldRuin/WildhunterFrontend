import type { HotelBookingDraft } from '~/types/hotelBooking'

export function useHotelBookingDraft() {
  const draft = useState<HotelBookingDraft | null>('hotel_booking_confirmation', () => null)
  const pendingNotes = useState('hotel_booking_pending_notes', () => '')

  function setDraft(value: HotelBookingDraft) {
    draft.value = value
  }

  function clearDraft() {
    draft.value = null
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
    setDraft,
    clearDraft,
    setPendingNotes,
    clearPendingNotes,
  }
}
