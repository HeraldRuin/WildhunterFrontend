<script setup lang="ts">
import type { Role } from '~/types/api'
import { extractPhoneDigits, formatPhone } from '~/utils/phone'

const { isOpen, close } = useRegisterModal()
const { open: openLoginModal } = useLoginModal()
const { roles: rolesApi, auth } = useApi()
const { loginWithSession } = useAuth()

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
}

const phone = computed({
  get() {
    return formatPhone(phoneDigits.value)
  },
  set(value: string) {
    phoneDigits.value = extractPhoneDigits(value)
  },
})

const roleOptions = computed(() =>
  roles.value.map(item => ({
    value: item.code,
    label: item.name,
  })),
)

const rolePlaceholder = computed(() => {
  if (rolesLoading.value) {
    return 'Загрузка ролей...'
  }

  if (rolesError.value) {
    return 'Роль недоступна'
  }

  return 'Выберите роль'
})

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
  clearFieldError('phone')
}

function handleGeneratePassword() {
  password.value = generatePassword()
  showPassword.value = true
  clearFieldError('password')
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
      loginWithSession({
        token: response.token,
        token_type: response.token_type,
        user: response.user,
      })
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
    return
  }

  resetForm()
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
            <CommonSpinner variant="ring" size="lg" label="Регистрация" />
          </div>

          <CommonModalCloseButton :disabled="isSubmitting" @click="close" />

          <h2 id="register-modal-title" class="register-modal__title">Регистрация</h2>

          <form class="register-modal__form" novalidate @submit.prevent="handleSubmit">
            <div class="register-modal__row">
              <CommonFormField
                id="register-first-name"
                placeholder="Имя"
                autocomplete="given-name"
                no-margin
                :model-value="firstName"
                :error="getFieldError('first_name')"
                :disabled="isSubmitting"
                @update:model-value="firstName = $event; clearFieldError('first_name')"
              />
              <CommonFormField
                id="register-last-name"
                placeholder="Фамилия"
                autocomplete="family-name"
                no-margin
                :model-value="lastName"
                :error="getFieldError('last_name')"
                :disabled="isSubmitting"
                @update:model-value="lastName = $event; clearFieldError('last_name')"
              />
            </div>

            <CommonSelectField
              v-model="role"
              no-margin
              :placeholder="rolePlaceholder"
              :options="roleOptions"
              :disabled="rolesLoading || !!rolesError || isSubmitting"
              :error="getFieldError('role') || rolesError"
              @update:model-value="clearFieldError('role')"
            />

            <CommonFormField
              id="register-phone"
              type="tel"
              placeholder="+7 (___) ___-__-__"
              autocomplete="tel"
              inputmode="numeric"
              maxlength="18"
              no-margin
              :model-value="phone"
              :error="getFieldError('phone')"
              :disabled="isSubmitting"
              @update:model-value="phone = $event; clearFieldError('phone')"
              @keydown="handlePhoneKeydown"
              @paste="handlePhonePaste"
            />

            <CommonFormField
              id="register-email"
              placeholder="Адрес Email"
              autocomplete="email"
              inputmode="email"
              no-margin
              :model-value="email"
              :error="getFieldError('email')"
              :disabled="isSubmitting"
              @update:model-value="email = $event; clearFieldError('email')"
            />

            <CommonFormField
              id="register-password"
              placeholder="Пароль"
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
                <div class="register-modal__password-actions">
                  <button
                    type="button"
                    class="register-modal__generate"
                    @click="handleGeneratePassword"
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
                    >
                    <img
                      v-else
                      src="/icons/weui_eyes-off-filled.png"
                      alt=""
                      aria-hidden="true"
                      class="register-modal__password-icon register-modal__password-icon--hidden"
                    >
                  </button>
                </div>
              </template>
            </CommonFormField>

            <label class="register-modal__terms">
              <input
                v-model="acceptTerms"
                type="checkbox"
                class="register-modal__checkbox"
                @change="clearFieldError('term')"
              >
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
  border-radius: var(--wh-radius);
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

.register-modal__password-actions {
  display: flex;
  align-items: center;
  gap: 4px;
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

.register-modal__field-error,
.register-modal__error {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.35;
  color: var(--wh-field-error);
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
  border: 1px solid var(--wh-field-border);
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

@media (--wh-mobile-sm) {
  .register-modal__card {
    padding: 32px 24px 24px;
  }

  .register-modal__row {
    grid-template-columns: 1fr;
  }

  .register-modal__generate {
    font-size: 0.76rem;
  }

  .register-modal__form :deep(.form-field__input--with-trailing-wide) {
    padding-right: 148px;
  }
}
</style>
