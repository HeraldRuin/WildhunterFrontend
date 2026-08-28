<script setup lang="ts">
import type { SelectFieldOption } from '~/components/common/SelectField.vue'

definePageMeta({
  layout: 'profile',
  middleware: 'baseadmin',
})

useHead({
  title: 'Дополнительные услуги — WH',
})

interface ExtraService {
  id: number
  name: string
  quantity: string
  calculationType: string
  cost: string
}

const breadcrumbs = [
  { label: 'Главная', to: '/' },
  { label: 'Параметры' },
  { label: 'Дополнительные услуги' },
]

const calculationTypeOptions: SelectFieldOption[] = [
  { value: 'individual', label: 'Индивидуально' },
  { value: 'per_person', label: 'На человека' },
]

let nextId = 2

const services = ref<ExtraService[]>([
  {
    id: 1,
    name: 'Администратор отеля',
    quantity: '',
    calculationType: '',
    cost: '0',
  },
])

function addService() {
  services.value.push({
    id: nextId++,
    name: '',
    quantity: '',
    calculationType: '',
    cost: '0',
  })
}

function saveService() {
  // UI only — API later
}

function removeService(id: number) {
  services.value = services.value.filter(item => item.id !== id)
}
</script>

<template>
  <div class="profile-page">
    <header class="profile-page__header">
      <AppBreadcrumbs :items="breadcrumbs" />

      <ProfileNotificationsBell />
    </header>

    <div class="extra-services__toolbar">
      <CommonPageTitle>Дополнительные услуги</CommonPageTitle>

      <button
        type="button"
        class="extra-services__add"
        @click="addService"
      >
        Добавить услугу
      </button>
    </div>

    <section class="extra-services__panel">
      <div class="extra-services__head">
        <span class="extra-services__col extra-services__col--name">Имя</span>
        <span class="extra-services__col extra-services__col--cost">Стоимость</span>
        <span class="extra-services__col extra-services__col--actions">Действия</span>
      </div>

      <ul v-if="services.length" class="extra-services__list">
        <li
          v-for="service in services"
          :key="service.id"
          class="extra-services__row"
        >
          <div class="extra-services__col extra-services__col--name">
            <input
              v-model="service.name"
              class="extra-services__input extra-services__input--name"
              type="text"
              :aria-label="`Имя услуги #${service.id}`"
            >

            <label class="extra-services__field">
              <span class="extra-services__field-label">Количество</span>
              <input
                v-model="service.quantity"
                class="extra-services__input extra-services__input--qty"
                type="text"
                inputmode="numeric"
                placeholder="кол-во"
              >
            </label>

            <label class="extra-services__field extra-services__field--type">
              <span class="extra-services__field-label">Тип расчета</span>
              <CommonSelectField
                v-model="service.calculationType"
                class="extra-services__select"
                placeholder="Выберите тип"
                no-margin
                :options="calculationTypeOptions"
              />
            </label>
          </div>

          <label class="extra-services__col extra-services__col--cost">
            <span class="visually-hidden">Стоимость</span>
            <input
              v-model="service.cost"
              class="extra-services__input extra-services__input--cost"
              type="text"
              inputmode="decimal"
            >
          </label>

          <div class="extra-services__col extra-services__col--actions">
            <button
              type="button"
              class="extra-services__btn extra-services__btn--save"
              @click="saveService"
            >
              Сохранить
            </button>
            <button
              type="button"
              class="extra-services__btn extra-services__btn--delete"
              @click="removeService(service.id)"
            >
              Удалить
            </button>
          </div>
        </li>
      </ul>

      <p v-else class="extra-services__empty">Нет услуг</p>
    </section>
  </div>
</template>

<style scoped>
.profile-page {
  padding: 20px 40px 48px;
  padding-left: 20px;
  box-sizing: border-box;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
}

.profile-page :deep(.page-title) {
  width: 100%;
}

.profile-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  height: 31px;
  margin-bottom: 20px;
  padding: 0;
  box-sizing: border-box;
  overflow: visible;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.extra-services__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
}

.extra-services__toolbar :deep(.page-title) {
  margin: 0;
  flex: 1;
  min-width: 0;
}

.extra-services__add {
  flex-shrink: 0;
  padding: 10px 18px;
  border: none;
  border-radius: 4px;
  background: #1a2b50;
  color: var(--wh-white);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
  cursor: pointer;
  transition: background 0.15s ease;
}

