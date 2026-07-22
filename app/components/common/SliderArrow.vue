<script setup lang="ts">
defineProps<{
  direction: 'prev' | 'next'
  label: string
  disabled?: boolean
}>()

defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    type="button"
    class="slider-arrow"
    :class="[
      `slider-arrow--${direction}`,
      { 'slider-arrow--disabled': disabled },
    ]"
    :aria-label="label"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <svg width="30" height="60" viewBox="0 0 30 60" aria-hidden="true">
      <path
        v-if="direction === 'prev'"
        d="M20 15 L10 30 L20 45"
        fill="none"
        stroke="currentColor"
        stroke-width="3.5"
        stroke-linecap="square"
        stroke-linejoin="miter"
      />
      <path
        v-else
        d="M10 15 L20 30 L10 45"
        fill="none"
        stroke="currentColor"
        stroke-width="3.5"
        stroke-linecap="square"
        stroke-linejoin="miter"
      />
    </svg>
  </button>
</template>

<style scoped>
.slider-arrow {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 30px;
  height: 60px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--wh-black-text);
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.slider-arrow:hover:not(:disabled) {
  opacity: 0.6;
}

.slider-arrow--disabled,
.slider-arrow:disabled {
  color: var(--wh-gray);
  cursor: default;
}
</style>
