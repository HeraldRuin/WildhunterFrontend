<script setup lang="ts">
import type {
  BookingServiceAdditionalCatalog,
  BookingServiceAdditionalItem,
  BookingServiceExtraHuntItem,
  BookingServiceFoodItem,
  BookingServicePenaltyItem,
  BookingServicePreparationItem,
  BookingServiceSpendingItem,
  BookingServiceTrophyItem,
  BookingServiceType,
  BookingServicesData,
  BookingServicesItems,
} from '~/types/api'
import type { OrganisationAnimal } from '~/api/animals'
import type { SelectFieldOption } from '~/components/common/SelectField.vue'
import { formatRemainingTimer } from '~/utils/bookingHistory'
import { formatApiDate } from '~/utils/date'
import { formatHotelPriceLabel } from '~/utils/hotel'

interface PreparationDraft {
  key: number
  serviceId?: number
  animalId: string
  preparationId: string
  count: number
}

interface FoodDraft {
  key: number
  serviceId?: number
  foodId: string
  hunterId: string
  count: number
}

interface AdditionalDraft {
  key: number
  serviceId?: number
  additionalId: string
  hunterId: string
  count: number
}

interface SpendingDraft {
  key: number
  serviceId?: number
  hunterId: string
  price: string
  comment: string
}

interface TrophyDraft {
  key: number
  serviceId?: number
  animalId: string
  trophyId: string
  hunterIds: string[]
  count: number
}

interface PenaltyDraft {
  key: number
  serviceId?: number
  animalId: string
  penaltyId: string
  hunterId: string
}

interface ExtraHuntDraft {
  key: number
  animalId: string
  hunterIds: string[]
}

type DeletableServiceList = 'trophies' | 'penalties' | 'preparations' | 'foods' | 'additionals' | 'spendings' | 'extra_hunts'
type ServiceBlockId = 'extraHunt' | 'trophy' | 'penalty' | 'preparation' | 'food' | 'addetional' | 'spending'

const ADD_SERVICES_NOTIFICATION_GROUP = 'add-services'

const EMPTY_ITEMS: BookingServicesItems = {
  trophies: [],
  penalties: [],
  preparations: [],
  foods: [],
  additionals: [],
  spendings: [],
  extra_hunts: [],
}

const { isOpen, booking, close } = useAddServicesModal()
const { open: openConfirmModal } = useConfirmModal()
const { animals: animalsApi, bookings, services: servicesApi } = useApi()
const hotelAdditionals = ref<BookingServiceAdditionalCatalog[]>([])
const notifications = useNotifications()
const { isBaseAdmin } = useUserRole()
const notifyOptions = { group: ADD_SERVICES_NOTIFICATION_GROUP }

provide('select-field-overlay', true)

const isLoading = ref(false)
const loadError = ref('')
const services = ref<BookingServicesData | null>(null)
const preparationDrafts = ref<PreparationDraft[]>([])
const foodDrafts = ref<FoodDraft[]>([])
const additionalDrafts = ref<AdditionalDraft[]>([])
const spendingDrafts = ref<SpendingDraft[]>([])
const trophyDrafts = ref<TrophyDraft[]>([])
const penaltyDrafts = ref<PenaltyDraft[]>([])
const extraHuntDrafts = ref<ExtraHuntDraft[]>([])
const organisationAnimals = ref<OrganisationAnimal[]>([])
const savingPreparationKey = ref<number | null>(null)
const savingFoodKey = ref<number | null>(null)
const savedFoodCounts = ref<Record<number, number>>({})
const savingAdditionalKey = ref<number | null>(null)
const dismissedAdditionalStock = ref<Record<number, string>>({})
const savingSpendingKey = ref<number | null>(null)
const savingTrophyKey = ref<number | null>(null)
const savingPenaltyKey = ref<number | null>(null)
const savingExtraHuntKey = ref<number | null>(null)
const deletingServiceId = ref<number | null>(null)
const collapsedBlocks = ref(new Set<ServiceBlockId>())
const servicesBodyRef = ref<HTMLElement | null>(null)

let loadRequestId = 0
let refreshRequestId = 0
let preparationDraftKey = 0
let foodDraftKey = 0
let additionalDraftKey = 0
let spendingDraftKey = 0
let trophyDraftKey = 0
let penaltyDraftKey = 0
let extraHuntDraftKey = 0

useBodyScrollLock(isOpen)

const allowedTypeSet = computed(() => new Set(services.value?.allowed_types ?? []))
const servicesClosed = computed(() => booking.value?.status.code === 'completed')
const servicesEditableUntil = ref<string | null>(null)
const serverCanChange = ref<boolean | null>(null)
const servicesNow = ref(Date.now())
let servicesLockTimer: ReturnType<typeof setInterval> | undefined

const servicesLockedByTimer = computed(() => {
  if (isBaseAdmin.value || !booking.value?.isMasterHunter) {
    return false
  }

  if (serverCanChange.value === false) {
    return true
  }

  const raw = booking.value?.servicesEditableUntil || servicesEditableUntil.value
  if (!raw) {
    return false
  }

  const until = Date.parse(raw)
  if (Number.isNaN(until)) {
    return false
  }

  return servicesNow.value >= until
})

const servicesManageTimerLabel = computed(() => {
  if (isBaseAdmin.value || !booking.value?.isMasterHunter || servicesLockedByTimer.value) {
    return ''
  }

  const raw = booking.value?.servicesEditableUntil || servicesEditableUntil.value
  if (!raw) {
    return ''
  }

  const until = Date.parse(raw)
  if (Number.isNaN(until) || servicesNow.value >= until) {
    return ''
  }

  return formatRemainingTimer(raw, servicesNow.value) || ''
})

watch(isOpen, (open) => {
  if (servicesLockTimer) {
    clearInterval(servicesLockTimer)
    servicesLockTimer = undefined
  }

  if (!open) {
    return
  }

  servicesNow.value = Date.now()
  servicesLockTimer = setInterval(() => {
    servicesNow.value = Date.now()
  }, 1000)
}, { immediate: true })

onBeforeUnmount(() => {
  if (servicesLockTimer) {
    clearInterval(servicesLockTimer)
  }
})
const items = computed(() => ({
  ...EMPTY_ITEMS,
  ...services.value?.items,
}))
const preparationAnimals = computed(() => services.value?.catalogs?.preparation_animals ?? [])
const preparationAnimalsForSelect = computed(() => {
  if (isBaseAdmin.value || !booking.value?.isMasterHunter) {
    return preparationAnimals.value
  }

  const bookedAnimalId = booking.value.hunt?.animalId
  if (bookedAnimalId != null) {
    return preparationAnimals.value.filter(animal => animal.id === bookedAnimalId)
  }

  const bookedTitle = booking.value.hunt?.animal?.trim()
  if (!bookedTitle || bookedTitle === '—') {
    return []
  }

  return preparationAnimals.value.filter(animal => animal.title.trim() === bookedTitle)
})
const preparationAnimalOptions = computed<SelectFieldOption[]>(() =>
  preparationAnimalsForSelect.value.map(animal => ({
    value: String(animal.id),
    label: animal.title,
  })),
)
const additionalOptions = computed<SelectFieldOption[]>(() =>
  (services.value?.catalogs?.additionals ?? []).map(item => withCatalogPrice(
    item.name,
    item.price,
    String(item.id),
  )),
)
const hunterOptions = computed<SelectFieldOption[]>(() =>
  (services.value?.catalogs?.hunters ?? []).map(hunter => ({
    value: String(hunter.id),
    label: hunter.name,
  })),
)
const trophyAnimals = computed(() => services.value?.catalogs?.trophy_animals ?? [])
const trophyAnimalOptions = computed<SelectFieldOption[]>(() =>
  trophyAnimals.value.map(animal => ({
    value: String(animal.id),
    label: animal.title,
  })),
)
const penaltyAnimals = computed(() => services.value?.catalogs?.penalty_animals ?? [])
const penaltyAnimalOptions = computed<SelectFieldOption[]>(() =>
  penaltyAnimals.value.map(animal => ({
    value: String(animal.id),
    label: animal.title,
  })),
)
const extraHuntAnimalOptions = computed<SelectFieldOption[]>(() => {
  const byId = new Map<string, string>()

  for (const animal of [
    ...trophyAnimals.value,
    ...penaltyAnimals.value,
    ...preparationAnimals.value,
  ]) {
    byId.set(String(animal.id), animal.title)
  }

  return [...byId.entries()].map(([value, label]) => ({ value, label }))
})
const extraHuntRowEntries = computed(() => {
  const entries: Array<{ key: string, item?: BookingServiceExtraHuntItem, draft?: ExtraHuntDraft }> = []

  for (const item of items.value.extra_hunts ?? []) {
    entries.push({ key: `extra-hunt-${item.id}`, item })
  }

  for (const draft of extraHuntDrafts.value) {
    entries.push({ key: `extra-hunt-draft-${draft.key}`, draft })
  }

  return entries
})

function toIsoDay(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) {
    return null
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10)
  }

  const dotted = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$/)
  if (!dotted) {
    return null
  }

  const day = Number(dotted[1])
  const month = Number(dotted[2])
  const yearRaw = Number(dotted[3])
  const year = dotted[3].length === 2 ? 2000 + yearRaw : yearRaw
  const date = new Date(year, month - 1, day)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return formatApiDate(date)
}

function extraHuntPriceLabel(animalId: string): string {
  const huntDay = toIsoDay(booking.value?.hunt?.date)
  if (!animalId || !huntDay) {
    return ''
  }

  const animal = organisationAnimals.value.find(item => String(item.id) === animalId)
  const period = animal?.periods.find((entry) => {
    const start = toIsoDay(entry.start_date)
    const end = toIsoDay(entry.end_date)
    if (!start || !end || entry.price == null) {
      return false
    }

    return huntDay >= start && huntDay <= end
  })

  if (period?.price == null || !Number.isFinite(period.price)) {
    return ''
  }

  return formatHotelPriceLabel(period.price)
}

watch(
  () => booking.value?.code,
  (code) => {
    if (!code) {
      resetServices()
      return
    }

    void loadServices(code)
  },
)

useBookingServicesChannel(
  computed(() => (isOpen.value ? booking.value?.id ?? null : null)),
  (payload) => {
    const current = booking.value
    const code = current?.code
    if (!code || !bookingMatchesServicesUpdate(current, payload)) {
      return
    }

    void refreshServices(code)
  },
  computed(() => (isOpen.value ? booking.value?.code ?? null : null)),
)

function isAllowed(type: BookingServiceType): boolean {
  return allowedTypeSet.value.has(type)
}

function canAddServiceType(_type: BookingServiceType): boolean {
  return !servicesClosed.value && !servicesLockedByTimer.value
}

const blockPageCount = ref<Record<ServiceBlockId, number>>({
  extraHunt: 1,
  trophy: 1,
  penalty: 1,
  preparation: 1,
  food: 1,
  addetional: 1,
  spending: 1,
})
const blockPageIndex = ref<Record<ServiceBlockId, number>>({
  extraHunt: 0,
  trophy: 0,
  penalty: 0,
  preparation: 0,
  food: 0,
  addetional: 0,
  spending: 0,
})
const blockListEls = new Map<ServiceBlockId, HTMLElement>()
let blockListObserver: ResizeObserver | null = null

function listMaxScroll(el: HTMLElement) {
  return Math.max(0, el.scrollHeight - el.clientHeight)
}

function listPageCount(el: HTMLElement) {
  const pageSize = el.clientHeight || 1
  const maxScroll = listMaxScroll(el)

  if (maxScroll <= 8) {
    return 1
  }

  return Math.max(1, Math.ceil((maxScroll + pageSize) / pageSize))
}

function listPageIndex(el: HTMLElement, pageCount: number) {
  if (pageCount <= 1) {
    return 0
  }

  const maxScroll = listMaxScroll(el)
  if (el.scrollTop >= maxScroll - 2) {
    return pageCount - 1
  }

  return Math.min(
    pageCount - 1,
    Math.round((el.scrollTop / maxScroll) * (pageCount - 1)),
  )
}

function updateBlockPages(id: ServiceBlockId) {
  const el = blockListEls.get(id)
  let pages = 1
  let index = 0

  if (el && el.clientHeight > 0) {
    pages = listPageCount(el)
    index = listPageIndex(el, pages)
  }

  if (blockPageCount.value[id] !== pages) {
    blockPageCount.value = { ...blockPageCount.value, [id]: pages }
  }

  if (blockPageIndex.value[id] !== index) {
    blockPageIndex.value = { ...blockPageIndex.value, [id]: index }
  }
}

function scheduleBlockPages(id?: ServiceBlockId) {
  const update = () => {
    const ids: ServiceBlockId[] = id
      ? [id]
      : ['extraHunt', 'trophy', 'penalty', 'preparation', 'food', 'addetional', 'spending']

    for (const blockId of ids) {
      updateBlockPages(blockId)
    }
  }

  void nextTick(() => {
    update()
    requestAnimationFrame(() => {
      update()
      requestAnimationFrame(update)
    })
  })
}

function setBlockListRef(id: ServiceBlockId, el: Element | null) {
  const current = blockListEls.get(id) ?? null
  const next = el instanceof HTMLElement ? el : null

  if (current === next) {
    return
  }

  if (current) {
    blockListObserver?.unobserve(current)
  }

  if (next) {
    blockListEls.set(id, next)
    blockListObserver?.observe(next)
  }
  else {
    blockListEls.delete(id)
  }

  scheduleBlockPages(id)
}

function onBlockListScroll(id: ServiceBlockId) {
  const el = blockListEls.get(id)
  if (!el) {
    return
  }

  const pages = blockPageCount.value[id]
  const index = listPageIndex(el, pages)
  if (blockPageIndex.value[id] !== index) {
    blockPageIndex.value = { ...blockPageIndex.value, [id]: index }
  }
}

function scrollBlockToPage(id: ServiceBlockId, index: number) {
  const el = blockListEls.get(id)
  if (!el) {
    return
  }

  const pageCount = blockPageCount.value[id]
  if (pageCount <= 1) {
    return
  }

  const maxScroll = listMaxScroll(el)
  const top = Math.round((index / (pageCount - 1)) * maxScroll)
  el.scrollTo({ top, behavior: 'smooth' })
  blockPageIndex.value = { ...blockPageIndex.value, [id]: index }
}

const blockListRef = {
  extraHunt: (el: Element | null) => setBlockListRef('extraHunt', el),
  trophy: (el: Element | null) => setBlockListRef('trophy', el),
  penalty: (el: Element | null) => setBlockListRef('penalty', el),
  preparation: (el: Element | null) => setBlockListRef('preparation', el),
  food: (el: Element | null) => setBlockListRef('food', el),
  addetional: (el: Element | null) => setBlockListRef('addetional', el),
  spending: (el: Element | null) => setBlockListRef('spending', el),
} satisfies Record<ServiceBlockId, (el: Element | null) => void>

function hasOpenDraft(id: ServiceBlockId): boolean {
  switch (id) {
    case 'extraHunt':
      return extraHuntDrafts.value.length > 0
    case 'trophy':
      return trophyDrafts.value.length > 0
    case 'penalty':
      return penaltyDrafts.value.length > 0
    case 'preparation':
      return preparationDrafts.value.length > 0
    case 'food':
      return foodDrafts.value.length > 0
    case 'addetional':
      return additionalDrafts.value.length > 0
    case 'spending':
      return spendingDrafts.value.length > 0
    default: {
      const exhaustive: never = id
      return exhaustive
    }
  }
}

function canDeleteService(_list: DeletableServiceList, _serviceId: number): boolean {
  return !servicesClosed.value && !servicesLockedByTimer.value
}

function isBlockCollapsed(id: ServiceBlockId): boolean {
  return collapsedBlocks.value.has(id)
}

function toggleBlock(id: ServiceBlockId) {
  const next = new Set(collapsedBlocks.value)

  if (next.has(id)) {
    next.delete(id)
  }
  else {
    next.add(id)
  }

  collapsedBlocks.value = next
}

function expandBlock(id: ServiceBlockId) {
  if (!collapsedBlocks.value.has(id)) {
    return
  }

  const next = new Set(collapsedBlocks.value)
  next.delete(id)
  collapsedBlocks.value = next
}

function applyServicesAccess(data: { can_change?: boolean, services_editable_until?: string | null }) {
  if (typeof data.can_change === 'boolean') {
    serverCanChange.value = data.can_change
  }

  if (data.services_editable_until) {
    servicesEditableUntil.value = data.services_editable_until
  }
}

function resetServices() {
  loadRequestId += 1
  isLoading.value = false
  loadError.value = ''
  serverCanChange.value = null
  servicesEditableUntil.value = booking.value?.servicesEditableUntil ?? null
  services.value = null
  preparationDrafts.value = []
  foodDrafts.value = []
  additionalDrafts.value = []
  dismissedAdditionalStock.value = {}
  spendingDrafts.value = []
  trophyDrafts.value = []
  penaltyDrafts.value = []
  extraHuntDrafts.value = []
  organisationAnimals.value = []
  savingPreparationKey.value = null
  savingFoodKey.value = null
  savedFoodCounts.value = {}
  savingAdditionalKey.value = null
  savingSpendingKey.value = null
  savingTrophyKey.value = null
  savingPenaltyKey.value = null
  savingExtraHuntKey.value = null
  deletingServiceId.value = null
  collapsedBlocks.value = new Set()
}

