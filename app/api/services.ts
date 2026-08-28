import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  BookingServiceAdditionalCatalog,
  HotelRoomAttribute,
} from '~/types/api'
import { useApiClient } from './client'

export interface FavoriteResponse {
  success?: boolean
  message?: string
  data?: FavoriteServiceItem | FavoriteServiceItem[]
}

export interface FavoriteServiceItem {
  service_id: number
  service_model: string
  user_id: number
}

export interface ManagedAdditionalService extends BookingServiceAdditionalCatalog {
  type?: string | null
  can_delete?: boolean
  can_edit_name?: boolean
}

export interface AdditionalServiceData {
  additional: ManagedAdditionalService
}

export interface AdditionalServicesListData {
  additionals: ManagedAdditionalService[]
}

export type AdditionalServicesListResponse =
  | ApiSuccessResponse<ManagedAdditionalService[] | AdditionalServicesListData>
  | ApiErrorResponse

export type AdditionalServiceResponse =
  | ApiSuccessResponse<ManagedAdditionalService | AdditionalServiceData>
  | ApiErrorResponse

export type AdditionalServiceDeleteResponse =
  | ApiSuccessResponse<{ id: number }>
  | ApiErrorResponse

export interface SaveAdditionalServicePayload {
  name: string
  calculation_type: 'individual' | 'per_person' | null
  count: number | null
  price: number
}

export function useServicesApi() {
  const { apiFetch } = useApiClient()

  function addFavorite(serviceId: number) {
    return apiFetch<FavoriteResponse>(`/services/${serviceId}/favorite`, {
      method: 'POST',
      body: {},
    })
  }

  function removeFavorite(serviceId: number) {
    return apiFetch<FavoriteResponse>(`/services/${serviceId}/favorite`, {
      method: 'DELETE',
    })
  }

  function getFavorites(type = 'hotel') {
    return apiFetch<ApiSuccessResponse<FavoriteServiceItem[]>>(`/services/favorites?type=${type}`, {
      method: 'POST',
    })
  }

  function getAttributes(type = 'hotel') {
    return apiFetch<ApiSuccessResponse<HotelRoomAttribute[]>>('/services/attributes', {
      method: 'POST',
      body: { type },
      skipAuth: true,
    })
  }

  async function getAttributeGroups(type = 'hotel') {
    try {
      const response = await getAttributes(type)

      if (!response.success) {
        return []
      }

      return response.data
    }
    catch {
      return []
    }
  }

  function getAdditionals() {
    return apiFetch<AdditionalServicesListResponse>('/services/additionals', {
      method: 'GET',
    })
  }

  function createAdditional(payload: SaveAdditionalServicePayload) {
    return apiFetch<AdditionalServiceResponse>('/services/additionals', {
      method: 'POST',
      body: payload,
    })
  }

  function updateAdditional(
    additionalId: number | string,
    payload: SaveAdditionalServicePayload,
  ) {
    return apiFetch<AdditionalServiceResponse>(
      `/services/additionals/${encodeURIComponent(String(additionalId))}`,
      {
        method: 'PUT',
        body: payload,
      },
    )
  }

  function deleteAdditional(additionalId: number | string) {
    return apiFetch<AdditionalServiceDeleteResponse>(
      `/services/additionals/${encodeURIComponent(String(additionalId))}`,
      {
        method: 'DELETE',
      },
    )
  }

  return {
    addFavorite,
    removeFavorite,
    getFavorites,
    getAttributes,
    getAttributeGroups,
    getAdditionals,
    createAdditional,
    updateAdditional,
    deleteAdditional,
  }
}
