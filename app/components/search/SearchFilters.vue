<script setup lang="ts">
import type { HotelRoomAttribute, HotelRoomAttributeTerm, SearchFiltersState } from '~/types/api'
import { DEFAULT_SEARCH_FILTERS } from '~/utils/search'

const PREVIEW_TERMS_LIMIT = 3

const props = withDefaults(defineProps<{
  modelValue: SearchFiltersState
  mobileOpen?: boolean
  /** Без внутренней прокрутки: блок растёт по контенту */
  noScroll?: boolean
  priceBoundMin?: number
  priceBoundMax?: number
  ratingCounts?: Record<string, number>
}>(), {
  mobileOpen: false,
  noScroll: false,
  priceBoundMin: 0,
  priceBoundMax: 15000,
  ratingCounts: () => ({}),
})

const emit = defineEmits<{
  'update:modelValue': [value: SearchFiltersState]
  'update:mobileOpen': [value: boolean]
  reset: []
}>()

const { services: servicesApi } = useApi()

const attributesRequested = ref(false)
const expandedGroups = ref<Record<number, boolean>>({})

const {
  data: attributeGroups,
  pending: attributesPending,
  execute: fetchAttributes,
} = useAsyncData<HotelRoomAttribute[]>(
  'search-service-attributes',
  () => servicesApi.getAttributeGroups('hotel'),
  {
    immediate: false,
    lazy: true,
    default: () => [],
  },
)

const localFilters = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

function updateField<K extends keyof SearchFiltersState>(
  field: K,
  value: SearchFiltersState[K],
) {
  if (props.noScroll) {
    localFilters.value = {
      ...localFilters.value,
      [field]: value,
    }
    return
  }

  const scrollTop = scrollEl.value?.scrollTop ?? 0

  localFilters.value = {
    ...localFilters.value,
    [field]: value,
  }

  void nextTick(() => {
    if (scrollEl.value) {
      scrollEl.value.scrollTop = Math.min(scrollTop, getListMaxScroll(scrollEl.value))
    }
    scheduleListPagesUpdate()
  })
}

async function onAmenitiesOpen() {
  if (attributesRequested.value) {
    return
  }

  attributesRequested.value = true
  await fetchAttributes()
}

function termId(term: HotelRoomAttributeTerm) {
  return String(term.id)
}

function termLabel(term: HotelRoomAttributeTerm) {
  return term.translation?.name || term.name
}

function visibleTerms(group: HotelRoomAttribute) {
  if (expandedGroups.value[group.id]) {
    return group.terms
  }

  return group.terms.slice(0, PREVIEW_TERMS_LIMIT)
}

function hasMoreTerms(group: HotelRoomAttribute) {
  return group.terms.length > PREVIEW_TERMS_LIMIT
}

function toggleGroupExpand(groupId: number) {
  expandedGroups.value = {
    ...expandedGroups.value,
    [groupId]: !expandedGroups.value[groupId],
  }
  if (!props.noScroll) {
    scheduleListPagesUpdate()
  }
}

function toggleAmenity(id: string) {
  const amenities = localFilters.value.amenities.includes(id)
    ? localFilters.value.amenities.filter(item => item !== id)
    : [...localFilters.value.amenities, id]

  updateField('amenities', amenities)
}

function handleReset() {
  const scrollTop = props.noScroll ? 0 : (scrollEl.value?.scrollTop ?? 0)

  emit('update:modelValue', {
    ...DEFAULT_SEARCH_FILTERS,
    priceMin: props.priceBoundMin,
    priceMax: props.priceBoundMax,
  })
  emit('reset')

  if (props.noScroll) {
    return
  }

  void nextTick(() => {
    if (scrollEl.value) {
      scrollEl.value.scrollTop = Math.min(scrollTop, getListMaxScroll(scrollEl.value))
    }
    scheduleListPagesUpdate()
  })
}

