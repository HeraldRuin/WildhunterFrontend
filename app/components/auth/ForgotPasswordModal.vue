<script setup lang="ts">
const { isOpen, close } = useForgotPasswordModal()
const { open: openLoginModal } = useLoginModal()
const { auth } = useApi()
const notifications = useNotifications()

type Step = 'email' | 'reset'

const step = ref<Step>('email')
const email = ref('')
const code = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const showPassword = ref(false)
const isSubmitting = ref(false)
const submitError = ref('')
const fieldErrors = ref<Record<string, string[]>>({})
const resetStepHint = ref('')

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

const CODE_FIELD_ERROR_CODES = ['code_expired', 'code_invalid'] as const

function getApiErrorPayload(source: unknown) {
  if (!source || typeof source !== 'object') {
    return null
  }

  const payload = source as {
    success?: boolean
    message?: string
    errors?: Record<string, string[]> | unknown[]
    error_code?: string
  }

  if (
    payload.success === false
    || payload.message
    || payload.error_code
    || payload.errors
  ) {
    return payload
  }

  const nestedData = (source as { data?: unknown }).data

  if (nestedData && nestedData !== source) {
    return getApiErrorPayload(nestedData)
  }

  return null
}

function getApiMessage(data: unknown) {
  return getApiErrorPayload(data)?.message?.trim() || ''
}

function proceedToResetStep(data: unknown) {
  resetStepHint.value = getApiMessage(data)
  step.value = 'reset'
}

function applyValidationErrors(data: unknown) {
  const response = getApiErrorPayload(data)

  if (!response) {
    return false
  }

  if (
    response.message
    && response.error_code
    && CODE_FIELD_ERROR_CODES.includes(response.error_code as typeof CODE_FIELD_ERROR_CODES[number])
  ) {
    fieldErrors.value = { code: [response.message] }
    submitError.value = ''
    return true
  }

  const fieldErrorsData = response.errors
  const hasFieldErrors = fieldErrorsData
    && !Array.isArray(fieldErrorsData)
    && Object.keys(fieldErrorsData).length > 0

  if (hasFieldErrors) {
    fieldErrors.value = fieldErrorsData
    submitError.value = ''
    return true
  }

  if (response.message) {
    fieldErrors.value = {}
    submitError.value = response.message
    return true
  }

  return false
}

function shouldProceedToResetStep(data: unknown) {
  if (!data || typeof data !== 'object') {
    return false
  }

  const response = data as { success?: boolean, error_code?: string }

  if (response.success) {
    return true
  }

  return response.error_code === 'code_already_sent'
}

function resetForm() {
  step.value = 'email'
  email.value = ''
  code.value = ''
  password.value = ''
  passwordConfirmation.value = ''
  showPassword.value = false
  submitError.value = ''
  fieldErrors.value = {}
  resetStepHint.value = ''
  isSubmitting.value = false
}

async function handleEmailSubmit() {
  isSubmitting.value = true
  submitError.value = ''
  fieldErrors.value = {}

  try {
    const response = await auth.sendPasswordResetEmail({
      email: email.value.trim(),
    })

    if (shouldProceedToResetStep(response)) {
      proceedToResetStep(response)
      return
    }

    if (!applyValidationErrors(response)) {
      submitError.value = response.message || 'Не удалось отправить код'
    }
  } catch (error) {
    const data = (error as { data?: unknown }).data

    if (shouldProceedToResetStep(data)) {
      proceedToResetStep(data)
      return
    }

    if (!applyValidationErrors(data)) {
      submitError.value = 'Не удалось отправить код'
    }
  } finally {
    isSubmitting.value = false
  }
}

async function handleResetSubmit() {
  isSubmitting.value = true
  submitError.value = ''
  fieldErrors.value = {}

  try {
    const response = await auth.resetPassword({
      email: email.value.trim(),
      code: code.value.trim(),
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    })

    if (response.success) {
      notifications.success(response.message || 'Пароль успешно изменён')
      close()
      resetForm()
      openLoginModal()
      return
    }

    if (!applyValidationErrors(response)) {
      submitError.value = response.message || 'Не удалось сбросить пароль'
    }
  } catch (error) {
    const data = (error as { data?: unknown }).data

    if (!applyValidationErrors(data)) {
      submitError.value = 'Не удалось сбросить пароль'
    }
  } finally {
    isSubmitting.value = false
  }
}

function handleSubmit() {
  if (step.value === 'email') {
    handleEmailSubmit()
    return
  }

  handleResetSubmit()
}

function switchToLogin() {
  close()
  resetForm()
  openLoginModal()
}

