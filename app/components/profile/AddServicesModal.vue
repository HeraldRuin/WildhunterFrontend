<script setup lang="ts">
import type {
  BookingServiceFoodItem,
  BookingServicePreparationItem,
  BookingServiceType,
  BookingServicesData,
  BookingServicesItems,
} from '~/types/api'
import type { SelectFieldOption } from '~/components/common/SelectField.vue'

interface PreparationDraft {
  key: number
  animalId: string
  count: number
}

interface FoodDraft {
  key: number
  count: number
}

const ADD_SERVICES_NOTIFICATION_GROUP = 'add-services'

const EMPTY_ITEMS: BookingServicesItems = {
  trophies: [],
  penalties: [],
  preparations: [],
  foods: [],
  additionals: [],
  spendings: [],
}

const EXTRA_SERVICE_TYPES: BookingServiceType[] = ['preparation', 'food', 'addetional']

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
const savingPreparationKey = ref<number | null>(null)
const savingFoodKey = ref<number | null>(null)
const deletingPreparationId = ref<number | null>(null)

let loadRequestId = 0
let preparationDraftKey = 0
let foodDraftKey = 0

useBodyScrollLock(isOpen)

const allowedTypeSet = computed(() => new Set(services.value?.allowed_types ?? []))
const items = computed(() => ({
  ...EMPTY_ITEMS,
  ...services.value?.items,
}))
const showExtraGroup = computed(() =>
  EXTRA_SERVICE_TYPES.some(type => allowedTypeSet.value.has(type)),
)
const preparationAnimals = computed(() => services.value?.catalogs?.preparation_animals ?? [])
const preparationAnimalOptions = computed<SelectFieldOption[]>(() =>
  preparationAnimals.value.map(animal => ({
    value: String(animal.id),
    label: animal.title,
  })),
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

function resetServices() {
  loadRequestId += 1
  isLoading.value = false
  loadError.value = ''
  services.value = null
  preparationDrafts.value = []
  foodDrafts.value = []
  savingPreparationKey.value = null
  savingFoodKey.value = null
  deletingPreparationId.value = null
}

function addFoodDraft() {
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
    notifications.error('Укажите количество', 'Ошибка', notifyOptions)
    return
  }

  savingFoodKey.value = row.key

  try {
    const response = await bookings.storeFood(code, { count })

    if (!response.success || !response.data) {
      notifications.error(response.message || 'Не удалось добавить питание', 'Ошибка', notifyOptions)
      return
    }

    upsertFoodItem(response.data)
    removeFoodDraft(row.key)
    notifications.success(response.message || 'Услуга добавлена', 'Успех', notifyOptions)
  }
  catch (error) {
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || 'Не удалось добавить питание', 'Ошибка', notifyOptions)
  }
  finally {
    savingFoodKey.value = null
  }
}

