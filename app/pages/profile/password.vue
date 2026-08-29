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
const { loadCurrentPassword, refreshCurrentPassword, setCurrentPassword, readCachedPasswordSync } = useCurrentPassword()

const breadcrumbs = [
  { label: 'Главная', to: '/' },
  { label: 'Параметры' },
  { label: 'Изменить пароль' },
]

const currentPassword = ref(readCachedPasswordSync())
const newPassword = ref('')
const confirmPassword = ref('')

const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const currentPasswordFieldRef = ref<{ syncFromDom: () => void, applyToDom: () => void } | null>(null)
const isSubmitting = ref(false)
const showSubmittingOverlay = ref(false)
const submitError = ref('')
const fieldErrors = ref<Record<string, string[]>>({})

const hasValidationFeedback = computed(() =>
  Boolean(submitError.value) || Object.keys(fieldErrors.value).length > 0,
)

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

  if (
    normalizedErrors.new_password?.length
    && !normalizedErrors.new_password_confirmation?.length
    && newPassword.value === confirmPassword.value
  ) {
    normalizedErrors.new_password_confirmation = [...normalizedErrors.new_password]
  }

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

type PendingSubmitResult =
  | { kind: 'success', message: string, nextPassword?: string }
  | { kind: 'validation', data: unknown }
  | { kind: 'fail', message: string }

const pendingSubmitResult = ref<PendingSubmitResult | null>(null)

function finishSubmittingOverlay() {
  showSubmittingOverlay.value = false
}

async function applySuccess(message: string, nextPassword = '') {
  fieldErrors.value = {}
  submitError.value = ''
  notifications.success(message)
  resetFormFields()

  const fromApi = await refreshCurrentPassword()
  const password = fromApi || nextPassword || null

  if (password && !fromApi) {
    setCurrentPassword(password)
  }

  currentPassword.value = password || ''
}

function applyFail(message: string) {
  fieldErrors.value = {}
  submitError.value = message
}

function applySubmitResult(result: PendingSubmitResult) {
  if (result.kind === 'success') {
    void applySuccess(result.message, result.nextPassword)
    return
  }

  if (result.kind === 'validation') {
    if (!applyValidationErrors(result.data)) {
      applyFail('Не удалось изменить пароль')
    }
    return
  }

  applyFail(result.message)
}

function clearSubmittingState() {
  isSubmitting.value = false

  const result = pendingSubmitResult.value
  pendingSubmitResult.value = null

  if (result) {
    applySubmitResult(result)
  }
}

function resolveErrorResult(data: unknown): PendingSubmitResult {
  if (getApiErrorPayload(data)) {
    return { kind: 'validation', data }
  }

  return { kind: 'fail', message: 'Не удалось изменить пароль' }
}

function settleSubmitResult(result: PendingSubmitResult, useOverlay: boolean) {
  if (useOverlay) {
    pendingSubmitResult.value = result
    return
  }

  applySubmitResult(result)
}

function syncCurrentPasswordFromDom() {
  currentPasswordFieldRef.value?.syncFromDom()
}

async function toggleCurrentPasswordVisibility() {
  syncCurrentPasswordFromDom()
  showCurrentPassword.value = !showCurrentPassword.value
  await nextTick()
  currentPasswordFieldRef.value?.applyToDom()
}

function resolveCurrentPassword() {
  syncCurrentPasswordFromDom()
  return currentPassword.value
}

async function handleSubmit() {
  if (isSubmitting.value) {
    return
  }

  isSubmitting.value = true

  // Повторный сабмит с уже показанными ошибками — не трогаем DOM до конца оверлея
  const useOverlay = hasValidationFeedback.value

  if (useOverlay) {
    showSubmittingOverlay.value = true
  }

  try {
    const response = await userApi.changePassword({
      current_password: resolveCurrentPassword(),
      new_password: newPassword.value,
      new_password_confirmation: confirmPassword.value,
    })

    if ('success' in response && response.success) {
      settleSubmitResult({
        kind: 'success',
        message: response.message || 'Пароль успешно изменён',
        nextPassword: newPassword.value,
      }, useOverlay)
      return
    }

    settleSubmitResult(resolveErrorResult(response), useOverlay)
  } catch (error) {
    const data = (error as { data?: unknown }).data
    settleSubmitResult(resolveErrorResult(data), useOverlay)
  } finally {
    if (useOverlay) {
      finishSubmittingOverlay()
    }
    else {
      clearSubmittingState()
    }
  }
}

function handleCancel() {
  resetFormFields()
  fieldErrors.value = {}
  submitError.value = ''
  void applyCachedCurrentPassword()
}

async function applyCachedCurrentPassword(force = false) {
  const password = await loadCurrentPassword(force)

  if (password) {
    currentPassword.value = password
  }
}

onMounted(() => {
  void applyCachedCurrentPassword()
})
</script>

