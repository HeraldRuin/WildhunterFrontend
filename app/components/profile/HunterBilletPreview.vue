<script setup lang="ts">
const props = defineProps<{
  firstName?: string | null
  lastName?: string | null
  birthday?: string | null
  avatar?: string | null
  billetNumber?: string | null
}>()

const emit = defineEmits<{
  'update:billetNumber': [value: string]
  'update:firstName': [value: string]
  'update:lastName': [value: string]
  'update:birthday': [value: string]
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

function onFullNameInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
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

  // Явный формат независимых полей: "12 № 0000739", " № 56", "12 №"
  const marked = trimmed.match(/^(\d{0,2})\s*№\s*(\d{0,7})$/)
  if (marked) {
    return {
      series: marked[1] ?? '',
      number: marked[2] ?? '',
    }
  }

  // Старый формат с пробелом: "12 0000739"
  const spaced = trimmed.match(/^(\d{1,2})\s+(\d{1,7})$/)
  if (spaced) {
    return {
      series: spaced[1] ?? '',
      number: spaced[2] ?? '',
    }
  }

  // Одни цифры без разделителя — это номер, не серия
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

const avatarSrc = computed(() => {
  const src = String(props.avatar ?? '').trim()
  return src || null
})

const identityDocument = ref('')
const issuingAuthority = ref('')
const federationSubject = ref('')
const federationDate = ref('')
const documentIssueDate = ref('')
const issueDate = ref('')

function onBirthdayUpdate(value: string) {
  emit('update:birthday', value)
}

function emitBillet(series: string, number: string) {
  emit('update:billetNumber', `${series} № ${number}`)
}

function onSeriesInput(event: Event) {
  const target = event.target as HTMLInputElement
  const nextSeries = target.value.replace(/\D/g, '').slice(0, 2)
  target.value = nextSeries
  emitBillet(nextSeries, billetNumberPart.value)
}

function onNumberInput(event: Event) {
  const target = event.target as HTMLInputElement
  const nextNumber = target.value.replace(/\D/g, '').slice(0, 7)
  target.value = nextNumber
  emitBillet(seriesDigits.value, nextNumber)
}
</script>

<template>
  <article
    class="hunter-billet"
    aria-label="Превью охотничьего билета"
  >
    <div class="hunter-billet__frame">
      <div
        class="hunter-billet__watermark"
        aria-hidden="true"
      >
        <img
          src="/images/rf-coat-of-arms.svg"
          alt=""
          class="hunter-billet__watermark-img"
        >
      </div>

      <header class="hunter-billet__header">
        <div class="hunter-billet__title-row">
          <h2 class="hunter-billet__title">Охотничий билет</h2>
          <p class="hunter-billet__series">
            <span>серия</span>
            <input
              class="hunter-billet__series-input"
              type="text"
              inputmode="numeric"
              maxlength="2"
              :value="seriesDigits"
              aria-label="Серия охотничьего билета"
              @input="onSeriesInput"
            >
            <span>№</span>
            <input
              class="hunter-billet__number-input"
              type="text"
              inputmode="numeric"
              maxlength="7"
              :value="billetNumberPart"
              aria-label="Номер охотничьего билета"
              @input="onNumberInput"
            >
          </p>
        </div>
        <input
          v-model="issuingAuthority"
          class="hunter-billet__authority-input"
          type="text"
          aria-label="Наименование исполнительного органа, выдавшего охотничий билет"
        >
        <p class="hunter-billet__authority-hint">
          (наименование исполнительного органа субъекта Российской Федерации, выдавшего охотничий билет)
        </p>
      </header>

      <div class="hunter-billet__body">
        <div class="hunter-billet__photo">
          <img
            v-if="avatarSrc"
            :src="avatarSrc"
            alt=""
            class="hunter-billet__photo-img"
          >
          <span
            v-else
            class="hunter-billet__photo-placeholder"
          >
            Место для фото
          </span>
        </div>

        <div class="hunter-billet__fields">
          <div class="hunter-billet__meta hunter-billet__meta--name">
            <div class="hunter-billet__field hunter-billet__field--grow">
              <input
                class="hunter-billet__value-input"
                type="text"
                :value="fullNameInput"
                aria-label="Фамилия, имя, отчество охотника"
                @input="onFullNameInput"
              >
              <p class="hunter-billet__hint">
                (фамилия, имя, отчество (при наличии) охотника)
              </p>
            </div>
            <div class="hunter-billet__field hunter-billet__field--birthday">
              <ProfileHunterBilletDateField
                :model-value="birthday ?? ''"
                aria-label="Дата рождения"
                @update:model-value="onBirthdayUpdate"
              />
              <p class="hunter-billet__hint">
                (дата рождения)
              </p>
            </div>
          </div>

          <div class="hunter-billet__meta">
            <div class="hunter-billet__field hunter-billet__field--grow">
              <input
                v-model="identityDocument"
                class="hunter-billet__value-input"
                type="text"
                aria-label="Данные основного документа, удостоверяющего личность охотника"
              >
              <p class="hunter-billet__hint">
                (данные основного документа, удостоверяющего личность охотника)
              </p>
            </div>
            <div class="hunter-billet__field hunter-billet__field--birthday">
              <ProfileHunterBilletDateField
                v-model="documentIssueDate"
                aria-label="Дата выдачи документа"
              />
              <p class="hunter-billet__hint">
                (дата выдачи)
              </p>
            </div>
          </div>

          <div class="hunter-billet__meta">
            <div class="hunter-billet__field hunter-billet__field--grow">
              <input
                v-model="federationSubject"
                class="hunter-billet__value-input"
                type="text"
                aria-label="Субъект Российской Федерации"
              >
              <p class="hunter-billet__hint">
                (субъект Российской Федерации)
              </p>
            </div>
            <div class="hunter-billet__field hunter-billet__field--date">
              <ProfileHunterBilletDateField
                v-model="federationDate"
                aria-label="Дата"
              />
              <p class="hunter-billet__hint">
                (дата)
              </p>
            </div>
          </div>
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
  width: 100%;
  max-width: 100%;
  margin-top: 20px;
  color: var(--hunter-billet-ink);
  font-family: 'Times New Roman', 'Liberation Serif', 'Noto Serif', Georgia, serif;
}

