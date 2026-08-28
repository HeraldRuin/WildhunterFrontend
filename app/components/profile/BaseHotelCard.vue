<script setup lang="ts">
import { shouldShowOfferImage, shouldUseCustomOfferPlaceholder } from '~/utils/image'

export type BaseHotelStatus = 'publish' | 'draft'

export interface BaseHotelItem {
  id: number
  title: string
  image: string
  location: string
  price: number
  status: BaseHotelStatus
  updatedAt: string
  isFavorite?: boolean
}

const props = defineProps<{
  item: BaseHotelItem
}>()

const showImage = computed(() => shouldShowOfferImage(props.item.image))
const showCustomPlaceholder = computed(() => shouldUseCustomOfferPlaceholder(props.item.image))

const formattedPrice = computed(() => {
  const value = new Intl.NumberFormat('ru-RU').format(props.item.price).replace(/\s/g, '.')
  return `${value} руб`
})

const statusLabel = computed(() => {
  switch (props.item.status) {
    case 'publish':
      return 'Опубликован'
    case 'draft':
      return 'Черновик'
    default: {
      const exhaustive: never = props.item.status
      return exhaustive
    }
  }
})

const visibilityActionLabel = computed(() => {
  switch (props.item.status) {
    case 'publish':
      return 'Скрыть'
    case 'draft':
      return 'Опубликовать'
    default: {
      const exhaustive: never = props.item.status
      return exhaustive
    }
  }
})

const isEditing = ref(false)

type BaseHotelEditTab = 'content' | 'places' | 'pricing' | 'attributes'

const editTabs: { id: BaseHotelEditTab, label: string }[] = [
  { id: 'content', label: 'Контент базы' },
  { id: 'places', label: 'Места' },
  { id: 'pricing', label: 'Ценообразование' },
  { id: 'attributes', label: 'Атрибуты' },
]

const activeEditTab = ref<BaseHotelEditTab>('content')
const editTitle = ref('')
const editRating = ref('')
const editContent = ref('')

function selectEditTab(tab: BaseHotelEditTab) {
  activeEditTab.value = tab
}

function toggleEdit() {
  isEditing.value = !isEditing.value

  if (isEditing.value) {
    activeEditTab.value = 'content'
    editTitle.value = props.item.title
    editRating.value = ''
    editContent.value = ''
  }
}

function closeEdit() {
  isEditing.value = false
}
</script>

