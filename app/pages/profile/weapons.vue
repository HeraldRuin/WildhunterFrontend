<script setup lang="ts">
definePageMeta({
  layout: 'profile',
  middleware: 'auth',
})

useHead({
  title: 'Лицензия на оружие — WH',
})

import type { WeaponOption } from '~/types/user'

const { profile, pending, error, loadProfile, addWeaponRow } = useProfile()
const { weapons: weaponsApi } = useApi()
const notifications = useNotifications()

const notificationCount = 0
const pulseUnsavedSave = ref(false)
const pulseNotificationId = ref<string | null>(null)
const weaponTypes = ref<WeaponOption[]>([])
const weaponTypesLoading = ref(false)
const weaponTypesError = ref('')

const breadcrumbs = [
  { label: 'Главная', to: '/' },
  { label: 'Параметр' },
  { label: 'Лицензия на оружие' },
]

async function loadWeaponTypes() {
  weaponTypesLoading.value = true
  weaponTypesError.value = ''

  try {
    weaponTypes.value = await weaponsApi.getWeaponTypeOptions()
  } catch {
    weaponTypes.value = []
    weaponTypesError.value = 'Не удалось загрузить типы оружия'
  } finally {
    weaponTypesLoading.value = false
  }
}

onMounted(() => {
  loadProfile()
  loadWeaponTypes()
})

function stopSavePulse() {
  pulseUnsavedSave.value = false
  pulseNotificationId.value = null
}

watch(
  () => notifications.notifications.value,
  (list) => {
    if (!pulseNotificationId.value) {
      return
    }

    const stillOpen = list.some(item => item.id === pulseNotificationId.value)

    if (!stillOpen) {
      stopSavePulse()
    }
  },
)

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
  stopSavePulse()
}

function handleAddWeapon() {
  if (hasNewWeapon.value) {
    pulseUnsavedSave.value = true
    pulseNotificationId.value = notifications.warning(
      'Сначала сохраните или отмените текущую лицензию',
      'Нельзя добавить ещё одно оружие',
    )
    return
  }

  stopSavePulse()
  addWeaponRow()

  nextTick(() => {
    const cards = document.querySelectorAll('.profile-weapon')
    const last = cards[cards.length - 1] as HTMLElement | undefined
    last?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })
}

function handleCancelNewWeapon() {
  if (!profile.value) {
    return
  }

  for (let index = profile.value.weapons.length - 1; index >= 0; index -= 1) {
    const weapon = profile.value.weapons[index]

    if (weapon && isNewWeapon(weapon)) {
      profile.value.weapons.splice(index, 1)
      stopSavePulse()
      return
    }
  }
}

function handleSubmit() {
  // TODO: подключить API сохранения оружия
}

function onHunterBilletKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter') {
    return
  }

  event.preventDefault()
  handleSubmit()
}

function isNewWeapon(weapon: { id: number | null, isNew?: boolean }) {
  return Boolean(weapon.isNew) || weapon.id == null
}

const hasNewWeapon = computed(() =>
  Boolean(profile.value?.weapons.some(weapon => isNewWeapon(weapon))),
)
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
      @submit.prevent
    >
      <div class="weapons-form__body">
        <CommonFormField
          id="hunter-billet"
          label="Номер охот. билета"
          placeholder="Введите номер охотнического билета"
          v-model="profile.hunter_billet_number"
          @keydown="onHunterBilletKeydown"
        />

        <article
          v-for="(weapon, index) in profile.weapons"
          :key="weapon.id ?? `new-${index}`"
          class="profile-weapon"
        >
          <div class="profile-weapon__header">
            <h2 class="profile-weapon__title">Лицензия #{{ index + 1 }}</h2>
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

          <CommonSelectField
            v-model="weapon.weapon_type_id"
            label="Тип оружия"
            :placeholder="weaponTypesLoading ? 'Загрузка...' : 'Добавить оружие'"
            :options="weaponTypes"
            :disabled="weaponTypesLoading || !weaponTypes.length"
            :error="index === 0 ? weaponTypesError : ''"
          />

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

          <div class="profile-weapon__footer">
            <button
              v-if="isNewWeapon(weapon)"
              type="button"
              class="profile-weapon__action"
              :class="{ 'profile-weapon__action--pulse': pulseUnsavedSave }"
              @click="saveWeapon(index)"
            >
              Сохранить
            </button>
            <button
              v-else
              type="button"
              class="profile-weapon__action"
              @click="removeWeapon(index)"
            >
              Удалить
            </button>
          </div>
        </article>
      </div>

      <div class="weapons-form__add-wrap">
        <div class="weapons-form__add-actions">
          <CommonSaveButton type="button" @click="handleAddWeapon">
            Добавить оружие
          </CommonSaveButton>
          <button
            v-if="hasNewWeapon"
            type="button"
            class="weapons-form__cancel"
            @click="handleCancelNewWeapon"
          >
            Отмена
          </button>
        </div>
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
  width: 896px;
  max-width: 100%;
}

.weapons-form__body {
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

.weapons-form__select:disabled {
  opacity: 0.7;
  cursor: default;
}

.weapons-form__field-hint {
  margin: 0;
  font-family: "Inter", "Manrope", system-ui, sans-serif;
  font-size: 0.875rem;
  line-height: 1.35;
  color: #dc2626;
}

.profile-weapon {
  position: relative;
  margin-top: 20px;
  margin-bottom: 0;
  padding: 20px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  background: var(--wh-white);
  box-sizing: border-box;
  overflow: visible;
}

.profile-weapon__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.profile-weapon__title {
  margin: 0;
  font-family: "Inter", sans-serif;
  font-size: 18px;
  font-weight: 700;
  line-height: 120%;
  color: var(--wh-gray-900);
}

.profile-weapon__footer {
  margin-top: 8px;
}

.profile-weapon__action {
  padding: 0;
  border: none;
  background: none;
  color: var(--wh-orange-text);
  font-family: "Inter", sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 120%;
  cursor: pointer;
  transition: color 0.15s ease;
}

.profile-weapon__action:hover {
  color: var(--wh-orange-600);
}

.profile-weapon__action--pulse {
  animation: profile-weapon-save-pulse 1.6s ease-in-out infinite;
}

.profile-weapon__action--pulse:hover {
  animation: none;
}

@keyframes profile-weapon-save-pulse {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.06);
  }
}

@media (prefers-reduced-motion: reduce) {
  .profile-weapon__action--pulse {
    animation: none;
  }
}

.profile-weapon__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.profile-weapon .weapons-form__field:last-of-type {
  margin-bottom: 12px;
}

.weapons-form__add-wrap {
  width: 896px;
  max-width: 100%;
  margin-top: 32px;
  /* padding-top: 24px; */
  /* border-top: 1px solid rgba(0, 0, 0, 0.2); */
  box-sizing: border-box;
}

.weapons-form__add-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.weapons-form__cancel {
  padding: 0;
  border: none;
  background: none;
  color: var(--wh-orange-text);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s ease;
}

.weapons-form__cancel:hover {
  color: var(--wh-orange-600);
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

  .weapons-form__add-wrap :deep(.save-button) {
    width: 346px;
    min-width: 346px;
  }
}
</style>
