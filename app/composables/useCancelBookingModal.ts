import type { BookingHistoryItem } from '~/types/booking'

export function useCancelBookingModal() {
  const { open } = useConfirmModal()

  function openCancel(
    _item: BookingHistoryItem,
    onConfirm?: () => void | Promise<void>,
  ) {
    open({
      title: 'Вы уверены, что хотите отменить бронь?',
      onConfirm,
    })
  }

  return {
    open: openCancel,
  }
}
