import type {
  InboxNotificationActionResponse,
  InboxNotificationsListResponse,
  InboxNotificationTypeFilter,
  InboxUnreadCountResponse,
} from '~/types/api'
import { useApiClient } from './client'

export function useNotificationsApi() {
  const { apiFetch } = useApiClient()

  function list(params: {
    type?: InboxNotificationTypeFilter
    per_page?: number
    page?: number
  } = {}) {
    return apiFetch<InboxNotificationsListResponse>('/notifications', {
      query: {
        type: params.type ?? 'all',
        per_page: params.per_page ?? 20,
        ...(params.page ? { page: params.page } : {}),
      },
    })
  }

  function unreadCount() {
    return apiFetch<InboxUnreadCountResponse>('/notifications/unread-count')
  }

  function markRead(id: string) {
    return apiFetch<InboxNotificationActionResponse>(
      `/notifications/${encodeURIComponent(id)}/read`,
      { method: 'POST' },
    )
  }

  function markAllRead() {
    return apiFetch<InboxNotificationActionResponse>('/notifications/read-all', {
      method: 'POST',
    })
  }

  return {
    list,
    unreadCount,
    markRead,
    markAllRead,
  }
}
