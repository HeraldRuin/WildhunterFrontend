<script setup lang="ts">
import type { TimerSettingsType } from '~/api/settings'

const props = withDefaults(defineProps<{
  type: TimerSettingsType
  title: string
  sectionTitle: string
  hint: string
  breadcrumbs?: Array<{ label: string, to?: string }>
}>(), {
  breadcrumbs: () => [],
})

const { settings: settingsApi } = useApi()
const notifications = useNotifications()

const timerHours = ref('')
const isLoading = ref(true)
const isSubmitting = ref(false)
const loadError = ref('')
const submitError = ref('')
const fieldError = ref('')

function extractErrorPayload(source: unknown) {
  if (!source || typeof source !== 'object') {
    return null
  }

  const payload = source as {
    success?: boolean
    message?: string
    errors?: Record<string, string[]>
    data?: unknown
  }

  if (
    payload.success === false
    || payload.message
    || payload.errors
  ) {
    return payload
  }

  if (payload.data && payload.data !== source) {
    return extractErrorPayload(payload.data)
  }

  return null
}

function applyFieldErrors(source: unknown) {
  const payload = extractErrorPayload(source)

  if (!payload) {
    return false
  }

  const hoursErrors = payload.errors?.timer_hours

  if (hoursErrors?.length) {
    fieldError.value = hoursErrors[0] ?? ''
    submitError.value = ''
    return true
  }

  if (payload.message) {
    fieldError.value = ''
    submitError.value = payload.message
    return true
  }

  return false
}

function parseTimerHours(data: unknown): string | null {
  if (!data || typeof data !== 'object') {
    return null
  }

  const source = data as Record<string, unknown>
  const raw = source.timer_hours

  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 1) {
    return String(Math.trunc(raw))
  }

  if (typeof raw === 'string' && /^\d+$/.test(raw) && Number(raw) >= 1) {
    return String(Number(raw))
  }

  return null
}

async function loadSettings() {
  isLoading.value = true
  loadError.value = ''
  fieldError.value = ''
  submitError.value = ''

  try {
    const response = await settingsApi.getTimerSettings(props.type)

    if ('success' in response && response.success) {
      const hours = parseTimerHours(response.data)

      if (hours) {
        timerHours.value = hours
        return
      }
    }

    loadError.value = ('message' in response && response.message)
      || 'Не удалось загрузить настройки таймера'
  }
  catch (error) {
    const data = (error as { data?: unknown }).data
    const payload = extractErrorPayload(data)

    loadError.value = payload?.message || 'Не удалось загрузить настройки таймера'
  }
  finally {
    isLoading.value = false
  }
}

async function onSubmit() {
  if (isLoading.value || isSubmitting.value) {
    return
  }

  const hours = Number(timerHours.value)

  if (!Number.isInteger(hours) || hours < 1) {
    fieldError.value = 'Укажите целое число часов не меньше 1'
    submitError.value = ''
    return
  }

  isSubmitting.value = true
  fieldError.value = ''
  submitError.value = ''

  try {
    const response = await settingsApi.saveTimerSettings(props.type, {
      timer_hours: hours,
    })

    if ('success' in response && response.success) {
      const savedHours = parseTimerHours(response.data)

      if (savedHours) {
        timerHours.value = savedHours
      }

      notifications.success(response.message || 'Настройки успешно сохранены')
      return
    }

    if (!applyFieldErrors(response)) {
      submitError.value = 'Не удалось сохранить настройки таймера'
    }
  }
  catch (error) {
    const data = (error as { data?: unknown }).data

    if (!applyFieldErrors(data)) {
      submitError.value = 'Не удалось сохранить настройки таймера'
    }
  }
  finally {
    isSubmitting.value = false
  }
}

function onHoursInput(value: string) {
  timerHours.value = value
  fieldError.value = ''
  submitError.value = ''
}

onMounted(() => {
  void loadSettings()
})
</script>

<template>
  <div class="profile-page">
    <header class="profile-page__header">
      <AppBreadcrumbs :items="breadcrumbs" />

      <ProfileNotificationsBell />
    </header>

    <CommonPageTitle divider>{{ title }}</CommonPageTitle>

    <p v-if="loadError" class="timer-settings__status timer-settings__status--error">
      {{ loadError }}
    </p>

    <section
      v-else
      class="timer-settings__panel"
      :class="{ 'timer-settings__panel--loading': isLoading }"
      :aria-busy="isLoading || isSubmitting || undefined"
    >
      <h2 class="timer-settings__section-title">{{ sectionTitle }}</h2>

      <form class="timer-settings__form" @submit.prevent="onSubmit">
        <CommonFormField
          id="timer-hours"
          label="Размер таймера (часы) *"
          type="text"
          inputmode="numeric"
          digits-only
          required
          no-margin
          :disabled="isLoading || isSubmitting"
          :model-value="timerHours"
          :error="fieldError"
          @update:model-value="onHoursInput"
        />
        <p class="timer-settings__hint">{{ hint }}</p>

        <p v-if="submitError" class="timer-settings__status timer-settings__status--error">
          {{ submitError }}
        </p>

        <CommonSaveButton
          class="timer-settings__save"
          type="submit"
          :disabled="isLoading"
          :loading="isSubmitting"
        >
          Сохранить
        </CommonSaveButton>
      </form>
    </section>
  </div>
</template>

<style scoped>
.profile-page {
  padding: 20px 40px 48px;
  max-width: 960px;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
}

.profile-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 896px;
  max-width: 100%;
  height: 31px;
  margin-bottom: 20px;
  padding: 0;
  box-sizing: border-box;
  background: var(--wh-white);
  border-radius: var(--wh-radius);
  overflow: visible;
}

.timer-settings__panel {
  padding: 24px 28px 28px;
  background: var(--wh-white);
  border: 1px solid var(--wh-gray-200, #ddd);
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.timer-settings__panel--loading {
  pointer-events: none;
}

.timer-settings__section-title {
  margin: 0 0 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--wh-gray-200, #ddd);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--wh-black-text, #1c211c);
}

.timer-settings__form {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
}

.timer-settings__form :deep(.form-field) {
  width: 100%;
}

.timer-settings__hint {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.4;
  color: rgba(0, 0, 0, 0.45);
}

.timer-settings__status {
  margin: 12px 0 0;
  font-size: 14px;
  line-height: 1.4;
}

.timer-settings__status--error {
  color: var(--wh-field-error, #dc2626);
}

.timer-settings__save {
  margin-top: 20px;
}

@media (--wh-tablet) {
  .profile-page {
    padding: 12px 8px 32px;
  }

  .profile-page__header {
    width: 100%;
  }

  .timer-settings__panel {
    padding: 20px;
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
}
</style>
