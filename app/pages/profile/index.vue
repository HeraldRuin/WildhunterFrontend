<script setup lang="ts">
definePageMeta({
  layout: 'profile',
  middleware: 'auth',
})

useHead({
  title: 'Мой профиль — WH',
})

import {
  formatApiDate,
  formatBirthdayDate,
  parseBirthdayDate,
} from '~/utils/date'
import { extractPhoneDigits, formatPhone } from '~/utils/phone'
import { useUserApi, type AvatarHistoryItem } from '~/api/user'
import type { ProfileUser } from '~/types/user'

const { user } = useAuth()
const { profile, pending, error, loadProfile, saveProfile } = useProfile()
const { getAvatarHistory } = useUserApi()
const notifications = useNotifications()

const revealValues = ref(false)
const isSubmitting = ref(false)
const submitError = ref('')
const fieldErrors = ref<Record<string, string[]>>({})
const avatarFile = ref<File | null>(null)
const avatarObjectUrl = ref<string | null>(null)
const selectedAvatarId = ref<number | null>(null)
const selectedHistoryUrl = ref<string | null>(null)
const isAvatarHistoryOpen = ref(false)
const avatarHistoryRef = ref<HTMLElement | null>(null)
const avatarHistory = ref<AvatarHistoryItem[]>([])
const avatarHistoryLoading = ref(false)
const avatarHistoryError = ref('')
const isBirthdayOpen = ref(false)
const birthdayFieldRef = ref<HTMLElement | null>(null)
const birthdayDate = ref<Date | null>(null)
const birthdayActivePart = ref<'start' | 'end' | null>('start')
const profileSnapshot = ref<string | null>(null)

type ProfileField =
  | 'user_name'
  | 'nik'
  | 'email'
  | 'first_name'
  | 'last_name'
  | 'phone'
  | 'birthday'
  | 'bio'
  | 'avatar'

const breadcrumbs = [
  { label: 'Главная', to: '/' },
  { label: 'Мой профиль' },
]

const isFormLoading = computed(() => pending.value && !profile.value)
const showForm = computed(() => Boolean(profile.value) || pending.value)

function snapshotProfile(data: ProfileUser) {
  return JSON.stringify({
    user_name: data.user_name.trim(),
    email: data.email.trim(),
    first_name: data.first_name.trim(),
    last_name: data.last_name.trim(),
    phone: extractPhoneDigits(data.phone),
    birthday: resolveBirthdayForApi(data.birthday),
    bio: data.bio.trim(),
  })
}

function rememberProfileSnapshot(data: ProfileUser | null | undefined) {
  profileSnapshot.value = data ? snapshotProfile(data) : null
}

const hasProfileChanges = computed(() => {
  if (!profile.value || !profileSnapshot.value) {
    return false
  }

  if (avatarFile.value || selectedAvatarId.value != null) {
    return true
  }

  return profileSnapshot.value !== snapshotProfile(profile.value)
})

const profileId = computed(() => {
  const id = profile.value?.id || user.value?.id
  return id && Number(id) > 0 ? Number(id) : null
})

const FORM_AVATAR_PLACEHOLDER = '/images/input%20field.png'

const avatarPreview = computed(() =>
  avatarObjectUrl.value || selectedHistoryUrl.value || profile.value?.avatar || null,
)
const avatarPreviewFailed = ref(false)

watch(avatarPreview, () => {
  avatarPreviewFailed.value = false
})

const showAvatarPreview = computed(() => Boolean(avatarPreview.value) && !avatarPreviewFailed.value)

const isAvatarHistoryEmpty = computed(() =>
  isAvatarHistoryOpen.value
  && !avatarHistoryLoading.value
  && !avatarHistoryError.value
  && avatarHistory.value.length === 0,
)

const isAvatarHistoryPanelVisible = computed(() =>
  isAvatarHistoryOpen.value && !isAvatarHistoryEmpty.value,
)

const isAvatarFileBtnVisible = computed(() =>
  !isAvatarHistoryOpen.value || isAvatarHistoryEmpty.value,
)

