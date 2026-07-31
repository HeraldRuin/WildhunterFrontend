import type { HotelBookingDraft } from '~/types/hotelBooking'

export function useHotelBookingDraft() {
  const draft = useState<HotelBookingDraft | null>('hotel_booking_confirmation', () => null)

  function setDraft(value: HotelBookingDraft) {
    draft.value = value
  }

  function clearDraft() {
    draft.value = null
  }

  return {
    draft,
    setDraft,
    clearDraft,
  }
}
