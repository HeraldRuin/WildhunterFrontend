<script setup lang="ts">
type ModalCloseButtonVariant = 'icon' | 'text'

withDefaults(defineProps<{
  disabled?: boolean
  ariaLabel?: string
  variant?: ModalCloseButtonVariant
  label?: string
}>(), {
  disabled: false,
  ariaLabel: 'Закрыть',
  variant: 'text',
  label: 'Закрыть',
})

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    type="button"
    class="modal-close-button"
    :class="{ 'modal-close-button--icon': variant === 'icon' }"
    :aria-label="variant === 'text' ? undefined : ariaLabel"
    :disabled="disabled"
    @click="emit('click')"
  >
    <template v-if="variant === 'text'">
      {{ label }}
    </template>
    <svg
      v-else
      width="20"
      height="20"
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
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
  width: auto;
  height: auto;
  min-height: 36px;
  padding: 8px 14px;
  border: 1px solid var(--wh-black-text);
  border-radius: 8px;
  background: transparent;
  color: var(--wh-black-text);
  font-size: 0.88rem;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
  cursor: pointer;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.modal-close-button:focus,
.modal-close-button:active {
  outline: none;
  background: transparent;
  -webkit-tap-highlight-color: transparent;
}

.modal-close-button:hover:not(:disabled) {
  color: var(--wh-gray-400);
  border-color: var(--wh-field-border);
}

.modal-close-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.modal-close-button--icon {
  width: 36px;
  height: 36px;
  min-height: 36px;
  padding: 0;
  border-radius: 50%;
}

@media (--wh-tablet) {
  .modal-close-button,
  .modal-close-button:focus,
  .modal-close-button:active {
    -webkit-tap-highlight-color: transparent;
    outline: none;
    background: transparent;
  }
}

@media (--wh-mobile) {
  .modal-close-button,
  .modal-close-button:focus,
  .modal-close-button:active {
    -webkit-tap-highlight-color: transparent;
    outline: none;
    background: transparent;
  }
}
</style>
