const PLACEHOLDER_IMAGE_PATTERN = /(?:^|\/)no[_-]?image(?:\.[a-z0-9]+)?(?:[?#]|$)/i
const MEDIA_SIZE_PATTERN = /\/(thumb|medium|large|max_large)(?=\?|$)/

export type MediaImageSize = 'thumb' | 'medium' | 'large' | 'max_large'

/** Rewrite /media/{id}/{size} URLs to a preferred size variant. */
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

/** Переключатель: true — наша CSS-заглушка, false — картинка no_image из API */
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

/** Canonical key so /media/{id}/thumb|medium|large count as one photo. */
export function getGalleryImageKey(image: { large?: string, medium?: string, thumb?: string }) {
  const url = (image.large || image.medium || image.thumb || '').trim()

  if (!url) {
    return ''
  }

  return toMediaImageSize(url, 'large') || url
}
