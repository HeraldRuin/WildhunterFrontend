<script setup lang="ts">
import type { ManagedHotel } from '~/api/hotels'

definePageMeta({
  layout: 'profile',
  middleware: 'baseadmin',
})

const route = useRoute()
const { hotels: hotelsApi } = useApi()

const hotelId = computed(() => Number(route.params.id))

type BaseHotelEditTab = 'content' | 'policy' | 'places' | 'pricing' | 'attributes'

const editTabs: { id: BaseHotelEditTab, label: string }[] = [
  { id: 'content', label: 'Контент базы' },
  { id: 'policy', label: 'Политика базы' },
  { id: 'places', label: 'Места' },
  { id: 'pricing', label: 'Ценообразование' },
  { id: 'attributes', label: 'Атрибуты' },
]

const hotel = ref<ManagedHotel | null>(null)
const isLoading = ref(true)
const loadError = ref('')
const activeEditTab = ref<BaseHotelEditTab>('content')
const editTitle = ref('')
const editRating = ref(0)
const editContent = ref('')
const hoverRating = ref(0)
const galleryPreviews = ref<string[]>([])
const galleryInputRef = ref<HTMLInputElement | null>(null)
const selectedGalleryIndex = ref<number | null>(null)

type PolicyItem = {
  id: number
  title: string
  content: string
}

let policyItemIdSeq = 0
const policyItems = ref<PolicyItem[]>([])

function addPolicyItem() {
  policyItemIdSeq += 1
  policyItems.value.push({
    id: policyItemIdSeq,
    title: '',
    content: '',
  })
}

function removePolicyItem(id: number) {
  policyItems.value = policyItems.value.filter(item => item.id !== id)
}

const ratingStars = [1, 2, 3, 4, 5] as const

const displayRating = computed(() => hoverRating.value || editRating.value)

function setEditRating(value: number) {
  editRating.value = value
}

function clearEditRating() {
  editRating.value = 0
  hoverRating.value = 0
}

function onRatingHover(value: number) {
  hoverRating.value = value
}

function onRatingLeave() {
  hoverRating.value = 0
}

function openGalleryPicker() {
  galleryInputRef.value?.click()
}

function onGalleryFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? []).filter(file => file.type.startsWith('image/'))

  if (!files.length) {
    return
  }

  galleryPreviews.value = [
    ...galleryPreviews.value,
    ...files.map(file => URL.createObjectURL(file)),
  ]
  selectedGalleryIndex.value = null
  input.value = ''
}

function selectGalleryImage(index: number) {
  selectedGalleryIndex.value = selectedGalleryIndex.value === index ? null : index
}

function removeGalleryImage(index: number) {
  const src = galleryPreviews.value[index]
  if (src?.startsWith('blob:')) {
    URL.revokeObjectURL(src)
  }

  galleryPreviews.value = galleryPreviews.value.filter((_, i) => i !== index)
  selectedGalleryIndex.value = null
}

const pageTitle = computed(() => hotel.value?.title ?? 'Редактирование базы')

const breadcrumbs = computed(() => [
  { label: 'Главная', to: '/' },
  { label: 'Параметры' },
  { label: 'Управление базой', to: '/profile/base' },
  { label: pageTitle.value },
])

useHead({
  title: () => `${pageTitle.value} — WH`,
})

function selectEditTab(tab: BaseHotelEditTab) {
  activeEditTab.value = tab
}

function extractErrorMessage(source: unknown, fallback: string) {
  if (!source || typeof source !== 'object') {
    return fallback
  }

  const payload = source as {
    success?: boolean
    message?: string
    data?: unknown
  }

  if (payload.message) {
    return payload.message
  }

  if (payload.data && payload.data !== source) {
    return extractErrorMessage(payload.data, fallback)
  }

  return fallback
}