const hasActiveFilters = computed(() => {
  const priceChanged = (
    localFilters.value.priceMin > props.priceBoundMin
    || localFilters.value.priceMax < props.priceBoundMax
  )

  return (
    priceChanged
    || localFilters.value.ratings.length > 0
    || localFilters.value.amenities.length > 0
    || localFilters.value.hasMeals !== ''
    || localFilters.value.sort !== DEFAULT_SEARCH_FILTERS.sort
  )
})

function closeMobile() {
  emit('update:mobileOpen', false)
}

const scrollEl = ref<HTMLElement | null>(null)
const listPageCount = ref(1)
const listPageIndex = ref(0)
let listResizeObserver: ResizeObserver | null = null

function getListMaxScroll(el: HTMLElement) {
  return Math.max(0, el.scrollHeight - el.clientHeight)
}

function getListPageCount(el: HTMLElement) {
  const pageSize = el.clientHeight || 1
  const maxScroll = getListMaxScroll(el)

  if (maxScroll <= 8) {
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
  const el = scrollEl.value
  if (!el) {
    listPageCount.value = 1
    listPageIndex.value = 0
    return
  }

  const maxScroll = getListMaxScroll(el)
  if (el.scrollTop > maxScroll) {
    el.scrollTop = maxScroll
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
  const el = scrollEl.value
  if (!el) {
    return
  }

  listPageIndex.value = getListPageIndex(el, listPageCount.value)
}

function scrollListToPage(index: number) {
  const el = scrollEl.value
  if (!el || listPageCount.value <= 1) {
    return
  }

  const maxScroll = getListMaxScroll(el)
  const top = Math.round((index / (listPageCount.value - 1)) * maxScroll)

  el.scrollTo({ top, behavior: 'smooth' })
  listPageIndex.value = index
}

watch(
  [
    () => attributeGroups.value.length,
    attributesPending,
    attributesRequested,
    expandedGroups,
  ],
  () => {
    if (!props.noScroll) {
      scheduleListPagesUpdate()
    }
  },
  { deep: true },
)

watch(scrollEl, (el) => {
  if (props.noScroll || !listResizeObserver) {
    return
  }

  listResizeObserver.disconnect()

  if (el) {
    listResizeObserver.observe(el)
    const content = el.firstElementChild
    if (content) {
      listResizeObserver.observe(content)
    }
    updateListPages()
  }
})

watch(() => props.noScroll, (disabled) => {
  if (disabled) {
    listPageCount.value = 1
    listPageIndex.value = 0
    listResizeObserver?.disconnect()
    window.removeEventListener('resize', scheduleListPagesUpdate)
    return
  }

  window.addEventListener('resize', scheduleListPagesUpdate)

  if (import.meta.client && typeof ResizeObserver !== 'undefined' && !listResizeObserver) {
    listResizeObserver = new ResizeObserver(() => {
      updateListPages()
    })
  }

  scheduleListPagesUpdate()
  void nextTick(() => {
    if (scrollEl.value && listResizeObserver) {
      listResizeObserver.observe(scrollEl.value)
      const content = scrollEl.value.firstElementChild
      if (content) {
        listResizeObserver.observe(content)
      }
    }
  })
})

onMounted(() => {
  void onAmenitiesOpen()

  if (props.noScroll) {
    return
  }

  window.addEventListener('resize', scheduleListPagesUpdate)

  if (import.meta.client && typeof ResizeObserver !== 'undefined') {
    listResizeObserver = new ResizeObserver(() => {
      updateListPages()
    })

    void nextTick(() => {
      if (scrollEl.value) {
        listResizeObserver?.observe(scrollEl.value)
        const content = scrollEl.value.firstElementChild
        if (content) {
          listResizeObserver?.observe(content)
        }
      }
      updateListPages()
    })
  }
  else {
    scheduleListPagesUpdate()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', scheduleListPagesUpdate)
  listResizeObserver?.disconnect()
  listResizeObserver = null
})
</script>

<template>
  <aside
    class="search-filters"
    :class="{
      'search-filters--mobile-open': mobileOpen,
      'search-filters--no-scroll': noScroll,
    }"
    @click.self="closeMobile"
  >
    <div class="search-filters__shell">
      <div
        v-if="!noScroll"
        class="search-filters__dots"
        :class="{ 'search-filters__dots--hidden': listPageCount <= 1 }"
        role="tablist"
        aria-label="Страницы фильтров"
        :aria-hidden="listPageCount <= 1"
      >
        <button
          v-for="page in listPageCount"
          :key="page"
          type="button"
          class="search-filters__dot"
          :class="{ 'search-filters__dot--active': page - 1 === listPageIndex }"
          :aria-label="`Страница ${page}`"
          :aria-current="page - 1 === listPageIndex ? 'true' : undefined"
          :tabindex="listPageCount > 1 ? 0 : -1"
          @click="scrollListToPage(page - 1)"
        />
      </div>

      <div class="search-filters__panel">
        <CommonModalCloseButton
          class="search-filters__modal-close"
          aria-label="Закрыть фильтры"
          @click="closeMobile"
        />

        <div
          ref="scrollEl"
          class="search-filters__body"
          @scroll.passive="onListScroll"
        >
          <div class="search-filters__content">
        <div class="search-filters__header">
          <h2 class="search-filters__title">
            Фильтры
          </h2>
        </div>

        <SearchFiltersFilterSection
          class="search-filters__group"
          title="По стоимости"
          default-open
        >
          <SearchFiltersPriceFilter
            :bound-min="priceBoundMin"
            :bound-max="priceBoundMax"
            :price-min="localFilters.priceMin"
            :price-max="localFilters.priceMax"
            @update:price-min="updateField('priceMin', $event)"
            @update:price-max="updateField('priceMax', $event)"
          />
        </SearchFiltersFilterSection>

        <SearchFiltersFilterSection
          class="search-filters__group"
          title="Рейтинг"
          default-open
        >
          <SearchFiltersRatingFilter
            :model-value="localFilters.ratings"
            :counts="ratingCounts"
            @update:model-value="updateField('ratings', $event)"
          />
        </SearchFiltersFilterSection>

        <SearchFiltersFilterSection
          class="search-filters__group"
          title="Услуги на базе"
          default-open
          @open="onAmenitiesOpen"
        >
          <div
            v-if="attributesPending || !attributesRequested"
            class="search-filters__loading"
            aria-live="polite"
          >
            <CommonSpinner variant="ring" size="sm" label="Загрузка атрибутов" />
          </div>

          <div
            v-else
            class="search-filters__attributes"
          >
            <div
              v-for="group in attributeGroups"
              :key="group.id"
              class="search-filters__attr-group"
            >
              <h3 class="search-filters__attr-title">
                {{ group.name }}
              </h3>

              <ul class="search-filters__list">
                <li
                  v-for="term in visibleTerms(group)"
                  :key="term.id"
                >
                  <label class="search-filters__checkbox">
                    <input
                      type="checkbox"
                      :checked="localFilters.amenities.includes(termId(term))"
                      @change="toggleAmenity(termId(term))"
                    >
                    <span class="search-filters__checkmark" />
                    <span>{{ termLabel(term) }}</span>
                  </label>
                </li>
              </ul>

              <button
                v-if="hasMoreTerms(group)"
                type="button"
                class="search-filters__more"
                @click="toggleGroupExpand(group.id)"
              >
                {{ expandedGroups[group.id] ? 'Скрыть' : 'Еще' }}
                <svg
                  class="search-filters__more-icon"
                  :class="{ 'search-filters__more-icon--open': expandedGroups[group.id] }"
                  viewBox="0 0 12 8"
                  aria-hidden="true"
                >
                  <path
                    d="M1 2 6 6.5 11 2"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </SearchFiltersFilterSection>

        <!-- <SearchFiltersFilterSection
          class="search-filters__group"
          title="Питание на базе"
        >
          <div class="search-filters__radios">
            <label class="search-filters__radio">
              <input
                type="radio"
                name="meals"
                value="yes"
                :checked="localFilters.hasMeals === 'yes'"
                @change="updateField('hasMeals', 'yes')"
              >
              <span class="search-filters__radio-mark" />
              <span>Есть</span>
            </label>
            <label class="search-filters__radio">
              <input
                type="radio"
                name="meals"
                value="no"
                :checked="localFilters.hasMeals === 'no'"
                @change="updateField('hasMeals', 'no')"
              >
              <span class="search-filters__radio-mark" />
              <span>Нет</span>
            </label>
          </div>
        </SearchFiltersFilterSection> -->
          </div>
        </div>

      </div>
    </div>

    <Teleport to="body">
      <button
        v-if="hasActiveFilters"
        type="button"
        class="search-filters-fab"
        @click="handleReset"
      >
        Сбросить фильтры
      </button>
    </Teleport>
  </aside>
</template>

<style scoped>
.search-filters {
  position: relative;
}

.search-filters__shell {
  display: flex;
  align-items: stretch;
  gap: 12px;
  min-width: 0;
  width: 100%;
  height: 100%;
}

.search-filters__dots {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  align-self: center;
  gap: 8px;
  width: 10px;
  padding: 4px 0;
  z-index: 2;
}

.search-filters__dots--hidden {
  visibility: hidden;
  pointer-events: none;
}

.search-filters__dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  padding: 0;
  border: 1px solid rgb(28 33 28 / 25%);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.search-filters__dot--active {
  border-color: #e8883a;
  background: #e8883a;
}

.search-filters__dot:hover:not(.search-filters__dot--active) {
  border-color: rgb(28 33 28 / 45%);
}

.search-filters__panel {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 0;
  min-width: 0;
  min-height: 0;
  padding: 24px;
  border: 1px solid #bfbfbf;
  border-radius: var(--wh-radius-lg);
  background: var(--wh-white);
}

.search-filters__body {
  flex: 1 1 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding-right: 10px;
  scrollbar-gutter: stable;
  overscroll-behavior: contain;
}

.search-filters__content {
  display: block;
  width: 100%;
}

.search-filters__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 40px;
}

.search-filters__title {
  margin: 0;
  font-family: "Inter", sans-serif;
  font-size: 24px;
  font-weight: 600;
  line-height: 120%;
  letter-spacing: -0.05em;
  color: var(--wh-gray-900);
}

:deep(.search-filters__modal-close) {
  display: none;
}

.search-filters__group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-filters__group + .search-filters__group {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #bfbfbf;
}

.search-filters__state {
  margin: 0;
  font-size: 0.875rem;
  color: var(--wh-gray-500);
}

.search-filters__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
}

