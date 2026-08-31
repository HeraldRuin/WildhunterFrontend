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

const scrollEl = ref<HTMLElement | null>(null)
const listPageCount = ref(1)
const listPageIndex = ref(0)
let listResizeObserver: ResizeObserver | null = null

function getListMaxScroll(el: HTMLElement) {
  return Math.max(0, el.scrollHeight - el.clientHeight)
}

function getListPageCount(el: HTMLElement) {
  const pageSize = el.clientHeight || 1
  const maxScroll = getListMaxScroll(el)

  if (maxScroll <= 8) {
    return 1
  }

  return Math.max(1, Math.ceil((maxScroll + pageSize) / pageSize))
}

function getListPageIndex(el: HTMLElement, pageCount: number) {
  if (pageCount <= 1) {
    return 0
  }

  const maxScroll = getListMaxScroll(el)

  if (el.scrollTop >= maxScroll - 2) {
    return pageCount - 1
  }

  return Math.min(
    pageCount - 1,
    Math.round((el.scrollTop / maxScroll) * (pageCount - 1)),
  )
}

function updateListPages() {
  const el = scrollEl.value
  if (!el) {
    listPageCount.value = 1
    listPageIndex.value = 0
    return
  }

  const pages = getListPageCount(el)
  listPageCount.value = pages
  listPageIndex.value = getListPageIndex(el, pages)
}

function scheduleListPagesUpdate() {
  void nextTick(() => {
    updateListPages()
    requestAnimationFrame(() => {
      updateListPages()
      requestAnimationFrame(updateListPages)
    })
  })
}

function onListScroll() {
  const el = scrollEl.value
  if (!el) {
    return
  }

  listPageIndex.value = getListPageIndex(el, listPageCount.value)
}

function scrollListToPage(index: number) {
  const el = scrollEl.value
  if (!el || listPageCount.value <= 1) {
    return
  }

  const maxScroll = getListMaxScroll(el)
  const top = Math.round((index / (listPageCount.value - 1)) * maxScroll)

  el.scrollTo({ top, behavior: 'smooth' })
  listPageIndex.value = index
}

watch(() => animals.value.length, () => {
  scheduleListPagesUpdate()
  void nextTick(() => {
    if (scrollEl.value && listResizeObserver) {
      listResizeObserver.disconnect()
      listResizeObserver.observe(scrollEl.value)
    }
  })
})

watch(isLoading, (loading) => {
  if (!loading) {
    scheduleListPagesUpdate()
  }
})

watch(scrollEl, (el) => {
  if (!el || !listResizeObserver) {
    return
  }

  listResizeObserver.disconnect()
  listResizeObserver.observe(el)
  updateListPages()
})

