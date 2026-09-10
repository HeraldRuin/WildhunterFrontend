/**
 * Упаковывает элементы в строки по ширине: если следующий не влезает,
 * берётся первый более короткий из оставшихся (как «Лось» вместо «Олень благородный»).
 * Порядок исходного списка сохраняется по возможности (first-fit с пропуском).
 */
export function packItemsByWidth<T>(
  items: T[],
  getWidth: (item: T) => number,
  containerWidth: number,
  options: {
    gap?: number
    firstLineOffset?: number
  } = {},
): T[] {
  if (!items.length || containerWidth <= 0) {
    return items.slice()
  }

  const gap = options.gap ?? 0
  const remaining = items.map((item, index) => ({
    item,
    index,
    width: getWidth(item),
  }))
  const packed: T[] = []
  let used = Math.max(0, options.firstLineOffset ?? 0)

  while (remaining.length) {
    const spaceLeft = containerWidth - used
    const fitIndex = remaining.findIndex(({ width }) => {
      const need = (used === 0 ? 0 : gap) + width
      return need <= spaceLeft
    })

    if (fitIndex === -1) {
      if (used === 0) {
        const forced = remaining.shift()
        if (!forced) {
          break
        }
        packed.push(forced.item)
        used = forced.width
        continue
      }

      used = 0
      continue
    }

    const [picked] = remaining.splice(fitIndex, 1)
    used += (used === 0 ? 0 : gap) + picked.width
    packed.push(picked.item)
  }

  return packed
}
