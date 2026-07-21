<script setup lang="ts">
defineProps<{
  direction: 'prev' | 'next'
  label: string
}>()

defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    type="button"
    class="slider-arrow"
    :class="`slider-arrow--${direction}`"
    :aria-label="label"
    @click="$emit('click')"
  >
    <svg width="30" height="60" viewBox="0 0 30 60" aria-hidden="true">
      <path
        v-if="direction === 'prev'"
        d="M20 15 L10 30 L20 45"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="square"
        stroke-linejoin="miter"
      />
      <path
        v-else
        d="M10 15 L20 30 L10 45"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
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

.slider-arrow:hover {
  opacity: 0.6;
}
</style>