function fillFormFromHotel(item: ManagedHotel) {
  editTitle.value = item.title
  editRating.value = 0
  editContent.value = ''
  galleryPreviews.value = item.image_url ? [item.image_url] : []
  selectedGalleryIndex.value = null
  policyItems.value = []
  policyItemIdSeq = 0
}

async function loadHotel() {
  if (!Number.isFinite(hotelId.value) || hotelId.value <= 0) {
    loadError.value = 'Некорректный идентификатор базы'
    isLoading.value = false
    return
  }

  isLoading.value = true
  loadError.value = ''

  try {
    const response = await hotelsApi.getManage()

    if ('success' in response && response.success) {
      const match = (response.data ?? []).find(item => item.id === hotelId.value)

      if (!match) {
        loadError.value = 'База не найдена'
        return
      }

      hotel.value = match
      fillFormFromHotel(match)
      return
    }

    loadError.value = extractErrorMessage(response, 'Не удалось загрузить базу')
  }
  catch (error) {
    const data = (error as { data?: unknown }).data
    loadError.value = extractErrorMessage(data, 'Не удалось загрузить базу')
  }
  finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void loadHotel()
})
</script>

<template>
  <div class="profile-page">
    <div class="base-edit">
      <header class="profile-page__header">
        <AppBreadcrumbs :items="breadcrumbs" />

        <ProfileNotificationsBell />
      </header>

      <div class="base-edit__title-row">
        <CommonPageTitle>{{ pageTitle }}</CommonPageTitle>

        <NuxtLink
          to="/profile/base"
          class="base-edit__back"
        >
          <svg
            class="base-edit__back-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Назад к списку баз
        </NuxtLink>
      </div>

      <div class="base-edit__panel-area">
        <div v-if="loadError || isLoading" class="base-edit__panel">
          <div class="base-edit__body">
            <p v-if="loadError" class="base-edit__status base-edit__status--error">
              {{ loadError }}
            </p>

            <p v-else class="base-edit__status">
              Загрузка...
            </p>
          </div>
        </div>

        <div v-else-if="hotel" class="base-edit__panel">
          <div class="base-edit__panel-top">
            <nav class="base-edit__nav" aria-label="Разделы редактирования">
              <button
                v-for="tab in editTabs"
                :key="tab.id"
                type="button"
                class="base-edit__nav-link"
                :class="{ 'base-edit__nav-link--active': activeEditTab === tab.id }"
                @click="selectEditTab(tab.id)"
              >
                {{ tab.label }}
              </button>
            </nav>
          </div>

          <div class="base-edit__body">
            <div v-if="activeEditTab === 'content'" class="base-edit__content">
              <div class="base-edit__form">
                <div class="base-edit__form-row">
                  <CommonFormField
                    v-model="editTitle"
                    label="Название"
                    placeholder="Название отеля"
                    no-margin
                  />
                  <div class="base-edit__rating">
                    <span class="base-edit__rating-label">Рейтинг</span>
                    <div
                      class="base-edit__stars"
                      role="radiogroup"
                      aria-label="Рейтинг"
                      @mouseleave="onRatingLeave"
                    >
                      <button
                        v-for="star in ratingStars"
                        :key="star"
                        type="button"
                        class="base-edit__star"
                        :class="{ 'base-edit__star--active': star <= displayRating }"
                        :aria-label="`${star} из 5`"
                        :aria-checked="star === editRating"
                        role="radio"
                        @mouseenter="onRatingHover(star)"
                        @focus="onRatingHover(star)"
                        @blur="onRatingLeave"
                        @click="setEditRating(star)"
                      >
                        <svg
                          width="28"
                          height="28"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path
                            d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.77l-4.94 2.6.94-5.5-4-3.9 5.53-.8L10 1.5Z"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.25"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </button>

                      <button
                        v-if="editRating > 0"
                        type="button"
                        class="base-edit__rating-clear"
                        @mouseenter="onRatingLeave"
                        @click.stop="clearEditRating"
                      >
                        Очистить
                      </button>
                    </div>
                  </div>
                </div>
                <CommonFormField
                  v-model="editContent"
                  class="base-edit__form-content"
                  label="Контент"
                  placeholder=""
                  multiline
                  :rows="4"
                  no-margin
                />
              </div>

              <section class="base-edit__gallery" aria-label="Галерея">
                <h3 class="base-edit__gallery-title">Галерея</h3>

                <div v-if="galleryPreviews.length" class="base-edit__gallery-list">
                  <div
                    v-for="(src, index) in galleryPreviews"
                    :key="`${src}-${index}`"
                    class="base-edit__gallery-item"
                    :class="{ 'base-edit__gallery-item--selected': selectedGalleryIndex === index }"
                    role="button"
                    tabindex="0"
                    :aria-label="`Фото галереи ${index + 1}`"
                    @click="selectGalleryImage(index)"
                    @keydown.enter.prevent="selectGalleryImage(index)"
                    @keydown.space.prevent="selectGalleryImage(index)"
                  >
                    <img
                      :src="src"
                      :alt="`Фото галереи ${index + 1}`"
                      class="base-edit__gallery-image"
                    >
                    <button
                      v-if="selectedGalleryIndex === index"
                      type="button"
                      class="base-edit__gallery-remove"
                      aria-label="Удалить фото"
                      @click.stop="removeGalleryImage(index)"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M9 3.75A1.75 1.75 0 0 1 10.75 2h2.5A1.75 1.75 0 0 1 15 3.75V5h3.25a.75.75 0 0 1 0 1.5H5.75a.75.75 0 0 1 0-1.5H9V3.75Zm1.5.25v1h3v-1a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z" />
                        <path d="M6.3 8.05c.08-.33.38-.55.72-.55h10c.34 0 .64.22.72.55l1.05 12.1A2.25 2.25 0 0 1 16.55 22.5H7.45a2.25 2.25 0 0 1-2.24-2.4L6.3 8.05Zm3.45 2.7a.75.75 0 0 0-1.5.1l.4 7a.75.75 0 0 0 1.5-.09l-.4-7Zm5.5-.1a.75.75 0 0 0-1.5.09l.4 7a.75.75 0 0 0 1.5-.1l-.4-7Z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <input
                  ref="galleryInputRef"
                  type="file"
                  class="base-edit__gallery-input"
                  accept="image/*"
                  multiple
                  @change="onGalleryFilesSelected"
                >

                <button
                  type="button"
                  class="base-edit__gallery-btn"
                  @click="openGalleryPicker"
                >
                  <svg
                    class="base-edit__gallery-btn-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" />
                    <path
                      d="M12 8v8M8 12h8"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                    />
                  </svg>
                  Выбрать изображения
                </button>
              </section>
            </div>

            <div v-else-if="activeEditTab === 'policy'" class="base-edit__policy">
              <div class="base-edit__policy-table">
                <div class="base-edit__policy-head" aria-hidden="true">
                  <span class="base-edit__policy-head-cell">Название</span>
                  <span class="base-edit__policy-head-cell">Контент</span>
                  <span class="base-edit__policy-head-cell base-edit__policy-head-cell--action" />
                </div>

                <div
                  v-for="item in policyItems"
                  :key="item.id"
                  class="base-edit__policy-row"
                >
                  <CommonFormField
                    v-model="item.title"
                    placeholder="Название"
                    no-margin
                  />
                  <CommonFormField
                    v-model="item.content"
                    placeholder="Контент"
                    multiline
                    resizable
                    :rows="1"
                    no-margin
                  />
                  <button
                    type="button"
                    class="base-edit__policy-remove"
                    @click="removePolicyItem(item.id)"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="base-edit__actions">
            <button
              v-if="activeEditTab === 'policy'"
              type="button"
              class="base-edit__policy-add"
              @click="addPolicyItem"
            >
              <svg
                class="base-edit__gallery-btn-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" />
                <path
                  d="M12 8v8M8 12h8"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                />
              </svg>
              Добавить элемент
            </button>

            <CommonSaveButton type="button" class="base-edit__actions-save" />
          </div>
        </div>
      </div>
    </div>
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
  width: 100%;
  padding: 20px 40px 48px;
  padding-left: 20px;
  box-sizing: border-box;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  overflow: hidden;
}

