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

export function bookingMatchesServicesUpdate(
  booking: { id: number | string, code?: string | null } | null | undefined,
  payload: BookingServicesUpdatedPayload,
) {
  if (!booking) {
    return false
  }

  if (payload.code && booking.code && payload.code === booking.code) {
    return true
  }

  return Number(payload.booking_id) === Number(booking.id)
}

export function useBookingServicesChannel(
  bookingId: Ref<number | string | null>,
  onUpdated: (payload: BookingServicesUpdatedPayload) => void,
  bookingCode?: Ref<string | null | undefined>,
) {
  watch(servicesUpdate, (payload) => {
    if (!payload) {
      return
    }

    const id = bookingId.value
    const code = bookingCode?.value
    const sameId = id != null && Number(payload.booking_id) === Number(id)
    const sameCode = Boolean(code && payload.code && payload.code === code)

    if (!sameId && !sameCode) {
      return
    }

    onUpdated(payload)
  })
}
