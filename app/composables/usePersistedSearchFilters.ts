import type { SearchFiltersState } from '~/types/api'
import { DEFAULT_SEARCH_FILTERS } from '~/utils/search'

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
    }
  }
  catch {
    return fallback
  }
}

/**
 * Фильтры поиска, которые сохраняются при переходах по сайту
 * и живут до явного сброса.
 */
export function usePersistedSearchFilters(
  storageKey: string,
  createDefaults: () => SearchFiltersState = () => ({
    ...DEFAULT_SEARCH_FILTERS,
  }),
) {
  const filters = useState<SearchFiltersState>(storageKey, createDefaults)

  if (import.meta.client) {
    // Синхронно до watch(priceBounds), чтобы не затереть сохранённые значения.
    if (sessionStorage.getItem(storageKey)) {
      filters.value = readStoredFilters(storageKey, createDefaults())
    }

    watch(
      filters,
      (value) => {
        sessionStorage.setItem(storageKey, JSON.stringify(value))
      },
      { deep: true },
    )
  }

  function clearPersistedFilters(next?: SearchFiltersState) {
    filters.value = next ?? createDefaults()

    if (import.meta.client) {
      sessionStorage.removeItem(storageKey)
    }
  }

  return {
    filters,
    clearPersistedFilters,
  }
}
