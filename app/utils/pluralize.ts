type RuPluralForms = [one: string, few: string, many: string]

export function pluralizeRu(count: number, forms: RuPluralForms) {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod100 >= 11 && mod100 <= 19) {
    return `${count} ${forms[2]}`
  }

  if (mod10 === 1) {
    return `${count} ${forms[0]}`
  }

  if (mod10 >= 2 && mod10 <= 4) {
    return `${count} ${forms[1]}`
  }

  return `${count} ${forms[2]}`
}

export function formatReviewsCount(count: number) {
  return pluralizeRu(count, ['отзыв', 'отзыва', 'отзывов'])
}

export function formatBasesCount(count: number) {
  return pluralizeRu(count, ['база', 'базы', 'баз'])
}
