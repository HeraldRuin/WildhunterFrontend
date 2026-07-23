<script setup lang="ts">
const { isOpen, close } = useLoginModal()
const { open: openRegisterModal } = useRegisterModal()
const { open: openForgotPasswordModal } = useForgotPasswordModal()
const { login } = useAuth()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const isSubmitting = ref(false)
const submitError = ref('')
const fieldErrors = ref<Record<string, string[]>>({})

function getFieldError(field: string) {
  return fieldErrors.value[field]?.[0]
}

function clearFieldError(field: string) {
  if (!fieldErrors.value[field]) {
    return
  }

  const nextErrors = { ...fieldErrors.value }
  delete nextErrors[field]
  fieldErrors.value = nextErrors
  submitError.value = ''
}

function resetForm() {
  email.value = ''
  password.value = ''
  rememberMe.value = false
  submitError.value = ''
  fieldErrors.value = {}
  isSubmitting.value = false
}

async function handleSubmit() {
  isSubmitting.value = true
  submitError.value = ''
  fieldErrors.value = {}

  try {
    const result = await login(email.value, password.value, rememberMe.value)

    if (!result.success) {
      if (result.errors) {
        fieldErrors.value = result.errors
      } else {
        submitError.value = result.message
      }
      return
    }

    close()
    resetForm()
  } catch {
    submitError.value = 'Не удалось войти'
  } finally {
    isSubmitting.value = false
  }
}

function switchToRegister() {
  close()
  openRegisterModal()
}

function switchToForgotPassword() {
  close()
  openForgotPasswordModal()
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

watch(isOpen, (open) => {
  if (!open) {
    resetForm()
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="login-modal">
      <div
        v-if="isOpen"
        class="login-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <div class="login-modal__card">
          <button
            type="button"
            class="login-modal__close"
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

          <h2 id="login-modal-title" class="login-modal__title">Вход</h2>

          <form class="login-modal__form" @submit.prevent="handleSubmit">
            <input
              v-model="email"
              type="email"
              class="login-modal__input"
              placeholder="Адрес Email"
              autocomplete="email"
              required
              @input="clearFieldError('email')"
            />

            <input
              v-model="password"
              type="password"
              class="login-modal__input"
              placeholder="Пароль"
              autocomplete="current-password"
              required
              @input="clearFieldError('password')"
            />

            <p v-if="getFieldError('email')" class="login-modal__error">
              {{ getFieldError('email') }}
            </p>
            <p v-if="getFieldError('password')" class="login-modal__error">
              {{ getFieldError('password') }}
            </p>
            <p v-if="submitError" class="login-modal__error">
              {{ submitError }}
            </p>

            <div class="login-modal__options">
              <label class="login-modal__remember">
                <input v-model="rememberMe" type="checkbox" class="login-modal__checkbox" />
                <span>Запомнить меня</span>
              </label>

              <button type="button" class="login-modal__forgot" @click="switchToForgotPassword">
                Забыли пароль?
              </button>
            </div>

            <button type="submit" class="login-modal__submit" :disabled="isSubmitting">
              {{ isSubmitting ? 'Вход...' : 'Вход' }}
            </button>
          </form>

          <p class="login-modal__footer">
            Нет аккаунта?
            <button type="button" class="login-modal__register" @click="switchToRegister">
              Регистрация
            </button>
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.login-modal {
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

.login-modal__card {
  position: relative;
  width: 480px;
  min-width: min(100%, var(--wh-auth-modal-width));
  padding: 40px 36px 32px;
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
}

.login-modal__close {
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

.login-modal__close:hover {
  color: var(--wh-gray-900);
  background: var(--wh-gray-100);
}

.login-modal__title {
  margin: 0 0 28px;
  font-size: 1.75rem;
  font-weight: 800;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--wh-gray-900);
}

.login-modal__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.login-modal__input {
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

.login-modal__input::placeholder {
  color: var(--wh-gray-400);
}

.login-modal__input:focus {
  border-color: var(--wh-orange-500);
  box-shadow: 0 0 0 3px rgba(209, 101, 16, 0.15);
}

.login-modal__options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 4px;
}

.login-modal__remember {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--wh-gray-900);
  cursor: pointer;
  user-select: none;
}

.login-modal__checkbox {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin: 0;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 3px;
  background: var(--wh-white);
  appearance: none;
  cursor: pointer;
  position: relative;
}

.login-modal__checkbox:checked::after {
  content: '';
  position: absolute;
  top: 1px;
  left: 4px;
  width: 5px;
  height: 9px;
  border: solid var(--wh-black-text);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.login-modal__forgot {
  padding: 0;
  border: none;
  background: transparent;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--wh-orange-500);
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.15s ease;
}

.login-modal__forgot:hover {
  color: var(--wh-orange-600);
}

.login-modal__submit {
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

.login-modal__submit:hover {
  background: var(--wh-orange-600);
  transform: translateY(-1px);
}

.login-modal__submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.login-modal__error {
  margin: -8px 0 0;
  font-size: 0.82rem;
  color: #dc2626;
}

.login-modal__footer {
  margin: 24px 0 0;
  text-align: center;
  font-size: 0.95rem;
  color: var(--wh-gray-900);
}

.login-modal__register {
  margin-left: 4px;
  padding: 0;
  border: none;
  background: transparent;
  font: inherit;
  font-weight: 600;
  color: var(--wh-orange-500);
  cursor: pointer;
  transition: color 0.15s ease;
}

.login-modal__register:hover {
  color: var(--wh-orange-600);
}

.login-modal-enter-active,
.login-modal-leave-active {
  transition: opacity 0.2s ease;
}

.login-modal-enter-active .login-modal__card,
.login-modal-leave-active .login-modal__card {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.login-modal-enter-from,
.login-modal-leave-to {
  opacity: 0;
}

.login-modal-enter-from .login-modal__card,
.login-modal-leave-to .login-modal__card {
  transform: translateY(12px) scale(0.98);
  opacity: 0;
}

@media (max-width: 480px) {
  .login-modal__card {
    padding: 32px 24px 24px;
  }

  .login-modal__options {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
