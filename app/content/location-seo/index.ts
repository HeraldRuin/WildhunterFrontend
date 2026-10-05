import { moscowLocationSeo } from './moskovskaia-oblast'
import type { LocationSeoContent } from './types'
import { vologdaLocationSeo } from './vologodskaia-oblast'

export const locationSeoBySlug: Record<string, LocationSeoContent> = {
  'moskovskaia-oblast': moscowLocationSeo,
  'vologodskaia-oblast': vologdaLocationSeo,
}
