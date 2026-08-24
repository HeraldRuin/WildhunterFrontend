<script setup lang="ts">
import type { LocationItem, OfferItem, SearchFiltersState } from '~/types/api'
import type { BreadcrumbItem } from '~/types/breadcrumb'
import {
  countOffersByReviewRating,
  DEFAULT_SEARCH_FILTERS,
  matchesFoodFilter,
  matchesReviewRatingFilter,
} from '~/utils/search'

definePageMeta({
  layout: 'home',
  key: (route) => route.path,
})

const route = useRoute()
const { location: locationApi, hotels: hotelsApi } = useApi()

const locationId = computed(() => Number(route.params.id))
const DEFAULT_PRICE_BOUNDS = { min: 0, max: 15000 }

function getCachedPageData<T>(key: string, nuxtApp: ReturnType<typeof useNuxtApp>) {
  return nuxtApp.payload.data[key] as T | undefined
    ?? nuxtApp.static.data[key] as T | undefined
}

const { data: homeLocations } = useNuxtData<LocationItem[]>('home-location-offers')

const cachedLocationName = computed(() => {
  return homeLocations.value?.find(item => item.id === locationId.value)?.title ?? ''
})

// getCachedData: назад с отеля не дергает API снова и не показывает спиннер.
const { data: locationHotels, pending: hotelsPending } = useAsyncData(
  () => `location-hotels-${route.params.id}`,
  async () => {
    if (!Number.isFinite(locationId.value) || locationId.value <= 0) {
      return [] as OfferItem[]
    }

    try {
      return await locationApi.getLocationHotelItems(locationId.value)
    }
    catch {
      return [] as OfferItem[]
    }
  },
  {
    lazy: true,
    default: () => [] as OfferItem[],
    watch: [locationId],
    getCachedData: (key, nuxtApp) => getCachedPageData(key, nuxtApp),
  },
)

// Не блокируем переход: имя берём из кэша главной / ответа отелей, API — fallback.
const { data: fetchedLocationName } = useAsyncData(
  () => `location-name-${route.params.id}`,
  async () => {
    if (cachedLocationName.value) {
      return cachedLocationName.value
    }

    const fromHotels = locationHotels.value.find(item => item.location)?.location
    if (fromHotels) {
      return fromHotels
    }

    try {
      const locations = await locationApi.getLocationItems()
      const match = locations.find(item => item.id === locationId.value)

      return match?.name ?? ''
    }
    catch {
      return ''
    }
  },
  {
    lazy: true,
    server: false,
    default: () => '',
    getCachedData: (key, nuxtApp) => getCachedPageData(key, nuxtApp),
  },
)

const locationName = computed(() => {
  if (cachedLocationName.value) {
    return cachedLocationName.value
  }

  const fromHotels = locationHotels.value.find(item => item.location)?.location
  if (fromHotels) {
    return fromHotels
  }

  return fetchedLocationName.value || ''
})

const { data: priceBounds } = useAsyncData(
  'hotel-price-range',
  () => hotelsApi.getPriceRangeBounds(),
  {
    lazy: true,
    default: () => ({ ...DEFAULT_PRICE_BOUNDS }),
    getCachedData: (key, nuxtApp) => getCachedPageData(key, nuxtApp),
  },
)

useHead(() => ({
  title: locationName.value
    ? `${locationName.value} — WH`
    : 'Область — WH',
}))

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
const perPage = 6

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: 'Главная', to: '/' },
  { label: 'Локации', to: '/locations' },
  { label: locationName.value || 'Область' },
])

const filteredOffers = computed(() => {
  return locationHotels.value.filter((item) => {
    if (item.price < filters.value.priceMin || item.price > filters.value.priceMax) {
      return false
    }

    if (
      filters.value.ratings.length
      && !matchesReviewRatingFilter(item.rating, filters.value.ratings)
    ) {
      return false
    }

    if (!matchesFoodFilter(item.has_food, filters.value.hasMeals)) {
      return false
    }

    return true
  })
})

const ratingCounts = computed(() => countOffersByReviewRating(
  locationHotels.value.filter(item => (
    item.price >= filters.value.priceMin && item.price <= filters.value.priceMax
  )),
))

const totalCount = computed(() => filteredOffers.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / perPage)))
const countReady = computed(() => !hotelsPending.value && totalCount.value > 0)

const hasActiveFilters = computed(() => {
  const bounds = priceBounds.value
  const priceChanged = (
    filters.value.priceMin > bounds.min
    || filters.value.priceMax < bounds.max
  )

  return (
    priceChanged
    || filters.value.ratings.length > 0
    || filters.value.amenities.length > 0
    || filters.value.hasMeals !== ''
    || filters.value.sort !== DEFAULT_SEARCH_FILTERS.sort
  )
})

const emptyStateText = computed(() => {
  if (hasActiveFilters.value) {
    return 'По выбранным фильтрам отели не найдены'
  }

  return 'Нет ни одного отеля в этой локации'
})

const offerItems = computed(() => {
  const page = Math.min(currentPage.value, totalPages.value)
  const start = (page - 1) * perPage

  return filteredOffers.value.slice(start, start + perPage)
})

watch(totalPages, (pages) => {
  if (currentPage.value > pages) {
    currentPage.value = pages
  }
})

watch(locationId, () => {
  currentPage.value = 1
})

function handlePageChange(page: number) {
  currentPage.value = page
  navigateTo({
    path: route.path,
    query: {
      ...route.query,
      page: page > 1 ? String(page) : undefined,
    },
  })
}

function handleFiltersReset() {
  currentPage.value = 1
  filters.value = {
    ...DEFAULT_SEARCH_FILTERS,
    priceMin: priceBounds.value.min,
    priceMax: priceBounds.value.max,
  }
}
</script>

