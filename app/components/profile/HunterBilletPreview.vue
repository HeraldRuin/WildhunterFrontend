<script setup lang="ts">
import { formatBirthdayDate, maskDotDateInput, parseBirthdayDate } from '~/utils/date'

const props = defineProps<{
  firstName?: string | null
  lastName?: string | null
  birthday?: string | null
  billetNumber?: string | null
  billetError?: string
  savingBillet?: boolean
  showBilletAction?: boolean
  billetActionLabel?: string
  billetSavingLabel?: string
}>()

const emit = defineEmits<{
  'update:billetNumber': [value: string]
  'update:firstName': [value: string]
  'update:lastName': [value: string]
  'update:birthday': [value: string]
  'save-billet': []
  'clear-billet-error': []
  'billet-keydown': [event: KeyboardEvent]
}>()

function fullNameFromProps() {
  return [props.lastName, props.firstName]
    .map(part => String(part ?? '').trim())
    .filter(Boolean)
    .join(' ')
}

const fullNameInput = ref(fullNameFromProps())

watch(
  () => [props.lastName, props.firstName] as const,
  () => {
    const fromProps = fullNameFromProps()
    const normalizedLocal = fullNameInput.value.replace(/\s+/g, ' ').trim()

    if (normalizedLocal !== fromProps) {
      fullNameInput.value = fromProps
    }
  },
)

function onFullNameModelUpdate(value: string) {
  fullNameInput.value = value

  const trimmedStart = value.replace(/^\s+/, '')
  const match = trimmedStart.match(/^(\S+)(?:\s+(.*))?$/)

  if (!match) {
    emit('update:lastName', '')
    emit('update:firstName', '')
    return
  }

  emit('update:lastName', match[1] ?? '')
  emit('update:firstName', (match[2] ?? '').trimStart())
}

function parseBillet(value: string) {
  const trimmed = String(value ?? '').trim()

  const marked = trimmed.match(/^(\d{0,2})\s*№\s*(\d{0,7})$/)
  if (marked) {
    return {
      series: marked[1] ?? '',
      number: marked[2] ?? '',
    }
  }

  const spaced = trimmed.match(/^(\d{1,2})\s+(\d{1,7})$/)
  if (spaced) {
    return {
      series: spaced[1] ?? '',
      number: spaced[2] ?? '',
    }
  }

  if (/^\d{1,7}$/.test(trimmed)) {
    return {
      series: '',
      number: trimmed,
    }
  }

  return {
    series: '',
    number: '',
  }
}

const seriesDigits = computed(() => parseBillet(String(props.billetNumber ?? '')).series)

const billetNumberPart = computed(() => parseBillet(String(props.billetNumber ?? '')).number)

const identityDocument = ref('')
const issuingAuthority = ref('')
const federationSubject = ref('')
const issueDate = ref('')
const isEditing = ref(false)
const isIssueDateOpen = ref(false)
const issueDatePicker = ref<Date | null>(null)
const issueDateActivePart = ref<'start' | 'end' | null>('start')
const issueDateFieldRef = ref<HTMLElement | null>(null)

type EditSnapshot = {
  billetNumber: string
  issuingAuthority: string
  federationSubject: string
  fullName: string
  birthday: string
  identityDocument: string
  issueDate: string
}

const editSnapshot = ref<EditSnapshot | null>(null)

function closeIssueDateCalendar() {
  isIssueDateOpen.value = false
}

function startEditing() {
  editSnapshot.value = {
    billetNumber: String(props.billetNumber ?? ''),
    issuingAuthority: issuingAuthority.value,
    federationSubject: federationSubject.value,
    fullName: fullNameInput.value,
    birthday: String(props.birthday ?? ''),
    identityDocument: identityDocument.value,
    issueDate: issueDate.value,
  }
  isEditing.value = true
}

function cancelEditing() {
  const snap = editSnapshot.value

  if (snap) {
    emit('update:billetNumber', snap.billetNumber)
    issuingAuthority.value = snap.issuingAuthority
    federationSubject.value = snap.federationSubject
    onFullNameModelUpdate(snap.fullName)
    emit('update:birthday', snap.birthday)
    identityDocument.value = snap.identityDocument
    issueDate.value = snap.issueDate
  }

  editSnapshot.value = null
  closeIssueDateCalendar()
  isEditing.value = false
}

