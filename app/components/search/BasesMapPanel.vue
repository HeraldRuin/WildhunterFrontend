<script setup lang="ts">
import type { BreadcrumbItem } from '~/types/breadcrumb'
import { DEFAULT_MAP_CENTER, parseMapCoordinates, type MapHotelItem } from '~/utils/map'

const props = withDefaults(defineProps<{
  hotels: MapHotelItem[]
  loading?: boolean
  breadcrumbs: BreadcrumbItem[]
}>(), {
  loading: false,
})

const selectedId = ref<number | null>(null)
const fitVersion = ref(0)
const listColumns = ref<1 | 2>(1)
const isListCollapsed = ref(false)
const isMeasureMode = ref(false)
const measureSearchQuery = ref('')
const measureSearchPending = ref(false)
const measureSearchError = ref('')
const measureOriginPoint = ref<{ lat: number, lng: number, key: number } | null>(null)
const isGridList = computed(() => listColumns.value === 2)
const isGridMulti = computed(() => isGridList.value && props.hotels.length > 1)

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

function scheduleListPagesUpdate() {
  void nextTick(() => {
    updateListPages()
    requestAnimationFrame(() => {
      updateListPages()
      requestAnimationFrame(updateListPages)
    })
  })
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
  () => props.hotels,
  () => {
    selectedId.value = null
    fitVersion.value += 1
    scheduleListPagesUpdate()
  },
  { deep: true },
)

watch([isGridList, isGridMulti, isListCollapsed], () => {
  scheduleListPagesUpdate()
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
  return props.hotels.find((hotel) => hotel.id === selectedId.value) ?? null
})

