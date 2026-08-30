<script setup lang="ts">
import type { AvailableAnimal, ManagedAnimal } from '~/api/animals'

definePageMeta({
  layout: 'profile',
  middleware: 'baseadmin',
})

useHead({
  title: 'Животные — WH',
})

interface AnimalRow extends ManagedAnimal {
  huntersCountInput: string
}

const { animals: animalsApi } = useApi()
const notifications = useNotifications()
const { open: openConfirmModal } = useConfirmModal()

const breadcrumbs = [
  { label: 'Главная', to: '/' },
  { label: 'Параметр' },
  { label: 'Животные' },
]

const animals = ref<AnimalRow[]>([])
const available = ref<AvailableAnimal[]>([])
const selectedAnimalId = ref('')
const isLoading = ref(true)
const loadError = ref('')
const isAdding = ref(false)
const busyAnimalId = ref<number | null>(null)

const selectOptions = computed(() =>
  available.value.map(item => ({
    value: String(item.id),
    label: item.title,
  })),
)

const isSelectDisabled = computed(() =>
  isLoading.value
  || isAdding.value
  || busyAnimalId.value != null
  || !selectOptions.value.length,
)

function toAnimalRow(item: ManagedAnimal): AnimalRow {
  return {
    id: item.id,
    title: item.title,
    hunters_count: item.hunters_count,
    huntersCountInput: String(item.hunters_count),
  }
}

function extractErrorMessage(source: unknown, fallback: string) {
  if (!source || typeof source !== 'object') {
    return fallback
  }

  const payload = source as {
    success?: boolean
    message?: string
    data?: unknown
  }

  if (payload.message) {
    return payload.message
  }

  if (payload.data && payload.data !== source) {
    return extractErrorMessage(payload.data, fallback)
  }

  return fallback
}

async function loadManage() {
  isLoading.value = true
  loadError.value = ''

  try {
    const response = await animalsApi.getManage()

    if ('success' in response && response.success) {
      animals.value = (response.data.animals ?? []).map(toAnimalRow)
      available.value = response.data.available ?? []
      return
    }

    loadError.value = extractErrorMessage(response, 'Не удалось загрузить животных')
  }
  catch (error) {
    const data = (error as { data?: unknown }).data
    loadError.value = extractErrorMessage(data, 'Не удалось загрузить животных')
  }
  finally {
    isLoading.value = false
  }
}

async function addAnimal(animalId: number) {
  if (isAdding.value || busyAnimalId.value != null || isLoading.value) {
    return
  }

  isAdding.value = true

  try {
    const response = await animalsApi.addManage({ animal_id: animalId })

    if ('success' in response && response.success) {
      animals.value.push(toAnimalRow(response.data))
      available.value = available.value.filter(item => item.id !== animalId)
      notifications.success(response.message || 'Животное добавлено')
      return
    }

    notifications.error(extractErrorMessage(response, 'Не удалось добавить животное'))
  }
  catch (error) {
    const data = (error as { data?: unknown }).data
    notifications.error(extractErrorMessage(data, 'Не удалось добавить животное'))
  }
  finally {
    isAdding.value = false
    selectedAnimalId.value = ''
  }
}

watch(selectedAnimalId, (value) => {
  if (!value) {
    return
  }

  const animalId = Number(value)

  if (!Number.isInteger(animalId) || animalId < 1) {
    selectedAnimalId.value = ''
    return
  }

  void addAnimal(animalId)
})

function onMinHuntersKeydown(event: KeyboardEvent) {
  if (
    event.ctrlKey
    || event.metaKey
    || event.altKey
    || event.key.length !== 1
  ) {
    return
  }

  if (!/^\d$/.test(event.key)) {
    event.preventDefault()
  }
}

function onMinHuntersInput(animal: AnimalRow, event: Event) {
  const input = event.target as HTMLInputElement
  const raw = input.value.replace(/\D/g, '')
  animal.huntersCountInput = raw
  // Иначе буква остаётся в DOM, если отфильтрованное значение не изменилось
  if (input.value !== raw) {
    input.value = raw
  }
}

