import type {
  BookingCheckoutResponse,
  BookingHistoryQuery,
  BookingHistoryResponse,
  CreateBookingRequest,
  CreateBookingResponse,
  UpdateCustomerNotesResponse,
} from '~/types/api'
import { useApiClient } from './client'

export function useBookingsApi() {
  const { apiFetch } = useApiClient()

  function create(body: CreateBookingRequest) {
    return apiFetch<CreateBookingResponse>('/bookings', {
      method: 'POST',
      body,
    })
  }

  function history(query: BookingHistoryQuery = {}) {
    return apiFetch<BookingHistoryResponse>('/bookings/history', {
      query: {
        page: query.page ?? 1,
        ...(query.status ? { status: query.status } : {}),
        ...(query.booking_id ? { booking_id: query.booking_id } : {}),
      },
    })
  }

  function checkout(code: string) {
    return apiFetch<BookingCheckoutResponse>(
      `/bookings/${encodeURIComponent(code)}/checkout`,
    )
  }

  function updateCustomerNotes(code: string, customerNotes: string) {
    return apiFetch<UpdateCustomerNotesResponse>('/bookings/customer-notes', {
      method: 'PUT',
      body: {
        code,
        customer_notes: customerNotes,
      },
    })
  }

  return {
    create,
    history,
    checkout,
    updateCustomerNotes,
  }
}
