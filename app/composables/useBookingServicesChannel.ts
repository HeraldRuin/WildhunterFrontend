interface BookingServicesUpdatedPayload {
  booking_id: number
  code: string
}

const servicesUpdate = ref<(BookingServicesUpdatedPayload & { seq: number }) | null>(null)
let servicesUpdateSeq = 0

export function publishBookingServicesUpdated(payload: BookingServicesUpdatedPayload) {
  servicesUpdateSeq += 1
  servicesUpdate.value = {
    booking_id: payload.booking_id,
    code: payload.code,
    seq: servicesUpdateSeq,
  }
}

export function useBookingServicesChannel(
  bookingId: Ref<number | null>,
  onUpdated: (payload: BookingServicesUpdatedPayload) => void,
) {
  watch(servicesUpdate, (payload) => {
    if (!payload || bookingId.value == null || payload.booking_id !== bookingId.value) {
      return
    }

    onUpdated(payload)
  })
}