<template>
  <div class="profile-page">
    <header class="profile-page__header">
      <AppBreadcrumbs :items="breadcrumbs" />

      <ProfileNotificationsBell />
    </header>

    <CommonPageTitle divider>Изменить пароль</CommonPageTitle>

    <form
      class="password-form"
      :class="{ 'password-form--submitting': isSubmitting }"
      :aria-busy="isSubmitting || undefined"
      @submit.prevent="handleSubmit"
    >
      <div class="password-form__body">
        <div class="password-form__fields">
          <CommonFormField
            id="current-password"
            ref="currentPasswordFieldRef"
            label="Текущий пароль"
            placeholder="Текущий пароль"
            autocomplete="current-password"
            allow-autofill
            no-margin
            :type="showCurrentPassword ? 'text' : 'password'"
            :model-value="currentPassword"
            :masked="!showCurrentPassword && Boolean(currentPassword)"
            :error="getFieldError('current_password')"
            @update:model-value="currentPassword = $event; clearFieldError('current_password')"
          >
            <template #trailing>
              <button
                type="button"
                class="password-form__toggle"
                :aria-label="showCurrentPassword ? 'Скрыть пароль' : 'Показать пароль'"
                @click="toggleCurrentPasswordVisibility"
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
            </template>
          </CommonFormField>

          <div class="password-form__new-row">
            <CommonFormField
              id="new-password"
              label="Новый пароль"
              placeholder="Новый пароль"
              autocomplete="new-password"
              minlength="8"
              no-margin
              :type="showNewPassword ? 'text' : 'password'"
              :model-value="newPassword"
              :masked="!showNewPassword && Boolean(newPassword)"
              :error="getFieldError('new_password')"
              @update:model-value="newPassword = $event; clearFieldError('new_password')"
            >
              <template #trailing>
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
              </template>
            </CommonFormField>
            <button
              type="button"
              class="password-form__generate"
              @click="handleGeneratePassword"
            >
              Сгенерировать
            </button>
          </div>

          <CommonFormField
            id="confirm-password"
            label="Новый пароль снова"
            placeholder="Новый пароль снова"
            autocomplete="new-password"
            minlength="8"
            no-margin
            :type="showNewPassword ? 'text' : 'password'"
            :model-value="confirmPassword"
            :masked="!showNewPassword && Boolean(confirmPassword)"
            :error="getFieldError('new_password_confirmation')"
            @update:model-value="confirmPassword = $event; clearFieldError('new_password_confirmation')"
          >
            <template #trailing>
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
            </template>
          </CommonFormField>
        </div>

        <p v-if="submitError" class="password-form__submit-error">
          {{ submitError }}
        </p>

        <Transition name="password-saving-fade" @after-leave="clearSubmittingState">
          <div
            v-if="showSubmittingOverlay"
            class="password-form__saving-overlay"
            aria-hidden="true"
          >
            <CommonSpinner
              variant="ring"
              :size="28"
              label="Сохранение пароля"
            />
          </div>
        </Transition>
      </div>

      <div class="password-form__actions">
        <CommonSaveButton
          type="submit"
          :disabled="isSubmitting"
        />
        <button type="button" class="password-form__cancel" @click="handleCancel">
          Отмена
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.profile-page {
  padding: 20px 40px 16px;
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
  padding: 0;
  box-sizing: border-box;
  overflow: visible;
}

.password-form {
  max-width: 896px;
}

.password-form__body {
  position: relative;
}

.password-form--submitting .password-form__body {
  pointer-events: none;
  user-select: none;
}

.password-form--submitting .password-form__actions {
  pointer-events: none;
}

.password-form--submitting :deep(.save-button:disabled) {
  opacity: 1;
}

.password-form__saving-overlay {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  pointer-events: none;
  background: rgba(255, 255, 255, 0.5);
  will-change: opacity;
}

.password-saving-fade-enter-active {
  transition: opacity 0.25s ease-out;
}

.password-saving-fade-leave-active {
  transition: opacity 0.75s cubic-bezier(0.22, 1, 0.36, 1);
}

.password-saving-fade-enter-from,
.password-saving-fade-leave-to {
  opacity: 0;
}

.password-form__fields {
  max-width: 520px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.password-form__new-row {
  position: relative;
  width: 100%;
}

.password-form__submit-error {
  max-width: 520px;
  margin: 0 0 16px;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 0.875rem;
  line-height: 1.35;
  color: var(--wh-field-error);
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
  top: calc(18px * 1.2 + 6px);
  left: calc(100% + 16px);
  padding: 0;
  border: none;
  background: none;
  color: var(--wh-green);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 18px;
  font-weight: 500;
  font-style: normal;
  line-height: calc(12px * 2 + 18px * 1.3);
  letter-spacing: -0.05em;
  text-decoration: underline;
  text-decoration-style: solid;
  text-underline-offset: 4px;
  text-decoration-thickness: auto;
  text-decoration-skip-ink: auto;
  white-space: nowrap;
  cursor: pointer;
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

.password-form__cancel {
  padding: 0;
  border: none;
  background: none;
  color: #dc3545;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s ease;
}

.password-form__cancel:hover {
  color: #c82333;
}

@media (--wh-tablet) {
  .profile-page {
    padding: 12px 8px 32px;
  }

  .profile-page__header,
  .password-form__actions {
    width: 100%;
  }
}

@media (--wh-mobile) {
  .profile-page {
    padding: 16px 20px 32px;
  }

  .profile-page__header {
    height: auto;
    min-height: 31px;
    padding: 0;
    background: transparent;
    border-radius: 0;
  }

  .password-form__generate {
    position: static;
    display: block;
    margin-top: 8px;
    line-height: 1.2;
  }

  .password-form__actions {
    flex-direction: column;
    align-items: stretch;
    margin-top: 24px;
    padding-top: 20px;
    border-top: none;
  }

  .password-form__actions :deep(.save-button) {
    width: 346px;
    min-width: 346px;
  }

  .password-form__cancel {
    display: none;
  }
}
</style>
