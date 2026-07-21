let scrollY = 0
let lockCount = 0

function lockBodyScroll() {
  if (lockCount === 0) {
    scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
  }

  lockCount++
}

function unlockBodyScroll() {
  if (lockCount === 0) {
    return
  }

  lockCount--

  if (lockCount > 0) {
    return
  }

  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.left = ''
  document.body.style.right = ''
  document.body.style.width = ''
  document.body.style.overflow = ''
  window.scrollTo(0, scrollY)
}

export function useBodyScrollLock(isOpen: Ref<boolean>) {
  watch(isOpen, (open) => {
    if (open) {
      lockBodyScroll()
      return
    }

    unlockBodyScroll()
  })

  onUnmounted(() => {
    if (isOpen.value) {
      unlockBodyScroll()
    }
  })
}

export function useAuthModalsScrollLock() {
  const { isOpen: isLoginOpen } = useLoginModal()
  const { isOpen: isRegisterOpen } = useRegisterModal()
  const { isOpen: isForgotPasswordOpen } = useForgotPasswordModal()

  const isAnyOpen = computed(
    () => isLoginOpen.value || isRegisterOpen.value || isForgotPasswordOpen.value,
  )

  useBodyScrollLock(isAnyOpen)
}
