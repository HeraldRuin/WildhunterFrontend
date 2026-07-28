<script setup lang="ts">
import type { SearchFiltersState } from '~/types/api'
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
    @click.self="closeMobile"
  >
    <div class="search-filters__panel">
      <CommonModalCloseButton
        class="search-filters__modal-close"
        aria-label="Закрыть фильтры"
        @click="closeMobile"
      />

      <div class="search-filters__header">
        <h2 class="search-filters__title">
          Фильтры
        </h2>
      </div>

      <SearchFiltersFilterSection
        class="search-filters__group"
        title="Сортировка"
      >
        <SearchFiltersSortFilter
          :model-value="localFilters.sort"
          @update:model-value="updateField('sort', $event)"
        />
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
  position: relative;
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

.search-filters__reset {
  align-self: flex-start;
  margin-top: 24px;
  padding: 0;
  border: none;
  background: transparent;
  color: #d64545;
  font: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
}

@media (--wh-desktop) {
  .search-filters__panel {
    position: sticky;
    top: 96px;
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

  .search-filters__panel {
    width: 488px;
    max-width: 100%;
    box-shadow: var(--wh-shadow);
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

  .search-filters__panel {
    width: auto;
    max-width: none;
    max-height: none;
    overflow: visible;
    box-shadow: none;
  }
}
</style>
