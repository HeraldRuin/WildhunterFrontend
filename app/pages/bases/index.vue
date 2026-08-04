<script setup lang="ts">
import type { HotelSearchBody, OfferItem, SearchFiltersState } from '~/types/api'
import { mapHotelOfferToItem } from '~/api/hotels'
import { parseDisplayDateToApiDate } from '~/utils/date'
import { DEFAULT_SEARCH_FILTERS, matchesReviewRatingFilter } from '~/utils/search'

definePageMeta({
  layout: 'home',
})

useHead({
  title: 'Найденные базы — WH',
})

const route = useRoute()
const { search: searchApi, hotels: hotelsApi } = useApi()

const DEFAULT_PRICE_BOUNDS = { min: 0, max: 15000 }
const CATALOG_PER_PAGE = 12

function getCachedPageData<T>(key: string, nuxtApp: ReturnType<typeof useNuxtApp>) {
  return nuxtApp.payload.data[key] as T | undefined
    ?? nuxtApp.static.data[key] as T | undefined
}

// Без await/lazy: иначе URL меняется, а страница ждёт /hotels/price-range + /hotels/offers.
const { data: priceBounds } = useAsyncData(
  'hotel-price-range',
  () => hotelsApi.getPriceRangeBounds(),
  {
    lazy: true,
    default: () => ({ ...DEFAULT_PRICE_BOUNDS }),
    getCachedData: (key, nuxtApp) => getCachedPageData(key, nuxtApp),
  },
)

const filters = ref<SearchFiltersState>({
  ...DEFAULT_SEARCH_FILTERS,
  priceMin: DEFAULT_PRICE_BOUNDS.min,
  priceMax: DEFAULT_PRICE_BOUNDS.max,
})

watch(
  priceBounds,
  (bounds) => {
    if (!bounds) {
      return
    }

    const isDefaultRange = (
      filters.value.priceMin === DEFAULT_PRICE_BOUNDS.min
      && filters.value.priceMax === DEFAULT_PRICE_BOUNDS.max
    )

    if (isDefaultRange) {
      filters.value.priceMin = bounds.min
      filters.value.priceMax = bounds.max
    }
  },
  { immediate: true },
)

const mobileFiltersOpen = ref(false)
const currentPage = ref(Number(route.query.page) || 1)

interface NormalizedSearchResult {
  items: OfferItem[]
  total: number
  totalPages: number
}

const emptySearchResult = (): NormalizedSearchResult => ({
  items: [],
  total: 0,
  totalPages: 1,
})

function toCatalogResult(items: OfferItem[]): NormalizedSearchResult {
  return {
    items,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / CATALOG_PER_PAGE)),
  }
}

function queryString(key: string): string {
  const value = route.query[key]
  return Array.isArray(value) ? String(value[0] || '') : String(value || '')
}

/** Without dates → full catalog via /hotels/offers; with dates → availability search. */
const isCatalogMode = computed(() => !queryString('checkIn') && !queryString('checkOut'))

const hasActivePriceFilter = computed(() => (
  filters.value.priceMin > priceBounds.value.min
  || filters.value.priceMax < priceBounds.value.max
))

const searchRequest = computed(() => {
  const catalog = isCatalogMode.value
  const body: HotelSearchBody = {}

  if (!catalog) {
    if (route.query.location) {
      body.location_id = Number(route.query.location)
    }

    if (route.query.animal) {
      body.animal_id = Number(route.query.animal)
    }

    const checkIn = parseDisplayDateToApiDate(queryString('checkIn'))
    if (checkIn) {
      body.check_in = checkIn
    }

    const checkOut = parseDisplayDateToApiDate(queryString('checkOut'))
    if (checkOut) {
      body.check_out = checkOut
    }

    if (route.query.guests) {
      body.adults = Number(route.query.guests)
    }

    if (hasActivePriceFilter.value) {
      body.price_range = `${filters.value.priceMin};${filters.value.priceMax}`
    }

    if (filters.value.ratings.length) {
      body.star_rate = filters.value.ratings
    }
  }

  return {
    // Catalog is loaded once; pagination is client-side.
    page: catalog ? 1 : currentPage.value,
    catalog,
    body,
  }
})