async function saveAnimal(animal: AnimalRow) {
  if (isLoading.value || isAdding.value || busyAnimalId.value != null) {
    return
  }

  const huntersCount = Number(animal.huntersCountInput)

  if (!Number.isInteger(huntersCount) || huntersCount < 1) {
    notifications.error('Укажите целое число охотников не меньше 1')
    return
  }

  busyAnimalId.value = animal.id

  try {
    const response = await animalsApi.updateManageHuntersCount(animal.id, {
      hunters_count: huntersCount,
    })

    if ('success' in response && response.success) {
      animal.hunters_count = response.data.hunters_count
      animal.huntersCountInput = String(response.data.hunters_count)
      animal.title = response.data.title
      notifications.success(response.message || 'Количество охотников сохранено')
      return
    }

    notifications.error(extractErrorMessage(response, 'Не удалось сохранить количество охотников'))
  }
  catch (error) {
    const data = (error as { data?: unknown }).data
    notifications.error(extractErrorMessage(data, 'Не удалось сохранить количество охотников'))
  }
  finally {
    busyAnimalId.value = null
  }
}

function requestRemoveAnimal(animal: AnimalRow) {
  if (isLoading.value || isAdding.value || busyAnimalId.value != null) {
    return
  }

  openConfirmModal({
    title: `Вы уверены, что хотите удалить «${animal.title}»?`,
    confirmLabel: 'Удалить',
    onConfirm: () => removeAnimal(animal),
  })
}

async function removeAnimal(animal: AnimalRow) {
  if (isLoading.value || isAdding.value || busyAnimalId.value != null) {
    return
  }

  busyAnimalId.value = animal.id

  try {
    const response = await animalsApi.deleteManage(animal.id)

    if ('success' in response && response.success) {
      animals.value = animals.value.filter(item => item.id !== animal.id)
      available.value = [
        ...available.value,
        { id: animal.id, title: animal.title },
      ].sort((a, b) => a.title.localeCompare(b.title, 'ru'))
      notifications.success(response.message || 'Животное удалено')
      return
    }

    notifications.error(extractErrorMessage(response, 'Не удалось удалить животное'))
    throw new Error('delete_animal_failed')
  }
  catch (error) {
    if ((error as Error).message !== 'delete_animal_failed') {
      const data = (error as { data?: unknown }).data
      notifications.error(extractErrorMessage(data, 'Не удалось удалить животное'))
    }

    throw error
  }
  finally {
    busyAnimalId.value = null
  }
}

onMounted(() => {
  void loadManage()
})
</script>

<template>
  <div class="profile-page">
    <header class="profile-page__header">
      <AppBreadcrumbs :items="breadcrumbs" />

      <ProfileNotificationsBell />
    </header>

    <div class="animals-manage__toolbar">
      <CommonPageTitle>Управление животными</CommonPageTitle>

      <CommonSelectField
        v-model="selectedAnimalId"
        class="animals-manage__select"
        placeholder="Выберите животное"
        no-margin
        filled-hover
        :options="selectOptions"
        :disabled="isSelectDisabled"
      />
    </div>

    <p v-if="loadError" class="animals-manage__status animals-manage__status--error">
      {{ loadError }}
    </p>

    <div
      v-else-if="isLoading"
      class="animals-manage__loading"
      aria-live="polite"
    >
      <CommonSpinner variant="ring" size="lg" label="Загрузка животных" />
    </div>

    <section v-else class="animals-manage__panel">
      <div class="animals-manage__head">
        <span class="animals-manage__col animals-manage__col--name">Имя</span>
        <span class="animals-manage__col animals-manage__col--hunters">Минимальное количество охотников</span>
        <span class="animals-manage__col animals-manage__col--actions" aria-hidden="true" />
      </div>

      <ul v-if="animals.length" class="animals-manage__list">
        <li
          v-for="animal in animals"
          :key="animal.id"
          class="animals-manage__row"
        >
          <span class="animals-manage__col animals-manage__col--name">{{ animal.title }}</span>

          <div class="animals-manage__col animals-manage__col--hunters">
            <input
              class="animals-manage__input"
              type="text"
              inputmode="numeric"
              :value="animal.huntersCountInput"
              :disabled="busyAnimalId === animal.id || isAdding"
              :aria-label="`Минимальное количество охотников: ${animal.title}`"
              @keydown="onMinHuntersKeydown"
              @input="onMinHuntersInput(animal, $event)"
            >
            <button
              type="button"
              class="animals-manage__btn animals-manage__btn--save"
              :disabled="busyAnimalId != null || isAdding"
              @click="saveAnimal(animal)"
            >
              Сохранить
            </button>
          </div>

          <div class="animals-manage__col animals-manage__col--actions">
            <button
              type="button"
              class="animals-manage__btn animals-manage__btn--delete"
              :disabled="busyAnimalId != null || isAdding"
              @click="requestRemoveAnimal(animal)"
            >
              Удалить
            </button>
          </div>
        </li>
      </ul>

      <p v-else class="animals-manage__empty">Нет животных</p>
    </section>

    <CommonConfirmModal />
  </div>
