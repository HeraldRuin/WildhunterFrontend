<script setup lang="ts">
definePageMeta({
  layout: 'profile',
  middleware: 'auth',
})

useHead({
  title: 'Мой профиль — WH',
})

const { profile, pending, error, loadProfile, addWeaponRow } = useProfile()

const notificationCount = 2

onMounted(() => {
  loadProfile()
})

function removeWeapon(index: number) {
  if (!profile.value) {
    return
  }

  profile.value.weapons.splice(index, 1)
}

function saveWeapon(index: number) {
  const weapon = profile.value?.weapons[index]

  if (!weapon) {
    return
  }

  weapon.id = weapon.id ?? Date.now()
  weapon.isNew = false
}

function handleSubmit() {
  // TODO: подключить API сохранения профиля
}
</script>

<template>
  <div class="profile-page">
    <header class="profile-page__header">
      <nav class="profile-page__breadcrumbs" aria-label="Хлебные крошки">
        <NuxtLink to="/">Главная</NuxtLink>
        <span aria-hidden="true">&gt;</span>
        <span>Мой профиль</span>
      </nav>

      <button type="button" class="profile-page__notifications" aria-label="Уведомления">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3a5 5 0 00-5 5v3.5l-1.5 2.5h13L17 11.5V8a5 5 0 00-5-5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
          <path d="M10 18a2 2 0 004 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
        <span v-if="notificationCount" class="profile-page__notifications-badge">{{ notificationCount }}</span>
      </button>
    </header>

    <h1 class="profile-page__title">Настройки</h1>

    <p v-if="pending" class="profile-page__status">Загрузка профиля...</p>
    <p v-else-if="error" class="profile-page__status profile-page__status--error">{{ error }}</p>

    <form
      v-else-if="profile"
      class="profile-form"
      @submit.prevent="handleSubmit"
    >
      <div class="profile-form__grid">
        <section class="profile-form__section">
          <h2 class="profile-form__section-title">
            Личная информация
            <span class="profile-form__user-id">ID: {{ profile.id }}</span>
          </h2>

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
              rows="4"
              placeholder="Расскажите о себе"
            />
          </div>

          <div class="profile-form__field">
            <label class="profile-form__label">Аватар</label>
            <div class="profile-form__avatar-upload">
              <label class="profile-form__file-btn">
                Прикрепить файл
                <input type="file" accept="image/*" hidden>
              </label>
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
            </div>
          </div>
        </section>

        <section class="profile-form__section profile-form__section--hunting">
          <div class="profile-form__field">
            <label class="profile-form__label" for="hunter-billet">Номер охот. билета</label>
            <input
              id="hunter-billet"
              v-model="profile.hunter_billet_number"
              type="text"
              class="profile-form__input"
              placeholder="Добавить номер"
            >
          </div>

          <article
            v-for="(weapon, index) in profile.weapons"
            :key="weapon.id ?? `new-${index}`"
            class="profile-weapon"
          >
            <div class="profile-weapon__header">
              <h3 class="profile-weapon__title">Лицензия #{{ index + 1 }}</h3>
              <button
                v-if="weapon.id"
                type="button"
                class="profile-weapon__action"
                @click="removeWeapon(index)"
              >
                Удалить
              </button>
              <button
                v-else
                type="button"
                class="profile-weapon__action"
                @click="saveWeapon(index)"
              >
                Сохранить
              </button>
            </div>

            <div class="profile-weapon__row">
              <div class="profile-form__field profile-form__field--inline">
                <label class="profile-form__label">Номер</label>
                <input
                  v-model="weapon.hunter_license_number"
                  type="text"
                  class="profile-form__input"
                  placeholder="Добавить лицензию"
                  inputmode="numeric"
                >
              </div>
              <div class="profile-form__field profile-form__field--inline">
                <label class="profile-form__label">Дата</label>
                <input
                  v-model="weapon.hunter_license_date"
                  type="date"
                  class="profile-form__input"
                >
              </div>
            </div>

            <div class="profile-form__field">
              <label class="profile-form__label">Тип оружия</label>
              <select v-model="weapon.weapon_type_id" class="profile-form__select">
                <option value="" disabled hidden>Добавить оружие</option>
                <option
                  v-for="type in profile.weapon_types"
                  :key="type.value"
                  :value="type.value"
                >
                  {{ type.label }}
                </option>
              </select>
            </div>

            <div class="profile-form__field">
              <label class="profile-form__label">Калибр</label>
              <select v-model="weapon.caliber" class="profile-form__select">
                <option value="" disabled hidden>Добавить калибр</option>
                <option
                  v-for="caliber in profile.calibers"
                  :key="caliber.value"
                  :value="caliber.value"
                >
                  {{ caliber.label }}
                </option>
              </select>
            </div>
          </article>

          <button
            type="button"
            class="profile-form__add-weapon"
            @click="addWeaponRow"
          >
            Добавить оружие
          </button>
        </section>
      </div>

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
  color: var(--wh-green);
  transition: opacity 0.15s ease;
}

