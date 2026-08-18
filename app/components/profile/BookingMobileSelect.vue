<script setup lang="ts">
import type { BookingHistoryItem } from '~/types/booking'

const props = defineProps<{
  items: BookingHistoryItem[]
}>()

const selectedId = defineModel<number | null>({ default: null })

const isOpen = ref(false)
const rootRef = ref<HTMLElement | null>(null)

const selectedItem = computed(() =>
  props.items.find(item => item.id === selectedId.value) ?? null,
)

const selectedNumber = computed(() => selectedItem.value?.number ?? '')

watch(
  () => props.items.map(item => item.id),
  (ids) => {
    if (!ids.length) {
      selectedId.value = null
      isOpen.value = false
      return
    }

    if (selectedId.value === null || !ids.includes(selectedId.value)) {
      selectedId.value = ids[0] ?? null
    }
  },
  { immediate: true },
)

function toggle() {
  if (!props.items.length) return

  isOpen.value = !isOpen.value
}

function select(id: number) {
  selectedId.value = id
  isOpen.value = false
}

function handleDocumentClick(event: MouseEvent) {
  if (!rootRef.value?.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <div
    v-if="items.length"
    ref="rootRef"
    class="booking-mobile-select"
    :class="{ 'booking-mobile-select--open': isOpen }"
  >
    <button
      type="button"
      class="booking-mobile-select__trigger"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      aria-label="Номер брони"
      @click.stop="toggle"
    >
      <span class="booking-mobile-select__label">№ брони</span>
      <span class="booking-mobile-select__value-wrap">
        <span class="booking-mobile-select__value">{{ selectedNumber }}</span>
        <svg class="booking-mobile-select__chevron" viewBox="0 0 12 8" aria-hidden="true">
          <path
            d="M1 2 6 6.5 11 2"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </button>

    <ul
      v-if="isOpen"
      class="booking-mobile-select__list"
      role="listbox"
      aria-label="Список броней"
    >
      <li v-for="item in items" :key="item.id">
        <button
          type="button"
          class="booking-mobile-select__option"
          role="option"
          :aria-selected="item.id === selectedId"
          :class="{ 'booking-mobile-select__option--active': item.id === selectedId }"
          @click.stop="select(item.id)"
        >
          {{ item.number }}
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.booking-mobile-select {
  display: none;
  position: relative;
  width: 100%;
  margin-bottom: 16px;
}

.booking-mobile-select--open {
  z-index: 20;
}

.booking-mobile-select__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 44px;
  padding: 10px 16px 10px 20px;
  border: none;
  border-radius: 999px;
  background: var(--wh-orange-500);
  box-shadow: 0 4px 14px rgba(17, 24, 39, 0.12);
  color: var(--wh-white);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  cursor: pointer;
}

.booking-mobile-select__label,
.booking-mobile-select__value {
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
}

.booking-mobile-select__value-wrap {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.booking-mobile-select__chevron {
  flex-shrink: 0;
  width: 12px;
  height: 8px;
  color: var(--wh-white);
  transition: transform 0.2s ease;
}

.booking-mobile-select--open .booking-mobile-select__chevron {
  transform: rotate(180deg);
}

.booking-mobile-select__list {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 50;
  margin: 0;
  padding: 6px 8px;
  list-style: none;
  max-height: 280px;
  overflow-x: hidden;
  overflow-y: auto;
  border: 1px solid var(--wh-gray);
  border-radius: 14px;
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
}

.booking-mobile-select__option {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px 14px;
  border: none;
  border-radius: 10px;
  appearance: none;
  background: transparent;
  color: var(--wh-black-text);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.2;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.booking-mobile-select__option:hover,
.booking-mobile-select__option:focus-visible {
  background: var(--wh-orange-500);
  color: var(--wh-white);
  outline: none;
}

.booking-mobile-select__option--active {
  color: var(--wh-orange-500);
}

.booking-mobile-select__option--active:hover,
.booking-mobile-select__option--active:focus-visible {
  color: var(--wh-white);
}

@media (--wh-mobile) {
  .booking-mobile-select {
    display: block;
  }
}
</style>
