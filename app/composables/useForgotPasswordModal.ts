const isOpen = ref(false)

export function useForgotPasswordModal() {
  function open() {
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  return {
    isOpen: readonly(isOpen),
    open,
    close,
  }
}