function catalogUnitPrice(price: unknown): number | null {
  if (price == null || price === '') {
    return null
  }

  const value = typeof price === 'number' ? price : Number(price)
  if (!Number.isFinite(value)) {
    return null
  }

  return value
}

function catalogPriceLabel(price: unknown): string | undefined {
  const value = catalogUnitPrice(price)
  if (value == null) {
    return undefined
  }

  return formatHotelPriceLabel(value)
}

function draftLinePrice(unitPrice: unknown, count = 1): string {
  const unit = catalogUnitPrice(unitPrice)
  const quantity = Number(count)
  if (unit == null || !Number.isInteger(quantity) || quantity < 1) {
    return ''
  }

  return formatHotelPriceLabel(unit * quantity)
}

function trophyDraftPrice(row: TrophyDraft): string {
  const animal = trophyAnimals.value.find(item => String(item.id) === row.animalId)
  const trophy = animal?.trophies?.find(item => String(item.id) === row.trophyId)
  return draftLinePrice(trophy?.price, row.count)
}

function penaltyDraftPrice(row: PenaltyDraft): string {
  const animal = penaltyAnimals.value.find(item => String(item.id) === row.animalId)
  const fine = animal?.fines?.find(item => String(item.id) === row.penaltyId)
  return draftLinePrice(fine?.price)
}

function preparationOptions(animalId: number | string | null | undefined) {
  if (animalId == null || animalId === '') {
    return []
  }

  const animal = preparationAnimals.value.find(item => String(item.id) === String(animalId))
  return animal?.preparations ?? []
}

function preparationTypeOptions(animalId: string): SelectFieldOption[] {
  return preparationOptions(animalId).map(item => withCatalogPrice(
    item.type,
    item.price,
    String(item.id),
  ))
}

function preparationTypeById(animalId: string, preparationId: string): string {
  return preparationTypeOptions(animalId).find(option => option.value === preparationId)?.label ?? ''
}

function preparationUnitPrice(
  animalId: number | string | null | undefined,
  type?: string | null,
): string {
  const options = preparationOptions(animalId)
  const match = type
    ? options.find(item => item.type === type)
    : options[0]

  return catalogPriceLabel(match?.price) ?? ''
}

function selectedPreparation(row: PreparationDraft) {
  return preparationOptions(row.animalId)
    .find(item => String(item.id) === row.preparationId)
}

function preparationDraftUnitPrice(row: PreparationDraft): string {
  return catalogPriceLabel(selectedPreparation(row)?.price) ?? ''
}

function preparationDraftPrice(row: PreparationDraft): string {
  return draftLinePrice(selectedPreparation(row)?.price, row.count)
}

const foodCatalog = computed(() => services.value?.catalogs?.food ?? [])

const foodOptions = computed<SelectFieldOption[]>(() => {
  return foodCatalog.value
    .filter((item) => {
      const price = Number(item.price)
      const visible = item.is_visible !== false && item.is_visible !== 0 && item.is_visible !== '0'
      return visible && Number.isFinite(price) && price > 0
    })
    .map(item => withCatalogPrice(item.name, item.price, String(item.id)))
})

function normalizeCalculationType(value: unknown): 'individual' | 'per_person' | null {
  if (typeof value !== 'string') {
    return null
  }

  const raw = value.trim().toLowerCase()
  if (raw === 'individual' || raw === 'индивидуально') {
    return 'individual'
  }

  if (raw === 'per_person' || raw === 'person' || raw === 'на всех') {
    return 'per_person'
  }

  return null
}

function foodCalculationType(foodId: string): 'individual' | 'per_person' | null {
  const food = foodCatalog.value.find(item => String(item.id) === foodId)
  if (!food) {
    return null
  }

  const name = food.name.trim().toLowerCase()
  const sources = [
    food,
    ...hotelAdditionals.value,
    ...(services.value?.catalogs?.additionals ?? []),
  ]

  for (const item of sources) {
    const sameItem = 'id' in item && String(item.id) === foodId
    const sameName = item.name.trim().toLowerCase() === name
    if (!sameItem && !sameName) {
      continue
    }

    const type = normalizeCalculationType(item.calculation_type)
    if (type) {
      return type
    }
  }

  return null
}

function isIndividualFood(foodId: string): boolean {
  return foodCalculationType(foodId) === 'individual'
}

function isPerPersonFood(foodId: string): boolean {
  return foodCalculationType(foodId) === 'per_person'
}

function onFoodChange(row: FoodDraft, foodId: string | string[]) {
  row.foodId = Array.isArray(foodId) ? foodId[0] ?? '' : foodId
  row.hunterId = ''
}

function foodCatalogItem(foodId: string) {
  return foodCatalog.value.find(item => String(item.id) === foodId)
}

function foodDraftUnitPrice(row: FoodDraft): string {
  const catalog = foodCatalogItem(row.foodId)
  if (!catalog) {
    return ''
  }

  if (isPerPersonFood(row.foodId)) {
    return catalogPriceLabel(catalog.unit_price) ?? ''
  }

  return catalogPriceLabel(catalog.price) ?? ''
}

function foodDraftCount(row: FoodDraft): number | null {
  const count = Number(row.count)
  if (!Number.isInteger(count) || count < 1) {
    return null
  }

  return count
}

function foodDraftTotal(row: FoodDraft): string {
  const catalog = foodCatalogItem(row.foodId)
  const price = Number(catalog?.price)
  const count = foodDraftCount(row)
  if (!catalog || !Number.isFinite(price) || count == null) {
    return ''
  }

  return formatHotelPriceLabel(Math.round(price * count))
}

function hunterNameById(hunterId: number): string {
  return hunterOptions.value.find(option => option.value === String(hunterId))?.label ?? ''
}

function hunterNamesLabel(hunterIds: number[] | null | undefined, hunterName?: string | null): string {
  const names = (hunterIds ?? []).map(id => hunterNameById(id)).filter(Boolean)
  if (names.length) {
    return names.join(', ')
  }

  return hunterName?.trim() ?? ''
}

function hunterIdsFromItem(hunterIds?: number[] | null, hunterName?: string | null): string[] {
  const ids = (hunterIds ?? []).filter(id => id > 0).map(String)
  if (ids.length) {
    return ids
  }

  return (hunterName ?? '')
    .split(',')
    .map(name => name.trim().toLowerCase())
    .filter(Boolean)
    .flatMap((name) => {
      const match = hunterOptions.value.find(option => option.label.trim().toLowerCase() === name)
      return match ? [match.value] : []
    })
}

function hunterIdFromItem(hunterId?: number | null, hunterName?: string | null): string {
  if (hunterId != null && hunterId > 0) {
    return String(hunterId)
  }

  const name = hunterName?.trim().toLowerCase()
  if (!name) {
    return ''
  }

  return hunterOptions.value.find(option => option.label.trim().toLowerCase() === name)?.value ?? ''
}

function savedServiceMessage(serviceId: number | undefined, responseMessage?: string): string {
  return serviceId != null ? 'Изменения сохранены' : (responseMessage || 'Услуга добавлена')
}

function savedServiceError(serviceId: number | undefined, fallback: string): string {
  return serviceId != null ? 'Не удалось сохранить изменения' : fallback
}

function mealTakenHunterIds(mealName: string, exceptDraftKey?: number): Set<string> | 'all' {
  const normalized = mealName.trim().toLowerCase()
  const taken = new Set<string>()

  const takeHunter = (hunterId: number | null | undefined, hunterName?: string | null) => {
    if (hunterId != null && hunterId > 0) {
      taken.add(String(hunterId))
      return
    }

    const name = hunterName?.trim().toLowerCase()
    if (!name) {
      return
    }

    const match = hunterOptions.value.find(option => option.label.trim().toLowerCase() === name)
    if (match) {
      taken.add(match.value)
    }
  }

  const editingFoodIds = new Set(
    foodDrafts.value.flatMap(draft => draft.serviceId != null ? [draft.serviceId] : []),
  )

  for (const item of items.value.foods ?? []) {
    if (editingFoodIds.has(item.id)) {
      continue
    }

    if ((item.type ?? '').trim().toLowerCase() !== normalized) {
      continue
    }

    if (normalizeCalculationType(item.calculation_type) === 'per_person') {
      return 'all'
    }

    takeHunter(item.hunter_id, item.hunter_name)
    for (const hunter of item.hunters ?? []) {
      takeHunter(hunter.id, hunter.name)
    }
    for (const hunterId of item.hunter_ids ?? []) {
      takeHunter(hunterId)
    }
  }

  for (const draft of foodDrafts.value) {
    if (draft.key === exceptDraftKey || !draft.hunterId) {
      continue
    }

    const draftName = foodCatalogItem(draft.foodId)?.name.trim().toLowerCase()
    if (draftName === normalized) {
      taken.add(draft.hunterId)
    }
  }

  return taken
}

function mealHasFreeHunter(mealName: string, exceptDraftKey?: number): boolean {
  const hunters = hunterOptions.value
  if (hunters.length === 0) {
    return true
  }

  const taken = mealTakenHunterIds(mealName, exceptDraftKey)
  if (taken === 'all') {
    return false
  }

  return hunters.some(option => !taken.has(option.value))
}

function foodOptionsFor(row: FoodDraft): SelectFieldOption[] {
  return foodOptions.value.filter((option) => {
    const name = foodCatalogItem(option.value)?.name ?? ''
    return mealHasFreeHunter(name, row.key)
  })
}

watch(
  [() => items.value.foods, foodDrafts],
  () => {
    for (const row of foodDrafts.value) {
      if (!row.foodId) {
        continue
      }

      const name = foodCatalogItem(row.foodId)?.name ?? ''
      if (!mealHasFreeHunter(name, row.key)) {
        row.foodId = ''
        row.hunterId = ''
      }
    }
  },
  { deep: true },
)

function foodHunterOptions(row: FoodDraft): SelectFieldOption[] {
  const catalog = foodCatalogItem(row.foodId)
  if (!catalog) {
    return hunterOptions.value
  }

  const taken = mealTakenHunterIds(catalog.name, row.key)
  if (taken === 'all') {
    return []
  }

  return hunterOptions.value.filter(option => !taken.has(option.value))
}

const trophyRowEntries = computed(() => {
  const entries: Array<{ key: string, item?: BookingServiceTrophyItem, draft?: TrophyDraft }> = []
  for (const item of items.value.trophies ?? []) {
    const draft = trophyDrafts.value.find(row => row.serviceId === item.id)
    entries.push(draft ? { key: `trophy-edit-${item.id}`, draft } : { key: `trophy-${item.id}`, item })
  }
  for (const draft of trophyDrafts.value) {
    if (draft.serviceId == null) {
      entries.push({ key: `trophy-draft-${draft.key}`, draft })
    }
  }
  return entries
})

const penaltyRowEntries = computed(() => {
  const entries: Array<{ key: string, item?: BookingServicePenaltyItem, draft?: PenaltyDraft }> = []
  for (const item of items.value.penalties ?? []) {
    const draft = penaltyDrafts.value.find(row => row.serviceId === item.id)
    entries.push(draft ? { key: `penalty-edit-${item.id}`, draft } : { key: `penalty-${item.id}`, item })
  }
  for (const draft of penaltyDrafts.value) {
    if (draft.serviceId == null) {
      entries.push({ key: `penalty-draft-${draft.key}`, draft })
    }
  }
  return entries
})

const preparationRowEntries = computed(() => {
  const entries: Array<{ key: string, item?: BookingServicePreparationItem, draft?: PreparationDraft }> = []
  for (const item of items.value.preparations ?? []) {
    const draft = preparationDrafts.value.find(row => row.serviceId === item.id)
    entries.push(draft ? { key: `preparation-edit-${item.id}`, draft } : { key: `preparation-${item.id}`, item })
  }
  for (const draft of preparationDrafts.value) {
    if (draft.serviceId == null) {
      entries.push({ key: `preparation-draft-${draft.key}`, draft })
    }
  }
  return entries
})

const foodRowEntries = computed(() => {
  const entries: Array<{ key: string, item?: BookingServiceFoodItem, draft?: FoodDraft }> = []
  for (const item of items.value.foods ?? []) {
    const draft = foodDrafts.value.find(row => row.serviceId === item.id)
    entries.push(draft ? { key: `food-edit-${item.id}`, draft } : { key: `food-${item.id}`, item })
  }
  for (const draft of foodDrafts.value) {
    if (draft.serviceId == null) {
      entries.push({ key: `food-draft-${draft.key}`, draft })
    }
  }
  return entries
})

const additionalRowEntries = computed(() => {
  const entries: Array<{ key: string, item?: BookingServiceAdditionalItem, draft?: AdditionalDraft }> = []
  for (const item of items.value.additionals ?? []) {
    const draft = additionalDrafts.value.find(row => row.serviceId === item.id)
    entries.push(draft ? { key: `additional-edit-${item.id}`, draft } : { key: `additional-${item.id}`, item })
  }
  for (const draft of additionalDrafts.value) {
    if (draft.serviceId == null) {
      entries.push({ key: `additional-draft-${draft.key}`, draft })
    }
  }
  return entries
})

const spendingRowEntries = computed(() => {
  const entries: Array<{ key: string, item?: BookingServiceSpendingItem, draft?: SpendingDraft }> = []
  for (const item of items.value.spendings ?? []) {
    const draft = spendingDrafts.value.find(row => row.serviceId === item.id)
    entries.push(draft ? { key: `spending-edit-${item.id}`, draft } : { key: `spending-${item.id}`, item })
  }
  for (const draft of spendingDrafts.value) {
    if (draft.serviceId == null) {
      entries.push({ key: `spending-draft-${draft.key}`, draft })
    }
  }
  return entries
})

function foodHunterLabel(item: BookingServiceFoodItem): string {
  if (normalizeCalculationType(item.calculation_type) === 'per_person') {
    return 'Разделено на всех'
  }

  const name = item.hunter_name?.trim()
  if (name) {
    return name
  }

  if (item.hunter_id != null && item.hunter_id > 0) {
    return hunterNameById(item.hunter_id) || '—'
  }

  return '—'
}

function savedFoodCount(item: BookingServiceFoodItem): number {
  const edited = savedFoodCounts.value[item.id]
  if (edited != null) {
    return edited
  }

  const count = Number(item.count)
  if (Number.isInteger(count) && count >= 1) {
    return count
  }

  return foodTimes()
}

function foodSavedUnitAmount(item: BookingServiceFoodItem): number | null {
  if (normalizeCalculationType(item.calculation_type) === 'per_person') {
    return catalogUnitPrice(item.unit_price)
  }

  const name = (item.type ?? '').trim().toLowerCase()
  const catalog = foodCatalog.value.find(entry => entry.name.trim().toLowerCase() === name)
  return catalogUnitPrice(catalog?.price)
}

function savedFoodTotal(item: BookingServiceFoodItem): string {
  const unit = foodSavedUnitAmount(item)
  if (unit != null) {
    return formatHotelPriceLabel(Math.round(unit * savedFoodCount(item)))
  }

  return formatServicePrice(item.price)
}

function onFoodCountKeydown(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return
  }

  const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter']
  if (allowed.includes(event.key) || /^\d$/.test(event.key)) {
    return
  }

  event.preventDefault()
}

function onFoodCountBeforeInput(event: InputEvent) {
  if (event.inputType.startsWith('delete') || event.inputType.startsWith('history')) {
    return
  }

  if (event.data != null && /\D/.test(event.data)) {
    event.preventDefault()
  }
}

function keepFoodCountDigits(event: Event) {
  const input = event.target as HTMLInputElement
  const digits = input.value.replace(/\D/g, '')
  if (input.value !== digits) {
    input.value = digits
  }

  return digits
}

function onFoodDraftCountInput(row: { count: number }, event: Event) {
  const digits = keepFoodCountDigits(event)
  row.count = digits === '' ? 0 : Number(digits)
}

function foodSavedUnitPrice(item: BookingServiceFoodItem): string {
  if (normalizeCalculationType(item.calculation_type) === 'per_person') {
    return catalogPriceLabel(item.unit_price) ?? '—'
  }

  const name = (item.type ?? '').trim().toLowerCase()
  const catalog = foodCatalog.value.find(entry => entry.name.trim().toLowerCase() === name)
  return catalogPriceLabel(catalog?.price) ?? '—'
}

function canSaveFoodDraft(row: FoodDraft): boolean {
  const hasHunter = isPerPersonFood(row.foodId) || Boolean(row.hunterId)

  return Boolean(row.foodId && hasHunter && foodDraftCount(row) != null) && savingFoodKey.value === null
}

function formatServicePrice(price: unknown): string {
  return catalogPriceLabel(price) ?? '—'
}

const preliminaryTotalLabel = computed(() => {
  const total = services.value?.preliminary_total
  if (typeof total !== 'number' || !Number.isFinite(total)) {
    return ''
  }

  return formatHotelPriceLabel(total)
})

function foodTimes(): number {
  const nights = Number(booking.value?.accommodation?.nights) || 1
  return Math.max(1, nights - 1)
}

function preliminaryPart(list: DeletableServiceList, price: unknown): number {
  if (list === 'spendings') {
    return 0
  }

  const amount = Number(price)
  if (!Number.isFinite(amount)) {
    return 0
  }

  return amount
}

