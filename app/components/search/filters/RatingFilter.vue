<script setup lang="ts">
import type { ReviewRatingOption } from '~/types/api'

const model = defineModel<string[]>({ required: true })

const { reviews: reviewsApi } = useApi()

defineProps<{
  counts: Record<string, number>
}>()

const { data: options, pending } = useAsyncData<ReviewRatingOption[]>(
  'search-review-ratings',
  () => reviewsApi.getRatingItems(),
  {
    lazy: true,
    default: () => [],
  },
)

function toggle(value: string) {
  model.value = model.value.includes(value)
    ? model.value.filter(item => item !== value)
    : [...model.value, value]
}
</script>

<template>
  <div class="search-filters-rating">
    <p v-if="pending" class="search-filters-rating__state">
      Загрузка...
    </p>

    <ul v-else class="search-filters-rating__list">
      <li
        v-for="option in options"
        :key="option.value"
      >
        <label
          class="search-filters-rating__option"
          @click.prevent="toggle(option.value)"
        >
          <input
            type="checkbox"
            :checked="model.includes(option.value)"
            tabindex="-1"
            @click.prevent
          >
          <span class="search-filters-rating__checkmark" />
          <span>{{ option.label }}</span>
          <span class="search-filters-rating__count">
            {{ counts[option.value] ?? 0 }}
          </span>
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

.search-filters-rating__state {
  margin: 0;
  font-size: 0.875rem;
  color: var(--wh-gray-500);
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
  gap: 6px;
  font-size: 0.9375rem;
  color: var(--wh-gray-900);
  cursor: pointer;
}

.search-filters-rating__checkmark {
  margin-right: 4px;
}

.search-filters-rating__count {
  white-space: nowrap;
}

.search-filters-rating__option input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.search-filters-rating__checkmark {
  position: relative;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border: 1px solid #bfbfbf;
  border-radius: 4px;
  background: var(--wh-white);
}

.search-filters-rating__option input:checked + .search-filters-rating__checkmark::after {
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
