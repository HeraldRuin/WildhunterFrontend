<script setup lang="ts">
import type { HuntingMethod } from '~/types/api'

const model = defineModel<string[]>({ required: true })

const { hotels: hotelsApi } = useApi()

const { data: huntingMethods, pending } = useAsyncData<HuntingMethod[]>(
  'hotel-hunting-methods',
  () => hotelsApi.getHuntingMethodItems(),
  {
    lazy: true,
    default: () => [],
  },
)

function methodId(item: HuntingMethod) {
  return String(item.id)
}

function toggle(id: string) {
  model.value = model.value.includes(id)
    ? model.value.filter(item => item !== id)
    : [...model.value, id]
}
</script>

<template>
  <div class="search-filters-hunting-method">
    <div
      v-if="pending"
      class="search-filters-hunting-method__loading"
      aria-live="polite"
    >
      <CommonSpinner variant="ring" size="sm" label="Загрузка способов охоты" />
    </div>

    <ul
      v-else
      class="search-filters-hunting-method__list"
    >
      <li
        v-for="item in huntingMethods"
        :key="item.id"
      >
        <label
          class="search-filters-hunting-method__option"
          @click.prevent="toggle(methodId(item))"
        >
          <input
            type="checkbox"
            :checked="model.includes(methodId(item))"
            tabindex="-1"
            @click.prevent
          >
          <span class="search-filters-hunting-method__checkmark" />
          <span>{{ item.name }}</span>
        </label>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.search-filters-hunting-method {
  display: flex;
  flex-direction: column;
}

.search-filters-hunting-method__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
}

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
