import type { BookingHistoryItem } from '~/types/booking'

export function useCancelBookingModal() {
  const { open } = useConfirmModal()

  function openCancel(_item: BookingHistoryItem) {
    open({
      title: 'Вы уверены, что хотите отменить бронь?',
    })
  }

  return {
    open: openCancel,
  }
}