function handleAvatarPreviewError() {
  avatarPreviewFailed.value = true
}

watch(
  profile,
  (next, prev) => {
    if (!next) {
      revealValues.value = false
      birthdayDate.value = null
      rememberProfileSnapshot(null)
      return
    }

    birthdayDate.value = parseBirthdayDate(next.birthday)
    rememberProfileSnapshot(next)

    if (!prev) {
      revealValues.value = false
      nextTick(() => {
        revealValues.value = true
      })
      return
    }

    revealValues.value = true
  },
  { immediate: true },
)

function handleBirthdayDocumentClick(event: MouseEvent) {
  if (!birthdayFieldRef.value?.contains(event.target as Node)) {
    isBirthdayOpen.value = false
  }

  if (!avatarHistoryRef.value?.contains(event.target as Node)) {
    isAvatarHistoryOpen.value = false
  }
}

onMounted(() => {
  loadProfile()
  document.addEventListener('click', handleBirthdayDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleBirthdayDocumentClick)

  if (avatarObjectUrl.value) {
    URL.revokeObjectURL(avatarObjectUrl.value)
  }
})

function getFieldError(field: ProfileField) {
  if (field === 'user_name') {
    return fieldErrors.value.user_name?.[0] || fieldErrors.value.nik?.[0]
  }

  return fieldErrors.value[field]?.[0]
}

function clearFieldError(field: ProfileField) {
  const keys = field === 'user_name' ? ['user_name', 'nik'] : [field]
  let changed = false
  const nextErrors = { ...fieldErrors.value }

  for (const key of keys) {
    if (!nextErrors[key]) {
      continue
    }

    delete nextErrors[key]
    changed = true
  }

  if (!changed) {
    return
  }

  fieldErrors.value = nextErrors
  submitError.value = ''
}

function getApiErrorPayload(source: unknown) {
  if (!source || typeof source !== 'object') {
    return null
  }

  const payload = source as {
    success?: boolean
    message?: string
    errors?: Record<string, string[]> | unknown[]
    error_code?: string
    code?: string
  }

  if (
    payload.success === false
    || payload.message
    || payload.error_code
    || payload.code
    || payload.errors
  ) {
    return payload
  }

  const nestedData = (source as { data?: unknown }).data

  if (nestedData && nestedData !== source) {
    return getApiErrorPayload(nestedData)
  }

  return null
}

function applyValidationErrors(data: unknown) {
  const response = getApiErrorPayload(data)

  if (!response) {
    return false
  }

  const normalized: Record<string, string[]> = {}
  const rawErrors = response.errors

  if (rawErrors && !Array.isArray(rawErrors)) {
    Object.assign(normalized, rawErrors)
  }

  if (Object.keys(normalized).length > 0) {
    fieldErrors.value = normalized
    submitError.value = ''
    return true
  }

  if (response.message) {
    fieldErrors.value = {}
    submitError.value = response.message
    return true
  }

  return false
}

function setProfileField(
  field: 'user_name' | 'email' | 'first_name' | 'last_name' | 'phone' | 'birthday' | 'bio',
  value: string,
) {
  if (!profile.value) {
    return
  }

  profile.value[field] = field === 'phone' ? formatPhone(value) : value
  clearFieldError(field)

  if (field === 'birthday') {
    birthdayDate.value = parseBirthdayDate(value)
  }
}

function handlePhoneKeydown(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return
  }

  const allowedKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'Escape',
    'Enter',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ]

  if (allowedKeys.includes(event.key)) {
    return
  }

  if (!/^\d$/.test(event.key)) {
    event.preventDefault()
    return
  }

  if (extractPhoneDigits(profile.value?.phone ?? '').length >= 10) {
    event.preventDefault()
  }
}

function handlePhonePaste(event: ClipboardEvent) {
  event.preventDefault()

  if (!profile.value || isFormLoading.value || isSubmitting.value) {
    return
  }

  profile.value.phone = formatPhone(event.clipboardData?.getData('text') ?? '')
  clearFieldError('phone')
}

