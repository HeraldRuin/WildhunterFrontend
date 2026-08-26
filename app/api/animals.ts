import type {
  AnimalAvailabilityRequest,
  AnimalAvailabilityResponse,
  ApiErrorResponse,
  ApiSuccessResponse,
  SearchAnimal,
} from '~/types/api'
import { useApiClient } from './client'

export interface ManagedAnimal {
  id: number
  title: string
  hunters_count: number
}

export interface AvailableAnimal {
  id: number
  title: string
}

export interface AnimalsManageData {
  animals: ManagedAnimal[]
  available: AvailableAnimal[]
}

export type AnimalsManageResponse =
  | ApiSuccessResponse<AnimalsManageData>
  | ApiErrorResponse

export type AnimalsManageItemResponse =
  | ApiSuccessResponse<ManagedAnimal>
  | ApiErrorResponse

export type AnimalsManageDeleteResponse =
  | ApiSuccessResponse<{ id: number }>
  | ApiErrorResponse

export interface AddManagedAnimalPayload {
  animal_id: number
}

export interface UpdateManagedAnimalHuntersPayload {
  hunters_count: number
}

export interface OrganisationPeriod {
  id: number
  start_date: string | null
  end_date: string | null
  price: number | null
}

export interface OrganisationAnimal {
  id: number
  title: string
  periods: OrganisationPeriod[]
}

export type AnimalsOrganisationResponse =
  | ApiSuccessResponse<OrganisationAnimal[]>
  | ApiErrorResponse

export interface CreateOrganisationPeriodData {
  animal_id: number
  period: OrganisationPeriod
}

export type CreateOrganisationPeriodResponse =
  | ApiSuccessResponse<CreateOrganisationPeriodData>
  | ApiErrorResponse

export interface UpdateOrganisationPeriodPayload {
  start_date: string | null
  end_date: string | null
  amount: number | null
}

export interface UpdateOrganisationPeriodData {
  period: OrganisationPeriod
}

export type UpdateOrganisationPeriodResponse =
  | ApiSuccessResponse<UpdateOrganisationPeriodData>
  | ApiErrorResponse

export type DeleteOrganisationPeriodResponse =
  | ApiSuccessResponse<{ id: number }>
  | ApiErrorResponse

export function useAnimalsApi() {
  const { apiFetch } = useApiClient()

  function getAnimals(params?: Record<string, unknown>) {
    return apiFetch<ApiSuccessResponse<SearchAnimal[]>>('/animals', { query: params })
  }

  async function getAnimalItems(params?: Record<string, unknown>) {
    const response = await getAnimals(params)

    if (!response.success) {
      return []
    }

    return response.data
  }

  function getDetail(id: number | string) {
    return apiFetch<ApiSuccessResponse<SearchAnimal>>(`/animals/${id}`)
  }

  function checkAvailability(body: AnimalAvailabilityRequest) {
    return apiFetch<AnimalAvailabilityResponse>('/animals/check-availability', {
      method: 'POST',
      body,
    })
  }

  function getManage() {
    return apiFetch<AnimalsManageResponse>('/animals/manage', {
      method: 'GET',
    })
  }

  function addManage(payload: AddManagedAnimalPayload) {
    return apiFetch<AnimalsManageItemResponse>('/animals/manage', {
      method: 'POST',
      body: payload,
    })
  }

  function updateManageHuntersCount(
    animalId: number | string,
    payload: UpdateManagedAnimalHuntersPayload,
  ) {
    return apiFetch<AnimalsManageItemResponse>(
      `/animals/manage/${encodeURIComponent(String(animalId))}/hunters-count`,
      {
        method: 'PUT',
        body: payload,
      },
    )
  }

  function deleteManage(animalId: number | string) {
    return apiFetch<AnimalsManageDeleteResponse>(
      `/animals/manage/${encodeURIComponent(String(animalId))}`,
      {
        method: 'DELETE',
      },
    )
  }

  function getOrganisation() {
    return apiFetch<AnimalsOrganisationResponse>('/animals/organisation', {
      method: 'GET',
    })
  }

  function createPeriod(animalId: number | string) {
    return apiFetch<CreateOrganisationPeriodResponse>(
      `/animals/${encodeURIComponent(String(animalId))}/periods`,
      {
        method: 'POST',
      },
    )
  }

  function updatePeriod(
    periodId: number | string,
    payload: UpdateOrganisationPeriodPayload,
  ) {
    return apiFetch<UpdateOrganisationPeriodResponse>(
      `/animals/periods/${encodeURIComponent(String(periodId))}`,
      {
        method: 'PUT',
        body: payload,
      },
    )
  }

  function deletePeriod(periodId: number | string) {
    return apiFetch<DeleteOrganisationPeriodResponse>(
      `/animals/periods/${encodeURIComponent(String(periodId))}`,
      {
        method: 'DELETE',
      },
    )
  }

  return {
    getAnimals,
    getAnimalItems,
    getDetail,
    checkAvailability,
    getManage,
    addManage,
    updateManageHuntersCount,
    deleteManage,
    getOrganisation,
    createPeriod,
    updatePeriod,
    deletePeriod,
  }
}
