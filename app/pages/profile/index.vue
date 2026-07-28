<script setup lang="ts">
definePageMeta({
  layout: 'profile',
  middleware: 'auth',
})

useHead({
  title: 'Мой профиль — WH',
})

const { user } = useAuth()
const { profile, pending, error, loadProfile } = useProfile()

const notificationCount = 2
const revealValues = ref(false)

const breadcrumbs = [
  { label: 'Главная', to: '/' },
  { label: 'Мой профиль' },
]

const isFormLoading = computed(() => pending.value && !profile.value)
const showForm = computed(() => Boolean(profile.value) || pending.value)

const profileId = computed(() => {
  const id = profile.value?.id || user.value?.id
  return id && Number(id) > 0 ? Number(id) : null
})

watch(
  profile,
  (next, prev) => {
    if (!next) {
      revealValues.value = false
      return
    }

    if (!prev) {
      revealValues.value = false
      nextTick(() => {
        revealValues.value = true
      })
      return
    }

    revealValues.value = true
  },
  { immediate: true },
)

onMounted(() => {
  loadProfile()
})

function handleSubmit() {
  // TODO: подключить API сохранения профиля
}

function setProfileField(
  field: 'user_name' | 'email' | 'first_name' | 'last_name' | 'phone' | 'birthday' | 'bio',
  event: Event,
) {
  if (!profile.value) {
    return
  }

  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  profile.value[field] = target.value
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
        <span v-if="notificationCount" class="profile-page__notifications-badge">{{ notificationCount }}</span>
      </button>
    </header>

    <CommonPageTitle divider>Настройки</CommonPageTitle>

    <p v-if="error && !showForm" class="profile-page__status profile-page__status--error">{{ error }}</p>

    <form
      v-else-if="showForm"
      class="profile-form"
      :class="{
        'profile-form--loading': isFormLoading,
        'profile-form--reveal': revealValues,
      }"
      :aria-busy="isFormLoading"
      @submit.prevent="handleSubmit"
    >
      <section class="profile-form__section">
        <h2 class="profile-form__section-title">
          Личная информация
          <CommonSpinner
            v-if="isFormLoading"
            class="profile-form__title-spinner"
            variant="ring"
            color="var(--wh-orange-500)"
            :size="18"
            label="Загрузка профиля"
          />
          <span
            v-else-if="profileId"
            class="profile-form__user-id"
            :class="{ 'profile-form__value-reveal': revealValues }"
          >
            ID: {{ profileId }}
          </span>
        </h2>

        <p v-if="error" class="profile-page__status profile-page__status--error">{{ error }}</p>

        <div class="profile-form__grid">
          <div class="profile-form__column">
            <div class="profile-form__field">
              <label class="profile-form__label" for="nickname">Ник</label>
              <input
                id="nickname"
                type="text"
                class="profile-form__input"
                :class="{ 'profile-form__value-reveal': revealValues }"
                :value="profile?.user_name ?? ''"
                :readonly="isFormLoading"
                placeholder="Ник пользователя"
                @input="setProfileField('user_name', $event)"
              >
            </div>

            <div class="profile-form__field">
              <label class="profile-form__label" for="email">Email</label>
              <input
                id="email"
                type="email"
                class="profile-form__input"
                :class="{ 'profile-form__value-reveal': revealValues }"
                :value="profile?.email ?? ''"
                :readonly="isFormLoading"
                placeholder="Email"
                @input="setProfileField('email', $event)"
              >
            </div>

            <div class="profile-form__row">
              <div class="profile-form__field">
                <label class="profile-form__label" for="first-name">Имя</label>
                <input
                  id="first-name"
                  type="text"
                  class="profile-form__input"
                  :class="{ 'profile-form__value-reveal': revealValues }"
                  :value="profile?.first_name ?? ''"
                  :readonly="isFormLoading"
                  placeholder="Имя"
                  @input="setProfileField('first_name', $event)"
                >
              </div>
              <div class="profile-form__field">
                <label class="profile-form__label" for="last-name">Фамилия</label>
                <input
                  id="last-name"
                  type="text"
                  class="profile-form__input"
                  :class="{ 'profile-form__value-reveal': revealValues }"
                  :value="profile?.last_name ?? ''"
                  :readonly="isFormLoading"
                  placeholder="Фамилия"
                  @input="setProfileField('last_name', $event)"
                >
              </div>
            </div>

            <div class="profile-form__field">
              <label class="profile-form__label" for="phone">Номер телефона</label>
              <input
                id="phone"
                type="tel"
                class="profile-form__input"
                :class="{ 'profile-form__value-reveal': revealValues }"
                :value="profile?.phone ?? ''"
                :readonly="isFormLoading"
                placeholder="+7 (999) 999-99-99"
                @input="setProfileField('phone', $event)"
              >
            </div>
          </div>

          <div class="profile-form__column">
            <div class="profile-form__field">
              <label class="profile-form__label" for="birthday">Дата рождения</label>
              <input
                id="birthday"
                type="text"
                class="profile-form__input"
                :class="{ 'profile-form__value-reveal': revealValues }"
                :value="profile?.birthday ?? ''"
                :readonly="isFormLoading"
                placeholder="ДД.ММ.ГГГГ"
                @input="setProfileField('birthday', $event)"
              >
            </div>

            <div class="profile-form__field">
              <label class="profile-form__label" for="bio">Обо мне</label>
              <textarea
                id="bio"
                class="profile-form__textarea"
                :class="{ 'profile-form__value-reveal': revealValues }"
                rows="5"
                :value="profile?.bio ?? ''"
                :readonly="isFormLoading"
                placeholder="Расскажите о себе"
                @input="setProfileField('bio', $event)"
              />
            </div>

            <div class="profile-form__field profile-form__field--avatar">
              <div class="profile-form__avatar-upload">
                <div
                  class="profile-form__avatar-preview"
                  :class="{ 'profile-form__avatar-preview--default': !profile?.avatar }"
                >
                  <img
                    v-if="profile?.avatar"
                    :src="profile.avatar"
                    alt="Аватар"
                    :class="{ 'profile-form__value-reveal': revealValues }"
                  >
                  <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" fill="currentColor" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="currentColor" />
                  </svg>
                </div>
                <div class="profile-form__avatar-controls">
                  <span class="profile-form__label">Аватар</span>
                  <label class="profile-form__file-btn">
                    Прикрепить файл
                    <input type="file" accept="image/*" hidden :disabled="isFormLoading">
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="profile-form__actions">
        <button type="submit" class="profile-form__submit" :disabled="isFormLoading">
          Сохранить изменения
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

