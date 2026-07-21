const isOpen = ref(false)
const message = ref('')

export const FAVORITE_REGISTRATION_MESSAGE =
  'Чтобы получить больше возможностей на нашем сайте, пройдите регистрацию'

export function useFavoriteAuthModal() {
  function open(customMessage?: string) {
    message.value = customMessage || FAVORITE_REGISTRATION_MESSAGE
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  return {
    isOpen: readonly(isOpen),
    message: readonly(message),
    open,
    close,
  }
}
