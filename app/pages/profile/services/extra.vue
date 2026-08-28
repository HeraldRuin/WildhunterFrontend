<script setup lang="ts">
import type { BookingServiceAdditionalCatalog } from '~/types/api'
import type { SelectFieldOption } from '~/components/common/SelectField.vue'

definePageMeta({
  layout: 'profile',
  middleware: 'baseadmin',
})

useHead({
  title: 'Дополнительные услуги — WH',
})

interface ExtraServiceRow {
  id: number
  name: string
  quantity: string
  calculationType: string
  cost: string
}

const { services: servicesApi } = useApi()
const notifications = useNotifications()
const { open: openConfirmModal } = useConfirmModal()

const breadcrumbs = [
  { label: 'Главная', to: '/' },
  { label: 'Параметры' },
  { label: 'Дополнительные услуги' },
]

const calculationTypeOptions: SelectFieldOption[] = [
  { value: 'individual', label: 'Индивидуально' },
  { value: 'per_person', label: 'На человека' },
]

const services = ref<ExtraServiceRow[]>([])
const isLoading = ref(true)
const loadError = ref('')
const busyServiceId = ref<number | null>(null)

let nextDraftId = -1

function isDraftService(service: ExtraServiceRow) {
  return service.id < 0
}

function isAdditionalCatalog(value: unknown): value is BookingServiceAdditionalCatalog {
  return !!value
    && typeof value === 'object'
    && 'id' in value
    && 'name' in value
    && 'price' in value
}

function unwrapAdditionalItem(data: unknown): BookingServiceAdditionalCatalog | null {
  if (!data || typeof data !== 'object') {
    return null
  }

  if ('additional' in data && isAdditionalCatalog(data.additional)) {
    return data.additional
  }

  if (isAdditionalCatalog(data)) {
    return data
  }

  return null
}

function unwrapAdditionalList(data: unknown): BookingServiceAdditionalCatalog[] {
  if (!data) {
    return []
  }

  if (Array.isArray(data)) {
    return data.filter(isAdditionalCatalog)
  }

  if (typeof data === 'object' && 'additionals' in data) {
    const list = data.additionals
    return Array.isArray(list) ? list.filter(isAdditionalCatalog) : []
  }

  return []
}

function toServiceRow(item: BookingServiceAdditionalCatalog): ExtraServiceRow {
  return {
    id: item.id,
    name: item.name,
    quantity: item.count == null ? '' : String(item.count),
    calculationType: item.calculation_type ?? '',
    cost: formatCost(item.price),
  }
}