const { data: searchResult, refresh, pending: searchPending } = useAsyncData(
  'hotel-search',
  async () => {
    try {
      if (searchRequest.value.catalog) {
        return toCatalogResult(await hotelsApi.getHotelOfferItems())
      }

      const response = await searchApi.searchHotels(
        searchRequest.value.page,
        searchRequest.value.body,
      )

      if (!response.success) {
        return emptySearchResult()
      }

      return {
        items: response.data.items.map(mapHotelOfferToItem),
        total: response.data.pagination.total,
        totalPages: Math.max(1, response.data.pagination.last_page),
      }
    }
    catch {
      return emptySearchResult()
    }
  },
  {
    lazy: true,
    // Запросом управляет watch(searchRequest) — иначе кэш/lazy и смена query расходятся.
    immediate: false,
    watch: false,
    default: emptySearchResult,
    getCachedData: (key, nuxtApp) => {
      // Ключ один (`hotel-search`) без query — кэш можно брать только для каталога.
      // Иначе после /bases без дат сюда попадали все отели, а поиск с location/dates не шёл.
      if (queryString('checkIn') || queryString('checkOut')) {
        return undefined
      }

      const cached = getCachedPageData<NormalizedSearchResult>(key, nuxtApp)
      if (cached) {
        return cached
      }

      // С главной уже есть тот же каталог — показываем сразу, без повторного ожидания API.
      const homeOffers = getCachedPageData<OfferItem[]>('home-hotel-offers', nuxtApp)
      if (homeOffers?.length) {
        return toCatalogResult(homeOffers)
      }
    },
  },
)

const isSearchLoading = ref(false)
/** Spinner on «Искать» — separate from results-area loading. */
const isButtonSearching = ref(false)
const hasSearchItems = computed(() => (searchResult.value?.items.length ?? 0) > 0)
/** Full-page spinner only when there is nothing to show yet. */
const isResultsLoading = computed(() => {
  if (hasSearchItems.value) {
    return false
  }

  return isSearchLoading.value || searchPending.value
})
let searchLoadId = 0

watch(
  filters,
  () => {
    currentPage.value = 1
  },
  { deep: true },
)

watch(searchRequest, async (req, prev) => {
  // Каталог уже есть (с главной / из payload) и запрос не изменился — не дёргаем API снова.
  if (
    req.catalog
    && hasSearchItems.value
    && (
      !prev
      || (
        prev.catalog
        && prev.page === req.page
        && JSON.stringify(prev.body) === JSON.stringify(req.body)
      )
    )
  ) {
    isButtonSearching.value = false
    return
  }

  const loadId = ++searchLoadId
  // Keep existing cards mounted while refreshing — swapping to the loading flex
  // box reuses the same DOM node and can leave cards inside it (broken layout).
  if (!hasSearchItems.value) {
    isSearchLoading.value = true
  }

  try {
    await refresh()
  } finally {
    if (loadId === searchLoadId) {
      isSearchLoading.value = false
      isButtonSearching.value = false
    }
  }
}, { immediate: true })

// Обратный переход на главную — без ожидания скачивания чанка.
onMounted(() => {
  void preloadRouteComponents('/')
})

const filteredCatalogItems = computed(() => {
  if (!isCatalogMode.value) {
    return searchResult.value.items
  }

  return searchResult.value.items.filter((item) => {
    if (item.price < filters.value.priceMin || item.price > filters.value.priceMax) {
      return false
    }

    if (
      filters.value.ratings.length
      && !matchesReviewRatingFilter(item.rating, filters.value.ratings)
    ) {
      return false
    }

    return true
  })
})

const totalPages = computed(() => {
  if (isCatalogMode.value) {
    return Math.max(1, Math.ceil(filteredCatalogItems.value.length / CATALOG_PER_PAGE))
  }

  return searchResult.value.totalPages
})

const offerItems = computed(() => {
  if (isCatalogMode.value) {
    const page = Math.min(currentPage.value, totalPages.value)
    const start = (page - 1) * CATALOG_PER_PAGE
    return filteredCatalogItems.value.slice(start, start + CATALOG_PER_PAGE)
  }

  return searchResult.value.items
})

const totalCount = computed(() => {
  if (isCatalogMode.value) {
    return filteredCatalogItems.value.length
  }

  return searchResult.value.total
})

const hasResults = computed(() => totalCount.value > 0)

watch(totalPages, (pages) => {
  if (currentPage.value > pages) {
    currentPage.value = pages
  }
})

async function handleSearch(payload: Record<string, string>) {
  if (isButtonSearching.value) {
    return
  }

  currentPage.value = 1
  isButtonSearching.value = true

  try {
    await navigateTo({
      path: '/bases',
      query: {
        ...payload,
      },
    })
  }
  catch {
    isButtonSearching.value = false
  }
}

function handlePageChange(page: number) {
  currentPage.value = page
  navigateTo({
    path: '/bases',
    query: {
      ...route.query,
      page: page > 1 ? String(page) : undefined,
    },
  })
}

function handleFiltersReset() {
  currentPage.value = 1
}
</script>

