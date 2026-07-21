<script setup lang="ts">
const { isOpen, close } = useForgotPasswordModal()

const email = ref('')

function handleSubmit() {
  // TODO: подключить API сброса пароля
  close()
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
    <Transition name="forgot-password-modal">
      <div
        v-if="isOpen"
        class="forgot-password-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-password-modal-title"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <div class="forgot-password-modal__card">
          <button
            type="button"
            class="forgot-password-modal__close"
            aria-label="Закрыть"
            @click="close"
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

          <h2 id="forgot-password-modal-title" class="forgot-password-modal__title">
            Сбросить пароль
          </h2>

          <form class="forgot-password-modal__form" @submit.prevent="handleSubmit">
            <input
              v-model="email"
              type="email"
              class="forgot-password-modal__input"
              placeholder="Адрес Email"
              autocomplete="email"
              required
            />

            <button type="submit" class="forgot-password-modal__submit">
              Отправить ссылку для сброса пароля
            </button>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.forgot-password-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(17, 24, 39, 0.45);
  backdrop-filter: blur(6px);
}

.forgot-password-modal__card {
  position: relative;
  width: min(100%, var(--wh-auth-modal-width));
  min-width: min(100%, var(--wh-auth-modal-width));
  padding: 40px 36px 32px;
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
}

.forgot-password-modal__close {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--wh-gray-400);
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}

.forgot-password-modal__close:hover {
  color: var(--wh-gray-900);
  background: var(--wh-gray-100);
}

.forgot-password-modal__title {
  margin: 0 0 28px;
  font-size: 1.75rem;
  font-weight: 800;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--wh-gray-900);
}

.forgot-password-modal__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.forgot-password-modal__input {
  width: 100%;
  min-height: 48px;
  padding: 12px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  background: var(--wh-white);
  color: var(--wh-gray-900);
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.forgot-password-modal__input::placeholder {
  color: var(--wh-gray-400);
}

.forgot-password-modal__input:focus {
  border-color: var(--wh-orange-500);
  box-shadow: 0 0 0 3px rgba(209, 101, 16, 0.15);
}

.forgot-password-modal__submit {
  width: 100%;
  margin-top: 8px;
  padding: 14px 24px;
  border: none;
  border-radius: 999px;
  background: var(--wh-orange-500);
  color: var(--wh-white);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.forgot-password-modal__submit:hover {
  background: var(--wh-orange-600);
  transform: translateY(-1px);
}

.forgot-password-modal-enter-active,
.forgot-password-modal-leave-active {
  transition: opacity 0.2s ease;
}

.forgot-password-modal-enter-active .forgot-password-modal__card,
.forgot-password-modal-leave-active .forgot-password-modal__card {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.forgot-password-modal-enter-from,
.forgot-password-modal-leave-to {
  opacity: 0;
}

.forgot-password-modal-enter-from .forgot-password-modal__card,
.forgot-password-modal-leave-to .forgot-password-modal__card {
  transform: translateY(12px) scale(0.98);
  opacity: 0;
}

@media (max-width: 480px) {
  .forgot-password-modal__card {
    padding: 32px 24px 24px;
  }

  .forgot-password-modal__submit {
    font-size: 0.92rem;
  }
}
</style>
