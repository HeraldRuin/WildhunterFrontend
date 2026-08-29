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

const emit = defineEmits<{
  deleted: [id: number]
}>()

const { hotels: hotelsApi } = useApi()
const notifications = useNotifications()
const { open: openConfirmModal } = useConfirmModal()

const isDeleting = ref(false)

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

function requestDelete() {
  if (isDeleting.value) {
    return
  }

  openConfirmModal({
    title: `Вы уверены, что хотите удалить «${props.item.title}»?`,
    confirmLabel: 'Удалить',
    onConfirm: () => removeHotel(),
  })
}

async function removeHotel() {
  if (isDeleting.value) {
    return
  }

  isDeleting.value = true

  try {
    const response = await hotelsApi.deleteManage(props.item.id)

    if ('success' in response && response.success) {
      notifications.success(response.message || 'База удалена')
      emit('deleted', props.item.id)
      return
    }

    notifications.error(extractErrorMessage(response, 'Не удалось удалить базу'))
    throw new Error('delete_hotel_failed')
  }
  catch (error) {
    if ((error as Error).message !== 'delete_hotel_failed') {
      const data = (error as { data?: unknown }).data
      notifications.error(extractErrorMessage(data, 'Не удалось удалить базу'))
    }

    throw error
  }
  finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <article class="base-hotel-card">
    <div class="base-hotel-card__layout">
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
            class="base-hotel-card__btn base-hotel-card__btn--success"
          >
            Доступные номера
          </NuxtLink>
          <NuxtLink
            :to="`/profile/base/${item.id}`"
            class="base-hotel-card__btn base-hotel-card__btn--primary"
          >
            Редактировать
          </NuxtLink>
          <button
            type="button"
            class="base-hotel-card__btn base-hotel-card__btn--danger"
            :disabled="isDeleting"
            @click="requestDelete"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.base-hotel-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  border: 1px solid var(--wh-gray-400);
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  box-sizing: border-box;
  overflow: hidden;
}

.base-hotel-card__layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  align-items: stretch;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.base-hotel-card__info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  padding: 20px;
  box-sizing: border-box;
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
  gap: 8px;
  margin-top: 32px;
  width: 100%;
  justify-content: flex-end;
}

.base-hotel-card__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 7px 16px;
  border: 1.5px solid transparent;
  border-radius: 999px;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  box-sizing: border-box;
  transition: opacity 0.15s ease, background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.base-hotel-card__btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.base-hotel-card__btn--success {
  border-color: var(--wh-green);
  background: var(--wh-green);
  color: var(--wh-white);
}

.base-hotel-card__btn--primary {
  border-color: var(--wh-orange-500);
  background: var(--wh-orange-500);
  color: var(--wh-white);
}

.base-hotel-card__btn--primary:hover {
  border-color: var(--wh-orange-600);
  background: var(--wh-orange-600);
}

.base-hotel-card__btn--danger {
  border-color: #dc3545;
  background: var(--wh-white);
  color: #dc3545;
}

.base-hotel-card__btn--danger:hover:not(:disabled) {
  background: rgba(220, 53, 69, 0.08);
}

@media (--wh-narrow) {
  .base-hotel-card__layout {
    grid-template-columns: 1fr;
  }

  .base-hotel-card__info {
    padding: 16px;
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
}
</style>
