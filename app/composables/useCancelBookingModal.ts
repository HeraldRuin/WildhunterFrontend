import type { BookingHistoryItem } from '~/types/booking'

const isOpen = ref(false)
const booking = ref<BookingHistoryItem | null>(null)

export function useCancelBookingModal() {
  function open(item: BookingHistoryItem) {
    booking.value = item
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
    booking.value = null
  }

  return {
    isOpen: readonly(isOpen),
    booking: readonly(booking),
    open,
    close,
  }
}