function toggleBirthdayCalendar() {
  if (isFormLoading.value || isSubmitting.value) {
    return
  }

  isBirthdayOpen.value = !isBirthdayOpen.value
  birthdayActivePart.value = 'start'
}

function onBirthdaySelect(date: Date) {
  if (!profile.value) {
    return
  }

  birthdayDate.value = date
  profile.value.birthday = formatBirthdayDate(date)
  clearFieldError('birthday')
  isBirthdayOpen.value = false
}

function resolveBirthdayForApi(value: string) {
  const parsed = parseBirthdayDate(value)
  return parsed ? formatApiDate(parsed) : value.trim()
}

function clearSelectedHistoryAvatar() {
  selectedAvatarId.value = null
  selectedHistoryUrl.value = null
}

function unwrapAvatarHistoryItems(payload: unknown): AvatarHistoryItem[] {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is AvatarHistoryItem =>
      Boolean(item && typeof item === 'object' && typeof item.url === 'string' && item.url),
    )
  }

  if (payload && typeof payload === 'object' && 'data' in payload) {
    return unwrapAvatarHistoryItems((payload as { data: unknown }).data)
  }

  return []
}

async function loadAvatarHistory() {
  avatarHistoryLoading.value = true
  avatarHistoryError.value = ''

  try {
    const response = await getAvatarHistory()

    if ('success' in response && response.success) {
      avatarHistory.value = unwrapAvatarHistoryItems(response.data)
      return
    }

    avatarHistory.value = []
    avatarHistoryError.value = 'Не удалось загрузить историю'
  } catch (error) {
    avatarHistory.value = []
    const status = (error as { statusCode?: number }).statusCode

    avatarHistoryError.value = status === 404
      ? 'История аватаров пока недоступна на сервере'
      : 'Не удалось загрузить историю'
  } finally {
    avatarHistoryLoading.value = false
  }
}

async function toggleAvatarHistory() {
  if (isSubmitting.value) {
    return
  }

  const willOpen = !isAvatarHistoryOpen.value
  isAvatarHistoryOpen.value = willOpen

  if (willOpen) {
    await loadAvatarHistory()
  }
}

function selectHistoryAvatar(item: AvatarHistoryItem) {
  if (avatarObjectUrl.value) {
    URL.revokeObjectURL(avatarObjectUrl.value)
    avatarObjectUrl.value = null
  }

  avatarFile.value = null
  selectedAvatarId.value = item.id
  selectedHistoryUrl.value = item.url
  isAvatarHistoryOpen.value = false
  clearFieldError('avatar')
}

function handleAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] || null

  if (avatarObjectUrl.value) {
    URL.revokeObjectURL(avatarObjectUrl.value)
    avatarObjectUrl.value = null
  }

  clearSelectedHistoryAvatar()
  avatarFile.value = file
  clearFieldError('avatar')

  if (file) {
    isAvatarHistoryOpen.value = false
    avatarObjectUrl.value = URL.createObjectURL(file)
  }
}

