<script setup lang="ts">
definePageMeta({
  layout: 'profile',
  middleware: 'auth',
})

useHead({
  title: 'Лицензия на оружие — WH',
})

const { profile, pending, error, loadProfile, addWeaponRow } = useProfile()

const notificationCount = 0

const breadcrumbs = [
  { label: 'Главная', to: '/' },
  { label: 'Параметр' },
  { label: 'Лицензия на оружие' },
]

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
  // TODO: подключить API сохранения оружия
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

    <CommonPageTitle divider>Лицензия на оружие</CommonPageTitle>

    <p v-if="pending" class="profile-page__status">Загрузка...</p>
    <p v-else-if="error" class="profile-page__status profile-page__status--error">{{ error }}</p>

    <form
      v-else-if="profile"
      class="weapons-form"
      @submit.prevent="handleSubmit"
    >
      <CommonFormField
        id="hunter-billet"
        label="Номер охот. билета"
        placeholder="Добавить номер"
        v-model="profile.hunter_billet_number"
      />

      <article
        v-for="(weapon, index) in profile.weapons"
        :key="weapon.id ?? `new-${index}`"
        class="profile-weapon"
      >
        <div class="profile-weapon__header">
          <h2 class="profile-weapon__title">Лицензия #{{ index + 1 }}</h2>
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
          <CommonFormField
            label="Номер"
            placeholder="Добавить лицензию"
            inputmode="numeric"
            no-margin
            v-model="weapon.hunter_license_number"
          />
          <CommonFormField
            label="Дата"
            type="date"
            no-margin
            v-model="weapon.hunter_license_date"
          />
        </div>

        <div class="weapons-form__field">
          <label class="weapons-form__label">Тип оружия</label>
          <select v-model="weapon.weapon_type_id" class="weapons-form__select">
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

        <div class="weapons-form__field">
          <label class="weapons-form__label">Калибр</label>
          <select v-model="weapon.caliber" class="weapons-form__select">
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
        class="weapons-form__add"
        @click="addWeaponRow"
      >
        Добавить оружие
      </button>

      <div class="weapons-form__actions">
        <CommonSaveButton type="submit" />
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
  padding: 0;
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

.weapons-form {
  max-width: 520px;
}

.weapons-form__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.weapons-form__label {
  font-family: "Inter", sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.05em;
  color: var(--wh-gray-600);
}

.weapons-form__select {
  width: 100%;
  padding: 12px 36px 12px 14px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  background-color: var(--wh-white);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  color: var(--wh-gray-900);
  font-family: "Inter", sans-serif;
  font-size: 18px;
  line-height: 130%;
  letter-spacing: -0.05em;
  appearance: none;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  box-sizing: border-box;
}

.weapons-form__select:focus {
  border-color: var(--wh-orange-500);
  box-shadow: 0 0 0 3px rgba(238, 154, 60, 0.15);
}

.profile-weapon {
  margin-bottom: 16px;
  padding: 16px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 10px;
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
  font-size: 1rem;
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

.profile-weapon__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.weapons-form__add {
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

.weapons-form__add:hover {
  background: var(--wh-orange-600);
  transform: translateY(-1px);
}

.weapons-form__actions {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.2);
}

@media (--wh-tablet) {
  .profile-page {
    padding: 12px 8px 32px;
  }

  .profile-page__header {
    width: 100%;
  }
}

@media (--wh-mobile) {
  .profile-page__header {
    height: auto;
    min-height: 31px;
    padding: 0;
    background: transparent;
    border-radius: 0;
  }

  .profile-weapon__row {
    grid-template-columns: 1fr;
  }

  .weapons-form__actions {
    border-top: none;
    padding-top: 0;
  }
}
</style>
