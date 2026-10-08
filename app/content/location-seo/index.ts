import { yaroslavlLocationSeo } from './iaroslavskaia-oblast'
import { moscowLocationSeo } from './moskovskaia-oblast'
import { tverLocationSeo } from './tverskaia-oblast'
import type { LocationSeoContent } from './types'
import { vladimirLocationSeo } from './vladimirskaia-oblast'
import { vologdaLocationSeo } from './vologodskaia-oblast'

export const locationSeoBySlug: Record<string, LocationSeoContent> = {
  'iaroslavskaia-oblast': yaroslavlLocationSeo,
  'moskovskaia-oblast': moscowLocationSeo,
  'tverskaia-oblast': tverLocationSeo,
  'vladimirskaia-oblast': vladimirLocationSeo,
  'vologodskaia-oblast': vologdaLocationSeo,
}
