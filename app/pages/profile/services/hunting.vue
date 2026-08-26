<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import { formatBirthdayDate, parseBirthdayDate } from '~/utils/date'

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

const breadcrumbs = [
  { label: 'Главная', to: '/' },
  { label: 'Параметры' },
  { label: 'Организация охоты' },
]

let nextPeriodId = 3

const animals = ref<HuntingAnimal[]>([
  {
    id: 1,
    title: 'Косуля европейская',
    periods: [
      { id: 1, from: '23.12.2025', to: '30.04.2026', cost: '2500,00' },
      { id: 2, from: '', to: '', cost: '' },
    ],
  },
  {
    id: 2,
    title: 'Лось',
    periods: [],
  },
  {
    id: 3,
    title: 'Кабан',
    periods: [],
  },
  {
    id: 4,
    title: 'Олень благородный',
    periods: [],
  },
])

const selectedAnimalId = ref(1)
const openDate = ref<OpenDateField | null>(null)
const pickerDate = ref<Date | null>(null)
const pickerActivePart = ref<'start' | 'end' | null>('start')
const dateFieldRefs = new Map<string, HTMLElement>()

const selectedAnimal = computed(() =>
  animals.value.find(item => item.id === selectedAnimalId.value) ?? null,
)

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
  if (!animal) {
    return
  }

  animal.periods.push({
    id: nextPeriodId++,
    from: '',
    to: '',
    cost: '',
  })
}

function savePeriod() {
  // UI only — API later
}

function removePeriod(periodId: number) {
  const animal = selectedAnimal.value
  if (!animal) {
    return
  }

  if (openDate.value?.periodId === periodId) {
    closeDateCalendar()
  }

  animal.periods = animal.periods.filter(item => item.id !== periodId)
}

onMounted(() => {
  document.addEventListener('click', handleDateDocumentClick)
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

    <section class="hunting-org">
      <nav class="hunting-org__animals" aria-label="Животные">
        <button
          v-for="animal in animals"
          :key="animal.id"
          type="button"
          class="hunting-org__animal"
          :class="{ 'hunting-org__animal--active': animal.id === selectedAnimalId }"
          @click="selectAnimal(animal.id)"
        >
          <span class="hunting-org__animal-dot" aria-hidden="true" />
          <span class="hunting-org__animal-label">{{ animal.title }}</span>
        </button>
      </nav>

      <div class="hunting-org__content">
        <div class="hunting-org__table">
          <div class="hunting-org__head">
            <span class="hunting-org__col hunting-org__col--from">От</span>
            <span class="hunting-org__col hunting-org__col--to">До</span>
            <span class="hunting-org__col hunting-org__col--cost">Стоимость</span>
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
                <CommonFormField
                  no-margin
                  cursor-pointer
                  readonly
                  placeholder="дд.мм.гггг"
                  :model-value="displayDate(period.from)"
                  :open="isDateOpen(period.id, 'from')"
                  @click.stop="toggleDateCalendar(period, 'from')"
                >
                  <template #trailing>
                    <button
                      type="button"
                      class="hunting-org__date-icon"
                      aria-label="Открыть календарь"
                      tabindex="-1"
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
                <CommonFormField
                  no-margin
                  cursor-pointer
                  readonly
                  placeholder="дд.мм.гггг"
                  :model-value="displayDate(period.to)"
                  :open="isDateOpen(period.id, 'to')"
                  @click.stop="toggleDateCalendar(period, 'to')"
                >
                  <template #trailing>
                    <button
                      type="button"
                      class="hunting-org__date-icon"
                      aria-label="Открыть календарь"
                      tabindex="-1"
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

              <CommonFormField
                class="hunting-org__col hunting-org__col--cost"
                no-margin
                amount-only
                :model-value="period.cost"
                @update:model-value="period.cost = $event"
              />

              <div class="hunting-org__col hunting-org__col--actions">
                <button
                  type="button"
                  class="hunting-org__btn hunting-org__btn--save"
                  @click="savePeriod"
                >
                  Сохранить
                </button>
                <button
                  type="button"
                  class="hunting-org__btn hunting-org__btn--delete"
                  @click="removePeriod(period.id)"
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
          @click="addPeriod"
        >
          Добавить период
        </CommonSaveButton>
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

.hunting-org {
  display: grid;
  grid-template-columns: 600px minmax(0, 1fr);
  gap: 0;
  background: var(--wh-white);
  border: 1px solid var(--wh-gray-200, #ddd);
  border-radius: 4px;
  overflow: visible;
}

.hunting-org__animals {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  padding: 8px;
  border-right: 1px solid var(--wh-gray-200, #ddd);
  border-radius: 4px 0 0 4px;
  background: var(--wh-white);
}

.hunting-org__animal {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  border: none;
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
  transition: background-color 0.15s ease, color 0.15s ease;
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
}

.hunting-org__animal:hover,
.hunting-org__animal:focus-visible,
.hunting-org__animal--active {
  background-color: #e8883a;
  color: #ffffff;
}

.hunting-org__animal--active .hunting-org__animal-dot {
  background-color: #ffffff;
}

.hunting-org__animal--active {
  cursor: default;
}

.hunting-org__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  padding: 0 0 20px;
}

.hunting-org__table {
  overflow: visible;
}

.hunting-org__head,
.hunting-org__row {
  display: grid;
  grid-template-columns:
    200px
    200px
    140px
    auto;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
}

.hunting-org__head {
  border-bottom: 1px solid var(--wh-gray-200, #ddd);
  font-size: 14px;
  font-weight: 600;
  color: var(--wh-black-text, #1c211c);
}

.hunting-org__list {
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
  gap: 8px;
}

.hunting-org__btn {
  padding: 7px 14px;
  border: none;
  border-radius: 4px;
  color: var(--wh-white);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  cursor: pointer;
  transition: opacity 0.15s ease, background 0.15s ease;
}

.hunting-org__btn:active {
  opacity: 0.9;
}

.hunting-org__btn--save {
  background: #2ea44f;
}

.hunting-org__btn--save:hover {
  background: #279443;
}

.hunting-org__btn--delete {
  background: var(--wh-field-error, #dc2626);
}

.hunting-org__btn--delete:hover {
  background: color-mix(in srgb, var(--wh-field-error, #dc2626) 88%, #000);
}

.hunting-org__empty {
  margin: 0;
  padding: 24px 16px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}

.hunting-org__content :deep(.hunting-org__add) {
  align-self: flex-start;
  margin-left: 16px;
  min-width: 0;
}

@media (--wh-tablet) {
  .profile-page {
    padding: 12px 8px 32px;
  }

  .profile-page__header {
    width: 100%;
  }

  .hunting-org {
    grid-template-columns: 520px minmax(0, 1fr);
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
    background: transparent;
    border-radius: 0;
  }

  .hunting-org {
    grid-template-columns: 1fr;
  }

  .hunting-org__animals {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 4px;
    padding: 12px;
    border-right: none;
    border-bottom: 1px solid var(--wh-gray-200, #ddd);
  }

  .hunting-org__animal {
    width: auto;
    padding: 8px 12px;
  }

  .hunting-org__head,
  .hunting-org__row {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 14px 16px;
  }

  .hunting-org__head {
    display: none;
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
