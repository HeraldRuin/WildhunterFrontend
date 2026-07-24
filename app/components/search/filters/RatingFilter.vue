<script setup lang="ts">
import { SEARCH_RATING_OPTIONS } from '~/utils/search'

const model = defineModel<number[]>({ required: true })

function toggle(value: number) {
  model.value = model.value.includes(value)
    ? model.value.filter(item => item !== value)
    : [...model.value, value]
}
</script>

<template>
  <div class="search-filters-rating">
    <p class="search-filters-rating__title">Рейтинг</p>
    <ul class="search-filters-rating__list">
      <li
        v-for="option in SEARCH_RATING_OPTIONS"
        :key="option.value"
      >
        <label class="search-filters-rating__option">
          <input
            type="checkbox"
            :checked="model.includes(option.value)"
            @change="toggle(option.value)"
          >
          <span class="search-filters-rating__checkmark" />
          <span>{{ option.label }}</span>
        </label>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.search-filters-rating {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-filters-rating__title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--wh-gray-900);
}

.search-filters-rating__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.search-filters-rating__option {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9375rem;
  color: var(--wh-gray-900);
  cursor: pointer;
}

.search-filters-rating__option input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.search-filters-rating__checkmark {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border: 1.5px solid #bfbfbf;
  border-radius: 4px;
  background: var(--wh-white);
  transition: border-color 0.15s ease, background 0.15s ease;
}

.search-filters-rating__option input:checked + .search-filters-rating__checkmark {
  border-color: var(--wh-orange-500);
  background: var(--wh-orange-500);
  box-shadow: inset 0 0 0 3px var(--wh-white);
}
</style>
