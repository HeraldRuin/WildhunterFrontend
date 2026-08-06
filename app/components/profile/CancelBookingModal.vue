<script setup lang="ts">
const { isOpen, close } = useCancelBookingModal()

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

function handleConfirm() {
  close()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="cancel-booking-modal">
      <div
        v-if="isOpen"
        class="cancel-booking-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-booking-modal-title"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <div class="cancel-booking-modal__card">
          <CommonModalCloseButton @click="close" />

          <h2 id="cancel-booking-modal-title" class="cancel-booking-modal__title">
            Вы уверены, что хотите отменить бронь?
          </h2>

          <div class="cancel-booking-modal__actions">
            <button
              type="button"
              class="cancel-booking-modal__btn cancel-booking-modal__btn--secondary"
              @click="close"
            >
              <span class="cancel-booking-modal__icon" aria-hidden="true">✖</span>
              Отменить
            </button>

            <button
              type="button"
              class="cancel-booking-modal__btn cancel-booking-modal__btn--primary"
              @click="handleConfirm"
            >
              <span class="cancel-booking-modal__icon" aria-hidden="true">✔</span>
              Подтвердить
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.cancel-booking-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  isolation: isolate;
}

.cancel-booking-modal::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: rgba(17, 24, 39, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  pointer-events: none;
}

.cancel-booking-modal__card {
  position: relative;
  width: min(100%, 520px);
  padding: 28px 28px 24px;
  border: 1px solid var(--wh-gray-200);
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.cancel-booking-modal__title {
  margin: 0 48px 40px 0;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--wh-gray-900);
}

.cancel-booking-modal__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-booking-modal__btn {
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
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.cancel-booking-modal__icon {
  font-size: 0.85rem;
  line-height: 1;
}

.cancel-booking-modal__btn--secondary {
  border: 1px solid var(--wh-field-border-active);
  background: var(--wh-white);
  color: var(--wh-gray-900);
}

.cancel-booking-modal__btn--secondary:hover {
  border-color: var(--wh-gray-900);
  background: var(--wh-gray-100);
}

.cancel-booking-modal__btn--primary {
  border: 1px solid #2f80ed;
  background: #2f80ed;
  color: var(--wh-white);
}

.cancel-booking-modal__btn--primary:hover {
  border-color: #256fd1;
  background: #256fd1;
}

.cancel-booking-modal-enter-active,
.cancel-booking-modal-leave-active {
  transition: visibility 0.2s linear;
}

.cancel-booking-modal-enter-from,
.cancel-booking-modal-leave-to {
  visibility: visible;
}

.cancel-booking-modal-enter-from .cancel-booking-modal__card,
.cancel-booking-modal-leave-to .cancel-booking-modal__card {
  opacity: 0;
  transform: translateY(8px);
}

@media (--wh-mobile) {
  .cancel-booking-modal__actions {
    flex-direction: column-reverse;
  }

  .cancel-booking-modal__btn {
    width: 100%;
  }
}
</style>
