<script setup lang="ts">
const props = withDefaults(defineProps<{
  boundMin?: number
  boundMax?: number
}>(), {
  boundMin: 0,
  boundMax: 15000,
})

const priceMin = defineModel<number>('priceMin', { required: true })
const priceMax = defineModel<number>('priceMax', { required: true })

const minDraft = ref('')
const maxDraft = ref('')
const editingMin = ref(false)
const editingMax = ref(false)

const min = computed(() => props.boundMin)
const max = computed(() => props.boundMax)

const step = computed(() => {
  const span = max.value - min.value
  if (span <= 0) {
    return 1
  }

  for (const candidate of [500, 100, 50, 10, 1]) {
    if (span % candidate === 0) {
      return candidate
    }
  }

  return 1
})

function formatPrice(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value)
}

function displayPrice(value: number) {
  return `${formatPrice(value)}₽`
}

function parsePrice(raw: string) {
  const digits = raw.replace(/[^\d]/g, '')
  return digits ? Number(digits) : 0
}

const rangeStyle = computed(() => {
  const span = max.value - min.value || 1
  const minPercent = ((priceMin.value - min.value) / span) * 100
  const maxPercent = ((priceMax.value - min.value) / span) * 100

  return {
    background: `linear-gradient(
      to right,
      #e5e5e5 0%,
      #e5e5e5 ${minPercent}%,
      var(--wh-green) ${minPercent}%,
      var(--wh-green) ${maxPercent}%,
      #e5e5e5 ${maxPercent}%,
      #e5e5e5 100%
    )`,
  }
})

function updateMin(value: number) {
  priceMin.value = Math.min(Math.max(value, min.value), priceMax.value)
}

function updateMax(value: number) {
  priceMax.value = Math.max(Math.min(value, max.value), priceMin.value)
}

function focusMin() {
  editingMin.value = true
  minDraft.value = String(priceMin.value)
}

function focusMax() {
  editingMax.value = true
  maxDraft.value = String(priceMax.value)
}

function commitMin() {
  updateMin(parsePrice(minDraft.value))
  editingMin.value = false
}

function commitMax() {
  updateMax(parsePrice(maxDraft.value))
  editingMax.value = false
}

const sliderKey = computed(() => `${min.value}-${max.value}-${step.value}`)
</script>

<template>
  <div class="search-filters-price">
    <div class="search-filters-price__inputs">
      <input
        class="search-filters-price__input search-filters-price__input--min"
        type="text"
        inputmode="numeric"
        :value="editingMin ? minDraft : displayPrice(priceMin)"
        @focus="focusMin"
        @blur="commitMin"
        @input="minDraft = ($event.target as HTMLInputElement).value"
        @keydown.enter="($event.target as HTMLInputElement).blur()"
      >
      <input
        class="search-filters-price__input search-filters-price__input--max"
        type="text"
        inputmode="numeric"
        :value="editingMax ? maxDraft : displayPrice(priceMax)"
        @focus="focusMax"
        @blur="commitMax"
        @input="maxDraft = ($event.target as HTMLInputElement).value"
        @keydown.enter="($event.target as HTMLInputElement).blur()"
      >
    </div>

    <div class="search-filters-price__range" :style="rangeStyle">
      <input
        :key="`min-${sliderKey}`"
        :value="priceMin"
        type="range"
        :min="min"
        :max="max"
        :step="step"
        class="search-filters-price__slider"
        aria-label="Минимальная цена"
        @input="updateMin(Number(($event.target as HTMLInputElement).value))"
      >
      <input
        :key="`max-${sliderKey}`"
        :value="priceMax"
        type="range"
        :min="min"
        :max="max"
        :step="step"
        class="search-filters-price__slider search-filters-price__slider--max"
        aria-label="Максимальная цена"
        @input="updateMax(Number(($event.target as HTMLInputElement).value))"
      >
    </div>
  </div>
</template>

<style scoped>
.search-filters-price {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-filters-price__inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  align-items: stretch;
}

.search-filters-price__input {
  width: 100%;
  min-width: 0;
  padding: 14px 20px;
  border: 1px solid #d9d9d9;
  background: var(--wh-white);
  color: var(--wh-gray-900);
  font: inherit;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.2;
  text-align: center;
  outline: none;
}

.search-filters-price__input--min {
  border-radius: 999px 0 0 999px;
}

.search-filters-price__input--max {
  border-radius: 0 999px 999px 0;
}

.search-filters-price__range {
  position: relative;
  height: 4px;
  margin-inline: 4px;
  border-radius: 999px;
}

.search-filters-price__slider {
  position: absolute;
  inset: 0;
  width: 100%;
  margin: 0;
  background: transparent;
  pointer-events: none;
  appearance: none;
  outline: none;
}

.search-filters-price__slider:focus,
.search-filters-price__slider:focus-visible,
.search-filters-price__slider:active {
  outline: none;
}

.search-filters-price__slider::-moz-focus-outer {
  border: 0;
}

.search-filters-price__slider::-webkit-slider-runnable-track {
  height: 4px;
  background: transparent;
}

.search-filters-price__slider::-moz-range-track {
  height: 4px;
  background: transparent;
}

.search-filters-price__slider::-webkit-slider-thumb {
  width: 18px;
  height: 18px;
  margin-top: -7px;
  border: none;
  border-radius: 50%;
  background: var(--wh-green);
  pointer-events: auto;
  appearance: none;
  cursor: pointer;
  outline: none;
  box-shadow: none;
}

.search-filters-price__slider:focus::-webkit-slider-thumb,
.search-filters-price__slider:active::-webkit-slider-thumb {
  outline: none;
  box-shadow: none;
}

.search-filters-price__slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background: var(--wh-green);
  pointer-events: auto;
  cursor: pointer;
  outline: none;
  box-shadow: none;
}

.search-filters-price__slider:focus::-moz-range-thumb,
.search-filters-price__slider:active::-moz-range-thumb {
  outline: none;
  box-shadow: none;
}

.search-filters-price__slider--max {
  z-index: 1;
}
</style>
