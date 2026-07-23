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

function closeByGroup(group: string) {
  [...notifications.value]
    .filter(notification => notification.group === group)
    .forEach(notification => close(notification.id))
}

function show(notification: Omit<Notification, 'id'>) {
  if (notification.group) {
    closeByGroup(notification.group)
  }

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

type NotificationOptions = Pick<Notification, 'group' | 'duration'>

function success(message: string, title = 'Успех', options?: NotificationOptions) {
  return show({ type: 'success', title, message, ...options })
}

function error(message: string, title = 'Ошибка', options?: NotificationOptions) {
  return show({ type: 'error', title, message, ...options })
}

function warning(message: string, title = 'Внимание', options?: NotificationOptions) {
  return show({ type: 'warning', title, message, ...options })
}

function info(message: string, title = 'Информация', options?: NotificationOptions) {
  return show({ type: 'info', title, message, ...options })
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
