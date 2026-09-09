<script setup lang="ts">
import type { SearchSortOption } from '~/types/api'
import { SEARCH_SORT_OPTIONS } from '~/utils/search'

const model = defineModel<SearchSortOption>({ required: true })

const options = SEARCH_SORT_OPTIONS

const isOpen = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const hoveredValue = ref<SearchSortOption | null>(null)

const selectedLabel = computed(() =>
  options.find(option => option.value === model.value)?.label ?? 'Рекомендуемые',
)

function toggle() {
  isOpen.value = !isOpen.value
  if (!isOpen.value) {
    hoveredValue.value = null
  }
}

function select(value: SearchSortOption) {
  model.value = value
  isOpen.value = false
  hoveredValue.value = null
}

function handleDocumentClick(event: MouseEvent) {
  if (!rootRef.value?.contains(event.target as Node)) {
    isOpen.value = false
    hoveredValue.value = null
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <div
    ref="rootRef"
    class="search-filters-sort"
    :class="{ 'search-filters-sort--open': isOpen }"
  >
    <label
      class="search-filters-sort__label"
      for="search-sort"
    >
      Сортировать по:
    </label>

    <div class="search-filters-sort__control">
      <button
        id="search-sort"
        type="button"
        class="search-filters-sort__trigger"
        :aria-expanded="isOpen"
        aria-haspopup="listbox"
        @click="toggle"
      >
        <span class="search-filters-sort__value">{{ selectedLabel }}</span>
        <svg class="search-filters-sort__chevron" viewBox="0 0 12 8" aria-hidden="true">
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

      <ul
        v-if="isOpen"
        class="search-filters-sort__list"
        role="listbox"
        aria-label="Сортировка"
        @mouseleave="hoveredValue = null"
      >
        <li v-for="option in options" :key="option.value">
          <button
            type="button"
            class="search-filters-sort__option"
            role="option"
            :aria-selected="option.value === model"
            :class="{
              'search-filters-sort__option--active': option.value === model,
              'search-filters-sort__option--hovered': hoveredValue === option.value,
            }"
            @mouseenter="hoveredValue = option.value"
            @click="select(option.value)"
          >
            <span class="search-filters-sort__option-dot" aria-hidden="true" />
            <span class="search-filters-sort__option-label">{{ option.label }}</span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.search-filters-sort {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-filters-sort__label {
  flex-shrink: 0;
  margin: 0;
  color: var(--wh-gray-600);
  font-family: "Inter", system-ui, sans-serif;
  font-size: 0.98rem;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.05em;
  white-space: nowrap;
  cursor: pointer;
}

.search-filters-sort__control {
  position: relative;
  flex: 0 0 auto;
  width: 340px;
  max-width: 100%;
}

.search-filters-sort__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--wh-gray);
  border-radius: 12px;
  background: var(--wh-white);
  color: var(--wh-black-text);
  font-family: "Inter", system-ui, sans-serif;
  font-size: 0.98rem;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.05em;
  text-align: left;
  cursor: pointer;
}

.search-filters-sort__value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-filters-sort__chevron {
  flex-shrink: 0;
  width: 12px;
  height: 8px;
  color: #1c211c;
  transition: transform 0.2s ease;
}

.search-filters-sort--open .search-filters-sort__chevron {
  transform: rotate(180deg);
}

.search-filters-sort__list {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  left: auto;
  z-index: 50;
  width: max-content;
  min-width: 100%;
  max-width: min(100vw - 32px, 420px);
  margin: 0;
  padding: 6px 8px;
  list-style: none;
  border: 1px solid var(--wh-gray);
  border-radius: 14px;
  background: var(--wh-white);
  color: var(--wh-black-text);
  overflow: hidden;
  box-shadow: var(--wh-shadow);
}

.search-filters-sort__option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  border: none;
  border-radius: 10px;
  appearance: none;
  background-color: transparent;
  color: var(--wh-black-text);
  font: inherit;
  font-size: 0.98rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.search-filters-sort__option-dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: transparent;
}

.search-filters-sort__option-label {
  min-width: 0;
  white-space: nowrap;
}

.search-filters-sort__option:hover,
.search-filters-sort__option--hovered,
.search-filters-sort__option:focus-visible {
  background-color: #e8883a;
  color: #ffffff;
}

.search-filters-sort__option--active .search-filters-sort__option-dot {
  background-color: #d16510;
}

.search-filters-sort__option--active:hover .search-filters-sort__option-dot,
.search-filters-sort__option--active.search-filters-sort__option--hovered .search-filters-sort__option-dot,
.search-filters-sort__option--active:focus-visible .search-filters-sort__option-dot {
  background-color: #ffffff;
}
</style>