</template>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-height: 0;
  height: 100%;
  max-height: 100%;
  padding: 20px 40px 16px;
  max-width: 1100px;
  box-sizing: border-box;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  overflow: hidden;
}

.profile-page__header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 1100px;
  max-width: 100%;
  height: 31px;
  margin-bottom: 20px;
  padding: 0;
  box-sizing: border-box;
  overflow: visible;
}

.animals-manage__toolbar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 1100px;
  max-width: 100%;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
}

.animals-manage__toolbar :deep(.page-title) {
  margin: 0;
  flex: 1;
  min-width: 0;
}

.animals-manage__select {
  flex-shrink: 0;
  width: 320px;
  max-width: 100%;
}

.animals-manage__select :deep(.select-field__list) {
  max-height: 420px;
}

@media (--wh-desktop) {
  .animals-manage__select :deep(.select-field__list) {
    max-height: 720px;
  }
}

.animals-manage__status {
  flex-shrink: 0;
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.4;
  color: rgba(0, 0, 0, 0.55);
}

.animals-manage__status--error {
  color: var(--wh-field-error, #dc2626);
}

.animals-manage__loading {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 220px;
}

.animals-manage__panel {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  min-height: 0;
  background: var(--wh-white);
  border: 1px solid var(--wh-gray-200, #ddd);
  border-radius: 4px;
  overflow: auto;
}

.animals-manage__head,
.animals-manage__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) max-content max-content;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
}

.animals-manage__head {
  border-bottom: 1px solid var(--wh-gray-200, #ddd);
  background: var(--wh-gray-450, #C8C8C8);
  font-size: 14px;
  font-weight: 600;
  color: var(--wh-black-text, #1c211c);
}

.animals-manage__head .animals-manage__col--name {
  font-size: inherit;
  font-weight: inherit;
  color: inherit;
}

.animals-manage__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.animals-manage__row {
  border-bottom: 1px solid var(--wh-gray-200, #ddd);
}

.animals-manage__row:last-child {
  border-bottom: none;
}

.animals-manage__col--name {
  font-size: 14px;
  font-weight: 400;
  color: var(--wh-black-text, #1c211c);
}

.animals-manage__col--hunters {
  display: flex;
  align-items: center;
  gap: 10px;
}

.animals-manage__col--actions {
  display: flex;
  justify-content: flex-end;
}

.animals-manage__input {
  width: 56px;
  height: 34px;
  padding: 4px 8px;
  border: 1px solid var(--wh-gray-200, #ddd);
  border-radius: 4px;
  background: var(--wh-white);
  color: var(--wh-black-text, #1c211c);
  font: inherit;
  font-size: 14px;
  text-align: center;
  box-sizing: border-box;
}

.animals-manage__input:focus {
  outline: none;
  border-color: var(--wh-field-border-active, rgba(0, 0, 0, 0.45));
}

.animals-manage__input:disabled,
.animals-manage__btn:disabled {
  opacity: 0.65;
  cursor: default;
}

.animals-manage__btn {
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
}

.animals-manage__btn:active:not(:disabled) {
  opacity: 0.9;
}

.animals-manage__btn--save {
  border-color: var(--wh-green);
  background: var(--wh-green);
  color: var(--wh-white);
}

.animals-manage__btn--save:hover:not(:disabled) {
  border-color: var(--wh-green);
  background: var(--wh-green);
}

.animals-manage__btn--delete {
  border-color: #dc3545;
  background: #dc3545;
  color: var(--wh-white);
}

.animals-manage__btn--delete:hover:not(:disabled) {
  border-color: #c82333;
  background: #c82333;
}

.animals-manage__empty {
  margin: 0;
  padding: 24px 20px;
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

  .profile-page__header {
    width: 100%;
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
    background: transparent;
    border-radius: 0;
  }

  .animals-manage__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .animals-manage__select {
    width: 100%;
  }

  .animals-manage__head {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 14px 16px;
  }

  .animals-manage__head .animals-manage__col--actions {
    display: none;
  }

  .animals-manage__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    column-gap: 6px;
    row-gap: 10px;
    padding: 14px 16px;
  }

  .animals-manage__col--name {
    flex: 1 1 100%;
    min-width: 0;
    white-space: normal;
    overflow-wrap: break-word;
  }

  .animals-manage__col--hunters {
    gap: 6px;
  }

  .animals-manage__col--actions {
    justify-content: flex-start;
  }
}
</style>
