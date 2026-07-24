<script setup lang="ts">
withDefaults(defineProps<{
  disabled?: boolean
  ariaLabel?: string
}>(), {
  disabled: false,
  ariaLabel: 'Закрыть',
})

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    type="button"
    class="modal-close-button"
    :aria-label="ariaLabel"
    :disabled="disabled"
    @click="emit('click')"
  >
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M5 5l10 10M15 5L5 15"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
      />
    </svg>
  </button>
</template>

<style scoped>
.modal-close-button {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 50%;
  background: transparent;
  color: var(--wh-gray-400);
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.modal-close-button:hover:not(:disabled) {
  color: var(--wh-black-text);
  border-color: var(--wh-gray);
}

.modal-close-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