function handleGeneratePassword() {
  password.value = generatePassword()
  passwordConfirmation.value = password.value
  showPassword.value = true
  clearFieldError('password')
  clearFieldError('password_confirmation')
}

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value
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
          <CommonModalCloseButton :disabled="isSubmitting" @click="close" />

          <h2 id="forgot-password-modal-title" class="forgot-password-modal__title">
            Сбросить пароль
          </h2>

          <form class="forgot-password-modal__form" novalidate @submit.prevent="handleSubmit">
            <template v-if="step === 'email'">
              <CommonFormField
                id="forgot-email"
                placeholder="Адрес Email"
                type="email"
                autocomplete="email"
                no-margin
                :model-value="email"
                :error="getFieldError('email')"
                :disabled="isSubmitting"
                @update:model-value="email = $event; clearFieldError('email')"
              />
            </template>

            <template v-else>
              <p v-if="resetStepHint" class="forgot-password-modal__hint">
                {{ resetStepHint }}
              </p>

              <CommonFormField
                id="forgot-code"
                placeholder="Код из письма"
                autocomplete="one-time-code"
                inputmode="numeric"
                no-margin
                :model-value="code"
                :error="getFieldError('code')"
                :disabled="isSubmitting"
                @update:model-value="code = $event; clearFieldError('code')"
              />

              <CommonFormField
                id="forgot-password"
                placeholder="Новый пароль"
                autocomplete="new-password"
                no-margin
                trailing-wide
                :type="showPassword ? 'text' : 'password'"
                :masked="!showPassword && Boolean(password)"
                :model-value="password"
                :error="getFieldError('password')"
                :disabled="isSubmitting"
                @update:model-value="password = $event; clearFieldError('password')"
              >
                <template #trailing>
                  <div class="forgot-password-modal__password-actions">
                    <button
                      type="button"
                      class="forgot-password-modal__generate"
                      @click="handleGeneratePassword"
                    >
                      Сгенерировать
                    </button>
                    <button
                      type="button"
                      class="forgot-password-modal__toggle-password"
                      :aria-label="showPassword ? 'Скрыть пароль' : 'Показать пароль'"
                      @click="togglePasswordVisibility"
                    >
                      <img
                        v-if="showPassword"
                        src="/icons/Group.png"
                        alt=""
                        aria-hidden="true"
                        class="forgot-password-modal__password-icon"
                      >
                      <img
                        v-else
                        src="/icons/weui_eyes-off-filled.png"
                        alt=""
                        aria-hidden="true"
                        class="forgot-password-modal__password-icon forgot-password-modal__password-icon--hidden"
                      >
                    </button>
                  </div>
                </template>
              </CommonFormField>

              <CommonFormField
                id="forgot-password-confirmation"
                placeholder="Подтверждение пароля"
                autocomplete="new-password"
                no-margin
                :type="showPassword ? 'text' : 'password'"
                :masked="!showPassword && Boolean(passwordConfirmation)"
                :model-value="passwordConfirmation"
                :error="getFieldError('password_confirmation')"
                :disabled="isSubmitting"
                @update:model-value="passwordConfirmation = $event; clearFieldError('password_confirmation')"
              />
            </template>

            <p v-if="submitError" class="forgot-password-modal__error">
              {{ submitError }}
            </p>

            <button type="submit" class="forgot-password-modal__submit" :disabled="isSubmitting">
              <template v-if="step === 'email'">
                {{ isSubmitting ? 'Отправка...' : 'Отправить ссылку для сброса пароля' }}
              </template>
              <template v-else>
                {{ isSubmitting ? 'Сохранение...' : 'Сбросить пароль' }}
              </template>
            </button>
          </form>

          <p class="forgot-password-modal__footer">
            Вспомнили пароль?
            <button type="button" class="forgot-password-modal__login-link" @click="switchToLogin">
              Вход
            </button>
          </p>
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

.forgot-password-modal__hint {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.45;
  color: var(--wh-gray-600);
}

.forgot-password-modal__password-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.forgot-password-modal__generate {
  padding: 4px 6px;
  border: none;
  background: transparent;
  color: var(--wh-orange-500);
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.15s ease;
}

.forgot-password-modal__generate:hover {
  color: var(--wh-orange-600);
}

.forgot-password-modal__toggle-password {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--wh-gray-900);
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}

.forgot-password-modal__toggle-password:hover {
  color: var(--wh-gray-700);
  background: var(--wh-gray-100);
}

.forgot-password-modal__password-icon {
  display: block;
  flex-shrink: 0;
  width: 22px;
  height: 14px;
  object-fit: contain;
  object-position: center;
}

.forgot-password-modal__password-icon--hidden {
  width: 26px;
  height: 26px;
}

.forgot-password-modal__error {
  margin: 0;
  font-size: 0.82rem;
  color: var(--wh-field-error);
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

.forgot-password-modal__submit:hover:not(:disabled) {
  background: var(--wh-orange-600);
  transform: var(--wh-button-hover-lift);
}

.forgot-password-modal__submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.forgot-password-modal__footer {
  margin: 24px 0 0;
  text-align: center;
  font-size: 0.95rem;
  color: var(--wh-gray-900);
}

.forgot-password-modal__login-link {
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

.forgot-password-modal__login-link:hover {
  color: var(--wh-orange-600);
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

@media (--wh-mobile-sm) {
  .forgot-password-modal__card {
    padding: 32px 24px 24px;
  }

  .forgot-password-modal__generate {
    font-size: 0.76rem;
  }

  .forgot-password-modal__submit {
    font-size: 0.92rem;
  }

  .forgot-password-modal__form :deep(.form-field__input--with-trailing-wide) {
    padding-right: 148px;
  }
}
</style>