function commitServiceItems(
  itemsPatch: Partial<BookingServicesItems>,
  totalDelta: number,
) {
  if (!services.value) {
    return
  }

  const currentTotal = services.value.preliminary_total
  services.value = {
    ...services.value,
    preliminary_total: typeof currentTotal === 'number'
      ? Math.round(currentTotal + totalDelta)
      : currentTotal,
    items: {
      ...services.value.items,
      ...itemsPatch,
    },
  }
}

function withCatalogPrice(label: string, price: unknown, value: string): SelectFieldOption {
  const suffix = catalogPriceLabel(price)
  if (!suffix) {
    return { value, label }
  }

  return {
    value,
    label,
    suffix,
  }
}

function trophyTypeOptions(animalId: string): SelectFieldOption[] {
  const animal = trophyAnimals.value.find(item => String(item.id) === animalId)
  return (animal?.trophies ?? []).map(trophy => withCatalogPrice(
    trophy.type,
    trophy.price,
    String(trophy.id),
  ))
}

function trophyTypeById(animalId: string, trophyId: string): string {
  return trophyTypeOptions(animalId).find(option => option.value === trophyId)?.label ?? ''
}

function onTrophyAnimalChange(row: TrophyDraft, animalId: string) {
  row.animalId = animalId
  row.trophyId = ''
}

function addTrophyDraft() {
  if (!canAddServiceType('trophy') || hasOpenDraft('trophy')) {
    return
  }

  expandBlock('trophy')
  const key = ++trophyDraftKey
  trophyDrafts.value.push({
    key,
    animalId: '',
    trophyId: '',
    hunterIds: [],
    count: 1,
  })
  scrollDraftIntoView(`trophy-${key}`)
}

function startTrophyEdit(item: BookingServiceTrophyItem) {
  if (!canAddServiceType('trophy') || hasOpenDraft('trophy')) {
    return
  }

  const animalId = item.animal_id != null ? String(item.animal_id) : ''
  const trophy = trophyAnimals.value
    .find(animal => String(animal.id) === animalId)
    ?.trophies
    ?.find(entry => entry.type === item.type)
  expandBlock('trophy')
  const key = ++trophyDraftKey
  trophyDrafts.value.push({
    key,
    serviceId: item.id,
    animalId,
    trophyId: trophy ? String(trophy.id) : '',
    hunterIds: hunterIdsFromItem(item.hunter_ids, item.hunter_name),
    count: item.count || 1,
  })
  scrollDraftIntoView(`trophy-${key}`)
}

function removeTrophyDraft(key: number) {
  trophyDrafts.value = trophyDrafts.value.filter(row => row.key !== key)
}

function cancelTrophyDraft(key: number) {
  if (savingTrophyKey.value === key) {
    return
  }

  removeTrophyDraft(key)
}

function canSaveTrophyDraft(row: TrophyDraft): boolean {
  return Boolean(row.animalId && row.trophyId && row.hunterIds.length)
    && Number.isInteger(Number(row.count))
    && Number(row.count) >= 1
    && savingTrophyKey.value === null
}

function upsertTrophyItem(item: BookingServiceTrophyItem) {
  if (!services.value) {
    return
  }

  const current = services.value.items.trophies ?? []
  const index = current.findIndex(existing => existing.id === item.id)
  const previous = index >= 0 ? current[index] : undefined
  const next = [...current]

  if (index >= 0) {
    next[index] = item
  }
  else {
    next.push(item)
  }

  commitServiceItems(
    { trophies: next },
    preliminaryPart('trophies', item.price) - preliminaryPart('trophies', previous?.price),
  )
}

async function saveTrophyDraft(row: TrophyDraft) {
  if (!canAddServiceType('trophy')) {
    return
  }

  const code = booking.value?.code
  const animalId = Number(row.animalId)
  const trophyId = Number(row.trophyId)
  const count = Number(row.count)
  const hunterIds = row.hunterIds.map(Number).filter(id => Number.isInteger(id) && id > 0)
  const type = trophyTypeById(row.animalId, row.trophyId)

  if (!code || !canSaveTrophyDraft(row) || !type || !hunterIds.length) {
    return
  }

  savingTrophyKey.value = row.key

  try {
    const body = {
      animal_id: animalId,
      trophy_id: trophyId,
      type,
      count,
      hunter_ids: hunterIds,
    }
    const response = row.serviceId
      ? await bookings.updateTrophy(code, row.serviceId, body)
      : await bookings.storeTrophy(code, body)

    if (!response.success || !response.data) {
      notifications.error(response.message || savedServiceError(row.serviceId, 'Не удалось добавить трофей'), notifyOptions)
      return
    }

    const animalTitle = trophyAnimals.value.find(animal => String(animal.id) === row.animalId)?.title ?? ''
    upsertTrophyItem({
      ...response.data,
      animal_id: response.data.animal_id ?? animalId,
      animal_title: response.data.animal_title || animalTitle,
      type: response.data.type || type,
      count: response.data.count ?? count,
      hunter_ids: response.data.hunter_ids ?? hunterIds,
      hunter_name: hunterNamesLabel(response.data.hunter_ids ?? hunterIds, response.data.hunter_name),
    })
    removeTrophyDraft(row.key)
    notifications.success(savedServiceMessage(row.serviceId, response.message), notifyOptions)
  }
  catch (error) {
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || savedServiceError(row.serviceId, 'Не удалось добавить трофей'), notifyOptions)
  }
  finally {
    savingTrophyKey.value = null
  }
}

function penaltyTypeOptions(animalId: string): SelectFieldOption[] {
  const animal = penaltyAnimals.value.find(item => String(item.id) === animalId)
  return (animal?.fines ?? []).map(fine => withCatalogPrice(
    fine.type,
    fine.price,
    String(fine.id),
  ))
}

function penaltyTypeById(animalId: string, penaltyId: string): string {
  return penaltyTypeOptions(animalId).find(option => option.value === penaltyId)?.label ?? ''
}

function onPenaltyAnimalChange(row: PenaltyDraft, animalId: string) {
  row.animalId = animalId
  row.penaltyId = ''
}

function addPenaltyDraft() {
  if (!canAddServiceType('penalty') || hasOpenDraft('penalty')) {
    return
  }

  expandBlock('penalty')
  const key = ++penaltyDraftKey
  penaltyDrafts.value.push({
    key,
    animalId: '',
    penaltyId: '',
    hunterId: '',
  })
  scrollDraftIntoView(`penalty-${key}`)
}

function addExtraHuntDraft() {
  if (!canAddServiceType('extra_hunt') || hasOpenDraft('extraHunt')) {
    return
  }

  expandBlock('extraHunt')
  const key = ++extraHuntDraftKey
  extraHuntDrafts.value.push({
    key,
    animalId: '',
    hunterIds: [],
  })
  scrollDraftIntoView(`extra-hunt-${key}`)
}

function cancelExtraHuntDraft(key: number) {
  extraHuntDrafts.value = extraHuntDrafts.value.filter(draft => draft.key !== key)
}

function canSaveExtraHuntDraft(row: ExtraHuntDraft): boolean {
  return Boolean(
    row.animalId
    && row.hunterIds.length
    && extraHuntPriceLabel(row.animalId),
  ) && savingExtraHuntKey.value === null
}

function upsertExtraHuntItem(item: BookingServiceExtraHuntItem) {
  const current = [...(items.value.extra_hunts ?? [])]
  const index = current.findIndex(row => row.id === item.id)
  const previous = index >= 0 ? current[index] : undefined
  const next = [...current]

  if (index >= 0) {
    next[index] = item
  }
  else {
    next.push(item)
  }

  commitServiceItems(
    { extra_hunts: next },
    preliminaryPart('extra_hunts', item.price) - preliminaryPart('extra_hunts', previous?.price),
  )
}

async function saveExtraHuntDraft(row: ExtraHuntDraft) {
  if (!canAddServiceType('extra_hunt')) {
    return
  }

  const code = booking.value?.code
  const animalId = Number(row.animalId)
  const hunterIds = row.hunterIds.map(Number).filter(id => Number.isInteger(id) && id > 0)

  if (!code || !canSaveExtraHuntDraft(row) || !hunterIds.length) {
    return
  }

  savingExtraHuntKey.value = row.key

  try {
    const response = await bookings.storeExtraHunt(code, {
      animal_id: animalId,
      hunter_ids: hunterIds,
    })

    if (!response.success || !response.data) {
      notifications.error(response.message || 'Не удалось добавить дополнительную охоту', notifyOptions)
      return
    }

    const animalTitle = extraHuntAnimalOptions.value.find(option => option.value === row.animalId)?.label ?? ''
    upsertExtraHuntItem({
      ...response.data,
      animal_id: response.data.animal_id ?? animalId,
      animal_title: response.data.animal_title || animalTitle,
      hunter_ids: response.data.hunter_ids ?? hunterIds,
      hunter_name: response.data.hunter_name || hunterIds.map(id => hunterNameById(id)).filter(Boolean).join(', '),
      price: response.data.price,
    })
    cancelExtraHuntDraft(row.key)
    notifications.success(response.message || 'Услуга добавлена', notifyOptions)
  }
  catch (error) {
    const err = error as {
      data?: { message?: string } | string
      status?: number
      statusCode?: number
    }
    const dataMessage = err.data && typeof err.data === 'object' ? err.data.message : undefined
    const status = err.status || err.statusCode
    notifications.error(
      dataMessage || (status ? `Ошибка ${status}` : 'Не удалось добавить дополнительную охоту'),
      notifyOptions,
    )
  }
  finally {
    savingExtraHuntKey.value = null
  }
}

function startPenaltyEdit(item: BookingServicePenaltyItem) {
  if (!canAddServiceType('penalty') || hasOpenDraft('penalty')) {
    return
  }

  const animalId = item.animal_id != null ? String(item.animal_id) : ''
  const penalty = penaltyAnimals.value
    .find(animal => String(animal.id) === animalId)
    ?.fines
    ?.find(entry => entry.type === item.type)
  expandBlock('penalty')
  const key = ++penaltyDraftKey
  penaltyDrafts.value.push({
    key,
    serviceId: item.id,
    animalId,
    penaltyId: penalty ? String(penalty.id) : '',
    hunterId: hunterIdFromItem(item.hunter_id, item.hunter_name),
  })
  scrollDraftIntoView(`penalty-${key}`)
}

function removePenaltyDraft(key: number) {
  penaltyDrafts.value = penaltyDrafts.value.filter(row => row.key !== key)
}

function cancelPenaltyDraft(key: number) {
  if (savingPenaltyKey.value === key) {
    return
  }

  removePenaltyDraft(key)
}

function canSavePenaltyDraft(row: PenaltyDraft): boolean {
  return Boolean(row.animalId && row.penaltyId && row.hunterId)
    && savingPenaltyKey.value === null
}

function upsertPenaltyItem(item: BookingServicePenaltyItem) {
  if (!services.value) {
    return
  }

  const current = services.value.items.penalties ?? []
  const index = current.findIndex(existing => existing.id === item.id)
  const previous = index >= 0 ? current[index] : undefined
  const next = [...current]

  if (index >= 0) {
    next[index] = item
  }
  else {
    next.push(item)
  }

  commitServiceItems(
    { penalties: next },
    preliminaryPart('penalties', item.price) - preliminaryPart('penalties', previous?.price),
  )
}

async function savePenaltyDraft(row: PenaltyDraft) {
  if (!canAddServiceType('penalty')) {
    return
  }

  const code = booking.value?.code
  const animalId = Number(row.animalId)
  const penaltyId = Number(row.penaltyId)
  const hunterId = Number(row.hunterId)
  const type = penaltyTypeById(row.animalId, row.penaltyId)

  if (!code || !canSavePenaltyDraft(row) || !type) {
    return
  }

  savingPenaltyKey.value = row.key

  try {
    const body = {
      animal_id: animalId,
      penalty_id: penaltyId,
      type,
      hunter_id: hunterId,
    }
    const response = row.serviceId
      ? await bookings.updatePenalty(code, row.serviceId, body)
      : await bookings.storePenalty(code, body)

    if (!response.success || !response.data) {
      notifications.error(response.message || savedServiceError(row.serviceId, 'Не удалось добавить штраф'), notifyOptions)
      return
    }

    const animalTitle = penaltyAnimals.value.find(animal => String(animal.id) === row.animalId)?.title ?? ''
    upsertPenaltyItem({
      ...response.data,
      animal_id: response.data.animal_id ?? animalId,
      animal_title: response.data.animal_title || animalTitle,
      type: response.data.type || type,
      hunter_id: response.data.hunter_id ?? hunterId,
      hunter_name: response.data.hunter_name || hunterNameById(hunterId),
    })
    removePenaltyDraft(row.key)
    notifications.success(savedServiceMessage(row.serviceId, response.message), notifyOptions)
  }
  catch (error) {
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || savedServiceError(row.serviceId, 'Не удалось добавить штраф'), notifyOptions)
  }
  finally {
    savingPenaltyKey.value = null
  }
}

function addSpendingDraft() {
  if (!canAddServiceType('spending') || hasOpenDraft('spending')) {
    return
  }

  expandBlock('spending')
  const key = ++spendingDraftKey
  spendingDrafts.value.push({
    key,
    hunterId: '',
    price: '',
    comment: '',
  })
  scrollDraftIntoView(`spending-${key}`)
}

function startSpendingEdit(item: BookingServiceSpendingItem) {
  if (!canAddServiceType('spending') || hasOpenDraft('spending')) {
    return
  }

  expandBlock('spending')
  const key = ++spendingDraftKey
  spendingDrafts.value.push({
    key,
    serviceId: item.id,
    hunterId: hunterIdFromItem(item.hunter_id, item.hunter_name),
    price: String(item.price ?? ''),
    comment: item.comment ?? '',
  })
  scrollDraftIntoView(`spending-${key}`)
}

function removeSpendingDraft(key: number) {
  spendingDrafts.value = spendingDrafts.value.filter(row => row.key !== key)
}

function cancelSpendingDraft(key: number) {
  if (savingSpendingKey.value === key) {
    return
  }

  removeSpendingDraft(key)
}

function onSpendingPriceInput(row: SpendingDraft, event: Event) {
  row.price = keepFoodCountDigits(event)
}

function parseSpendingPrice(value: string): number | null {
  const raw = value.trim().replace(/\s/g, '').replace(',', '.')
  if (!raw) {
    return null
  }

  const price = Number(raw)
  if (!Number.isFinite(price) || price < 0) {
    return null
  }

  return price
}

function canSaveSpendingDraft(row: SpendingDraft): boolean {
  return Boolean(row.hunterId && row.comment.trim())
    && parseSpendingPrice(row.price) !== null
    && savingSpendingKey.value === null
}

function upsertSpendingItem(item: BookingServiceSpendingItem) {
  if (!services.value) {
    return
  }

  const current = services.value.items.spendings ?? []
  const index = current.findIndex(existing => existing.id === item.id)
  const next = [...current]

  if (index >= 0) {
    next[index] = item
  }
  else {
    next.push(item)
  }

  services.value = {
    ...services.value,
    items: {
      ...services.value.items,
      spendings: next,
    },
  }
}

async function saveSpendingDraft(row: SpendingDraft) {
  if (!canAddServiceType('spending')) {
    return
  }

  const code = booking.value?.code
  const hunterId = Number(row.hunterId)
  const price = parseSpendingPrice(row.price)
  const comment = row.comment.trim()

  if (!code || price === null || !canSaveSpendingDraft(row)) {
    return
  }

  savingSpendingKey.value = row.key

  try {
    const body = {
      hunter_id: hunterId,
      price,
      comment,
    }
    const response = row.serviceId
      ? await bookings.updateSpending(code, row.serviceId, body)
      : await bookings.storeSpending(code, body)

    if (!response.success || !response.data) {
      notifications.error(response.message || savedServiceError(row.serviceId, 'Не удалось добавить трату'), notifyOptions)
      return
    }

    upsertSpendingItem({
      ...response.data,
      hunter_id: response.data.hunter_id ?? hunterId,
      hunter_name: response.data.hunter_name || hunterNameById(hunterId),
      price: response.data.price ?? price,
      comment: response.data.comment || comment,
    })
    removeSpendingDraft(row.key)
    notifications.success(savedServiceMessage(row.serviceId, response.message), notifyOptions)
  }
  catch (error) {
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || savedServiceError(row.serviceId, 'Не удалось добавить трату'), notifyOptions)
  }
  finally {
    savingSpendingKey.value = null
  }
}

function addAdditionalDraft() {
  if (!canAddServiceType('addetional') || hasOpenDraft('addetional')) {
    return
  }

  expandBlock('addetional')
  const key = ++additionalDraftKey
  additionalDrafts.value.push({
    key,
    additionalId: '',
    hunterId: '',
    count: 1,
  })
  scrollDraftIntoView(`additional-${key}`)
}

function additionalIdByName(name?: string | null): string {
  const normalized = name?.trim().toLowerCase()
  if (!normalized) {
    return ''
  }

  const match = (services.value?.catalogs?.additionals ?? [])
    .find(entry => entry.name.trim().toLowerCase() === normalized)
  return match ? String(match.id) : ''
}

