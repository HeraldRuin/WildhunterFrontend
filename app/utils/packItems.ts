/**
 * Упаковывает элементы в одну строку по ширине.
 * Ожидает, что `items` уже отсортированы (например, короткие названия первыми).
 * Не влезающие элементы отбрасываются; при обрезке резервируется место под «...».
 */
export function packItemsByWidth<T>(
  items: T[],
  getWidth: (item: T) => number,
  containerWidth: number,
  options: {
    gap?: number
    firstLineOffset?: number
    ellipsisWidth?: number
    hasMoreOutside?: boolean
  } = {},
): T[] {
  if (!items.length || containerWidth <= 0) {
    return items.slice()
  }

  const gap = options.gap ?? 0
  const firstLineOffset = Math.max(0, options.firstLineOffset ?? 0)
  const ellipsisWidth = Math.max(0, options.ellipsisWidth ?? 0)
  const hasMoreOutside = Boolean(options.hasMoreOutside)

  const packed: T[] = []
  let used = firstLineOffset

  for (const item of items) {
    const width = getWidth(item)
    const chipNeed = (used === 0 ? 0 : gap) + width
    if (used + chipNeed > containerWidth) {
      break
    }
    packed.push(item)
    used += chipNeed
  }

  const truncated = packed.length < items.length || hasMoreOutside
  if (!truncated || ellipsisWidth <= 0) {
    return packed
  }

  while (packed.length > 0) {
    used = firstLineOffset
    for (const item of packed) {
      used += (used === 0 ? 0 : gap) + getWidth(item)
    }
    if (used + gap + ellipsisWidth <= containerWidth) {
      break
    }
    packed.pop()
  }

  return packed
}
