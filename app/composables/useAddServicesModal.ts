import type { BookingHistoryItem } from '~/types/booking'

const isOpen = ref(false)
const booking = ref<BookingHistoryItem | null>(null)

export function useAddServicesModal() {
  function open(item: BookingHistoryItem) {
    booking.value = item
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
    booking.value = null
  }

  function sync(item: BookingHistoryItem) {
    if (!isOpen.value || booking.value?.code !== item.code) {
      return
    }

    booking.value = item
  }

  return {
    isOpen: readonly(isOpen),
    booking: readonly(booking),
    open,
    close,
    sync,
  }
}