function startAdditionalEdit(item: BookingServiceAdditionalItem) {
  if (!canAddServiceType('addetional') || hasOpenDraft('addetional')) {
    return
  }

  const perPerson = item.calculation_type === 'per_person'
  expandBlock('addetional')
  const key = ++additionalDraftKey
  additionalDrafts.value.push({
    key,
    serviceId: item.id,
    additionalId: additionalIdByName(item.type),
    hunterId: perPerson ? '' : hunterIdFromItem(item.hunter_id, item.hunter_name),
    count: item.count || 1,
  })
  scrollDraftIntoView(`additional-${key}`)
}

function removeAdditionalDraft(key: number) {
  additionalDrafts.value = additionalDrafts.value.filter(row => row.key !== key)
  const next = { ...dismissedAdditionalStock.value }
  delete next[key]
  dismissedAdditionalStock.value = next
}

function cancelAdditionalDraft(key: number) {
  if (savingAdditionalKey.value === key) {
    return
  }

  removeAdditionalDraft(key)
}

function additionalById(additionalId: string) {
  return (services.value?.catalogs?.additionals ?? []).find(entry => String(entry.id) === additionalId)
}

function isPerPersonAdditional(additionalId: string): boolean {
  return additionalById(additionalId)?.calculation_type === 'per_person'
}

function onAdditionalChange(row: AdditionalDraft, additionalId: string | string[]) {
  row.additionalId = Array.isArray(additionalId) ? additionalId[0] ?? '' : additionalId
  row.hunterId = ''
}

function additionalNameById(additionalId: number): string {
  return additionalOptions.value.find(item => item.value === String(additionalId))?.label ?? ''
}

function additionalDraftPrice(additionalId: string): string {
  return catalogPriceLabel(additionalById(additionalId)?.price) ?? ''
}

function additionalDraftTotal(row: AdditionalDraft): string {
  const unit = catalogUnitPrice(additionalById(row.additionalId)?.price)
  const count = Number(row.count)
  if (unit == null || !Number.isInteger(count) || count < 1) {
    return ''
  }

  return formatHotelPriceLabel(Math.round(unit * count))
}

function additionalSavedCount(item: BookingServiceAdditionalItem): number {
  const count = Number(item.count)
  return Number.isInteger(count) && count >= 1 ? count : 1
}

function additionalSavedUnitPrice(item: BookingServiceAdditionalItem): string {
  const price = Number(item.price)
  const unit = Number.isFinite(price) ? price / additionalSavedCount(item) : item.price

  return additionalSharePrice(unit, item.calculation_type) || '—'
}

function additionalHunterCount(): number {
  const fromCatalog = services.value?.catalogs?.hunters?.length ?? 0
  if (fromCatalog > 0) {
    return fromCatalog
  }

  return booking.value?.hunt?.hunters ?? 0
}

function additionalSharePrice(price: unknown, calculationType: string | null | undefined, people?: number): string {
  const total = catalogUnitPrice(price)
  if (total == null) {
    return ''
  }

  if (calculationType !== 'per_person' && calculationType !== 'individual') {
    return formatHotelPriceLabel(total)
  }

  const sharePeople = calculationType === 'individual'
    ? people ?? 0
    : additionalHunterCount()

  if (sharePeople < 1) {
    return formatHotelPriceLabel(total)
  }

  return formatHotelPriceLabel(Math.round(total / sharePeople))
}

function additionalDraftUnitPrice(row: AdditionalDraft): string {
  const catalog = additionalById(row.additionalId)
  if (!catalog) {
    return ''
  }

  return additionalSharePrice(
    catalog.price,
    catalog.calculation_type,
    catalog.calculation_type === 'individual' ? 1 : undefined,
  )
}

function additionalStockLimit(additionalId: string): number | null {
  const count = additionalById(additionalId)?.count
  if (count == null) {
    return null
  }

  const limit = Number(count)
  if (!Number.isInteger(limit) || limit < 0) {
    return null
  }

  return limit
}

function additionalMatchingItems(additionalId: string, exceptServiceId?: number) {
  const name = additionalById(additionalId)?.name.trim().toLowerCase()
  if (!name) {
    return []
  }

  return (items.value.additionals ?? []).filter(item =>
    item.id !== exceptServiceId && (item.type ?? '').trim().toLowerCase() === name,
  )
}

function additionalRequestedCount(row: AdditionalDraft): number {
  const count = Number(row.count)
  return Number.isInteger(count) && count > 0 ? count : 0
}

function additionalStockWarningToken(row: AdditionalDraft): string {
  return `${row.additionalId}:${Number(row.count)}`
}

function showAdditionalStockWarning(row: AdditionalDraft): boolean {
  return additionalStockExhausted(row)
    && dismissedAdditionalStock.value[row.key] !== additionalStockWarningToken(row)
}

function dismissAdditionalStockWarning(row: AdditionalDraft) {
  dismissedAdditionalStock.value = {
    ...dismissedAdditionalStock.value,
    [row.key]: additionalStockWarningToken(row),
  }
}

function additionalStockExhausted(row: AdditionalDraft): boolean {
  if (!row.additionalId) {
    return false
  }

  const limit = additionalStockLimit(row.additionalId)
  if (limit == null) {
    return false
  }

  const saved = additionalMatchingItems(row.additionalId, row.serviceId)
  const usedQuantity = saved.reduce((sum, item) => sum + additionalSavedCount(item), 0)
  const usedRows = saved.length + (row.serviceId == null ? 1 : 0)

  return usedRows > limit || usedQuantity + additionalRequestedCount(row) > limit
}

function canSaveAdditionalDraft(row: AdditionalDraft): boolean {
  if (additionalStockExhausted(row)) {
    return false
  }

  const hasHunter = isPerPersonAdditional(row.additionalId) || Boolean(row.hunterId)

  return Boolean(row.additionalId && hasHunter)
    && Number.isInteger(Number(row.count))
    && Number(row.count) >= 1
    && savingAdditionalKey.value === null
}

function upsertAdditionalItem(item: BookingServiceAdditionalItem) {
  if (!services.value) {
    return
  }

  const current = services.value.items.additionals ?? []
  const index = current.findIndex(existing => existing.id === item.id)
  const previous = index >= 0 ? current[index] : undefined
  const next = [...current]

  if (index >= 0) {
    next[index] = item
  }
  else {
    next.push(item)
  }

  commitServiceItems(
    { additionals: next },
    preliminaryPart('additionals', item.price) - preliminaryPart('additionals', previous?.price),
  )
}

async function saveAdditionalDraft(row: AdditionalDraft) {
  if (!canAddServiceType('addetional')) {
    return
  }

  const code = booking.value?.code
  const additionalId = Number(row.additionalId)
  const count = Number(row.count)
  const perPerson = isPerPersonAdditional(row.additionalId)
  const hunterId = Number(row.hunterId)

  if (!code || !canSaveAdditionalDraft(row) || (!perPerson && !(Number.isInteger(hunterId) && hunterId > 0))) {
    return
  }

  const name = additionalNameById(additionalId)
  if (!name || additionalStockExhausted(row)) {
    notifications.error(additionalStockExhausted(row) ? 'Недостаточное количество данной услуги на базе' : 'Выберите услугу', notifyOptions)
    return
  }

  savingAdditionalKey.value = row.key

  try {
    const body = {
      additional_id: additionalId,
      name,
      count,
      hunter_id: perPerson ? null : hunterId,
    }
    const response = row.serviceId
      ? await bookings.updateAdditional(code, row.serviceId, body)
      : await bookings.storeAdditional(code, {
          additional_id: additionalId,
          name,
          count,
          ...(perPerson ? {} : { hunter_id: hunterId }),
        })

    if (!response.success || !response.data) {
      notifications.error(response.message || savedServiceError(row.serviceId, 'Не удалось добавить услугу'), notifyOptions)
      return
    }

    upsertAdditionalItem({
      ...response.data,
      type: response.data.type || name,
      calculation_type: response.data.calculation_type ?? (perPerson ? 'per_person' : 'individual'),
      hunter_id: perPerson ? null : (response.data.hunter_id ?? hunterId),
      hunter_name: perPerson ? undefined : (response.data.hunter_name || hunterNameById(hunterId)),
    })
    removeAdditionalDraft(row.key)
    notifications.success(savedServiceMessage(row.serviceId, response.message), notifyOptions)
  }
  catch (error) {
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || savedServiceError(row.serviceId, 'Не удалось добавить услугу'), notifyOptions)
  }
  finally {
    savingAdditionalKey.value = null
  }
}

function foodIdByName(name?: string | null): string {
  const normalized = name?.trim().toLowerCase()
  if (!normalized) {
    return ''
  }

  const match = foodCatalog.value.find(entry => entry.name.trim().toLowerCase() === normalized)
  return match ? String(match.id) : ''
}

function addFoodDraft() {
  if (!canAddServiceType('food') || hasOpenDraft('food')) {
    return
  }

  expandBlock('food')
  const key = ++foodDraftKey
  foodDrafts.value.push({
    key,
    foodId: '',
    hunterId: '',
    count: 1,
  })
  scrollDraftIntoView(`food-${key}`)
}

function startFoodEdit(item: BookingServiceFoodItem) {
  if (!canAddServiceType('food') || hasOpenDraft('food')) {
    return
  }

  const perPerson = normalizeCalculationType(item.calculation_type) === 'per_person'
  expandBlock('food')
  const key = ++foodDraftKey
  foodDrafts.value.push({
    key,
    serviceId: item.id,
    foodId: foodIdByName(item.type),
    hunterId: perPerson ? '' : hunterIdFromItem(item.hunter_id, item.hunter_name),
    count: savedFoodCount(item),
  })
  scrollDraftIntoView(`food-${key}`)
}

function removeFoodDraft(key: number) {
  foodDrafts.value = foodDrafts.value.filter(row => row.key !== key)
}

function cancelFoodDraft(key: number) {
  if (savingFoodKey.value === key) {
    return
  }

  removeFoodDraft(key)
}

function upsertFoodItem(item: BookingServiceFoodItem) {
  if (!services.value) {
    return
  }

  const current = services.value.items.foods ?? []
  const index = current.findIndex(existing => existing.id === item.id)
  const previous = index >= 0 ? current[index] : undefined
  const next = [...current]

  if (index >= 0) {
    next[index] = item
  }
  else {
    next.push(item)
  }

  commitServiceItems(
    { foods: next },
    preliminaryPart('foods', item.price) - preliminaryPart('foods', previous?.price),
  )
}

async function saveFoodDraft(row: FoodDraft) {
  if (!canAddServiceType('food')) {
    return
  }

  const code = booking.value?.code
  const foodId = Number(row.foodId)
  const individual = isIndividualFood(row.foodId)
  const perPerson = isPerPersonFood(row.foodId)
  const hunterId = Number(row.hunterId)
  const count = foodDraftCount(row)

  if (!code || count == null || !canSaveFoodDraft(row) || (!perPerson && !(Number.isInteger(hunterId) && hunterId > 0))) {
    return
  }

  savingFoodKey.value = row.key

  try {
    const response = row.serviceId
      ? await bookings.updateFood(code, row.serviceId, {
          food_id: foodId,
          count,
          hunter_id: perPerson ? null : hunterId,
        })
      : await bookings.storeFood(code, {
          food_id: foodId,
          count,
          ...(perPerson ? {} : { hunter_id: hunterId }),
        })

    if (!response.success || !response.data) {
      notifications.error(response.message || savedServiceError(row.serviceId, 'Не удалось добавить питание'), notifyOptions)
      return
    }

    const savedHunterId = perPerson ? null : hunterId
    const savedId = response.data.id || row.serviceId
    savedFoodCounts.value = {
      ...savedFoodCounts.value,
      [savedId]: count,
    }
    upsertFoodItem({
      ...response.data,
      id: savedId,
      type: response.data.type || foodCatalogItem(row.foodId)?.name,
      count,
      calculation_type: response.data.calculation_type ?? (individual ? 'individual' : perPerson ? 'per_person' : null),
      hunter_id: savedHunterId,
      hunter_name: perPerson ? undefined : (response.data.hunter_name || hunterNameById(hunterId) || undefined),
    })

    removeFoodDraft(row.key)
    notifications.success(savedServiceMessage(row.serviceId, response.message), notifyOptions)
  }
  catch (error) {
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || savedServiceError(row.serviceId, 'Не удалось добавить питание'), notifyOptions)
  }
  finally {
    savingFoodKey.value = null
  }
}

function bookedPreparationAnimalId(): string {
  const animals = preparationAnimalsForSelect.value
  const bookedAnimalId = booking.value?.hunt?.animalId

  if (bookedAnimalId != null) {
    const match = animals.find(animal => animal.id === bookedAnimalId)
    if (match) {
      return String(match.id)
    }
  }

  const bookedTitle = booking.value?.hunt?.animal?.trim()
  if (bookedTitle && bookedTitle !== '—') {
    const match = animals.find(animal => animal.title.trim() === bookedTitle)
    if (match) {
      return String(match.id)
    }
  }

  return ''
}

function addPreparationDraft() {
  if (!canAddServiceType('preparation') || hasOpenDraft('preparation')) {
    return
  }

  expandBlock('preparation')
  const key = ++preparationDraftKey
  preparationDrafts.value.push({
    key,
    animalId: bookedPreparationAnimalId(),
    preparationId: '',
    count: 1,
  })
  scrollDraftIntoView(`preparation-${key}`)
}

function startPreparationEdit(item: BookingServicePreparationItem) {
  if (!canAddServiceType('preparation') || hasOpenDraft('preparation')) {
    return
  }

  const animalId = item.animal_id != null ? String(item.animal_id) : ''
  const preparation = preparationOptions(animalId).find(entry => entry.type === item.type)
  expandBlock('preparation')
  const key = ++preparationDraftKey
  preparationDrafts.value.push({
    key,
    serviceId: item.id,
    animalId,
    preparationId: preparation ? String(preparation.id) : '',
    count: item.count || 1,
  })
  scrollDraftIntoView(`preparation-${key}`)
}

function removePreparationDraft(key: number) {
  preparationDrafts.value = preparationDrafts.value.filter(row => row.key !== key)
}

function cancelPreparationDraft(key: number) {
  if (savingPreparationKey.value === key) {
    return
  }

  removePreparationDraft(key)
}

function onPreparationAnimalChange(row: PreparationDraft, animalId: string) {
  row.animalId = animalId
  row.preparationId = ''
}

function canSavePreparationDraft(row: PreparationDraft): boolean {
  return Boolean(row.animalId && row.preparationId)
    && Number.isInteger(Number(row.count))
    && Number(row.count) >= 1
    && savingPreparationKey.value === null
}

function upsertPreparationItem(item: BookingServicePreparationItem) {
  if (!services.value) {
    return
  }

  const current = services.value.items.preparations ?? []
  const index = current.findIndex(existing => existing.id === item.id)
  const previous = index >= 0 ? current[index] : undefined
  const next = [...current]

  if (index >= 0) {
    next[index] = item
  }
  else {
    next.push(item)
  }

  commitServiceItems(
    { preparations: next },
    preliminaryPart('preparations', item.price) - preliminaryPart('preparations', previous?.price),
  )
}

function removeServiceItem(serviceId: number, list: DeletableServiceList) {
  if (!services.value) {
    return
  }

  const current = services.value.items[list] ?? []
  const removed = current.find(item => item.id === serviceId)

  commitServiceItems(
    { [list]: current.filter(item => item.id !== serviceId) },
    -preliminaryPart(list, removed?.price),
  )
}

async function deleteFoodItems(serviceIds: number[]) {
  for (const serviceId of serviceIds) {
    await deleteBookingService(serviceId, 'foods')
  }
}

function requestFoodRowDeletion(foodItems: BookingServiceFoodItem[]) {
  const serviceIds = foodItems
    .map(item => item.id)
    .filter(serviceId => canDeleteService('foods', serviceId))

  if (!serviceIds.length || deletingServiceId.value !== null) {
    return
  }

  openConfirmModal({
    title: 'Вы уверены, что хотите удалить питание?',
    confirmLabel: 'Удалить',
    confirmTone: 'success',
    onConfirm: () => deleteFoodItems(serviceIds),
  })
}

function requestServiceDeletion(serviceId: number, title: string, list: DeletableServiceList) {
  if (deletingServiceId.value !== null || !canDeleteService(list, serviceId)) {
    return
  }

  openConfirmModal({
    title,
    confirmLabel: 'Удалить',
    confirmTone: 'success',
    onConfirm: () => deleteBookingService(serviceId, list),
  })
}

async function deleteBookingService(serviceId: number, list: DeletableServiceList) {
  const code = booking.value?.code

  if (!code || deletingServiceId.value !== null) {
    return
  }

  deletingServiceId.value = serviceId

  try {
    const response = await bookings.deleteService(code, serviceId)

    if (!response.success) {
      notifications.error(response.message || 'Не удалось удалить услугу', notifyOptions)
      throw new Error('delete_service_failed')
    }

    removeServiceItem(serviceId, list)
    notifications.success(response.message || 'Услуга удалена', notifyOptions)
  }
  catch (error) {
    if ((error as Error).message !== 'delete_service_failed') {
      const data = (error as { data?: { message?: string } }).data
      notifications.error(data?.message || 'Не удалось удалить услугу', notifyOptions)
    }

    throw error
  }
  finally {
    deletingServiceId.value = null
  }
}

