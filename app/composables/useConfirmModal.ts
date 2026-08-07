export interface ConfirmModalOptions {
  title: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void | Promise<void>
}

const isOpen = ref(false)
const isSubmitting = ref(false)
const options = ref<Required<Pick<ConfirmModalOptions, 'title' | 'confirmLabel' | 'cancelLabel'>> & {
  onConfirm?: ConfirmModalOptions['onConfirm']
} | null>(null)

export function useConfirmModal() {
  function open(next: ConfirmModalOptions) {
    options.value = {
      title: next.title,
      confirmLabel: next.confirmLabel ?? 'Подтвердить',
      cancelLabel: next.cancelLabel ?? 'Отменить',
      onConfirm: next.onConfirm,
    }
    isOpen.value = true
  }

  function close() {
    if (isSubmitting.value) return

    isOpen.value = false
    options.value = null
  }

  async function confirm() {
    if (!options.value || isSubmitting.value) return

    const handler = options.value.onConfirm
    if (!handler) {
      isOpen.value = false
      options.value = null
      return
    }

    isSubmitting.value = true

    try {
      await handler()
      isOpen.value = false
      options.value = null
    }
    finally {
      isSubmitting.value = false
    }
  }

  return {
    isOpen: readonly(isOpen),
    isSubmitting: readonly(isSubmitting),
    options: readonly(options),
    open,
    close,
    confirm,
  }
}
