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

export function useRoomsApi() {
  const { apiFetch } = useApiClient()

  function getList() {
    return apiFetch<RoomsListResponse>('/rooms', {
      method: 'GET',
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
    publish,
    hide,
    deleteManage,
  }
}