.extra-services__add:hover {
  background: #243a66;
}

.extra-services__add:active {
  opacity: 0.95;
}

.extra-services__panel {
  background: var(--wh-white);
  border: 1px solid var(--wh-gray-200, #ddd);
  border-radius: 4px;
  overflow: hidden;
}

.extra-services__head,
.extra-services__row {
  display: grid;
  grid-template-columns:
    minmax(360px, 1.8fr)
    minmax(90px, 0.5fr)
    auto;
  align-items: end;
  gap: 16px;
  padding: 14px 20px;
}

.extra-services__head {
  align-items: center;
  border-bottom: 1px solid var(--wh-gray-200, #ddd);
  font-size: 14px;
  font-weight: 600;
  color: var(--wh-black-text, #1c211c);
}

.extra-services__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.extra-services__row {
  border-bottom: 1px solid var(--wh-gray-200, #ddd);
}

.extra-services__row:last-child {
  border-bottom: none;
}

.extra-services__col--name {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  min-width: 0;
}

.extra-services__col--cost {
  display: block;
  min-width: 0;
}

.extra-services__col--actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding-bottom: 1px;
}

.extra-services__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

.extra-services__field--type {
  width: 160px;
}

.extra-services__field-label {
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
  color: rgba(0, 0, 0, 0.55);
}

.extra-services__input {
  height: 36px;
  padding: 6px 10px;
  border: 1px solid var(--wh-gray-200, #ddd);
  border-radius: 4px;
  background: var(--wh-white);
  color: var(--wh-black-text, #1c211c);
  font: inherit;
  font-size: 14px;
  box-sizing: border-box;
}

.extra-services__input--name {
  flex: 1;
  min-width: 140px;
  width: 100%;
}

.extra-services__input--qty {
  width: 72px;
}

.extra-services__input--cost {
  width: 100%;
  max-width: 100px;
}

.extra-services__input:focus {
  outline: none;
  border-color: var(--wh-field-border-active, rgba(0, 0, 0, 0.45));
}

.extra-services__input::placeholder {
  color: rgba(0, 0, 0, 0.35);
}

.extra-services__select {
  width: 100%;
}

.extra-services__select :deep(.select-field__trigger) {
  height: 36px;
  min-height: 36px;
  padding: 6px 10px;
  border-radius: 4px;
  border-color: var(--wh-gray-200, #ddd);
  font-size: 14px;
  line-height: 1.3;
  letter-spacing: 0;
  box-shadow: none;
}

.extra-services__select :deep(.select-field__trigger:focus-visible),
.extra-services__select :deep(.select-field--open .select-field__trigger) {
  border-color: var(--wh-field-border-active, rgba(0, 0, 0, 0.45));
  box-shadow: none;
}

.extra-services__select :deep(.select-field__chevron) {
  width: 10px;
  height: 7px;
  flex-shrink: 0;
}

.extra-services__btn {
  padding: 7px 14px;
  border: none;
  border-radius: 4px;
  color: var(--wh-white);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  cursor: pointer;
  transition: opacity 0.15s ease, background 0.15s ease;
}

.extra-services__btn:active {
  opacity: 0.9;
}

.extra-services__btn--save {
  background: #2ea44f;
}

.extra-services__btn--save:hover {
  background: #279443;
}

.extra-services__btn--delete {
  background: #e5672a;
}

.extra-services__btn--delete:hover {
  background: #d45a22;
}

.extra-services__empty {
  margin: 0;
  padding: 24px 20px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}

@media (--wh-tablet) {
  .profile-page {
    padding: 12px 8px 32px;
  }

  .extra-services__head,
  .extra-services__row {
    grid-template-columns:
      minmax(280px, 1.8fr)
      minmax(80px, 0.5fr)
      auto;
    gap: 12px;
  }

  .extra-services__field--type {
    width: 140px;
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

  .extra-services__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .extra-services__add {
    width: 100%;
  }

  .extra-services__head {
    display: none;
  }

  .extra-services__row {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 14px 16px;
  }

  .extra-services__col--name {
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .extra-services__input--name {
    width: 100%;
    flex: 1 1 100%;
  }

  .extra-services__field--type {
    flex: 1;
    width: auto;
    min-width: 140px;
  }

  .extra-services__input--cost {
    max-width: none;
  }

  .extra-services__col--actions {
    justify-content: flex-start;
    flex-wrap: wrap;
    padding-bottom: 0;
  }
}
</style>
