import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  BookingCheckoutResponse,
  BookingHistoryQuery,
  BookingHistoryResponse,
  BookingPlacesResponse,
  BookingServiceAdditionalItem,
  BookingServiceFoodItem,
  BookingServicePenaltyItem,
  BookingServicePreparationItem,
  BookingServiceSpendingItem,
  BookingServiceTrophyItem,
  BookingServicesResponse,
  CancelBookingResponse,
  CompleteBookingResponse,
  ConfirmBookingResponse,
  CreateBookingRequest,
  CreateBookingResponse,
  MarkPaidBookingResponse,
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

  function markPaid(code: string) {
    return apiFetch<MarkPaidBookingResponse>(
      `/bookings/${encodeURIComponent(code)}/mark-paid`,
      {
        method: 'POST',
      },
    )
  }

  function complete(code: string) {
    return apiFetch<CompleteBookingResponse>(
      `/bookings/${encodeURIComponent(code)}/complete`,
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

  function places(code: string) {
    return apiFetch<BookingPlacesResponse>(
      `/bookings/${encodeURIComponent(code)}/places`,
    )
  }

  function services(code: string) {
    return apiFetch<BookingServicesResponse>(
      `/bookings/${encodeURIComponent(code)}/services`,
    )
  }

  function storeTrophy(
    code: string,
    body: { animal_id: number, trophy_id: number, type: string, count: number },
  ) {
    return apiFetch<ApiSuccessResponse<BookingServiceTrophyItem> | ApiErrorResponse>(
      `/bookings/${encodeURIComponent(code)}/services/trophies`,
      {
        method: 'POST',
        body,
      },
    )
  }

  function storePenalty(
    code: string,
    body: { animal_id: number, penalty_id: number, type: string, hunter_id: number },
  ) {
    return apiFetch<ApiSuccessResponse<BookingServicePenaltyItem> | ApiErrorResponse>(
      `/bookings/${encodeURIComponent(code)}/services/penalties`,
      {
        method: 'POST',
        body,
      },
    )
  }

  function storePreparation(
    code: string,
    body: { animal_id: number, preparation_id: number, count: number },
  ) {
    return apiFetch<ApiSuccessResponse<BookingServicePreparationItem> | ApiErrorResponse>(
      `/bookings/${encodeURIComponent(code)}/services/preparations`,
      {
        method: 'POST',
        body,
      },
    )
  }

  function storeFood(code: string, body: { count: number }) {
    return apiFetch<ApiSuccessResponse<BookingServiceFoodItem> | ApiErrorResponse>(
      `/bookings/${encodeURIComponent(code)}/services/foods`,
      {
        method: 'POST',
        body,
      },
    )
  }

  function storeAdditional(
    code: string,
    body: { additional_id: number, name: string, count: number, hunter_id: number },
  ) {
    return apiFetch<ApiSuccessResponse<BookingServiceAdditionalItem> | ApiErrorResponse>(
      `/bookings/${encodeURIComponent(code)}/services/additionals`,
      {
        method: 'POST',
        body,
      },
    )
  }

  function storeSpending(
    code: string,
    body: { hunter_id: number, price: number, comment: string },
  ) {
    return apiFetch<ApiSuccessResponse<BookingServiceSpendingItem> | ApiErrorResponse>(
      `/bookings/${encodeURIComponent(code)}/services/spendings`,
      {
        method: 'POST',
        body,
      },
    )
  }

  function deleteService(code: string, serviceId: number) {
    return apiFetch<ApiSuccessResponse<unknown> | ApiErrorResponse>(
      `/bookings/${encodeURIComponent(code)}/services/${serviceId}`,
      {
        method: 'DELETE',
      },
    )
  }

  function selectPlace(
    code: string,
    body: { room_id: number, place_number: number, room_index: number },
  ) {
    return apiFetch<ApiSuccessResponse<unknown> | ApiErrorResponse>(
      `/bookings/${encodeURIComponent(code)}/select-place`,
      {
        method: 'POST',
        body,
      },
    )
  }

  function cancelSelectPlace(code: string, placeId: number) {
    return apiFetch<ApiSuccessResponse<unknown> | ApiErrorResponse>(
      `/bookings/${encodeURIComponent(code)}/cancel-select-place`,
      {
        method: 'POST',
        body: {
          place_id: placeId,
        },
      },
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
    markPaid,
    complete,
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
    places,
    services,
    storeTrophy,
    storePenalty,
    storePreparation,
    storeFood,
    storeAdditional,
    storeSpending,
    deleteService,
    selectPlace,
    cancelSelectPlace,
    updateCustomerNotes,
    changeUser,
  }
}
