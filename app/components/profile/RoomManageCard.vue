<script setup lang="ts">
import { shouldShowOfferImage, shouldUseCustomOfferPlaceholder } from '~/utils/image'

export type RoomManageStatus = 'publish' | 'draft'

export interface RoomManageItem {
  id: number
  title: string
  image: string
  quantity: number
  price: number
  status: RoomManageStatus
  updatedAt: string
}

const props = defineProps<{
  item: RoomManageItem
}>()

const emit = defineEmits<{
  visibilityChanged: [status: RoomManageStatus]
  deleted: [id: number]
}>()

const { rooms: roomsApi } = useApi()
const notifications = useNotifications()
const { open: openConfirmModal } = useConfirmModal()

const isDeleting = ref(false)
const isTogglingVisibility = ref(false)

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

function normalizeStatus(status: string): RoomManageStatus {
  return status === 'publish' ? 'publish' : 'draft'
}

function requestDelete() {
  if (isDeleting.value || isTogglingVisibility.value) {
    return
  }

  openConfirmModal({
    title: `Вы уверены, что хотите удалить «${props.item.title}»?`,
    confirmLabel: 'Удалить',
    onConfirm: () => removeRoom(),
  })
}

async function removeRoom() {
  if (isDeleting.value) {
    return
  }

  isDeleting.value = true

  try {
    const response = await roomsApi.deleteManage(props.item.id)

    if ('success' in response && response.success) {
      notifications.success(response.message || 'Номер удалён')
      emit('deleted', props.item.id)
      return
    }

    notifications.error(extractErrorMessage(response, 'Не удалось удалить номер'))
    throw new Error('delete_room_failed')
  }
  catch (error) {
    if ((error as Error).message !== 'delete_room_failed') {
      const data = (error as { data?: unknown }).data
      notifications.error(extractErrorMessage(data, 'Не удалось удалить номер'))
    }

    throw error
  }
  finally {
    isDeleting.value = false
  }
}

async function toggleVisibility() {
  if (isTogglingVisibility.value || isDeleting.value) {
    return
  }

  isTogglingVisibility.value = true

  const action = props.item.status === 'publish' ? 'hide' : 'publish'
  const fallbackError = action === 'publish'
    ? 'Не удалось опубликовать номер'
    : 'Не удалось скрыть номер'

  try {
    const response = action === 'publish'
      ? await roomsApi.publish(props.item.id)
      : await roomsApi.hide(props.item.id)

    if ('success' in response && response.success) {
      const nextStatus = normalizeStatus(response.data.status)
      notifications.success(
        response.message || (nextStatus === 'publish' ? 'Номер опубликован' : 'Номер скрыт'),
      )
      emit('visibilityChanged', nextStatus)
      return
    }

    notifications.error(extractErrorMessage(response, fallbackError))
  }
  catch (error) {
    const data = (error as { data?: unknown }).data
    notifications.error(extractErrorMessage(data, fallbackError))
  }
  finally {
    isTogglingVisibility.value = false
  }
}
</script>

<template>
  <article class="room-manage-card">
    <div class="room-manage-card__layout">
      <div class="room-manage-card__media">
        <img
          v-if="showImage"
          :src="item.image"
          :alt="item.title"
          class="room-manage-card__image"
        >
        <div
          v-else-if="showCustomPlaceholder"
          class="room-manage-card__placeholder"
          aria-hidden="true"
        >
          <span>Фото отсутствует</span>
        </div>
      </div>

      <div class="room-manage-card__info">
        <div class="room-manage-card__body">
          <h2 class="room-manage-card__title">{{ item.title }}</h2>

          <p class="room-manage-card__meta">
            <svg class="room-manage-card__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
            Количество: <span>{{ item.quantity }}</span>
          </p>

          <p class="room-manage-card__meta">
            <svg class="room-manage-card__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
            Стоимость: <strong class="room-manage-card__price">{{ formattedPrice }}</strong>
          </p>

          <p class="room-manage-card__meta">
            <svg class="room-manage-card__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
            <span class="room-manage-card__status">{{ statusLabel }}</span>
          </p>

          <p class="room-manage-card__meta room-manage-card__meta--footer">
            <svg class="room-manage-card__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

        <div class="room-manage-card__actions">
          <button type="button" class="room-manage-card__btn room-manage-card__btn--primary">
            Редактировать
          </button>
          <button
            type="button"
            class="room-manage-card__btn room-manage-card__btn--danger"
            :disabled="isDeleting || isTogglingVisibility"
            @click="requestDelete"
          >
            Удалить
          </button>
          <button
            type="button"
            class="room-manage-card__btn"
            :class="item.status === 'publish' ? 'room-manage-card__btn--secondary' : 'room-manage-card__btn--success'"
            :disabled="isTogglingVisibility || isDeleting"
            :aria-busy="isTogglingVisibility"
            @click="toggleVisibility"
          >
            {{ visibilityActionLabel }}
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.room-manage-card {
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

.room-manage-card__layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  align-items: stretch;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.room-manage-card__info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  padding: 20px;
  box-sizing: border-box;
}

.room-manage-card__media {
  position: relative;
  width: 100%;
  min-height: 180px;
  overflow: hidden;
  background: #ccc;
}

.room-manage-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.room-manage-card__placeholder {
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

.room-manage-card__body {
  min-width: 0;
  width: 100%;
}

.room-manage-card__title {
  margin: 0 0 10px;
  padding: 0;
  color: #1a2b50;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
}

.room-manage-card__meta {
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

.room-manage-card__meta--footer {
  margin: 0;
}

.room-manage-card__icon {
  flex-shrink: 0;
  color: #687882;
}

.room-manage-card__price {
  color: #000;
  font-size: 15px;
  font-weight: 700;
}

.room-manage-card__status {
  color: var(--wh-orange-500);
  font-weight: 600;
}

.room-manage-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
  margin-top: 32px;
  justify-content: flex-end;
}

.room-manage-card__btn {
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

.room-manage-card__btn--success {
  border-color: var(--wh-green);
  background: var(--wh-green);
  color: var(--wh-white);
}

.room-manage-card__btn--primary {
  border-color: var(--wh-orange-500);
  background: var(--wh-orange-500);
  color: var(--wh-white);
}

.room-manage-card__btn--primary:hover {
  border-color: var(--wh-orange-600);
  background: var(--wh-orange-600);
}

.room-manage-card__btn--danger {
  border-color: #dc3545;
  background: var(--wh-white);
  color: #dc3545;
}

.room-manage-card__btn--danger:hover {
  background: rgba(220, 53, 69, 0.08);
}

.room-manage-card__btn--secondary {
  border-color: #687882;
  background: var(--wh-white);
  color: #687882;
}

.room-manage-card__btn--secondary:hover {
  background: rgba(104, 120, 130, 0.08);
}

@media (--wh-narrow) {
  .room-manage-card__layout {
    grid-template-columns: 1fr;
  }

  .room-manage-card__info {
    padding: 16px;
  }

  .room-manage-card__media,
  .room-manage-card__placeholder {
    min-height: 180px;
    max-height: 180px;
  }

  .room-manage-card__actions {
    width: 100%;
  }

  .room-manage-card__btn:nth-child(1),
  .room-manage-card__btn:nth-child(2) {
    flex: 1 1 calc(50% - 3px);
  }

  .room-manage-card__btn:nth-child(n + 3) {
    flex: 1 1 calc(33.333% - 4px);
  }
}
</style>
