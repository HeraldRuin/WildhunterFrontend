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
}>()

const fullName = computed(() => {
  const parts = [props.lastName, props.firstName]
    .map(part => String(part ?? '').trim())
    .filter(Boolean)

  return parts.join(' ')
})

const birthdayDisplay = computed(() => String(props.birthday ?? '').trim())

function onFullNameInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  const trimmed = value.replace(/^\s+/, '')
  const spaceIndex = trimmed.search(/\s/)

  if (spaceIndex === -1) {
    emit('update:lastName', trimmed)
    emit('update:firstName', '')
    return
  }

  emit('update:lastName', trimmed.slice(0, spaceIndex))
  emit('update:firstName', trimmed.slice(spaceIndex + 1).replace(/^\s+/, ''))
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
const issueDay = ref('')
const issueYear = ref('')

function clampDatePart(raw: string, max: number) {
  if (!raw) {
    return ''
  }

  // пока одна цифра — оставляем как есть (кроме 0 для дня можно оставить)
  if (raw.length === 1) {
    return raw
  }

  const numeric = Number.parseInt(raw, 10)

  if (Number.isNaN(numeric)) {
    return ''
  }

  if (numeric > max) {
    return String(max)
  }

  if (numeric === 0) {
    return '0'
  }

  return raw.slice(0, 2)
}

function canAppendMonthDigit(current: string, digit: string) {
  const next = `${current}${digit}`
  const value = Number.parseInt(next, 10)

  if (Number.isNaN(value)) {
    return false
  }

  if (next.length === 1) {
    return value <= 12
  }

  return value >= 1 && value <= 12
}

function canAppendDayDigit(current: string, digit: string) {
  const next = `${current}${digit}`
  const value = Number.parseInt(next, 10)

  if (Number.isNaN(value)) {
    return false
  }

  if (next.length === 1) {
    return value <= 31
  }

  return value >= 1 && value <= 31
}

function sanitizeIssueDay(value: string) {
  const cleaned = value.replace(/[^\d .]/g, '')
  let day = ''
  let separator = ''
  let month = ''

  for (const char of cleaned) {
    if (char === ' ' || char === '.') {
      if (!separator && day.length > 0) {
        separator = char
      }
      continue
    }

    if (!separator) {
      if (day.length >= 2) {
        continue
      }

      if (!canAppendDayDigit(day, char)) {
        continue
      }

      day += char
      continue
    }

    if (month.length >= 2) {
      continue
    }

    if (!canAppendMonthDigit(month, char)) {
      continue
    }

    month += char
  }

  day = clampDatePart(day, 31)
  month = clampDatePart(month, 12)

  if (!separator) {
    return day
  }

  return `${day}${separator}${month}`
}

function onIssueDayInput(event: Event) {
  const input = event.target as HTMLInputElement
  const next = sanitizeIssueDay(input.value)
  input.value = next
  issueDay.value = next
}