.search-filters__attributes {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.search-filters__attr-group + .search-filters__attr-group {
  margin-top: 16px;
}

.search-filters__attr-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-filters__attr-title {
  margin: 0;
  font-family: "Inter", sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 130%;
  letter-spacing: -0.05em;
  color: var(--wh-gray-900);
}

.search-filters__label {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--wh-gray-900);
}

.search-filters__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.search-filters__more {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--wh-orange-500);
  font: inherit;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
}

.search-filters__more-icon {
  width: 10px;
  height: 7px;
  transition: transform 0.2s ease;
}

.search-filters__more-icon--open {
  transform: rotate(180deg);
}

.search-filters__checkbox,
.search-filters__radio {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9375rem;
  color: var(--wh-gray-700);
  cursor: pointer;
}

.search-filters__checkbox input,
.search-filters__radio input {
  position: absolute;
  top: 0;
  left: 0;
  width: 22px;
  height: 22px;
  margin: 0;
  opacity: 0;
  pointer-events: none;
}

.search-filters__checkmark,
.search-filters__radio-mark {
  position: relative;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border: 1px solid var(--wh-gray-300);
  border-radius: 4px;
  background: var(--wh-white);
}

.search-filters__checkbox input:checked + .search-filters__checkmark::after,
.search-filters__radio input:checked + .search-filters__radio-mark::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 16px;
  height: 16px;
  border-radius: 2px;
  background: var(--wh-orange-500);
  transform: translate(-50%, -50%);
}

