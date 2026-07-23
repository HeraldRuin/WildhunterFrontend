import type { Notification, NotificationAction, NotificationType } from '~/types/notifications'

const notifications = ref<Notification[]>([])
const maxVisible = 5
const timers = new Map<string, ReturnType<typeof setTimeout>>()

function createId() {
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function remove(id: string) {
  const timer = timers.get(id)
  if (timer) {
    clearTimeout(timer)
    timers.delete(id)
  }

  notifications.value = notifications.value.filter(n => n.id !== id)
}

function close(id: string) {
  remove(id)
}

function show(notification: Omit<Notification, 'id'>) {
  const id = createId()

  const newNotification: Notification = {
    id,
    ...notification,
  }

  notifications.value.unshift(newNotification)

  if (notifications.value.length > maxVisible) {
    const oldest = notifications.value.pop()
    if (oldest) {
      remove(oldest.id)
    }
  }

  const duration = notification.duration ?? 6000
  const timer = setTimeout(() => {
    close(id)
  }, duration)

  timers.set(id, timer)

  return id
}

function success(message: string, title = 'Успех') {
  return show({ type: 'success', title, message })
}

function error(message: string, title = 'Ошибка') {
  return show({ type: 'error', title, message })
}

function warning(message: string, title = 'Внимание') {
  return show({ type: 'warning', title, message })
}

function info(message: string, title = 'Информация') {
  return show({ type: 'info', title, message })
}

function clear() {
  notifications.value.forEach(n => close(n.id))
}

function handleAction(id: string, action: NotificationAction) {
  action.onClick?.()

  if (action.closeOnAction !== false) {
    close(id)
  }
}

export function useNotifications() {
  return {
    notifications: readonly(notifications),
    show,
    success,
    error,
    warning,
    info,
    close,
    clear,
    handleAction,
  }
}
