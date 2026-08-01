<script setup lang="ts">
import type { HotelSearchBody, OfferItem } from '~/types/api'
import { mapHotelOfferToItem } from '~/api/hotels'
import { parseDisplayDateToApiDate } from '~/utils/date'
import { DEFAULT_MAP_CENTER, offerToMapHotel, type MapHotelItem } from '~/utils/map'

definePageMeta({
  layout: 'home',
})

useHead({
  title: 'Базы на карте — WH',
})

const route = useRoute()
const { search: searchApi, hotels: hotelsApi } = useApi()

const breadcrumbs = computed(() => [
  { label: 'Главная', to: '/' },
  {
    label: 'Базы',
    to: {
      path: '/bases',
      query: route.query,
    },
  },
  { label: 'Карта' },
])

const selectedId = ref<number | null>(null)
const fitVersion = ref(0)
const listColumns = ref<1 | 2>(1)
const isListCollapsed = ref(false)
const isGridList = computed(() => listColumns.value === 2)

function queryString(key: string): string {
  const value = route.query[key]
  return Array.isArray(value) ? String(value[0] || '') : String(value || '')
}

const isCatalogMode = computed(() => !queryString('checkIn') && !queryString('checkOut'))

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
  }

  return {
    catalog,
    body,
    // Force reactivity when only query values change.
    key: route.fullPath,
  }
})

async function fetchAllSearchHotels(body: HotelSearchBody): Promise<OfferItem[]> {
  const first = await searchApi.searchHotels(1, body)

  if (!first.success) {
    return []
  }

  const items = [...first.data.items]
  const lastPage = Math.max(1, first.data.pagination.last_page)

  for (let page = 2; page <= lastPage; page += 1) {
    const response = await searchApi.searchHotels(page, body)

    if (response.success) {
      items.push(...response.data.items)
    }
  }

  return items.map(mapHotelOfferToItem)
}

const hotels = ref<MapHotelItem[]>([])
/** Compact size is always on in grid mode; two-per-row only with 2+ hotels. */
const isGridMulti = computed(() => isGridList.value && hotels.value.length > 1)
const isLoading = ref(false)
let searchLoadId = 0

async function loadMapHotels() {
  const loadId = ++searchLoadId
  isLoading.value = true

  try {
    const items = searchRequest.value.catalog
      ? await hotelsApi.getHotelOfferItems()
      : await fetchAllSearchHotels(searchRequest.value.body)

    if (loadId !== searchLoadId) {
      return
    }

    hotels.value = items
      .map(offerToMapHotel)
      .filter((item): item is MapHotelItem => item != null)
  }
  catch {
    // Keep previous results visible if a refresh fails.
  }
  finally {
    if (loadId === searchLoadId) {
      isLoading.value = false
    }
  }
}

await loadMapHotels()

watch(
  () => searchRequest.value.key,
  () => {
    void loadMapHotels()
  },
)

const listEl = ref<HTMLElement | null>(null)
const listPageCount = ref(1)
const listPageIndex = ref(0)
let listResizeObserver: ResizeObserver | null = null

function getListMaxScroll(el: HTMLElement) {
  return Math.max(0, el.scrollHeight - el.clientHeight)
}

function getListPageCount(el: HTMLElement) {
  const pageSize = el.clientHeight || 1
  const maxScroll = getListMaxScroll(el)

  if (maxScroll <= 1) {
    return 1
  }

  return Math.max(1, Math.ceil((maxScroll + pageSize) / pageSize))
}

function getListPageIndex(el: HTMLElement, pageCount: number) {
  if (pageCount <= 1) {
    return 0
  }

  const maxScroll = getListMaxScroll(el)

  // Last screen is shorter than a full page — treat bottom as final page.
  if (el.scrollTop >= maxScroll - 2) {
    return pageCount - 1
  }

  return Math.min(
    pageCount - 1,
    Math.round((el.scrollTop / maxScroll) * (pageCount - 1)),
  )
}

function updateListPages() {
  const el = listEl.value
  if (!el) {
    listPageCount.value = 1
    listPageIndex.value = 0
    return
  }

  const pages = getListPageCount(el)
  listPageCount.value = pages
  listPageIndex.value = getListPageIndex(el, pages)
}

