import type { BookableItem, HotelAnimalItem, HotelDetail, HotelGalleryImage, HotelTermGroup, ReviewItem } from '~/types/api'
import { getGalleryImageKey, isValidGalleryImage, shouldShowOfferImage } from '~/utils/image'
import { MOCK_SEARCH_ITEMS, toOfferItem } from '~/utils/search'

export interface HotelSlugParams {
  locationSlug: string
  hotelSlug: string
}

export function getHotelPath(locationSlug: string, hotelSlug: string) {
  return `/hotel/${locationSlug}/${hotelSlug}`
}

const DEFAULT_GALLERY = [
  'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800',
  'https://images.unsplash.com/photo-1510798832321-aac75343ca5a?w=800',
  'https://images.unsplash.com/photo-1470770841072-f978cf4d0192?w=800',
]

const DEFAULT_TERMS: HotelTermGroup[] = [
  {
    id: 1,
    title: 'Услуги на базе',
    terms: [
      { id: 1, title: 'Wi-Fi' },
      { id: 2, title: 'Мини-бар' },
      { id: 3, title: 'Кухня' },
      { id: 4, title: 'Парковка' },
      { id: 5, title: 'Баня / сауна' },
      { id: 6, title: 'Бассейн' },
    ],
  },
  {
    id: 2,
    title: 'Питание на базе',
    terms: [
      { id: 7, title: 'Завтрак включён' },
      { id: 8, title: 'Обед по меню' },
    ],
  },
]

export const MOCK_HOTEL_REVIEWS: ReviewItem[] = [
  {
    id: 1,
    name: 'Алексей М.',
    role: 'Охотник',
    text: 'Отличная база для охоты на кабана. Уютные домики, внимательный персонал и хорошая организация выезда на тропы.',
    rating: 5,
    ratingText: 'Превосходно',
  },
  {
    id: 2,
    name: 'Игорь К.',
    role: 'Охотник',
    text: 'Брали базу на выходные — всё понравилось. Чисто, тепло, рядом лес и озеро. Вернёмся осенью.',
    rating: 5,
    ratingText: 'Превосходно',
  },
  {
    id: 3,
    name: 'Сергей П.',
    role: 'Охотник',
    text: 'Хороший сервис и адекватные цены. Единственное — хотелось бы чуть больше вариантов питания на месте.',
    rating: 4,
    ratingText: 'Очень хорошо',
  },
]

function parseTerms(raw: unknown): HotelTermGroup[] {
  if (!Array.isArray(raw) || !raw.length) {
    return DEFAULT_TERMS
  }

  return raw.map((group, index) => {
    const item = group as Record<string, unknown>
    const child = Array.isArray(item.child) ? item.child : item.terms

    return {
      id: Number(item.id ?? index + 1),
      title: String(item.title ?? item.name ?? 'Услуги'),
      terms: Array.isArray(child)
        ? child.map((term, termIndex) => {
            const termItem = term as Record<string, unknown>
            return {
              id: Number(termItem.id ?? termIndex + 1),
              title: String(termItem.title ?? termItem.name ?? ''),
              icon: termItem.icon ? String(termItem.icon) : undefined,
            }
          }).filter(term => term.title)
        : [],
    }
  }).filter(group => group.terms.length)
}

function parseAnimals(raw: unknown): HotelAnimalItem[] {
  if (!Array.isArray(raw)) {
    return []
  }

  return raw.map((item, index) => {
    const animal = item as Record<string, unknown>

    return {
      id: Number(animal.id ?? index + 1),
      title: String(animal.title ?? animal.name ?? ''),
      season: animal.season ? String(animal.season) : undefined,
      price: animal.price != null ? Number(animal.price) : undefined,
    }
  }).filter(animal => animal.title && Number.isFinite(animal.id))
}

