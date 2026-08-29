<script setup lang="ts">
import type {
  TrophyCostAnimal,
  TrophyCostEntityKind,
  TrophyCostItem,
} from '~/api/animals'

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
  preparations: PriceRow[]
}

const { animals: animalsApi } = useApi()
const notifications = useNotifications()

const breadcrumbs = [
  { label: 'Главная', to: '/' },
  { label: 'Параметры' },
  { label: 'Трофеи и штрафы' },
]

const animals = ref<TrophyAnimal[]>([])
const selectedAnimalId = ref<number | null>(null)
const isLoading = ref(true)
const loadError = ref('')
const busyKey = ref<string | null>(null)

const selectedAnimal = computed(() =>
  animals.value.find(item => item.id === selectedAnimalId.value) ?? null,
)

const isBusy = computed(() =>
  isLoading.value || busyKey.value != null,
)

const animalSelectOptions = computed(() =>
  animals.value.map(item => ({
    value: String(item.id),
    label: item.title,
  })),
)

const animalSelectValue = computed({
  get: () => (selectedAnimalId.value == null ? '' : String(selectedAnimalId.value)),
  set: (value: string) => {
    const id = Number(value)
    if (!Number.isFinite(id)) {
      return
    }

    selectAnimal(id)
  },
})

function formatCost(price: number | null): string {
  if (price == null) {
    return ''
  }

  return new Intl.NumberFormat('ru-RU')
    .format(Math.round(price))
    .replace(/\s/g, '.')
}

function parseAmount(cost: string): number | null {
  let raw = cost
    .trim()
    .replace(/\s*руб\.?\s*/gi, '')
    .replace(/\s/g, '')

  if (!raw) {
    return null
  }

  if (raw.includes(',') && raw.includes('.')) {
    raw = raw.replace(/\./g, '').replace(',', '.')
  }
  else if (raw.includes(',')) {
    raw = raw.replace(',', '.')
  }
  else if (/^\d{1,3}(\.\d{3})+$/.test(raw)) {
    raw = raw.replace(/\./g, '')
  }

  const value = Number(raw)

  if (!Number.isFinite(value) || value < 0) {
    return null
  }

  return value
}

function toPriceRow(item: TrophyCostItem): PriceRow {
  return {
    id: item.id,
    label: item.type,
    cost: formatCost(item.price),
  }
}

function toAnimalRow(animal: TrophyCostAnimal): TrophyAnimal {
  return {
    id: animal.id,
    title: animal.title,
    trophies: (animal.trophies ?? []).map(toPriceRow),
    fines: (animal.fines ?? []).map(toPriceRow),
    preparations: (animal.preparations ?? []).map(toPriceRow),
  }
}

function extractErrorMessage(source: unknown, fallback: string) {
  if (!source || typeof source !== 'object') {
    return fallback
  }

  const payload = source as {
    success?: boolean
    message?: string
    errors?: Record<string, string[]>
    data?: unknown
  }

  if (payload.errors && typeof payload.errors === 'object') {
    const first = Object.values(payload.errors).flat().find(Boolean)
    if (first) {
      return first
    }
  }

  if (payload.message) {
    return payload.message
  }

  if (payload.data && payload.data !== source) {
    return extractErrorMessage(payload.data, fallback)
  }

  return fallback
}

function rowBusyKey(kind: TrophyCostEntityKind, id: number) {
  return `${kind}:${id}`
}

function isRowBusy(kind: TrophyCostEntityKind, id: number) {
  return busyKey.value === rowBusyKey(kind, id)
}

async function loadTrophyCost() {
  isLoading.value = true
  loadError.value = ''

  try {
    const response = await animalsApi.getTrophyCost()

    if ('success' in response && response.success) {
      animals.value = (response.data ?? []).map(toAnimalRow)

      if (
        selectedAnimalId.value == null
        || !animals.value.some(item => item.id === selectedAnimalId.value)
      ) {
        selectedAnimalId.value = animals.value[0]?.id ?? null
      }

      return
    }

    loadError.value = extractErrorMessage(response, 'Не удалось загрузить стоимость трофея')
  }
  catch (error) {
    const data = (error as { data?: unknown }).data
    loadError.value = extractErrorMessage(data, 'Не удалось загрузить стоимость трофея')
  }
  finally {
    isLoading.value = false
  }
}

function selectAnimal(id: number) {
  if (isBusy.value) {
    return
  }

  selectedAnimalId.value = id
}