function onListScroll() {
  const el = listEl.value
  if (!el) {
    return
  }

  listPageIndex.value = getListPageIndex(el, listPageCount.value)
}

function scrollListToPage(index: number) {
  const el = listEl.value
  if (!el) {
    return
  }

  const pageCount = listPageCount.value
  const maxScroll = getListMaxScroll(el)
  const top = pageCount <= 1
    ? 0
    : (index / (pageCount - 1)) * maxScroll

  el.scrollTo({
    top,
    behavior: 'smooth',
  })
  listPageIndex.value = index
}

watch(
  hotels,
  async () => {
    selectedId.value = null
    fitVersion.value += 1
    await nextTick()
    updateListPages()
    // Recalculate after images affect scrollHeight.
    requestAnimationFrame(() => updateListPages())
  },
  { deep: true },
)

watch([isGridList, isGridMulti, isListCollapsed], async () => {
  await nextTick()
  updateListPages()
  requestAnimationFrame(() => updateListPages())
})

watch(listEl, (el) => {
  listResizeObserver?.disconnect()
  listResizeObserver = null

  if (!el || typeof ResizeObserver === 'undefined') {
    return
  }

  listResizeObserver = new ResizeObserver(() => {
    updateListPages()
  })
  listResizeObserver.observe(el)
  updateListPages()
})

onBeforeUnmount(() => {
  listResizeObserver?.disconnect()
  listResizeObserver = null
})

const selectedHotel = computed(() => {
  return hotels.value.find((hotel) => hotel.id === selectedId.value) ?? null
})

const mapMarkers = computed(() => {
  return hotels.value.map((hotel) => ({
    id: hotel.id,
    title: hotel.title,
    lat: hotel.lat,
    lng: hotel.lng,
  }))
})

const mapLat = computed(() => selectedHotel.value?.lat ?? DEFAULT_MAP_CENTER.lat)
const mapLng = computed(() => selectedHotel.value?.lng ?? DEFAULT_MAP_CENTER.lng)
const mapZoom = computed(() => (selectedHotel.value ? 13 : DEFAULT_MAP_CENTER.zoom))

function selectHotel(id: number) {
  selectedId.value = id
}

function resetMapView() {
  selectedId.value = null
  fitVersion.value += 1
}

function toggleListColumns() {
  listColumns.value = listColumns.value === 1 ? 2 : 1
}

function toggleListCollapsed() {
  isListCollapsed.value = !isListCollapsed.value
}

async function handleSearch(payload: Record<string, string>) {
  await navigateTo({
    path: '/bases/map',
    query: {
      ...payload,
    },
  })
  await loadMapHotels()
}
</script>