<template>
  <div class="bases-page">
    <SearchHero :loading="isButtonSearching" @search="handleSearch" />

    <section class="bases-page__results">
      <div class="container bases-page__results-inner">
        <div
          class="bases-page__toolbar"
          :class="{ 'bases-page__toolbar--empty': !hasResults }"
        >
          <button
            v-show="!mobileFiltersOpen"
            type="button"
            class="bases-page__toolbar-link bases-page__filters-btn"
            @click="mobileFiltersOpen = true"
          >
            Фильтры
          </button>

          <h1 v-if="hasResults" class="bases-page__title">
            Найдено баз: {{ totalCount }}
          </h1>

          <NuxtLink
            v-if="hasResults"
            :to="{ path: '/bases/map', query: route.query }"
            class="bases-page__toolbar-link bases-page__map-link"
          >
            Показать на карте
          </NuxtLink>
        </div>

        <div
          class="bases-page__layout"
          :class="{ 'bases-page__layout--filters-open': mobileFiltersOpen }"
        >
          <SearchFilters
            v-model="filters"
            v-model:mobile-open="mobileFiltersOpen"
            :price-bound-min="priceBounds.min"
            :price-bound-max="priceBounds.max"
            @reset="handleFiltersReset"
          />

          <div class="bases-page__main">
            <!--
              Use v-show (not v-if) so loading/empty/grid are separate DOM nodes.
              v-if reuse of the same <div> was leaving offer cards inside the
              loading flex container → crushed overlapping layout.
            -->
            <div
              v-show="isResultsLoading"
              class="bases-page__state bases-page__state--loading"
            >
              <CommonSpinner
                variant="ring"
                size="lg"
              />
            </div>

            <div
              v-show="!isResultsLoading && !offerItems.length"
              class="bases-page__state bases-page__state--empty"
            >
              По вашему запросу базы не найдены. Попробуйте изменить фильтры.
            </div>

            <div
              v-show="!isResultsLoading && offerItems.length > 0"
              class="bases-page__grid"
            >
              <HomeOfferCard
                v-for="(item, index) in offerItems"
                :key="`${item.id}-${index}`"
                :item="item"
              />
            </div>

            <CommonPagination
              v-show="!isResultsLoading && offerItems.length > 0"
              :current-page="currentPage"
              :total-pages="totalPages"
              @change="handlePageChange"
            />
          </div>
        </div>
      </div>
    </section>

    <HomeBlocksCommunityBlock variant="centered" />
    <LayoutAppFooter />
  </div>
</template>

<style scoped>
.bases-page {
  background: var(--wh-white);
}

.bases-page__results {
  padding: 80px 0 104px;
}

.bases-page__results-inner {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.bases-page__toolbar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  min-height: 1.75em;
}

.bases-page__title {
  grid-column: 2;
  margin: 0;
  font-family: "UNCAGE", sans-serif;
  font-size: 32px;
  font-weight: 400;
  line-height: 130%;
  letter-spacing: -0.03em;
  text-align: center;
  color: var(--wh-gray-900);
  white-space: nowrap;
}

.bases-page__toolbar-link {
  padding: 0;
  border: none;
  background: transparent;
  font-family: "Inter", sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 100%;
  letter-spacing: -0.05em;
  color: #d64545;
  text-decoration: underline;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.bases-page__toolbar-link:hover {
  opacity: 0.8;
}

.bases-page__filters-btn {
  display: none;
  justify-self: start;
}

.bases-page__map-link {
  justify-self: end;
}

.bases-page__layout {
  display: grid;
  grid-template-columns: minmax(260px, 300px) minmax(0, 1fr);
  gap: 32px;
  align-items: start;
}

.bases-page__main {
  display: flex;
  flex-direction: column;
  gap: 40px;
  min-width: 0;
}

.bases-page__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px 20px;
}

.bases-page__state {
  padding: 24px 0;
  text-align: center;
  font-family: "Inter", sans-serif;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.5;
  color: var(--wh-gray-500);
}

.bases-page__state--loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}

.bases-page__state--empty {
  color: var(--wh-gray-900);
}

.bases-page__toolbar--empty {
  display: none;
}

@media (--wh-tablet) {
  .bases-page__toolbar--empty {
    display: flex;
  }

  .bases-page__layout {
    grid-template-columns: 1fr;
  }

  .bases-page__filters-btn {
    display: inline;
  }

  .bases-page__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (--wh-mobile) {
  .bases-page__layout--filters-open .bases-page__main {
    display: none;
  }

  .bases-page__results {
    padding-top: 48px;
  }

  .bases-page__results-inner {
    gap: 12px;
  }

  .bases-page__grid {
    grid-template-columns: 1fr;
  }

  .bases-page__toolbar {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
    min-height: 0;
  }

  .bases-page__title {
    order: 1;
    grid-column: auto;
    font-size: 24px;
    text-transform: uppercase;
  }

  .bases-page__filters-btn {
    order: 2;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 56px;
    padding: 16px 24px;
    border: none;
    border-radius: 999px;
    background: var(--wh-orange-500);
    color: var(--wh-white);
    font-family: "Inter", sans-serif;
    font-size: 18px;
    font-weight: 500;
    line-height: 100%;
    letter-spacing: -0.05em;
    text-decoration: none;
  }

  .bases-page__filters-btn:hover {
    background: var(--wh-orange-600);
    opacity: 1;
  }

  .bases-page__map-link {
    display: none;
  }
}
</style>