function readUrl(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function toGalleryImage(item: unknown): HotelGalleryImage | null {
  if (typeof item === 'string' && item.trim()) {
    const url = item.trim()
    return { large: url, medium: url, thumb: url }
  }

  if (!item || typeof item !== 'object') {
    return null
  }

  const record = item as Record<string, unknown>
  const large = readUrl(record.large)
  const medium = readUrl(record.medium)
  const thumb = readUrl(record.thumb)
  const fallback = readUrl(record.url) || readUrl(record.image)

  const resolvedLarge = large || medium || fallback || thumb
  const resolvedMedium = medium || large || fallback || thumb
  const resolvedThumb = thumb || medium || large || fallback

  if (!resolvedLarge && !resolvedMedium && !resolvedThumb) {
    return null
  }

  const image = {
    large: resolvedLarge || resolvedMedium || resolvedThumb,
    medium: resolvedMedium || resolvedLarge || resolvedThumb,
    thumb: resolvedThumb || resolvedMedium || resolvedLarge,
  }

  return isValidGalleryImage(image) ? image : null
}

function dedupeGalleryImages(images: HotelGalleryImage[]): HotelGalleryImage[] {
  const seen = new Set<string>()
  const unique: HotelGalleryImage[] = []

  for (const image of images) {
    const key = getGalleryImageKey(image)
    if (!key || seen.has(key)) {
      continue
    }

    seen.add(key)
    unique.push(image)
  }

  return unique
}

function buildGallery(
  data: Record<string, unknown>,
  fallbackImage: string,
  options: { useDefaultFallback?: boolean } = {},
): HotelGalleryImage[] {
  const gallery = Array.isArray(data.gallery)
    ? dedupeGalleryImages(
        data.gallery.map(toGalleryImage).filter((item): item is HotelGalleryImage => Boolean(item)),
      )
    : []

  if (gallery.length) {
    return gallery
  }

  const single = data.banner_image ?? data.image_url ?? data.image
  if (typeof single === 'string' && shouldShowOfferImage(single)) {
    const url = single.trim()
    return [{ large: url, medium: url, thumb: url }]
  }

  if (shouldShowOfferImage(fallbackImage)) {
    const url = fallbackImage.trim()
    return [{ large: url, medium: url, thumb: url }]
  }

  if (options.useDefaultFallback) {
    return DEFAULT_GALLERY.map(url => ({ large: url, medium: url, thumb: url }))
  }

  return []
}

function findMockHotel(params: HotelSlugParams) {
  return MOCK_SEARCH_ITEMS.find(item =>
    item.slug === params.hotelSlug
    && item.location?.slug === params.locationSlug,
  ) ?? MOCK_SEARCH_ITEMS.find(item => item.slug === params.hotelSlug)
    ?? MOCK_SEARCH_ITEMS[0]
}

export function createMockHotelDetail(params: HotelSlugParams): HotelDetail {
  const base = findMockHotel(params)
  const related = MOCK_SEARCH_ITEMS.filter(item => item.id !== base.id).slice(0, 4)

  return {
    id: base.id,
    object_model: base.object_model,
    title: base.title,
    slug: base.slug ?? params.hotelSlug,
    price: base.price,
    sale_price: base.sale_price,
    image: base.image,
    content: `
      <p>Охотничья база «${base.title}» расположена в живописном месте ${base.location?.name ?? ''}. Здесь можно совместить комфортный отдых и организованную охоту с сопровождением опытных егерей.</p>
      <p>На территории есть домики для проживания, баня, места для разборки добычи и охраняемая парковка. База подходит как для индивидуальных выездов, так и для небольших групп.</p>
    `,
    address: `${base.location?.name ?? 'Ярославская область'}, лесной массив, 12 км от трассы`,
    location: {
      id: base.location?.id ?? 0,
      name: base.location?.name ?? '',
      slug: base.location?.slug ?? params.locationSlug,
    },
    gallery: [],
    map_lat: 57.6261,
    map_lng: 39.8845,
    review_score: {
      score_total: 4.9,
      score_text: 'Превосходно',
      total_review: 32,
    },
    terms: DEFAULT_TERMS,
    animals: [
      { id: 1, title: 'Кабан', season: 'Круглый год', price: 15000 },
      { id: 2, title: 'Лось', season: 'Сентябрь — декабрь', price: 45000 },
      { id: 3, title: 'Косуля', season: 'Май — декабрь', price: 28000 },
    ],
    related,
    check_in_time: '14:00',
    check_out_time: '12:00',
  }
}

export function normalizeHotelDetail(raw: unknown, params: HotelSlugParams): HotelDetail | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const data = raw as Record<string, unknown>
  const title = String(data.title ?? '')

  if (!title) {
    return null
  }

  const image = String(data.image ?? data.banner_image ?? data.image_url ?? '')
  const related = Array.isArray(data.related)
    ? data.related as BookableItem[]
    : MOCK_SEARCH_ITEMS.filter(item => item.slug !== params.hotelSlug).slice(0, 4)

  const reviewScore = data.review_score as Record<string, unknown> | undefined
  const location = data.location as HotelDetail['location'] | undefined
  const slug = String(data.slug ?? params.hotelSlug)
  const starRate = Number(data.star_rate ?? 0)
  const reviewCount = Number(
    reviewScore?.total_review
    ?? data.review_count
    ?? data.reviews
    ?? 0,
  )

  return {
    id: Number(data.id ?? 0),
    object_model: String(data.object_model ?? 'hotel'),
    title,
    slug,
    price: Number(data.price ?? 0),
    sale_price: data.sale_price ? Number(data.sale_price) : undefined,
    image,
    content: data.content ? String(data.content) : undefined,
    address: data.address ? String(data.address) : undefined,
    location: location
      ? {
          id: Number(location.id ?? 0),
          name: String(location.name ?? ''),
          slug: location.slug ? String(location.slug) : params.locationSlug,
        }
      : {
          id: 0,
          name: '',
          slug: params.locationSlug,
        },
    gallery: buildGallery(data, image),
    map_lat: data.map_lat ? Number(data.map_lat) : undefined,
    map_lng: data.map_lng ? Number(data.map_lng) : undefined,
    review_score: reviewScore
      ? {
          score_total: Number(reviewScore.score_total ?? starRate ?? 0),
          score_text: String(reviewScore.score_text ?? ''),
          total_review: Number.isFinite(reviewCount) ? reviewCount : 0,
        }
      : Number.isFinite(starRate) && starRate > 0
        ? {
            score_total: starRate,
            score_text: '',
            total_review: Number.isFinite(reviewCount) ? reviewCount : 0,
          }
        : undefined,
    terms: parseTerms(data.terms),
    animals: parseAnimals(data.animals),
    related,
    check_in_time: data.check_in_time ? String(data.check_in_time) : '14:00',
    check_out_time: data.check_out_time ? String(data.check_out_time) : '12:00',
  }
}

export function formatHotelPrice(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value)
}

/** Отображаемая строка цены с валютой — менять формат здесь. */
export function formatHotelPriceLabel(value: number) {
  return `${formatHotelPrice(value)} руб`
}

export function toRelatedOffers(items: BookableItem[]) {
  return items.map((item, index) => toOfferItem(item, index))
}