<template>
  <article
    class="base-hotel-card"
    :class="{ 'base-hotel-card--expanded': isEditing }"
  >
    <CommonModalCloseButton
      v-if="isEditing"
      class="base-hotel-card__close"
      @click="closeEdit"
    />

    <div
      class="base-hotel-card__layout"
      :class="{ 'base-hotel-card__layout--expanded': isEditing }"
    >
      <div class="base-hotel-card__media">
      <img
        v-if="showImage"
        :src="item.image"
        :alt="item.title"
        class="base-hotel-card__image"
      >
      <div
        v-else-if="showCustomPlaceholder"
        class="base-hotel-card__placeholder"
        aria-hidden="true"
      >
        <span>Фото отсутствует</span>
      </div>
      <span
        class="base-hotel-card__favorite"
        :class="{ 'base-hotel-card__favorite--active': item.isFavorite }"
        aria-hidden="true"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
            fill="currentColor"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
      </div>

      <div class="base-hotel-card__info">
        <div class="base-hotel-card__body">
          <h2 class="base-hotel-card__title">{{ item.title }}</h2>

          <p class="base-hotel-card__meta">
            <svg class="base-hotel-card__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M21.5 2.5 11 13M21.5 2.5 14.5 21.5 11 13 2.5 9.5 21.5 2.5Z"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            Локация: <span>{{ item.location }}</span>
          </p>

          <p class="base-hotel-card__meta">
            <svg class="base-hotel-card__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M9.2 8.2C9.2 6.5 10.4 5 12 5s2.8 1.5 2.8 3.2c0 .4-.1.8-.3 1.1"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
              />
              <path
                d="M8 10.2h8c.7 0 1.3.6 1.2 1.3-.4 4.2-2.4 8.5-5.2 8.5s-4.8-4.3-5.2-8.5c-.1-.7.5-1.3 1.2-1.3Z"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linejoin="round"
              />
              <path
                d="M12 13v4M10.7 14.6h2.6"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
              />
            </svg>
            Стоимость: <strong class="base-hotel-card__price">{{ formattedPrice }}</strong>
          </p>

          <p class="base-hotel-card__meta">
            <svg class="base-hotel-card__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
                stroke="currentColor"
                stroke-width="1.7"
              />
              <path
                d="M19.4 13a7.5 7.5 0 0 0 0-2l1.7-1.3-1.6-2.8-2 .8a7.6 7.6 0 0 0-1.7-1L15.4 4h-3.2L11.8 6.7a7.6 7.6 0 0 0-1.7 1l-2-.8-1.6 2.8L8.2 11a7.5 7.5 0 0 0 0 2l-1.7 1.3 1.6 2.8 2-.8a7.6 7.6 0 0 0 1.7 1l.4 2.7h3.2l.4-2.7a7.6 7.6 0 0 0 1.7-1l2 .8 1.6-2.8L19.4 13Z"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linejoin="round"
              />
            </svg>
            Статус:
            <span
              class="base-hotel-card__badge"
              :class="`base-hotel-card__badge--${item.status}`"
            >
              {{ statusLabel }}
            </span>
          </p>

          <p class="base-hotel-card__meta base-hotel-card__meta--footer">
            <svg class="base-hotel-card__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="8.25" stroke="currentColor" stroke-width="1.7" />
              <path
                d="M12 8v4.2l2.6 1.6"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            Последнее обновление: <span>{{ item.updatedAt }}</span>
          </p>
        </div>

        <div class="base-hotel-card__actions">
          <NuxtLink
            :to="{ path: '/rooms', query: { hotelId: String(item.id) } }"
            class="base-hotel-card__btn base-hotel-card__btn--info"
          >
            Доступные номера
          </NuxtLink>
          <button
            type="button"
            class="base-hotel-card__btn base-hotel-card__btn--warning"
            @click="toggleEdit"
          >
            Редактировать
          </button>
          <!-- <button type="button" class="base-hotel-card__btn base-hotel-card__btn--clone">
            Клонировать
          </button> -->
          <button type="button" class="base-hotel-card__btn base-hotel-card__btn--danger">
            Удалить
          </button>
          <!-- <button
            type="button"
            class="base-hotel-card__btn"
            :class="item.status === 'publish' ? 'base-hotel-card__btn--secondary' : 'base-hotel-card__btn--success'"
          >
            {{ visibilityActionLabel }}
          </button> -->
        </div>
      </div>

      <div v-if="isEditing" class="base-hotel-card__panel">
        <div class="base-hotel-card__panel-top">
          <nav class="base-hotel-card__nav" aria-label="Разделы редактирования">
            <button
              v-for="tab in editTabs"
              :key="tab.id"
              type="button"
              class="base-hotel-card__nav-link"
              :class="{ 'base-hotel-card__nav-link--active': activeEditTab === tab.id }"
              @click="selectEditTab(tab.id)"
            >
              {{ tab.label }}
            </button>
          </nav>
        </div>

        <div v-if="activeEditTab === 'content'" class="base-hotel-card__form">
          <div class="base-hotel-card__form-left">
            <CommonFormField
              v-model="editTitle"
              label="Название"
              placeholder="Название отеля"
              no-margin
            />
            <CommonFormField
              v-model="editRating"
              label="Рейтинг"
              placeholder=""
              no-margin
            />
          </div>
          <CommonFormField
            v-model="editContent"
            class="base-hotel-card__form-content"
            label="Контент"
            placeholder=""
            multiline
            :rows="4"
            no-margin
          />
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.base-hotel-card {
  display: flex;
  flex-direction: column;
  width: fit-content;
  max-width: 100%;
  border: 1px solid var(--wh-gray-400);
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  box-sizing: border-box;
  overflow: hidden;
}

.base-hotel-card--expanded {
  position: relative;
  width: 100%;
  overflow: visible;
}

.base-hotel-card__close {
  z-index: 2;
}

.base-hotel-card__layout {
  display: grid;
  grid-template-columns: 320px auto;
  align-items: stretch;
  width: fit-content;
  max-width: 100%;
  min-width: 0;
}

.base-hotel-card__layout--expanded {
  grid-template-columns: 320px minmax(280px, 360px) minmax(0, 1fr);
  width: 100%;
}

.base-hotel-card__info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  padding: 20px;
  box-sizing: border-box;
}

.base-hotel-card__panel {
  min-width: 0;
  padding: 20px 20px 20px 24px;
  border-left: 1px solid var(--wh-gray-400);
  box-sizing: border-box;
  animation: base-hotel-card-panel-in 0.35s ease;
}

