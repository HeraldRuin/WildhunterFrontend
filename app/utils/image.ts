const PLACEHOLDER_IMAGE_PATTERN = /(?:^|\/)no[_-]?image(?:\.[a-z0-9]+)?(?:[?#]|$)/i
const MEDIA_SIZE_PATTERN = /\/(thumb|medium|large|max_large)(?=\?|$)/

export type MediaImageSize = 'thumb' | 'medium' | 'large' | 'max_large'

export function toMediaImageSize(url: string | null | undefined, size: MediaImageSize): string {
  const value = url?.trim()

  if (!value) {
    return ''
  }

  if (!MEDIA_SIZE_PATTERN.test(value)) {
    return value
  }

  return value.replace(MEDIA_SIZE_PATTERN, `/${size}`)
}

export const USE_CUSTOM_OFFER_PLACEHOLDER = true

export function isMissingOfferImage(image?: string | null) {
  const value = image?.trim()

  if (!value) {
    return true
  }

  return PLACEHOLDER_IMAGE_PATTERN.test(value)
}

export function shouldUseCustomOfferPlaceholder(image?: string | null) {
  return USE_CUSTOM_OFFER_PLACEHOLDER && isMissingOfferImage(image)
}

export function shouldShowOfferImage(image?: string | null) {
  const value = image?.trim()

  if (!value) {
    return false
  }

  return !shouldUseCustomOfferPlaceholder(value)
}

export function isValidGalleryImage(image: { large?: string, medium?: string, thumb?: string }) {
  return [image.large, image.medium, image.thumb].some(url => shouldShowOfferImage(url))
}

export function getGalleryImageKey(image: { large?: string, medium?: string, thumb?: string }) {
  const url = (image.large || image.medium || image.thumb || '').trim()

  if (!url) {
    return ''
  }

  return toMediaImageSize(url, 'large') || url
}

export function extractMediaIdFromUrl(url: string | null | undefined): number | null {
  const value = url?.trim()

  if (!value) {
    return null
  }

  const match = value.match(/\/media\/(\d+)(?:\/|$|\?)/)

  if (!match?.[1]) {
    return null
  }

  const id = Number(match[1])
  return Number.isFinite(id) && id > 0 ? id : null
}