.search-filters__radios {
  display: flex;
  flex-direction: column;
  gap: 10px;
}


@media (--wh-desktop) {
  .search-filters {
    position: sticky;
    top: 96px;
    align-self: start;
    height: calc(100vh - 112px);
    height: calc(100dvh - 112px);
    max-height: calc(100vh - 112px);
    max-height: calc(100dvh - 112px);
  }

  .search-filters__panel {
    height: 100%;
    max-height: 100%;
    overflow: hidden;
  }

  .search-filters--no-scroll {
    height: auto;
    max-height: none;
  }

  .search-filters--no-scroll .search-filters__panel {
    height: auto;
    max-height: none;
    overflow: visible;
  }

  .search-filters--no-scroll .search-filters__body {
    flex: none;
    overflow: visible;
    padding-right: 0;
    scrollbar-gutter: auto;
  }
}

@media (--wh-tablet) {
  .search-filters {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(17, 24, 39, 0.45);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }

  .search-filters--mobile-open {
    opacity: 1;
    pointer-events: auto;
  }

  .search-filters__shell {
    width: min(520px, 100%);
    max-height: calc(100vh - 48px);
    max-height: calc(100dvh - 48px);
  }

  .search-filters__panel {
    width: auto;
    max-width: none;
    max-height: 100%;
    overflow: hidden;
    box-shadow: var(--wh-shadow);
  }

  .search-filters--no-scroll .search-filters__shell {
    max-height: none;
  }

  .search-filters--no-scroll .search-filters__panel {
    max-height: none;
    overflow: visible;
  }

  .search-filters--no-scroll .search-filters__body {
    flex: none;
    overflow: visible;
    padding-right: 0;
    scrollbar-gutter: auto;
  }

  :deep(.search-filters__modal-close) {
    display: flex;
  }
}

