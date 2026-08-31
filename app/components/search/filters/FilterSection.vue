<script setup lang="ts">
const props = withDefaults(defineProps<{
  title: string
  defaultOpen?: boolean
}>(), {
  defaultOpen: false,
})

const emit = defineEmits<{
  open: []
}>()

const isOpen = ref(props.defaultOpen)

function toggle() {
  isOpen.value = !isOpen.value

  if (isOpen.value) {
    emit('open')
  }
}
</script>

<template>
  <div
    class="search-filters-section"
    :class="{ 'search-filters-section--open': isOpen }"
  >
    <button
      type="button"
      class="search-filters-section__toggle"
      :aria-expanded="isOpen"
      @click="toggle"
    >
      <span class="search-filters-section__title">{{ title }}</span>
      <svg
        class="search-filters-section__chevron"
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

    <div
      v-show="isOpen"
      class="search-filters-section__body"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.search-filters-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-filters-section__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--wh-gray-900);
  cursor: pointer;
  text-align: left;
}

.search-filters-section__title {
  margin: 0;
  font-family: "Inter", sans-serif;
  font-size: 20px;
  font-weight: 600;
  line-height: 130%;
  letter-spacing: -0.05em;
  color: var(--wh-gray-900);
}

.search-filters-section__chevron {
  flex-shrink: 0;
  width: 12px;
  height: 8px;
  color: #1c211c;
  transition: transform 0.2s ease;
  transform: rotate(0deg);
}

.search-filters-section--open > .search-filters-section__toggle > .search-filters-section__chevron {
  transform: rotate(180deg);
}

.search-filters-section__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
