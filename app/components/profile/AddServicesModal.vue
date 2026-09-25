<script setup lang="ts">
import type {
  BookingServiceAdditionalItem,
  BookingServiceAnimalCatalog,
  BookingServiceFoodItem,
  BookingServiceOption,
  BookingServicePenaltyItem,
  BookingServicePreparationItem,
  BookingServiceSpendingItem,
  BookingServiceTrophyItem,
  BookingServiceType,
  BookingServicesData,
  BookingServicesItems,
} from '~/types/api'
import type { SelectFieldOption } from '~/components/common/SelectField.vue'
import { formatHotelPriceLabel } from '~/utils/hotel'

interface PreparationDraft {
  key: number
  animalId: string
  count: number
}

interface FoodDraft {
  key: number
  count: number
}

interface AdditionalDraft {
  key: number
  additionalId: string
  hunterId: string
  hunterIds: string[]
  count: number
}

interface SpendingDraft {
  key: number
  hunterId: string
  price: string
  comment: string
}

interface TrophyDraft {
  key: number
  animalId: string
  trophyId: string
  count: number
}

interface PenaltyDraft {
  key: number
  animalId: string
  penaltyId: string
  hunterId: string
}

type DeletableServiceList = 'trophies' | 'penalties' | 'preparations' | 'foods' | 'additionals' | 'spendings'
type ServiceBlockId = 'trophy' | 'penalty' | 'preparation' | 'food' | 'addetional' | 'spending'

const ADD_SERVICES_NOTIFICATION_GROUP = 'add-services'

const EMPTY_ITEMS: BookingServicesItems = {
  trophies: [],
  penalties: [],
  preparations: [],
  foods: [],
  additionals: [],
  spendings: [],
}

const { isOpen, booking, close } = useAddServicesModal()
const { open: openConfirmModal } = useConfirmModal()
const { bookings } = useApi()
const notifications = useNotifications()
const notifyOptions = { group: ADD_SERVICES_NOTIFICATION_GROUP }

const isLoading = ref(false)
const loadError = ref('')
const services = ref<BookingServicesData | null>(null)
const preparationDrafts = ref<PreparationDraft[]>([])
const foodDrafts = ref<FoodDraft[]>([])
const additionalDrafts = ref<AdditionalDraft[]>([])
const spendingDrafts = ref<SpendingDraft[]>([])
const trophyDrafts = ref<TrophyDraft[]>([])
const penaltyDrafts = ref<PenaltyDraft[]>([])
const savingPreparationKey = ref<number | null>(null)
const savingFoodKey = ref<number | null>(null)
const savingAdditionalKey = ref<number | null>(null)
const savingSpendingKey = ref<number | null>(null)
const savingTrophyKey = ref<number | null>(null)
const savingPenaltyKey = ref<number | null>(null)
const deletingServiceId = ref<number | null>(null)
const collapsedBlocks = ref(new Set<ServiceBlockId>())

let loadRequestId = 0
let preparationDraftKey = 0
let foodDraftKey = 0
let additionalDraftKey = 0
let spendingDraftKey = 0
let trophyDraftKey = 0
let penaltyDraftKey = 0

useBodyScrollLock(isOpen)

const allowedTypeSet = computed(() => new Set(services.value?.allowed_types ?? []))
const items = computed(() => ({
  ...EMPTY_ITEMS,
  ...services.value?.items,
}))
const preparationAnimals = computed(() => services.value?.catalogs?.preparation_animals ?? [])
const preparationAnimalOptions = computed<SelectFieldOption[]>(() =>
  preparationAnimals.value.map(animal => withCatalogPrice(
    animal.title,
    animal.preparations?.[0]?.price,
    String(animal.id),
  )),
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
  trophyAnimals.value.map(animal => withCatalogPrice(
    animal.title,
    animalListPrice(animal, animal.trophies),
    String(animal.id),
  )),
)
const penaltyAnimals = computed(() => services.value?.catalogs?.penalty_animals ?? [])
const penaltyAnimalOptions = computed<SelectFieldOption[]>(() =>
  penaltyAnimals.value.map(animal => withCatalogPrice(
    animal.title,
    animalListPrice(animal, animal.fines),
    String(animal.id),
  )),
)

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

