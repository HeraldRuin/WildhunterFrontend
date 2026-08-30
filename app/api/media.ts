import type { ApiErrorResponse, ApiSuccessResponse } from '~/types/api'
import { useApiClient } from './client'

export interface MediaFileData {
  id: number
  file_name?: string
  file_path?: string
  file_type?: string
  file_extension?: string
  url?: string
  view_url?: string
  sizes?: Record<string, string>
}

export type MediaStoreResponse =
  | ApiSuccessResponse<MediaFileData>
  | ApiErrorResponse
  | {
      status?: number | boolean
      uploaded?: number
      message?: string
      data?: MediaFileData | null
      url?: string
      fileName?: string
    }

function extractMediaId(payload: MediaStoreResponse): number | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const data = 'data' in payload ? payload.data : null

  if (data && typeof data === 'object' && 'id' in data) {
    const id = Number(data.id)
    if (Number.isFinite(id) && id > 0) {
      return id
    }
  }

  return null
}

export function useMediaApi() {
  const { apiFetch } = useApiClient()

  async function store(file: File, type = 'image') {
    const body = new FormData()
    body.append('file', file)
    body.append('type', type)

    const response = await apiFetch<MediaStoreResponse>('/media/store', {
      method: 'POST',
      body,
    })

    const id = extractMediaId(response)

    if (!id) {
      const message = ('message' in response && response.message)
        || 'Не удалось загрузить изображение'

      throw Object.assign(new Error(message), { data: response })
    }

    return {
      id,
      response,
      url: ('url' in response && typeof response.url === 'string')
        ? response.url
        : undefined,
    }
  }

  return {
    store,
  }
}
