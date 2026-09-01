<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import type { OrganisationAnimal, OrganisationPeriod } from '~/api/animals'
import { formatApiDate, formatBirthdayDate, parseBirthdayDate } from '~/utils/date'
import { formatHotelPrice } from '~/utils/hotel'

definePageMeta({
  layout: 'profile',
  middleware: 'baseadmin',
})

useHead({
  title: 'Организация охоты — WH',
})

type DateField = 'from' | 'to'

interface HuntingPeriod {
  id: number
  from: string
  to: string
  cost: string
}

interface HuntingAnimal {
  id: number
  title: string
  periods: HuntingPeriod[]
}

interface OpenDateField {
  periodId: number
  field: DateField
}

const { animals: animalsApi } = useApi()
const notifications = useNotifications()
const { open: openConfirmModal } = useConfirmModal()

const breadcrumbs = [
  { label: 'Главная', to: '/' },
  { label: 'Организация охоты' },
]

const animals = ref<HuntingAnimal[]>([])
const selectedAnimalId = ref<number | null>(null)
const isLoading = ref(true)
const loadError = ref('')
const busyPeriodId = ref<number | null>(null)

const openDate = ref<OpenDateField | null>(null)
const pickerDate = ref<Date | null>(null)
const pickerActivePart = ref<'start' | 'end' | null>('start')
const dateFieldRefs = new Map<string, HTMLElement>()

let nextDraftPeriodId = -1