async function savePreparationDraft(row: PreparationDraft) {
  if (!canAddServiceType('preparation')) {
    return
  }

  const code = booking.value?.code
  const animalId = Number(row.animalId)
  const count = Number(row.count)

  if (!code || savingPreparationKey.value !== null) {
    return
  }

  if (!Number.isInteger(animalId) || animalId < 1) {
    notifications.error('Выберите животное', notifyOptions)
    return
  }

  if (!Number.isInteger(count) || count < 1) {
    notifications.error('Укажите количество', notifyOptions)
    return
  }

  const preparationId = Number(row.preparationId)
  const type = preparationTypeById(row.animalId, row.preparationId)
  if (!Number.isInteger(preparationId) || preparationId < 1 || !type) {
    notifications.error('Выберите тип разделки', notifyOptions)
    return
  }

  savingPreparationKey.value = row.key

  try {
    const body = {
      animal_id: animalId,
      preparation_id: preparationId,
      count,
    }
    const response = row.serviceId
      ? await bookings.updatePreparation(code, row.serviceId, body)
      : await bookings.storePreparation(code, body)

    if (!response.success || !response.data) {
      notifications.error(response.message || savedServiceError(row.serviceId, 'Не удалось добавить разделку'), notifyOptions)
      return
    }

    const animalTitle = preparationAnimals.value.find(animal => String(animal.id) === row.animalId)?.title ?? ''
    upsertPreparationItem({
      ...response.data,
      animal_id: response.data.animal_id ?? animalId,
      animal_title: response.data.animal_title || animalTitle,
      type: response.data.type || type,
      count: response.data.count ?? count,
    })
    removePreparationDraft(row.key)
    notifications.success(savedServiceMessage(row.serviceId, response.message), notifyOptions)
  }
  catch (error) {
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || savedServiceError(row.serviceId, 'Не удалось добавить разделку'), notifyOptions)
  }
  finally {
    savingPreparationKey.value = null
  }
}

async function loadOrganisationAnimals() {
  if (!isBaseAdmin.value) {
    organisationAnimals.value = []
    return
  }

  try {
    const response = await animalsApi.getOrganisation()
    if (!response.success || !Array.isArray(response.data)) {
      organisationAnimals.value = []
      return
    }

    organisationAnimals.value = response.data
  }
  catch {
    organisationAnimals.value = []
  }
}

async function loadHotelAdditionals() {
  try {
    const response = await servicesApi.getAdditionals()
    if (!('success' in response) || !response.success || !response.data) {
      hotelAdditionals.value = []
      return
    }

    const data = response.data
    const list = Array.isArray(data)
      ? data
      : ('additionals' in data && Array.isArray(data.additionals) ? data.additionals : [])

    hotelAdditionals.value = list.filter(item =>
      item && typeof item === 'object' && 'name' in item && 'id' in item,
    )
  }
  catch {
    hotelAdditionals.value = []
  }
}

async function refreshServices(code: string) {
  if (isLoading.value || !services.value) {
    return
  }

  const requestId = ++refreshRequestId

  try {
    const response = await bookings.services(code)

    if (requestId !== refreshRequestId || booking.value?.code !== code) {
      return
    }

    if (!response.success || !response.data) {
      return
    }

    savedFoodCounts.value = {}
    applyServicesAccess(response.data)
    services.value = {
      ...services.value,
      items: response.data.items,
      preliminary_total: response.data.preliminary_total,
      can_change: response.data.can_change,
      services_editable_until: response.data.services_editable_until,
    }
  }
  catch {
  }
}

async function loadServices(code: string) {
  const requestId = ++loadRequestId
  isLoading.value = true
  loadError.value = ''
  services.value = null
  preparationDrafts.value = []
  foodDrafts.value = []
  additionalDrafts.value = []
  dismissedAdditionalStock.value = {}
  spendingDrafts.value = []
  trophyDrafts.value = []
  penaltyDrafts.value = []
  extraHuntDrafts.value = []
  organisationAnimals.value = []
  savingPreparationKey.value = null
  savingFoodKey.value = null
  savedFoodCounts.value = {}
  savingAdditionalKey.value = null
  savingSpendingKey.value = null
  savingTrophyKey.value = null
  savingPenaltyKey.value = null
  savingExtraHuntKey.value = null
  deletingServiceId.value = null
  collapsedBlocks.value = new Set()

  try {
    const response = await bookings.services(code)

    if (requestId !== loadRequestId) {
      return
    }

    if (!response.success || !response.data) {
      loadError.value = response.message || 'Не удалось загрузить услуги'
      notifications.error(loadError.value, notifyOptions)
      return
    }

    services.value = response.data
    applyServicesAccess(response.data)
    await Promise.all([
      loadHotelAdditionals(),
      loadOrganisationAnimals(),
    ])
    loadError.value = ''
  }
  catch (error) {
    if (requestId !== loadRequestId) {
      return
    }

    const data = (error as { data?: { message?: string } }).data
    loadError.value = data?.message || 'Не удалось загрузить услуги'
    notifications.error(loadError.value, notifyOptions)
  }
  finally {
    if (requestId === loadRequestId) {
      isLoading.value = false
    }
  }
}

watch(
  () => [
    items.value.trophies.length,
    items.value.penalties.length,
    items.value.preparations.length,
    items.value.foods.length,
    items.value.additionals.length,
    items.value.spendings.length,
    trophyDrafts.value.length,
    penaltyDrafts.value.length,
    preparationDrafts.value.length,
    foodDrafts.value.length,
    additionalDrafts.value.length,
    spendingDrafts.value.length,
    isOpen.value,
  ],
  () => scheduleBlockPages(),
)

onMounted(() => {
  blockListObserver = new ResizeObserver(() => scheduleBlockPages())
  for (const el of blockListEls.values()) {
    blockListObserver.observe(el)
  }
})

onBeforeUnmount(() => {
  blockListObserver?.disconnect()
  blockListObserver = null
})

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    close()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    close()
  }
}

