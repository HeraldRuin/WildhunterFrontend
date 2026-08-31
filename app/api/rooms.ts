import type { ApiErrorResponse, ApiSuccessResponse } from '~/types/api'
import { useApiClient } from './client'

export type RoomManageStatus = 'publish' | 'draft' | 'pending'

export interface ManagedRoom {
  id: number
  title: string
  number: number
  price: number
  status: string
  image_url?: string
  updated_at?: string
}

export interface ManagedRoomGalleryImage {
  id: number
  large?: string | null
  medium?: string | null
  thumb?: string | null
}

export interface ManagedRoomDetail {
  id: number
  title: string
  content: string | null
  image_id: number | null
  image_url: string | null
  gallery: ManagedRoomGalleryImage[]
  price: number | string | null
  number: number | null
  beds: number | null
  size: number | null
  adults: number | null
  children: number | null
  status: string
  status_label: string
  min_day_stays: number | null
  ical_import_url: string | null
  video: string | null
  term_ids: number[]
}

export interface RoomsListData {
  hotel_id: number
  rooms: ManagedRoom[]
}

export type RoomsListResponse =
  | ApiSuccessResponse<RoomsListData>
  | ApiErrorResponse

export type RoomManageDetailResponse =
  | ApiSuccessResponse<ManagedRoomDetail>
  | ApiErrorResponse

export interface RoomManageUpdatePayload {
  title: string
  content?: string | null
  image_id?: number | null
  gallery?: number[] | null
  price?: number | null
  number?: number | null
  beds?: number | null
  size?: number | null
  adults?: number | null
  children?: number | null
  status?: RoomManageStatus | string | null
  min_day_stays?: number | null
  ical_import_url?: string | null
  video?: string | null
  term_ids?: number[] | null
}

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

  function getById(roomId: number | string) {
    return apiFetch<RoomManageDetailResponse>(
      `/rooms/${encodeURIComponent(String(roomId))}`,
      {
        method: 'GET',
      },
    )
  }

  function create(payload: RoomManageUpdatePayload) {
    return apiFetch<RoomManageDetailResponse>('/rooms', {
      method: 'POST',
      body: payload,
    })
  }

  function update(roomId: number | string, payload: RoomManageUpdatePayload) {
    return apiFetch<RoomManageDetailResponse>(
      `/rooms/${encodeURIComponent(String(roomId))}`,
      {
        method: 'PUT',
        body: payload,
      },
    )
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
    getById,
    create,
    update,
    getAvailability,
    publish,
    hide,
    deleteManage,
  }
}