const selectedAnimal = computed(() =>
  animals.value.find(item => item.id === selectedAnimalId.value) ?? null,
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

const isBusy = computed(() =>
  isLoading.value || busyPeriodId.value != null,
)

function isDraftPeriod(period: HuntingPeriod) {
  return period.id < 0
}

function hasAnyPeriodInput(period: HuntingPeriod) {
  return Boolean(period.from.trim() || period.to.trim() || period.cost.trim())
}

function formatCost(price: number | null): string {
  if (price == null) {
    return ''
  }

  return formatHotelPrice(price)
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

function apiDateToDisplay(value: string | null): string {
  if (!value) {
    return ''
  }

  const parsed = parseBirthdayDate(value)
  return parsed ? formatBirthdayDate(parsed) : value
}

function displayToApiDate(value: string): string | null {
  const parsed = parseBirthdayDate(value)
  return parsed ? formatApiDate(parsed) : null
}

function toPeriodRow(period: OrganisationPeriod): HuntingPeriod {
  return {
    id: period.id,
    from: apiDateToDisplay(period.start_date),
    to: apiDateToDisplay(period.end_date),
    cost: formatCost(period.price),
  }
}

function toAnimalRow(animal: OrganisationAnimal): HuntingAnimal {
  return {
    id: animal.id,
    title: animal.title,
    periods: (animal.periods ?? []).map(toPeriodRow),
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

async function loadOrganisation() {
  isLoading.value = true
  loadError.value = ''

  try {
    const response = await animalsApi.getOrganisation()

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

    loadError.value = extractErrorMessage(response, 'Не удалось загрузить организацию охоты')
  }
  catch (error) {
    const data = (error as { data?: unknown }).data
    loadError.value = extractErrorMessage(data, 'Не удалось загрузить организацию охоты')
  }
  finally {
    isLoading.value = false
  }
}

function dateFieldKey(periodId: number, field: DateField) {
  return `${periodId}:${field}`
}

function setDateFieldRef(
  periodId: number,
  field: DateField,
  el: Element | ComponentPublicInstance | null,
) {
  const key = dateFieldKey(periodId, field)

  if (el instanceof HTMLElement) {
    dateFieldRefs.set(key, el)
    return
  }

  dateFieldRefs.delete(key)
}

function isDateOpen(periodId: number, field: DateField) {
  return openDate.value?.periodId === periodId && openDate.value.field === field
}

function displayDate(value: string) {
  const parsed = parseBirthdayDate(value)
  return parsed ? formatBirthdayDate(parsed) : value
}

function closeDateCalendar() {
  openDate.value = null
}

function toggleDateCalendar(period: HuntingPeriod, field: DateField) {
  if (busyPeriodId.value === period.id) {
    return
  }

  if (isDateOpen(period.id, field)) {
    closeDateCalendar()
    return
  }

  openDate.value = { periodId: period.id, field }
  pickerDate.value = parseBirthdayDate(period[field])
  pickerActivePart.value = 'start'
}

function onDateSelect(period: HuntingPeriod, field: DateField, date: Date) {
  pickerDate.value = date
  period[field] = formatBirthdayDate(date)
  closeDateCalendar()
}

function handleDateDocumentClick(event: MouseEvent) {
  const current = openDate.value
  if (!current) {
    return
  }

  const field = dateFieldRefs.get(dateFieldKey(current.periodId, current.field))
  if (!field?.contains(event.target as Node)) {
    closeDateCalendar()
  }
}

function selectAnimal(id: number) {
  selectedAnimalId.value = id
  closeDateCalendar()
}

function addPeriod() {
  const animal = selectedAnimal.value

  if (!animal || isBusy.value) {
    return
  }

  animal.periods.push({
    id: nextDraftPeriodId--,
    from: '',
    to: '',
    cost: '',
  })
}

async function savePeriod(period: HuntingPeriod) {
  if (isBusy.value) {
    return
  }

  const animal = selectedAnimal.value
  if (!animal) {
    return
  }

  if (isDraftPeriod(period) && !hasAnyPeriodInput(period)) {
    return
  }

  const startDate = displayToApiDate(period.from)
  const endDate = displayToApiDate(period.to)
  const amount = period.cost.trim() === '' ? null : parseAmount(period.cost)

  const draftId = period.id
  busyPeriodId.value = draftId
  closeDateCalendar()

  try {
    let periodId = period.id

    if (isDraftPeriod(period)) {
      const createResponse = await animalsApi.createPeriod(animal.id)

      if (!('success' in createResponse) || !createResponse.success) {
        notifications.error(extractErrorMessage(createResponse, 'Не удалось сохранить период'))
        return
      }

      periodId = createResponse.data.period.id
      period.id = periodId

      if (openDate.value?.periodId === draftId) {
        openDate.value = {
          periodId,
          field: openDate.value.field,
        }
      }
    }

    busyPeriodId.value = periodId

    const response = await animalsApi.updatePeriod(periodId, {
      start_date: startDate,
      end_date: endDate,
      amount,
    })

    if ('success' in response && response.success) {
      const next = toPeriodRow(response.data.period)
      period.id = next.id
      period.from = next.from
      period.to = next.to
      period.cost = next.cost
      notifications.success(response.message || 'Период обновлен')
      return
    }

    notifications.error(extractErrorMessage(response, 'Не удалось сохранить период'))
  }
  catch (error) {
    const data = (error as { data?: unknown }).data
    notifications.error(extractErrorMessage(data, 'Не удалось сохранить период'))
  }
  finally {
    busyPeriodId.value = null
  }
}

function requestRemovePeriod(period: HuntingPeriod) {
  if (isBusy.value) {
    return
  }

  if (isDraftPeriod(period)) {
    removeDraftPeriod(period.id)
    return
  }

  openConfirmModal({
    title: 'Удалить период?',
    confirmLabel: 'Удалить',
    onConfirm: () => removePeriod(period.id),
  })
}

function removeDraftPeriod(periodId: number) {
  const animal = selectedAnimal.value
  if (!animal) {
    return
  }

  if (openDate.value?.periodId === periodId) {
    closeDateCalendar()
  }

  animal.periods = animal.periods.filter(item => item.id !== periodId)
}

async function removePeriod(periodId: number) {
  if (isBusy.value) {
    return
  }

  const animal = selectedAnimal.value
  if (!animal) {
    return
  }

  busyPeriodId.value = periodId

  if (openDate.value?.periodId === periodId) {
    closeDateCalendar()
  }

  try {
    const response = await animalsApi.deletePeriod(periodId)

    if ('success' in response && response.success) {
      animal.periods = animal.periods.filter(item => item.id !== periodId)
      notifications.success(response.message || 'Период удален')
      return
    }

    notifications.error(extractErrorMessage(response, 'Не удалось удалить период'))
    throw new Error('delete_period_failed')
  }
  catch (error) {
    if ((error as Error).message !== 'delete_period_failed') {
      const data = (error as { data?: unknown }).data
      notifications.error(extractErrorMessage(data, 'Не удалось удалить период'))
    }

    throw error
  }
  finally {
    busyPeriodId.value = null
  }
}

onMounted(() => {
  document.addEventListener('click', handleDateDocumentClick)
  void loadOrganisation()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDateDocumentClick)
})
</script>

<template>
  <div class="profile-page">
    <header class="profile-page__header">
      <AppBreadcrumbs :items="breadcrumbs" />

      <ProfileNotificationsBell />
    </header>

    <CommonPageTitle divider>Организация охоты</CommonPageTitle>

    <div class="hunting-org__body">
      <p v-if="loadError" class="hunting-org__status hunting-org__status--error">
        {{ loadError }}
      </p>

      <div
        v-else-if="isLoading"
        class="hunting-org__loading"
        aria-live="polite"
      >
        <CommonSpinner variant="ring" size="lg" label="Загрузка организации охоты" />
      </div>

      <section v-else class="hunting-org">
      <nav class="hunting-org__animals" aria-label="Животные">
        <button
          v-for="animal in animals"
          :key="animal.id"
          type="button"
          class="hunting-org__animal"
          :class="{ 'hunting-org__animal--active': animal.id === selectedAnimalId }"
          :disabled="isBusy && animal.id !== selectedAnimalId"
          @click="selectAnimal(animal.id)"
        >
          <span class="hunting-org__animal-dot" aria-hidden="true" />
          <span class="hunting-org__animal-label">{{ animal.title }}</span>
        </button>

        <p v-if="!animals.length" class="hunting-org__animals-empty">
          Нет животных
        </p>
      </nav>

      <div class="hunting-org__animals-select">
        <CommonSelectField
          v-model="animalSelectValue"
          placeholder="Выберите животное"
          no-margin
          :options="animalSelectOptions"
          :disabled="isBusy || !animalSelectOptions.length"
        />

        <p v-if="!animals.length" class="hunting-org__animals-empty">
          Нет животных
        </p>
      </div>

      <div class="hunting-org__content">
        <div class="hunting-org__table">
          <div class="hunting-org__head">
            <span class="hunting-org__col hunting-org__col--from">От</span>
            <span class="hunting-org__col hunting-org__col--to">До</span>
            <span class="hunting-org__col hunting-org__col--cost">Стоимость, руб</span>
            <span class="hunting-org__col hunting-org__col--actions" aria-hidden="true" />
          </div>

          <ul v-if="selectedAnimal?.periods.length" class="hunting-org__list">
            <li
              v-for="period in selectedAnimal.periods"
              :key="period.id"
              class="hunting-org__row"
            >
              <div
                :ref="(el) => setDateFieldRef(period.id, 'from', el)"
                class="hunting-org__col hunting-org__col--from hunting-org__date-field"
                :class="{ 'hunting-org__date-field--open': isDateOpen(period.id, 'from') }"
              >
                <span class="hunting-org__field-label">От</span>
                <CommonFormField
                  no-margin
                  cursor-pointer
                  readonly
                  placeholder="дд.мм.гггг"
                  :model-value="displayDate(period.from)"
                  :open="isDateOpen(period.id, 'from')"
                  :disabled="busyPeriodId === period.id"
                  @click.stop="toggleDateCalendar(period, 'from')"
                >
                  <template #trailing>
                    <button
                      type="button"
                      class="hunting-org__date-icon"
                      aria-label="Открыть календарь"
                      tabindex="-1"
                      :disabled="busyPeriodId === period.id"
                      @click.stop="toggleDateCalendar(period, 'from')"
                    >
                      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <rect x="2.25" y="3.75" width="15.5" height="14" rx="1.75" stroke="currentColor" stroke-width="1.5" />
                        <path d="M2.25 8.25h15.5" stroke="currentColor" stroke-width="1.5" />
                        <path d="M6.5 2.25v3.25M13.5 2.25v3.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                      </svg>
                    </button>
                  </template>
                  <template v-if="isDateOpen(period.id, 'from')" #append>
                    <div class="hunting-org__date-panel" @click.stop>
                      <HomeHeroSearchDatePicker
                        v-model:start="pickerDate"
                        v-model:active-part="pickerActivePart"
                        mode="single"
                        @select="onDateSelect(period, 'from', $event)"
                      />
                    </div>
                  </template>
                </CommonFormField>
              </div>

              <div
                :ref="(el) => setDateFieldRef(period.id, 'to', el)"
                class="hunting-org__col hunting-org__col--to hunting-org__date-field"
                :class="{ 'hunting-org__date-field--open': isDateOpen(period.id, 'to') }"
              >
                <span class="hunting-org__field-label">До</span>
                <CommonFormField
                  no-margin
                  cursor-pointer
                  readonly
                  placeholder="дд.мм.гггг"
                  :model-value="displayDate(period.to)"
                  :open="isDateOpen(period.id, 'to')"
                  :disabled="busyPeriodId === period.id"
                  @click.stop="toggleDateCalendar(period, 'to')"
                >
                  <template #trailing>
                    <button
                      type="button"
                      class="hunting-org__date-icon"
                      aria-label="Открыть календарь"
                      tabindex="-1"
                      :disabled="busyPeriodId === period.id"
                      @click.stop="toggleDateCalendar(period, 'to')"
                    >
                      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <rect x="2.25" y="3.75" width="15.5" height="14" rx="1.75" stroke="currentColor" stroke-width="1.5" />
                        <path d="M2.25 8.25h15.5" stroke="currentColor" stroke-width="1.5" />
                        <path d="M6.5 2.25v3.25M13.5 2.25v3.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                      </svg>
                    </button>
                  </template>
                  <template v-if="isDateOpen(period.id, 'to')" #append>
                    <div class="hunting-org__date-panel" @click.stop>
                      <HomeHeroSearchDatePicker
                        v-model:start="pickerDate"
                        v-model:active-part="pickerActivePart"
                        mode="single"
                        @select="onDateSelect(period, 'to', $event)"
                      />
                    </div>
                  </template>
                </CommonFormField>
              </div>

              <div class="hunting-org__col hunting-org__col--cost">
                <span class="hunting-org__field-label">Стоимость, руб</span>
                <CommonFormField
                  no-margin
                  amount-only
                  :model-value="period.cost"
                  :disabled="busyPeriodId === period.id"
                  @update:model-value="period.cost = $event"
                />
              </div>

              <div class="hunting-org__col hunting-org__col--actions">
                <button
                  type="button"
                  class="hunting-org__btn hunting-org__btn--save"
                  :disabled="isBusy || !period.from.trim()"
                  @click="savePeriod(period)"
                >
                  Сохранить
                </button>
                <button
                  type="button"
                  class="hunting-org__btn hunting-org__btn--delete"
                  :disabled="isBusy"
                  @click="requestRemovePeriod(period)"
                >
                  Удалить
                </button>
              </div>
            </li>
          </ul>

          <p v-else class="hunting-org__empty">Нет периодов</p>
        </div>

        <CommonSaveButton
          type="button"
          class="hunting-org__add"
          width="auto"
          mobile-width="100%"
          :disabled="!selectedAnimal || isBusy"
          @click="addPeriod"
        >
          Добавить период
        </CommonSaveButton>
      </div>
    </section>
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
  padding: 20px 40px 16px;
  padding-left: 20px;
  box-sizing: border-box;
  min-width: 0;
  max-width: 100%;
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

.hunting-org__status {
  margin: 0 0 16px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.55);
}

.hunting-org__status--error {
  color: var(--wh-field-error, #dc2626);
}

.hunting-org__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.hunting-org__loading {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 220px;
}

.hunting-org {
  display: flex;
  flex: 1 1 0;
  align-items: stretch;
  gap: 0;
  width: 100%;
  min-width: 0;
  min-height: 0;
  max-width: 100%;
  box-sizing: border-box;
  container-type: inline-size;
  container-name: hunting-org;
  background: var(--wh-white);
  border: 1px solid var(--wh-gray-200, #ddd);
  border-radius: 4px;
  overflow: hidden;
}

.hunting-org__animals {
  display: flex;
  flex: 0 1 clamp(220px, 36cqi, 600px);
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  box-sizing: border-box;
  width: clamp(220px, 36cqi, 600px);
  max-width: clamp(220px, 36cqi, 600px);
  min-width: 0;
  padding: 8px;
  border-right: 1px solid var(--wh-gray-200, #ddd);
  border-radius: 4px 0 0 4px;
  background: var(--wh-white);
}

@media (max-width: 1823px) and (min-width: 1025px) {
  .hunting-org__head,
  .hunting-org__row {
    padding-inline: 12px;
  }
}

.hunting-org__animals-select {
  display: none;
}

.hunting-org__animals-empty {
  margin: 0;
  padding: 12px 14px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}

.hunting-org__animal {
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

.hunting-org__animal-dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: transparent;
}

.hunting-org__animal-label {
  min-width: 0;
  overflow-wrap: anywhere;
}

.hunting-org__animal:hover:not(:disabled):not(.hunting-org__animal--active),
.hunting-org__animal:focus-visible:not(:disabled):not(.hunting-org__animal--active) {
  background-color: transparent;
  border-color: #e8883a;
  color: var(--wh-black-text, #1c211c);
}

.hunting-org__animal--active {
  background-color: #e8883a;
  border-color: #e8883a;
  color: #ffffff;
  cursor: default;
}

.hunting-org__animal--active .hunting-org__animal-dot {
  background-color: #ffffff;
}

.hunting-org__animal:disabled:not(.hunting-org__animal--active) {
  cursor: not-allowed;
  opacity: 0.55;
}

.hunting-org__content {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  padding: 0 0 20px;
}

.hunting-org__table {
  display: grid;
  width: 100%;
  min-width: 0;
  grid-template-columns:
    minmax(0, 1.15fr)
    minmax(0, 1.15fr)
    minmax(0, 0.85fr)
    minmax(190px, max-content);
  column-gap: clamp(8px, 1.2cqi, 12px);
  overflow: visible;
}

.hunting-org__head,
.hunting-org__row {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: 1 / -1;
  align-items: center;
  padding: 12px 16px;
  box-sizing: border-box;
}

.hunting-org__head {
  border-bottom: 1px solid var(--wh-gray-200, #ddd);
  background: var(--wh-gray-450, #C8C8C8);
  font-size: 14px;
  font-weight: 600;
  color: var(--wh-black-text, #1c211c);
}

.hunting-org__list {
  display: contents;
  margin: 0;
  padding: 0;
  list-style: none;
}

.hunting-org__row {
  border-bottom: 1px solid var(--wh-gray-200, #ddd);
}

.hunting-org__row:last-child {
  border-bottom: none;
}

.hunting-org__col--from,
.hunting-org__col--to,
.hunting-org__col--cost,
.hunting-org__date-field {
  min-width: 0;
}

.hunting-org__col--from :deep(.form-field),
.hunting-org__col--to :deep(.form-field),
.hunting-org__col--cost :deep(.form-field) {
  width: 100%;
  min-width: 0;
}

.hunting-org__col--from :deep(.form-field__control),
.hunting-org__col--to :deep(.form-field__control),
.hunting-org__col--cost :deep(.form-field__control),
.hunting-org__col--from :deep(.form-field__input),
.hunting-org__col--to :deep(.form-field__input),
.hunting-org__col--cost :deep(.form-field__input) {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.hunting-org__date-field {
  position: relative;
  z-index: 1;
}

.hunting-org__date-field--open {
  z-index: 40;
}

.hunting-org__date-field :deep(.form-field__control) {
  z-index: auto;
}

.hunting-org__date-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--wh-gray-400, #bdbdbd);
  cursor: pointer;
}

.hunting-org__date-icon svg {
  display: block;
  width: 20px;
  height: 20px;
}

.hunting-org__date-panel {
  width: 100%;
  min-width: 280px;
  padding: 18px 20px;
  border: 1px solid var(--wh-gray, #ddd);
  border-radius: 0;
  background: var(--wh-white);
  box-shadow: 0 12px 28px rgb(28 33 28 / 12%);
  box-sizing: border-box;
}

.hunting-org__col--actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
  gap: 8px;
  min-width: 190px;
}

.hunting-org__btn {
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

.hunting-org__btn:active {
  opacity: 0.9;
}

.hunting-org__btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.hunting-org__btn--save {
  border-color: var(--wh-green);
  background: var(--wh-green);
  color: var(--wh-white);
}

.hunting-org__btn--save:hover:not(:disabled) {
  border-color: var(--wh-green);
  background: var(--wh-green);
}

.hunting-org__btn--delete {
  border-color: #dc3545;
  background: #dc3545;
  color: var(--wh-white);
}

.hunting-org__btn--delete:hover:not(:disabled) {
  border-color: #c82333;
  background: #c82333;
}

.hunting-org__empty {
  grid-column: 1 / -1;
  margin: 0;
  padding: 24px 16px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}

.hunting-org__field-label {
  display: none;
}

.hunting-org__content :deep(.hunting-org__add) {
  align-self: flex-start;
  margin-left: 16px;
  min-width: 0;
}

@container hunting-org (max-width: 1180px) {
  .hunting-org__head,
  .hunting-org__row {
    padding-inline: 10px;
  }

  .hunting-org__table {
    column-gap: 8px;
    grid-template-columns:
      minmax(0, 0.95fr)
      minmax(0, 0.95fr)
      minmax(0, 0.7fr)
      minmax(190px, max-content);
  }
}

@media (min-width: 1541px) {
  @container hunting-org (max-width: 1180px) {
    .hunting-org__date-icon {
      display: none;
    }

    .hunting-org__col--from :deep(.form-field__input--with-trailing),
    .hunting-org__col--to :deep(.form-field__input--with-trailing) {
      padding-right: 14px;
    }
  }
}

@container hunting-org (max-width: 980px) {
  .hunting-org__table {
    grid-template-columns:
      minmax(0, 0.85fr)
      minmax(0, 0.85fr)
      minmax(0, 0.6fr)
      minmax(190px, max-content);
  }
}

@media (max-width: 1540px) and (min-width: 1025px) {
  .hunting-org {
    flex-direction: column;
  }

  .hunting-org__animals {
    display: none;
  }

  .hunting-org__animals-select {
    display: block;
    padding: 12px;
    border-bottom: 1px solid var(--wh-gray-200, #ddd);
  }

  .hunting-org__content {
    flex: 1 1 auto;
    min-width: 0;
  }
}

@media (max-width: 1243px) and (min-width: 1025px) {
  .hunting-org__col--actions {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
}

@media (max-width: 837px) and (min-width: 641px) {
  .hunting-org__col--actions {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
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

  .hunting-org__body {
    flex: none;
    min-height: 0;
  }

  .hunting-org {
    flex: none;
  }

  .hunting-org__loading {
    flex: none;
    align-items: flex-start;
    min-height: 0;
    padding-top: 160px;
  }

  .hunting-org {
    flex-direction: column;
  }

  .hunting-org__animals {
    display: none;
  }

  .hunting-org__animals-select {
    display: block;
    padding: 12px;
    border-bottom: 1px solid var(--wh-gray-200, #ddd);
  }

  .hunting-org__content {
    min-width: 0;
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

  .hunting-org__table {
    grid-template-columns: 1fr;
    column-gap: 0;
  }

  .hunting-org__list {
    display: block;
  }

  .hunting-org__head,
  .hunting-org__row {
    display: grid;
    grid-template-columns: 1fr;
    grid-column: auto;
    gap: 10px;
    padding: 14px 16px;
  }

  .hunting-org__head {
    display: none;
  }

  .hunting-org__col--from,
  .hunting-org__col--to,
  .hunting-org__col--cost {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }

  .hunting-org__field-label {
    display: block;
    flex-shrink: 0;
    width: auto;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--wh-black-text, #1c211c);
  }

  .hunting-org__col--from :deep(.form-field),
  .hunting-org__col--to :deep(.form-field),
  .hunting-org__col--cost :deep(.form-field) {
    flex: none;
    width: 100%;
    min-width: 0;
  }

  .hunting-org__col--actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .hunting-org__content :deep(.hunting-org__add) {
    margin-left: 16px;
    margin-right: 16px;
  }
}
</style>
