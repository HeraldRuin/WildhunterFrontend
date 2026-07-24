type ScrollTarget = {
  top: number
  left: number
}

let pendingScroll: ScrollTarget | null = null
let pendingHash: string | null = null

export function queueNavigationScroll(
  to: { hash?: string },
  savedPosition?: ScrollTarget | null,
) {
  if (to.hash) {
    pendingHash = to.hash
    pendingScroll = null
    return
  }

  pendingHash = null
  pendingScroll = savedPosition ?? { top: 0, left: 0 }
}

export function applyScroll(target: ScrollTarget) {
  window.scrollTo({ top: target.top, left: target.left, behavior: 'instant' })
  document.documentElement.scrollTop = target.top
  document.body.scrollTop = target.top
}

export function applyNavigationScroll() {
  if (pendingHash) {
    const hash = pendingHash
    pendingHash = null
    pendingScroll = null

    const element = document.querySelector(hash)
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ behavior: 'instant', block: 'start' })
      return
    }
  }

  const target = pendingScroll ?? { top: 0, left: 0 }
  const shouldRestorePosition = target.top > 0 || target.left > 0
  pendingScroll = null

  applyScroll(target)

  if (shouldRestorePosition) {
    requestAnimationFrame(() => applyScroll(target))
    setTimeout(() => applyScroll(target), 50)
  }
}