function saveEditing() {
  editSnapshot.value = null
  closeIssueDateCalendar()
  isEditing.value = false
}

function onBilletNumberUpdate(value: string) {
  emit('update:billetNumber', value)
  emit('clear-billet-error')
}

function emitBillet(series: string, number: string) {
  emit('update:billetNumber', `${series} № ${number}`)
}

function onBirthdayUpdate(value: string) {
  emit('update:birthday', maskDotDateInput(value))
}

function onIssueDateUpdate(value: string) {
  issueDate.value = maskDotDateInput(value)
  const parsed = parseBirthdayDate(issueDate.value)

  if (parsed) {
    issueDatePicker.value = parsed
  }
}

function toggleIssueDateCalendar() {
  if (!isEditing.value) {
    return
  }

  if (isIssueDateOpen.value) {
    closeIssueDateCalendar()
    return
  }

  issueDatePicker.value = parseBirthdayDate(issueDate.value)
  issueDateActivePart.value = 'start'
  isIssueDateOpen.value = true
}

function onIssueDateSelect(date: Date) {
  issueDatePicker.value = date
  issueDate.value = formatBirthdayDate(date)
  closeIssueDateCalendar()
}

function handleIssueDateDocumentClick(event: MouseEvent) {
  if (!isIssueDateOpen.value) {
    return
  }

  if (!issueDateFieldRef.value?.contains(event.target as Node)) {
    closeIssueDateCalendar()
  }
}

onMounted(() => {
  document.addEventListener('click', handleIssueDateDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleIssueDateDocumentClick)
})

function onSeriesModelUpdate(value: string) {
  const nextSeries = value.replace(/\D/g, '').slice(0, 2)
  emitBillet(nextSeries, billetNumberPart.value)
}

function onNumberModelUpdate(value: string) {
  const nextNumber = value.replace(/\D/g, '').slice(0, 7)
  emitBillet(seriesDigits.value, nextNumber)
}
</script>

