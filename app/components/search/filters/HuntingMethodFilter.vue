<script setup lang="ts">
import { HUNTING_METHOD_OPTIONS } from '~/utils/search'

const model = defineModel<string[]>({ required: true })

function toggle(value: string) {
  model.value = model.value.includes(value)
    ? model.value.filter(item => item !== value)
    : [...model.value, value]
}
</script>

<template>
  <ul class="search-filters-hunting-method__list">
    <li
      v-for="option in HUNTING_METHOD_OPTIONS"
      :key="option.value"
    >
      <label
        class="search-filters-hunting-method__option"
        @click.prevent="toggle(option.value)"
      >
        <input
          type="checkbox"
          :checked="model.includes(option.value)"
          tabindex="-1"
          @click.prevent
        >
        <span class="search-filters-hunting-method__checkmark" />
        <span>{{ option.label }}</span>
      </label>
    </li>
  </ul>
</template>

<style scoped>
.search-filters-hunting-method__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.search-filters-hunting-method__option {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9375rem;
  color: var(--wh-gray-900);
  cursor: pointer;
}

.search-filters-hunting-method__option input {
  position: absolute;
  top: 0;
  left: 0;
  width: 22px;
  height: 22px;
  margin: 0;
  opacity: 0;
  pointer-events: none;
}

.search-filters-hunting-method__checkmark {
  position: relative;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border: 1px solid #bfbfbf;
  border-radius: 4px;
  background: var(--wh-white);
}

.search-filters-hunting-method__option input:checked + .search-filters-hunting-method__checkmark::after {
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
</style>