.base-edit {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: stretch;
  min-height: 0;
  max-width: 100%;
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

.base-edit__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
  width: 100%;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
}

.base-edit__title-row :deep(.page-title) {
  margin: 0;
  flex: 1;
  min-width: 0;
}

.base-edit__panel-area {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.base-edit__panel-top {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.base-edit__back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 16px;
  border: 1.5px solid var(--wh-green);
  border-radius: 999px;
  background: var(--wh-green);
  color: var(--wh-white);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
  cursor: pointer;
  transition: opacity 0.15s ease, background 0.15s ease, border-color 0.15s ease;
  box-sizing: border-box;
}

.base-edit__back:hover {
  opacity: 0.92;
}

.base-edit__back-icon {
  flex-shrink: 0;
}

.base-edit__status {
  margin: 16px 0 0;
  color: rgba(0, 0, 0, 0.55);
  font-size: 16px;
}

.base-edit__status--error {
  color: #dc3545;
}

.base-edit__panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  margin-top: 8px;
  padding: 24px;
  border: 1px solid var(--wh-gray-400);
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  box-sizing: border-box;
  overflow: hidden;
}

.base-edit__panel-top {
  flex-shrink: 0;
}

.base-edit__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  margin-top: 32px;
  overflow: auto;
}

.base-edit__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
  margin-top: 24px;
}