.base-hotel-card__panel-top {
  display: flex;
  align-items: flex-start;
  padding-right: 40px;
}

.base-hotel-card__nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 28px;
  min-width: 0;
}

.base-hotel-card__nav-link {
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

.base-hotel-card__nav-link::after {
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

.base-hotel-card__nav-link--active::after {
  transform: scaleX(1);
}

.base-hotel-card__nav-link:not(.base-hotel-card__nav-link--active)::after {
  transition-duration: 0s;
}

.base-hotel-card__form {
  display: grid;
  grid-template-columns: minmax(180px, 280px) minmax(0, 1fr);
  gap: 16px 20px;
  align-items: start;
  margin-top: 16px;
}

.base-hotel-card__form-left {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.base-hotel-card__form-content {
  min-width: 0;
}

.base-hotel-card__form :deep(.form-field__input--textarea) {
  min-height: 132px;
}

@keyframes base-hotel-card-panel-in {
  from {
    opacity: 0;
    transform: translateX(-12px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.base-hotel-card__media {
  position: relative;
  width: 100%;
  min-height: 180px;
  overflow: hidden;
  background: #ccc;
}

.base-hotel-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.base-hotel-card__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 170px;
  background: #8a8a8a;
  color: rgb(255 255 255 / 88%);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 500;
}

.base-hotel-card__favorite {
  position: absolute;
  top: 0;
  right: 5px;
  z-index: 2;
  padding: 10px;
  color: #fff;
}

.base-hotel-card__favorite--active {
  color: #ff0000;
}

.base-hotel-card__body {
  min-width: 0;
  width: 100%;
}

.base-hotel-card__title {
  margin: 0 0 10px;
  padding: 0;
  color: #1a2b50;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
}

.base-hotel-card__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0 0 10px;
  color: #5e6d77;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 13px;
  line-height: 1.4;
}

.base-hotel-card__meta--footer {
  margin: 0;
}

.base-hotel-card__icon {
  flex-shrink: 0;
  color: #687882;
}

.base-hotel-card__price {
  color: #000;
  font-size: 15px;
  font-weight: 700;
}

.base-hotel-card__badge {
  display: inline-block;
  min-width: 50px;
  padding: 3px 8px;
  border-radius: 10px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
  text-align: center;
  text-transform: capitalize;
}

.base-hotel-card__badge--publish {
  background: #28a745;
}

.base-hotel-card__badge--draft {
  background: #6c757d;
}

.base-hotel-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 32px;
  justify-content: flex-start;
}

.base-hotel-card__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 50px;
  padding: 5px 10px;
  border: none;
  border-radius: 5px;
  color: #fff;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  text-decoration: none;
  cursor: pointer;
  box-sizing: border-box;
}

.base-hotel-card__btn--info {
  background: #17a2b8;
}

.base-hotel-card__btn--clone {
  background: #007bff;
}

.base-hotel-card__btn--warning {
  background: #ffc107;
}

.base-hotel-card__btn--danger {
  background: #dc3545;
}

.base-hotel-card__btn--secondary {
  background: #6c757d;
}

.base-hotel-card__btn--success {
  background: #28a745;
}

@media (--wh-narrow) {
  .base-hotel-card,
  .base-hotel-card--expanded {
    width: 100%;
  }

  .base-hotel-card__layout,
  .base-hotel-card__layout--expanded {
    grid-template-columns: 1fr;
    width: 100%;
  }

  .base-hotel-card__info {
    padding: 16px;
  }

  .base-hotel-card__panel {
    padding: 0 16px 16px;
    border-left: none;
    border-top: 1px solid var(--wh-gray-400);
    animation: none;
  }

  .base-hotel-card__media,
  .base-hotel-card__placeholder {
    min-height: 180px;
    max-height: 180px;
  }

  .base-hotel-card__actions {
    width: 100%;
  }

  .base-hotel-card__btn:nth-child(1),
  .base-hotel-card__btn:nth-child(2) {
    flex: 1 1 calc(50% - 3px);
  }

  .base-hotel-card__btn:nth-child(n + 3) {
    flex: 1 1 calc(33.333% - 4px);
  }

  .base-hotel-card__btn--clone {
    background: #17a2b8;
  }

  .base-hotel-card__nav {
    gap: 16px 20px;
  }

  .base-hotel-card__form {
    grid-template-columns: 1fr;
  }

  .base-hotel-card__form-left {
    gap: 12px;
  }
}
</style>
