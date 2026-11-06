import { loadYandexMaps21, type YmapsCoords } from '~/utils/yandexMaps21'

export interface RegionGeoObject {
  getAdministrativeAreas?: () => string[]
  getLocalities?: () => string[]
  properties?: {
    get: (key: string) => unknown
  }
}

const FEDERAL_DISTRICT_RE = /федеральн/i
const SUBJECT_RE = /(область|край|республика|автономн)/i

function normalizeLocationName(value: string) {
  return value.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim()
}

function locationStem(value: string) {
  return normalizeLocationName(value)
    .replace(/^(республика|город)\s+/, '')
    .replace(/\s+(область|край|республика|автономный округ|автономная область)$/, '')
    .trim()
}

function pushUnique(list: string[], name: unknown) {
  if (typeof name !== 'string') {
    return
  }

  const value = name.trim()

  if (!value || FEDERAL_DISTRICT_RE.test(value)) {
    return
  }

  const key = normalizeLocationName(value)

  if (list.some(item => normalizeLocationName(item) === key)) {
    return
  }

  list.push(value)
}

function asRecord(value: unknown) {
  if (!value || typeof value !== 'object') {
    return null
  }

  return value as Record<string, unknown>
}

function readComponents(geoObject: RegionGeoObject) {
  const properties = geoObject.properties

  if (!properties) {
    return [] as { kind: string, name: string }[]
  }

  const direct = properties.get('metaDataProperty.GeocoderMetaData.Address.Components')
  const address = asRecord(properties.get('metaDataProperty.GeocoderMetaData.Address'))
  const source = Array.isArray(direct) ? direct : address?.Components

  if (!Array.isArray(source)) {
    return []
  }

  return source.flatMap((item) => {
    const record = asRecord(item)

    if (!record || typeof record.kind !== 'string' || typeof record.name !== 'string') {
      return []
    }

    return [{ kind: record.kind, name: record.name }]
  })
}

function readAddressDetailNames(geoObject: RegionGeoObject) {
  const details = asRecord(
    geoObject.properties?.get('metaDataProperty.GeocoderMetaData.AddressDetails'),
  )
  const names: string[] = []
  let area = asRecord(asRecord(details?.Country)?.AdministrativeArea)

  while (area) {
    names.push(String(area.AdministrativeAreaName ?? ''))

    const subArea = asRecord(area.SubAdministrativeArea)

    if (subArea) {
      names.push(String(subArea.SubAdministrativeAreaName ?? ''))
      names.push(String(asRecord(subArea.Locality)?.LocalityName ?? ''))
    }

    names.push(String(asRecord(area.Locality)?.LocalityName ?? ''))
    area = asRecord(area.AdministrativeArea)
  }

  return names.filter(Boolean)
}

function safeNames(read: (() => string[]) | undefined) {
  if (!read) {
    return []
  }

  try {
    return read() ?? []
  }
  catch {
    return []
  }
}

export function collectRegionCandidates(geoObject: RegionGeoObject) {
  const components = readComponents(geoObject)
  const detailNames = readAddressDetailNames(geoObject)
  const areas = safeNames(geoObject.getAdministrativeAreas?.bind(geoObject))
  const localities = safeNames(geoObject.getLocalities?.bind(geoObject))
  const ordered: string[] = []

  for (const item of components) {
    if (item.kind === 'province' && SUBJECT_RE.test(item.name)) {
      pushUnique(ordered, item.name)
    }
  }

  for (const name of [...detailNames, ...areas]) {
    if (SUBJECT_RE.test(name)) {
      pushUnique(ordered, name)
    }
  }

  for (const item of components) {
    if (item.kind === 'province') {
      pushUnique(ordered, item.name)
    }
  }

  for (const name of localities) {
    pushUnique(ordered, name)
  }

  for (const item of components) {
    if (item.kind === 'locality') {
      pushUnique(ordered, item.name)
    }
  }

  for (const name of detailNames) {
    pushUnique(ordered, name)
  }

  for (const name of areas) {
    pushUnique(ordered, name)
  }

  for (const item of components) {
    if (item.kind === 'area') {
      pushUnique(ordered, item.name)
    }
  }

  return ordered
}

function cityRoots(value: string) {
  const name = normalizeLocationName(value)
    .replace(/^городской округ\s+/, '')
    .replace(/^город\s+/, '')

  if (!name || FEDERAL_DISTRICT_RE.test(name) || SUBJECT_RE.test(name)) {
    return []
  }

  const roots = new Set<string>([name])

  if (/[аеёиоуыэюя]$/.test(name) && name.length >= 4) {
    roots.add(name.slice(0, -1))

    if (name.length > 5) {
      roots.add(name.slice(0, -2))
    }
  }

  if (/[ьй]$/.test(name) && name.length > 4) {
    roots.add(name.slice(0, -1))
  }

  if (name.endsWith('ль') && name.length > 4) {
    roots.add(name.slice(0, -2))
  }

  if (name.endsWith('ск') && name.length > 4) {
    roots.add(name.slice(0, -2))
  }

  return [...roots].filter(root => root.length >= 3)
}

