<script setup lang="ts">
import type { ManagedRoom } from '~/api/rooms'

definePageMeta({
  layout: 'profile',
  path: '/rooms/:id',
})

const route = useRoute()
const { rooms: roomsApi } = useApi()
const authToken = useAuthToken()
const ready = ref(false)

onBeforeMount(() => {
  authToken.initFromStorage()

  if (!authToken.isAuthenticated.value) {
    const { open: openLoginModal } = useLoginModal()
    nextTick(() => openLoginModal())
    void navigateTo('/', { replace: true })
    return
  }

  ready.value = true
})

const isCreateMode = computed(() => route.params.id === 'new')
const roomId = computed(() => Number(route.params.id))

const hotelId = computed(() => {
  const raw = route.query.hotelId
  return typeof raw === 'string' && raw ? raw : null
})

const roomsListTo = computed(() => (
  hotelId.value ? { path: '/rooms', query: { hotelId: hotelId.value } } : '/rooms'
))

type RoomEditTab = 'content' | 'pricing' | 'attributes' | 'ical'

const editTabs: { id: RoomEditTab, label: string }[] = [
  { id: 'content', label: 'Содержимое комнаты' },
  { id: 'pricing', label: 'Ценообразование' },
  { id: 'attributes', label: 'Атрибуты' },
  { id: 'ical', label: 'ICAL' },
]

const room = ref<ManagedRoom | null>(null)
const isLoading = ref(true)
const loadError = ref('')
const activeEditTab = ref<RoomEditTab>('content')
const editTitle = ref('')
const editRating = ref(0)
const editContent = ref('')
const hoverRating = ref(0)
const galleryPreviews = ref<string[]>([])
const galleryInputRef = ref<HTMLInputElement | null>(null)
const selectedGalleryIndex = ref<number | null>(null)
const showForm = computed(() => isCreateMode.value || !!room.value)

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

const hotelTitle = 'Хромой кабан-2'

const hotelEditTo = computed(() => (
  hotelId.value ? `/profile/base/${hotelId.value}` : '/profile/base'
))

const pageTitle = computed(() => (
  isCreateMode.value ? 'Новый номер' : 'Редактирование номера'
))

const breadcrumbs = computed(() => [
  { label: 'Главная', to: '/' },
  { label: 'Параметры' },
  { label: hotelTitle, to: hotelEditTo.value },
  { label: 'Управление базой', to: '/profile/base' },
  { label: 'Управление номерами', to: roomsListTo.value },
  { label: pageTitle.value },
])

useHead({
  title: () => `${pageTitle.value} — WH`,
})

function selectEditTab(tab: RoomEditTab) {
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

function fillFormFromRoom(item: ManagedRoom) {
  editTitle.value = item.title
  editRating.value = 0
  editContent.value = ''
  galleryPreviews.value = item.image_url ? [item.image_url] : []
  selectedGalleryIndex.value = null
}

function resetFormForCreate() {
  room.value = null
  editTitle.value = ''
  editRating.value = 0
  editContent.value = ''
  hoverRating.value = 0
  galleryPreviews.value = []
  selectedGalleryIndex.value = null
  loadError.value = ''
  isLoading.value = false
}

async function loadRoom() {
  if (isCreateMode.value) {
    resetFormForCreate()
    return
  }

  if (!Number.isFinite(roomId.value) || roomId.value <= 0) {
    loadError.value = 'Некорректный идентификатор номера'
    isLoading.value = false
    return
  }

  isLoading.value = true
  loadError.value = ''

  try {
    const response = await roomsApi.getList()

    if ('success' in response && response.success) {
      const match = (response.data?.rooms ?? []).find(item => item.id === roomId.value)

      if (!match) {
        loadError.value = 'Номер не найден'
        return
      }

      room.value = match
      fillFormFromRoom(match)
      return
    }

    loadError.value = extractErrorMessage(response, 'Не удалось загрузить номер')
  }
  catch (error) {
    const data = (error as { data?: unknown }).data
    loadError.value = extractErrorMessage(data, 'Не удалось загрузить номер')
  }
  finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void loadRoom()
})
</script>