<template>
  <div class="bases-map-page">
    <SearchHero @search="handleSearch" />

    <section class="bases-map-page__results">
      <div class="bases-map-page__content">
        <AppBreadcrumbs
          :items="breadcrumbs"
          class="bases-map-page__breadcrumbs"
        />

        <div class="bases-map-page__panel">
          <div
            class="bases-map-page__layout"
            :class="{
              'bases-map-page__layout--collapsed': isListCollapsed,
              'bases-map-page__layout--grid': isGridMulti && !isListCollapsed,
              'bases-map-page__layout--grid-single': isGridList && hotels.length === 1 && !isListCollapsed,
            }"
          >
            <div
              class="bases-map-page__controls-wrap"
              :class="{
                'bases-map-page__controls-wrap--with-dots': hotels.length && listPageCount > 1,
              }"
            >
              <div
                v-if="hotels.length && listPageCount > 1"
                class="bases-map-page__controls-spacer"
                aria-hidden="true"
              />
              <div
                class="bases-map-page__controls"
                role="toolbar"
                aria-label="Управление картой"
              >
                <button
                  type="button"
                  class="bases-map-page__control"
                  title="Показать все базы"
                  aria-label="Показать все базы на карте"
                  @click="resetMapView"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4"
                      stroke="currentColor"
                      stroke-width="1.7"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="2.2"
                      fill="currentColor"
                    />
                  </svg>
                </button>

                <button
                  type="button"
                  class="bases-map-page__control"
                  :class="{ 'bases-map-page__control--active': isGridList }"
                  :title="isGridList ? 'Крупные карточки' : 'Компактные карточки'"
                  :aria-label="isGridList ? 'Показать крупные карточки' : 'Показать компактные карточки'"
                  :aria-pressed="isGridList"
                  @click="toggleListColumns"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <rect
                      x="3.5"
                      y="3.5"
                      width="7"
                      height="7"
                      rx="1.2"
                      stroke="currentColor"
                      stroke-width="1.7"
                    />
                    <rect
                      x="13.5"
                      y="3.5"
                      width="7"
                      height="7"
                      rx="1.2"
                      stroke="currentColor"
                      stroke-width="1.7"
                    />
                    <rect
                      x="3.5"
                      y="13.5"
                      width="7"
                      height="7"
                      rx="1.2"
                      stroke="currentColor"
                      stroke-width="1.7"
                    />
                    <rect
                      x="13.5"
                      y="13.5"
                      width="7"
                      height="7"
                      rx="1.2"
                      stroke="currentColor"
                      stroke-width="1.7"
                    />
                  </svg>
                </button>

                <button
                  type="button"
                  class="bases-map-page__control"
                  title="Фильтры"
                  aria-label="Открыть фильтры"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 6h16M7 12h10M10 18h4"
                      stroke="currentColor"
                      stroke-width="1.7"
                      stroke-linecap="round"
                    />
                  </svg>
                </button>

                <button
                  type="button"
                  class="bases-map-page__control bases-map-page__control--collapse"
                  :class="{ 'bases-map-page__control--active': isListCollapsed }"
                  :title="isListCollapsed ? 'Развернуть список' : 'Свернуть список'"
                  :aria-label="isListCollapsed ? 'Развернуть список отелей' : 'Свернуть список отелей'"
                  :aria-pressed="isListCollapsed"
                  @click="toggleListCollapsed"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      v-if="isListCollapsed"
                      d="M9 6l6 6-6 6"
                      stroke="currentColor"
                      stroke-width="1.7"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      v-else
                      d="M15 6l-6 6 6 6"
                      stroke="currentColor"
                      stroke-width="1.7"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div class="bases-map-page__sidebar">
              <div
                class="bases-map-page__list-wrap"
                :class="{
                  'bases-map-page__list-wrap--with-dots': hotels.length && listPageCount > 1,
                }"
              >
                <div
                  v-if="hotels.length && listPageCount > 1"
                  class="bases-map-page__list-dots"
                  role="tablist"
                  aria-label="Страницы списка баз"
                >
                  <button
                    v-for="page in listPageCount"
                    :key="page"
                    type="button"
                    class="bases-map-page__list-dot"
                    :class="{ 'bases-map-page__list-dot--active': page - 1 === listPageIndex }"
                    :aria-label="`Страница ${page}`"
                    :aria-current="page - 1 === listPageIndex ? 'true' : undefined"
                    @click="scrollListToPage(page - 1)"
                  />
                </div>

                <aside
                  ref="listEl"
                  class="bases-map-page__list"
                  :class="{
                    'bases-map-page__list--grid': isGridList && !isListCollapsed,
                    'bases-map-page__list--grid-multi': isGridMulti && !isListCollapsed,
                    'bases-map-page__list--collapsed': isListCollapsed,
                    'bases-map-page__list--state': !hotels.length,
                    'bases-map-page__list--refreshing': isLoading && hotels.length,
                  }"
                  :aria-busy="isLoading"
                  aria-label="Список баз"
                  @scroll.passive="onListScroll"
                >
                  <div
                    v-if="isLoading && !hotels.length"
                    class="bases-map-page__state bases-map-page__state--loading"
                  >
                    <CommonSpinner
                      variant="ring"
                      size="md"
                    />
                  </div>

                  <div
                    v-else-if="!hotels.length"
                    class="bases-map-page__state"
                  >
                    Нет баз с координатами для отображения на карте.
                  </div>

                  <template v-else>
                    <SearchBasesMapHotelCard
                      v-for="hotel in hotels"
                      :key="hotel.id"
                      :item="hotel"
                      :active="hotel.id === selectedId"
                      :compact="isGridList && !isListCollapsed"
                      :image-only="isListCollapsed"
                      @select="selectHotel"
                    />
                  </template>

                  <div
                    v-if="isLoading && hotels.length"
                    class="bases-map-page__refresh"
                    aria-hidden="true"
                  >
                    <CommonSpinner
                      variant="ring"
                      size="md"
                    />
                  </div>
                </aside>
              </div>
            </div>

            <div class="bases-map-page__main">
              <h1 class="bases-map-page__title">
                {{ hotels.length ? `Базы на карте: ${hotels.length}` : 'Базы на карте' }}
              </h1>

              <div class="bases-map-page__map-wrap">
                <SearchBasesMap
                  :lat="mapLat"
                  :lng="mapLng"
                  :zoom="mapZoom"
                  :markers="mapMarkers"
                  :active-id="selectedId"
                  :fit-version="fitVersion"
                  @select="selectHotel"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <HomeBlocksCommunityBlock variant="centered" />
    <LayoutAppFooter />
  </div>
