<script setup lang="ts">
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

function onBilletNumberUpdate(value: string) {
  emit('update:billetNumber', value)
  emit('clear-billet-error')
}

function emitBillet(series: string, number: string) {
  emit('update:billetNumber', `${series} № ${number}`)
}

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

      <div class="hunter-billet__system">
        <div class="hunter-billet__system-col hunter-billet__system-col--meta">
          <div class="hunter-billet__top-fields">
            <CommonFormField
              no-margin
              digits-only
              :max-length="2"
              label="Серия"
              :model-value="seriesDigits"
              placeholder="00"
              @update:model-value="onSeriesModelUpdate"
            />
            <CommonFormField
              no-margin
              digits-only
              :max-length="7"
              label="Номер"
              :model-value="billetNumberPart"
              placeholder="0000000"
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
          />

          <CommonFormField
            no-margin
            label="Субъект РФ"
            v-model="federationSubject"
            placeholder="Субъект Российской Федерации"
          />
        </div>

        <div class="hunter-billet__system-col hunter-billet__system-col--user">
          <CommonFormField
            no-margin
            label="ФИО"
            :model-value="fullNameInput"
            placeholder="Фамилия, имя, отчество"
            @update:model-value="onFullNameModelUpdate"
          />
          <CommonFormField
            no-margin
            label="Дата рождения"
            placeholder="дд.мм.гггг"
            :model-value="birthday ?? ''"
            @update:model-value="emit('update:birthday', $event)"
          />
          <CommonFormField
            no-margin
            label="Документ, удостоверяющий личность"
            v-model="identityDocument"
            placeholder="Серия и номер документа"
          />
        </div>
      </div>

      <footer class="hunter-billet__footer">
        <div class="hunter-billet__issue">
          <span>Дата выдачи:</span>
          <ProfileHunterBilletDateField
            v-model="issueDate"
            class="hunter-billet__issue-date"
            inline
            aria-label="Дата выдачи билета"
          />
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
  max-width: 100%;
  margin-top: 0;
}

.hunter-billet__frame {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 200px;
  height: auto;
  padding: 18px 22px 16px;
  border: none;
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
  display: flex;
  justify-content: flex-end;
  align-items: end;
  flex-shrink: 0;
  margin-top: auto;
  margin-bottom: 12px;
  padding-right: 64px;
  font-family: var(--hunter-billet-doc-font);
}

.hunter-billet__issue {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  font-size: var(--hunter-billet-field-size);
  font-weight: var(--hunter-billet-field-weight);
  line-height: 1.25;
  white-space: nowrap;
}

.hunter-billet__issue-date {
  width: auto;
  min-width: 0;
  flex: 0 0 auto;
}

@media (max-width: 640px) {
  .hunter-billet__system {
    grid-template-columns: 1fr;
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
