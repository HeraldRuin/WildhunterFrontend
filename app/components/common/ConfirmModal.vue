<script setup lang="ts">
const { isOpen, isSubmitting, options, close, confirm } = useConfirmModal()

useBodyScrollLock(isOpen)

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    close()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    close()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm-modal">
      <div
        v-if="isOpen && options"
        class="confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <div class="confirm-modal__card">
          <CommonModalCloseButton :disabled="isSubmitting" @click="close" />

          <h2 id="confirm-modal-title" class="confirm-modal__title">
            {{ options.title }}
          </h2>

          <div class="confirm-modal__actions">
            <button
              type="button"
              class="confirm-modal__btn confirm-modal__btn--secondary"
              :disabled="isSubmitting"
              @click="close"
            >
              <span class="confirm-modal__icon" aria-hidden="true">✖</span>
              {{ options.cancelLabel }}
            </button>

            <button
              type="button"
              class="confirm-modal__btn confirm-modal__btn--primary"
              :disabled="isSubmitting"
              @click="confirm"
            >
              <span class="confirm-modal__icon" aria-hidden="true">✔</span>
              {{ options.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  isolation: isolate;
}

.confirm-modal::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: rgba(17, 24, 39, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  pointer-events: none;
}

.confirm-modal__card {
  position: relative;
  width: min(100%, 520px);
  padding: 28px 28px 24px;
  border: 1px solid var(--wh-gray-200);
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.confirm-modal__title {
  margin: 0 48px 40px 0;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--wh-gray-900);
}

.confirm-modal__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.confirm-modal__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;
}

.confirm-modal__btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.confirm-modal__icon {
  font-size: 0.85rem;
  line-height: 1;
}

.confirm-modal__btn--secondary {
  border: 1px solid var(--wh-field-border-active);
  background: var(--wh-white);
  color: var(--wh-gray-900);
}

.confirm-modal__btn--secondary:hover:not(:disabled) {
  border-color: var(--wh-gray-900);
  background: var(--wh-gray-100);
}

.confirm-modal__btn--primary {
  border: 1px solid var(--wh-orange-500);
  background: var(--wh-orange-500);
  color: var(--wh-white);
}

.confirm-modal__btn--primary:hover:not(:disabled) {
  border-color: var(--wh-orange-600);
  background: var(--wh-orange-600);
}

.confirm-modal-enter-active,
.confirm-modal-leave-active {
  transition: visibility 0.2s linear;
}

.confirm-modal-enter-from,
.confirm-modal-leave-to {
  visibility: visible;
}

.confirm-modal-enter-from .confirm-modal__card,
.confirm-modal-leave-to .confirm-modal__card {
  opacity: 0;
  transform: translateY(8px);
}

@media (--wh-mobile) {
  .confirm-modal__actions {
    flex-direction: column-reverse;
  }

  .confirm-modal__btn {
    width: 100%;
  }
}
</style>