</template>

<style scoped>
.bases-map-page {
  background: var(--wh-white);
}

.bases-map-page__results {
  position: relative;
  z-index: 1;
  padding: 20px 0 104px;
  background: #e8e8e8;
}

.bases-map-page__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: min(100% - 32px, 1680px);
  margin-inline: auto;
}

.bases-map-page__breadcrumbs {
  align-self: start;
}

.bases-map-page__panel {
  padding: 16px;
}

.bases-map-page__layout {
  display: grid;
  grid-template-columns: 380px minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr);
  column-gap: 20px;
  row-gap: 12px;
  height: min(70vh, 720px);
  min-height: 520px;
  overflow: hidden;
  transition: grid-template-columns 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}

.bases-map-page__layout--grid {
  grid-template-columns: 520px minmax(0, 1fr);
}

/* Compact mode with one hotel: sidebar fits a single card, no empty second slot. */
.bases-map-page__layout--grid-single {
  grid-template-columns: 254px minmax(0, 1fr);
}

.bases-map-page__layout--collapsed {
  /* dots (8) + gap (12) + photo (120) — same left rhythm as expanded */
  grid-template-columns: 140px minmax(0, 1fr);
  column-gap: 10px;
}

.bases-map-page__controls-wrap {
  grid-column: 1;
  grid-row: 1;
  z-index: 4;
}