onMounted(() => {
  void loadManage()

  window.addEventListener('resize', scheduleListPagesUpdate)

  if (import.meta.client && typeof ResizeObserver !== 'undefined') {
    listResizeObserver = new ResizeObserver(() => {
      updateListPages()
    })

    void nextTick(() => {
      if (scrollEl.value) {
        listResizeObserver?.observe(scrollEl.value)
      }
      updateListPages()
    })
  }
  else {
    scheduleListPagesUpdate()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', scheduleListPagesUpdate)
  listResizeObserver?.disconnect()
  listResizeObserver = null
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

    <div v-else class="animals-manage__content">
      <div class="animals-manage__shell">
        <div
          class="animals-manage__dots"
          :class="{ 'animals-manage__dots--hidden': !(animals.length && listPageCount > 1) }"
          role="tablist"
          aria-label="Страницы списка животных"
          :aria-hidden="!(animals.length && listPageCount > 1)"
        >
          <button
            v-for="page in listPageCount"
            :key="page"
            type="button"
            class="animals-manage__dot"
            :class="{ 'animals-manage__dot--active': page - 1 === listPageIndex }"
            :aria-label="`Страница ${page}`"
            :aria-current="page - 1 === listPageIndex ? 'true' : undefined"
            :tabindex="animals.length && listPageCount > 1 ? 0 : -1"
            @click="scrollListToPage(page - 1)"
          />
        </div>

        <section class="animals-manage__panel">
          <p v-if="!animals.length" class="animals-manage__empty">
            Нет животных
          </p>

          <div
            v-else
            ref="scrollEl"
            class="animals-manage__scroll"
            @scroll.passive="onListScroll"
          >
            <div class="animals-manage__table">
              <div class="animals-manage__head">
                <span class="animals-manage__col animals-manage__col--name">Имя</span>
                <div class="animals-manage__col animals-manage__col--controls">
                  <span class="animals-manage__col animals-manage__col--hunters">Минимальное количество охотников</span>
                </div>
              </div>

              <ul class="animals-manage__list">
                <li
                  v-for="animal in animals"
                  :key="animal.id"
                  class="animals-manage__row"
                >
                  <span class="animals-manage__col animals-manage__col--name">{{ animal.title }}</span>

                  <div class="animals-manage__col animals-manage__col--controls">
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
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>

    <CommonConfirmModal />
  </div>
</template>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-height: 0;
  min-width: 0;
  height: 100%;
  max-height: 100%;
  max-width: 100%;
  padding: 20px 40px 16px;
  padding-left: 20px;
  box-sizing: border-box;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  overflow: hidden;
}

.profile-page :deep(.page-title) {
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

.animals-manage__toolbar {
  display: flex;
  flex-wrap: nowrap;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  max-width: 100%;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
}

.animals-manage__toolbar :deep(.page-title) {
  margin: 0;
  flex: 1 1 auto;
  min-width: 0;
  white-space: nowrap;
}

.animals-manage__select {
  flex: 0 1 480px;
  width: 480px;
  min-width: 220px;
  max-width: 480px;
}

@media (max-width: 1280px) and (min-width: 1025px) {
  .animals-manage__toolbar {
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .animals-manage__toolbar :deep(.page-title) {
    min-width: max-content;
  }

  .animals-manage__select {
    flex: 0 1 320px;
    width: 320px;
    min-width: 220px;
    max-width: 100%;
  }
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

.animals-manage__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  margin-top: 8px;
  overflow: hidden;
}

.animals-manage__shell {
  display: flex;
  flex: 1;
  align-items: stretch;
  gap: 12px;
  min-height: 0;
  min-width: 0;
  width: 100%;
}

.animals-manage__dots {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  align-self: center;
  gap: 8px;
  width: 10px;
  padding: 4px 0;
  z-index: 2;
}

.animals-manage__dots--hidden {
  visibility: hidden;
  pointer-events: none;
}

.animals-manage__dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  padding: 0;
  border: 1px solid rgb(28 33 28 / 25%);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.animals-manage__dot--active {
  border-color: #e8883a;
  background: #e8883a;
}

.animals-manage__dot:hover:not(.animals-manage__dot--active) {
  border-color: rgb(28 33 28 / 45%);
}

.animals-manage__panel {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  background: var(--wh-white);
  border: 1px solid var(--wh-gray-200, #ddd);
  border-radius: 4px;
  overflow: hidden;
}

.animals-manage__scroll {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: auto;
}

.animals-manage__table {
  display: grid;
  width: 100%;
  min-width: 0;
  grid-template-columns:
    minmax(0, 1fr)
    max-content;
  column-gap: 12px;
}

.animals-manage__head,
.animals-manage__row {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: 1 / -1;
  align-items: center;
  padding: 14px 20px;
  box-sizing: border-box;
}

.animals-manage__head {
  position: sticky;
  top: 0;
  z-index: 2;
  border-bottom: 1px solid var(--wh-gray-200, #ddd);
  background: var(--wh-gray-450, #C8C8C8);
  font-size: 14px;
  font-weight: 600;
  color: var(--wh-black-text, #1c211c);
  box-shadow: 0 1px 0 var(--wh-gray-200, #ddd);
}

.animals-manage__head .animals-manage__col--name {
  font-size: inherit;
  font-weight: inherit;
  color: inherit;
}

.animals-manage__list {
  display: contents;
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
  min-width: 0;
  font-size: 14px;
  font-weight: 400;
  color: var(--wh-black-text, #1c211c);
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.animals-manage__col--controls {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 10px;
  min-width: 0;
}

.animals-manage__col--hunters {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 10px;
}

.animals-manage__col--actions {
  display: flex;
  flex-shrink: 0;
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
    width: 100%;
    height: auto;
    max-height: none;
    overflow: visible;
    padding: 12px 8px 32px;
  }

  .profile-page__header {
    width: 100%;
  }

  .animals-manage__toolbar {
    flex-wrap: wrap;
    align-items: flex-start;
    width: 100%;
  }

  .animals-manage__toolbar :deep(.page-title) {
    min-width: max-content;
  }

  .animals-manage__select {
    flex: 1 1 320px;
    width: 320px;
    min-width: 220px;
    max-width: 100%;
  }

  .animals-manage__content {
    flex: none;
    width: 100%;
    min-height: 0;
  }

  .animals-manage__shell {
    width: 100%;
  }

  .animals-manage__panel {
    flex: none;
    width: 100%;
    min-height: calc(100dvh - 220px);
  }

  .animals-manage__dots {
    display: none;
  }

  .animals-manage__scroll {
    flex: none;
    width: 100%;
    max-height: none;
    overflow: visible;
  }

  .animals-manage__table {
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

  .animals-manage__toolbar :deep(.page-title) {
    min-width: 0;
    white-space: normal;
  }

  .animals-manage__select {
    flex: 1 1 auto;
    width: 100%;
    max-width: 100%;
  }

  .animals-manage__panel {
    overflow: visible;
  }

  .animals-manage__scroll {
    overflow: visible;
  }

  .animals-manage__table {
    display: block;
    width: 100%;
  }

  .animals-manage__head {
    display: grid;
    grid-template-columns: 1fr;
    grid-column: auto;
    gap: 10px;
    padding: 14px 16px;
  }

  .animals-manage__head .animals-manage__col--hunters {
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .animals-manage__list {
    display: block;
  }

  .animals-manage__row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    grid-column: auto;
    grid-template-columns: none;
    column-gap: 6px;
    row-gap: 10px;
    padding: 14px 16px;
  }

  .animals-manage__col--name {
    display: block;
    flex: 1 1 100%;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    white-space: normal;
    overflow: visible;
    overflow-wrap: anywhere;
    word-break: break-word;
    text-overflow: clip;
  }

  .animals-manage__col--controls {
    flex-wrap: wrap;
    gap: 6px;
  }

  .animals-manage__col--hunters {
    gap: 6px;
  }
}
</style>
