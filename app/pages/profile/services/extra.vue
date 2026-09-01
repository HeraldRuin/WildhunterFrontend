<script setup lang="ts">
import type { BookingServiceAdditionalCatalog } from '~/types/api'
import type { ManagedAdditionalService, SystemServiceCatalogItem } from '~/api/services'
import type { SelectFieldOption } from '~/components/common/SelectField.vue'
import { formatHotelPrice } from '~/utils/hotel'

definePageMeta({
  layout: 'profile',
  middleware: 'baseadmin',
})

useHead({
  title: 'Услуги — WH',
})

interface ExtraServiceRow {
  id: number
  name: string
  quantity: string
  calculationType: string
  cost: string
  isSystem: boolean
}

const MEALS_SERVICE_NAME = 'питание'

function isMealsService(service: Pick<ExtraServiceRow, 'name'>) {
  return service.name.trim().toLowerCase() === MEALS_SERVICE_NAME
}

function normalizeIsSystem(value: unknown): boolean {
  return value === true || value === 1 || value === '1'
}

const { services: servicesApi } = useApi()
const notifications = useNotifications()
const { open: openConfirmModal } = useConfirmModal()

const breadcrumbs = [
  { label: 'Главная', to: '/' },
  { label: 'Услуги' },
]

const calculationTypeOptions: SelectFieldOption[] = [
  { value: 'individual', label: 'Индивидуально' },
  { value: 'per_person', label: 'На человека' },
]

const services = ref<ExtraServiceRow[]>([])
const isLoading = ref(true)
const loadError = ref('')
const busyServiceId = ref<number | null>(null)
const busyActionLabel = ref('Загрузка')

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

function toServiceRow(item: ManagedAdditionalService | BookingServiceAdditionalCatalog): ExtraServiceRow {
  return {
    id: item.id,
    name: item.name,
    quantity: item.count == null ? '' : String(item.count),
    calculationType: item.calculation_type ?? '',
    cost: formatCost(item.price),
    isSystem: normalizeIsSystem(item.is_system),
  }
}

function formatCost(price: number | null): string {
  if (price == null) {
    return ''
  }

  return formatHotelPrice(price)
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

  const count = isMealsService(service)
    ? null
    : parseCount(service.quantity)
  if (!isMealsService(service) && service.quantity.trim() && count == null) {
    return null
  }

  const price = parsePrice(service.cost)
  if (price == null) {
    return null
  }

  const calculationType = service.calculationType.trim()
  const calculation_type = isMealsService(service)
    ? null
    : calculationType
      ? calculationType as 'individual' | 'per_person'
      : null

  return {
    name,
    calculation_type,
    count,
    price,
    is_system: service.isSystem,
  }
}

async function loadServices() {
  isLoading.value = true
  loadError.value = ''

  try {
    const [additionalsResponse] = await Promise.all([
      servicesApi.getAdditionals(),
      loadSystemServices(),
    ])

    if ('success' in additionalsResponse && additionalsResponse.success) {
      services.value = unwrapAdditionalList(additionalsResponse.data).map(toServiceRow)
      return
    }

    loadError.value = extractErrorMessage(additionalsResponse, 'Не удалось загрузить услуги')
  }
  catch (error) {
    const data = (error as { data?: unknown }).data
    loadError.value = extractErrorMessage(data, 'Не удалось загрузить услуги')
  }
  finally {
    isLoading.value = false
  }
}

async function loadSystemServices() {
  try {
    const response = await servicesApi.getSystemServices()

    if ('success' in response && response.success) {
      systemServices.value = Array.isArray(response.data) ? response.data : []
      return
    }

    systemServices.value = []
  }
  catch {
    systemServices.value = []
  }
}

