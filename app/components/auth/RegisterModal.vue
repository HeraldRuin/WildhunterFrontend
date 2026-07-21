<script setup lang="ts">
import type { Role } from '~/types/api'

const { isOpen, close } = useRegisterModal()
const { open: openLoginModal } = useLoginModal()
const { roles: rolesApi, auth } = useApi()

const firstName = ref('')
const lastName = ref('')
const role = ref('')
const phoneDigits = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const acceptTerms = ref(false)

const roles = ref<Role[]>([])
const rolesLoading = ref(false)
const rolesError = ref('')
const isRoleOpen = ref(false)
const roleFieldRef = ref<HTMLElement | null>(null)
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

function applyValidationErrors(data: unknown) {
  if (!data || typeof data !== 'object') {
    return false
  }

  const response = data as { message?: string, errors?: Record<string, string[]> }

  if (response.errors) {
    fieldErrors.value = response.errors
    submitError.value = ''
    return true
  }

  if (response.message) {
    submitError.value = response.message
  }

  return false
}

async function loadRoles() {
  rolesLoading.value = true
  rolesError.value = ''

  try {
    const response = await rolesApi.getRoles()

    if (response.success) {
      roles.value = response.data
      return
    }

    rolesError.value = response.message || 'Не удалось загрузить роли'
  } catch {
    rolesError.value = 'Не удалось загрузить роли'
  } finally {
    rolesLoading.value = false
  }
}

function resetForm() {
  firstName.value = ''
  lastName.value = ''
  role.value = ''
  phoneDigits.value = ''
  email.value = ''
  password.value = ''
  showPassword.value = false
  acceptTerms.value = false
  rolesError.value = ''
  submitError.value = ''
  fieldErrors.value = {}
  isSubmitting.value = false
  isRoleOpen.value = false
}

function extractPhoneDigits(value: string) {
  let digits = value.replace(/\D/g, '')

  if (digits.startsWith('7') || digits.startsWith('8')) {
    digits = digits.slice(1)
  }

  return digits.slice(0, 10)
}

function formatPhone(digits: string) {
  const normalized = extractPhoneDigits(digits)

  if (!normalized.length) {
    return ''
  }

  let formatted = '+7'

  formatted += ` (${normalized.slice(0, 3)}`

  if (normalized.length >= 3) {
    formatted += ')'
  }

  if (normalized.length > 3) {
    formatted += ` ${normalized.slice(3, 6)}`
  }

  if (normalized.length > 6) {
    formatted += `-${normalized.slice(6, 8)}`
  }

  if (normalized.length > 8) {
    formatted += `-${normalized.slice(8, 10)}`
  }

  return formatted
}

const phone = computed({
  get() {
    return formatPhone(phoneDigits.value)
  },
  set(value: string) {
    phoneDigits.value = extractPhoneDigits(value)
  },
})

const selectedRole = computed(() => roles.value.find((item) => item.code === role.value) ?? null)

const roleLabel = computed(() => {
  if (rolesLoading.value) {
    return 'Загрузка ролей...'
  }

  if (selectedRole.value) {
    return selectedRole.value.name
  }

  return 'Выберите роль'
})

function toggleRoleDropdown() {
  if (rolesLoading.value || rolesError.value) {
    return
  }

  isRoleOpen.value = !isRoleOpen.value
}

function selectRole(item: Role) {
  role.value = item.code
  clearFieldError('role')
  isRoleOpen.value = false
}

function closeRoleDropdown() {
  isRoleOpen.value = false
}

function handleDocumentClick(event: MouseEvent) {
  if (!roleFieldRef.value?.contains(event.target as Node)) {
    closeRoleDropdown()
  }
}

function handlePhoneKeydown(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return
  }

  const allowedKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'Escape',
    'Enter',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ]

  if (allowedKeys.includes(event.key)) {
    return
  }

  if (!/^\d$/.test(event.key)) {
    event.preventDefault()
    return
  }

  if (phoneDigits.value.length >= 10) {
    event.preventDefault()
  }
}

function handlePhonePaste(event: ClipboardEvent) {
  event.preventDefault()
  phoneDigits.value = extractPhoneDigits(event.clipboardData?.getData('text') ?? '')
}

function generatePassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*'
  const length = 12
  const randomValues = new Uint32Array(length)

  crypto.getRandomValues(randomValues)
  password.value = Array.from(randomValues, (value) => chars[value % chars.length]).join('')
  showPassword.value = true
}

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value
}