<template>
  <div class="location-page">
    <SearchHero
      :title="locationName || 'Область'"
      background-image="/images/location-img.jpg"
      hide-search
    />

    <section class="location-page__results">
      <div class="container location-page__results-inner">
        <AppBreadcrumbs
          :items="breadcrumbs"
          class="location-page__breadcrumbs"
        />

        <div
          class="location-page__layout"
          :class="{ 'location-page__layout--filters-open': mobileFiltersOpen }"
        >
          <div class="location-page__toolbar">
            <button
              v-show="!mobileFiltersOpen"
              type="button"
              class="location-page__toolbar-link location-page__filters-btn"
              @click="mobileFiltersOpen = true"
            >
              Фильтры
            </button>

            <!-- <NuxtLink
              v-if="countReady"
              to="/locations"
              class="location-page__toolbar-link location-page__locations-label"
            >
              Все локации
            </NuxtLink> -->

            <h1
              v-if="countReady"
              class="location-page__title"
            >
              Найдено баз: {{ totalCount }}
            </h1>

            <NuxtLink
              v-if="countReady"
              :to="`/locations/${locationId}/map`"
              class="location-page__toolbar-link location-page__map-link"
            >
              Показать на карте
            </NuxtLink>
          </div>

          <SearchFilters
            v-model="filters"
            v-model:mobile-open="mobileFiltersOpen"
            :price-bound-min="priceBounds.min"
            :price-bound-max="priceBounds.max"
            :rating-counts="ratingCounts"
            class="location-page__filters"
            @reset="handleFiltersReset"
          />

          <div class="location-page__main">
            <div
              v-if="hotelsPending && !locationHotels.length"
              class="location-page__state location-page__state--loading"
            >
              <CommonSpinner
                variant="ring"
                size="lg"
              />
            </div>

            <div
              v-else-if="!offerItems.length"
              class="location-page__state location-page__state--empty"
            >
              {{ emptyStateText }}
            </div>

            <template v-else>
              <div class="location-page__grid">
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
            </template>
          </div>
        </div>
      </div>
    </section>

    <HomeBlocksLocationAboutBlock :location-name="locationName || 'Область'" />
    <HomeBlocksCommunityBlock variant="centered" />
    <LayoutAppFooter />
  </div>
</template>

<style scoped>
.location-page {
  background: var(--wh-white);
}

.location-page__results {
  padding: 80px 0 104px;
}

.location-page__results-inner {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.location-page__breadcrumbs {
  align-self: start;
}

.location-page__toolbar {
  grid-column: 2;
  grid-row: 1;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  /* Keep title row height so filters don't jump when count goes to 0. */
  min-height: calc(32px * 1.3);
}

.location-page__title {
  grid-column: 2;
  grid-row: 1;
  margin: 0;
  font-family: "UNCAGE", sans-serif;
  font-size: 32px;
  font-weight: 400;
  line-height: 130%;
  letter-spacing: -0.03em;
  text-align: center;
  color: var(--wh-gray-900);
  white-space: nowrap;
  animation: location-title-in 0.35s ease;
}

@keyframes location-title-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.location-page__toolbar-link {
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

.location-page__toolbar-link:hover {
  opacity: 0.8;
}

.location-page__filters-btn {
  display: none;
  justify-self: start;
}

.location-page__locations-label {
  display: none;
  grid-column: 1;
  justify-self: start;
  cursor: pointer;
  color: #d64545;
}

@media (--wh-desktop) {
  .location-page__locations-label {
    display: inline;
  }
}

.location-page__map-link {
  grid-column: 3;
  justify-self: end;
}

.location-page__layout {
  display: grid;
  grid-template-columns: minmax(260px, 300px) minmax(0, 1fr);
  grid-template-rows: auto auto;
  column-gap: 32px;
  row-gap: 28px;
  align-items: start;
}

.location-page__filters {
  grid-column: 1;
  grid-row: 2;
}

.location-page__main {
  grid-column: 2;
  grid-row: 2;
  display: flex;
  flex-direction: column;
  gap: 40px;
  min-width: 0;
}

.location-page__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px 20px;
}

.location-page__state {
  padding: 48px 24px;
  text-align: center;
  color: var(--wh-gray-500);
}

.location-page__state--loading,
.location-page__state--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  padding: 64px 24px;
}

.location-page__state--empty {
  font-family: "Inter", sans-serif;
  font-size: 20px;
  font-weight: 500;
  line-height: 140%;
  letter-spacing: -0.03em;
  color: var(--wh-gray-900);
}

@media (--wh-tablet) {
  .location-page__layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
  }

  .location-page__toolbar,
  .location-page__filters,
  .location-page__main {
    grid-column: 1;
    grid-row: auto;
  }

  .location-page__filters-btn {
    display: inline;
    grid-column: 1;
  }

  .location-page__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (--wh-mobile) {
  .location-page__layout--filters-open .location-page__main {
    display: none;
  }

  .location-page__results {
    padding-top: 48px;
  }

  .location-page__results-inner {
    gap: 12px;
  }

  .location-page__grid {
    grid-template-columns: 1fr;
  }

  .location-page__toolbar {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
    min-height: 0;
  }

  .location-page__title {
    order: 1;
    grid-column: auto;
    font-size: 24px;
    text-transform: uppercase;
  }

  .location-page__filters-btn {
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

  .location-page__filters-btn:hover {
    background: var(--wh-orange-600);
    opacity: 1;
  }

  .location-page__locations-label,
  .location-page__map-link {
    display: none;
  }
}
</style>
