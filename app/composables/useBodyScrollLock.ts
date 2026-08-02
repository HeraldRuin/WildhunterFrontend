let lockCount = 0

function lockBodyScroll() {
  if (lockCount === 0) {
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    // With scrollbar-gutter: stable the reserved space already prevents jump;
    // only pad when a classic scrollbar still changes layout width.
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
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

  document.documentElement.style.overflow = ''
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
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
  const { isOpen: isFavoriteAuthOpen } = useFavoriteAuthModal()

  useBodyScrollLock(isFavoriteAuthOpen)
}