.profile-page__breadcrumbs a:hover {
  opacity: 0.8;
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

.profile-page__status {
  margin: 0;
  color: var(--wh-gray-600);
}

.profile-page__status--error {
  color: #dc2626;
}

.profile-form__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 32px 40px;
  align-items: start;
}

.profile-form__section-title {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 0 0 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--wh-gray-200);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--wh-gray-900);
}

.profile-form__user-id {
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--wh-gray-500);
}

.profile-form__section--hunting {
  padding-top: 36px;
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

.profile-form__row,
.profile-weapon__row {
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
.profile-form__select,
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
.profile-form__select:focus,
.profile-form__textarea:focus {
  border-color: var(--wh-orange-500);
  box-shadow: 0 0 0 3px rgba(238, 154, 60, 0.15);
}

.profile-form__textarea {
  resize: vertical;
  min-height: 100px;
}

.profile-form__select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 36px;
  cursor: pointer;
}

.profile-form__avatar-upload {
  display: flex;
  align-items: center;
  gap: 16px;
}

.profile-form__file-btn {
  display: inline-flex;
  align-items: center;
  padding: 10px 16px;
  border: 1px solid var(--wh-gray-200);
  border-radius: 10px;
  background: var(--wh-white);
  color: var(--wh-gray-600);
  font-size: 0.85rem;
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
  width: 56px;
  height: 56px;
  border-radius: 10px;
  background: #656c77;
  overflow: hidden;
}

.profile-form__avatar-preview img,
.profile-form__avatar-preview svg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-form__avatar-preview svg {
  width: 32px;
  height: 32px;
  color: rgba(255, 255, 255, 0.85);
}

.profile-weapon {
  margin-bottom: 16px;
  padding: 16px;
  border: 1px solid var(--wh-gray-200);
  border-radius: var(--wh-radius);
  background: var(--wh-white);
}

.profile-weapon__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.profile-weapon__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--wh-gray-900);
}

.profile-weapon__action {
  padding: 0;
  border: none;
  background: none;
  color: var(--wh-orange-text);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s ease;
}

.profile-weapon__action:hover {
  color: var(--wh-orange-600);
}

.profile-form__add-weapon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  background: var(--wh-orange-500);
  color: var(--wh-white);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.profile-form__add-weapon:hover {
  background: var(--wh-orange-600);
  transform: translateY(-1px);
}

.profile-form__actions {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--wh-gray-200);
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

@media (max-width: 1024px) {
  .profile-form__grid {
    grid-template-columns: 1fr;
  }

  .profile-form__section--hunting {
    padding-top: 0;
  }
}

@media (max-width: 900px) {
  .profile-page {
    padding: 16px 20px 40px;
  }
}

@media (max-width: 640px) {
  .profile-form__row,
  .profile-weapon__row {
    grid-template-columns: 1fr;
  }
}
</style>
