<script setup lang="ts">
definePageMeta({
  layout: 'profile',
  middleware: 'auth',
})

useHead({
  title: 'Изменить пароль — WH',
})

const { user: userApi } = useApi()
const notifications = useNotifications()

const notificationCount = 0

const breadcrumbs = [
  { label: 'Главная', to: '/' },
  { label: 'Параметр' },
  { label: 'Изменить пароль' },
]

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const isSubmitting = ref(false)
const submitError = ref('')
const fieldErrors = ref<Record<string, string[]>>({})

type PasswordField = 'current_password' | 'new_password' | 'new_password_confirmation'

function getFieldError(field: PasswordField) {
  return fieldErrors.value[field]?.[0]
}

function clearFieldError(field: PasswordField) {
  if (!fieldErrors.value[field]) {
    return
  }

  const nextErrors = { ...fieldErrors.value }
  delete nextErrors[field]
  fieldErrors.value = nextErrors
  submitError.value = ''
}

function getApiErrorPayload(source: unknown) {
  if (!source || typeof source !== 'object') {
    return null
  }

  const payload = source as {
    success?: boolean
    message?: string
    errors?: Record<string, string[]> | unknown[]
    error_code?: string
    code?: string
  }

  if (
    payload.success === false
    || payload.message
    || payload.error_code
    || payload.code
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

const CURRENT_PASSWORD_ERROR_CODES = ['invalid_current_password'] as const

function normalizePasswordFieldErrors(response: NonNullable<ReturnType<typeof getApiErrorPayload>>) {
  const normalized: Record<string, string[]> = {}

  const rawErrors = response.errors

  if (rawErrors && !Array.isArray(rawErrors)) {
    Object.assign(normalized, rawErrors)
  }

  const errorCode = response.error_code ?? response.code

  if (
    errorCode
    && CURRENT_PASSWORD_ERROR_CODES.includes(errorCode as typeof CURRENT_PASSWORD_ERROR_CODES[number])
    && response.message
  ) {
    normalized.current_password = [response.message]
    return normalized
  }

  if (
    !Object.keys(normalized).length
    && response.message
    && /текущ|current password/i.test(response.message)
  ) {
    normalized.current_password = [response.message]
  }

  return normalized
}

function applyValidationErrors(data: unknown) {
  const response = getApiErrorPayload(data)

  if (!response) {
    return false
  }

  const normalizedErrors = normalizePasswordFieldErrors(response)

  if (Object.keys(normalizedErrors).length > 0) {
    fieldErrors.value = normalizedErrors
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

function resetFormFields() {
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  showCurrentPassword.value = false
  showNewPassword.value = false
}

function handleGeneratePassword() {
  newPassword.value = generatePassword()
  confirmPassword.value = newPassword.value
  showNewPassword.value = true
  clearFieldError('new_password')
  clearFieldError('new_password_confirmation')
}

async function handleSubmit() {
  isSubmitting.value = true
  submitError.value = ''
  fieldErrors.value = {}

  try {
    const response = await userApi.changePassword({
      current_password: currentPassword.value,
      new_password: newPassword.value,
      new_password_confirmation: confirmPassword.value,
    })

    if ('success' in response && response.success) {
      notifications.success(response.message || 'Пароль успешно изменён')
      resetFormFields()
      return
    }

    if (!applyValidationErrors(response)) {
      submitError.value = 'Не удалось изменить пароль'
    }
  } catch (error) {
    const data = (error as { data?: unknown }).data

    if (!applyValidationErrors(data)) {
      submitError.value = 'Не удалось изменить пароль'
    }
  } finally {
    isSubmitting.value = false
  }
}

function handleCancel() {
  navigateTo('/profile')
}
</script>

<template>
  <div class="profile-page">
    <header class="profile-page__header">
      <AppBreadcrumbs :items="breadcrumbs" />

      <button type="button" class="profile-page__notifications" aria-label="Уведомления">
        <img
          src="/icons/bell.png"
          alt=""
          aria-hidden="true"
          class="profile-page__notifications-icon"
          width="18"
          height="22"
        >
        <span class="profile-page__notifications-badge">{{ notificationCount }}</span>
      </button>
    </header>

    <h1 class="profile-page__title profile-page__title--divider">Изменить пароль</h1>

    <form class="password-form" @submit.prevent="handleSubmit">
      <div class="password-form__fields">
        <div class="password-form__field">
          <label class="password-form__label" for="current-password">Текущий пароль</label>
          <div class="password-form__input-wrap">
            <input
              id="current-password"
              v-model="currentPassword"
              :type="showCurrentPassword ? 'text' : 'password'"
              class="password-form__input"
              :class="{
                'password-form__input--masked': !showCurrentPassword && currentPassword,
                'password-form__input--error': getFieldError('current_password'),
              }"
              placeholder="Текущий пароль"
              autocomplete="current-password"
              @input="clearFieldError('current_password')"
            >
            <button
              type="button"
              class="password-form__toggle"
              :aria-label="showCurrentPassword ? 'Скрыть пароль' : 'Показать пароль'"
              @click="showCurrentPassword = !showCurrentPassword"
            >
              <img
                v-if="showCurrentPassword"
                src="/icons/Group.png"
                alt=""
                aria-hidden="true"
                class="password-form__password-icon"
              >
              <img
                v-else
                src="/icons/weui_eyes-off-filled.png"
                alt=""
                aria-hidden="true"
                class="password-form__password-icon password-form__password-icon--hidden"
              >
            </button>
          </div>
          <p v-if="getFieldError('current_password')" class="password-form__field-error">
            {{ getFieldError('current_password') }}
          </p>
        </div>

        <div class="password-form__field">
          <label class="password-form__label" for="new-password">Новый пароль</label>
          <div class="password-form__new-row">
            <div class="password-form__input-wrap">
              <input
                id="new-password"
                v-model="newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                class="password-form__input"
                :class="{
                  'password-form__input--masked': !showNewPassword && newPassword,
                  'password-form__input--error': getFieldError('new_password'),
                }"
                placeholder="Новый пароль"
                autocomplete="new-password"
                minlength="8"
                @input="clearFieldError('new_password')"
              >
              <button
                type="button"
                class="password-form__toggle"
                :aria-label="showNewPassword ? 'Скрыть пароль' : 'Показать пароль'"
                @click="showNewPassword = !showNewPassword"
              >
                <img
                  v-if="showNewPassword"
                  src="/icons/Group.png"
                  alt=""
                  aria-hidden="true"
                  class="password-form__password-icon"
                >
                <img
                  v-else
                  src="/icons/weui_eyes-off-filled.png"
                  alt=""
                  aria-hidden="true"
                  class="password-form__password-icon password-form__password-icon--hidden"
                >
              </button>
            </div>
            <button
              type="button"
              class="password-form__generate"
              @click="handleGeneratePassword"
            >
              Сгенерировать
            </button>
          </div>
          <p v-if="getFieldError('new_password')" class="password-form__field-error">
            {{ getFieldError('new_password') }}
          </p>
        </div>

        <div class="password-form__field">
          <label class="password-form__label" for="confirm-password">Новый пароль снова</label>
          <div class="password-form__input-wrap">
            <input
              id="confirm-password"
              v-model="confirmPassword"
              :type="showNewPassword ? 'text' : 'password'"
              class="password-form__input password-form__input--plain"
              :class="{
                'password-form__input--masked': !showNewPassword && confirmPassword,
                'password-form__input--error': getFieldError('new_password_confirmation'),
              }"
              placeholder="Новый пароль снова"
              autocomplete="new-password"
              minlength="8"
              @input="clearFieldError('new_password_confirmation')"
            >
          </div>
          <p v-if="getFieldError('new_password_confirmation')" class="password-form__field-error">
            {{ getFieldError('new_password_confirmation') }}
          </p>
        </div>
      </div>

      <p v-if="submitError" class="password-form__submit-error">
        {{ submitError }}
      </p>

      <div class="password-form__actions">
        <button
          type="submit"
          class="password-form__submit"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Сохранение...' : 'Сохранить изменения' }}
        </button>
        <button type="button" class="password-form__cancel" @click="handleCancel">
          Отмена
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.profile-page {
  padding: 20px 40px 48px;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
}

.profile-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 896px;
  max-width: 100%;
  height: 31px;
  margin-bottom: 20px;
  padding: 0 16px;
  box-sizing: border-box;
  background: var(--wh-white);
  border-radius: var(--wh-radius);
  overflow: visible;
}