function formatCost(price: number | null): string {
  if (price == null) {
    return ''
  }

  return new Intl.NumberFormat('ru-RU')
    .format(Math.round(price))
    .replace(/\s/g, '.')
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

function parseCount(value: string): number | null {
  const raw = value.trim()
  if (!raw) {
    return null
  }

  const count = Number(raw)
  if (!Number.isInteger(count) || count < 0) {
    return null
  }

  return count
}

function parsePrice(value: string): number | null {
  let raw = value
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

  const price = Number(raw)
  if (!Number.isFinite(price) || price < 0) {
    return null
  }

  return price
}

function buildPayload(service: ExtraServiceRow) {
  const name = service.name.trim()
  if (!name) {
    return null
  }

  const count = parseCount(service.quantity)
  if (service.quantity.trim() && count == null) {
    return null
  }

  const price = parsePrice(service.cost)
  if (price == null) {
    return null
  }

  const calculationType = service.calculationType.trim()
  const calculation_type = calculationType
    ? calculationType as 'individual' | 'per_person'
    : null

  return {
    name,
    calculation_type,
    count,
    price,
  }
}

async function loadServices() {
  isLoading.value = true
  loadError.value = ''

  try {
    const response = await servicesApi.getAdditionals()

    if ('success' in response && response.success) {
      services.value = unwrapAdditionalList(response.data).map(toServiceRow)
      return
    }

    loadError.value = extractErrorMessage(response, 'Не удалось загрузить услуги')
  }
  catch (error) {
    const data = (error as { data?: unknown }).data
    loadError.value = extractErrorMessage(data, 'Не удалось загрузить услуги')
  }
  finally {
    isLoading.value = false
  }
}

function addService() {
  if (isLoading.value || busyServiceId.value != null) {
    return
  }

  services.value.push({
    id: nextDraftId--,
    name: '',
    quantity: '',
    calculationType: '',
    cost: formatCost(0),
  })
}

async function saveService(service: ExtraServiceRow) {
  if (isLoading.value || busyServiceId.value != null) {
    return
  }

  const payload = buildPayload(service)
  if (!payload) {
    notifications.error('Заполните имя и корректную стоимость')
    return
  }

  busyServiceId.value = service.id

  try {
    const response = isDraftService(service)
      ? await servicesApi.createAdditional(payload)
      : await servicesApi.updateAdditional(service.id, payload)

    if ('success' in response && response.success) {
      const savedItem = unwrapAdditionalItem(response.data)
      if (!savedItem) {
        notifications.error('Не удалось прочитать ответ сервера')
        return
      }

      const saved = toServiceRow(savedItem)
      services.value = services.value.map(item =>
        item.id === service.id ? saved : item,
      )
      notifications.success(response.message || 'Услуга сохранена')
      return
    }

    notifications.error(extractErrorMessage(response, 'Не удалось сохранить услугу'))
  }
  catch (error) {
    const data = (error as { data?: unknown }).data
    notifications.error(extractErrorMessage(data, 'Не удалось сохранить услугу'))
  }
  finally {
    busyServiceId.value = null
  }
}

function requestRemoveService(service: ExtraServiceRow) {
  if (isLoading.value || busyServiceId.value != null) {
    return
  }

  if (isDraftService(service)) {
    services.value = services.value.filter(item => item.id !== service.id)
    return
  }

  const title = service.name.trim() || 'услугу'
  openConfirmModal({
    title: `Вы уверены, что хотите удалить «${title}»?`,
    confirmLabel: 'Удалить',
    onConfirm: () => removeService(service),
  })
}

async function removeService(service: ExtraServiceRow) {
  if (isLoading.value || busyServiceId.value != null) {
    return
  }

  busyServiceId.value = service.id

  try {
    const response = await servicesApi.deleteAdditional(service.id)

    if ('success' in response && response.success) {
      services.value = services.value.filter(item => item.id !== service.id)
      notifications.success(response.message || 'Услуга удалена')
      return
    }

    notifications.error(extractErrorMessage(response, 'Не удалось удалить услугу'))
    throw new Error('delete_service_failed')
  }
  catch (error) {
    if ((error as Error).message !== 'delete_service_failed') {
      const data = (error as { data?: unknown }).data
      notifications.error(extractErrorMessage(data, 'Не удалось удалить услугу'))
    }

    throw error
  }
  finally {
    busyServiceId.value = null
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

watch(() => services.value.length, () => {
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
  void loadServices()

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

    <div class="extra-services__toolbar">
      <CommonPageTitle>Дополнительные услуги</CommonPageTitle>

      <button
        type="button"
        class="extra-services__add"
        :disabled="isLoading || busyServiceId != null"
        @click="addService"
      >
        Добавить услугу
      </button>
    </div>

    <div class="extra-services__table-area">
      <p v-if="loadError" class="extra-services__status extra-services__status--error">
        {{ loadError }}
      </p>

      <div v-else-if="isLoading" class="extra-services__loading">
        Загрузка...
      </div>

      <div v-else class="extra-services__content">
        <div class="extra-services__shell">
          <div
            class="extra-services__dots"
            :class="{ 'extra-services__dots--hidden': !(services.length && listPageCount > 1) }"
            role="tablist"
            aria-label="Страницы списка услуг"
            :aria-hidden="!(services.length && listPageCount > 1)"
          >
            <button
              v-for="page in listPageCount"
              :key="page"
              type="button"
              class="extra-services__dot"
              :class="{ 'extra-services__dot--active': page - 1 === listPageIndex }"
              :aria-label="`Страница ${page}`"
              :aria-current="page - 1 === listPageIndex ? 'true' : undefined"
              :tabindex="services.length && listPageCount > 1 ? 0 : -1"
              @click="scrollListToPage(page - 1)"
            />
          </div>

          <section class="extra-services__panel">
            <p v-if="!services.length" class="extra-services__empty">
              Нет услуг
            </p>

            <div
              v-else
              ref="scrollEl"
              class="extra-services__scroll"
              @scroll.passive="onListScroll"
            >
              <div class="extra-services__head">
                <span class="extra-services__col extra-services__col--name">Имя</span>
                <span class="extra-services__col extra-services__col--cost">Стоимость, руб</span>
                <span class="extra-services__col extra-services__col--actions">Действия</span>
              </div>

              <ul class="extra-services__list">
                <li
                  v-for="service in services"
                  :key="service.id"
                  class="extra-services__row"
                >
                  <div class="extra-services__col extra-services__col--name">
                    <div class="extra-services__name">
                      <span class="extra-services__field-label extra-services__field-label--mobile">Имя</span>
                      <CommonFormField
                        no-margin
                        placeholder="Введите название услуги"
                        :model-value="service.name"
                        :disabled="busyServiceId === service.id"
                        :aria-label="`Имя услуги #${service.id}`"
                        @update:model-value="service.name = $event"
                      />
                    </div>

                    <div class="extra-services__field extra-services__field--qty">
                      <span class="extra-services__field-label">Количество</span>
                      <CommonFormField
                        no-margin
                        digits-only
                        placeholder="кол-во"
                        :model-value="service.quantity"
                        :disabled="busyServiceId === service.id"
                        @update:model-value="service.quantity = $event"
                      />
                    </div>

                    <div class="extra-services__field extra-services__field--type">
                      <span class="extra-services__field-label">Тип расчета</span>
                      <CommonSelectField
                        v-model="service.calculationType"
                        class="extra-services__select"
                        placeholder="Выберите тип"
                        no-margin
                        :options="calculationTypeOptions"
                        :disabled="busyServiceId === service.id"
                      />
                    </div>
                  </div>

                  <div class="extra-services__col extra-services__col--cost">
                    <span class="extra-services__field-label extra-services__field-label--mobile">Стоимость, руб</span>
                    <CommonFormField
                      no-margin
                      amount-only
                      :model-value="service.cost"
                      :disabled="busyServiceId === service.id"
                      aria-label="Стоимость, руб"
                      @update:model-value="service.cost = $event"
                    />
                  </div>

                  <div class="extra-services__col extra-services__col--actions">
                    <button
                      type="button"
                      class="extra-services__btn extra-services__btn--save"
                      :disabled="busyServiceId != null"
                      @click="saveService(service)"
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      class="extra-services__btn extra-services__btn--delete"
                      :disabled="busyServiceId != null"
                      @click="requestRemoveService(service)"
                    >
                      Удалить
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>

    <CommonConfirmModal />
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
  padding: 20px 40px 48px;
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

.extra-services__toolbar {
  display: flex;
  flex-shrink: 0;
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
  background: var(--wh-orange-500);
  color: var(--wh-white);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
  cursor: pointer;
  transition: background 0.15s ease;
}

.extra-services__add:hover:not(:disabled) {
  background: var(--wh-orange-600);
}

.extra-services__add:active {
  opacity: 0.95;
}

.extra-services__add:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.extra-services__status {
  margin: 0;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.55);
}

.extra-services__status--error {
  color: #c0392b;
}

.extra-services__table-area {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.extra-services__loading {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.55);
}

.extra-services__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  margin-top: 8px;
  overflow: hidden;
}

.extra-services__shell {
  display: flex;
  flex: 1;
  align-items: stretch;
  gap: 12px;
  min-height: 0;
  min-width: 0;
  width: 100%;
}

.extra-services__dots {
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

.extra-services__dots--hidden {
  visibility: hidden;
  pointer-events: none;
}

.extra-services__dot {
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

.extra-services__dot--active {
  border-color: #e8883a;
  background: #e8883a;
}

.extra-services__dot:hover:not(.extra-services__dot--active) {
  border-color: rgb(28 33 28 / 45%);
}

.extra-services__panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  background: var(--wh-white);
  border: 1px solid var(--wh-gray-400);
  border-radius: var(--wh-radius);
  overflow: hidden;
}

.extra-services__scroll {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: auto;
}

.extra-services__head,
.extra-services__row {
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    140px
    220px;
  align-items: end;
  gap: 16px;
  padding: 14px 20px;
}

.extra-services__head {
  position: sticky;
  top: 0;
  z-index: 2;
  align-items: center;
  border-bottom: 1px solid var(--wh-gray-400);
  background: var(--wh-gray-450);
  font-size: 14px;
  font-weight: 700;
  color: var(--wh-gray-900);
  box-shadow: 0 1px 0 var(--wh-gray-400);
}

.extra-services__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.extra-services__row {
  border-bottom: 1px solid var(--wh-gray-400);
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
  display: flex;
  align-items: center;
  min-width: 0;
}

.extra-services__col--actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding-bottom: 1px;
}

.extra-services__head .extra-services__col--actions {
  justify-content: center;
  padding-bottom: 0;
}

.extra-services__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

.extra-services__field--qty {
  width: 96px;
}

.extra-services__field--type {
  width: 210px;
}

.extra-services__field-label {
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
  color: rgba(0, 0, 0, 0.55);
}

.extra-services__name {
  flex: 1 1 0;
  min-width: 280px;
  width: 100%;
}

.extra-services__field-label--mobile {
  display: none;
}

.extra-services__name :deep(.form-field),
.extra-services__field :deep(.form-field),
.extra-services__col--cost :deep(.form-field) {
  width: 100%;
  min-width: 0;
}

.extra-services__name :deep(.form-field__control),
.extra-services__field :deep(.form-field__control),
.extra-services__col--cost :deep(.form-field__control),
.extra-services__name :deep(.form-field__input),
.extra-services__field :deep(.form-field__input),
.extra-services__col--cost :deep(.form-field__input) {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.extra-services__select {
  width: 100%;
}

.extra-services__btn {
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

.extra-services__btn:active:not(:disabled) {
  opacity: 0.9;
}

.extra-services__btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.extra-services__btn--save {
  border-color: var(--wh-green);
  background: var(--wh-green);
  color: var(--wh-white);
}

.extra-services__btn--save:hover:not(:disabled) {
  border-color: var(--wh-green);
  background: var(--wh-green);
}

.extra-services__btn--delete {
  border-color: var(--wh-orange-500);
  background: var(--wh-white);
  color: var(--wh-orange-600);
}

.extra-services__btn--delete:hover:not(:disabled) {
  background: rgba(238, 154, 60, 0.08);
}

.extra-services__empty {
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

  .extra-services__table-area {
    flex: none;
    min-height: 0;
  }

  .extra-services__content {
    flex: none;
    min-height: 0;
  }

  .extra-services__shell {
    width: 100%;
  }

  .extra-services__panel {
    flex: none;
    min-height: calc(100dvh - 220px);
  }

  .extra-services__dots {
    display: none;
  }

  .extra-services__scroll {
    flex: none;
    max-height: none;
    overflow: visible;
  }

  .extra-services__head,
  .extra-services__row {
    grid-template-columns:
      minmax(0, 1fr)
      140px
      220px;
    gap: 12px;
  }

  .extra-services__field--type {
    width: 210px;
  }
}

@media (--wh-mobile) {
  .profile-page {
    height: auto;
    max-height: none;
    overflow: visible;
    padding: 16px 20px 32px;
  }

  .extra-services__content {
    overflow: visible;
  }

  .extra-services__panel {
    min-height: calc(100dvh - 260px);
    overflow: visible;
    max-width: 100%;
  }

  .extra-services__loading {
    flex: none;
    align-items: flex-start;
    min-height: 0;
    padding-top: 160px;
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
    max-width: 100%;
    box-sizing: border-box;
  }

  .extra-services__col--name {
    flex-wrap: wrap;
    align-items: flex-start;
    width: 100%;
    max-width: 100%;
  }

  .extra-services__name {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
    min-width: 0;
    flex: 1 1 100%;
  }

  .extra-services__col--cost {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }

  .extra-services__field-label--mobile {
    display: block;
  }

  .extra-services__field-label {
    font-size: 14px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--wh-black-text, #1c211c);
  }

  .extra-services__field--qty {
    flex: 0 1 96px;
    width: auto;
    min-width: 0;
  }

  .extra-services__field--type {
    flex: 1 1 0;
    width: auto;
    min-width: 0;
  }

  .extra-services__col--cost,
  .extra-services__col--actions {
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  .extra-services__col--actions {
    justify-content: flex-start;
    flex-wrap: wrap;
    padding-bottom: 0;
  }
}
</style>
