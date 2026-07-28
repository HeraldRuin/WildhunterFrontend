<script setup lang="ts">
definePageMeta({
  layout: 'profile',
  middleware: 'auth',
})

useHead({
  title: 'Мой профиль — WH',
})

const { profile, pending, error, loadProfile } = useProfile()

const notificationCount = 2

const breadcrumbs = [
  { label: 'Главная', to: '/' },
  { label: 'Мой профиль' },
]

onMounted(() => {
  loadProfile()
})

function handleSubmit() {
  // TODO: подключить API сохранения профиля
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

    <p v-if="pending" class="profile-page__status">Загрузка профиля...</p>
    <p v-else-if="error" class="profile-page__status profile-page__status--error">{{ error }}</p>

    <form
      v-else-if="profile"
      class="profile-form"
      @submit.prevent="handleSubmit"
    >
      <section class="profile-form__section">
        <h2 class="profile-form__section-title">
          Личная информация
          <span class="profile-form__user-id">ID: {{ profile.id }}</span>
        </h2>

        <div class="profile-form__grid">
          <div class="profile-form__column">
            <div class="profile-form__field">
              <label class="profile-form__label" for="nickname">Ник</label>
              <input
                id="nickname"
                v-model="profile.user_name"
                type="text"
                class="profile-form__input"
                placeholder="Ник пользователя"
              >
            </div>

            <div class="profile-form__field">
              <label class="profile-form__label" for="email">Email</label>
              <input
                id="email"
                v-model="profile.email"
                type="email"
                class="profile-form__input"
                placeholder="Email"
              >
            </div>

            <div class="profile-form__row">
              <div class="profile-form__field">
                <label class="profile-form__label" for="first-name">Имя</label>
                <input
                  id="first-name"
                  v-model="profile.first_name"
                  type="text"
                  class="profile-form__input"
                  placeholder="Имя"
                >
              </div>
              <div class="profile-form__field">
                <label class="profile-form__label" for="last-name">Фамилия</label>
                <input
                  id="last-name"
                  v-model="profile.last_name"
                  type="text"
                  class="profile-form__input"
                  placeholder="Фамилия"
                >
              </div>
            </div>

            <div class="profile-form__field">
              <label class="profile-form__label" for="phone">Номер телефона</label>
              <input
                id="phone"
                v-model="profile.phone"
                type="tel"
                class="profile-form__input"
                placeholder="+7 (999) 999-99-99"
              >
            </div>
          </div>

          <div class="profile-form__column">
            <div class="profile-form__field">
              <label class="profile-form__label" for="birthday">Дата рождения</label>
              <input
                id="birthday"
                v-model="profile.birthday"
                type="text"
                class="profile-form__input"
                placeholder="ДД.ММ.ГГГГ"
              >
            </div>

            <div class="profile-form__field">
              <label class="profile-form__label" for="bio">Обо мне</label>
              <textarea
                id="bio"
                v-model="profile.bio"
                class="profile-form__textarea"
                rows="5"
                placeholder="Расскажите о себе"
              />
            </div>

            <div class="profile-form__field">
              <label class="profile-form__label">Аватар</label>
              <div class="profile-form__avatar-upload">
                <div class="profile-form__avatar-preview">
                  <img
                    v-if="profile.avatar"
                    :src="profile.avatar"
                    alt="Аватар"
                  >
                  <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" fill="currentColor" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="currentColor" />
                  </svg>
                </div>
                <label class="profile-form__file-btn">
                  Прикрепить файл
                  <input type="file" accept="image/*" hidden>
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="profile-form__actions">
        <button type="submit" class="profile-form__submit">
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
  align-items: baseline;
  gap: 10px;
  margin: 0 0 20px;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--wh-gray-900);
}

.profile-form__user-id {
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--wh-gray-500);
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
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--wh-gray-600);
}

.profile-form__input,
.profile-form__textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--wh-gray-200);
  border-radius: 10px;
  background: var(--wh-white);
  color: var(--wh-gray-900);
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.profile-form__input::placeholder,
.profile-form__textarea::placeholder {
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

.profile-form__avatar-upload {
  display: flex;
  align-items: center;
  gap: 12px;
}

.profile-form__file-btn {
  display: inline-flex;
  flex: 1;
  align-items: center;
  min-width: 0;
  min-height: 48px;
  padding: 12px 14px;
  border: 1px solid var(--wh-gray-200);
  border-radius: 10px;
  background: var(--wh-white);
  color: var(--wh-gray-400);
  font-size: 0.9rem;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.profile-form__file-btn:hover {
  border-color: var(--wh-gray-300);
}

.profile-form__avatar-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 10px;
  background: #e8eaee;
  overflow: hidden;
}

.profile-form__avatar-preview img,
.profile-form__avatar-preview svg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-form__avatar-preview svg {
  width: 28px;
  height: 28px;
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
