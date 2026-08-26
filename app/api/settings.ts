import type { ApiErrorResponse, ApiSuccessResponse } from '~/types/api'
import { useApiClient } from './client'

export type TimerSettingsType = 'collection' | 'beds' | 'prepayment'

export interface TimerSettingsData {
  type?: TimerSettingsType | string
  timer_hours: number
}

export type TimerSettingsResponse =
  | ApiSuccessResponse<TimerSettingsData>
  | ApiErrorResponse

export interface SaveTimerSettingsPayload {
  timer_hours: number
}

export function useSettingsApi() {
  const { apiFetch } = useApiClient()

  function getTimerSettings(type: TimerSettingsType) {
    return apiFetch<TimerSettingsResponse>(
      `/settings/timers/${encodeURIComponent(type)}`,
      { method: 'GET' },
    )
  }

  function saveTimerSettings(type: TimerSettingsType, payload: SaveTimerSettingsPayload) {
    return apiFetch<TimerSettingsResponse>(
      `/settings/timers/${encodeURIComponent(type)}`,
      {
        method: 'PUT',
        body: payload,
      },
    )
  }

  return {
    getTimerSettings,
    saveTimerSettings,
  }
}
