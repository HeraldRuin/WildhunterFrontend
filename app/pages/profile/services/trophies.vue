<script setup lang="ts">
definePageMeta({
  layout: 'profile',
  middleware: 'baseadmin',
})

useHead({
  title: 'Трофеи и штрафы — WH',
})

interface PriceRow {
  id: number
  label: string
  cost: string
}

interface TrophyAnimal {
  id: number
  title: string
  trophies: PriceRow[]
  fines: PriceRow[]
  butchering: PriceRow[]
}

const breadcrumbs = [
  { label: 'Главная', to: '/' },
  { label: 'Параметры' },
  { label: 'Трофеи и штрафы' },
]

const animals = ref<TrophyAnimal[]>([
  {
    id: 1,
    title: 'Косуля европейская',
    trophies: [
      { id: 1, label: '1 рог', cost: '123.00' },
      { id: 2, label: '3 рога', cost: '' },
      { id: 3, label: '8 рогов', cost: '' },
      { id: 4, label: '10 рогов', cost: '' },
      { id: 5, label: 'молодая косуля', cost: '' },
      { id: 6, label: 'старая косуля', cost: '' },
    ],
    fines: [
      { id: 1, label: 'Промах', cost: '' },
      { id: 2, label: 'Корова', cost: '' },
    ],
    butchering: [
      { id: 1, label: 'Разделка', cost: '5577.00' },
    ],
  },
  {
    id: 2,
    title: 'Лось',
    trophies: [],
    fines: [],
    butchering: [],
  },
  {
    id: 3,
    title: 'Кабан',
    trophies: [],
    fines: [],
    butchering: [],
  },
  {
    id: 4,
    title: 'Олень благородный',
    trophies: [],
    fines: [],
    butchering: [],
  },
])

const selectedAnimalId = ref(1)

const selectedAnimal = computed(() =>
  animals.value.find(item => item.id === selectedAnimalId.value) ?? null,
)

function selectAnimal(id: number) {
  selectedAnimalId.value = id
}

function savePrice() {
  // UI only — API later
}
</script>

<template>
  <div class="profile-page">
    <header class="profile-page__header">
      <AppBreadcrumbs :items="breadcrumbs" />

      <ProfileNotificationsBell />
    </header>

    <CommonPageTitle divider>Стоимость трофея</CommonPageTitle>

    <section class="trophy-cost">
      <nav class="trophy-cost__animals" aria-label="Животные">
        <button
          v-for="animal in animals"
          :key="animal.id"
          type="button"
          class="trophy-cost__animal"
          :class="{ 'trophy-cost__animal--active': animal.id === selectedAnimalId }"
          @click="selectAnimal(animal.id)"
        >
          {{ animal.title }}
        </button>
      </nav>

      <div class="trophy-cost__content">
        <div class="trophy-cost__table">
          <div class="trophy-cost__head">
            <span class="trophy-cost__col trophy-cost__col--label">Тип трофея</span>
            <span class="trophy-cost__col trophy-cost__col--cost">Стоимость</span>
            <span class="trophy-cost__col trophy-cost__col--actions" aria-hidden="true" />
          </div>

          <ul v-if="selectedAnimal?.trophies.length" class="trophy-cost__list">
            <li
              v-for="row in selectedAnimal.trophies"
              :key="`trophy-${row.id}`"
              class="trophy-cost__row"
            >
              <span class="trophy-cost__col trophy-cost__col--label">{{ row.label }}</span>

              <label class="trophy-cost__col trophy-cost__col--cost">
                <span class="visually-hidden">Стоимость: {{ row.label }}</span>
                <input
                  v-model="row.cost"
                  class="trophy-cost__input"
                  type="text"
                  inputmode="decimal"
                  placeholder="Введите цену"
                >
              </label>

              <div class="trophy-cost__col trophy-cost__col--actions">
                <button
                  type="button"
                  class="trophy-cost__btn"
                  @click="savePrice"
                >
                  Сохранить
                </button>
              </div>
            </li>
          </ul>

          <p v-else class="trophy-cost__empty">Нет типов трофея</p>
        </div>

        <div class="trophy-cost__table">
          <div class="trophy-cost__head">
            <span class="trophy-cost__col trophy-cost__col--label">Тип штрафов</span>
            <span class="trophy-cost__col trophy-cost__col--cost">Стоимость</span>
            <span class="trophy-cost__col trophy-cost__col--actions" aria-hidden="true" />
          </div>

          <ul v-if="selectedAnimal?.fines.length" class="trophy-cost__list">
            <li
              v-for="row in selectedAnimal.fines"
              :key="`fine-${row.id}`"
              class="trophy-cost__row"
            >
              <span class="trophy-cost__col trophy-cost__col--label">{{ row.label }}</span>

              <label class="trophy-cost__col trophy-cost__col--cost">
                <span class="visually-hidden">Стоимость: {{ row.label }}</span>
                <input
                  v-model="row.cost"
                  class="trophy-cost__input"
                  type="text"
                  inputmode="decimal"
                  placeholder="Введите цену"
                >
              </label>

              <div class="trophy-cost__col trophy-cost__col--actions">
                <button
                  type="button"
                  class="trophy-cost__btn"
                  @click="savePrice"
                >
                  Сохранить
                </button>
              </div>
            </li>
          </ul>

          <p v-else class="trophy-cost__empty">Нет типов штрафов</p>
        </div>

        <div class="trophy-cost__table">
          <div class="trophy-cost__head">
            <span class="trophy-cost__col trophy-cost__col--label">Тип разделки</span>
            <span class="trophy-cost__col trophy-cost__col--cost">Стоимость</span>
            <span class="trophy-cost__col trophy-cost__col--actions" aria-hidden="true" />
          </div>

          <ul v-if="selectedAnimal?.butchering.length" class="trophy-cost__list">
            <li
              v-for="row in selectedAnimal.butchering"
              :key="`butchering-${row.id}`"
              class="trophy-cost__row"
            >
              <span class="trophy-cost__col trophy-cost__col--label">{{ row.label }}</span>

              <label class="trophy-cost__col trophy-cost__col--cost">
                <span class="visually-hidden">Стоимость: {{ row.label }}</span>
                <input
                  v-model="row.cost"
                  class="trophy-cost__input"
                  type="text"
                  inputmode="decimal"
                  placeholder="Введите цену"
                >
              </label>

              <div class="trophy-cost__col trophy-cost__col--actions">
                <button
                  type="button"
                  class="trophy-cost__btn"
                  @click="savePrice"
                >
                  Сохранить
                </button>
              </div>
            </li>
          </ul>

          <p v-else class="trophy-cost__empty">Нет типов разделки</p>
        </div>
      </div>
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

