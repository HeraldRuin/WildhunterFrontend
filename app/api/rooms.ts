import type { ApiErrorResponse, ApiSuccessResponse } from '~/types/api'
import { useApiClient } from './client'

export type RoomManageStatus = 'publish' | 'draft'

export interface ManagedRoom {
  id: number
  title: string
  number: number
  price: number
  status: string
  image_url?: string
  updated_at?: string
}

export interface RoomsListData {
  hotel_id: number
  rooms: ManagedRoom[]
}

export type RoomsListResponse =
  | ApiSuccessResponse<RoomsListData>
  | ApiErrorResponse

export interface RoomManageVisibilityData {
  id: number
  status: RoomManageStatus
  status_label: string
}

export type RoomManageVisibilityResponse =
  | ApiSuccessResponse<RoomManageVisibilityData>
  | ApiErrorResponse

export type RoomManageDeleteResponse =
  | ApiSuccessResponse<{ id: number }>
  | ApiErrorResponse

export interface RoomAvailabilityBooking {
  id: number
  booking_number: string | number | null
  code: string
  status: string
  statusName: string
  /** Эта бронь в этот день выезжает */
  is_checkout: boolean
}

export interface RoomAvailabilityExtendedProps {
  max_number: number
  price_changed?: boolean
  number_changed?: boolean
  is_summary?: boolean
}

export interface RoomAvailabilityDay {
  id: string
  start: string
  allDay: boolean
  price: number
  number: number
  active: number
  title: string
  classNames?: string[]
  occupiedRooms?: number | null
  /** В этот день есть хотя бы один выезд */
  is_checkout_day?: boolean
  extendedProps: RoomAvailabilityExtendedProps
  bookings?: RoomAvailabilityBooking[]
  bookings_html?: string
}

export type RoomsAvailabilityResponse =
  | ApiSuccessResponse<RoomAvailabilityDay[]>
  | ApiErrorResponse

export interface RoomsAvailabilityQuery {
  id: string | number
  start: string
  end: string
  for_single?: boolean
}

export function useRoomsApi() {
  const { apiFetch } = useApiClient()

  function getList() {
    return apiFetch<RoomsListResponse>('/rooms', {
      method: 'GET',
    })
  }

  function getAvailability(query: RoomsAvailabilityQuery) {
    return apiFetch<RoomsAvailabilityResponse>('/rooms/availability', {
      method: 'GET',
      query: {
        id: String(query.id),
        start: query.start,
        end: query.end,
        ...(query.for_single !== undefined ? { for_single: query.for_single } : {}),
      },
    })
  }

  function publish(roomId: number | string) {
    return apiFetch<RoomManageVisibilityResponse>(
      `/rooms/${encodeURIComponent(String(roomId))}/publish`,
      {
        method: 'POST',
      },
    )
  }

  function hide(roomId: number | string) {
    return apiFetch<RoomManageVisibilityResponse>(
      `/rooms/${encodeURIComponent(String(roomId))}/hide`,
      {
        method: 'POST',
      },
    )
  }

  function deleteManage(roomId: number | string) {
    return apiFetch<RoomManageDeleteResponse>(
      `/rooms/${encodeURIComponent(String(roomId))}`,
      {
        method: 'DELETE',
      },
    )
  }

  return {
    getList,
    getAvailability,
    publish,
    hide,
    deleteManage,
  }
}
