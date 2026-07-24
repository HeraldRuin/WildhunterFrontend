<script setup lang="ts">
import type { HotelSearchBody, OfferItem, SearchFiltersState } from '~/types/api'
import { mapHotelOfferToItem } from '~/api/hotels'
import { parseDisplayDateToApiDate } from '~/utils/date'
import { DEFAULT_SEARCH_FILTERS } from '~/utils/search'

definePageMeta({
  layout: 'home',
})

useHead({
  title: 'Найденные базы — WH',
})

const route = useRoute()
const { search: searchApi, hotels: hotelsApi } = useApi()

const { data: priceBounds } = await useAsyncData(
  'hotel-price-range',
  () => hotelsApi.getPriceRangeBounds(),
  {
    default: () => ({ min: 0, max: 15000 }),
  },
)

const filters = ref<SearchFiltersState>({
  ...DEFAULT_SEARCH_FILTERS,
  priceMin: priceBounds.value.min,
  priceMax: priceBounds.value.max,
})
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

const searchRequest = computed(() => {
  const body: HotelSearchBody = {}

  if (route.query.location) {
    body.location_id = Number(route.query.location)
  }

  if (route.query.animal) {
    body.animal_id = Number(route.query.animal)
  }

  const checkIn = parseDisplayDateToApiDate(String(route.query.checkIn || ''))
  if (checkIn) {
    body.check_in = checkIn
  }

  const checkOut = parseDisplayDateToApiDate(String(route.query.checkOut || ''))
  if (checkOut) {
    body.check_out = checkOut
  }

  if (route.query.guests) {
    body.adults = Number(route.query.guests)
  }

  if (
    filters.value.priceMin > priceBounds.value.min
    || filters.value.priceMax < priceBounds.value.max
  ) {
    body.price_range = `${filters.value.priceMin};${filters.value.priceMax}`
  }

  if (filters.value.ratings.length) {
    body.review_score = filters.value.ratings
  }

  return {
    page: currentPage.value,
    body,
  }
})

const { data: searchResult, pending } = await useAsyncData(
  'hotel-search',
  async () => {
    try {
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
    watch: [searchRequest],
    default: emptySearchResult,
  },
)

const totalCount = computed(() => searchResult.value.total)
const totalPages = computed(() => searchResult.value.totalPages)
const offerItems = computed(() => searchResult.value.items)

function handleSearch(payload: Record<string, string>) {
  currentPage.value = 1
  navigateTo({
    path: '/bases',
    query: {
      ...payload,
    },
  })
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
    <SearchHero @search="handleSearch" />

    <section class="bases-page__results">
      <div class="container bases-page__results-inner">
        <div class="bases-page__toolbar">
          <button
            v-show="!mobileFiltersOpen"
            type="button"
            class="bases-page__toolbar-link bases-page__filters-btn"
            @click="mobileFiltersOpen = true"
          >
            Фильтры
          </button>

          <h1 class="bases-page__title">
            Найдено баз: {{ totalCount }}
          </h1>

          <NuxtLink to="/bases/map" class="bases-page__toolbar-link bases-page__map-link">
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
            <div v-if="pending" class="bases-page__state">
              Загрузка...
            </div>

            <div v-else-if="!offerItems.length" class="bases-page__state">
              По вашему запросу базы не найдены. Попробуйте изменить фильтры.
            </div>

            <div v-else class="bases-page__grid">
              <HomeOfferCard
                v-for="(item, index) in offerItems"
                :key="`${item.id}-${index}`"
                :item="item"
              />
            </div>

            <CommonPagination
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
  padding: 48px 24px;
  border: 1px dashed var(--wh-gray-200);
  border-radius: var(--wh-radius-lg);
  text-align: center;
  color: var(--wh-gray-500);
}

@media (max-width: 1024px) {
  .bases-page__layout {
    grid-template-columns: 1fr;
  }

  .bases-page__layout--filters-open .bases-page__main {
    display: none;
  }

  .bases-page__filters-btn {
    display: inline;
  }

  .bases-page__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
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