<template>
  <div v-if="ready" class="profile-page">
    <div class="room-edit">
      <header class="profile-page__header">
        <AppBreadcrumbs :items="breadcrumbs" />

        <ProfileNotificationsBell />
      </header>

      <div class="room-edit__title-row">
        <CommonPageTitle>{{ pageTitle }}</CommonPageTitle>

        <NuxtLink
          :to="roomsListTo"
          class="room-edit__back"
        >
          <svg
            class="room-edit__back-icon"
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
          Назад к списку номеров
        </NuxtLink>
      </div>

      <div class="room-edit__panel-area">
        <div v-if="loadError || isLoading" class="room-edit__panel">
          <div class="room-edit__body">
            <p v-if="loadError" class="room-edit__status room-edit__status--error">
              {{ loadError }}
            </p>

            <div
              v-else
              class="room-edit__loading"
              aria-live="polite"
            >
              <CommonSpinner variant="ring" size="lg" label="Загрузка номера" />
            </div>
          </div>
        </div>

        <div v-else-if="showForm" class="room-edit__panel">
          <div class="room-edit__panel-top">
            <nav class="room-edit__nav" aria-label="Разделы редактирования">
              <button
                v-for="tab in editTabs"
                :key="tab.id"
                type="button"
                class="room-edit__nav-link"
                :class="{ 'room-edit__nav-link--active': activeEditTab === tab.id }"
                @click="selectEditTab(tab.id)"
              >
                {{ tab.label }}
              </button>
            </nav>
          </div>

          <div class="room-edit__body">
            <div v-if="activeEditTab === 'content'" class="room-edit__content">
              <div class="room-edit__form">
                <div class="room-edit__form-row">
                  <CommonFormField
                    v-model="editTitle"
                    label="Название"
                    placeholder="Название номера"
                    no-margin
                  />
                  <div class="room-edit__rating">
                    <span class="room-edit__rating-label">Рейтинг</span>
                    <div
                      class="room-edit__stars"
                      role="radiogroup"
                      aria-label="Рейтинг"
                      @mouseleave="onRatingLeave"
                    >
                      <button
                        v-for="star in ratingStars"
                        :key="star"
                        type="button"
                        class="room-edit__star"
                        :class="{ 'room-edit__star--active': star <= displayRating }"
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
                        class="room-edit__rating-clear"
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
                  class="room-edit__form-content"
                  label="Контент"
                  placeholder=""
                  multiline
                  :rows="4"
                  no-margin
                />
              </div>

              <section class="room-edit__gallery" aria-label="Галерея">
                <h3 class="room-edit__gallery-title">Галерея</h3>

                <div v-if="galleryPreviews.length" class="room-edit__gallery-list">
                  <div
                    v-for="(src, index) in galleryPreviews"
                    :key="`${src}-${index}`"
                    class="room-edit__gallery-item"
                    :class="{ 'room-edit__gallery-item--selected': selectedGalleryIndex === index }"
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
                      class="room-edit__gallery-image"
                    >
                    <button
                      v-if="selectedGalleryIndex === index"
                      type="button"
                      class="room-edit__gallery-remove"
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
                  class="room-edit__gallery-input"
                  accept="image/*"
                  multiple
                  @change="onGalleryFilesSelected"
                >

                <button
                  type="button"
                  class="room-edit__gallery-btn"
                  @click="openGalleryPicker"
                >
                  <svg
                    class="room-edit__gallery-btn-icon"
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
          </div>

          <div class="room-edit__actions">
            <CommonSaveButton type="button" class="room-edit__actions-save" />
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
  padding: 20px 40px 16px;
  padding-left: 20px;
  box-sizing: border-box;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  overflow: hidden;
}

.room-edit {
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

.room-edit__title-row {
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

.room-edit__title-row :deep(.page-title) {
  margin: 0;
  flex: 1;
  min-width: 0;
}

.room-edit__panel-area {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.room-edit__panel-top {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.room-edit__back {
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

.room-edit__back:hover {
  opacity: 0.92;
}

.room-edit__back-icon {
  flex-shrink: 0;
}

.room-edit__status {
  margin: 16px 0 0;
  color: rgba(0, 0, 0, 0.55);
  font-size: 16px;
}

.room-edit__status--error {
  color: #dc3545;
}

.room-edit__loading {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 220px;
}

.room-edit__panel {
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

.room-edit__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  margin-top: 32px;
  overflow: auto;
}

.room-edit__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
  margin-top: 24px;
}

.room-edit__actions-save {
  margin-left: auto;
}

.room-edit__nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 28px;
  min-width: 0;
}

.room-edit__nav-link {
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

.room-edit__nav-link::after {
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

.room-edit__nav-link--active::after {
  transform: scaleX(1);
}

.room-edit__nav-link:not(.room-edit__nav-link--active)::after {
  transition-duration: 0s;
}

.room-edit__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.room-edit__content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.room-edit__form-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px 24px;
  align-items: start;
}

.room-edit__gallery {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.room-edit__gallery-title {
  margin: 0;
  color: var(--wh-gray-900);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.05em;
}

.room-edit__gallery-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
}

.room-edit__gallery-item {
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

.room-edit__gallery-item--selected {
  border-color: var(--wh-orange-500);
}

.room-edit__gallery-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.room-edit__gallery-remove {
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

.room-edit__gallery-remove:hover {
  background: #dc3545;
  color: var(--wh-white);
  transform: scale(1.05);
}

.room-edit__gallery-input {
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

.room-edit__gallery-btn {
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

.room-edit__gallery-btn:hover {
  border-color: var(--wh-orange-600);
  background: var(--wh-orange-600);
}

.room-edit__gallery-btn-icon {
  flex-shrink: 0;
}

.room-edit__rating {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.room-edit__rating-label {
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.05em;
  color: var(--wh-gray-900);
}

.room-edit__stars {
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

.room-edit__star {
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

.room-edit__star svg {
  display: block;
  overflow: visible;
  fill: none;
  stroke: currentColor;
}

.room-edit__star:hover {
  transform: scale(1.06);
}

.room-edit__star--active {
  color: var(--wh-orange-500);
}

.room-edit__star--active svg {
  fill: currentColor;
}

.room-edit__rating-clear {
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

.room-edit__rating-clear:hover {
  color: var(--wh-orange-500);
}

.room-edit__form-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.room-edit__form-content :deep(.form-field__control) {
  display: flex;
}

.room-edit__form-content :deep(.form-field__input--textarea) {
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

  .room-edit__panel-area {
    flex: none;
    min-height: 0;
  }

  .room-edit__panel {
    flex: none;
    min-height: calc(100dvh - 220px);
  }

  .room-edit__body {
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

  .room-edit__panel {
    min-height: calc(100dvh - 260px);
  }

  .profile-page__header {
    height: auto;
    min-height: 31px;
    padding: 0;
    background: transparent;
    border-radius: 0;
  }

  .room-edit__panel-top {
    flex-direction: column;
    align-items: stretch;
  }

  .room-edit__title-row {
    flex-wrap: wrap;
  }

  .room-edit__back {
    align-self: flex-start;
  }

  .room-edit__nav {
    gap: 16px 20px;
  }

  .room-edit__form-row {
    grid-template-columns: 1fr;
  }
}
</style>