.bases-map-page__sidebar {
  grid-column: 1;
  grid-row: 2;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-self: stretch;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.bases-map-page__main {
  grid-column: 2;
  grid-row: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  min-height: 0;
}

/*
 * Collapsed: toolbar stays in the photo column rhythm (spacer + controls),
 * then extends over the map so collapse sits outside the narrow strip.
 */
.bases-map-page__layout--collapsed .bases-map-page__controls-wrap {
  grid-column: 1 / -1;
  grid-row: 1;
  width: min(296px, 100%);
  justify-self: start;
  z-index: 5;
}

.bases-map-page__layout--collapsed .bases-map-page__sidebar {
  grid-row: 2;
}

.bases-map-page__layout--collapsed .bases-map-page__main {
  grid-row: 1 / -1;
}

.bases-map-page__layout--collapsed .bases-map-page__control--collapse {
  margin-left: auto;
}

.bases-map-page__layout--collapsed .bases-map-page__title {
  padding-left: 8px;
}

.bases-map-page__layout--collapsed .bases-map-page__list-wrap--with-dots {
  gap: 12px;
}

.bases-map-page__title {
  margin: 0;
  min-height: 40px;
  font-family: "UNCAGE", sans-serif;
  font-size: 32px;
  font-weight: 400;
  line-height: 40px;
  letter-spacing: -0.03em;
  text-align: center;
  color: var(--wh-gray-900);
  white-space: nowrap;
}

.bases-map-page__controls-wrap {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
  flex-shrink: 0;
  min-width: 0;
  min-height: 40px;
}

.bases-map-page__controls-wrap--with-dots {
  grid-template-columns: 8px minmax(0, 1fr);
}

.bases-map-page__layout--collapsed .bases-map-page__list-wrap {
  width: 100%;
}

.bases-map-page__controls-spacer {
  width: 8px;
}

.bases-map-page__controls {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  min-height: 40px;
  padding: 6px;
  border: 1px solid var(--wh-gray-200, #dddddd);
  border-radius: 10px;
  background: var(--wh-gray-100, #f5f5f5);
}

.bases-map-page__layout--collapsed .bases-map-page__controls {
  background: rgb(245 245 245 / 96%);
  box-shadow: 0 4px 16px rgb(0 0 0 / 8%);
}

.bases-map-page__control--collapse {
  margin-left: auto;
}

.bases-map-page__control {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 8px;
  background: var(--wh-white);
  color: var(--wh-gray-900);
  cursor: pointer;
  transition:
    color 0.15s ease,
    border-color 0.15s ease,
    background 0.15s ease;
}

.bases-map-page__control:hover,
.bases-map-page__control--active {
  color: #e8883a;
  border-color: #e8883a;
}

.bases-map-page__list-wrap {
  display: flex;
  align-items: stretch;
  gap: 8px;
  /* basis 0 so the wrap is capped by the sidebar, not by card content */
  flex: 1 1 0;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.bases-map-page__list-dots {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 8px;
  padding: 4px 0;
}

.bases-map-page__list-dot {
  width: 8px;
  height: 8px;
  padding: 0;
  border: 1px solid rgb(28 33 28 / 25%);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.bases-map-page__list-dot--active {
  border-color: #e8883a;
  background: #e8883a;
  transform: scale(1.15);
}

.bases-map-page__list-dot:hover:not(.bases-map-page__list-dot--active) {
  border-color: rgb(28 33 28 / 45%);
}

.bases-map-page__list {
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  align-content: start;
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
  -ms-overflow-style: none;
  transition: grid-template-columns 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}

.bases-map-page__list--grid {
  grid-template-columns: 1fr;
}

.bases-map-page__list--grid-multi {
  grid-template-columns: 1fr 1fr;
}

.bases-map-page__list--collapsed {
  grid-template-columns: 1fr;
  gap: 10px;
  overflow-x: hidden;
  padding: 1px;
}

.bases-map-page__list--state {
  display: flex;
  align-items: center;
  justify-content: center;
}

.bases-map-page__list--refreshing {
  pointer-events: none;
}

.bases-map-page__list::-webkit-scrollbar {
  display: none;
}

.bases-map-page__state {
  display: grid;
  place-items: center;
  grid-column: 1 / -1;
  width: 100%;
  min-height: 160px;
  padding: 16px;
  font-family: "Inter", sans-serif;
  font-size: 15px;
  line-height: 1.4;
  color: var(--wh-gray-600, #666);
  text-align: center;
}

.bases-map-page__state--loading {
  flex: 1;
  min-height: 100%;
}

.bases-map-page__refresh {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  place-items: center;
  background: rgb(255 255 255 / 55%);
  pointer-events: none;
}

.bases-map-page__map-wrap {
  flex: 1;
  min-width: 0;
  min-height: 0;
}

@media (max-width: 960px) {
  .bases-map-page__layout,
  .bases-map-page__layout--collapsed,
  .bases-map-page__layout--grid,
  .bases-map-page__layout--grid-single {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    height: auto;
    min-height: 0;
  }

  .bases-map-page__controls-wrap,
  .bases-map-page__layout--collapsed .bases-map-page__controls-wrap,
  .bases-map-page__sidebar,
  .bases-map-page__layout--collapsed .bases-map-page__sidebar,
  .bases-map-page__main,
  .bases-map-page__layout--collapsed .bases-map-page__main {
    grid-column: 1;
    grid-row: auto;
    width: auto;
  }

  .bases-map-page__sidebar {
    max-height: 360px;
  }

  .bases-map-page__map-wrap {
    height: 55vh;
    min-height: 360px;
  }
}

@media (max-width: 768px) {
  .bases-map-page__results {
    padding: 16px 0 72px;
  }

  .bases-map-page__title {
    font-size: 24px;
    white-space: normal;
  }
}
</style>