async function handleSubmit() {
  if (!profile.value || isFormLoading.value || isSubmitting.value || !hasProfileChanges.value) {
    return
  }

  isSubmitting.value = true
  submitError.value = ''
  fieldErrors.value = {}

  try {
    const response = await saveProfile({
      email: profile.value.email,
      first_name: profile.value.first_name,
      last_name: profile.value.last_name,
      nik: profile.value.user_name,
      birthday: resolveBirthdayForApi(profile.value.birthday),
      phone: profile.value.phone,
      bio: profile.value.bio,
      hunter_billet_number: profile.value.hunter_billet_number,
      avatar: avatarFile.value,
      avatar_id: selectedAvatarId.value,
    })

    if ('success' in response && response.success) {
      notifications.success(response.message || 'Данные профиля сохранены')
      avatarFile.value = null
      clearSelectedHistoryAvatar()
      avatarHistory.value = []
      avatarHistoryError.value = ''

      if (avatarObjectUrl.value) {
        URL.revokeObjectURL(avatarObjectUrl.value)
        avatarObjectUrl.value = null
      }

      return
    }

    if (!applyValidationErrors(response)) {
      submitError.value = 'Не удалось сохранить профиль'
    }
  } catch (error) {
    const data = (error as { data?: unknown }).data

    if (!applyValidationErrors(data)) {
      submitError.value = 'Не удалось сохранить профиль'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="profile-page">
    <header class="profile-page__header">
      <AppBreadcrumbs :items="breadcrumbs" />

      <ProfileNotificationsBell />
    </header>

    <CommonPageTitle divider>Настройки</CommonPageTitle>

    <p v-if="error && !showForm" class="profile-page__status profile-page__status--error">{{ error }}</p>

    <form
      v-else-if="showForm"
      class="profile-form"
      :class="{
        'profile-form--loading': isFormLoading,
        'profile-form--reveal': revealValues,
      }"
      :aria-busy="isFormLoading"
      @submit.prevent
    >
      <section class="profile-form__section">
        <h2 class="profile-form__section-title">
          Личная информация
          <CommonSpinner
            v-if="isFormLoading"
            class="profile-form__title-spinner"
            variant="ring"
            :size="18"
            label="Загрузка профиля"
          />
          <span
            v-else-if="profileId"
            class="profile-form__user-id"
            :class="{ 'profile-form__value-reveal': revealValues }"
          >
            ID: {{ profileId }}
          </span>
        </h2>

        <p v-if="error" class="profile-page__status profile-page__status--error">{{ error }}</p>

        <div class="profile-form__grid">
          <div class="profile-form__column">
            <CommonFormField
              id="nickname"
              label="Ник"
              placeholder="Ник пользователя"
              :model-value="profile?.user_name ?? ''"
              :error="getFieldError('user_name')"
              :readonly="isFormLoading || isSubmitting"
              :reveal="revealValues"
              @update:model-value="setProfileField('user_name', $event)"
            />

            <CommonFormField
              id="email"
              label="Email"
              type="email"
              placeholder="Email"
              :model-value="profile?.email ?? ''"
              :error="getFieldError('email')"
              :readonly="isFormLoading || isSubmitting"
              :reveal="revealValues"
              @update:model-value="setProfileField('email', $event)"
            />

            <div class="profile-form__row">
              <CommonFormField
                id="first-name"
                label="Имя"
                placeholder="Имя"
                :model-value="profile?.first_name ?? ''"
                :error="getFieldError('first_name')"
                :readonly="isFormLoading || isSubmitting"
                :reveal="revealValues"
                @update:model-value="setProfileField('first_name', $event)"
              />
              <CommonFormField
                id="last-name"
                label="Фамилия"
                placeholder="Фамилия"
                :model-value="profile?.last_name ?? ''"
                :error="getFieldError('last_name')"
                :readonly="isFormLoading || isSubmitting"
                :reveal="revealValues"
                @update:model-value="setProfileField('last_name', $event)"
              />
            </div>

            <CommonFormField
              id="phone"
              label="Номер телефона"
              type="tel"
              placeholder="+7 (___) ___-__-__"
              inputmode="numeric"
              autocomplete="tel"
              :model-value="profile?.phone ?? ''"
              :error="getFieldError('phone')"
              :readonly="isFormLoading || isSubmitting"
              :reveal="revealValues"
              @keydown="handlePhoneKeydown"
              @paste="handlePhonePaste"
              @update:model-value="setProfileField('phone', $event)"
            />
          </div>

          <div class="profile-form__column">
            <div
              ref="birthdayFieldRef"
              class="profile-form__birthday"
              :class="{ 'profile-form__birthday--open': isBirthdayOpen }"
            >
              <CommonFormField
                id="birthday"
                label="Дата рождения"
                placeholder="дд.мм.гггг"
                autocomplete="bday"
                cursor-pointer
                :model-value="profile?.birthday ?? ''"
                :error="getFieldError('birthday')"
                :readonly="isFormLoading || isSubmitting"
                :reveal="revealValues"
                :open="isBirthdayOpen"
                @click.stop="toggleBirthdayCalendar"
                @update:model-value="setProfileField('birthday', $event)"
              >
                <template #trailing>
                  <button
                    type="button"
                    class="profile-form__calendar-icon"
                    aria-label="Открыть календарь"
                    :disabled="isFormLoading || isSubmitting"
                    @click.stop="toggleBirthdayCalendar"
                  >
                    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <rect x="2.25" y="3.75" width="15.5" height="14" rx="1.75" stroke="currentColor" stroke-width="1.5" />
                      <path d="M2.25 8.25h15.5" stroke="currentColor" stroke-width="1.5" />
                      <path d="M6.5 2.25v3.25M13.5 2.25v3.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                    </svg>
                  </button>
                </template>
                <template v-if="isBirthdayOpen" #append>
                  <div class="profile-form__birthday-panel" @click.stop>
                    <HomeHeroSearchDatePicker
                      v-model:start="birthdayDate"
                      v-model:active-part="birthdayActivePart"
                      mode="single"
                      @select="onBirthdaySelect"
                    />
                  </div>
                </template>
              </CommonFormField>
            </div>

            <CommonFormField
              id="bio"
              label="Обо мне"
              placeholder="Расскажите о себе"
              multiline
              :rows="5"
              :model-value="profile?.bio ?? ''"
              :error="getFieldError('bio')"
              :readonly="isFormLoading || isSubmitting"
              :reveal="revealValues"
              @update:model-value="setProfileField('bio', $event)"
            />

            <div class="profile-form__field profile-form__field--avatar">
              <div class="profile-form__avatar-upload">
                <div
                  class="profile-form__avatar-preview"
                  :class="{ 'profile-form__avatar-preview--default': !showAvatarPreview }"
                >
                  <img
                    v-if="showAvatarPreview"
                    :src="avatarPreview!"
                    alt=""
                    class="profile-form__avatar-photo"
                    :class="{ 'profile-form__value-reveal': revealValues }"
                    @error="handleAvatarPreviewError"
                  >
                  <img
                    v-else
                    :src="FORM_AVATAR_PLACEHOLDER"
                    alt=""
                    class="profile-form__avatar-placeholder"
                    aria-hidden="true"
                  >
                </div>
                <div ref="avatarHistoryRef" class="profile-form__avatar-controls">
                  <div class="profile-form__avatar-label-row">
                    <span class="profile-form__label">Аватар</span>
                    <button
                      type="button"
                      class="profile-form__avatar-history-btn"
                      :class="{ 'profile-form__avatar-history-btn--active': isAvatarHistoryOpen }"
                      title="Ранее загруженные"
                      aria-label="Выбрать из ранее загруженных"
                      :aria-expanded="isAvatarHistoryOpen"
                      :disabled="isSubmitting || Boolean(avatarFile)"
                      @click="toggleAvatarHistory"
                    >
                      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <circle cx="10" cy="10" r="7.25" stroke="currentColor" stroke-width="1.5" />
                        <path
                          d="M10 6.25V10L12.75 11.75"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </button>
                    <span
                      v-if="isAvatarHistoryEmpty"
                      class="profile-form__avatar-history-empty"
                    >
                      Нет сохранённых фото
                    </span>
                  </div>
                  <div
                    v-if="isAvatarHistoryPanelVisible"
                    class="profile-form__avatar-history"
                  >
                    <p v-if="avatarHistoryLoading" class="profile-form__avatar-history-message">
                      Загрузка...
                    </p>
                    <p
                      v-else-if="avatarHistoryError"
                      class="profile-form__avatar-history-message profile-form__avatar-history-message--error"
                    >
                      {{ avatarHistoryError }}
                    </p>
                    <div v-else class="profile-form__avatar-history-grid">
                      <button
                        v-for="item in avatarHistory"
                        :key="item.id"
                        type="button"
                        class="profile-form__avatar-history-item"
                        :class="{
                          'profile-form__avatar-history-item--active': selectedAvatarId === item.id,
                        }"
                        :title="`Фото #${item.id}`"
                        @click="selectHistoryAvatar(item)"
                      >
                        <img :src="item.url" alt="">
                      </button>
                    </div>
                  </div>
                  <label
                    v-if="isAvatarFileBtnVisible"
                    class="profile-form__file-btn"
                    :class="{ 'profile-form__file-btn--error': getFieldError('avatar') }"
                  >
                    {{ avatarFile ? avatarFile.name : 'Прикрепить файл' }}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      :disabled="isFormLoading || isSubmitting"
                      @change="handleAvatarChange"
                    >
                  </label>
                  <p v-if="getFieldError('avatar')" class="profile-form__field-error">
                    {{ getFieldError('avatar') }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <p v-if="submitError" class="profile-form__submit-error">
        {{ submitError }}
      </p>

      <div class="profile-form__actions">
        <CommonSaveButton
          :disabled="isFormLoading || isSubmitting || !hasProfileChanges"
          :loading="isSubmitting"
          @click="handleSubmit"
        />
      </div>
    </form>
  </div>
</template>

<style scoped>
.profile-page {
  padding: 20px 40px 16px;
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
  overflow: visible;
}

.profile-page__status {
  margin: 0;
  color: var(--wh-gray-600);
}

.profile-page__status--error {
  color: var(--wh-field-error);
}

.profile-form--loading {
  pointer-events: none;
  user-select: none;
}

.profile-form--loading :deep(.save-button:disabled) {
  opacity: 1;
  cursor: default;
  transform: none;
}

.profile-form__title-spinner {
  flex-shrink: 0;
}

.profile-form--reveal .profile-form__value-reveal,
.profile-form--reveal :deep(.form-field__input--reveal) {
  animation: profile-value-reveal 0.85s cubic-bezier(0.22, 1, 0.36, 1);
}

.profile-form__avatar-preview img.profile-form__value-reveal {
  animation: profile-value-fade 0.85s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes profile-value-reveal {
  from {
    color: transparent;
  }

  to {
    color: var(--wh-gray-900);
  }
}

@keyframes profile-value-fade {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .profile-form--reveal .profile-form__value-reveal,
  .profile-form--reveal :deep(.form-field__input--reveal),
  .profile-form__avatar-preview img.profile-form__value-reveal {
    animation: none;
  }
}

.profile-form__section {
  width: 896px;
  max-width: 100%;
}

.profile-form__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 24px 40px;
  align-items: start;
}

.profile-form__column {
  min-width: 0;
}

.profile-form__section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 20px;
  font-size: 20px;
  font-weight: 600;
  color: var(--wh-gray-900);
}

.profile-form__user-id {
  font-family: "Inter", sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 120%;
  letter-spacing: -0.05em;
  color: var(--wh-gray-900);
}

.profile-form__calendar-icon {
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

.profile-form__calendar-icon:disabled {
  cursor: default;
  opacity: 0.6;
}

.profile-form__calendar-icon svg {
  display: block;
  width: 20px;
  height: 20px;
}

.profile-form__birthday {
  position: relative;
  z-index: 1;
}

.profile-form__birthday--open {
  z-index: 40;
}

.profile-form__birthday-panel {
  position: relative;
  z-index: 50;
  width: 100%;
  padding: 18px 20px;
  border: 1px solid var(--wh-gray);
  border-radius: 0;
  background: var(--wh-white);
  box-shadow: 0 12px 28px rgb(28 33 28 / 12%);
  box-sizing: border-box;
}

.profile-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.profile-form__label {
  font-family: "Inter", sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.05em;
  color: var(--wh-gray-600);
}

.profile-form__file-btn--error {
  border-color: var(--wh-field-border-error);
  box-shadow: 0 0 0 3px var(--wh-field-focus-ring-error);
}

.profile-form__field-error {
  margin: 0;
  font-family: "Inter", "Manrope", system-ui, sans-serif;
  font-size: 0.875rem;
  line-height: 1.35;
  color: var(--wh-field-error);
}

.profile-form__submit-error {
  width: 896px;
  max-width: 100%;
  margin: 16px 0 0;
  font-family: "Inter", "Manrope", system-ui, sans-serif;
  font-size: 0.875rem;
  line-height: 1.35;
  color: var(--wh-field-error);
}

.profile-form__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.profile-form__field--avatar {
  margin-bottom: 0;
}

.profile-form__avatar-upload {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.profile-form__avatar-controls {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.profile-form__avatar-label-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.profile-form__avatar-history-empty {
  flex: 1;
  min-width: 0;
  color: var(--wh-gray-400);
  font-size: 14px;
  line-height: 130%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-form__avatar-history-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid rgba(0, 0, 0, 0.18);
  border-radius: 8px;
  background: var(--wh-white);
  color: var(--wh-gray-600);
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.profile-form__avatar-history-btn:hover:not(:disabled),
.profile-form__avatar-history-btn:focus-visible:not(:disabled) {
  border-color: var(--wh-orange-500);
  background: rgba(209, 101, 16, 0.08);
  color: var(--wh-orange-500);
}

.profile-form__avatar-history-btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.profile-form__avatar-history-btn--active {
  border-color: var(--wh-orange-500);
  background: rgba(209, 101, 16, 0.08);
  color: var(--wh-orange-500);
}

.profile-form__avatar-history-btn svg {
  width: 16px;
  height: 16px;
}

.profile-form__avatar-history {
  display: flex;
  align-items: center;
  width: 100%;
  height: 48px;
  padding: 6px 10px;
  border: 1px solid var(--wh-field-border);
  border-radius: 10px;
  background: var(--wh-white);
  box-sizing: border-box;
  overflow: hidden;
}

.profile-form__avatar-history-message {
  margin: 0;
  color: var(--wh-gray-400);
  font-size: 14px;
  line-height: 130%;
}

.profile-form__avatar-history-message--error {
  color: var(--wh-field-error);
}

.profile-form__avatar-history-grid {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  overflow-x: auto;
  scrollbar-width: thin;
}

.profile-form__avatar-history-item {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 6px;
  background: #e8eaee;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.profile-form__avatar-history-item:hover,
.profile-form__avatar-history-item:focus-visible {
  border-color: var(--wh-orange-500);
}

.profile-form__avatar-history-item--active {
  border-color: var(--wh-orange-500);
}

.profile-form__avatar-history-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-form__file-btn {
  display: inline-flex;
  align-items: center;
  width: 100%;
  min-height: 48px;
  padding: 12px 14px;
  border: 1px solid var(--wh-field-border);
  border-radius: 10px;
  background: var(--wh-white);
  color: var(--wh-gray-400);
  font-family: "Inter", sans-serif;
  font-weight: 400;
  font-size: 18px;
  line-height: 130%;
  letter-spacing: -0.05em;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease,
    font-weight 0.2s ease;
  box-sizing: border-box;
}

.profile-form__file-btn:hover,
.profile-form__file-btn:focus-within {
  border-color: var(--wh-orange-500);
  background: var(--wh-orange-500);
  color: var(--wh-white);
  font-weight: 600;
}

.profile-form__avatar-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 78px;
  height: 78px;
  flex-shrink: 0;
  margin-top: 8px;
  border-radius: 8px;
  background: #e8eaee;
  overflow: hidden;
}

.profile-form__avatar-preview--default {
  box-sizing: border-box;
  background: var(--wh-white);
}

.profile-form__avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-form__avatar-placeholder {
  object-fit: contain;
}

.profile-form__actions {
  width: 896px;
  max-width: 100%;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.2);
}

@media (--wh-tablet) {
  .profile-page {
    padding: 12px 8px 32px;
  }

  .profile-page__header,
  .profile-form__section,
  .profile-form__submit-error,
  .profile-form__actions {
    width: 100%;
  }

  .profile-form__grid {
    gap: 20px 24px;
  }
}

@media (--wh-mobile) {
  .profile-form__grid {
    grid-template-columns: 1fr;
  }

  .profile-form__row {
    grid-template-columns: 1fr;
  }

  .profile-form__actions :deep(.save-button) {
    width: 346px;
    min-width: 346px;
  }
}
</style>
