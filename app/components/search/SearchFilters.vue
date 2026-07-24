<script setup lang="ts">
import type { SearchFiltersState, SearchSortOption } from '~/types/api'
import {
  DEFAULT_SEARCH_FILTERS,
  SEARCH_AMENITIES,
} from '~/utils/search'

const props = withDefaults(defineProps<{
  modelValue: SearchFiltersState
  mobileOpen?: boolean
  priceBoundMin?: number
  priceBoundMax?: number
}>(), {
  mobileOpen: false,
  priceBoundMin: 0,
  priceBoundMax: 15000,
})

const emit = defineEmits<{
  'update:modelValue': [value: SearchFiltersState]
  'update:mobileOpen': [value: boolean]
  reset: []
}>()

const sortOptions: Array<{ value: SearchSortOption, label: string }> = [
  { value: 'recommended', label: 'Рекомендованные' },
  { value: 'price_asc', label: 'Сначала дешёвые' },
  { value: 'price_desc', label: 'Сначала дорогие' },
  { value: 'rating', label: 'По рейтингу' },
]

const localFilters = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

function updateField<K extends keyof SearchFiltersState>(
  field: K,
  value: SearchFiltersState[K],
) {
  localFilters.value = {
    ...localFilters.value,
    [field]: value,
  }
}

function toggleAmenity(id: string) {
  const amenities = localFilters.value.amenities.includes(id)
    ? localFilters.value.amenities.filter(item => item !== id)
    : [...localFilters.value.amenities, id]

  updateField('amenities', amenities)
}

function handleReset() {
  emit('update:modelValue', {
    ...DEFAULT_SEARCH_FILTERS,
    priceMin: props.priceBoundMin,
    priceMax: props.priceBoundMax,
  })
  emit('reset')
}

function closeMobile() {
  emit('update:mobileOpen', false)
}
</script>

<template>
  <aside
    class="search-filters"
    :class="{ 'search-filters--mobile-open': mobileOpen }"
  >
    <div class="search-filters__panel">
      <div class="search-filters__header">
        <h2 class="search-filters__title">Фильтры</h2>
        <button
          type="button"
          class="search-filters__close"
          aria-label="Закрыть фильтры"
          @click="closeMobile"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <SearchFiltersFilterSection
        class="search-filters__group"
        title="Сортировка"
      >
        <div class="search-filters__select-wrap">
          <select
            id="search-sort"
            :value="localFilters.sort"
            class="search-filters__select"
            @change="updateField('sort', ($event.target as HTMLSelectElement).value as SearchSortOption)"
          >
            <option
              v-for="option in sortOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
          <svg class="search-filters__chevron" viewBox="0 0 8 13" aria-hidden="true">
            <path d="M1.5 4.5 4 7.5 6.5 4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
      </SearchFiltersFilterSection>

      <SearchFiltersFilterSection
        class="search-filters__group"
        title="По стоимости"
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
      >
        <SearchFiltersRatingFilter
          :model-value="localFilters.ratings"
          @update:model-value="updateField('ratings', $event)"
        />
      </SearchFiltersFilterSection>

      <SearchFiltersFilterSection
        class="search-filters__group"
        title="Услуги на базе"
      >
        <ul class="search-filters__list">
          <li v-for="amenity in SEARCH_AMENITIES" :key="amenity.id">
            <label class="search-filters__checkbox">
              <input
                type="checkbox"
                :checked="localFilters.amenities.includes(amenity.id)"
                @change="toggleAmenity(amenity.id)"
              >
              <span class="search-filters__checkmark" />
              <span>{{ amenity.label }}</span>
            </label>
          </li>
        </ul>
      </SearchFiltersFilterSection>

      <SearchFiltersFilterSection
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
      </SearchFiltersFilterSection>

      <button type="button" class="search-filters__reset" @click="handleReset">
        Сбросить
      </button>
    </div>
  </aside>
</template>

<style scoped>
.search-filters {
  position: relative;
}

.search-filters__panel {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 24px;
  border: 1px solid #bfbfbf;
  border-radius: var(--wh-radius-lg);
  background: var(--wh-white);
}

.search-filters__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 24px;
}

.search-filters__title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 800;
  color: var(--wh-gray-900);
}

.search-filters__close {
  display: none;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid var(--wh-gray-200);
  border-radius: 999px;
  background: var(--wh-white);
  color: var(--wh-gray-900);
  cursor: pointer;
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

.search-filters__label {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--wh-gray-900);
}

.search-filters__select-wrap {
  position: relative;
}

.search-filters__select {
  width: 100%;
  padding: 12px 36px 12px 14px;
  border: 1px solid var(--wh-gray-200);
  border-radius: 12px;
  background: var(--wh-white);
  color: var(--wh-gray-900);
  appearance: none;
  cursor: pointer;
}

.search-filters__chevron {
  position: absolute;
  top: 50%;
  right: 14px;
  width: 7px;
  height: 13px;
  color: var(--wh-gray-600);
  pointer-events: none;
  transform: translateY(-50%);
}

.search-filters__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.search-filters__checkbox,
.search-filters__radio {
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
  opacity: 0;
  pointer-events: none;
}

.search-filters__checkmark,
.search-filters__radio-mark {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border: 1.5px solid var(--wh-gray-300);
  border-radius: 4px;
  background: var(--wh-white);
  transition: border-color 0.15s ease, background 0.15s ease;
}

.search-filters__radio-mark {
  border-radius: 50%;
}

.search-filters__checkbox input:checked + .search-filters__checkmark,
.search-filters__radio input:checked + .search-filters__radio-mark {
  border-color: var(--wh-orange-500);
  background: var(--wh-orange-500);
  box-shadow: inset 0 0 0 3px var(--wh-white);
}

.search-filters__radios {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.search-filters__reset {
  align-self: flex-start;
  margin-top: 24px;
  padding: 24px 0 0;
  border: none;
  border-top: 1px solid #bfbfbf;
  background: transparent;
  color: #d64545;
  font: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
}

@media (min-width: 1025px) {
  .search-filters__panel {
    position: sticky;
    top: 96px;
  }
}

@media (max-width: 1024px) {
  .search-filters {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    justify-content: flex-end;
    background: rgba(17, 24, 39, 0.45);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }

  .search-filters--mobile-open {
    opacity: 1;
    pointer-events: auto;
  }

  .search-filters__panel {
    width: min(100%, 380px);
    height: 100%;
    overflow-y: auto;
    border: none;
    border-radius: 0;
    transform: translateX(100%);
    transition: transform 0.25s ease;
  }

  .search-filters--mobile-open .search-filters__panel {
    transform: translateX(0);
  }

  .search-filters__close {
    display: grid;
  }
}
</style>
