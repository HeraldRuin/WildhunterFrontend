<script setup lang="ts">
import type { ManagedHotel } from '~/api/hotels'

definePageMeta({
  layout: 'profile',
  middleware: 'baseadmin',
})

const route = useRoute()
const { hotels: hotelsApi } = useApi()

const hotelId = computed(() => Number(route.params.id))

type BaseHotelEditTab = 'content' | 'places' | 'pricing' | 'attributes'

const editTabs: { id: BaseHotelEditTab, label: string }[] = [
  { id: 'content', label: 'Контент базы' },
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

      <CommonPageTitle divider>{{ pageTitle }}</CommonPageTitle>

      <div class="base-edit__panel-area">
        <div v-if="loadError || isLoading" class="base-edit__panel base-edit__panel--compact">
          <div class="base-edit__panel-top">
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

          <div class="base-edit__body">
            <div v-if="activeEditTab === 'content'" class="base-edit__form">
              <div class="base-edit__form-left">
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
                :rows="8"
                no-margin
              />
            </div>
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
  background: var(--wh-white);
  border-radius: var(--wh-radius);
  overflow: visible;
}

.base-edit :deep(.page-title--divider) {
  flex-shrink: 0;
  width: 100%;
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
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.base-edit__back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 28px;
  border: none;
  border-radius: var(--wh-radius-lg);
  background: var(--wh-green);
  color: var(--wh-white);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.4;
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
  box-sizing: border-box;
}

.base-edit__back:hover {
  background: var(--wh-green);
  transform: var(--wh-button-hover-lift);
}

.base-edit__panel--compact .base-edit__panel-top {
  justify-content: flex-end;
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
  flex: 1;
  min-height: 0;
  margin-top: 20px;
  overflow: auto;
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
  display: grid;
  grid-template-columns: minmax(180px, 320px) minmax(0, 1fr);
  gap: 16px 24px;
  align-items: start;
}

.base-edit__form-left {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
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
  min-width: 0;
}

.base-edit__form :deep(.form-field__input--textarea) {
  min-height: 200px;
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

  .base-edit__back {
    align-self: flex-start;
  }

  .base-edit__nav {
    gap: 16px 20px;
  }

  .base-edit__form {
    grid-template-columns: 1fr;
  }

  .base-edit__form-left {
    gap: 12px;
  }
}
</style>