function addService() {
  if (isLoading.value || busyServiceId.value != null) {
    return
  }

  activeTab.value = 'additional'

  services.value.push({
    id: nextDraftId--,
    name: '',
    quantity: '',
    calculationType: '',
    cost: formatCost(0),
    isSystem: false,
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
  busyActionLabel.value = 'Сохранение услуги'

  try {
    const response = isDraftService(service)
      ? await servicesApi.createAdditional({
          ...payload,
          is_system: false,
        })
      : await servicesApi.updateAdditional(service.id, {
          ...payload,
          is_system: service.isSystem,
        })

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
  busyActionLabel.value = 'Удаление услуги'

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

type ExtraServicesTab = 'installed' | 'additional'

const serviceTabs: { id: ExtraServicesTab, label: string }[] = [
  { id: 'installed', label: 'Установленные услуги' },
  { id: 'additional', label: 'Дополнительные услуги' },
]

const activeTab = ref<ExtraServicesTab>('installed')
const selectedInstalledServiceId = ref('')
const systemServices = ref<SystemServiceCatalogItem[]>([])

function sortInstalledServices(items: ExtraServiceRow[]) {
  return [...items].sort((left, right) => {
    const leftIsPrimary = isMealsService(left)
    const rightIsPrimary = isMealsService(right)

    if (leftIsPrimary && !rightIsPrimary) {
      return -1
    }

    if (!leftIsPrimary && rightIsPrimary) {
      return 1
    }

    return 0
  })
}

const installedServices = computed(() =>
  sortInstalledServices(services.value.filter(service => service.isSystem)),
)

const additionalServices = computed(() =>
  services.value.filter(service => !service.isSystem),
)

const visibleServices = computed(() =>
  activeTab.value === 'installed' ? installedServices.value : additionalServices.value,
)

const installedSystemNames = computed(() =>
  new Set(
    installedServices.value
      .map(service => service.name.trim().toLowerCase())
      .filter(Boolean),
  ),
)

const installSelectOptions = computed<SelectFieldOption[]>(() =>
  systemServices.value
    .filter(item => !installedSystemNames.value.has(item.name.trim().toLowerCase()))
    .map(item => ({
      value: String(item.id),
      label: item.name,
    })),
)

const isInstallSelectDisabled = computed(() =>
  isLoading.value
  || busyServiceId.value != null
  || !installSelectOptions.value.length,
)

const emptyStateText = computed(() =>
  activeTab.value === 'installed'
    ? 'Выберите услугу в списке «Добавить услугу»'
    : 'Нажмите «Добавить услугу», чтобы создать новую',
)

function selectTab(tab: ExtraServicesTab) {
  activeTab.value = tab
  scheduleListPagesUpdate()
}

watch(selectedInstalledServiceId, (value) => {
  if (!value) {
    return
  }

  const serviceId = Number(value)

  if (!Number.isInteger(serviceId) || serviceId < 1) {
    selectedInstalledServiceId.value = ''
    return
  }

  void installService(serviceId)
  selectedInstalledServiceId.value = ''
})

async function installService(systemServiceId: number) {
  if (isLoading.value || busyServiceId.value != null) {
    return
  }

  const systemService = systemServices.value.find(item => item.id === systemServiceId)
  if (!systemService) {
    return
  }

  if (installedSystemNames.value.has(systemService.name.trim().toLowerCase())) {
    return
  }

  busyServiceId.value = systemServiceId
  busyActionLabel.value = 'Добавление услуги'

  try {
    const response = await servicesApi.createAdditional({
      name: systemService.name,
      calculation_type: null,
      count: null,
      price: 0,
      is_system: true,
    })

    if ('success' in response && response.success) {
      const savedItem = unwrapAdditionalItem(response.data)
      if (!savedItem) {
        notifications.error('Не удалось прочитать ответ сервера')
        return
      }

      services.value.push(toServiceRow(savedItem))
      notifications.success(response.message || 'Услуга добавлена')
      return
    }

    notifications.error(extractErrorMessage(response, 'Не удалось добавить услугу'))
  }
  catch (error) {
    const data = (error as { data?: unknown }).data
    notifications.error(extractErrorMessage(data, 'Не удалось добавить услугу'))
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

watch(activeTab, () => {
  if (scrollEl.value) {
    scrollEl.value.scrollTop = 0
  }

  listPageIndex.value = 0
  scheduleListPagesUpdate()
})

watch(() => visibleServices.value.length, () => {
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
      <CommonPageTitle>Услуги</CommonPageTitle>
    </div>

    <div
      v-if="!loadError && !isLoading"
      class="extra-services__nav-row"
    >
      <nav
        class="extra-services__nav"
        aria-label="Разделы услуг"
      >
        <button
          v-for="tab in serviceTabs"
          :key="tab.id"
          type="button"
          class="extra-services__nav-link"
          :class="{ 'extra-services__nav-link--active': activeTab === tab.id }"
          @click="selectTab(tab.id)"
        >
          {{ tab.label }}
        </button>
      </nav>

      <div class="extra-services__nav-action">
        <CommonSelectField
          v-show="activeTab === 'installed'"
          v-model="selectedInstalledServiceId"
          class="extra-services__select-add"
          placeholder="Добавить услугу"
          no-margin
          filled-hover
          :options="installSelectOptions"
          :disabled="isInstallSelectDisabled"
        />

        <button
          v-show="activeTab === 'additional'"
          type="button"
          class="extra-services__add"
          :disabled="busyServiceId != null"
          @click="addService"
        >
          Добавить услугу
        </button>
      </div>
    </div>

    <div class="extra-services__table-area">
      <p v-if="loadError" class="extra-services__status extra-services__status--error">
        {{ loadError }}
      </p>

      <div
        v-else-if="isLoading"
        class="extra-services__loading"
        aria-live="polite"
      >
        <CommonSpinner variant="ring" size="lg" label="Загрузка услуг" />
      </div>

      <div v-else class="extra-services__content">
        <div class="extra-services__shell">
          <div
            class="extra-services__dots"
            :class="{ 'extra-services__dots--hidden': !(visibleServices.length && listPageCount > 1) }"
            role="tablist"
            aria-label="Страницы списка услуг"
            :aria-hidden="!(visibleServices.length && listPageCount > 1)"
          >
            <button
              v-for="page in listPageCount"
              :key="page"
              type="button"
              class="extra-services__dot"
              :class="{ 'extra-services__dot--active': page - 1 === listPageIndex }"
              :aria-label="`Страница ${page}`"
              :aria-current="page - 1 === listPageIndex ? 'true' : undefined"
              :tabindex="visibleServices.length && listPageCount > 1 ? 0 : -1"
              @click="scrollListToPage(page - 1)"
            />
          </div>

          <section class="extra-services__panel">
            <div
              ref="scrollEl"
              class="extra-services__scroll"
              @scroll.passive="onListScroll"
            >
              <div class="extra-services__head">
                <span class="extra-services__col extra-services__col--name">Наименование</span>
                <span class="extra-services__col extra-services__col--cost">Стоимость, руб</span>
                <span class="extra-services__col extra-services__col--actions" aria-hidden="true" />
              </div>

              <div
                class="extra-services__body"
                :class="{ 'extra-services__body--saving': busyServiceId != null }"
              >
                <Transition name="extra-services-saving-fade">
                  <div
                    v-if="busyServiceId != null"
                    class="extra-services__saving-overlay"
                    aria-live="polite"
                    aria-busy="true"
                  >
                    <CommonSpinner
                      variant="ring"
                      size="lg"
                      :label="busyActionLabel"
                    />
                  </div>
                </Transition>

                <p v-if="!visibleServices.length" class="extra-services__empty">
                  {{ emptyStateText }}
                </p>

                <ul v-else class="extra-services__list">
                <li
                  v-for="service in visibleServices"
                  :key="service.id"
                  class="extra-services__row"
                >
                  <div class="extra-services__col extra-services__col--name">
                    <div class="extra-services__name">
                      <span class="extra-services__field-label extra-services__field-label--mobile">Наименование</span>
                      <CommonFormField
                        no-margin
                        placeholder="Введите название услуги"
                        :model-value="service.name"
                        :disabled="busyServiceId === service.id"
                        :aria-label="`Имя услуги #${service.id}`"
                        @update:model-value="service.name = $event"
                      />
                    </div>

                    <div
                      v-if="!isMealsService(service)"
                      class="extra-services__field extra-services__field--qty"
                    >
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

                    <div
                      v-if="!isMealsService(service)"
                      class="extra-services__field extra-services__field--type"
                    >
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

                  <div
                    class="extra-services__col extra-services__col--actions"
                    :class="{ 'extra-services__col--actions--single': isMealsService(service) }"
                  >
                    <button
                      type="button"
                      class="extra-services__btn extra-services__btn--save"
                      :disabled="busyServiceId != null"
                      @click="saveService(service)"
                    >
                      Сохранить
                    </button>
                    <button
                      v-if="!isMealsService(service)"
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
  min-width: 0;
  width: 100%;
  max-width: 100%;
  height: 100%;
  max-height: 100%;
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

.extra-services__nav-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px 24px;
  flex-shrink: 0;
  width: 100%;
  min-width: 0;
  min-height: 48px;
  margin-bottom: 16px;
  box-sizing: border-box;
}

.extra-services__nav {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 28px;
  min-width: 0;
  flex: 1 1 auto;
}

.extra-services__nav-action {
  flex: 0 1 100%;
  width: 100%;
  max-width: 480px;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-left: auto;
}

.extra-services__nav-link {
  position: relative;
  padding: 10px 0 12px;
  border: none;
  background: none;
  color: var(--wh-gray-900);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.15s ease;
}

.extra-services__nav-link::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  border-radius: 2px;
  background: var(--wh-orange-500);
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.28s ease;
}

.extra-services__nav-link--active::after {
  transform: scaleX(1);
}

.extra-services__nav-link:not(.extra-services__nav-link--active)::after {
  transition-duration: 0s;
}

.extra-services__add {
  flex-shrink: 0;
  width: auto;
  min-height: 48px;
  padding: 10px 18px;
  border: none;
  border-radius: 10px;
  background: var(--wh-orange-500);
  color: var(--wh-white);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  cursor: pointer;
  box-sizing: border-box;
  transition: background 0.15s ease;
}

.extra-services__select-add {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  align-self: stretch;
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
  min-width: 0;
  width: 100%;
  max-width: 100%;
}

.extra-services__loading {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 220px;
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
  display: none;
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
  width: 100%;
  max-width: 100%;
  background: var(--wh-white);
  border: 1px solid var(--wh-gray-400);
  border-radius: var(--wh-radius);
  overflow: hidden;
}

.extra-services__body {
  position: relative;
  flex: 1;
  min-height: 120px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.extra-services__body--saving {
  pointer-events: none;
  user-select: none;
}

.extra-services__saving-overlay {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.55);
  pointer-events: none;
}

.extra-services-saving-fade-enter-active {
  transition: opacity 0.2s ease;
}

.extra-services-saving-fade-leave-active {
  transition: opacity 0.2s ease;
}

.extra-services-saving-fade-enter-from,
.extra-services-saving-fade-leave-to {
  opacity: 0;
}

.extra-services__scroll {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
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
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
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
  width: 100%;
}

.extra-services__col--name {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  min-width: 0;
  max-width: 100%;
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

.extra-services__col--actions--single {
  justify-content: stretch;
}

.extra-services__col--actions--single .extra-services__btn {
  flex: 1 1 auto;
  width: 100%;
}

.extra-services__head .extra-services__col--actions {
  justify-content: center;
  padding-bottom: 0;
}

.extra-services__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 1;
  min-width: 0;
  max-width: 100%;
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
  min-width: 0;
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
  border-color: #dc3545;
  background: #dc3545;
  color: var(--wh-white);
}

.extra-services__btn--delete:hover:not(:disabled) {
  border-color: #c82333;
  background: #c82333;
}

.extra-services__empty {
  margin: 0;
  padding: 24px 20px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}

@media (min-width: 1439px) {
  .extra-services__name {
    min-width: 280px;
  }
}

@media (max-width: 1438px) {
  .profile-page {
    overflow-x: hidden;
  }

  .extra-services__head {
    display: none;
  }

  .extra-services__row {
    grid-template-columns: minmax(0, 1fr);
    align-items: stretch;
    gap: 12px;
    padding-inline: 16px;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .extra-services__col--name {
    grid-column: 1;
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
    grid-column: 1;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  .extra-services__field-label--mobile {
    display: block;
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

  .extra-services__col--actions {
    grid-column: 1;
    flex-shrink: 0;
    justify-content: stretch;
    flex-wrap: wrap;
    padding-bottom: 0;
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  .extra-services__col--actions--single {
    justify-content: stretch;
    width: 100%;
  }
}

@media (--wh-tablet) {
  .profile-page {
    width: 100%;
    max-width: 100%;
    height: auto;
    max-height: none;
    overflow-x: hidden;
    overflow-y: visible;
    padding: 12px 8px 32px;
  }

  .extra-services__nav-row {
    flex-direction: column;
    align-items: stretch;
  }

  .extra-services__nav-action {
    flex: none;
    width: 100%;
    max-width: 100%;
    margin-left: 0;
  }

  .extra-services__table-area {
    flex: none;
    width: 100%;
    max-width: 100%;
    min-height: 0;
  }

  .extra-services__content {
    flex: none;
    width: 100%;
    max-width: 100%;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: visible;
  }

  .extra-services__shell {
    flex: none;
    width: 100%;
    max-width: 100%;
    gap: 0;
  }

  .extra-services__panel {
    flex: none;
    width: 100%;
    max-width: 100%;
    min-height: calc(100dvh - 220px);
    overflow: hidden;
  }

  .extra-services__dots {
    display: none;
  }

  .extra-services__scroll {
    flex: none;
    width: 100%;
    max-width: 100%;
    max-height: none;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .extra-services__body {
    flex: none;
    width: 100%;
    max-width: 100%;
    min-height: 0;
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
    width: 100%;
  }

  .extra-services__shell {
    flex: none;
    width: 100%;
  }

  .extra-services__panel {
    width: 100%;
    max-width: 100%;
    min-height: calc(100dvh - 260px);
    overflow: hidden;
  }

  .extra-services__scroll {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .extra-services__body {
    flex: none;
    width: 100%;
    min-height: 0;
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

  .extra-services__nav-row {
    flex-direction: column;
    align-items: stretch;
  }

  .extra-services__nav {
    gap: 20px;
  }

  .extra-services__nav-action {
    flex: none;
    width: 100%;
    max-width: 100%;
    margin-left: 0;
  }

  .extra-services__select-add {
    width: 100%;
    max-width: 100%;
  }

  .extra-services__add {
    width: 100%;
  }

  .extra-services__head {
    display: none;
  }

  .extra-services__row {
    grid-template-columns: minmax(0, 1fr);
    align-items: stretch;
    gap: 12px;
    padding: 14px 16px;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .extra-services__col--name {
    grid-column: 1;
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
    grid-column: 1;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
    width: 100%;
    max-width: 100%;
    min-width: 0;
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

  .extra-services__col--actions {
    grid-column: 1;
    flex-shrink: 0;
    justify-content: stretch;
    flex-wrap: wrap;
    padding-bottom: 0;
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  .extra-services__col--actions--single {
    justify-content: stretch;
    width: 100%;
  }
}
</style>