<template>
  <article
    class="hunter-billet"
    aria-label="Превью охотничьего билета"
  >
    <div class="hunter-billet__frame">
      <header class="hunter-billet__header">
        <h2 class="hunter-billet__title">Охотничий билет</h2>
      </header>

      <div
        class="hunter-billet__system"
        :class="{ 'hunter-billet__system--locked': !isEditing }"
      >
        <div class="hunter-billet__system-col hunter-billet__system-col--meta">
          <div class="hunter-billet__top-fields">
            <CommonFormField
              no-margin
              digits-only
              :max-length="2"
              label="Серия"
              :model-value="seriesDigits"
              placeholder="00"
              :disabled="!isEditing"
              @update:model-value="onSeriesModelUpdate"
            />
            <CommonFormField
              no-margin
              digits-only
              :max-length="7"
              label="Номер"
              :model-value="billetNumberPart"
              placeholder="0000000"
              :disabled="!isEditing"
              @update:model-value="onNumberModelUpdate"
            />
          </div>

          <!--
          <div class="hunter-billet__billet-row">
            <CommonFormField
              id="hunter-billet"
              label="Номер охот. билета"
              placeholder="Например, А-12345678"
              no-margin
              document-number-kind="billet"
              :model-value="billetNumber ?? ''"
              :error="billetError"
              :disabled="savingBillet"
              @update:model-value="onBilletNumberUpdate"
              @keydown="emit('billet-keydown', $event)"
            />
            <CommonSpinner
              v-if="savingBillet"
              class="hunter-billet__billet-spinner"
              variant="ring"
              :size="18"
              :label="billetSavingLabel || 'Сохранение номера билета'"
            />
            <button
              v-else-if="showBilletAction"
              type="button"
              class="hunter-billet__billet-action"
              @click="emit('save-billet')"
            >
              {{ billetActionLabel || 'Сохранить' }}
            </button>
          </div>
          -->

          <CommonFormField
            no-margin
            label="Исполнительный орган"
            v-model="issuingAuthority"
            placeholder="Наименование исполнительного органа"
            :disabled="!isEditing"
          />

          <CommonFormField
            no-margin
            label="Субъект РФ"
            v-model="federationSubject"
            placeholder="Субъект Российской Федерации"
            :disabled="!isEditing"
          />
        </div>

        <div class="hunter-billet__system-col hunter-billet__system-col--user">
          <CommonFormField
            no-margin
            label="ФИО"
            :model-value="fullNameInput"
            placeholder="Фамилия, имя, отчество"
            :disabled="!isEditing"
            @update:model-value="onFullNameModelUpdate"
          />
          <CommonFormField
            no-margin
            label="Дата рождения"
            placeholder="дд.мм.гггг"
            :model-value="birthday ?? ''"
            :disabled="!isEditing"
            @update:model-value="onBirthdayUpdate"
          />
          <CommonFormField
            no-margin
            label="Документ, удостоверяющий личность"
            v-model="identityDocument"
            placeholder="Серия и номер документа"
            :disabled="!isEditing"
          />
        </div>
      </div>

      <footer class="hunter-billet__footer">
        <div class="hunter-billet__footer-left">
          <button
            v-if="!isEditing"
            type="button"
            class="hunter-billet__edit-btn"
            @click="startEditing"
          >
            Редактировать
          </button>
          <div
            v-else
            class="hunter-billet__edit-actions"
          >
            <button
              type="button"
              class="hunter-billet__save-btn"
              @click="saveEditing"
            >
              Сохранить
            </button>
            <button
              type="button"
              class="hunter-billet__cancel-btn"
              @click="cancelEditing"
            >
              Отмена
            </button>
          </div>
        </div>
        <div
          ref="issueDateFieldRef"
          class="hunter-billet__issue-field"
          :class="{
            'hunter-billet__issue-field--locked': !isEditing,
            'hunter-billet__issue-field--open': isIssueDateOpen,
          }"
        >
          <CommonFormField
            no-margin
            label="Дата выдачи"
            placeholder="дд.мм.гггг"
            :disabled="!isEditing"
            :open="isIssueDateOpen"
            :model-value="issueDate"
            @update:model-value="onIssueDateUpdate"
          >
            <template #trailing>
              <button
                type="button"
                class="hunter-billet__calendar-icon"
                aria-label="Открыть календарь"
                :disabled="!isEditing"
                @click.stop="toggleIssueDateCalendar"
              >
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <rect x="2.25" y="3.75" width="15.5" height="14" rx="1.75" stroke="currentColor" stroke-width="1.5" />
                  <path d="M2.25 8.25h15.5" stroke="currentColor" stroke-width="1.5" />
                  <path d="M6.5 2.25v3.25M13.5 2.25v3.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                </svg>
              </button>
            </template>
          </CommonFormField>

          <div
            v-if="isIssueDateOpen"
            class="hunter-billet__date-panel"
            @click.stop
          >
            <HomeHeroSearchDatePicker
              v-model:start="issueDatePicker"
              v-model:active-part="issueDateActivePart"
              mode="single"
              @select="onIssueDateSelect"
            />
          </div>
        </div>
      </footer>
    </div>
  </article>
</template>

<style scoped>
.hunter-billet {
  --hunter-billet-ink: #5c5c5c;
  --hunter-billet-line: #9a9a9a;
  --hunter-billet-field-size: 16px;
  --hunter-billet-field-weight: 600;
  --hunter-billet-doc-font: 'Times New Roman', 'Liberation Serif', 'Noto Serif', Georgia, serif;
  width: 100%;
  max-width: 1080px;
  margin-top: 0;
  margin-inline: auto;
}