async function savePrice(kind: TrophyCostEntityKind, row: PriceRow) {
  if (isBusy.value) {
    return
  }

  const trimmed = row.cost.trim()
  const price = trimmed === '' ? null : parseAmount(row.cost)

  if (trimmed !== '' && price == null) {
    notifications.error('Введите корректную стоимость')
    return
  }

  busyKey.value = rowBusyKey(kind, row.id)

  try {
    let response

    switch (kind) {
      case 'trophies':
        response = await animalsApi.updateTrophyCost({ type: 'trophies', id: row.id, price })
        break
      case 'fines':
        response = await animalsApi.updateFineCost({ type: 'fines', id: row.id, price })
        break
      case 'preparations':
        response = await animalsApi.updatePreparationCost({ type: 'preparations', id: row.id, price })
        break
      default: {
        const _exhaustive: never = kind
        throw new Error(`Unknown trophy cost kind: ${_exhaustive}`)
      }
    }

    if ('success' in response && response.success) {
      row.cost = formatCost(price)
      notifications.success(response.message || 'Сохранено')
      return
    }

    notifications.error(extractErrorMessage(response, 'Не удалось сохранить'))
  }
  catch (error) {
    const data = (error as { data?: unknown }).data
    notifications.error(extractErrorMessage(data, 'Не удалось сохранить'))
  }
  finally {
    busyKey.value = null
  }
}

onMounted(() => {
  void loadTrophyCost()
})
</script>

<template>
  <div class="profile-page">
    <header class="profile-page__header">
      <AppBreadcrumbs :items="breadcrumbs" />

      <ProfileNotificationsBell />
    </header>

    <CommonPageTitle divider>Стоимость трофея</CommonPageTitle>

    <div class="trophy-cost__body">
      <p v-if="loadError" class="trophy-cost__status trophy-cost__status--error">
        {{ loadError }}
      </p>

      <div
        v-else-if="isLoading"
        class="trophy-cost__loading"
        aria-live="polite"
      >
        <CommonSpinner variant="ring" size="lg" label="Загрузка трофеев и штрафов" />
      </div>

      <section v-else class="trophy-cost">
      <nav class="trophy-cost__animals" aria-label="Животные">
        <button
          v-for="animal in animals"
          :key="animal.id"
          type="button"
          class="trophy-cost__animal"
          :class="{ 'trophy-cost__animal--active': animal.id === selectedAnimalId }"
          :disabled="isBusy && animal.id !== selectedAnimalId"
          @click="selectAnimal(animal.id)"
        >
          <span class="trophy-cost__animal-dot" aria-hidden="true" />
          <span class="trophy-cost__animal-label">{{ animal.title }}</span>
        </button>

        <p v-if="!animals.length" class="trophy-cost__animals-empty">
          Нет животных
        </p>
      </nav>

      <div class="trophy-cost__animals-select">
        <CommonSelectField
          v-model="animalSelectValue"
          placeholder="Выберите животное"
          no-margin
          :options="animalSelectOptions"
          :disabled="isBusy || !animalSelectOptions.length"
        />

        <p v-if="!animals.length" class="trophy-cost__animals-empty">
          Нет животных
        </p>
      </div>

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
                <CommonFormField
                  no-margin
                  amount-only
                  placeholder="Введите цену"
                  :model-value="row.cost"
                  :disabled="isBusy"
                  @update:model-value="row.cost = $event"
                />
              </label>

              <div class="trophy-cost__col trophy-cost__col--actions">
                <button
                  type="button"
                  class="trophy-cost__btn"
                  :disabled="isBusy"
                  @click="savePrice('trophies', row)"
                >
                  {{ isRowBusy('trophies', row.id) ? 'Сохранение...' : 'Сохранить' }}
                </button>
              </div>
            </li>
          </ul>

          <p v-else class="trophy-cost__empty">
            Для этого животного не настроены типы трофеев.
          </p>
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
                <CommonFormField
                  no-margin
                  amount-only
                  placeholder="Введите цену"
                  :model-value="row.cost"
                  :disabled="isBusy"
                  @update:model-value="row.cost = $event"
                />
              </label>

              <div class="trophy-cost__col trophy-cost__col--actions">
                <button
                  type="button"
                  class="trophy-cost__btn"
                  :disabled="isBusy"
                  @click="savePrice('fines', row)"
                >
                  {{ isRowBusy('fines', row.id) ? 'Сохранение...' : 'Сохранить' }}
                </button>
              </div>
            </li>
          </ul>

          <p v-else class="trophy-cost__empty">
            Для этого животного не настроены типы штрафов.
          </p>
        </div>

        <div class="trophy-cost__table">
          <div class="trophy-cost__head">
            <span class="trophy-cost__col trophy-cost__col--label">Тип разделки</span>
            <span class="trophy-cost__col trophy-cost__col--cost">Стоимость</span>
            <span class="trophy-cost__col trophy-cost__col--actions" aria-hidden="true" />
          </div>

          <ul v-if="selectedAnimal?.preparations.length" class="trophy-cost__list">
            <li
              v-for="row in selectedAnimal.preparations"
              :key="`preparation-${row.id}`"
              class="trophy-cost__row"
            >
              <span class="trophy-cost__col trophy-cost__col--label">{{ row.label }}</span>

              <label class="trophy-cost__col trophy-cost__col--cost">
                <span class="visually-hidden">Стоимость: {{ row.label }}</span>
                <CommonFormField
                  no-margin
                  amount-only
                  placeholder="Введите цену"
                  :model-value="row.cost"
                  :disabled="isBusy"
                  @update:model-value="row.cost = $event"
                />
              </label>

              <div class="trophy-cost__col trophy-cost__col--actions">
                <button
                  type="button"
                  class="trophy-cost__btn"
                  :disabled="isBusy"
                  @click="savePrice('preparations', row)"
                >
                  {{ isRowBusy('preparations', row.id) ? 'Сохранение...' : 'Сохранить' }}
                </button>
              </div>
            </li>
          </ul>

          <p v-else class="trophy-cost__empty">
            Для этого животного не настроены типы разделки.
          </p>
        </div>
      </div>
    </section>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  max-height: 100%;
  padding: 20px 40px 16px;
  padding-left: 20px;
  box-sizing: border-box;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  overflow: hidden;
}