function pickByCityRoot<T extends { name: string }>(candidates: string[], locations: T[]) {
  let bestItem: T | null = null
  let bestDiff = Number.POSITIVE_INFINITY
  let tie = false

  for (const candidate of candidates) {
    for (const root of cityRoots(candidate)) {
      for (const item of locations) {
        if (!SUBJECT_RE.test(item.name)) {
          continue
        }

        const stem = locationStem(item.name)

        if (!stem.startsWith(root)) {
          continue
        }

        const diff = stem.length - root.length

        if (diff > 6) {
          continue
        }

        if (diff < bestDiff) {
          bestDiff = diff
          bestItem = item
          tie = false
        }
        else if (bestItem && bestItem.name !== item.name) {
          tie = true
        }
      }
    }
  }

  if (!bestItem || tie) {
    return null
  }

  return bestItem
}

export function pickLocationByRegionCandidates<T extends { name: string }>(
  candidates: string[],
  locations: T[],
) {
  const usable = candidates
    .map(item => item.trim())
    .filter(item => item && !FEDERAL_DISTRICT_RE.test(item))

  for (const candidate of usable) {
    const exact = locations.find(item => normalizeLocationName(item.name) === normalizeLocationName(candidate))

    if (exact) {
      return exact
    }
  }

  for (const candidate of usable) {
    const stem = locationStem(candidate)

    if (stem.length < 4) {
      continue
    }

    const match = locations.find(item => locationStem(item.name) === stem)

    if (match) {
      return match
    }
  }

  return pickByCityRoot(usable, locations)
}

/** Приблизительные центры областей. Нужны, только если название из адреса не совпало со списком. */
const REGION_CENTERS: Record<string, [number, number]> = {
  'алтайский край': [53.348, 83.78],
  'астраханская область': [46.35, 48.041],
  'белгородская область': [50.61, 36.58],
  'брянская область': [53.243, 34.364],
  'владимирская область': [56.137, 40.397],
  'вологодская область': [59.221, 39.884],
  'воронежская область': [51.66, 39.2],
  'ивановская область': [56.997, 40.971],
  'калининградская область': [54.71, 20.51],
  'калужская область': [54.507, 35.92],
  'камчатский край': [55.5, 159.5],
  'костромская область': [58.55, 43.95],
  'курская область': [51.73, 36.193],
  'ленинградская область': [60.0, 32.0],
  'липецкая область': [52.603, 39.599],
  'московская область': [55.5, 37.6],
  'республика алтай': [50.711, 86.857],
  'республика карелия': [63.5, 33.0],
  'рязанская область': [54.387, 40.894],
  'смоленская область': [54.782, 32.045],
  'тамбовская область': [52.721, 41.452],
  'тверская область': [57.021, 34.969],
  'тульская область': [54.0, 37.6],
  'ярославская область': [57.85, 39.0],
}

const MAX_REGION_DISTANCE_KM = 300

function locationCenter(item: { name: string, map_lat?: unknown, map_lng?: unknown }) {
  const lat = Number(item.map_lat)
  const lng = Number(item.map_lng)

  if (Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)) {
    return [lat, lng] as [number, number]
  }

  return REGION_CENTERS[normalizeLocationName(item.name)] ?? null
}

function distanceKm(lat: number, lng: number, centerLat: number, centerLng: number) {
  const toRad = Math.PI / 180
  const dLat = (centerLat - lat) * toRad
  const dLng = (centerLng - lng) * toRad
  const lat1 = lat * toRad
  const lat2 = centerLat * toRad
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function pickNearestLocation<T extends { name: string, map_lat?: unknown, map_lng?: unknown }>(
  lat: number,
  lng: number,
  locations: T[],
) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  let nearest: T | null = null
  let nearestDistance = MAX_REGION_DISTANCE_KM

  for (const item of locations) {
    const center = locationCenter(item)

    if (!center) {
      continue
    }

    const distance = distanceKm(lat, lng, center[0], center[1])

    if (distance < nearestDistance) {
      nearest = item
      nearestDistance = distance
    }
  }

  return nearest
}

export interface GeocodedRegion {
  candidates: string[]
  lat: number
  lng: number
}

export async function geocodeRegionCandidates(
  apikey: string,
  request: string | YmapsCoords,
): Promise<GeocodedRegion | null> {
  const value = typeof request === 'string' ? request.trim() : request

  if (!apikey || (typeof value === 'string' && !value)) {
    return null
  }

  const ymaps = await loadYandexMaps21(apikey)
  const result = await ymaps.geocode(value, { results: 1 })
  const geoObject = result.geoObjects.get(0)

  if (!geoObject) {
    return null
  }

  const [lat, lng] = geoObject.geometry.getCoordinates()

  return {
    candidates: collectRegionCandidates(geoObject),
    lat,
    lng,
  }
}