@media (--wh-mobile) {
  .search-filters {
    position: static;
    inset: auto;
    z-index: auto;
    display: none;
    align-items: stretch;
    justify-content: flex-start;
    padding: 0;
    background: transparent;
    opacity: 1;
    pointer-events: auto;
    transition: none;
  }

  .search-filters--mobile-open {
    display: block;
    opacity: 1;
    pointer-events: auto;
  }

  .search-filters__shell {
    display: block;
    width: 100%;
    height: auto;
    max-height: none;
  }

  .search-filters__dots {
    display: none;
  }

  .search-filters__panel {
    width: auto;
    max-width: none;
    height: auto;
    max-height: none;
    overflow: visible;
    box-shadow: none;
  }

  .search-filters__body {
    flex: none;
    max-height: none;
    overflow: visible;
    padding-right: 0;
    scrollbar-gutter: auto;
  }
}
</style>

<style>
/* Teleport to body — без scoped, иначе fixed-стили могут не примениться */
.search-filters-fab {
  position: fixed;
  right: max(24px, env(safe-area-inset-right, 0px));
  bottom: max(24px, env(safe-area-inset-bottom, 0px));
  z-index: 1000;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 200px;
  padding: 12px 20px;
  border: 1px solid var(--wh-orange-500);
  border-radius: 999px;
  background: var(--wh-white);
  color: var(--wh-orange-500);
  font-family: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(17, 24, 39, 0.2);
}

.search-filters-fab:hover {
  background: color-mix(in srgb, var(--wh-orange-500) 8%, var(--wh-white));
}

@media (max-width: 640px) {
  .search-filters-fab {
    right: max(12px, env(safe-area-inset-right, 0px));
    bottom: max(16px, env(safe-area-inset-bottom, 0px));
    min-width: 0;
    padding-inline: 16px;
  }
}
</style>