function scrollDraftIntoView(draftId: string) {
  nextTick(() => {
    requestAnimationFrame(() => {
      const root = servicesBodyRef.value
      const row = root?.querySelector<HTMLElement>(`[data-service-draft="${draftId}"]`)
      if (!row) {
        return
      }

      const scrollParentIntoView = (parent: HTMLElement) => {
        const parentRect = parent.getBoundingClientRect()
        const rowRect = row.getBoundingClientRect()
        const padding = 8

        if (rowRect.bottom > parentRect.bottom - padding) {
          parent.scrollTop += rowRect.bottom - parentRect.bottom + padding
        }
        else if (rowRect.top < parentRect.top + padding) {
          parent.scrollTop -= parentRect.top - rowRect.top + padding
        }
      }

      const list = row.closest<HTMLElement>('.add-services-modal__block-list')
      if (list) {
        scrollParentIntoView(list)
      }

      if (root) {
        scrollParentIntoView(root)
      }
    })
  })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="add-services-modal">
      <div
        v-if="isOpen && booking"
        class="add-services-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-services-modal-title"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <div class="add-services-modal__card">
          <div class="add-services-modal__toolbar">
            <span class="add-services-modal__history">История</span>
            <CommonModalCloseButton @click="close" />
          </div>

          <div
            class="add-services-modal__header"
            :class="{
              'add-services-modal__header--with-lock': servicesLockedByTimer,
              'add-services-modal__header--with-timer': Boolean(servicesManageTimerLabel),
            }"
          >
            <h2 id="add-services-modal-title" class="add-services-modal__title">
              Добавить услуги для брони №{{ booking.number }}
            </h2>
            <p v-if="servicesManageTimerLabel" class="add-services-modal__timer">
              Возможность управлять услугами закончится через
              <span class="add-services-modal__timer-value">{{ servicesManageTimerLabel }}</span>
            </p>
            <p v-if="servicesLockedByTimer" class="add-services-modal__locked">
              Изменять услуги уже нельзя: до заезда осталось меньше времени, чем задано таймером базы.
            </p>
            <p v-if="isBaseAdmin" class="add-services-modal__estimate">
              Предварительная смета за услуги всего:
            </p>
            <p v-if="isBaseAdmin" class="add-services-modal__estimate-value">
              {{ preliminaryTotalLabel }}
            </p>
          </div>

          <div ref="servicesBodyRef" class="add-services-modal__body">
            <div v-if="isLoading" class="add-services-modal__loading">
              <CommonSpinner size="md" label="Загрузка услуг" />
            </div>

            <div v-else-if="loadError" class="add-services-modal__empty">
              {{ loadError }}
            </div>

            <template v-else>
              <section
                v-if="isBaseAdmin && isAllowed('extra_hunt')"
                class="add-services-modal__block-row"
              >
                <div
                  v-if="blockPageCount.extraHunt > 1 && !isBlockCollapsed('extraHunt')"
                  class="add-services-modal__dots"
                  role="tablist"
                  aria-label="Страницы дополнительных охот"
                >
                  <button
                    v-for="page in blockPageCount.extraHunt"
                    :key="page"
                    type="button"
                    class="add-services-modal__dot"
                    :class="{ 'add-services-modal__dot--active': page - 1 === blockPageIndex.extraHunt }"
                    :aria-label="`Страница ${page}`"
                    :aria-current="page - 1 === blockPageIndex.extraHunt ? 'true' : undefined"
                    @click="scrollBlockToPage('extraHunt', page - 1)"
                  />
                </div>
                <div
                  class="add-services-modal__block"
                  :class="{ 'add-services-modal__block--collapsed': isBlockCollapsed('extraHunt') }"
                >
                <div class="add-services-modal__block-head">
                  <h3 class="add-services-modal__block-title">Дополнительные охоты:</h3>
                  <div class="add-services-modal__block-actions">
                    <button
                      type="button"
                      class="add-services-modal__toggle"
                      :class="{ 'add-services-modal__toggle--open': !isBlockCollapsed('extraHunt') }"
                      :aria-expanded="!isBlockCollapsed('extraHunt')"
                      aria-label="Свернуть дополнительные охоты"
                      @click="toggleBlock('extraHunt')"
                    >
                      <svg class="add-services-modal__toggle-icon" viewBox="0 0 12 8" aria-hidden="true">
                        <path d="M1 2 6 6.5 11 2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </button>
                    <button
                      v-if="canAddServiceType('extra_hunt')"
                      type="button"
                      class="add-services-modal__add"
                      aria-label="Добавить дополнительную охоту"
                      :disabled="hasOpenDraft('extraHunt')"
                      @click="addExtraHuntDraft"
                    >+</button>
                  </div>
                </div>
                <div v-show="!isBlockCollapsed('extraHunt')">
                <div class="add-services-modal__columns add-services-modal__form-row add-services-modal__form-row--extra-hunt">
                  <span>Животное</span>
                  <span>Кто охотится</span>
                  <span>Общая сумма</span>
                  <span></span>
                </div>
                <div
                  class="add-services-modal__block-list"
                  :ref="blockListRef.extraHunt"
                  @scroll="onBlockListScroll('extraHunt')"
                >
                <template
                  v-for="entry in extraHuntRowEntries"
                  :key="entry.key"
                >
                <div
                  v-if="entry.item"
                  class="add-services-modal__form-row add-services-modal__form-row--extra-hunt"
                >
                  <div class="add-services-modal__field add-services-modal__field--animal">
                    <span class="add-services-modal__value">{{ entry.item.animal_title }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--hunter">
                    <span class="add-services-modal__value">{{ entry.item.hunter_name }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--price">
                    <span class="add-services-modal__value">{{ formatServicePrice(entry.item.price) }}</span>
                  </div>
                  <div class="add-services-modal__form-actions">
                    <button
                      v-if="canDeleteService('extra_hunts', entry.item.id)"
                      type="button"
                      class="add-services-modal__delete"
                      :disabled="deletingServiceId !== null"
                      @click="requestServiceDeletion(entry.item.id, 'Вы уверены, что хотите удалить дополнительную охоту?', 'extra_hunts')"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
                <div
                  v-else-if="entry.draft"
                  class="add-services-modal__form-row add-services-modal__form-row--extra-hunt add-services-modal__form-row--draft"
                  :data-service-draft="`extra-hunt-${entry.draft.key}`"
                >
                  <div class="add-services-modal__field add-services-modal__field--animal">
                    <CommonSelectField
                      v-model="entry.draft.animalId"
                      class="add-services-modal__select"
                      placeholder="Животное"
                      filled-hover
                      no-margin
                      :options="extraHuntAnimalOptions"
                    />
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--hunter">
                    <CommonSelectField
                      v-model="entry.draft.hunterIds"
                      class="add-services-modal__select"
                      placeholder="Кто охотится"
                      filled-hover
                      no-margin
                      multiple
                      :options="hunterOptions"
                    />
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--price">
                    <span v-if="extraHuntPriceLabel(entry.draft.animalId)" class="add-services-modal__value">
                      {{ extraHuntPriceLabel(entry.draft.animalId) }}
                    </span>
                  </div>
                  <div class="add-services-modal__form-actions">
                    <button
                      type="button"
                      class="add-services-modal__save"
                      :disabled="!canSaveExtraHuntDraft(entry.draft)"
                      @click="saveExtraHuntDraft(entry.draft)"
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      class="add-services-modal__cancel"
                      :disabled="savingExtraHuntKey === entry.draft.key"
                      @click="cancelExtraHuntDraft(entry.draft.key)"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
                </template>
                </div>
                </div>
                </div>
              </section>

              <section
                v-if="isAllowed('trophy')"
                class="add-services-modal__block-row"
              >
                <div
                  v-if="blockPageCount.trophy > 1 && !isBlockCollapsed('trophy')"
                  class="add-services-modal__dots"
                  role="tablist"
                  aria-label="Страницы трофеев"
                >
                  <button
                    v-for="page in blockPageCount.trophy"
                    :key="page"
                    type="button"
                    class="add-services-modal__dot"
                    :class="{ 'add-services-modal__dot--active': page - 1 === blockPageIndex.trophy }"
                    :aria-label="`Страница ${page}`"
                    :aria-current="page - 1 === blockPageIndex.trophy ? 'true' : undefined"
                    @click="scrollBlockToPage('trophy', page - 1)"
                  />
                </div>
                <div
                  class="add-services-modal__block"
                  :class="{ 'add-services-modal__block--collapsed': isBlockCollapsed('trophy') }"
                >
                <div class="add-services-modal__block-head">
                  <h3 class="add-services-modal__block-title">Трофеи:</h3>
                  <div class="add-services-modal__block-actions">
                    <button
                      type="button"
                      class="add-services-modal__toggle"
                      :class="{ 'add-services-modal__toggle--open': !isBlockCollapsed('trophy') }"
                      :aria-expanded="!isBlockCollapsed('trophy')"
                      aria-label="Свернуть трофеи"
                      @click="toggleBlock('trophy')"
                    >
                      <svg class="add-services-modal__toggle-icon" viewBox="0 0 12 8" aria-hidden="true">
                        <path d="M1 2 6 6.5 11 2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </button>
                    <button
                      v-if="canAddServiceType('trophy')"
                      type="button"
                      class="add-services-modal__add"
                      aria-label="Добавить трофей"
                      :disabled="hasOpenDraft('trophy')"
                      @click="addTrophyDraft"
                    >+</button>
                  </div>
                </div>
                <div v-show="!isBlockCollapsed('trophy')">
                <div class="add-services-modal__columns add-services-modal__form-row add-services-modal__form-row--trophy">
                  <span>Животное</span>
                  <span>Тип трофея</span>
                  <span>Кто охотился</span>
                  <span class="add-services-modal__column-count">Количество</span>
                  <span>Общая сумма</span>
                  <span></span>
                </div>
                <div
                  class="add-services-modal__block-list"
                  :ref="blockListRef.trophy"
                  @scroll="onBlockListScroll('trophy')"
                >
                <template
                  v-for="entry in trophyRowEntries"
                  :key="entry.key"
                >
                <div
                  v-if="entry.item"
                  class="add-services-modal__form-row add-services-modal__form-row--trophy"
                >
                  <div class="add-services-modal__field add-services-modal__field--animal">
                    <span class="add-services-modal__value">{{ entry.item.animal_title }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--type">
                    <span class="add-services-modal__value">{{ entry.item.type }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--hunter">
                    <span class="add-services-modal__value">{{ hunterNamesLabel(entry.item.hunter_ids, entry.item.hunter_name) }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--count">
                    <span class="add-services-modal__value">{{ entry.item.count }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--price">
                    <span class="add-services-modal__value">{{ formatServicePrice(entry.item.price) }}</span>
                  </div>
                  <div class="add-services-modal__form-actions">
                    <button
                      v-if="canAddServiceType('trophy')"
                      type="button"
                      class="add-services-modal__edit"
                      aria-label="Редактировать трофей"
                      :disabled="hasOpenDraft('trophy') || deletingServiceId !== null"
                      @click="startTrophyEdit(entry.item)"
                    >
                      <svg class="add-services-modal__edit-icon" viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M11.2 1.9a1.5 1.5 0 0 1 2.1 2.1L5.4 12.1 2.4 13l.9-3.1 7.9-8Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
                      </svg>
                    </button>
                    <button
                      v-if="canDeleteService('trophies', entry.item.id)"
                      type="button"
                      class="add-services-modal__delete"
                      :disabled="deletingServiceId !== null"
                      @click="requestServiceDeletion(entry.item.id, 'Вы уверены, что хотите удалить трофей?', 'trophies')"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
                <div
                  v-else-if="entry.draft"
                  class="add-services-modal__form-row add-services-modal__form-row--trophy add-services-modal__form-row--draft"
                  :data-service-draft="`trophy-${entry.draft.key}`"
                >
                  <div class="add-services-modal__field add-services-modal__field--animal">
                    <CommonSelectField
                      :model-value="entry.draft.animalId"
                      class="add-services-modal__select"
                      placeholder="Животное"
                      filled-hover
                      no-margin
                      :options="trophyAnimalOptions"
                      @update:model-value="onTrophyAnimalChange(entry.draft, $event)"
                    />
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--type">
                    <CommonSelectField
                      v-model="entry.draft.trophyId"
                      class="add-services-modal__select"
                      placeholder="Тип"
                      filled-hover
                      no-margin
                      :disabled="!entry.draft.animalId"
                      :options="trophyTypeOptions(entry.draft.animalId)"
                    />
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--hunter">
                    <CommonSelectField
                      v-model="entry.draft.hunterIds"
                      class="add-services-modal__select"
                      placeholder="Кто охотился"
                      filled-hover
                      no-margin
                      multiple
                      :options="hunterOptions"
                    />
                  </div>
                  <label class="add-services-modal__field add-services-modal__field--count">
                    <input
                      class="add-services-modal__control"
                      type="text"
                      inputmode="numeric"
                      autocomplete="off"
                      :value="entry.draft.count || ''"
                      @keydown="onFoodCountKeydown"
                      @beforeinput="onFoodCountBeforeInput"
                      @input="onFoodDraftCountInput(entry.draft, $event)"
                    >
                  </label>
                  <div class="add-services-modal__field add-services-modal__field--price">
                    <span v-if="trophyDraftPrice(entry.draft)" class="add-services-modal__value">{{ trophyDraftPrice(entry.draft) }}</span>
                  </div>
                  <div class="add-services-modal__form-actions">
                    <button
                      type="button"
                      class="add-services-modal__save"
                      :disabled="!canSaveTrophyDraft(entry.draft)"
                      @click="saveTrophyDraft(entry.draft)"
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      class="add-services-modal__cancel"
                      :disabled="savingTrophyKey === entry.draft.key"
                      @click="cancelTrophyDraft(entry.draft.key)"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
                </template>
                </div>
                </div>
                </div>
              </section>

              <section
                v-if="isAllowed('penalty')"
                class="add-services-modal__block-row"
              >
                <div
                  v-if="blockPageCount.penalty > 1 && !isBlockCollapsed('penalty')"
                  class="add-services-modal__dots"
                  role="tablist"
                  aria-label="Страницы штрафов"
                >
                  <button
                    v-for="page in blockPageCount.penalty"
                    :key="page"
                    type="button"
                    class="add-services-modal__dot"
                    :class="{ 'add-services-modal__dot--active': page - 1 === blockPageIndex.penalty }"
                    :aria-label="`Страница ${page}`"
                    :aria-current="page - 1 === blockPageIndex.penalty ? 'true' : undefined"
                    @click="scrollBlockToPage('penalty', page - 1)"
                  />
                </div>
                <div
                  class="add-services-modal__block"
                  :class="{ 'add-services-modal__block--collapsed': isBlockCollapsed('penalty') }"
                >
                <div class="add-services-modal__block-head">
                  <h3 class="add-services-modal__block-title">Штрафы:</h3>
                  <div class="add-services-modal__block-actions">
                    <button
                      type="button"
                      class="add-services-modal__toggle"
                      :class="{ 'add-services-modal__toggle--open': !isBlockCollapsed('penalty') }"
                      :aria-expanded="!isBlockCollapsed('penalty')"
                      aria-label="Свернуть штрафы"
                      @click="toggleBlock('penalty')"
                    >
                      <svg class="add-services-modal__toggle-icon" viewBox="0 0 12 8" aria-hidden="true">
                        <path d="M1 2 6 6.5 11 2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </button>
                    <button
                      v-if="canAddServiceType('penalty')"
                      type="button"
                      class="add-services-modal__add"
                      aria-label="Добавить штраф"
                      :disabled="hasOpenDraft('penalty')"
                      @click="addPenaltyDraft"
                    >+</button>
                  </div>
                </div>
                <div v-show="!isBlockCollapsed('penalty')">
                <div class="add-services-modal__columns add-services-modal__form-row add-services-modal__form-row--penalty">
                  <span>Животное</span>
                  <span>Тип штрафа</span>
                  <span>Охотник</span>
                  <span>Общая сумма</span>
                  <span></span>
                </div>
                <div
                  class="add-services-modal__block-list"
                  :ref="blockListRef.penalty"
                  @scroll="onBlockListScroll('penalty')"
                >
                <template
                  v-for="entry in penaltyRowEntries"
                  :key="entry.key"
                >
                <div
                  v-if="entry.item"
                  class="add-services-modal__form-row add-services-modal__form-row--penalty"
                >
                  <div class="add-services-modal__field add-services-modal__field--animal">
                    <span class="add-services-modal__value">{{ entry.item.animal_title }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--type">
                    <span class="add-services-modal__value">{{ entry.item.type }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--hunter">
                    <span class="add-services-modal__value">{{ entry.item.hunter_name }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--price">
                    <span class="add-services-modal__value">{{ formatServicePrice(entry.item.price) }}</span>
                  </div>
                  <div class="add-services-modal__form-actions">
                    <button
                      v-if="canAddServiceType('penalty')"
                      type="button"
                      class="add-services-modal__edit"
                      aria-label="Редактировать штраф"
                      :disabled="hasOpenDraft('penalty') || deletingServiceId !== null"
                      @click="startPenaltyEdit(entry.item)"
                    >
                      <svg class="add-services-modal__edit-icon" viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M11.2 1.9a1.5 1.5 0 0 1 2.1 2.1L5.4 12.1 2.4 13l.9-3.1 7.9-8Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
                      </svg>
                    </button>
                    <button
                      v-if="canDeleteService('penalties', entry.item.id)"
                      type="button"
                      class="add-services-modal__delete"
                      :disabled="deletingServiceId !== null"
                      @click="requestServiceDeletion(entry.item.id, 'Вы уверены, что хотите удалить штраф?', 'penalties')"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
                <div
                  v-else-if="entry.draft"
                  class="add-services-modal__form-row add-services-modal__form-row--penalty add-services-modal__form-row--draft"
                  :data-service-draft="`penalty-${entry.draft.key}`"
                >
                  <div class="add-services-modal__field add-services-modal__field--animal">
                    <CommonSelectField
                      :model-value="entry.draft.animalId"
                      class="add-services-modal__select"
                      placeholder="Выберите животное"
                      filled-hover
                      no-margin
                      :options="penaltyAnimalOptions"
                      @update:model-value="onPenaltyAnimalChange(entry.draft, $event)"
                    />
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--type">
                    <CommonSelectField
                      v-model="entry.draft.penaltyId"
                      class="add-services-modal__select"
                      placeholder="Выберите тип штрафа"
                      filled-hover
                      no-margin
                      :disabled="!entry.draft.animalId"
                      :options="penaltyTypeOptions(entry.draft.animalId)"
                    />
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--hunter">
                    <CommonSelectField
                      v-model="entry.draft.hunterId"
                      class="add-services-modal__select"
                      placeholder="Выберите охотника"
                      filled-hover
                      no-margin
                      :options="hunterOptions"
                    />
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--price">
                    <span v-if="penaltyDraftPrice(entry.draft)" class="add-services-modal__value">{{ penaltyDraftPrice(entry.draft) }}</span>
                  </div>
                  <div class="add-services-modal__form-actions">
                    <button
                      type="button"
                      class="add-services-modal__save"
                      :disabled="!canSavePenaltyDraft(entry.draft)"
                      @click="savePenaltyDraft(entry.draft)"
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      class="add-services-modal__cancel"
                      :disabled="savingPenaltyKey === entry.draft.key"
                      @click="cancelPenaltyDraft(entry.draft.key)"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
                </template>
                </div>
                </div>
                </div>
              </section>

              <section
                v-if="isAllowed('preparation')"
                class="add-services-modal__block-row"
              >
                <div
                  v-if="blockPageCount.preparation > 1 && !isBlockCollapsed('preparation')"
                  class="add-services-modal__dots"
                  role="tablist"
                  aria-label="Страницы разделки"
                >
                  <button
                    v-for="page in blockPageCount.preparation"
                    :key="page"
                    type="button"
                    class="add-services-modal__dot"
                    :class="{ 'add-services-modal__dot--active': page - 1 === blockPageIndex.preparation }"
                    :aria-label="`Страница ${page}`"
                    :aria-current="page - 1 === blockPageIndex.preparation ? 'true' : undefined"
                    @click="scrollBlockToPage('preparation', page - 1)"
                  />
                </div>
                <div
                  class="add-services-modal__block"
                  :class="{ 'add-services-modal__block--collapsed': isBlockCollapsed('preparation') }"
                >
                <div class="add-services-modal__block-head">
                  <h3 class="add-services-modal__block-title">Разделка:</h3>
                  <div class="add-services-modal__block-actions">
                    <button
                      type="button"
                      class="add-services-modal__toggle"
                      :class="{ 'add-services-modal__toggle--open': !isBlockCollapsed('preparation') }"
                      :aria-expanded="!isBlockCollapsed('preparation')"
                      aria-label="Свернуть разделку"
                      @click="toggleBlock('preparation')"
                    >
                      <svg class="add-services-modal__toggle-icon" viewBox="0 0 12 8" aria-hidden="true">
                        <path d="M1 2 6 6.5 11 2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </button>
                    <button
                      v-if="canAddServiceType('preparation')"
                      type="button"
                      class="add-services-modal__add"
                      aria-label="Добавить разделку"
                      :disabled="hasOpenDraft('preparation')"
                      @click="addPreparationDraft"
                    >+</button>
                  </div>
                </div>
                <div v-show="!isBlockCollapsed('preparation')">
                <div class="add-services-modal__columns add-services-modal__form-row add-services-modal__form-row--preparation">
                  <span>Животное</span>
                  <span>Тип разделки</span>
                  <span class="add-services-modal__column-count">Количество</span>
                  <span>Цена на животное</span>
                  <span>Общая сумма</span>
                  <span></span>
                </div>
                <div
                  class="add-services-modal__block-list"
                  :ref="blockListRef.preparation"
                  @scroll="onBlockListScroll('preparation')"
                >
                <template
                  v-for="entry in preparationRowEntries"
                  :key="entry.key"
                >
                <div
                  v-if="entry.item"
                  class="add-services-modal__form-row add-services-modal__form-row--preparation"
                >
                  <div class="add-services-modal__field add-services-modal__field--animal">
                    <span class="add-services-modal__value">{{ entry.item.animal_title }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--type">
                    <span class="add-services-modal__value">{{ entry.item.type || '—' }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--count">
                    <span class="add-services-modal__value">{{ entry.item.count }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--unit-price">
                    <span class="add-services-modal__value">{{ preparationUnitPrice(entry.item.animal_id, entry.item.type) }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--price">
                    <span class="add-services-modal__value">{{ formatServicePrice(entry.item.price) }}</span>
                  </div>
                  <div class="add-services-modal__form-actions">
                    <button
                      v-if="canAddServiceType('preparation')"
                      type="button"
                      class="add-services-modal__edit"
                      aria-label="Редактировать разделку"
                      :disabled="hasOpenDraft('preparation') || deletingServiceId !== null"
                      @click="startPreparationEdit(entry.item)"
                    >
                      <svg class="add-services-modal__edit-icon" viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M11.2 1.9a1.5 1.5 0 0 1 2.1 2.1L5.4 12.1 2.4 13l.9-3.1 7.9-8Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
                      </svg>
                    </button>
                    <button
                      v-if="canDeleteService('preparations', entry.item.id)"
                      type="button"
                      class="add-services-modal__delete"
                      :disabled="deletingServiceId !== null"
                      @click="requestServiceDeletion(entry.item.id, 'Вы уверены, что хотите удалить разделку?', 'preparations')"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
                <div
                  v-else-if="entry.draft"
                  class="add-services-modal__form-row add-services-modal__form-row--preparation add-services-modal__form-row--draft"
                  :data-service-draft="`preparation-${entry.draft.key}`"
                >
                  <div class="add-services-modal__field add-services-modal__field--animal">
                    <CommonSelectField
                      :model-value="entry.draft.animalId"
                      class="add-services-modal__select"
                      placeholder="Выберите животное"
                      filled-hover
                      no-margin
                      :options="preparationAnimalOptions"
                      @update:model-value="onPreparationAnimalChange(entry.draft, $event)"
                    />
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--type">
                    <CommonSelectField
                      v-model="entry.draft.preparationId"
                      class="add-services-modal__select"
                      placeholder="Выберите тип разделки"
                      filled-hover
                      no-margin
                      :disabled="!entry.draft.animalId"
                      :options="preparationTypeOptions(entry.draft.animalId)"
                    />
                  </div>
                  <label class="add-services-modal__field add-services-modal__field--count">
                    <input
                      class="add-services-modal__control"
                      type="text"
                      inputmode="numeric"
                      autocomplete="off"
                      :value="entry.draft.count || ''"
                      @keydown="onFoodCountKeydown"
                      @beforeinput="onFoodCountBeforeInput"
                      @input="onFoodDraftCountInput(entry.draft, $event)"
                    >
                  </label>
                  <div class="add-services-modal__field add-services-modal__field--unit-price">
                    <span v-if="preparationDraftUnitPrice(entry.draft)" class="add-services-modal__value">{{ preparationDraftUnitPrice(entry.draft) }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--price">
                    <span v-if="preparationDraftPrice(entry.draft)" class="add-services-modal__value">{{ preparationDraftPrice(entry.draft) }}</span>
                  </div>
                  <div class="add-services-modal__form-actions">
                    <button
                      type="button"
                      class="add-services-modal__save"
                      :disabled="!canSavePreparationDraft(entry.draft)"
                      @click="savePreparationDraft(entry.draft)"
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      class="add-services-modal__cancel"
                      :disabled="savingPreparationKey === entry.draft.key"
                      @click="cancelPreparationDraft(entry.draft.key)"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
                </template>
                </div>
                </div>
                </div>
              </section>

              <section
                v-if="isAllowed('food')"
                class="add-services-modal__block-row"
              >
                <div
                  v-if="blockPageCount.food > 1 && !isBlockCollapsed('food')"
                  class="add-services-modal__dots"
                  role="tablist"
                  aria-label="Страницы питания"
                >
                  <button
                    v-for="page in blockPageCount.food"
                    :key="page"
                    type="button"
                    class="add-services-modal__dot"
                    :class="{ 'add-services-modal__dot--active': page - 1 === blockPageIndex.food }"
                    :aria-label="`Страница ${page}`"
                    :aria-current="page - 1 === blockPageIndex.food ? 'true' : undefined"
                    @click="scrollBlockToPage('food', page - 1)"
                  />
                </div>
                <div
                  class="add-services-modal__block"
                  :class="{ 'add-services-modal__block--collapsed': isBlockCollapsed('food') }"
                >
                <div class="add-services-modal__block-head">
                  <h3 class="add-services-modal__block-title">Питание:</h3>
                  <div class="add-services-modal__block-actions">
                    <button
                      type="button"
                      class="add-services-modal__toggle"
                      :class="{ 'add-services-modal__toggle--open': !isBlockCollapsed('food') }"
                      :aria-expanded="!isBlockCollapsed('food')"
                      aria-label="Свернуть питание"
                      @click="toggleBlock('food')"
                    >
                      <svg class="add-services-modal__toggle-icon" viewBox="0 0 12 8" aria-hidden="true">
                        <path d="M1 2 6 6.5 11 2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </button>
                    <button
                      v-if="canAddServiceType('food')"
                      type="button"
                      class="add-services-modal__add"
                      aria-label="Добавить питание"
                      :disabled="hasOpenDraft('food')"
                      @click="addFoodDraft"
                    >+</button>
                  </div>
                </div>
                <div v-show="!isBlockCollapsed('food')">
                <div class="add-services-modal__columns add-services-modal__form-row add-services-modal__form-row--food">
                  <span>Питание</span>
                  <span>Охотник</span>
                  <span class="add-services-modal__column-price">Цена</span>
                  <span class="add-services-modal__column-count">Кол-во раз</span>
                  <span>Общая сумма</span>
                  <span></span>
                </div>
                <div
                  class="add-services-modal__block-list"
                  :ref="blockListRef.food"
                  @scroll="onBlockListScroll('food')"
                >
                <template
                  v-for="entry in foodRowEntries"
                  :key="entry.key"
                >
                <div
                  v-if="entry.item"
                  class="add-services-modal__form-row add-services-modal__form-row--food"
                >
                  <div class="add-services-modal__field add-services-modal__field--animal">
                    <span class="add-services-modal__value">{{ entry.item.type || 'Питание' }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--hunter">
                    <span class="add-services-modal__value">{{ foodHunterLabel(entry.item) }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--unit-price">
                    <span class="add-services-modal__value">{{ foodSavedUnitPrice(entry.item) }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--count">
                    <span class="add-services-modal__value">{{ savedFoodCount(entry.item) }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--price">
                    <span class="add-services-modal__value">{{ savedFoodTotal(entry.item) }}</span>
                  </div>
                  <div class="add-services-modal__form-actions">
                    <button
                      v-if="canAddServiceType('food')"
                      type="button"
                      class="add-services-modal__edit"
                      aria-label="Редактировать питание"
                      :disabled="hasOpenDraft('food') || deletingServiceId !== null"
                      @click="startFoodEdit(entry.item)"
                    >
                      <svg class="add-services-modal__edit-icon" viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M11.2 1.9a1.5 1.5 0 0 1 2.1 2.1L5.4 12.1 2.4 13l.9-3.1 7.9-8Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
                      </svg>
                    </button>
                    <button
                      v-if="canDeleteService('foods', entry.item.id)"
                      type="button"
                      class="add-services-modal__delete"
                      :disabled="deletingServiceId !== null"
                      @click="requestFoodRowDeletion([entry.item])"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
                <div
                  v-else-if="entry.draft"
                  class="add-services-modal__form-row add-services-modal__form-row--food add-services-modal__form-row--draft"
                  :data-service-draft="`food-${entry.draft.key}`"
                >
                  <div class="add-services-modal__field add-services-modal__field--animal">
                    <CommonSelectField
                      :model-value="entry.draft.foodId"
                      class="add-services-modal__select"
                      placeholder="Питание"
                      empty-text="список пуст"
                      filled-hover
                      no-margin
                      :options="foodOptionsFor(entry.draft)"
                      @update:model-value="onFoodChange(entry.draft, $event)"
                    />
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--hunter">
                    <span
                      v-if="isPerPersonFood(entry.draft.foodId)"
                      class="add-services-modal__value"
                    >Разделено на всех</span>
                    <CommonSelectField
                      v-else
                      v-model="entry.draft.hunterId"
                      class="add-services-modal__select"
                      placeholder="Выберите охотника"
                      filled-hover
                      no-margin
                      :disabled="!entry.draft.foodId"
                      :options="foodHunterOptions(entry.draft)"
                    />
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--unit-price">
                    <span v-if="foodDraftUnitPrice(entry.draft)" class="add-services-modal__value">{{ foodDraftUnitPrice(entry.draft) }}</span>
                  </div>
                  <label class="add-services-modal__field add-services-modal__field--count">
                    <input
                      class="add-services-modal__control"
                      type="text"
                      inputmode="numeric"
                      autocomplete="off"
                      :value="entry.draft.count || ''"
                      @keydown="onFoodCountKeydown"
                      @beforeinput="onFoodCountBeforeInput"
                      @input="onFoodDraftCountInput(entry.draft, $event)"
                    >
                  </label>
                  <div class="add-services-modal__field add-services-modal__field--price">
                    <span v-if="foodDraftTotal(entry.draft)" class="add-services-modal__value">{{ foodDraftTotal(entry.draft) }}</span>
                  </div>
                  <div class="add-services-modal__form-actions">
                    <button
                      type="button"
                      class="add-services-modal__save"
                      :disabled="!canSaveFoodDraft(entry.draft)"
                      @click="saveFoodDraft(entry.draft)"
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      class="add-services-modal__cancel"
                      :disabled="savingFoodKey === entry.draft.key"
                      @click="cancelFoodDraft(entry.draft.key)"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
                </template>
                </div>
                </div>
                </div>
              </section>

              <section
                v-if="isAllowed('addetional')"
                class="add-services-modal__block-row"
              >
                <div
                  v-if="blockPageCount.addetional > 1 && !isBlockCollapsed('addetional')"
                  class="add-services-modal__dots"
                  role="tablist"
                  aria-label="Страницы дополнительных услуг"
                >
                  <button
                    v-for="page in blockPageCount.addetional"
                    :key="page"
                    type="button"
                    class="add-services-modal__dot"
                    :class="{ 'add-services-modal__dot--active': page - 1 === blockPageIndex.addetional }"
                    :aria-label="`Страница ${page}`"
                    :aria-current="page - 1 === blockPageIndex.addetional ? 'true' : undefined"
                    @click="scrollBlockToPage('addetional', page - 1)"
                  />
                </div>
                <div
                  class="add-services-modal__block"
                  :class="{ 'add-services-modal__block--collapsed': isBlockCollapsed('addetional') }"
                >
                <div class="add-services-modal__block-head">
                  <h3 class="add-services-modal__block-title">Дополнительные услуги:</h3>
                  <div class="add-services-modal__block-actions">
                    <button
                      type="button"
                      class="add-services-modal__toggle"
                      :class="{ 'add-services-modal__toggle--open': !isBlockCollapsed('addetional') }"
                      :aria-expanded="!isBlockCollapsed('addetional')"
                      aria-label="Свернуть другое"
                      @click="toggleBlock('addetional')"
                    >
                      <svg class="add-services-modal__toggle-icon" viewBox="0 0 12 8" aria-hidden="true">
                        <path d="M1 2 6 6.5 11 2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </button>
                    <button
                      v-if="canAddServiceType('addetional')"
                      type="button"
                      class="add-services-modal__add"
                      aria-label="Добавить другое"
                      :disabled="hasOpenDraft('addetional')"
                      @click="addAdditionalDraft"
                    >+</button>
                  </div>
                </div>
                <div v-show="!isBlockCollapsed('addetional')">
                <div class="add-services-modal__columns add-services-modal__form-row add-services-modal__form-row--additional">
                  <span>Название</span>
                  <span>Охотник</span>
                  <span class="add-services-modal__column-price">Цена</span>
                  <span class="add-services-modal__column-count">Количество</span>
                  <span class="add-services-modal__column-total">Общая сумма</span>
                  <span></span>
                </div>
                <div
                  class="add-services-modal__block-list"
                  :ref="blockListRef.addetional"
                  @scroll="onBlockListScroll('addetional')"
                >
                <template
                  v-for="entry in additionalRowEntries"
                  :key="entry.key"
                >
                <div
                  v-if="entry.item"
                  class="add-services-modal__form-row add-services-modal__form-row--additional"
                >
                  <div class="add-services-modal__field add-services-modal__field--name">
                    <span class="add-services-modal__value">{{ entry.item.type }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--hunter">
                    <span class="add-services-modal__value">{{ entry.item.calculation_type === 'per_person' ? 'Разделено на всех' : (entry.item.hunter_name || '—') }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--unit-price">
                    <span class="add-services-modal__value">{{ additionalSavedUnitPrice(entry.item) }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--count">
                    <span class="add-services-modal__value">{{ additionalSavedCount(entry.item) }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--price">
                    <span class="add-services-modal__value">{{ formatServicePrice(entry.item.price) }}</span>
                  </div>
                  <div class="add-services-modal__form-actions">
                    <button
                      v-if="canAddServiceType('addetional')"
                      type="button"
                      class="add-services-modal__edit"
                      aria-label="Редактировать услугу"
                      :disabled="hasOpenDraft('addetional') || deletingServiceId !== null"
                      @click="startAdditionalEdit(entry.item)"
                    >
                      <svg class="add-services-modal__edit-icon" viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M11.2 1.9a1.5 1.5 0 0 1 2.1 2.1L5.4 12.1 2.4 13l.9-3.1 7.9-8Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
                      </svg>
                    </button>
                    <button
                      v-if="canDeleteService('additionals', entry.item.id)"
                      type="button"
                      class="add-services-modal__delete"
                      :disabled="deletingServiceId !== null"
                      @click="requestServiceDeletion(entry.item.id, 'Вы уверены, что хотите удалить услугу?', 'additionals')"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
                <div
                  v-else-if="entry.draft"
                  class="add-services-modal__form-row add-services-modal__form-row--additional add-services-modal__form-row--draft"
                  :data-service-draft="`additional-${entry.draft.key}`"
                >
                  <div class="add-services-modal__field add-services-modal__field--name">
                    <CommonSelectField
                      :model-value="entry.draft.additionalId"
                      class="add-services-modal__select"
                      placeholder="Выберите услугу"
                      empty-text="список пуст"
                      filled-hover
                      no-margin
                      :options="additionalOptions"
                      @update:model-value="onAdditionalChange(entry.draft, $event)"
                    />
                  </div>
                  <p
                    v-if="showAdditionalStockWarning(entry.draft)"
                    class="add-services-modal__stock-empty"
                  >
                    <span>Недостаточное количество данной услуги на базе</span>
                    <button
                      type="button"
                      class="add-services-modal__stock-empty-close"
                      aria-label="Закрыть уведомление"
                      @click="dismissAdditionalStockWarning(entry.draft)"
                    >
                      <svg viewBox="0 0 12 12" aria-hidden="true">
                        <path d="M2.2 2.2 9.8 9.8M9.8 2.2 2.2 9.8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                      </svg>
                    </button>
                  </p>
                  <template v-else>
                    <div class="add-services-modal__field add-services-modal__field--hunter">
                      <span
                        v-if="isPerPersonAdditional(entry.draft.additionalId)"
                        class="add-services-modal__value"
                      >Разделено на всех</span>
                      <CommonSelectField
                        v-else
                        v-model="entry.draft.hunterId"
                        class="add-services-modal__select"
                        placeholder="Выберите охотника"
                        filled-hover
                        no-margin
                        :disabled="!entry.draft.additionalId"
                        :options="hunterOptions"
                      />
                    </div>
                    <div class="add-services-modal__field add-services-modal__field--unit-price">
                      <span v-if="additionalDraftPrice(entry.draft.additionalId)" class="add-services-modal__value">{{ additionalDraftUnitPrice(entry.draft) }}</span>
                    </div>
                    <label class="add-services-modal__field add-services-modal__field--count">
                      <input
                        class="add-services-modal__control"
                        type="text"
                        inputmode="numeric"
                        autocomplete="off"
                        :value="entry.draft.count || ''"
                        @keydown="onFoodCountKeydown"
                        @beforeinput="onFoodCountBeforeInput"
                        @input="onFoodDraftCountInput(entry.draft, $event)"
                      >
                    </label>
                    <div class="add-services-modal__field add-services-modal__field--price">
                      <span v-if="additionalDraftTotal(entry.draft)" class="add-services-modal__value">{{ additionalDraftTotal(entry.draft) }}</span>
                    </div>
                  </template>
                  <div class="add-services-modal__form-actions">
                    <button
                      v-if="!showAdditionalStockWarning(entry.draft)"
                      type="button"
                      class="add-services-modal__save"
                      :disabled="!canSaveAdditionalDraft(entry.draft)"
                      @click="saveAdditionalDraft(entry.draft)"
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      class="add-services-modal__cancel"
                      :disabled="savingAdditionalKey === entry.draft.key"
                      @click="cancelAdditionalDraft(entry.draft.key)"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
                </template>
                </div>
                </div>
                </div>
              </section>

              <section
                v-if="isAllowed('spending')"
                class="add-services-modal__block-row"
              >
                <div
                  v-if="blockPageCount.spending > 1 && !isBlockCollapsed('spending')"
                  class="add-services-modal__dots"
                  role="tablist"
                  aria-label="Страницы трат"
                >
                  <button
                    v-for="page in blockPageCount.spending"
                    :key="page"
                    type="button"
                    class="add-services-modal__dot"
                    :class="{ 'add-services-modal__dot--active': page - 1 === blockPageIndex.spending }"
                    :aria-label="`Страница ${page}`"
                    :aria-current="page - 1 === blockPageIndex.spending ? 'true' : undefined"
                    @click="scrollBlockToPage('spending', page - 1)"
                  />
                </div>
                <div
                  class="add-services-modal__block"
                  :class="{ 'add-services-modal__block--collapsed': isBlockCollapsed('spending') }"
                >
                <div class="add-services-modal__block-head">
                  <h3 class="add-services-modal__block-title">Личные затраты охотников:</h3>
                  <div class="add-services-modal__block-actions">
                    <button
                      type="button"
                      class="add-services-modal__toggle"
                      :class="{ 'add-services-modal__toggle--open': !isBlockCollapsed('spending') }"
                      :aria-expanded="!isBlockCollapsed('spending')"
                      aria-label="Свернуть траты охотников"
                      @click="toggleBlock('spending')"
                    >
                      <svg class="add-services-modal__toggle-icon" viewBox="0 0 12 8" aria-hidden="true">
                        <path d="M1 2 6 6.5 11 2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </button>
                    <button
                      v-if="canAddServiceType('spending')"
                      type="button"
                      class="add-services-modal__add"
                      aria-label="Добавить трату"
                      :disabled="hasOpenDraft('spending')"
                      @click="addSpendingDraft"
                    >+</button>
                  </div>
                </div>
                <div v-show="!isBlockCollapsed('spending')">
                <div class="add-services-modal__columns add-services-modal__form-row add-services-modal__form-row--spending">
                  <span>Кто платил</span>
                  <span>Внесенная сумма</span>
                  <span>Комментарий</span>
                  <span></span>
                </div>
                <div
                  class="add-services-modal__block-list"
                  :ref="blockListRef.spending"
                  @scroll="onBlockListScroll('spending')"
                >
                <template
                  v-for="entry in spendingRowEntries"
                  :key="entry.key"
                >
                <div
                  v-if="entry.item"
                  class="add-services-modal__form-row add-services-modal__form-row--spending"
                >
                  <div class="add-services-modal__field add-services-modal__field--hunter">
                    <span class="add-services-modal__value">{{ entry.item.hunter_name || '—' }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--count">
                    <span class="add-services-modal__value">{{ formatServicePrice(entry.item.price) }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--comment">
                    <span class="add-services-modal__value">{{ entry.item.comment }}</span>
                  </div>
                  <div class="add-services-modal__form-actions">
                    <button
                      v-if="canAddServiceType('spending')"
                      type="button"
                      class="add-services-modal__edit"
                      aria-label="Редактировать трату"
                      :disabled="hasOpenDraft('spending') || deletingServiceId !== null"
                      @click="startSpendingEdit(entry.item)"
                    >
                      <svg class="add-services-modal__edit-icon" viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M11.2 1.9a1.5 1.5 0 0 1 2.1 2.1L5.4 12.1 2.4 13l.9-3.1 7.9-8Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
                      </svg>
                    </button>
                    <button
                      v-if="canDeleteService('spendings', entry.item.id)"
                      type="button"
                      class="add-services-modal__delete"
                      :disabled="deletingServiceId !== null"
                      @click="requestServiceDeletion(entry.item.id, 'Вы уверены, что хотите удалить трату?', 'spendings')"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
                <div
                  v-else-if="entry.draft"
                  class="add-services-modal__form-row add-services-modal__form-row--spending add-services-modal__form-row--draft"
                  :data-service-draft="`spending-${entry.draft.key}`"
                >
                  <div class="add-services-modal__field add-services-modal__field--hunter">
                    <CommonSelectField
                      v-model="entry.draft.hunterId"
                      class="add-services-modal__select"
                      placeholder="Выберите охотника"
                      filled-hover
                      no-margin
                      :options="hunterOptions"
                    />
                  </div>
                  <label class="add-services-modal__field add-services-modal__field--count">
                    <input
                      class="add-services-modal__control"
                      type="text"
                      inputmode="numeric"
                      autocomplete="off"
                      placeholder="Внесенная сумма"
                      :value="entry.draft.price"
                      @keydown="onFoodCountKeydown"
                      @beforeinput="onFoodCountBeforeInput"
                      @input="onSpendingPriceInput(entry.draft, $event)"
                    >
                  </label>
                  <label class="add-services-modal__field add-services-modal__field--comment">
                    <input
                      v-model="entry.draft.comment"
                      class="add-services-modal__control"
                      type="text"
                      placeholder="Комментарий"
                    >
                  </label>
                  <div class="add-services-modal__form-actions">
                    <button
                      type="button"
                      class="add-services-modal__save"
                      :disabled="!canSaveSpendingDraft(entry.draft)"
                      @click="saveSpendingDraft(entry.draft)"
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      class="add-services-modal__cancel"
                      :disabled="savingSpendingKey === entry.draft.key"
                      @click="cancelSpendingDraft(entry.draft.key)"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
                </template>
                </div>
                </div>
                </div>
              </section>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.add-services-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  isolation: isolate;
}

.add-services-modal::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: rgba(17, 24, 39, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  pointer-events: none;
}

.add-services-modal__card {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(100%, 1560px);
  max-height: min(90vh, 860px);
  padding: 28px 28px 24px;
  overflow: hidden;
  border: 1px solid var(--wh-gray-200);
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.add-services-modal__toolbar {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 8px;
}

.add-services-modal__toolbar :deep(.modal-close-button) {
  position: static;
}

.add-services-modal__history {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 8px 14px;
  border: 1px solid var(--wh-green);
  border-radius: 8px;
  background: var(--wh-green);
  color: var(--wh-white);
  font-size: 0.88rem;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
}

.add-services-modal__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(120px, 1fr);
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  min-height: 36px;
  padding-right: 220px;
}

.add-services-modal__header--with-lock {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  column-gap: 20px;
  row-gap: 4px;
  padding-right: 220px;
}

.add-services-modal__header--with-timer {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  padding-right: 220px;
}

.add-services-modal__timer {
  margin: 0;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.35;
  color: var(--wh-orange-500);
}

.add-services-modal__timer-value {
  font-variant-numeric: tabular-nums;
}

.add-services-modal__header--with-lock .add-services-modal__title {
  flex: 0 1 auto;
  max-width: 100%;
}

.add-services-modal__locked {
  margin: -8px 0 16px;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.4;
  color: var(--wh-field-error, #dc2626);
}

.add-services-modal__header--with-lock .add-services-modal__locked {
  flex: 1 1 16rem;
  min-width: min(100%, 16rem);
  margin: 0;
}

.add-services-modal__title {
  margin: 0;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.35;
  color: var(--wh-gray-900);
}

.add-services-modal__estimate,
.add-services-modal__estimate-value {
  margin: 0;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.35;
  color: var(--wh-orange-500);
  white-space: nowrap;
}

.add-services-modal__estimate {
  text-align: center;
}

.add-services-modal__estimate-value {
  justify-self: start;
  min-width: 7.5rem;
  text-align: left;
}

.add-services-modal__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding-right: 4px;
}

.add-services-modal__loading {
  display: flex;
  justify-content: center;
  padding: 48px 16px;
}

.add-services-modal__empty {
  padding: 32px 16px;
  color: var(--wh-gray-600);
  text-align: center;
}

.add-services-modal__block-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding-left: 22px;
}

.add-services-modal__block-row:has(.add-services-modal__dots) {
  padding-left: 0;
}

.add-services-modal__block {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  padding: 14px 16px 16px;
  overflow: visible;
  border: 1px solid var(--wh-gray-200);
  border-radius: 8px;
  background: #f8f9fa;
}

.add-services-modal__block-list {
  max-height: 260px;
  margin-right: -12px;
  padding-right: 14px;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-gutter: stable;
}

.add-services-modal__dots {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 10px;
}

.add-services-modal__dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  padding: 0;
  border: 1px solid rgb(28 33 28 / 25%);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
}

.add-services-modal__dot--active {
  border-color: #e8883a;
  background: #e8883a;
}

.add-services-modal__block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.add-services-modal__block--collapsed .add-services-modal__block-head {
  margin-bottom: 0;
}

.add-services-modal__block-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.add-services-modal__block-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--wh-orange-500);
}

.add-services-modal__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--wh-gray-200);
  border-radius: 6px;
  background: var(--wh-white);
  color: var(--wh-gray-700);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.add-services-modal__toggle:hover {
  border-color: #4aa3d9;
  background: var(--wh-white);
  color: #4aa3d9;
}

.add-services-modal__toggle-icon {
  width: 12px;
  height: 8px;
  transition: transform 0.2s ease;
}

.add-services-modal__toggle--open .add-services-modal__toggle-icon {
  transform: rotate(180deg);
}

.add-services-modal__add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid #4aa3d9;
  border-radius: 6px;
  background: var(--wh-white);
  color: #4aa3d9;
  font-size: 1.15rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.add-services-modal__add:hover:not(:disabled) {
  background: #4aa3d9;
  color: var(--wh-white);
}

.add-services-modal__add:disabled {
  opacity: 0.4;
  cursor: default;
}

.add-services-modal__columns {
  display: grid;
  gap: 12px;
  color: var(--wh-gray-600);
  font-size: 0.82rem;
  font-weight: 500;
}

.add-services-modal__columns--2 {
  grid-template-columns: 1fr 1fr;
}

.add-services-modal__columns--3 {
  grid-template-columns: 1fr 1fr 1fr;
}

.add-services-modal__row {
  margin-top: 8px;
  color: var(--wh-gray-900);
  font-size: 0.88rem;
  font-weight: 500;
}

.add-services-modal__form-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
}

.add-services-modal__columns.add-services-modal__form-row {
  margin-top: 0;
  margin-right: -16px;
  margin-left: -16px;
  padding: 8px 16px;
  background: var(--wh-gray-450);
  color: var(--wh-gray-900);
  font-size: 14px;
  font-weight: 700;
}

.add-services-modal__form-row--extra-hunt {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 150px 220px;
}

.add-services-modal__form-row--extra-hunt .add-services-modal__field--animal,
.add-services-modal__form-row--extra-hunt .add-services-modal__field--hunter,
.add-services-modal__form-row--extra-hunt .add-services-modal__field--price {
  width: 100%;
  justify-self: stretch;
}

.add-services-modal__form-row--trophy {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) 120px 150px 220px;
}

.add-services-modal__form-row--trophy .add-services-modal__field--animal,
.add-services-modal__form-row--trophy .add-services-modal__field--hunter,
.add-services-modal__form-row--trophy .add-services-modal__field--count,
.add-services-modal__form-row--trophy .add-services-modal__field--price {
  width: 100%;
  justify-self: stretch;
}

.add-services-modal__form-row--trophy .add-services-modal__column-count,
.add-services-modal__form-row--preparation .add-services-modal__column-count {
  text-align: center;
}

.add-services-modal__form-row--trophy .add-services-modal__field--count .add-services-modal__value,
.add-services-modal__form-row--preparation .add-services-modal__field--count .add-services-modal__value {
  justify-content: center;
  width: 100%;
}

.add-services-modal__form-row--trophy .add-services-modal__field--count .add-services-modal__control,
.add-services-modal__form-row--preparation .add-services-modal__field--count .add-services-modal__control {
  text-align: center;
}

.add-services-modal__form-row--trophy .add-services-modal__form-actions,
.add-services-modal__form-row--extra-hunt .add-services-modal__form-actions,
.add-services-modal__form-row--penalty .add-services-modal__form-actions,
.add-services-modal__form-row--preparation .add-services-modal__form-actions,
.add-services-modal__form-row--food .add-services-modal__form-actions,
.add-services-modal__form-row--additional .add-services-modal__form-actions,
.add-services-modal__form-row--spending .add-services-modal__form-actions {
  width: 100%;
  justify-content: flex-end;
  justify-self: stretch;
}

.add-services-modal__form-row--penalty {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) 150px 220px;
}

.add-services-modal__form-row--penalty .add-services-modal__field--animal,
.add-services-modal__form-row--penalty .add-services-modal__field--price {
  width: 100%;
  justify-self: stretch;
}

.add-services-modal__form-row--preparation {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 110px 150px 140px 200px;
}

.add-services-modal__form-row--preparation .add-services-modal__field--animal,
.add-services-modal__form-row--preparation .add-services-modal__field--count,
.add-services-modal__form-row--preparation .add-services-modal__field--unit-price,
.add-services-modal__form-row--preparation .add-services-modal__field--price {
  width: 100%;
  justify-self: stretch;
}

.add-services-modal__form-row--food {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 150px 100px 150px 220px;
}

.add-services-modal__form-row--food .add-services-modal__field--animal,
.add-services-modal__form-row--food .add-services-modal__field--count,
.add-services-modal__form-row--food .add-services-modal__field--unit-price,
.add-services-modal__form-row--food .add-services-modal__field--price {
  width: 100%;
  justify-self: stretch;
}

.add-services-modal__form-row--food .add-services-modal__column-price,
.add-services-modal__form-row--food .add-services-modal__column-count {
  text-align: center;
}

.add-services-modal__form-row--food .add-services-modal__field--unit-price .add-services-modal__value,
.add-services-modal__form-row--food .add-services-modal__field--count .add-services-modal__value {
  justify-content: center;
  width: 100%;
}

.add-services-modal__form-row--additional {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 150px 110px 150px 220px;
}

.add-services-modal__form-row--additional .add-services-modal__field--unit-price,
.add-services-modal__form-row--additional .add-services-modal__field--price {
  width: 100%;
  justify-self: stretch;
}

.add-services-modal__form-row--additional .add-services-modal__column-price,
.add-services-modal__form-row--additional .add-services-modal__column-count,
.add-services-modal__form-row--additional .add-services-modal__column-total {
  text-align: center;
}

.add-services-modal__form-row--additional .add-services-modal__field--unit-price .add-services-modal__value,
.add-services-modal__form-row--additional .add-services-modal__field--count .add-services-modal__value,
.add-services-modal__form-row--additional .add-services-modal__field--price .add-services-modal__value {
  justify-content: center;
  width: 100%;
}

.add-services-modal__stock-empty {
  display: flex;
  grid-column: 2 / 6;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0;
  align-self: center;
  text-align: center;
  color: #dc3545;
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.3;
}

.add-services-modal__stock-empty-close {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: #dc3545;
  cursor: pointer;
}

.add-services-modal__stock-empty-close svg {
  width: 12px;
  height: 12px;
}

.add-services-modal__stock-empty-close:hover {
  background: rgba(220, 53, 69, 0.1);
}

.add-services-modal__form-row--additional .add-services-modal__field--count {
  width: 100%;
  justify-self: stretch;
}

.add-services-modal__form-row--spending {
  grid-template-columns: minmax(0, 1fr) 170px minmax(0, 1.4fr) 220px;
}

.add-services-modal__form-row--spending .add-services-modal__field--count {
  width: 100%;
  justify-self: stretch;
}

.add-services-modal__field--comment {
  width: 100%;
  min-width: 0;
}

.add-services-modal__field--name,
.add-services-modal__field--hunter,
.add-services-modal__field--type {
  width: 100%;
  position: relative;
  z-index: 5;
}

.add-services-modal__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.add-services-modal__field--animal {
  width: 240px;
  justify-self: start;
  position: relative;
  z-index: 5;
}

.add-services-modal__field--count {
  width: 120px;
  justify-self: center;
}

.add-services-modal__field--price {
  width: 150px;
  justify-self: start;
}

.add-services-modal__select :deep(.select-field__trigger) {
  min-height: 38px;
  height: 38px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 0.88rem;
}

.add-services-modal__select :deep(.select-field__value) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.add-services-modal__select :deep(.select-field__list) {
  font-size: 0.88rem;
}

.add-services-modal__value {
  display: flex;
  align-items: center;
  min-height: 38px;
  color: var(--wh-gray-900);
  font-size: 0.88rem;
  font-weight: 500;
}

.add-services-modal__control {
  width: 100%;
  height: 38px;
  padding: 0 12px;
  border: 1px solid var(--wh-gray-200);
  border-radius: 8px;
  background: var(--wh-white);
  color: var(--wh-gray-900);
  font-size: 0.88rem;
  line-height: 1.2;
}

.add-services-modal__control:focus {
  outline: none;
  border-color: var(--wh-field-border-active, #4aa3d9);
  box-shadow: 0 0 0 3px rgba(74, 163, 217, 0.16);
}

.add-services-modal__form-actions {
  display: flex;
  align-items: center;
  justify-self: end;
  gap: 12px;
  min-height: 38px;
}

.add-services-modal__save {
  height: 38px;
  padding: 0 16px;
  border: none;
  border-radius: 8px;
  background: var(--wh-green);
  color: var(--wh-white);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}

.add-services-modal__save:hover:not(:disabled) {
  background: var(--wh-green);
}

.add-services-modal__save:disabled,
.add-services-modal__cancel:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.add-services-modal__cancel {
  padding: 0;
  border: none;
  background: none;
  color: var(--wh-gray-600);
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
}

.add-services-modal__cancel:hover:not(:disabled) {
  color: var(--wh-orange-500);
}

.add-services-modal__edit {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  padding: 0;
  border: 1px solid var(--wh-gray-200);
  border-radius: 8px;
  background: var(--wh-white);
  color: var(--wh-gray-600);
  cursor: pointer;
}

.add-services-modal__edit:hover:not(:disabled) {
  border-color: var(--wh-orange-500);
  color: var(--wh-orange-500);
}

.add-services-modal__edit:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.add-services-modal__edit-icon {
  width: 16px;
  height: 16px;
}

.add-services-modal__delete {
  height: 38px;
  padding: 0 16px;
  border: none;
  border-radius: 8px;
  background: #dc3545;
  color: var(--wh-white);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}

.add-services-modal__delete:hover:not(:disabled) {
  background: #c82333;
}

.add-services-modal__delete:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.add-services-modal-enter-active,
.add-services-modal-leave-active {
  transition: visibility 0.2s linear;
}

.add-services-modal-enter-from,
.add-services-modal-leave-to {
  visibility: visible;
}

.add-services-modal-enter-from .add-services-modal__card,
.add-services-modal-leave-to .add-services-modal__card {
  opacity: 0;
  transform: translateY(8px);
}

@media (--wh-tablet) {
  .add-services-modal__card {
    padding: 22px 18px 18px;
  }

  .add-services-modal__header {
    display: block;
    padding-right: 0;
    text-align: left;
  }

  .add-services-modal__header--with-timer {
    padding-right: 0;
  }

  .add-services-modal__timer {
    margin-bottom: 8px;
  }

  .add-services-modal__title {
    margin-bottom: 8px;
    padding-right: 220px;
  }

  .add-services-modal__estimate,
  .add-services-modal__estimate-value {
    display: inline;
    font-size: 0.82rem;
    line-height: 1.3;
    white-space: normal;
  }

  .add-services-modal__estimate::after {
    content: ' ';
  }

  .add-services-modal__estimate-value {
    min-width: 0;
    white-space: nowrap;
  }

  .add-services-modal__columns.add-services-modal__form-row {
    display: none;
  }

  .add-services-modal__columns--2,
  .add-services-modal__columns--3 {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .add-services-modal__form-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .add-services-modal__stock-empty {
    grid-column: auto;
  }

  .add-services-modal__field::before {
    color: var(--wh-gray-600);
    font-size: 0.82rem;
    font-weight: 500;
    line-height: 1.2;
  }

  .add-services-modal__form-row--draft.add-services-modal__form-row--extra-hunt .add-services-modal__field--animal::before,
  .add-services-modal__form-row--draft.add-services-modal__form-row--trophy .add-services-modal__field--animal::before,
  .add-services-modal__form-row--draft.add-services-modal__form-row--penalty .add-services-modal__field--animal::before,
  .add-services-modal__form-row--draft.add-services-modal__form-row--preparation .add-services-modal__field--animal::before {
    content: 'Животное';
  }

  .add-services-modal__form-row--draft.add-services-modal__form-row--trophy .add-services-modal__field--type::before {
    content: 'Тип трофея';
  }

  .add-services-modal__form-row--draft.add-services-modal__form-row--trophy .add-services-modal__field--hunter::before {
    content: 'Кто охотился';
  }

  .add-services-modal__form-row--draft.add-services-modal__form-row--trophy .add-services-modal__field--count::before,
  .add-services-modal__form-row--draft.add-services-modal__form-row--preparation .add-services-modal__field--count::before {
    content: 'Количество';
  }

  .add-services-modal__form-row--draft.add-services-modal__form-row--extra-hunt .add-services-modal__field--price::before,
  .add-services-modal__form-row--draft.add-services-modal__form-row--trophy .add-services-modal__field--price::before,
  .add-services-modal__form-row--draft.add-services-modal__form-row--penalty .add-services-modal__field--price::before,
  .add-services-modal__form-row--draft.add-services-modal__form-row--preparation .add-services-modal__field--price::before,
  .add-services-modal__form-row--draft.add-services-modal__form-row--food .add-services-modal__field--price::before,
  .add-services-modal__form-row--draft.add-services-modal__form-row--additional .add-services-modal__field--price::before {
    content: 'Общая сумма';
  }

  .add-services-modal__form-row--draft.add-services-modal__form-row--penalty .add-services-modal__field--type::before {
    content: 'Тип штрафа';
  }

  .add-services-modal__form-row--draft.add-services-modal__form-row--extra-hunt .add-services-modal__field--hunter::before {
    content: 'Кто охотится';
  }

  .add-services-modal__form-row--draft.add-services-modal__form-row--penalty .add-services-modal__field--hunter::before,
  .add-services-modal__form-row--draft.add-services-modal__form-row--food .add-services-modal__field--hunter::before,
  .add-services-modal__form-row--draft.add-services-modal__form-row--additional .add-services-modal__field--hunter::before {
    content: 'Охотник';
  }

  .add-services-modal__form-row--draft.add-services-modal__form-row--preparation .add-services-modal__field--type::before {
    content: 'Тип разделки';
  }

  .add-services-modal__form-row--draft.add-services-modal__form-row--preparation .add-services-modal__field--unit-price::before {
    content: 'Цена на животное';
  }

  .add-services-modal__form-row--draft.add-services-modal__form-row--food .add-services-modal__field--animal::before {
    content: 'Питание';
  }

  .add-services-modal__form-row--draft.add-services-modal__form-row--food .add-services-modal__field--unit-price::before {
    content: 'Цена';
  }

  .add-services-modal__form-row--draft.add-services-modal__form-row--additional .add-services-modal__field--unit-price::before {
    content: 'Цена';
  }

  .add-services-modal__form-row--draft.add-services-modal__form-row--additional .add-services-modal__field--count::before {
    content: 'Количество';
  }

  .add-services-modal__form-row--draft.add-services-modal__form-row--food .add-services-modal__field--count::before {
    content: 'Кол-во раз';
  }

  .add-services-modal__form-row--draft.add-services-modal__form-row--additional .add-services-modal__field--name::before {
    content: 'Название';
  }

  .add-services-modal__form-row--draft.add-services-modal__form-row--spending .add-services-modal__field--hunter::before {
    content: 'Кто платил';
  }

  .add-services-modal__form-row--draft.add-services-modal__form-row--spending .add-services-modal__field--count::before {
    content: 'Внесенная сумма';
  }

  .add-services-modal__form-row--draft.add-services-modal__form-row--spending .add-services-modal__field--comment::before {
    content: 'Комментарий';
  }

  .add-services-modal__field--animal,
  .add-services-modal__field--count,
  .add-services-modal__field--price,
  .add-services-modal__field--unit-price,
  .add-services-modal__field--name,
  .add-services-modal__field--hunter,
  .add-services-modal__field--comment,
  .add-services-modal__field--type {
    width: 100%;
    justify-self: stretch;
  }

  .add-services-modal__form-actions {
    justify-self: start;
  }
}
</style>
