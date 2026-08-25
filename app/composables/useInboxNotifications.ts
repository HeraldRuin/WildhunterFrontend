import type {
  InboxNotification,
  InboxNotificationCreatedPayload,
  InboxNotificationTypeFilter,
} from '~/types/api'
import { useNotificationsApi } from '~/api/notifications'

const items = ref<InboxNotification[]>([])
const unreadCount = ref(0)
const listLoaded = ref(false)
const listPending = ref(false)
const listError = ref('')
const actionPending = ref(false)

function toInboxItem(payload: InboxNotificationCreatedPayload): InboxNotification {
  return {
    id: payload.id,
    title: payload.title,
    message: payload.message,
    link: payload.link,
    category: payload.category,
    entity_type: null,
    entity_id: null,
    event: null,
    unread: true,
    read_at: null,
    created_at: payload.created_at,
    time_ago: payload.time_ago,
  }
}

export function useInboxNotifications() {
  const api = useNotificationsApi()

  function reset() {
    items.value = []
    unreadCount.value = 0
    listLoaded.value = false
    listPending.value = false
    listError.value = ''
    actionPending.value = false
  }

  async function fetchUnreadCount() {
    try {
      const response = await api.unreadCount()

      if (!response.success) {
        return
      }

      unreadCount.value = Number(response.data.unread_count) || 0
    }
    catch {
      // Badge не критичен — молча игнорируем сбой.
    }
  }

  async function fetchList(type: InboxNotificationTypeFilter = 'all') {
    listPending.value = true
    listError.value = ''

    try {
      const response = await api.list({ type, per_page: 20 })

      if (!response.success) {
        listError.value = response.message || 'Не удалось загрузить уведомления'
        return
      }

      items.value = response.data.notifications ?? []
      unreadCount.value = Number(response.data.unread_count) || 0
      listLoaded.value = true
    }
    catch (error) {
      const data = (error as { data?: { message?: string } }).data
      listError.value = data?.message || 'Не удалось загрузить уведомления'
    }
    finally {
      listPending.value = false
    }
  }

  function prependRealtime(payload: InboxNotificationCreatedPayload) {
    if (!payload?.id) {
      return
    }

    if (items.value.some(item => item.id === payload.id)) {
      return
    }

    if (listLoaded.value) {
      items.value = [toInboxItem(payload), ...items.value]
    }

    unreadCount.value += 1
  }

  async function markRead(id: string) {
    const target = items.value.find(item => item.id === id)

    if (!target || !target.unread) {
      return true
    }

    const previous = { ...target }
    const previousCount = unreadCount.value

    items.value = items.value.map(item =>
      item.id === id
        ? { ...item, unread: false, read_at: new Date().toISOString() }
        : item,
    )
    unreadCount.value = Math.max(0, unreadCount.value - 1)

    try {
      const response = await api.markRead(id)

      if (!response.success) {
        items.value = items.value.map(item => (item.id === id ? previous : item))
        unreadCount.value = previousCount
        return false
      }

      return true
    }
    catch {
      items.value = items.value.map(item => (item.id === id ? previous : item))
      unreadCount.value = previousCount
      return false
    }
  }

  async function markAllRead() {
    if (!unreadCount.value || actionPending.value) {
      return false
    }

    actionPending.value = true
    const previousItems = items.value
    const previousCount = unreadCount.value

    items.value = items.value.map(item => ({
      ...item,
      unread: false,
      read_at: item.read_at ?? new Date().toISOString(),
    }))
    unreadCount.value = 0

    try {
      const response = await api.markAllRead()

      if (!response.success) {
        items.value = previousItems
        unreadCount.value = previousCount
        return false
      }

      return true
    }
    catch {
      items.value = previousItems
      unreadCount.value = previousCount
      return false
    }
    finally {
      actionPending.value = false
    }
  }

  return {
    items: readonly(items),
    unreadCount: readonly(unreadCount),
    listLoaded: readonly(listLoaded),
    listPending: readonly(listPending),
    listError: readonly(listError),
    actionPending: readonly(actionPending),
    fetchUnreadCount,
    fetchList,
    markRead,
    markAllRead,
    prependRealtime,
    reset,
  }
}