.base-edit__actions-save {
  margin-left: auto;
}

.base-edit__nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 28px;
  min-width: 0;
}

.base-edit__nav-link {
  position: relative;
  padding: 10px 0 12px;
  border: none;
  background: none;
  color: var(--wh-gray-900);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.15s ease;
}

.base-edit__nav-link::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  border-radius: 2px;
  background: var(--wh-orange-500);
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.28s ease;
}

.base-edit__nav-link--active::after {
  transform: scaleX(1);
}

.base-edit__nav-link:not(.base-edit__nav-link--active)::after {
  transition-duration: 0s;
}

.base-edit__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.base-edit__content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.base-edit__policy {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  min-width: 0;
  min-height: 0;
}

.base-edit__policy-table {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  min-width: 0;
}

.base-edit__policy-head {
  display: grid;
  grid-template-columns: minmax(0, 0.55fr) minmax(0, 1fr) 110px;
  gap: 16px 16px;
  padding: 10px 12px;
  border: 1px solid var(--wh-gray-400);
  border-radius: 8px;
  background: var(--wh-white);
  box-sizing: border-box;
}

.base-edit__policy-head-cell {
  color: var(--wh-gray-900);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.3;
  text-align: center;
}

.base-edit__policy-head-cell--action {
  width: 110px;
}

.base-edit__policy-row {
  display: grid;
  grid-template-columns: minmax(0, 0.55fr) minmax(0, 1fr) 110px;
  gap: 16px 16px;
  align-items: start;
}

.base-edit__policy-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: calc(18px * 1.3 + 24px);
  padding: 7px 16px;
  border: 1.5px solid #dc3545;
  border-radius: 999px;
  background: #dc3545;
  color: var(--wh-white);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  box-sizing: border-box;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.base-edit__policy-remove:hover {
  border-color: #c82333;
  background: #c82333;
}

.base-edit__policy-add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 16px;
  border: 1.5px solid var(--wh-green);
  border-radius: 999px;
  background: var(--wh-green);
  color: var(--wh-white);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  cursor: pointer;
  transition: opacity 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}

.base-edit__policy-add:hover {
  opacity: 0.92;
}

.base-edit__form-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px 24px;
  align-items: start;
}

