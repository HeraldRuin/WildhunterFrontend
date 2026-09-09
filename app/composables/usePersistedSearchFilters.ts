import type { SearchFiltersState } from '~/types/api'
import { DEFAULT_SEARCH_FILTERS } from '~/utils/search'

const BASES_FILTERS_KEY = 'bases-search-filters'
const LOCATION_FILTERS_PREFIX = 'location-search-filters-'
const registeredFilterKeys = new Set<string>()
let suppressPersist = false

function isSearchFiltersState(value: unknown): value is SearchFiltersState {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.sort === 'string'
    && typeof candidate.priceMin === 'number'
    && typeof candidate.priceMax === 'number'
    && Array.isArray(candidate.ratings)
    && Array.isArray(candidate.amenities)
    && (candidate.regions === undefined || Array.isArray(candidate.regions))
    && (candidate.animals === undefined || Array.isArray(candidate.animals))
    && (candidate.huntingMethods === undefined || Array.isArray(candidate.huntingMethods))
    && (
      candidate.hasMeals === ''
      || candidate.hasMeals === 'yes'
      || candidate.hasMeals === 'no'
    )
  )
}

function readStoredFilters(
  storageKey: string,
  fallback: SearchFiltersState,
): SearchFiltersState {
  if (!import.meta.client) {
    return fallback
  }

  try {
    const raw = sessionStorage.getItem(storageKey)
    if (!raw) {
      return fallback
    }

    const parsed: unknown = JSON.parse(raw)
    if (!isSearchFiltersState(parsed)) {
      return fallback
    }

    return {
      ...fallback,
      ...parsed,
      ratings: [...parsed.ratings],
      amenities: [...parsed.amenities],
      regions: Array.isArray(parsed.regions) ? [...parsed.regions] : [],
      animals: Array.isArray(parsed.animals) ? [...parsed.animals] : [],
      huntingMethods: Array.isArray(parsed.huntingMethods) ? [...parsed.huntingMethods] : [],
    }
  }
  catch {
    return fallback
  }
}

/** Каталог баз / область / карточка базы — фильтры не сбрасываем. */
export function shouldPreserveSearchFilters(path: string): boolean {
  if (path.startsWith('/hotel/')) {
    return true
  }

  if (
    path === '/bases'
    || path === '/bases/'
    || path.startsWith('/bases/map')
  ) {
    return true
  }

  // /locations/:slug/:id и /locations/:slug/:id/map
  return /^\/locations\/[^/]+\/[^/]+(\/map)?\/?$/.test(path)
}

function collectStorageKeysToClear(): string[] {
  const keys = new Set<string>(registeredFilterKeys)

  if (!import.meta.client) {
    return [...keys]
  }

  keys.add(BASES_FILTERS_KEY)

  for (let index = 0; index < sessionStorage.length; index += 1) {
    const key = sessionStorage.key(index)
    if (key === BASES_FILTERS_KEY || key?.startsWith(LOCATION_FILTERS_PREFIX)) {
      keys.add(key)
    }
  }

  return [...keys]
}

/** Сброс сохранённых фильтров при уходе на «чужую» страницу. */
export function clearAllPersistedSearchFilters() {
  const keys = collectStorageKeysToClear()

  suppressPersist = true
  try {
    for (const key of keys) {
      if (import.meta.client) {
        sessionStorage.removeItem(key)
      }
      clearNuxtState(key)
    }
  }
  finally {
    suppressPersist = false
  }
}

/**
 * Фильтры поиска: сохраняются при переходе на карточку базы и обратно,
 * сбрасываются при уходе на любую другую страницу или явном reset.
 */
export function usePersistedSearchFilters(
  storageKey: string,
  createDefaults: () => SearchFiltersState = () => ({
    ...DEFAULT_SEARCH_FILTERS,
  }),
) {
  registeredFilterKeys.add(storageKey)

  const filters = useState<SearchFiltersState>(storageKey, createDefaults)

  if (import.meta.client) {
    // Синхронно до watch(priceBounds), чтобы не затереть сохранённые значения.
    if (sessionStorage.getItem(storageKey)) {
      filters.value = readStoredFilters(storageKey, createDefaults())
    }

    watch(
      filters,
      (value) => {
        if (suppressPersist) {
          return
        }
        sessionStorage.setItem(storageKey, JSON.stringify(value))
      },
      { deep: true },
    )
  }

  function clearPersistedFilters(next?: SearchFiltersState) {
    suppressPersist = true
    try {
      filters.value = next ?? createDefaults()
      if (import.meta.client) {
        sessionStorage.removeItem(storageKey)
      }
    }
    finally {
      suppressPersist = false
    }
  }

  return {
    filters,
    clearPersistedFilters,
  }
}
