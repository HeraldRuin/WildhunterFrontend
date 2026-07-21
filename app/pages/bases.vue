<script setup lang="ts">
import type { BookableItem, SearchApiResponse, SearchFiltersState } from '~/types/api'
import {
  DEFAULT_SEARCH_FILTERS,
  MOCK_SEARCH_ITEMS,
  toOfferItem,
} from '~/utils/search'

definePageMeta({
  layout: 'home',
})

useHead({
  title: 'Найденные базы — WH',
})

const route = useRoute()
const { search: searchApi } = useApi()

const filters = ref<SearchFiltersState>({ ...DEFAULT_SEARCH_FILTERS })
const mobileFiltersOpen = ref(false)
const currentPage = ref(Number(route.query.page) || 1)
const itemsPerPage = 9

const searchParams = computed(() => {
  const params: Record<string, unknown> = {
    page: currentPage.value,
    limit: itemsPerPage,
  }

  if (route.query.location) {
    params.location_id = route.query.location
  }

  if (route.query.animal) {
    params.animal_id = route.query.animal
  }

  if (filters.value.priceMin > 0 || filters.value.priceMax < 15000) {
    params.price_range = `${filters.value.priceMin};${filters.value.priceMax}`
  }

  if (filters.value.ratings.length) {
    params.review_score = filters.value.ratings
  }

  return params
})

const { data: searchResponse, pending } = await useAsyncData(
  'hotel-search',
  async () => {
    try {
      const response = await searchApi.searchByType('hotel', searchParams.value) as SearchApiResponse

      if (response.status === 1 && response.data?.data?.length) {
        return response.data
      }
    }
    catch {
      // API недоступен — используем мок-данные
    }

    return null
  },
  {
    watch: [searchParams],
    default: () => null,
  },
)

const fallbackItems = computed(() => {
  let items = [...MOCK_SEARCH_ITEMS]

  if (route.query.location) {
    items = items.filter((_, index) => index % 3 !== 2)
  }

  if (filters.value.priceMax < 15000) {
    items = items.filter(item => (item.sale_price ?? item.price) <= filters.value.priceMax)
  }

  if (filters.value.priceMin > 0) {
    items = items.filter(item => (item.sale_price ?? item.price) >= filters.value.priceMin)
  }

  switch (filters.value.sort) {
    case 'price_asc':
      items.sort((a, b) => (a.sale_price ?? a.price) - (b.sale_price ?? b.price))
      break
    case 'price_desc':
      items.sort((a, b) => (b.sale_price ?? b.price) - (a.sale_price ?? a.price))
      break
    default:
      break
  }

  return items
})

const totalCount = computed(() => searchResponse.value?.total ?? fallbackItems.value.length)
const totalPages = computed(() => {
  if (searchResponse.value?.total_pages) {
    return searchResponse.value.total_pages
  }

  return Math.max(1, Math.ceil(fallbackItems.value.length / itemsPerPage))
})

const pageItems = computed<BookableItem[]>(() => {
  if (searchResponse.value?.data?.length) {
    return searchResponse.value.data
  }

  const start = (currentPage.value - 1) * itemsPerPage
  return fallbackItems.value.slice(start, start + itemsPerPage)
})

const offerItems = computed(() =>
  pageItems.value.map((item, index) => toOfferItem(item, index)),
)

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
          <h1 class="bases-page__title">
            Найдено баз: {{ totalCount }}
          </h1>

          <div class="bases-page__toolbar-actions">
            <button
              type="button"
              class="bases-page__filters-btn"
              @click="mobileFiltersOpen = true"
            >
              Фильтры
            </button>
            <NuxtLink to="/bases/map" class="bases-page__map-link">
              Показать на карте
            </NuxtLink>
          </div>
        </div>

        <div class="bases-page__layout">
          <SearchFilters
            v-model="filters"
            v-model:mobile-open="mobileFiltersOpen"
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

            <SearchPagination
              :current-page="currentPage"
              :total-pages="totalPages"
              @change="handlePageChange"
            />
          </div>
        </div>
      </div>
    </section>

    <HomeBlocksCommunityBlock />
    <LayoutAppFooter />
  </div>
</template>

<style scoped>
.bases-page {
  background: var(--wh-white);
}

.bases-page__results {
  padding: 40px 0 72px;
}

.bases-page__results-inner {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.bases-page__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.bases-page__title {
  margin: 0;
  font-size: clamp(1.25rem, 2.2vw, 1.75rem);
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--wh-gray-900);
}

.bases-page__toolbar-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.bases-page__filters-btn {
  display: none;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 18px;
  border: 1px solid var(--wh-gray-200);
  border-radius: 999px;
  background: var(--wh-white);
  color: var(--wh-gray-900);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.bases-page__map-link {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #d64545;
  transition: opacity 0.15s ease;
}

.bases-page__map-link:hover {
  opacity: 0.8;
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

  .bases-page__filters-btn {
    display: inline-flex;
  }

  .bases-page__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .bases-page__results {
    padding-top: 28px;
  }

  .bases-page__grid {
    grid-template-columns: 1fr;
  }

  .bases-page__toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .bases-page__toolbar-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