.base-edit__gallery {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.base-edit__gallery-title {
  margin: 0;
  color: var(--wh-gray-900);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.05em;
}

.base-edit__gallery-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
}

.base-edit__gallery-item {
  position: relative;
  width: 220px;
  height: 152px;
  border: 1px solid var(--wh-gray-400);
  border-radius: 2px;
  background: #f3f3f3;
  overflow: hidden;
  box-sizing: border-box;
  cursor: pointer;
}

.base-edit__gallery-item--selected {
  border-color: var(--wh-orange-500);
}

.base-edit__gallery-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.base-edit__gallery-remove {
  position: absolute;
  top: 8px;
  right: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: var(--wh-white);
  color: #dc3545;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
}

.base-edit__gallery-remove:hover {
  background: #dc3545;
  color: var(--wh-white);
  transform: scale(1.05);
}

.base-edit__gallery-input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.base-edit__gallery-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 16px;
  border: 1.5px solid var(--wh-orange-500);
  border-radius: 999px;
  background: var(--wh-orange-500);
  color: var(--wh-white);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.base-edit__gallery-btn:hover {
  border-color: var(--wh-orange-600);
  background: var(--wh-orange-600);
}

.base-edit__gallery-btn-icon {
  flex-shrink: 0;
}

.base-edit__rating {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.base-edit__rating-label {
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.05em;
  color: var(--wh-gray-900);
}

.base-edit__stars {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1px solid var(--wh-field-border);
  border-radius: 10px;
  background: var(--wh-white);
}

.base-edit__star {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: none;
  color: #c4c4c4;
  cursor: pointer;
  transition: color 0.15s ease, transform 0.15s ease;
}

.base-edit__star svg {
  display: block;
  overflow: visible;
  fill: none;
  stroke: currentColor;
}

.base-edit__star:hover {
  transform: scale(1.06);
}

.base-edit__star--active {
  color: var(--wh-orange-500);
}

.base-edit__star--active svg {
  fill: currentColor;
}

.base-edit__rating-clear {
  margin-left: auto;
  padding: 0;
  border: none;
  background: none;
  color: var(--wh-gray-900);
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.02em;
  cursor: pointer;
  transition: color 0.15s ease;
}

.base-edit__rating-clear:hover {
  color: var(--wh-orange-500);
}

.base-edit__form-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.base-edit__form-content :deep(.form-field__control) {
  display: flex;
}

.base-edit__form-content :deep(.form-field__input--textarea) {
  width: 100%;
  min-height: 340px;
  height: 340px;
  resize: none;
  box-sizing: border-box;
}

@media (--wh-tablet) {
  .profile-page {
    height: auto;
    max-height: none;
    overflow: visible;
    padding: 12px 8px 32px;
  }

  .base-edit__panel-area {
    flex: none;
    min-height: 0;
  }

  .base-edit__panel {
    flex: none;
    min-height: calc(100dvh - 220px);
  }

  .base-edit__body {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
}

@media (--wh-mobile) {
  .profile-page {
    height: auto;
    max-height: none;
    overflow: visible;
    padding: 16px 20px 32px;
  }

  .base-edit__panel {
    min-height: calc(100dvh - 260px);
  }

  .profile-page__header {
    height: auto;
    min-height: 31px;
    padding: 0;
    background: transparent;
    border-radius: 0;
  }

  .base-edit__panel-top {
    flex-direction: column;
    align-items: stretch;
  }

  .base-edit__title-row {
    flex-wrap: wrap;
  }

  .base-edit__back {
    align-self: flex-start;
  }

  .base-edit__nav {
    gap: 16px 20px;
  }

  .base-edit__form-row {
    grid-template-columns: 1fr;
  }

  .base-edit__policy-head,
  .base-edit__policy-row {
    grid-template-columns: 1fr;
  }

  .base-edit__policy-remove {
    justify-self: end;
  }
}
</style>