.profile-page :deep(.page-title--divider) {
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

.trophy-cost {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 0;
  background: var(--wh-white);
  border: 1px solid var(--wh-gray-200, #ddd);
  border-radius: 4px;
  overflow: hidden;
}

.trophy-cost__animals {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 8px 0;
  border-right: 1px solid var(--wh-gray-200, #ddd);
  background: var(--wh-gray-100, #f5f5f5);
}

.trophy-cost__animal {
  display: block;
  width: 100%;
  padding: 12px 20px;
  border: none;
  background: transparent;
  color: #2f6fed;
  font: inherit;
  font-size: 14px;
  font-weight: 400;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.trophy-cost__animal:hover {
  background: rgba(255, 255, 255, 0.7);
}

.trophy-cost__animal--active {
  background: var(--wh-white);
  color: var(--wh-black-text, #1c211c);
  font-weight: 500;
  cursor: default;
}

.trophy-cost__content {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
}

.trophy-cost__table {
  overflow: hidden;
}

.trophy-cost__table + .trophy-cost__table {
  border-top: 1px solid var(--wh-gray-200, #ddd);
}

.trophy-cost__head,
.trophy-cost__row {
  display: grid;
  grid-template-columns:
    minmax(140px, 0.9fr)
    minmax(160px, 1.4fr)
    auto;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
}

.trophy-cost__head {
  border-bottom: 1px solid var(--wh-gray-200, #ddd);
  background: var(--wh-gray-100, #f5f5f5);
  font-size: 14px;
  font-weight: 600;
  color: var(--wh-black-text, #1c211c);
}

.trophy-cost__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.trophy-cost__row {
  border-bottom: 1px solid var(--wh-gray-200, #ddd);
}

.trophy-cost__row:last-child {
  border-bottom: none;
}

.trophy-cost__col--label {
  font-size: 14px;
  font-weight: 600;
  color: var(--wh-black-text, #1c211c);
}

.trophy-cost__input {
  width: 100%;
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

.trophy-cost__input:focus {
  outline: none;
  border-color: var(--wh-field-border-active, rgba(0, 0, 0, 0.45));
}

.trophy-cost__input::placeholder {
  color: rgba(0, 0, 0, 0.35);
}

.trophy-cost__col--actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.trophy-cost__btn {
  padding: 7px 14px;
  border: none;
  border-radius: 4px;
  background: #2ea44f;
  color: var(--wh-white);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  cursor: pointer;
  transition: opacity 0.15s ease, background 0.15s ease;
}

.trophy-cost__btn:hover {
  background: #279443;
}

.trophy-cost__btn:active {
  opacity: 0.9;
}

.trophy-cost__empty {
  margin: 0;
  padding: 24px 16px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}

@media (--wh-tablet) {
  .profile-page {
    padding: 12px 8px 32px;
  }

  .trophy-cost {
    grid-template-columns: 180px minmax(0, 1fr);
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
  }

  .trophy-cost {
    grid-template-columns: 1fr;
  }

  .trophy-cost__animals {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 4px;
    padding: 12px;
    border-right: none;
    border-bottom: 1px solid var(--wh-gray-200, #ddd);
  }

  .trophy-cost__animal {
    width: auto;
    padding: 8px 12px;
    border-radius: 4px;
  }

  .trophy-cost__animal--active {
    background: var(--wh-white);
  }

  .trophy-cost__head,
  .trophy-cost__row {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 14px 16px;
  }

  .trophy-cost__head {
    display: none;
  }

  .trophy-cost__col--actions {
    justify-content: flex-start;
  }
}
</style>