.hunter-billet__frame {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 200px;
  height: auto;
  padding: 18px 22px 16px;
  border: none;
  border-radius: 16px;
  outline: 1px solid var(--hunter-billet-line);
  outline-offset: 3px;
  color: var(--hunter-billet-ink);
  font-family: var(--hunter-billet-doc-font);
  background:
    repeating-linear-gradient(
      115deg,
      rgba(70, 120, 90, 0.05) 0 2px,
      transparent 2px 7px
    ),
    repeating-linear-gradient(
      -115deg,
      rgba(60, 100, 140, 0.05) 0 2px,
      transparent 2px 7px
    ),
    linear-gradient(180deg, #f4f6f2 0%, #eef2ec 100%);
  box-sizing: border-box;
}

.hunter-billet__header,
.hunter-billet__system,
.hunter-billet__footer {
  position: relative;
  z-index: 1;
}

.hunter-billet__header {
  margin-bottom: 20px;
  text-align: center;
}

.hunter-billet__title {
  margin: 0;
  color: var(--hunter-billet-ink);
  font-family: var(--hunter-billet-doc-font);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1.15;
}

.hunter-billet__top-fields {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 12px;
  width: 100%;
  min-width: 0;
}

.hunter-billet__system {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 20px 24px;
  align-items: start;
  width: 100%;
  margin-bottom: 24px;
  min-width: 0;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  color: var(--wh-gray-900);
}

.hunter-billet__system--locked,
.hunter-billet__issue-field--locked {
  pointer-events: none;
  user-select: none;
}

.hunter-billet__system-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.hunter-billet__system :deep(.form-field) {
  width: 100%;
  max-width: 100%;
}

.hunter-billet__billet-row {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  width: 100%;
}

.hunter-billet__billet-row :deep(.form-field) {
  flex: 1 1 auto;
  min-width: 0;
}

.hunter-billet__billet-action {
  flex-shrink: 0;
  margin-bottom: 14px;
  padding: 0;
  border: none;
  background: none;
  color: var(--wh-orange-text);
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 120%;
  cursor: pointer;
  transition: color 0.15s ease;
}

.hunter-billet__billet-action:hover {
  color: var(--wh-orange-600);
}

.hunter-billet__billet-spinner {
  flex-shrink: 0;
  margin-bottom: 14px;
  margin-left: 8px;
}

.hunter-billet__footer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 20px 24px;
  align-items: end;
  flex-shrink: 0;
  margin-top: auto;
  margin-bottom: 12px;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  color: var(--wh-gray-900);
}

.hunter-billet__footer-left {
  display: flex;
  align-items: center;
  min-width: 0;
}

.hunter-billet__edit-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.hunter-billet__edit-btn {
  margin: 0;
  padding: 12px 28px;
  border: 1.5px solid var(--wh-green);
  border-radius: 999px;
  background: var(--wh-green);
  color: var(--wh-white);
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 120%;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.hunter-billet__edit-btn:hover {
  opacity: 0.92;
}

.hunter-billet__edit-btn:active {
  opacity: 0.86;
}

.hunter-billet__save-btn {
  margin: 0;
  padding: 12px 28px;
  border: 1.5px solid var(--wh-orange-500);
  border-radius: 999px;
  background: var(--wh-orange-500);
  color: var(--wh-white);
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 120%;
  cursor: pointer;
  transition: background 0.15s ease, opacity 0.15s ease;
}

.hunter-billet__save-btn:hover {
  background: var(--wh-orange-600);
  border-color: var(--wh-orange-600);
}

.hunter-billet__cancel-btn {
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  color: var(--wh-orange-text);
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 120%;
  cursor: pointer;
  transition: color 0.15s ease;
}

.hunter-billet__cancel-btn:hover {
  color: var(--wh-orange-600);
}

.hunter-billet__issue-field {
  position: relative;
  z-index: 1;
  width: 100%;
  min-width: 0;
}

.hunter-billet__issue-field--open {
  z-index: 60;
}

.hunter-billet__issue-field :deep(.form-field) {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.hunter-billet__issue-field :deep(.form-field__label) {
  flex: 0 0 auto;
  margin: 0;
  white-space: nowrap;
}

.hunter-billet__issue-field :deep(.form-field__control) {
  flex: 1 1 auto;
  min-width: 0;
}

.hunter-billet__issue-field :deep(.form-field__input) {
  width: 100%;
}

.hunter-billet__calendar-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--wh-gray-400);
  cursor: pointer;
}

.hunter-billet__calendar-icon:disabled {
  cursor: default;
  opacity: 0.6;
}

.hunter-billet__calendar-icon svg {
  display: block;
  width: 20px;
  height: 20px;
}

.hunter-billet__date-panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 60;
  width: 100%;
  padding: 18px 20px;
  border: 1px solid var(--wh-gray);
  border-radius: 0;
  background: var(--wh-white);
  box-shadow: 0 12px 28px rgb(28 33 28 / 12%);
  box-sizing: border-box;
}

@media (max-width: 640px) {
  .hunter-billet__system,
  .hunter-billet__footer {
    grid-template-columns: 1fr;
  }

  .hunter-billet__footer-left {
    order: 2;
  }

  .hunter-billet__frame {
    padding: 14px 14px 12px;
  }

  .hunter-billet__title {
    font-size: 18px;
  }

  .hunter-billet__billet-row {
    flex-wrap: wrap;
  }
}
</style>