.profile-page__notifications {
  position: relative;
  flex-shrink: 0;
  width: 18px;
  height: 22px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  overflow: visible;
}

.profile-page__notifications-icon {
  display: block;
  width: 18px;
  height: 22px;
  object-fit: contain;
}

.profile-page__notifications-badge {
  position: absolute;
  top: -6px;
  right: -8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  min-width: 16px;
  height: 16px;
  padding: 0;
  border-radius: 50%;
  background: #e74c3c;
  color: var(--wh-white);
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1;
}

.profile-page__title {
  margin: 0 0 24px;

  font-family: "UNCAGE", sans-serif;
  font-size: 32px;
  font-weight: 400;
  line-height: 130%;
  letter-spacing: -0.03em;

  color: var(--wh-gray-900);
}

.profile-page__title--divider {
  width: 896px;
  max-width: 100%;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
}

.password-form__fields {
  max-width: 520px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.password-form__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.password-form__label {
  font-family: "Inter", sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.05em;

  color: var(--wh-gray-600);
}

.password-form__new-row {
  position: relative;
  width: 100%;
}

.password-form__input-wrap {
  position: relative;
  width: 100%;
}

.password-form__input {
  width: 100%;
  padding: 12px 44px 12px 14px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  background: var(--wh-white);
  color: var(--wh-gray-900);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 16px;
  line-height: 1.4;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.password-form__input--masked {
  font-size: 13px;
  letter-spacing: 0.28em;
}

.password-form__input--plain {
  padding-right: 14px;
}

.password-form__input::placeholder {
  color: var(--wh-gray-400);
  letter-spacing: normal;
}

.password-form__input:focus {
  border-color: var(--wh-orange-500);
  box-shadow: 0 0 0 3px rgba(238, 154, 60, 0.15);
}

.password-form__input--error,
.password-form__input--error:focus {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12);
}

.password-form__field-error {
  margin: 0;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 0.875rem;
  line-height: 1.35;
  color: #dc2626;
}

.password-form__submit-error {
  max-width: 520px;
  margin: 0 0 16px;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 0.875rem;
  line-height: 1.35;
  color: #dc2626;
}

.password-form__input:-webkit-autofill,
.password-form__input:-webkit-autofill:hover,
.password-form__input:-webkit-autofill:focus {
  -webkit-text-fill-color: var(--wh-gray-900);
  box-shadow: 0 0 0 1000px var(--wh-white) inset;
  transition: background-color 9999s ease-out 0s;
}

.password-form__input-wrap > .password-form__toggle {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
}

.password-form__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  transition: background 0.15s ease;
}