function isAllowed(type: BookingServiceType): boolean {
  return allowedTypeSet.value.has(type)
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

function resetServices() {
  loadRequestId += 1
  isLoading.value = false
  loadError.value = ''
  services.value = null
  preparationDrafts.value = []
  foodDrafts.value = []
  additionalDrafts.value = []
  spendingDrafts.value = []
  trophyDrafts.value = []
  penaltyDrafts.value = []
  savingPreparationKey.value = null
  savingFoodKey.value = null
  savingAdditionalKey.value = null
  savingSpendingKey.value = null
  savingTrophyKey.value = null
  savingPenaltyKey.value = null
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

function preparationUnitPrice(animalId: number | string | null | undefined): string {
  if (animalId == null || animalId === '') {
    return ''
  }

  const animal = preparationAnimals.value.find(item => String(item.id) === String(animalId))
  return catalogPriceLabel(animal?.preparations?.[0]?.price) ?? ''
}

function preparationDraftPrice(row: PreparationDraft): string {
  const animal = preparationAnimals.value.find(item => String(item.id) === row.animalId)
  return draftLinePrice(animal?.preparations?.[0]?.price, row.count)
}

function foodUnitPriceLabel(): string {
  return catalogPriceLabel(services.value?.catalogs?.food?.price) ?? ''
}

function foodDraftPrice(row: FoodDraft): string {
  return draftLinePrice(services.value?.catalogs?.food?.price, row.count)
}

function formatServicePrice(price: unknown): string {
  return catalogPriceLabel(price) ?? '—'
}

function animalListPrice(
  animal: BookingServiceAnimalCatalog,
  options: BookingServiceOption[] | undefined,
): unknown {
  if (animal.price != null) {
    return animal.price
  }

  const prices = (options ?? [])
    .map(item => item.price)
    .filter((price): price is number => price != null)

  if (prices.length === 0) {
    return undefined
  }

  const first = prices[0]
  if (prices.every(price => price === first)) {
    return first
  }

  return undefined
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
  expandBlock('trophy')
  trophyDrafts.value.push({
    key: ++trophyDraftKey,
    animalId: '',
    trophyId: '',
    count: 1,
  })
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
  return Boolean(row.animalId && row.trophyId)
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
      trophies: next,
    },
  }
}

async function saveTrophyDraft(row: TrophyDraft) {
  const code = booking.value?.code
  const animalId = Number(row.animalId)
  const trophyId = Number(row.trophyId)
  const count = Number(row.count)
  const type = trophyTypeById(row.animalId, row.trophyId)

  if (!code || !canSaveTrophyDraft(row) || !type) {
    return
  }

  savingTrophyKey.value = row.key

  try {
    const response = await bookings.storeTrophy(code, {
      animal_id: animalId,
      trophy_id: trophyId,
      type,
      count,
    })

    if (!response.success || !response.data) {
      notifications.error(response.message || 'Не удалось добавить трофей', notifyOptions)
      return
    }

    upsertTrophyItem(response.data)
    removeTrophyDraft(row.key)
    notifications.success(response.message || 'Услуга добавлена', notifyOptions)
  }
  catch (error) {
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || 'Не удалось добавить трофей', notifyOptions)
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
  expandBlock('penalty')
  penaltyDrafts.value.push({
    key: ++penaltyDraftKey,
    animalId: '',
    penaltyId: '',
    hunterId: '',
  })
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
      penalties: next,
    },
  }
}

async function savePenaltyDraft(row: PenaltyDraft) {
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
    const response = await bookings.storePenalty(code, {
      animal_id: animalId,
      penalty_id: penaltyId,
      type,
      hunter_id: hunterId,
    })

    if (!response.success || !response.data) {
      notifications.error(response.message || 'Не удалось добавить штраф', notifyOptions)
      return
    }

    upsertPenaltyItem(response.data)
    removePenaltyDraft(row.key)
    notifications.success(response.message || 'Услуга добавлена', notifyOptions)
  }
  catch (error) {
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || 'Не удалось добавить штраф', notifyOptions)
  }
  finally {
    savingPenaltyKey.value = null
  }
}

function addSpendingDraft() {
  expandBlock('spending')
  spendingDrafts.value.push({
    key: ++spendingDraftKey,
    hunterId: '',
    price: '',
    comment: '',
  })
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
  const code = booking.value?.code
  const hunterId = Number(row.hunterId)
  const price = parseSpendingPrice(row.price)
  const comment = row.comment.trim()

  if (!code || price === null || !canSaveSpendingDraft(row)) {
    return
  }

  savingSpendingKey.value = row.key

  try {
    const response = await bookings.storeSpending(code, {
      hunter_id: hunterId,
      price,
      comment,
    })

    if (!response.success || !response.data) {
      notifications.error(response.message || 'Не удалось добавить трату', notifyOptions)
      return
    }

    upsertSpendingItem(response.data)
    removeSpendingDraft(row.key)
    notifications.success(response.message || 'Услуга добавлена', notifyOptions)
  }
  catch (error) {
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || 'Не удалось добавить трату', notifyOptions)
  }
  finally {
    savingSpendingKey.value = null
  }
}

