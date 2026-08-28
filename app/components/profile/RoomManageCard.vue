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
  toggleVisibility: []
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
</script>

<template>
  <article class="room-manage-card">
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
        <span
          class="room-manage-card__badge"
          :class="`room-manage-card__badge--${item.status}`"
        >
          {{ statusLabel }}
        </span>
      </p>

      <div class="room-manage-card__footer">
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

        <div class="room-manage-card__actions">
          <button type="button" class="room-manage-card__btn room-manage-card__btn--warning">
            Редактировать
          </button>
          <button type="button" class="room-manage-card__btn room-manage-card__btn--danger">
            Удалить
          </button>
          <button
            type="button"
            class="room-manage-card__btn"
            :class="item.status === 'publish' ? 'room-manage-card__btn--secondary' : 'room-manage-card__btn--success'"
            @click="emit('toggleVisibility')"
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
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  gap: 0 20px;
  padding: 20px 0;
  border-bottom: 1px solid #dfdfdf;
  background: transparent;
}

.room-manage-card__media {
  position: relative;
  width: 160px;
  height: 120px;
  overflow: hidden;
  background: #ccc;
  border-radius: 2px;
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
  background: #8a8a8a;
  color: rgb(255 255 255 / 88%);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 500;
}

.room-manage-card__body {
  min-width: 0;
}

.room-manage-card__title {
  margin: 0 0 10px;
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
  margin: 0 0 8px;
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

.room-manage-card__badge {
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

.room-manage-card__badge--publish {
  background: #28a745;
}

.room-manage-card__badge--draft {
  background: #6c757d;
}

.room-manage-card__footer {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px 24px;
  margin-top: 4px;
}

.room-manage-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-left: auto;
}

.room-manage-card__btn {
  min-width: 50px;
  padding: 5px 10px;
  border: none;
  border-radius: 5px;
  color: #fff;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  cursor: pointer;
}

.room-manage-card__btn--warning {
  background: #ffc107;
}

.room-manage-card__btn--danger {
  background: #dc3545;
}

.room-manage-card__btn--secondary {
  background: #6c757d;
}

.room-manage-card__btn--success {
  background: #28a745;
}

@media (--wh-narrow) {
  .room-manage-card {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .room-manage-card__media {
    width: 100%;
    height: 180px;
  }

  .room-manage-card__actions {
    margin-left: 0;
    width: 100%;
  }
}
</style>
