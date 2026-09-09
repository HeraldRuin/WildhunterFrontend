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

  let start = Math.max(2, currentPage - 1)
  let end = Math.min(totalPages - 1, currentPage + 1)

  if (currentPage <= 4) {
    start = 2
    end = Math.min(5, totalPages - 1)
  }

  if (currentPage >= totalPages - 3) {
    start = Math.max(2, totalPages - 4)
    end = totalPages - 1
  }

  const items: Array<number | 'ellipsis'> = [1]

  if (start > 2) {
    items.push('ellipsis')
  }

  for (let page = start; page <= end; page += 1) {
    items.push(page)
  }

  if (end < totalPages - 1) {
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
  <nav v-if="totalPages > 1" class="pagination" aria-label="Пагинация">
    <template v-for="(page, index) in pages" :key="`${page}-${index}`">
      <span v-if="page === 'ellipsis'" class="pagination__ellipsis" aria-hidden="true">...</span>
      <button
        v-else
        type="button"
        class="pagination__page"
        :class="{ 'pagination__page--active': page === currentPage }"
        :aria-current="page === currentPage ? 'page' : undefined"
        :aria-label="`Страница ${page}`"
        @click="goTo(page)"
      >
        {{ page }}
      </button>
    </template>
  </nav>
</template>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pagination__page,
.pagination__ellipsis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 40px;
  height: 40px;
  margin: 0;
  padding: 0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1;
}

.pagination__page {
  border: 1px solid #dddddd;
  background: #ffffff;
  color: #c8c8c8;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}

.pagination__page:hover:not(.pagination__page--active) {
  border-color: #1c211c;
  color: #1c211c;
}

.pagination__page--active {
  border-color: #1c211c;
  color: #1c211c;
  font-weight: 700;
  cursor: default;
}

.pagination__ellipsis {
  border: none;
  background: transparent;
  color: #c8c8c8;
  user-select: none;
}
</style>