function addAdditionalDraft() {
  expandBlock('addetional')
  additionalDrafts.value.push({
    key: ++additionalDraftKey,
    additionalId: '',
    hunterId: '',
    hunterIds: [],
    count: 1,
  })
}

function removeAdditionalDraft(key: number) {
  additionalDrafts.value = additionalDrafts.value.filter(row => row.key !== key)
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

function isIndividualAdditional(additionalId: string): boolean {
  return additionalById(additionalId)?.calculation_type === 'individual'
}

function isPerPersonAdditional(additionalId: string): boolean {
  return additionalById(additionalId)?.calculation_type === 'per_person'
}

function onAdditionalChange(row: AdditionalDraft, additionalId: string | string[]) {
  row.additionalId = Array.isArray(additionalId) ? additionalId[0] ?? '' : additionalId
  row.hunterId = ''
  row.hunterIds = []
}

function additionalNameById(additionalId: number): string {
  return additionalOptions.value.find(item => item.value === String(additionalId))?.label ?? ''
}

function additionalDraftPrice(additionalId: string): string {
  return catalogPriceLabel(additionalById(additionalId)?.price) ?? ''
}

function additionalHunterCount(): number {
  const fromCatalog = services.value?.catalogs?.hunters?.length ?? 0
  if (fromCatalog > 0) {
    return fromCatalog
  }

  return booking.value?.hunt?.hunters ?? 0
}

function additionalSharePrice(price: unknown, calculationType: string | null | undefined): string {
  const total = catalogUnitPrice(price)
  if (total == null) {
    return ''
  }

  if (calculationType !== 'per_person') {
    return formatHotelPriceLabel(total)
  }

  const people = additionalHunterCount()
  if (people < 1) {
    return ''
  }

  return formatHotelPriceLabel(Math.round(total / people))
}

function canSaveAdditionalDraft(row: AdditionalDraft): boolean {
  const hasHunter = isIndividualAdditional(row.additionalId)
    ? row.hunterIds.length > 0
    : isPerPersonAdditional(row.additionalId)
      ? true
      : Boolean(row.hunterId)

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
      additionals: next,
    },
  }
}

async function saveAdditionalDraft(row: AdditionalDraft) {
  const code = booking.value?.code
  const additionalId = Number(row.additionalId)
  const count = Number(row.count)
  const individual = isIndividualAdditional(row.additionalId)
  const perPerson = isPerPersonAdditional(row.additionalId)
  const hunterIds = (individual ? row.hunterIds : perPerson ? [] : [row.hunterId])
    .map(Number)
    .filter(id => Number.isInteger(id) && id > 0)

  if (!code || !canSaveAdditionalDraft(row) || (!perPerson && hunterIds.length === 0)) {
    return
  }

  const name = additionalNameById(additionalId)
  if (!name) {
    notifications.error('Выберите услугу', notifyOptions)
    return
  }

  savingAdditionalKey.value = row.key

  try {
    const targets = perPerson ? [] : hunterIds
    const pending = [...targets]

    for (const hunterId of perPerson ? [null] : targets) {
      const response = await bookings.storeAdditional(code, {
        additional_id: additionalId,
        name,
        count,
        ...(hunterId === null ? {} : { hunter_id: hunterId }),
      })

      if (!response.success || !response.data) {
        notifications.error(response.message || 'Не удалось добавить услугу', notifyOptions)
        if (individual) {
          row.hunterIds = pending.map(String)
        }
        return
      }

      upsertAdditionalItem(response.data)
      pending.shift()
    }

    removeAdditionalDraft(row.key)
    notifications.success('Услуга добавлена', notifyOptions)
  }
  catch (error) {
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || 'Не удалось добавить услугу', notifyOptions)
  }
  finally {
    savingAdditionalKey.value = null
  }
}

function addFoodDraft() {
  expandBlock('food')
  foodDrafts.value.push({
    key: ++foodDraftKey,
    count: 1,
  })
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
      foods: next,
    },
  }
}

async function saveFoodDraft(row: FoodDraft) {
  const code = booking.value?.code
  const count = Number(row.count)

  if (!code || savingFoodKey.value !== null) {
    return
  }

  if (!Number.isInteger(count) || count < 1) {
    notifications.error('Укажите количество', notifyOptions)
    return
  }

  savingFoodKey.value = row.key

  try {
    const response = await bookings.storeFood(code, { count })

    if (!response.success || !response.data) {
      notifications.error(response.message || 'Не удалось добавить питание', notifyOptions)
      return
    }

    upsertFoodItem(response.data)
    removeFoodDraft(row.key)
    notifications.success(response.message || 'Услуга добавлена', notifyOptions)
  }
  catch (error) {
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || 'Не удалось добавить питание', notifyOptions)
  }
  finally {
    savingFoodKey.value = null
  }
}