.profile-page :deep(.page-title--divider) {
  flex-shrink: 0;
  width: 100%;
}

.profile-page__header {
  display: flex;
  flex-shrink: 0;
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

.trophy-cost__status {
  margin: 0 0 16px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.55);
}

.trophy-cost__status--error {
  color: var(--wh-field-error, #dc2626);
}

.trophy-cost__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.trophy-cost__loading {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 220px;
}

.trophy-cost {
  display: flex;
  flex: 1 1 0;
  align-items: stretch;
  gap: 0;
  width: 100%;
  min-width: 0;
  min-height: 0;
  max-width: 100%;
  box-sizing: border-box;
  background: var(--wh-white);
  border: 1px solid var(--wh-gray-200, #ddd);
  border-radius: 4px;
  overflow: hidden;
}

.trophy-cost__animals {
  display: flex;
  flex: 0 0 600px;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  box-sizing: border-box;
  width: 600px;
  max-width: 600px;
  min-width: 0;
  padding: 8px;
  border-right: 1px solid var(--wh-gray-200, #ddd);
  border-radius: 4px 0 0 4px;
  background: var(--wh-white);
}

.trophy-cost__animals-select {
  display: none;
}

.trophy-cost__animal {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid transparent;
  border-radius: 10px;
  appearance: none;
  background-color: transparent;
  color: var(--wh-black-text, #1c211c);
  font: inherit;
  font-size: 0.98rem;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.05em;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.trophy-cost__animal-dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: transparent;
}

.trophy-cost__animal-label {
  min-width: 0;
  overflow-wrap: anywhere;
}

.trophy-cost__animal:hover:not(:disabled):not(.trophy-cost__animal--active),
.trophy-cost__animal:focus-visible:not(:disabled):not(.trophy-cost__animal--active) {
  background-color: transparent;
  border-color: #e8883a;
  color: var(--wh-black-text, #1c211c);
}

.trophy-cost__animal--active {
  background-color: #e8883a;
  border-color: #e8883a;
  color: #ffffff;
  cursor: default;
}

.trophy-cost__animal--active .trophy-cost__animal-dot {
  background-color: #ffffff;
}

.trophy-cost__animal:disabled:not(.trophy-cost__animal--active) {
  cursor: not-allowed;
  opacity: 0.55;
}

.trophy-cost__animals-empty {
  margin: 0;
  padding: 12px 14px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}

.trophy-cost__content {
  display: flex;
  flex: 1 1 0;
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
  background: var(--wh-gray-450, #C8C8C8);
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

.trophy-cost__col--cost {
  min-width: 0;
}

.trophy-cost__col--actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.trophy-cost__btn {
  padding: 7px 16px;
  border: 1.5px solid transparent;
  border-radius: 999px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  cursor: pointer;
  transition: opacity 0.15s ease, background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  border-color: var(--wh-green);
  background: var(--wh-green);
  color: var(--wh-white);
}

.trophy-cost__btn:hover:not(:disabled) {
  border-color: var(--wh-green);
  background: var(--wh-green);
}

.trophy-cost__btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.trophy-cost__btn:active:not(:disabled) {
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
    height: auto;
    max-height: none;
    overflow: visible;
    padding: 12px 8px 32px;
  }

  .trophy-cost__body {
    flex: none;
    min-height: 0;
  }

  .trophy-cost {
    flex: none;
  }

  .trophy-cost__loading {
    flex: none;
    align-items: flex-start;
    min-height: 0;
    padding-top: 160px;
  }

  .trophy-cost {
    flex-direction: column;
  }

  .trophy-cost__animals {
    display: none;
  }

  .trophy-cost__animals-select {
    display: block;
    padding: 12px;
    border-bottom: 1px solid var(--wh-gray-200, #ddd);
  }
}

@media (--wh-mobile) {
  .profile-page {
    height: auto;
    max-height: none;
    overflow: visible;
    padding: 16px 20px 32px;
  }

  .profile-page__header {
    height: auto;
    min-height: 31px;
    padding: 0;
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
