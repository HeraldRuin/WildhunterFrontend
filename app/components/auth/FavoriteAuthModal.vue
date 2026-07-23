<script setup lang="ts">
const { isOpen, message, close } = useFavoriteAuthModal()
const { open: openRegisterModal } = useRegisterModal()

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

function handleRegister() {
  close()
  openRegisterModal()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="favorite-auth-modal">
      <div
        v-if="isOpen"
        class="favorite-auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="favorite-auth-modal-title"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <div class="favorite-auth-modal__card">
          <CommonModalCloseButton @click="close" />

          <div class="favorite-auth-modal__icon" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>

          <h2 id="favorite-auth-modal-title" class="favorite-auth-modal__title">
            Войдите или зарегистрируйтесь
          </h2>

          <p class="favorite-auth-modal__text">
            {{ message }}
          </p>

          <button type="button" class="favorite-auth-modal__submit btn btn--primary" @click="handleRegister">
            Регистрация
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.favorite-auth-modal {
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

.favorite-auth-modal__card {
  position: relative;
  width: var(--wh-auth-modal-width);
  min-width: min(100%, var(--wh-auth-modal-width));
  padding: 40px 36px 32px;
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
  text-align: center;
}

.favorite-auth-modal__icon {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  border-radius: 50%;
  background: rgba(209, 101, 16, 0.1);
  color: var(--wh-orange-500);
}

.favorite-auth-modal__title {
  margin: 0 0 12px;
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: var(--wh-black-text);
}

.favorite-auth-modal__text {
  margin: 0 0 28px;
  font-size: 1rem;
  line-height: 1.55;
  color: var(--wh-black-text);
  opacity: 0.78;
}

.favorite-auth-modal__submit {
  width: 100%;
  min-height: 48px;
}

.favorite-auth-modal-enter-active,
.favorite-auth-modal-leave-active {
  transition: opacity 0.2s ease;
}

.favorite-auth-modal-enter-active .favorite-auth-modal__card,
.favorite-auth-modal-leave-active .favorite-auth-modal__card {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.favorite-auth-modal-enter-from,
.favorite-auth-modal-leave-to {
  opacity: 0;
}

.favorite-auth-modal-enter-from .favorite-auth-modal__card,
.favorite-auth-modal-leave-to .favorite-auth-modal__card {
  transform: translateY(12px) scale(0.98);
  opacity: 0;
}

@media (max-width: 480px) {
  .favorite-auth-modal__card {
    padding: 32px 24px 24px;
  }
}
</style>
