const openSelectClosers = new Set<() => void>()

export function closeOtherSelects(current: () => void) {
  for (const close of [...openSelectClosers]) {
    if (close !== current) {
      close()
    }
  }
}

export function registerOpenSelect(close: () => void) {
  openSelectClosers.add(close)
}

export function unregisterOpenSelect(close: () => void) {
  openSelectClosers.delete(close)
}