function addPreparationDraft() {
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

function removePreparationItem(serviceId: number) {
  if (!services.value) {
    return
  }

  services.value = {
    ...services.value,
    items: {
      ...services.value.items,
      preparations: (services.value.items.preparations ?? []).filter(item => item.id !== serviceId),
    },
  }
}

function requestPreparationDeletion(item: BookingServicePreparationItem) {
  if (deletingPreparationId.value !== null) {
    return
  }

  openConfirmModal({
    title: 'Вы уверены, что хотите удалить разделку?',
    confirmLabel: 'Удалить',
    onConfirm: () => deletePreparation(item.id),
  })
}

async function deletePreparation(serviceId: number) {
  const code = booking.value?.code

  if (!code || deletingPreparationId.value !== null) {
    return
  }

  deletingPreparationId.value = serviceId

  try {
    const response = await bookings.deleteService(code, serviceId)

    if (!response.success) {
      notifications.error(response.message || 'Не удалось удалить разделку', 'Ошибка', notifyOptions)
      throw new Error('delete_preparation_failed')
    }

    removePreparationItem(serviceId)
    notifications.success(response.message || 'Услуга удалена', 'Успех', notifyOptions)
  }
  catch (error) {
    if ((error as Error).message !== 'delete_preparation_failed') {
      const data = (error as { data?: { message?: string } }).data
      notifications.error(data?.message || 'Не удалось удалить разделку', 'Ошибка', notifyOptions)
    }

    throw error
  }
  finally {
    deletingPreparationId.value = null
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
    notifications.error('Выберите животное', 'Ошибка', notifyOptions)
    return
  }

  if (!Number.isInteger(count) || count < 1) {
    notifications.error('Укажите количество', 'Ошибка', notifyOptions)
    return
  }

  const preparationId = preparationIdForAnimal(animalId)
  if (!preparationId) {
    notifications.error('Для выбранного животного нет разделки', 'Ошибка', notifyOptions)
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
      notifications.error(response.message || 'Не удалось добавить разделку', 'Ошибка', notifyOptions)
      return
    }

    upsertPreparationItem(response.data)
    removePreparationDraft(row.key)
    notifications.success(response.message || 'Услуга добавлена', 'Успех', notifyOptions)
  }
  catch (error) {
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || 'Не удалось добавить разделку', 'Ошибка', notifyOptions)
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
  savingPreparationKey.value = null
  savingFoodKey.value = null
  deletingPreparationId.value = null

  try {
    const response = await bookings.services(code)

    if (requestId !== loadRequestId) {
      return
    }

    if (!response.success || !response.data) {
      loadError.value = response.message || 'Не удалось загрузить услуги'
      notifications.error(loadError.value, 'Ошибка', notifyOptions)
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
    notifications.error(loadError.value, 'Ошибка', notifyOptions)
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
              <section v-if="isAllowed('trophy')" class="add-services-modal__block">
                <div class="add-services-modal__block-head">
                  <h3 class="add-services-modal__block-title">Трофеи:</h3>
                  <button type="button" class="add-services-modal__add" aria-label="Добавить трофей">+</button>
                </div>
                <div class="add-services-modal__columns add-services-modal__columns--3">
                  <span>Животное</span>
                  <span>Тип</span>
                  <span>Количество</span>
                </div>
                <div
                  v-for="item in items.trophies"
                  :key="item.id"
                  class="add-services-modal__row add-services-modal__columns add-services-modal__columns--3"
                >
                  <span>{{ item.animal_title }}</span>
                  <span>{{ item.type }}</span>
                  <span>{{ item.count }}</span>
                </div>
              </section>

              <section v-if="isAllowed('penalty')" class="add-services-modal__block">
                <div class="add-services-modal__block-head">
                  <h3 class="add-services-modal__block-title">Штрафы:</h3>
                  <button type="button" class="add-services-modal__add" aria-label="Добавить штраф">+</button>
                </div>
                <div class="add-services-modal__columns add-services-modal__columns--3">
                  <span>Животное</span>
                  <span>Тип штрафа</span>
                  <span>Охотник</span>
                </div>
                <div
                  v-for="item in items.penalties"
                  :key="item.id"
                  class="add-services-modal__row add-services-modal__columns add-services-modal__columns--3"
                >
                  <span>{{ item.animal_title }}</span>
                  <span>{{ item.type }}</span>
                  <span>{{ item.hunter_name }}</span>
                </div>
              </section>

              <h3 v-if="showExtraGroup" class="add-services-modal__group-title">Доп. услуги:</h3>

              <section v-if="isAllowed('preparation')" class="add-services-modal__block">
                <div class="add-services-modal__block-head">
                  <h3 class="add-services-modal__block-title">Разделка:</h3>
                  <button
                    type="button"
                    class="add-services-modal__add"
                    aria-label="Добавить разделку"
                    @click="addPreparationDraft"
                  >+</button>
                </div>
                <div
                  v-for="item in items.preparations"
                  :key="item.id"
                  class="add-services-modal__form-row"
                >
                  <div class="add-services-modal__field add-services-modal__field--animal">
                    <span class="add-services-modal__field-label">Животное</span>
                    <span class="add-services-modal__value">{{ item.animal_title }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--count">
                    <span class="add-services-modal__field-label">Количество</span>
                    <span class="add-services-modal__value">{{ item.count }}</span>
                  </div>
                  <div class="add-services-modal__form-actions">
                    <button
                      type="button"
                      class="add-services-modal__delete"
                      :disabled="deletingPreparationId !== null"
                      @click="requestPreparationDeletion(item)"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
                <div
                  v-for="row in preparationDrafts"
                  :key="row.key"
                  class="add-services-modal__form-row"
                >
                  <div class="add-services-modal__field add-services-modal__field--animal">
                    <span class="add-services-modal__field-label">Животное</span>
                    <CommonSelectField
                      v-model="row.animalId"
                      class="add-services-modal__select"
                      placeholder="Выберите животное"
                      no-margin
                      :options="preparationAnimalOptions"
                    />
                  </div>
                  <label class="add-services-modal__field add-services-modal__field--count">
                    <span class="add-services-modal__field-label">Количество</span>
                    <input
                      v-model.number="row.count"
                      class="add-services-modal__control"
                      type="number"
                      min="1"
                      step="1"
                    >
                  </label>
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
              </section>

              <section v-if="isAllowed('food')" class="add-services-modal__block">
                <div class="add-services-modal__block-head">
                  <h3 class="add-services-modal__block-title">Питание:</h3>
                  <button
                    type="button"
                    class="add-services-modal__add"
                    aria-label="Добавить питание"
                    @click="addFoodDraft"
                  >+</button>
                </div>
                <div
                  v-for="item in items.foods"
                  :key="item.id"
                  class="add-services-modal__form-row"
                >
                  <div class="add-services-modal__field add-services-modal__field--animal">
                    <span class="add-services-modal__field-label">Питание</span>
                    <span class="add-services-modal__value">{{ item.type || 'Питание' }}</span>
                  </div>
                  <div class="add-services-modal__field add-services-modal__field--count">
                    <span class="add-services-modal__field-label">Количество чел</span>
                    <span class="add-services-modal__value">{{ item.count }}</span>
                  </div>
                  <div class="add-services-modal__form-actions" aria-hidden="true" />
                </div>
                <div
                  v-for="row in foodDrafts"
                  :key="row.key"
                  class="add-services-modal__form-row"
                >
                  <div class="add-services-modal__field add-services-modal__field--animal">
                    <span class="add-services-modal__field-label">Питание</span>
                    <span class="add-services-modal__value">Питание</span>
                  </div>
                  <label class="add-services-modal__field add-services-modal__field--count">
                    <span class="add-services-modal__field-label">Количество чел</span>
                    <input
                      v-model.number="row.count"
                      class="add-services-modal__control"
                      type="number"
                      min="1"
                      step="1"
                    >
                  </label>
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
              </section>

              <section v-if="isAllowed('addetional')" class="add-services-modal__block">
                <div class="add-services-modal__block-head">
                  <h3 class="add-services-modal__block-title">Другое:</h3>
                  <button type="button" class="add-services-modal__add" aria-label="Добавить другое">+</button>
                </div>
                <div class="add-services-modal__columns add-services-modal__columns--3">
                  <span>Название</span>
                  <span>Количество</span>
                  <span>Охотник</span>
                </div>
                <div
                  v-for="item in items.additionals"
                  :key="item.id"
                  class="add-services-modal__row add-services-modal__columns add-services-modal__columns--3"
                >
                  <span>{{ item.type }}</span>
                  <span>{{ item.count }}</span>
                  <span>{{ item.hunter_name || '—' }}</span>
                </div>
              </section>

              <section v-if="isAllowed('spending')" class="add-services-modal__block">
                <div class="add-services-modal__block-head">
                  <h3 class="add-services-modal__block-title">Траты охотников:</h3>
                  <button type="button" class="add-services-modal__add" aria-label="Добавить трату">+</button>
                </div>
                <div class="add-services-modal__columns add-services-modal__columns--3">
                  <span>Охотник</span>
                  <span>Сумма</span>
                  <span>Комментарий</span>
                </div>
                <div
                  v-for="item in items.spendings"
                  :key="item.id"
                  class="add-services-modal__row add-services-modal__columns add-services-modal__columns--3"
                >
                  <span>{{ item.hunter_name || '—' }}</span>
                  <span>{{ item.price }}</span>
                  <span>{{ item.comment }}</span>
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
  width: min(100%, 980px);
  max-height: min(90vh, 860px);
  padding: 28px 28px 24px;
  overflow: visible;
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
  flex-direction: column;
  gap: 14px;
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

.add-services-modal__group-title {
  margin: 4px 0 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--wh-gray-900);
}

.add-services-modal__block {
  padding: 14px 16px 16px;
  border: 1px solid var(--wh-gray-200);
  border-radius: 8px;
  background: #f8f9fa;
}

.add-services-modal__block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.add-services-modal__block-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--wh-gray-900);
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
  align-items: flex-end;
  gap: 12px;
  margin-top: 10px;
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

.add-services-modal__select :deep(.select-field__trigger) {
  min-height: 38px;
  height: 38px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 0.88rem;
}

.add-services-modal__select :deep(.select-field__list) {
  font-size: 0.88rem;
}

.add-services-modal__field-label {
  color: var(--wh-gray-600);
  font-size: 0.75rem;
  font-weight: 500;
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
  background: #22c55e;
  color: var(--wh-white);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}

.add-services-modal__save:hover:not(:disabled) {
  background: #16a34a;
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
  color: var(--wh-gray-900);
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
  .add-services-modal__field--count {
    width: 100%;
    justify-self: stretch;
  }

  .add-services-modal__form-actions {
    justify-self: start;
  }
}
</style>
