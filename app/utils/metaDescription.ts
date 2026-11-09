const DESCRIPTION_SUFFIX = 'Каталог охотничьих баз и бронирование на wild-hunter.ru'

/** Description для страниц, где свой текст не задан. Ручные description не проходят через эту функцию. */
export function descriptionFromHeading(heading: string) {
  const clean = heading
    .replace(/\s*\|\s*wild-hunter\.ru\s*$/i, '')
    .replace(/\s*[—–-]\s*WH\s*$/i, '')
    .trim()

  if (!clean) {
    return DESCRIPTION_SUFFIX
  }

  return `${clean}. ${DESCRIPTION_SUFFIX}`
}