.hunter-billet__frame {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 440px;
  padding: 18px 22px 16px;
  border: none;
  outline: 1px solid var(--hunter-billet-line);
  outline-offset: 3px;
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
  overflow: hidden;
}

.hunter-billet__watermark {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.hunter-billet__watermark-img {
  width: min(72%, 380px);
  height: auto;
  opacity: 0.08;
  user-select: none;
}

.hunter-billet__header,
.hunter-billet__body,
.hunter-billet__footer {
  position: relative;
  z-index: 1;
}

.hunter-billet__header {
  margin-bottom: 28px;
  text-align: center;
}

.hunter-billet__title-row {
  display: flex;
  align-items: baseline;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px 24px;
}

.hunter-billet__title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1.15;
}

.hunter-billet__series {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  margin: 0;
  font-size: var(--hunter-billet-field-size);
  font-weight: var(--hunter-billet-field-weight);
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.hunter-billet__series-input,
.hunter-billet__number-input,
.hunter-billet__authority-input,
.hunter-billet__value-input {
  margin: 0;
  border: none;
  border-bottom: 1px solid var(--hunter-billet-line);
  background: transparent;
  color: var(--hunter-billet-ink);
  font-family: 'Times New Roman', 'Liberation Serif', 'Noto Serif', Georgia, serif;
  font-size: var(--hunter-billet-field-size);
  font-weight: var(--hunter-billet-field-weight);
  font-style: normal;
  line-height: 1.25;
  letter-spacing: normal;
  text-align: center;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.hunter-billet__series-input {
  width: 2.4ch;
  min-width: 2.4ch;
  max-width: 2.4ch;
  padding: 0 1px;
  text-align: center;
  box-sizing: content-box;
}

.hunter-billet__number-input {
  width: 7.4ch;
  min-width: 7.4ch;
  max-width: 7.4ch;
  padding: 0 1px;
  text-align: center;
  box-sizing: content-box;
}

.hunter-billet__series-input:focus,
.hunter-billet__number-input:focus,
.hunter-billet__authority-input:focus,
.hunter-billet__value-input:focus {
  border-bottom-color: var(--hunter-billet-line);
}

.hunter-billet__authority-input {
  display: block;
  width: 100%;
  min-height: 1.35em;
  margin-top: 20px;
  padding: 0 0 3px;
  text-align: center;
  box-sizing: border-box;
}

.hunter-billet__authority-hint,
.hunter-billet__hint {
  margin: 3px 0 0;
  color: #8a8a8a;
  font-size: 11px;
  font-style: italic;
  font-weight: 400;
  line-height: 1.25;
  text-align: center;
}

.hunter-billet__body {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
  flex: 1 1 auto;
  min-height: 0;
  margin-bottom: 18px;
}

.hunter-billet__photo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 180px;
  height: 208px;
  border: 1px solid var(--hunter-billet-line);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.55);
  overflow: hidden;
  box-sizing: border-box;
}

