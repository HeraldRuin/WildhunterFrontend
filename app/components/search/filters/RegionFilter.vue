<script setup lang="ts">
import type { SearchLocation } from '~/types/api'

const PREVIEW_LIMIT = 5

const model = defineModel<string[]>({ required: true })

const { location: locationApi } = useApi()

const expanded = ref(false)

const { data: locations, pending } = useAsyncData<SearchLocation[]>(
  'search-locations',
  () => locationApi.getLocationItems(),
  {
    lazy: true,
    default: () => [],
  },
)

const visibleLocations = computed(() => {
  const list = locations.value ?? []
  if (expanded.value) {
    return list
  }

  return list.slice(0, PREVIEW_LIMIT)
})

const hasMore = computed(() => (locations.value?.length ?? 0) > PREVIEW_LIMIT)

function locationId(item: SearchLocation) {
  return String(item.id)
}

function toggle(id: string) {
  model.value = model.value.includes(id)
    ? model.value.filter(item => item !== id)
    : [...model.value, id]
}

function toggleExpand() {
  expanded.value = !expanded.value
}
</script>

<template>
  <div class="search-filters-region">
    <div
      v-if="pending"
      class="search-filters-region__loading"
      aria-live="polite"
    >
      <CommonSpinner variant="ring" size="sm" label="Загрузка регионов" />
    </div>

    <template v-else>
      <ul class="search-filters-region__list">
        <li
          v-for="item in visibleLocations"
          :key="item.id"
        >
          <label
            class="search-filters-region__option"
            @click.prevent="toggle(locationId(item))"
          >
            <input
              type="checkbox"
              :checked="model.includes(locationId(item))"
              tabindex="-1"
              @click.prevent
            >
            <span class="search-filters-region__checkmark" />
            <span>{{ item.name }}</span>
          </label>
        </li>
      </ul>

      <button
        v-if="hasMore"
        type="button"
        class="search-filters-region__more"
        @click="toggleExpand"
      >
        {{ expanded ? 'Скрыть' : 'Еще' }}
        <svg
          class="search-filters-region__more-icon"
          :class="{ 'search-filters-region__more-icon--open': expanded }"
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
    </template>
  </div>
</template>

<style scoped>
.search-filters-region {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-filters-region__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
}

.search-filters-region__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.search-filters-region__option {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9375rem;
  color: var(--wh-gray-900);
  cursor: pointer;
}

.search-filters-region__option input {
  position: absolute;
  top: 0;
  left: 0;
  width: 22px;
  height: 22px;
  margin: 0;
  opacity: 0;
  pointer-events: none;
}

.search-filters-region__checkmark {
  position: relative;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border: 1px solid #bfbfbf;
  border-radius: 4px;
  background: var(--wh-white);
}

.search-filters-region__option input:checked + .search-filters-region__checkmark::after {
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

.search-filters-region__more {
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

.search-filters-region__more-icon {
  width: 10px;
  height: 7px;
  transition: transform 0.2s ease;
}

.search-filters-region__more-icon--open {
  transform: rotate(180deg);
}
</style>