async function handleSubmit() {
  isSubmitting.value = true

  try {
    const response = await auth.register({
      first_name: firstName.value.trim(),
      last_name: lastName.value.trim(),
      email: email.value.trim(),
      password: password.value,
      phone: phone.value,
      role: role.value,
      term: acceptTerms.value,
    })

    if (response.success) {
      close()
      return
    }

    if (!applyValidationErrors(response)) {
      fieldErrors.value = {}
      submitError.value = response.message || 'Не удалось зарегистрироваться'
    }
  } catch (error) {
    const data = (error as { data?: unknown }).data

    if (!applyValidationErrors(data)) {
      fieldErrors.value = {}
      submitError.value = 'Не удалось зарегистрироваться'
    }
  } finally {
    isSubmitting.value = false
  }
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

function switchToLogin() {
  close()
  openLoginModal()
}

watch(isOpen, (open) => {
  if (open) {
    loadRoles()
    document.addEventListener('click', handleDocumentClick)
    return
  }

  document.removeEventListener('click', handleDocumentClick)
  resetForm()
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="register-modal">
      <div
        v-if="isOpen"
        class="register-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-modal-title"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <div class="register-modal__card">
          <div
            v-if="isSubmitting"
            class="register-modal__loader"
            aria-hidden="true"
          >
            <span class="register-modal__spinner" />
          </div>

          <button
            type="button"
            class="register-modal__close"
            aria-label="Закрыть"
            :disabled="isSubmitting"
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

          <h2 id="register-modal-title" class="register-modal__title">Регистрация</h2>

          <form class="register-modal__form" novalidate @submit.prevent="handleSubmit">
            <div class="register-modal__row">
              <div class="register-modal__field">
                <input
                  v-model="firstName"
                  type="text"
                  class="register-modal__input"
                  :class="{ 'register-modal__input--error': getFieldError('first_name') }"
                  placeholder="Имя"
                  autocomplete="given-name"
                  @input="clearFieldError('first_name')"
                />
                <p v-if="getFieldError('first_name')" class="register-modal__field-error">
                  {{ getFieldError('first_name') }}
                </p>
              </div>
              <div class="register-modal__field">
                <input
                  v-model="lastName"
                  type="text"
                  class="register-modal__input"
                  :class="{ 'register-modal__input--error': getFieldError('last_name') }"
                  placeholder="Фамилия"
                  autocomplete="family-name"
                  @input="clearFieldError('last_name')"
                />
                <p v-if="getFieldError('last_name')" class="register-modal__field-error">
                  {{ getFieldError('last_name') }}
                </p>
              </div>
            </div>

            <div
              ref="roleFieldRef"
              class="register-modal__field register-modal__field--role"
            >
              <button
                type="button"
                class="register-modal__dropdown-trigger"
                :class="{
                  'register-modal__dropdown-trigger--placeholder': !selectedRole,
                  'register-modal__dropdown-trigger--open': isRoleOpen,
                  'register-modal__input--error': getFieldError('role'),
                }"
                :disabled="rolesLoading || !!rolesError"
                @click="toggleRoleDropdown"
              >
                <span class="register-modal__dropdown-value">{{ roleLabel }}</span>
              </button>
              <svg class="register-modal__dropdown-chevron" width="12" height="8" viewBox="0 0 12 8" aria-hidden="true">
                <path d="M1 2 6 6.5 11 2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>

              <ul v-if="isRoleOpen && roles.length" class="register-modal__dropdown-list">
                <li v-for="item in roles" :key="item.id">
                  <button
                    type="button"
                    class="register-modal__dropdown-option"
                    :class="{ 'register-modal__dropdown-option--active': item.code === role }"
                    @click="selectRole(item)"
                  >
                    {{ item.name }}
                  </button>
                </li>
              </ul>

              <p v-if="getFieldError('role')" class="register-modal__field-error">
                {{ getFieldError('role') }}
              </p>
            </div>

            <p v-if="rolesError" class="register-modal__error">
              {{ rolesError }}
            </p>

            <div class="register-modal__field">
              <input
                v-model="phone"
                type="tel"
                class="register-modal__input"
                :class="{ 'register-modal__input--error': getFieldError('phone') }"
                placeholder="+7 (___) ___-__-__"
                autocomplete="tel"
                inputmode="numeric"
                maxlength="18"
                @input="clearFieldError('phone')"
                @keydown="handlePhoneKeydown"
                @paste="handlePhonePaste"
              />
              <p v-if="getFieldError('phone')" class="register-modal__field-error">
                {{ getFieldError('phone') }}
              </p>
            </div>

            <div class="register-modal__field">
              <input
                v-model="email"
                type="text"
                class="register-modal__input"
                :class="{ 'register-modal__input--error': getFieldError('email') }"
                placeholder="Адрес Email"
                autocomplete="email"
                inputmode="email"
                @input="clearFieldError('email')"
              />
              <p v-if="getFieldError('email')" class="register-modal__field-error">
                {{ getFieldError('email') }}
              </p>
            </div>

            <div class="register-modal__field">
              <div class="register-modal__password-wrap">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  class="register-modal__input register-modal__input--password"
                  :class="{ 'register-modal__input--error': getFieldError('password') }"
                  placeholder="Пароль"
                  autocomplete="new-password"
                  @input="clearFieldError('password')"
                />

              <div class="register-modal__password-actions">
                <button
                  type="button"
                  class="register-modal__generate"
                  @click="generatePassword"
                >
                  Сгенерировать
                </button>

                <button
                  type="button"
                  class="register-modal__toggle-password"
                  :aria-label="showPassword ? 'Скрыть пароль' : 'Показать пароль'"
                  @click="togglePasswordVisibility"
                >
                  <img
                    v-if="showPassword"
                    src="/icons/Group.png"
                    alt=""
                    aria-hidden="true"
                    class="register-modal__password-icon"
                  />
                  <img
                    v-else
                    src="/icons/weui_eyes-off-filled.png"
                    alt=""
                    aria-hidden="true"
                    class="register-modal__password-icon register-modal__password-icon--hidden"
                  />
                </button>
              </div>
            </div>
              <p v-if="getFieldError('password')" class="register-modal__field-error">
                {{ getFieldError('password') }}
              </p>
            </div>

            <label class="register-modal__terms">
              <input
                v-model="acceptTerms"
                type="checkbox"
                class="register-modal__checkbox"
                @change="clearFieldError('term')"
              />
              <span>
                Мною прочитаны и принимаются
                <NuxtLink to="/terms" class="register-modal__terms-link" @click="close">
                  Условия использования и Политика конфиденциальности
                </NuxtLink>
              </span>
            </label>
            <p v-if="getFieldError('term')" class="register-modal__field-error">
              {{ getFieldError('term') }}
            </p>

            <p v-if="submitError" class="register-modal__error">
              {{ submitError }}
            </p>

            <button type="submit" class="register-modal__submit" :disabled="isSubmitting">
              Регистрация
            </button>
          </form>

          <p class="register-modal__footer">
            Уже есть аккаунт?
            <button type="button" class="register-modal__login-link" @click="switchToLogin">
              Вход
            </button>
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.register-modal {
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

.register-modal__card {
  position: relative;
  width: 592px;
  min-width: min(100%, var(--wh-auth-modal-width));
  padding: 40px 36px 32px;
  border-radius: var(--wh-radius-xl);
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
}

.register-modal__loader {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: inherit;
  background: transparent;
  pointer-events: all;
}

.register-modal__spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--wh-gray-200);
  border-top-color: var(--wh-orange-500);
  border-radius: 50%;
  background: var(--wh-white);
  box-shadow: 0 4px 16px rgba(17, 24, 39, 0.12);
  animation: register-modal-spin 0.75s linear infinite;
}

@keyframes register-modal-spin {
  to {
    transform: rotate(360deg);
  }
}

.register-modal__close {
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

.register-modal__close:hover:not(:disabled) {
  color: var(--wh-gray-900);
  background: var(--wh-gray-100);
}

.register-modal__close:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.register-modal__title {
  margin: 0 0 28px;
  font-size: 1.75rem;
  font-weight: 800;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--wh-gray-900);
}

.register-modal__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.register-modal__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.register-modal__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.register-modal__field-error {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.35;
  color: #dc2626;
}

.register-modal__input--error,
.register-modal__input--error:focus,
.register-modal__dropdown-trigger.register-modal__input--error,
.register-modal__dropdown-trigger.register-modal__input--error:focus-visible {
  border-color: #dc2626;
}

.register-modal__input {
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

.register-modal__input::placeholder {
  color: var(--wh-gray-400);
}

.register-modal__input:focus {
  border-color: var(--wh-orange-500);
  box-shadow: 0 0 0 3px rgba(209, 101, 16, 0.15);
}

.register-modal__password-wrap {
  position: relative;
}

.register-modal__input--password {
  padding-right: 168px;
}

.register-modal__password-actions {
  position: absolute;
  top: 50%;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  transform: translateY(-50%);
}

.register-modal__generate {
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

.register-modal__generate:hover {
  color: var(--wh-orange-600);
}

.register-modal__toggle-password {
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

.register-modal__toggle-password:hover {
  color: var(--wh-gray-700);
  background: var(--wh-gray-100);
}

.register-modal__password-icon {
  display: block;
  flex-shrink: 0;
  width: 22px;
  height: 14px;
  object-fit: contain;
  object-position: center;
}

.register-modal__password-icon--hidden {
  width: 26px;
  height: 26px;
}

.register-modal__field--role {
  position: relative;
  z-index: 3;
}

.register-modal__dropdown-trigger {
  width: 100%;
  min-height: 48px;
  padding: 12px 40px 12px 12px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  background: var(--wh-white);
  color: var(--wh-gray-900);
  font: inherit;
  text-align: left;
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.register-modal__dropdown-trigger--placeholder .register-modal__dropdown-value {
  color: var(--wh-gray-400);
}

.register-modal__dropdown-trigger--open,
.register-modal__dropdown-trigger:focus-visible {
  border-color: var(--wh-orange-500);
  box-shadow: 0 0 0 3px rgba(209, 101, 16, 0.15);
}

.register-modal__dropdown-trigger:disabled {
  cursor: not-allowed;
  background: var(--wh-gray-100);
  color: var(--wh-gray-400);
}

.register-modal__dropdown-value {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.register-modal__dropdown-chevron {
  position: absolute;
  top: 24px;
  right: 16px;
  color: var(--wh-gray-900);
  pointer-events: none;
  transform: translateY(-50%);
}

.register-modal__dropdown-list {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 20;
  margin: 0;
  padding: 6px 8px;
  list-style: none;
  border: 1px solid var(--wh-gray);
  border-radius: 14px;
  background: var(--wh-white);
  color: var(--wh-black-text);
  overflow: hidden;
}

.register-modal__dropdown-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--wh-black-text);
  font: inherit;
  font-size: 0.98rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.register-modal__dropdown-option::before {
  content: '';
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: transparent;
}

.register-modal__dropdown-option:hover {
  background: var(--wh-orange-500);
  color: var(--wh-white);
}

.register-modal__dropdown-option--active::before {
  background: var(--wh-orange-500);
}

.register-modal__dropdown-option--active:hover {
  background: var(--wh-orange-500);
  color: var(--wh-white);
}

.register-modal__dropdown-option--active:hover::before {
  background: var(--wh-white);
}

.register-modal__error {
  margin: -4px 0 0;
  font-size: 0.82rem;
  color: #dc2626;
}

.register-modal__terms {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--wh-gray-900);
  cursor: pointer;
  user-select: none;
}

.register-modal__checkbox {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-top: 2px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 3px;
  background: var(--wh-white);
  appearance: none;
  cursor: pointer;
  position: relative;
}

.register-modal__checkbox:checked::after {
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

.register-modal__terms-link {
  color: var(--wh-orange-500);
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 0.15s ease;
}

.register-modal__terms-link:hover {
  color: var(--wh-orange-600);
}

.register-modal__submit {
  width: 100%;
  margin-top: 4px;
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

.register-modal__submit:hover {
  background: var(--wh-orange-600);
  transform: translateY(-1px);
}

.register-modal__submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.register-modal__footer {
  margin: 24px 0 0;
  text-align: center;
  font-size: 0.95rem;
  color: var(--wh-gray-900);
}

.register-modal__login-link {
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

.register-modal__login-link:hover {
  color: var(--wh-orange-600);
}

.register-modal-enter-active,
.register-modal-leave-active {
  transition: opacity 0.2s ease;
}

.register-modal-enter-active .register-modal__card,
.register-modal-leave-active .register-modal__card {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.register-modal-enter-from,
.register-modal-leave-to {
  opacity: 0;
}

.register-modal-enter-from .register-modal__card,
.register-modal-leave-to .register-modal__card {
  transform: translateY(12px) scale(0.98);
  opacity: 0;
}

@media (max-width: 480px) {
  .register-modal__card {
    padding: 32px 24px 24px;
  }

  .register-modal__row {
    grid-template-columns: 1fr;
  }

  .register-modal__input--password {
    padding-right: 148px;
  }

  .register-modal__generate {
    font-size: 0.76rem;
  }
}
</style>