function onIssueYearInput(event: Event) {
  const input = event.target as HTMLInputElement
  const next = input.value.replace(/\D/g, '').slice(0, 4)
  input.value = next
  issueYear.value = next
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
        <p class="hunter-billet__authority">
          &nbsp;
        </p>
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
                :value="fullName"
                aria-label="Фамилия, имя, отчество охотника"
                @input="onFullNameInput"
              >
              <p class="hunter-billet__hint">
                (фамилия, имя, отчество (при наличии) охотника)
              </p>
            </div>
            <div class="hunter-billet__field hunter-billet__field--birthday">
              <input
                class="hunter-billet__value-input"
                type="text"
                :value="birthdayDisplay"
                readonly
                aria-label="Дата рождения"
                placeholder=""
              >
              <p class="hunter-billet__hint">
                (дата рождения)
              </p>
            </div>
          </div>

          <div class="hunter-billet__field">
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

          <div class="hunter-billet__meta">
            <div class="hunter-billet__field hunter-billet__field--grow">
              <p class="hunter-billet__value hunter-billet__value--muted">
                &nbsp;
              </p>
              <p class="hunter-billet__hint">
                (субъект Российской Федерации)
              </p>
            </div>
            <div class="hunter-billet__field hunter-billet__field--date">
              <p class="hunter-billet__value hunter-billet__value--muted">
                &nbsp;
              </p>
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
          <span>«</span>
          <input
            class="hunter-billet__issue-input hunter-billet__issue-input--day"
            type="text"
            inputmode="text"
            maxlength="5"
            :value="issueDay"
            aria-label="День выдачи"
            @input="onIssueDayInput"
          >
          <span>»</span>
          <input
            class="hunter-billet__issue-input hunter-billet__issue-input--year"
            type="text"
            inputmode="numeric"
            maxlength="4"
            :value="issueYear"
            aria-label="Год выдачи"
            @input="onIssueYearInput"
          >
          <span>г.</span>
        </div>
      </footer>
    </div>
  </article>
</template>

<style scoped>
.hunter-billet {
  --hunter-billet-ink: #5c5c5c;
  --hunter-billet-line: #9a9a9a;
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
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.hunter-billet__series-input {
  width: 2.4ch;
  min-width: 2.4ch;
  max-width: 2.4ch;
  margin: 0;
  padding: 0 1px;
  border: none;
  border-bottom: 1px solid var(--hunter-billet-line);
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
  outline: none;
  box-sizing: content-box;
}

.hunter-billet__number-input {
  width: 7.4ch;
  min-width: 7.4ch;
  max-width: 7.4ch;
  margin: 0;
  padding: 0 1px;
  border: none;
  border-bottom: 1px solid var(--hunter-billet-line);
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
  outline: none;
  box-sizing: content-box;
}

.hunter-billet__series-input:focus,
.hunter-billet__number-input:focus {
  border-bottom-color: var(--hunter-billet-line);
}

.hunter-billet__authority {
  min-height: 1.35em;
  margin: 20px 0 0;
  border-bottom: 1px solid var(--hunter-billet-line);
  font-size: 14px;
  line-height: 1.2;
}

.hunter-billet__authority-hint,
.hunter-billet__hint {
  margin: 3px 0 0;
  color: #8a8a8a;
  font-size: 11px;
  font-style: italic;
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
  flex: 0 0 140px;
}

.hunter-billet__value {
  min-height: 1.35em;
  margin: 0;
  padding-bottom: 3px;
  border-bottom: 1px solid var(--hunter-billet-line);
  font-size: 17px;
  font-weight: 600;
  line-height: 1.25;
  word-break: break-word;
}

.hunter-billet__value-input {
  display: block;
  width: 100%;
  min-height: 1.35em;
  margin: 0;
  padding: 0 0 3px;
  border: none;
  border-bottom: 1px solid var(--hunter-billet-line);
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.25;
  outline: none;
  box-sizing: border-box;
}

.hunter-billet__value-input:focus {
  border-bottom-color: var(--hunter-billet-line);
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
  flex: 0 0 120px;
}

.hunter-billet__field--birthday .hunter-billet__value-input {
  text-align: center;
}

.hunter-billet__field--birthday .hunter-billet__hint {
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

.hunter-billet__issue {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  font-size: 14px;
  line-height: 1.3;
  text-align: right;
  white-space: nowrap;
}

.hunter-billet__issue-input {
  margin: 0;
  padding: 0 1px 1px;
  border: none;
  border-bottom: 1px solid var(--hunter-billet-line);
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
  outline: none;
  box-sizing: content-box;
}

.hunter-billet__issue-input--day {
  width: 5.2ch;
  min-width: 5.2ch;
  max-width: 5.2ch;
}

.hunter-billet__issue-input--year {
  width: 4.6ch;
  min-width: 4.6ch;
  max-width: 4.6ch;
  margin-left: 8px;
  padding-left: 0;
  padding-right: 0;
  border: none;
  border-bottom: 1px solid var(--hunter-billet-line);
  padding-bottom: 1px;
}

.hunter-billet__issue-input:focus {
  border-bottom-color: var(--hunter-billet-line);
}

.hunter-billet__issue-input--year:focus {
  border-bottom: 1px solid var(--hunter-billet-line);
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
    font-size: 14px;
  }

  .hunter-billet__value {
    font-size: 15px;
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
