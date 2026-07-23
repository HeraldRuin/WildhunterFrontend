<script setup lang="ts">
definePageMeta({
  layout: 'profile',
  middleware: 'auth',
})

useHead({
  title: 'Изменить пароль — WH',
})

const notificationCount = 0

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

function generatePassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*'
  const length = 12
  const randomValues = new Uint32Array(length)

  crypto.getRandomValues(randomValues)
  newPassword.value = Array.from(randomValues, (value) => chars[value % chars.length]).join('')
  confirmPassword.value = newPassword.value
  showNewPassword.value = true
  showConfirmPassword.value = true
}

function handleSubmit() {
  // TODO: подключить API
}

function handleCancel() {
  navigateTo('/profile')
}
</script>

<template>
  <div class="profile-page">
    <header class="profile-page__header">
      <nav class="profile-page__breadcrumbs" aria-label="Хлебные крошки">
        <NuxtLink to="/">Главная</NuxtLink>
        <span aria-hidden="true">&gt;</span>
        <span>Параметр</span>
        <span aria-hidden="true">&gt;</span>
        <span>Изменить пароль</span>
      </nav>

      <button type="button" class="profile-page__notifications" aria-label="Уведомления">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3a5 5 0 00-5 5v3.5l-1.5 2.5h13L17 11.5V8a5 5 0 00-5-5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
          <path d="M10 18a2 2 0 004 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
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
              placeholder="Текущий пароль"
              autocomplete="current-password"
            >
            <button
              type="button"
              class="password-form__toggle"
              :aria-label="showCurrentPassword ? 'Скрыть пароль' : 'Показать пароль'"
              @click="showCurrentPassword = !showCurrentPassword"
            >
              <svg v-if="showCurrentPassword" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" fill="none" stroke="currentColor" stroke-width="1.75" />
                <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.75" />
              </svg>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 3l18 18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
                <path d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.4M9.9 4.2A10.8 10.8 0 0 1 12 4c6.5 0 10 8 10 8a18.4 18.4 0 0 1-4.8 5.7M6.7 6.7C4.1 8.4 2 12 2 12s3.5 7 10 7c1.2 0 2.3-.2 3.3-.5" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div class="password-form__field">
          <div class="password-form__label-row">
            <label class="password-form__label" for="new-password">Новый пароль</label>
          </div>
          <div class="password-form__new-row">
            <div class="password-form__input-wrap">
              <input
                id="new-password"
                v-model="newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                class="password-form__input"
                placeholder="Новый пароль"
                autocomplete="new-password"
                minlength="8"
              >
              <button
                type="button"
                class="password-form__toggle"
                :aria-label="showNewPassword ? 'Скрыть пароль' : 'Показать пароль'"
                @click="showNewPassword = !showNewPassword"
              >
                <svg v-if="showNewPassword" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" fill="none" stroke="currentColor" stroke-width="1.75" />
                  <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.75" />
                </svg>
                <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 3l18 18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
                  <path d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.4M9.9 4.2A10.8 10.8 0 0 1 12 4c6.5 0 10 8 10 8a18.4 18.4 0 0 1-4.8 5.7M6.7 6.7C4.1 8.4 2 12 2 12s3.5 7 10 7c1.2 0 2.3-.2 3.3-.5" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
                </svg>
              </button>
            </div>
            <button
              type="button"
              class="password-form__generate"
              @click="generatePassword"
            >
              Сгенерировать
            </button>
          </div>
        </div>

        <div class="password-form__field">
          <label class="password-form__label" for="confirm-password">Новый пароль снова</label>
          <div class="password-form__input-wrap">
            <input
              id="confirm-password"
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              class="password-form__input"
              placeholder="Новый пароль снова"
              autocomplete="new-password"
              minlength="8"
            >
            <button
              type="button"
              class="password-form__toggle"
              :aria-label="showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <svg v-if="showConfirmPassword" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" fill="none" stroke="currentColor" stroke-width="1.75" />
                <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.75" />
              </svg>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 3l18 18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
                <path d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.4M9.9 4.2A10.8 10.8 0 0 1 12 4c6.5 0 10 8 10 8a18.4 18.4 0 0 1-4.8 5.7M6.7 6.7C4.1 8.4 2 12 2 12s3.5 7 10 7c1.2 0 2.3-.2 3.3-.5" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="password-form__actions">
        <button type="submit" class="password-form__submit">
          Сохранить изменения
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
  margin-bottom: 20px;
  padding: 10px 16px;
  background: var(--wh-white);
  border: 1px solid var(--wh-gray-200);
  border-radius: var(--wh-radius);
}

.profile-page__breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  color: var(--wh-gray-500);
}

.profile-page__breadcrumbs a {
  color: var(--wh-green-800);
  transition: color 0.15s ease;
}

.profile-page__breadcrumbs a:hover {
  color: var(--wh-green-600);
}

.profile-page__notifications {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--wh-gray-900);
  cursor: pointer;
}

.profile-page__notifications svg {
  width: 22px;
  height: 22px;
}

.profile-page__notifications-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: #e74c3c;
  color: var(--wh-white);
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1;
}

.profile-page__title {
  margin: 0 0 24px;
  font-size: clamp(1.5rem, 2.5vw, 2rem);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: var(--wh-gray-900);
}

.profile-page__title--divider {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--wh-gray-200);
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

.password-form__label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.password-form__label {
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--wh-gray-600);
}

.password-form__new-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.password-form__input-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
}

.password-form__input {
  width: 100%;
  padding: 12px 44px 12px 14px;
  border: 1px solid var(--wh-gray-200);
  border-radius: 10px;
  background: var(--wh-white);
  color: var(--wh-gray-900);
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.password-form__input::placeholder {
  color: var(--wh-gray-400);
}

.password-form__input:focus {
  border-color: var(--wh-orange-500);
  box-shadow: 0 0 0 3px rgba(238, 154, 60, 0.15);
}

.password-form__toggle {
  position: absolute;
  top: 50%;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--wh-gray-400);
  cursor: pointer;
  transform: translateY(-50%);
  transition: color 0.15s ease;
}

.password-form__toggle:hover {
  color: var(--wh-gray-600);
}

.password-form__toggle svg {
  width: 20px;
  height: 20px;
}

.password-form__generate {
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: none;
  color: var(--wh-orange-text);
  font-size: 0.88rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.15s ease;
}

.password-form__generate:hover {
  color: var(--wh-orange-600);
}

.password-form__actions {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--wh-gray-200);
}

.password-form__submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 200px;
  padding: 14px 28px;
  border: none;
  border-radius: 10px;
  background: var(--wh-orange-500);
  color: var(--wh-white);
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.password-form__submit:hover {
  background: var(--wh-orange-600);
  transform: translateY(-1px);
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
  .password-form__new-row {
    flex-direction: column;
    align-items: stretch;
  }

  .password-form__generate {
    align-self: flex-end;
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