.password-form__toggle:hover {
  background: var(--wh-gray-100);
}

.password-form__password-icon {
  display: block;
  flex-shrink: 0;
  width: 22px;
  height: 14px;
  object-fit: contain;
  object-position: center;
}

.password-form__password-icon--hidden {
  width: 26px;
  height: 26px;
}

.password-form__generate {
  position: absolute;
  top: 50%;
  left: calc(100% + 16px);
  padding: 0;
  border: none;
  background: none;
  color: var(--wh-green);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 18px;
  font-weight: 500;
  font-style: normal;
  line-height: 100%;
  letter-spacing: -0.05em;
  text-decoration: underline;
  text-decoration-style: solid;
  text-underline-offset: 4px;
  text-decoration-thickness: auto;
  text-decoration-skip-ink: auto;
  white-space: nowrap;
  cursor: pointer;
  transform: translateY(-50%);
  transition: color 0.15s ease;
}

.password-form__generate:hover {
  color: var(--wh-green-900);
}

.password-form__actions {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 896px;
  max-width: 100%;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
}

.password-form__submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 200px;
  padding: 14px 28px;
  border: none;
  border-radius: 20px;
  background: var(--wh-orange-500);
  color: var(--wh-white);
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.password-form__submit:hover:not(:disabled) {
  background: var(--wh-orange-600);
  transform: translateY(-1px);
}

.password-form__submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.password-form__cancel {
  padding: 0;
  border: none;
  background: none;
  color: var(--wh-orange-text);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s ease;
}

.password-form__cancel:hover {
  color: var(--wh-orange-600);
}

@media (max-width: 900px) {
  .profile-page {
    padding: 16px 20px 40px;
  }
}

@media (max-width: 640px) {
  .password-form__generate {
    position: static;
    transform: none;
    align-self: flex-end;
    margin-top: 8px;
  }

  .password-form__new-row {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .password-form__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .password-form__submit {
    width: 100%;
  }

  .password-form__cancel {
    align-self: center;
  }
}
</style>