.hunter-billet__photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}

.hunter-billet__photo-placeholder {
  padding: 8px;
  color: #8a8a8a;
  font-size: 13px;
  font-style: italic;
  text-align: center;
  line-height: 1.3;
}

.hunter-billet__fields {
  display: flex;
  flex-direction: column;
  gap: 22px;
  min-width: 0;
  padding-top: 6px;
}

.hunter-billet__field {
  min-width: 0;
}

.hunter-billet__field--grow {
  flex: 1 1 auto;
}

.hunter-billet__field--date {
  flex: 0 0 220px;
}

.hunter-billet__value {
  min-height: 1.35em;
  margin: 0;
  padding-bottom: 3px;
  border-bottom: 1px solid var(--hunter-billet-line);
  font-size: var(--hunter-billet-field-size);
  font-weight: var(--hunter-billet-field-weight);
  line-height: 1.25;
  word-break: break-word;
}

.hunter-billet__value-input {
  display: block;
  width: 100%;
  min-height: 1.35em;
  padding: 0 0 3px;
  box-sizing: border-box;
}

.hunter-billet__value--muted {
  font-weight: 400;
}

.hunter-billet__meta {
  display: flex;
  gap: 16px;
  align-items: flex-end;
}

.hunter-billet__field--birthday {
  flex: 0 0 220px;
}

.hunter-billet__field--birthday .hunter-billet__hint,
.hunter-billet__field--date .hunter-billet__hint {
  text-align: center;
}

.hunter-billet__footer {
  display: flex;
  justify-content: flex-end;
  align-items: end;
  flex-shrink: 0;
  margin-top: auto;
  margin-bottom: 12px;
  padding-right: 64px;
}

.hunter-billet__footer .hunter-billet__issue {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
}

.hunter-billet__issue {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  font-family: 'Times New Roman', 'Liberation Serif', 'Noto Serif', Georgia, serif;
  font-size: var(--hunter-billet-field-size);
  font-weight: var(--hunter-billet-field-weight);
  font-style: normal;
  line-height: 1.25;
  white-space: nowrap;
}

.hunter-billet__issue-date {
  width: auto;
  min-width: 0;
  flex: 0 0 auto;
}

@media (max-width: 640px) {
  .hunter-billet__frame {
    height: auto;
    min-height: 440px;
    padding: 14px 14px 12px;
  }

  .hunter-billet__body {
    grid-template-columns: 1fr;
  }

  .hunter-billet__photo {
    width: 112px;
    height: 148px;
  }

  .hunter-billet__title {
    font-size: 18px;
  }

  .hunter-billet__series {
    font-size: var(--hunter-billet-field-size);
  }

  .hunter-billet__value {
    font-size: var(--hunter-billet-field-size);
  }

  .hunter-billet__meta {
    flex-direction: column;
    align-items: stretch;
  }

  .hunter-billet__field--date,
  .hunter-billet__field--birthday {
    flex-basis: auto;
  }
}
</style>
