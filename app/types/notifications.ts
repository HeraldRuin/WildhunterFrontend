export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface NotificationAction {
  text: string
  class?: string
  closeOnAction?: boolean
  onClick?: () => void
}

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  duration?: number
  actions?: NotificationAction[]
}