const mapMarkers = computed(() => {
  return props.hotels.map((hotel) => ({
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

function toggleMeasureMode() {
  isMeasureMode.value = !isMeasureMode.value

  if (!isMeasureMode.value) {
    measureSearchQuery.value = ''
    measureSearchError.value = ''
    measureOriginPoint.value = null
  }
}

async function geocodeMeasureQuery(query: string) {
  const results = await $fetch<Array<{ lat: string, lon: string }>>(
    'https://nominatim.openstreetmap.org/search',
    {
      query: {
        format: 'json',
        q: query,
        limit: 1,
        countrycodes: 'ru',
      },
    },
  )

  const first = results[0]
  if (!first) {
    return null
  }

  const lat = Number(first.lat)
  const lng = Number(first.lon)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  return { lat, lng }
}

const showMeasureClear = computed(() => measureOriginPoint.value != null)

function clearMeasureSearch() {
  measureSearchQuery.value = ''
  measureSearchError.value = ''
  measureOriginPoint.value = null
}

async function searchMeasurePoint() {
  const query = measureSearchQuery.value.trim()
  measureSearchError.value = ''

  if (!query) {
    return
  }

  const coords = parseMapCoordinates(query)
  if (coords) {
    measureOriginPoint.value = { ...coords, key: Date.now() }
    return
  }

  measureSearchPending.value = true

  try {
    const point = await geocodeMeasureQuery(query)

    if (!point) {
      measureSearchError.value = 'Точка не найдена'
      return
    }

    measureOriginPoint.value = { ...point, key: Date.now() }
  }
  catch {
    measureSearchError.value = 'Не удалось найти точку'
  }
  finally {
    measureSearchPending.value = false
  }
}
</script>

<template>
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
                  class="bases-map-page__control"
                  :class="{ 'bases-map-page__control--active': isMeasureMode }"
                  title="Расстояния"
                  aria-label="Измерить расстояние на карте"
                  :aria-pressed="isMeasureMode"
                  @click="toggleMeasureMode"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 20L20 4"
                      stroke="currentColor"
                      stroke-width="1.7"
                      stroke-linecap="round"
                    />
                    <circle
                      cx="5.5"
                      cy="18.5"
                      r="2"
                      stroke="currentColor"
                      stroke-width="1.7"
                    />
                    <circle
                      cx="18.5"
                      cy="5.5"
                      r="2"
                      stroke="currentColor"
                      stroke-width="1.7"
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
                    'bases-map-page__list--refreshing': loading && hotels.length,
                  }"
                  :aria-busy="loading"
                  aria-label="Список баз"
                  @scroll.passive="onListScroll"
                >
                  <div
                    v-if="loading && !hotels.length"
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
                    v-if="loading && hotels.length"
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
              <div
                class="bases-map-page__main-header"
                :class="{ 'bases-map-page__main-header--measure': isMeasureMode }"
              >
                <form
                  v-if="isMeasureMode"
                  class="bases-map-page__measure-search"
                  @submit.prevent="searchMeasurePoint"
                >
                  <span
                    class="bases-map-page__measure-search-icon"
                    aria-hidden="true"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="11"
                        cy="11"
                        r="6.5"
                        stroke="currentColor"
                        stroke-width="1.7"
                      />
                      <path
                        d="M16 16l4 4"
                        stroke="currentColor"
                        stroke-width="1.7"
                        stroke-linecap="round"
                      />
                    </svg>
                  </span>

                  <input
                    v-model="measureSearchQuery"
                    type="search"
                    class="bases-map-page__measure-search-input"
                    placeholder="Адрес или координаты"
                    aria-label="Поиск точки для измерения расстояния"
                    :disabled="measureSearchPending"
                  >

                  <button
                    v-if="showMeasureClear"
                    type="button"
                    class="bases-map-page__measure-search-clear"
                    title="Очистить"
                    aria-label="Очистить поле и точку на карте"
                    @click="clearMeasureSearch"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M6 6l12 12M18 6L6 18"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                      />
                    </svg>
                  </button>

                  <button
                    v-else
                    type="submit"
                    class="bases-map-page__measure-search-submit"
                    :disabled="measureSearchPending || !measureSearchQuery.trim()"
                  >
                    {{ measureSearchPending ? '…' : 'Найти' }}
                  </button>

                  <p
                    v-if="measureSearchError"
                    class="bases-map-page__measure-search-error"
                  >
                    {{ measureSearchError }}
                  </p>
                </form>

                <h1 class="bases-map-page__title">
                  {{ hotels.length ? `Базы на карте: ${hotels.length}` : 'Базы на карте' }}
                </h1>
              </div>

              <div class="bases-map-page__map-wrap">
                <SearchBasesMap
                  :lat="mapLat"
                  :lng="mapLng"
                  :zoom="mapZoom"
                  :markers="mapMarkers"
                  :active-id="selectedId"
                  :fit-version="fitVersion"
                  :measure-mode="isMeasureMode"
                  :measure-origin-point="measureOriginPoint"
                  @select="selectHotel"
                />
              </div>
            </div>
          </div>
        </div>
    </div>
  </section>
</template>

<style scoped>
.bases-map-page__results {
  position: relative;
  z-index: 1;
  padding: 20px 0 48px;
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
  /* Photo strip only; widen when pagination dots are present. */
  grid-template-columns: 120px minmax(0, 1fr);
  column-gap: 8px;
}

.bases-map-page__layout--collapsed:has(.bases-map-page__list-wrap--with-dots) {
  /* dots (8) + gap (10) + photo (120) */
  grid-template-columns: 138px minmax(0, 1fr);
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
  gap: 10px;
}

.bases-map-page__main-header {
  display: grid;
  grid-template-columns: 1fr;
  align-items: center;
  min-height: 40px;
}

.bases-map-page__main-header--measure {
  grid-template-columns: 1fr auto 1fr;
  gap: 12px;
}

.bases-map-page__measure-search {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px;
  justify-self: start;
  width: 100%;
  max-width: 380px;
  min-height: 40px;
  padding: 0 8px 0 12px;
  border: 1px solid var(--wh-field-border, var(--wh-gray-200, #dddddd));
  border-radius: 10px;
  background: var(--wh-white);
  transition: border-color 0.15s ease;
}

.bases-map-page__measure-search:focus-within {
  border-color: var(--wh-field-border-active);
}

.bases-map-page__measure-search-icon {
  display: inline-flex;
  color: var(--wh-gray-500, #888);
}

.bases-map-page__measure-search-input {
  width: 100%;
  min-width: 0;
  height: 38px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--wh-gray-900);
  font-family: "Inter", sans-serif;
  font-size: 14px;
  outline: none;
}

.bases-map-page__measure-search-input::placeholder {
  color: var(--wh-gray-500, #888);
}

.bases-map-page__measure-search-input::-webkit-search-cancel-button {
  display: none;
}

.bases-map-page__measure-search-clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--wh-gray-900, #1c211c);
  cursor: pointer;
}

.bases-map-page__measure-search-clear:hover {
  background: var(--wh-gray-100, #f5f5f5);
}

.bases-map-page__measure-search-submit {
  height: 30px;
  padding: 0 10px;
  border: 0;
  border-radius: 8px;
  background: #e8883a;
  color: #fff;
  font-family: "Inter", sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.bases-map-page__measure-search-submit:disabled {
  opacity: 0.55;
  cursor: default;
}

.bases-map-page__measure-search-error {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 2;
  margin: 0;
  padding: 4px 8px;
  border-radius: 6px;
  background: #fff;
  color: #c0392b;
  font-family: "Inter", sans-serif;
  font-size: 12px;
  line-height: 1.3;
  box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
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

.bases-map-page__main-header--measure .bases-map-page__title {
  grid-column: 2;
  justify-self: center;
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
  grid-auto-rows: max-content;
}

.bases-map-page__list--grid-multi {
  grid-template-columns: 1fr 1fr;
  align-items: start;
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
    padding: 16px 0 36px;
  }

  .bases-map-page__title {
    font-size: 24px;
    white-space: normal;
  }
}
</style>
