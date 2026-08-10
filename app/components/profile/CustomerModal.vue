<script setup lang="ts">
import type { BookingHistoryItem } from '~/types/booking'

const props = defineProps<{
  booking: BookingHistoryItem | null
}>()

const emit = defineEmits<{
  close: []
}>()

const isOpen = computed(() => Boolean(props.booking))

useBodyScrollLock(isOpen)

function close() {
  emit('close')
}

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
    <Transition name="customer-modal">
      <div
        v-if="booking"
        class="customer-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-modal-title"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <div class="customer-modal__card">
          <CommonModalCloseButton @click="close" />

          <h2 id="customer-modal-title" class="customer-modal__title">
            Найти нового заказчика по ID:
          </h2>

          <form class="customer-modal__form" @submit.prevent>
            <input
              type="text"
              inputmode="numeric"
              class="customer-modal__input"
              placeholder="Введите ID пользователя"
              aria-label="ID пользователя"
            >

            <CommonSaveButton
              type="submit"
              width="160px"
              mobile-width="100%"
            >
              Сохранить
            </CommonSaveButton>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.customer-modal {
  position: fixed;
  inset: 0;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  isolation: isolate;
}

.customer-modal::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: rgba(17, 24, 39, 0.45);
}

.customer-modal__card {
  position: relative;
  width: min(100%, 760px);
  padding: 20px 24px 18px;
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
}

.customer-modal__title {
  margin: 0 40px 10px 0;
  color: var(--wh-gray-900);
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.4;
}

.customer-modal__form {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}

.customer-modal__input {
  width: 100%;
  height: 36px;
  padding: 0 14px;
  border: 1px solid var(--wh-gray-400);
  background: var(--wh-white);
  color: var(--wh-gray-900);
  font: inherit;
  outline: none;
}

.customer-modal__input:focus {
  border-color: var(--wh-field-border-active);
}

.customer-modal-enter-active,
.customer-modal-leave-active {
  transition: opacity 0.2s ease;
}

.customer-modal-enter-from,
.customer-modal-leave-to {
  opacity: 0;
}
</style>