.profile-page__status {
  margin: 0;
  color: var(--wh-gray-600);
}

.profile-page__status--error {
  color: #dc2626;
}

.profile-form--loading {
  pointer-events: none;
  user-select: none;
}

.profile-form--loading .profile-form__submit:disabled {
  opacity: 1;
  cursor: default;
  transform: none;
}

.profile-form__title-spinner {
  flex-shrink: 0;
}

.profile-form--reveal .profile-form__value-reveal {
  animation: profile-value-reveal 0.85s cubic-bezier(0.22, 1, 0.36, 1);
}

.profile-form__avatar-preview img.profile-form__value-reveal {
  animation: profile-value-fade 0.85s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes profile-value-reveal {
  from {
    color: transparent;
  }

  to {
    color: var(--wh-gray-900);
  }
}

@keyframes profile-value-fade {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .profile-form--reveal .profile-form__value-reveal,
  .profile-form__avatar-preview img.profile-form__value-reveal {
    animation: none;
  }
}

.profile-form__section {
  width: 896px;
  max-width: 100%;
}

.profile-form__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 24px 40px;
  align-items: start;
}

.profile-form__column {
  min-width: 0;
}

.profile-form__section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 20px;
  font-size: 20px;
  font-weight: 600;
  color: var(--wh-gray-900);
}

.profile-form__user-id {
  font-family: "Inter", sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 120%;
  letter-spacing: -0.05em;
  color: var(--wh-gray-900);
}

.profile-form__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.profile-form__field--inline {
  flex: 1;
  min-width: 0;
}

.profile-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.profile-form__label {
  font-family: "Inter", sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.05em;
  color: var(--wh-gray-600);
}

.profile-form__input,
.profile-form__textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  background: var(--wh-white);
  color: var(--wh-gray-900);
  font-family: "Inter", sans-serif;
  font-weight: 400;
  font-size: 18px;
  line-height: 130%;
  letter-spacing: -0.05em;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.profile-form__input::placeholder,
.profile-form__textarea::placeholder {
  font-family: "Inter", sans-serif;
  font-weight: 400;
  font-size: 18px;
  line-height: 130%;
  letter-spacing: -0.05em;
  color: var(--wh-gray-400);
}

.profile-form__input:focus,
.profile-form__textarea:focus {
  border-color: var(--wh-orange-500);
  box-shadow: 0 0 0 3px rgba(238, 154, 60, 0.15);
}

.profile-form__textarea {
  resize: vertical;
  min-height: 132px;
}

.profile-form__field--avatar {
  margin-bottom: 0;
}

.profile-form__avatar-upload {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.profile-form__avatar-controls {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.profile-form__file-btn {
  display: inline-flex;
  align-items: center;
  width: 100%;
  min-height: 48px;
  padding: 12px 14px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  background: var(--wh-white);
  color: var(--wh-gray-400);
  font-family: "Inter", sans-serif;
  font-weight: 400;
  font-size: 18px;
  line-height: 130%;
  letter-spacing: -0.05em;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  box-sizing: border-box;
}

.profile-form__file-btn:hover,
.profile-form__file-btn:focus-within {
  border-color: var(--wh-orange-500);
  box-shadow: 0 0 0 3px rgba(238, 154, 60, 0.15);
}

.profile-form__avatar-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 78px;
  height: 78px;
  flex-shrink: 0;
  border-radius: 12px;
  background: #e8eaee;
  overflow: hidden;
}

.profile-form__avatar-preview--default {
  box-sizing: border-box;
  border: 1px solid rgba(0, 0, 0, 0.2);
  background: var(--wh-white);
}

.profile-form__avatar-preview img,
.profile-form__avatar-preview svg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-form__avatar-preview svg {
  width: 40px;
  height: 40px;
  color: var(--wh-gray-400);
}

.profile-form__actions {
  width: 896px;
  max-width: 100%;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.2);
}

.profile-form__submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 220px;
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

.profile-form__submit:hover {
  background: var(--wh-orange-600);
  transform: translateY(-1px);
}

@media (--wh-tablet) {
  .profile-form__grid {
    grid-template-columns: 1fr;
  }

  .profile-page {
    padding: 16px 20px 40px;
  }
}

@media (--wh-mobile) {
  .profile-form__row {
    grid-template-columns: 1fr;
  }
}
</style>
