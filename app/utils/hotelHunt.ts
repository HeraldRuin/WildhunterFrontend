export function countHuntsForHunters(
  hunters: number,
  minHunters: number,
  maxHunters: number,
): number {
  if (hunters <= 0 || maxHunters < 1) {
    return 0
  }

  if (hunters <= maxHunters) {
    return 1
  }

  const min = Math.max(1, minHunters)
  let remaining = hunters
  let huntCount = 0

  while (remaining > 0) {
    if (remaining >= min) {
      remaining -= Math.min(remaining, maxHunters)
      huntCount++
      continue
    }

    return Math.max(1, huntCount)
  }

  return Math.max(1, huntCount)
}

export function resolveHuntingPerPerson(
  hunters: number,
  organizationFee: number,
  fromSource: number | null | undefined,
): number | null {
  if (fromSource != null && Number.isFinite(fromSource) && fromSource > 0) {
    return Math.round(fromSource)
  }

  if (hunters > 0 && organizationFee > 0) {
    return Math.round(organizationFee / hunters)
  }

  return null
}
