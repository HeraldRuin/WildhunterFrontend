<script setup lang="ts">
const props = defineProps<{
  currentPage: number
  totalPages: number
}>()

const emit = defineEmits<{
  change: [page: number]
}>()

const pages = computed(() => {
  const { currentPage, totalPages } = props

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const items: Array<number | 'ellipsis'> = [1]

  if (currentPage > 3) {
    items.push('ellipsis')
  }

  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  for (let page = start; page <= end; page += 1) {
    items.push(page)
  }

  if (currentPage < totalPages - 2) {
    items.push('ellipsis')
  }

  items.push(totalPages)

  return items
})

function goTo(page: number) {
  if (page < 1 || page > props.totalPages || page === props.currentPage) {
    return
  }

  emit('change', page)
}
</script>

<template>
  <nav v-if="totalPages > 1" class="search-pagination" aria-label="Пагинация">
    <button
      type="button"
      class="search-pagination__arrow"
      :disabled="currentPage <= 1"
      aria-label="Предыдущая страница"
      @click="goTo(currentPage - 1)"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
    </button>

    <template v-for="(page, index) in pages" :key="`${page}-${index}`">
      <span v-if="page === 'ellipsis'" class="search-pagination__ellipsis">...</span>
      <button
        v-else
        type="button"
        class="search-pagination__page"
        :class="{ 'search-pagination__page--active': page === currentPage }"
        :aria-current="page === currentPage ? 'page' : undefined"
        @click="goTo(page)"
      >
        {{ page }}
      </button>
    </template>

    <button
      type="button"
      class="search-pagination__arrow"
      :disabled="currentPage >= totalPages"
      aria-label="Следующая страница"
      @click="goTo(currentPage + 1)"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
    </button>
  </nav>
</template>

<style scoped>
.search-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.search-pagination__page,
.search-pagination__arrow,
.search-pagination__ellipsis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 0.9375rem;
  font-weight: 600;
}

.search-pagination__page,
.search-pagination__arrow {
  border: 1px solid var(--wh-gray-200);
  background: var(--wh-white);
  color: var(--wh-gray-700);
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.search-pagination__page:hover,
.search-pagination__arrow:hover:not(:disabled) {
  border-color: var(--wh-orange-500);
  color: var(--wh-orange-text);
}

.search-pagination__page--active {
  border-color: var(--wh-orange-500);
  background: var(--wh-orange-500);
  color: var(--wh-white);
}

.search-pagination__arrow:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.search-pagination__ellipsis {
  color: var(--wh-gray-400);
}
</style>
