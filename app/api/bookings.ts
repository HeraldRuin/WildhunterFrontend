import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  BookingCheckoutResponse,
  BookingHistoryQuery,
  BookingHistoryResponse,
  CancelBookingResponse,
  ConfirmBookingResponse,
  CreateBookingRequest,
  CreateBookingResponse,
  ExtendCollectionResponse,
  StartCollectionResponse,
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
        ...(query.code ? { code: query.code } : {}),
      },
    })
  }

  function confirm(code: string) {
    return apiFetch<ConfirmBookingResponse>(
      `/bookings/${encodeURIComponent(code)}/confirm`,
      {
        method: 'POST',
      },
    )
  }

  function cancel(code: string) {
    return apiFetch<CancelBookingResponse>(
      `/bookings/${encodeURIComponent(code)}/cancel`,
      {
        method: 'POST',
      },
    )
  }

  function startCollection(code: string) {
    return apiFetch<StartCollectionResponse>(
      `/bookings/${encodeURIComponent(code)}/start-collection`,
      {
        method: 'POST',
      },
    )
  }

  function extendCollection(code: string) {
    return apiFetch<ExtendCollectionResponse>(
      `/bookings/${encodeURIComponent(code)}/extend-collection`,
      {
        method: 'POST',
      },
    )
  }

  function cancelCollection(code: string) {
    return apiFetch<ApiSuccessResponse<unknown> | ApiErrorResponse>(
      `/bookings/${encodeURIComponent(code)}/cancel-collection`,
      {
        method: 'POST',
      },
    )
  }

  function finishCollection(code: string) {
    return apiFetch<ApiSuccessResponse<unknown> | ApiErrorResponse>(
      `/bookings/${encodeURIComponent(code)}/finish-collection`,
      {
        method: 'POST',
      },
    )
  }

  function replaceHunter(code: string, oldHunterId: number, hunterId: number) {
    return apiFetch<ApiSuccessResponse<unknown> | ApiErrorResponse>(
      `/bookings/${encodeURIComponent(code)}/replace-hunter`,
      {
        method: 'POST',
        body: {
          old_hunter_id: oldHunterId,
          hunter_id: hunterId,
        },
      },
    )
  }

  function removeHunter(code: string, hunterId: number) {
    return apiFetch<ApiSuccessResponse<unknown> | ApiErrorResponse>(
      `/bookings/${encodeURIComponent(code)}/remove-hunter`,
      {
        method: 'DELETE',
        body: {
          hunter_id: hunterId,
        },
      },
    )
  }

  function expirePrepayment(code: string) {
    return apiFetch<ApiSuccessResponse<unknown> | ApiErrorResponse>(
      `/bookings/${encodeURIComponent(code)}/expire-prepayment`,
      {
        method: 'POST',
      },
    )
  }

  function markPrepaymentPaid(code: string) {
    return apiFetch<ApiSuccessResponse<unknown> | ApiErrorResponse>(
      `/bookings/${encodeURIComponent(code)}/prepayment-paid`,
      {
        method: 'POST',
        body: {},
      },
    )
  }

  function inviteHunter(code: string, hunterId: number) {
    return apiFetch<ApiSuccessResponse<unknown> | ApiErrorResponse>(
      `/bookings/${encodeURIComponent(code)}/invite-hunter`,
      {
        method: 'POST',
        body: {
          hunter_id: hunterId,
        },
      },
    )
  }

  function acceptInvitation(code: string) {
    return apiFetch<ApiSuccessResponse<unknown> | ApiErrorResponse>(
      `/bookings/${encodeURIComponent(code)}/accept-invitation`,
      {
        method: 'POST',
      },
    )
  }

  function declineInvitation(code: string) {
    return apiFetch<ApiSuccessResponse<unknown> | ApiErrorResponse>(
      `/bookings/${encodeURIComponent(code)}/decline-invitation`,
      {
        method: 'POST',
      },
    )
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

  function changeUser(code: string, userId: number) {
    return apiFetch<ApiSuccessResponse<unknown> | ApiErrorResponse>(
      `/bookings/${encodeURIComponent(code)}/change-user`,
      {
        method: 'POST',
        body: {
          user_id: userId,
        },
      },
    )
  }

  return {
    create,
    history,
    confirm,
    cancel,
    startCollection,
    extendCollection,
    cancelCollection,
    finishCollection,
    replaceHunter,
    removeHunter,
    expirePrepayment,
    markPrepaymentPaid,
    inviteHunter,
    acceptInvitation,
    declineInvitation,
    checkout,
    updateCustomerNotes,
    changeUser,
  }
}
