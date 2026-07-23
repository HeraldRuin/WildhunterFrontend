const PLACEHOLDER_IMAGE_PATTERN = /(?:^|\/)no[_-]?image(?:\.[a-z0-9]+)?(?:[?#]|$)/i

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