function addPreparationDraft() {
  expandBlock('preparation')
  preparationDrafts.value.push({
    key: ++preparationDraftKey,
    animalId: '',
    count: 1,
  })
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

function preparationIdForAnimal(animalId: number): number | null {
  const animal = preparationAnimals.value.find(item => item.id === animalId)
  return animal?.preparations?.[0]?.id ?? null
}

function upsertPreparationItem(item: BookingServicePreparationItem) {
  if (!services.value) {
    return
  }

  const current = services.value.items.preparations ?? []
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
      preparations: next,
    },
  }
}

function removeServiceItem(serviceId: number, list: DeletableServiceList) {
  if (!services.value) {
    return
  }

  services.value = {
    ...services.value,
    items: {
      ...services.value.items,
      [list]: (services.value.items[list] ?? []).filter(item => item.id !== serviceId),
    },
  }
}

function requestServiceDeletion(serviceId: number, title: string, list: DeletableServiceList) {
  if (deletingServiceId.value !== null) {
    return
  }

  openConfirmModal({
    title,
    confirmLabel: 'Удалить',
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

  const preparationId = preparationIdForAnimal(animalId)
  if (!preparationId) {
    notifications.error('Для выбранного животного нет разделки', notifyOptions)
    return
  }

  savingPreparationKey.value = row.key

  try {
    const response = await bookings.storePreparation(code, {
      animal_id: animalId,
      preparation_id: preparationId,
      count,
    })

    if (!response.success || !response.data) {
      notifications.error(response.message || 'Не удалось добавить разделку', notifyOptions)
      return
    }

    upsertPreparationItem(response.data)
    removePreparationDraft(row.key)
    notifications.success(response.message || 'Услуга добавлена', notifyOptions)
  }
  catch (error) {
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || 'Не удалось добавить разделку', notifyOptions)
  }
  finally {
    savingPreparationKey.value = null
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
  spendingDrafts.value = []
  trophyDrafts.value = []
  penaltyDrafts.value = []
  savingPreparationKey.value = null
  savingFoodKey.value = null
  savingAdditionalKey.value = null
  savingSpendingKey.value = null
  savingTrophyKey.value = null
  savingPenaltyKey.value = null
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
          <CommonModalCloseButton @click="close" />

          <h2 id="add-services-modal-title" class="add-services-modal__title">
            Добавить услуги для брони #{{ booking.number }}
          </h2>

          <div class="add-services-modal__body">
            <div v-if="isLoading" class="add-services-modal__loading">
              <CommonSpinner size="md" label="Загрузка услуг" />
            </div>

            <div v-else-if="loadError" class="add-services-modal__empty">
              {{ loadError }}
            </div>

            <template v-else>
              <section
                v-if="isAllowed('trophy')"
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
                      type="button"
                      class="add-services-modal__add"
                      aria-label="Добавить трофей"
                      @click="addTrophyDraft"
                    >+</button>
                  </div>
                </div>
                <div v-show="!isBlockCollapsed('trophy')">
                <div class="add-services-modal__columns add-services-modal__form-row add-services-modal__form-row--trophy">
                  <span>Животное</span>
                  <span>Тип</span>
                  <span>Количество</span>
                  <span>Общая сумма</span>
                  <span></span>
                </div>
                <div class="add-services-modal__block-list">
                <div
                  v-for="item in items.trophies"
                  :key="item.id"
                  class="add-services-modal__form-row add-services-modal__form-row--trophy"
                >
                  <div class="add-services-modal__field add-services-modal__field--animal">
                    <span class="add-services-modal__value">{{ item.animal_title }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--type">
                    <span class="add-services-modal__value">{{ item.type }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--count">
                    <span class="add-services-modal__value">{{ item.count }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--price">
                    <span class="add-services-modal__value">{{ formatServicePrice(item.price) }}</span>
                  </div>
                  <div class="add-services-modal__form-actions">
                    <button
                      type="button"
                      class="add-services-modal__delete"
                      :disabled="deletingServiceId !== null"
                      @click="requestServiceDeletion(item.id, 'Вы уверены, что хотите удалить трофей?', 'trophies')"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
                <div
                  v-for="row in trophyDrafts"
                  :key="row.key"
                  class="add-services-modal__form-row add-services-modal__form-row--trophy"
                >
                  <div class="add-services-modal__field add-services-modal__field--animal">
                    <CommonSelectField
                      :model-value="row.animalId"
                      class="add-services-modal__select"
                      placeholder="Животное"
                      filled-hover
                      no-margin
                      :options="trophyAnimalOptions"
                      @update:model-value="onTrophyAnimalChange(row, $event)"
                    />
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--type">
                    <CommonSelectField
                      v-model="row.trophyId"
                      class="add-services-modal__select"
                      placeholder="Тип"
                      filled-hover
                      no-margin
                      :disabled="!row.animalId"
                      :options="trophyTypeOptions(row.animalId)"
                    />
                  </div>
                  <label class="add-services-modal__field add-services-modal__field--count">
                    <input
                      v-model.number="row.count"
                      class="add-services-modal__control"
                      type="number"
                      min="1"
                      step="1"
                    >
                  </label>
                  <div class="add-services-modal__field add-services-modal__field--price">
                    <span v-if="trophyDraftPrice(row)" class="add-services-modal__value">{{ trophyDraftPrice(row) }}</span>
                  </div>
                  <div class="add-services-modal__form-actions">
                    <button
                      type="button"
                      class="add-services-modal__save"
                      :disabled="!canSaveTrophyDraft(row)"
                      @click="saveTrophyDraft(row)"
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      class="add-services-modal__cancel"
                      :disabled="savingTrophyKey === row.key"
                      @click="cancelTrophyDraft(row.key)"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
                </div>
                </div>
              </section>

              <section
                v-if="isAllowed('penalty')"
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
                      type="button"
                      class="add-services-modal__add"
                      aria-label="Добавить штраф"
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
                <div class="add-services-modal__block-list">
                <div
                  v-for="item in items.penalties"
                  :key="item.id"
                  class="add-services-modal__form-row add-services-modal__form-row--penalty"
                >
                  <div class="add-services-modal__field add-services-modal__field--animal">
                    <span class="add-services-modal__value">{{ item.animal_title }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--type">
                    <span class="add-services-modal__value">{{ item.type }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--hunter">
                    <span class="add-services-modal__value">{{ item.hunter_name }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--price">
                    <span class="add-services-modal__value">{{ formatServicePrice(item.price) }}</span>
                  </div>
                  <div class="add-services-modal__form-actions">
                    <button
                      type="button"
                      class="add-services-modal__delete"
                      :disabled="deletingServiceId !== null"
                      @click="requestServiceDeletion(item.id, 'Вы уверены, что хотите удалить штраф?', 'penalties')"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
                <div
                  v-for="row in penaltyDrafts"
                  :key="row.key"
                  class="add-services-modal__form-row add-services-modal__form-row--penalty"
                >
                  <div class="add-services-modal__field add-services-modal__field--animal">
                    <CommonSelectField
                      :model-value="row.animalId"
                      class="add-services-modal__select"
                      placeholder="Выберите животное"
                      filled-hover
                      no-margin
                      :options="penaltyAnimalOptions"
                      @update:model-value="onPenaltyAnimalChange(row, $event)"
                    />
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--type">
                    <CommonSelectField
                      v-model="row.penaltyId"
                      class="add-services-modal__select"
                      placeholder="Выберите тип штрафа"
                      filled-hover
                      no-margin
                      :disabled="!row.animalId"
                      :options="penaltyTypeOptions(row.animalId)"
                    />
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--hunter">
                    <CommonSelectField
                      v-model="row.hunterId"
                      class="add-services-modal__select"
                      placeholder="Выберите охотника"
                      filled-hover
                      no-margin
                      :options="hunterOptions"
                    />
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--price">
                    <span v-if="penaltyDraftPrice(row)" class="add-services-modal__value">{{ penaltyDraftPrice(row) }}</span>
                  </div>
                  <div class="add-services-modal__form-actions">
                    <button
                      type="button"
                      class="add-services-modal__save"
                      :disabled="!canSavePenaltyDraft(row)"
                      @click="savePenaltyDraft(row)"
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      class="add-services-modal__cancel"
                      :disabled="savingPenaltyKey === row.key"
                      @click="cancelPenaltyDraft(row.key)"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
                </div>
                </div>
              </section>

              <section
                v-if="isAllowed('preparation')"
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
                      type="button"
                      class="add-services-modal__add"
                      aria-label="Добавить разделку"
                      @click="addPreparationDraft"
                    >+</button>
                  </div>
                </div>
                <div v-show="!isBlockCollapsed('preparation')">
                <div class="add-services-modal__columns add-services-modal__form-row add-services-modal__form-row--preparation">
                  <span>Животное</span>
                  <span>Количество</span>
                  <span>Цена на животное</span>
                  <span>Общая сумма</span>
                  <span></span>
                </div>
                <div class="add-services-modal__block-list">
                <div
                  v-for="item in items.preparations"
                  :key="item.id"
                  class="add-services-modal__form-row add-services-modal__form-row--preparation"
                >
                  <div class="add-services-modal__field add-services-modal__field--animal">
                    <span class="add-services-modal__value">{{ item.animal_title }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--count">
                    <span class="add-services-modal__value">{{ item.count }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--unit-price">
                    <span class="add-services-modal__value">{{ preparationUnitPrice(item.animal_id) }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--price">
                    <span class="add-services-modal__value">{{ formatServicePrice(item.price) }}</span>
                  </div>
                  <div class="add-services-modal__form-actions">
                    <button
                      type="button"
                      class="add-services-modal__delete"
                      :disabled="deletingServiceId !== null"
                      @click="requestServiceDeletion(item.id, 'Вы уверены, что хотите удалить разделку?', 'preparations')"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
                <div
                  v-for="row in preparationDrafts"
                  :key="row.key"
                  class="add-services-modal__form-row add-services-modal__form-row--preparation"
                >
                  <div class="add-services-modal__field add-services-modal__field--animal">
                    <CommonSelectField
                      v-model="row.animalId"
                      class="add-services-modal__select"
                      placeholder="Выберите животное"
                      filled-hover
                      no-margin
                      :options="preparationAnimalOptions"
                    />
                  </div>
                  <label class="add-services-modal__field add-services-modal__field--count">
                    <input
                      v-model.number="row.count"
                      class="add-services-modal__control"
                      type="number"
                      min="1"
                      step="1"
                    >
                  </label>
                  <div class="add-services-modal__field add-services-modal__field--unit-price">
                    <span v-if="preparationUnitPrice(row.animalId)" class="add-services-modal__value">{{ preparationUnitPrice(row.animalId) }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--price">
                    <span v-if="preparationDraftPrice(row)" class="add-services-modal__value">{{ preparationDraftPrice(row) }}</span>
                  </div>
                  <div class="add-services-modal__form-actions">
                    <button
                      type="button"
                      class="add-services-modal__save"
                      :disabled="!row.animalId || savingPreparationKey !== null"
                      @click="savePreparationDraft(row)"
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      class="add-services-modal__cancel"
                      :disabled="savingPreparationKey === row.key"
                      @click="cancelPreparationDraft(row.key)"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
                </div>
                </div>
              </section>

              <section
                v-if="isAllowed('food')"
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
                      type="button"
                      class="add-services-modal__add"
                      aria-label="Добавить питание"
                      @click="addFoodDraft"
                    >+</button>
                  </div>
                </div>
                <div v-show="!isBlockCollapsed('food')">
                <div class="add-services-modal__columns add-services-modal__form-row add-services-modal__form-row--food">
                  <span>Питание</span>
                  <span>Количество чел</span>
                  <span>Цена на человека</span>
                  <span>Общая сумма</span>
                  <span></span>
                </div>
                <div class="add-services-modal__block-list">
                <div
                  v-for="item in items.foods"
                  :key="item.id"
                  class="add-services-modal__form-row add-services-modal__form-row--food"
                >
                  <div class="add-services-modal__field add-services-modal__field--animal">
                    <span class="add-services-modal__value">{{ item.type || 'Питание' }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--count">
                    <span class="add-services-modal__value">{{ item.count }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--unit-price">
                    <span class="add-services-modal__value">{{ foodUnitPriceLabel() }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--price">
                    <span class="add-services-modal__value">{{ formatServicePrice(item.price) }}</span>
                  </div>
                  <div class="add-services-modal__form-actions">
                    <button
                      type="button"
                      class="add-services-modal__delete"
                      :disabled="deletingServiceId !== null"
                      @click="requestServiceDeletion(item.id, 'Вы уверены, что хотите удалить питание?', 'foods')"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
                <div
                  v-for="row in foodDrafts"
                  :key="row.key"
                  class="add-services-modal__form-row add-services-modal__form-row--food"
                >
                  <div class="add-services-modal__field add-services-modal__field--animal">
                    <span class="add-services-modal__value">Питание</span>
                  </div>
                  <label class="add-services-modal__field add-services-modal__field--count">
                    <input
                      v-model.number="row.count"
                      class="add-services-modal__control"
                      type="number"
                      min="1"
                      step="1"
                    >
                  </label>
                  <div class="add-services-modal__field add-services-modal__field--unit-price">
                    <span v-if="foodUnitPriceLabel()" class="add-services-modal__value">{{ foodUnitPriceLabel() }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--price">
                    <span v-if="foodDraftPrice(row)" class="add-services-modal__value">{{ foodDraftPrice(row) }}</span>
                  </div>
                  <div class="add-services-modal__form-actions">
                    <button
                      type="button"
                      class="add-services-modal__save"
                      :disabled="savingFoodKey !== null || !row.count || row.count < 1"
                      @click="saveFoodDraft(row)"
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      class="add-services-modal__cancel"
                      :disabled="savingFoodKey === row.key"
                      @click="cancelFoodDraft(row.key)"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
                </div>
                </div>
              </section>

              <section
                v-if="isAllowed('addetional')"
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
                      type="button"
                      class="add-services-modal__add"
                      aria-label="Добавить другое"
                      @click="addAdditionalDraft"
                    >+</button>
                  </div>
                </div>
                <div v-show="!isBlockCollapsed('addetional')">
                <div class="add-services-modal__columns add-services-modal__form-row add-services-modal__form-row--additional">
                  <span>Название</span>
                  <!-- <span>Количество</span> -->
                  <span>Охотник</span>
                  <span>Цена на человека</span>
                  <span>Общая сумма</span>
                  <span></span>
                </div>
                <div class="add-services-modal__block-list">
                <div
                  v-for="item in items.additionals"
                  :key="item.id"
                  class="add-services-modal__form-row add-services-modal__form-row--additional"
                >
                  <div class="add-services-modal__field add-services-modal__field--name">
                    <span class="add-services-modal__value">{{ item.type }}</span>
                  </div>
                  <!-- <div class="add-services-modal__field add-services-modal__field--count">
                    <span class="add-services-modal__value">{{ item.count }}</span>
                  </div> -->
                  <div class="add-services-modal__field add-services-modal__field--hunter">
                    <span class="add-services-modal__value">{{ item.calculation_type === 'per_person' ? 'Разделено на всех' : (item.hunter_name || '—') }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--unit-price">
                    <span class="add-services-modal__value">{{ additionalSharePrice(item.price, item.calculation_type) }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--price">
                    <span class="add-services-modal__value">{{ formatServicePrice(item.price) }}</span>
                  </div>
                  <div class="add-services-modal__form-actions">
                    <button
                      type="button"
                      class="add-services-modal__delete"
                      :disabled="deletingServiceId !== null"
                      @click="requestServiceDeletion(item.id, 'Вы уверены, что хотите удалить услугу?', 'additionals')"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
                <div
                  v-for="row in additionalDrafts"
                  :key="row.key"
                  class="add-services-modal__form-row add-services-modal__form-row--additional"
                >
                  <div class="add-services-modal__field add-services-modal__field--name">
                    <CommonSelectField
                      :model-value="row.additionalId"
                      class="add-services-modal__select"
                      placeholder="Выберите услугу"
                      empty-text="список пуст"
                      filled-hover
                      no-margin
                      :options="additionalOptions"
                      @update:model-value="onAdditionalChange(row, $event)"
                    />
                  </div>
                  <!-- <label class="add-services-modal__field add-services-modal__field--count">
                    <input
                      v-model.number="row.count"
                      class="add-services-modal__control"
                      type="number"
                      min="1"
                      step="1"
                    >
                  </label> -->
                  <div class="add-services-modal__field add-services-modal__field--hunter">
                    <CommonSelectField
                      v-if="isIndividualAdditional(row.additionalId)"
                      v-model="row.hunterIds"
                      class="add-services-modal__select"
                      placeholder="Выберите охотников"
                      filled-hover
                      multiple
                      no-margin
                      :options="hunterOptions"
                    />
                    <span
                      v-else-if="isPerPersonAdditional(row.additionalId)"
                      class="add-services-modal__value"
                    >Разделено на всех</span>
                    <CommonSelectField
                      v-else
                      v-model="row.hunterId"
                      class="add-services-modal__select"
                      placeholder="Выберите охотника"
                      filled-hover
                      no-margin
                      :options="hunterOptions"
                    />
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--unit-price">
                    <span v-if="additionalDraftPrice(row.additionalId)" class="add-services-modal__value">{{ additionalSharePrice(additionalById(row.additionalId)?.price, additionalById(row.additionalId)?.calculation_type) }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--price">
                    <span v-if="additionalDraftPrice(row.additionalId)" class="add-services-modal__value">{{ additionalDraftPrice(row.additionalId) }}</span>
                  </div>
                  <div class="add-services-modal__form-actions">
                    <button
                      type="button"
                      class="add-services-modal__save"
                      :disabled="!canSaveAdditionalDraft(row)"
                      @click="saveAdditionalDraft(row)"
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      class="add-services-modal__cancel"
                      :disabled="savingAdditionalKey === row.key"
                      @click="cancelAdditionalDraft(row.key)"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
                </div>
                </div>
              </section>

              <section
                v-if="isAllowed('spending')"
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
                      type="button"
                      class="add-services-modal__add"
                      aria-label="Добавить трату"
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
                <div class="add-services-modal__block-list">
                <div
                  v-for="item in items.spendings"
                  :key="item.id"
                  class="add-services-modal__form-row add-services-modal__form-row--spending"
                >
                  <div class="add-services-modal__field add-services-modal__field--hunter">
                    <span class="add-services-modal__value">{{ item.hunter_name || '—' }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--count">
                    <span class="add-services-modal__value">{{ item.price }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--comment">
                    <span class="add-services-modal__value">{{ item.comment }}</span>
                  </div>
                  <div class="add-services-modal__form-actions">
                    <button
                      type="button"
                      class="add-services-modal__delete"
                      :disabled="deletingServiceId !== null"
                      @click="requestServiceDeletion(item.id, 'Вы уверены, что хотите удалить трату?', 'spendings')"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
                <div
                  v-for="row in spendingDrafts"
                  :key="row.key"
                  class="add-services-modal__form-row add-services-modal__form-row--spending"
                >
                  <div class="add-services-modal__field add-services-modal__field--hunter">
                    <CommonSelectField
                      v-model="row.hunterId"
                      class="add-services-modal__select"
                      placeholder="Выберите охотника"
                      filled-hover
                      no-margin
                      :options="hunterOptions"
                    />
                  </div>
                  <label class="add-services-modal__field add-services-modal__field--count">
                    <input
                      v-model="row.price"
                      class="add-services-modal__control"
                      type="text"
                      inputmode="decimal"
                      placeholder="Внесенная сумма"
                    >
                  </label>
                  <label class="add-services-modal__field add-services-modal__field--comment">
                    <input
                      v-model="row.comment"
                      class="add-services-modal__control"
                      type="text"
                      placeholder="Комментарий"
                    >
                  </label>
                  <div class="add-services-modal__form-actions">
                    <button
                      type="button"
                      class="add-services-modal__save"
                      :disabled="!canSaveSpendingDraft(row)"
                      @click="saveSpendingDraft(row)"
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      class="add-services-modal__cancel"
                      :disabled="savingSpendingKey === row.key"
                      @click="cancelSpendingDraft(row.key)"
                    >
                      Отмена
                    </button>
                  </div>
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
  width: min(100%, 1200px);
  max-height: min(90vh, 860px);
  padding: 28px 28px 24px;
  overflow: hidden;
  border: 1px solid var(--wh-gray-200);
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.add-services-modal__title {
  margin: 0 40px 24px 0;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.35;
  color: var(--wh-gray-900);
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

.add-services-modal__block {
  display: flex;
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
  overflow-x: hidden;
  overflow-y: auto;
}

.add-services-modal__card:has(.select-field--open),
.add-services-modal__body:has(.select-field--open),
.add-services-modal__block-list:has(.select-field--open) {
  overflow: visible;
}

.add-services-modal__block:has(.select-field--open) {
  position: relative;
  z-index: 10;
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
  color: var(--wh-gray-900);
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

.add-services-modal__add:hover {
  background: #4aa3d9;
  color: var(--wh-white);
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
}

.add-services-modal__form-row--trophy {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 120px 150px 220px;
}

.add-services-modal__form-row--trophy .add-services-modal__field--animal,
.add-services-modal__form-row--trophy .add-services-modal__field--count,
.add-services-modal__form-row--trophy .add-services-modal__field--price {
  width: 100%;
  justify-self: stretch;
}

.add-services-modal__form-row--trophy .add-services-modal__form-actions,
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
  grid-template-columns: minmax(0, 1fr) 120px 180px 150px 220px;
}

.add-services-modal__form-row--preparation .add-services-modal__field--animal,
.add-services-modal__form-row--preparation .add-services-modal__field--count,
.add-services-modal__form-row--preparation .add-services-modal__field--unit-price,
.add-services-modal__form-row--preparation .add-services-modal__field--price {
  width: 100%;
  justify-self: stretch;
}

.add-services-modal__form-row--food {
  grid-template-columns: minmax(0, 1fr) 140px 170px 140px 220px;
}

.add-services-modal__form-row--food .add-services-modal__field--animal,
.add-services-modal__form-row--food .add-services-modal__field--count,
.add-services-modal__form-row--food .add-services-modal__field--unit-price,
.add-services-modal__form-row--food .add-services-modal__field--price {
  width: 100%;
  justify-self: stretch;
}

.add-services-modal__form-row--additional {
  /* grid-template-columns: minmax(0, 1fr) 120px minmax(0, 1fr) 220px; */
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 150px 150px 220px;
}

.add-services-modal__form-row--additional .add-services-modal__field--unit-price,
.add-services-modal__form-row--additional .add-services-modal__field--price {
  width: 100%;
  justify-self: stretch;
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
