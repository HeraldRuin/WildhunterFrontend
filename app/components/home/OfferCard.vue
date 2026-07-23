<script setup lang="ts">
import type { OfferItem } from '~/types/api'
import { featureFlags, FAVORITE_NOTIFICATION_GROUP } from '~/config/features'
import { FAVORITE_REGISTRATION_MESSAGE } from '~/composables/useFavoriteAuthModal'
import { shouldShowOfferImage, shouldUseCustomOfferPlaceholder } from '~/utils/image'
import { formatReviewsCount } from '~/utils/pluralize'

const props = defineProps<{
  item: OfferItem
}>()

const { services } = useApi()
const { open: openFavoriteAuthModal } = useFavoriteAuthModal()
const { isFavorite: isHotelFavorite, setFavorite, loadFavorites, isLoaded } = useFavoriteHotels()
const notifications = useNotifications()

const isFavoriteLoading = ref(false)
const isFavorite = computed(() => isHotelFavorite(props.item.id))
const showImage = computed(() => shouldShowOfferImage(props.item.image))
const showCustomPlaceholder = computed(() => shouldUseCustomOfferPlaceholder(props.item.image))

onMounted(() => {
  if (!isLoaded.value) {
    loadFavorites()
  }
})

function formatPrice(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value)
}

function getErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object') {
    return ''
  }

  const fetchError = error as {
    data?: { message?: string }
    message?: string
  }

  return fetchError.data?.message || fetchError.message || ''
}

function shouldOpenRegistrationModal(error: unknown, message: string) {
  const statusCode = (error as { statusCode?: number })?.statusCode

  return statusCode === 401
    || statusCode === 403
    || message.includes('регистрацию')
    || message === FAVORITE_REGISTRATION_MESSAGE
}

function notifyFavoriteSuccess(message: string) {
  if (featureFlags.favoriteNotifications && message) {
    notifications.success(message, 'Успех', { group: FAVORITE_NOTIFICATION_GROUP })
  }
}

function notifyFavoriteError(message: string) {
  if (featureFlags.favoriteNotifications && message) {
    notifications.error(message, 'Ошибка', { group: FAVORITE_NOTIFICATION_GROUP })
  }
}

async function handleFavoriteClick(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()

  if (isFavoriteLoading.value) {
    return
  }

  isFavoriteLoading.value = true

  const wasFavorite = isFavorite.value

  try {
    const response = wasFavorite
      ? await services.removeFavorite(props.item.id)
      : await services.addFavorite(props.item.id)

    if (response.success === false) {
      const message = response.message || FAVORITE_REGISTRATION_MESSAGE

      if (shouldOpenRegistrationModal(null, message)) {
        openFavoriteAuthModal(message)
      } else {
        notifyFavoriteError(message)
      }

      return
    }

    setFavorite(props.item.id, !wasFavorite)

    if (response.message) {
      notifyFavoriteSuccess(response.message)
    }
  } catch (error) {
    const message = getErrorMessage(error)

    if (shouldOpenRegistrationModal(error, message)) {
      openFavoriteAuthModal(message || FAVORITE_REGISTRATION_MESSAGE)
    } else {
      notifyFavoriteError(message)
    }
  } finally {
    isFavoriteLoading.value = false
  }
}
</script>

<template>
  <NuxtLink :to="`/${item.object_model}/${item.id}`" class="offer-card">
    <div class="offer-card__media">
      <img v-if="showImage" :src="item.image" :alt="item.title" loading="lazy">
      <div v-else-if="showCustomPlaceholder" class="offer-card__placeholder" aria-hidden="true">
        <span>Фото отсутствует</span>
      </div>
      <button
        type="button"
        class="offer-card__favorite"
        :class="{ 'offer-card__favorite--active': isFavorite }"
        :aria-label="isFavorite ? 'Убрать из избранного' : 'В избранное'"
        :aria-pressed="isFavorite"
        :disabled="isFavoriteLoading"
        @click="handleFavoriteClick"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
            fill="currentColor"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <div v-if="item.reviews > 0 || item.rating > 0" class="offer-card__rating">
        <span v-if="item.reviews > 0" class="offer-card__reviews">{{ formatReviewsCount(item.reviews) }}</span>
        <template v-if="item.rating > 0">
          <span class="offer-card__star">★</span>
          <span class="offer-card__score">{{ item.rating.toFixed(1).replace('.', ',') }}</span>
        </template>
      </div>
    </div>

    <div class="offer-card__body">
      <div class="offer-card__row">
        <h3 class="offer-card__title">{{ item.title }}</h3>
        <p v-if="item.price > 0" class="offer-card__price">{{ formatPrice(item.price) }} ₽ / ночь</p>
      </div>
      <p class="offer-card__location">{{ item.location }}</p>
    </div>
  </NuxtLink>
</template>

<style scoped>
.offer-card {
  display: block;
  color: inherit;
}

.offer-card__media {
  position: relative;
  overflow: hidden;
  width: 100%;
  aspect-ratio: 288 / 300;
  border-radius: var(--wh-radius);
}

.offer-card__media img,
.offer-card__placeholder {
  width: 100%;
  height: 100%;
  transition: transform 0.3s ease;
}

.offer-card__media img {
  object-fit: cover;
}

.offer-card:hover .offer-card__media img,
.offer-card:hover .offer-card__placeholder {
  transform: scale(1.03);
}

.offer-card__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    linear-gradient(180deg, rgb(0 0 0 / 0) 55%, rgb(0 0 0 / 28%) 100%),
    linear-gradient(145deg, #b8b8b8 0%, #9a9a9a 52%, #757575 100%);
}

.offer-card__placeholder span {
  max-width: 12ch;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: -0.05em;
  text-align: center;
  color: rgb(255 255 255 / 88%);
}

.offer-card__favorite {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: transparent;
  color: #ffffff;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease, color 0.15s ease;
}

.offer-card__favorite:hover:not(:disabled) {
  transform: scale(1.08);
}

.offer-card__favorite:disabled {
  opacity: 0.7;
  cursor: wait;
}

.offer-card__favorite--active {
  transform: scale(1.05);
  color: #e53935;
}

.offer-card__favorite svg {
  display: block;
  width: 24px;
  height: 24px;
  filter: drop-shadow(0 1px 2px rgb(0 0 0 / 35%));
}

.offer-card__rating {
  position: absolute;
  right: 14px;
  bottom: 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
}

.offer-card__reviews {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: -0.05em;
  color: rgb(255 255 255 / 80%);
  text-shadow: 0 1px 3px rgb(0 0 0 / 35%);
}

.offer-card__star {
  color: #f2c100;
  font-size: 0.875rem;
}

.offer-card__score {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.3;
  letter-spacing: -0.05em;
  color: #ffffff;
  text-shadow: 0 1px 3px rgb(0 0 0 / 35%);
}

.offer-card__body {
  padding-top: 14px;
}

.offer-card__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.offer-card__title {
  margin: 0;
  font-family: "Inter", sans-serif;
  font-size: 20px;
  font-weight: 600;
  line-height: 130%;
  letter-spacing: -0.05em;
  color: var(--wh-black-text);
}

.offer-card__price {
  margin: 0;
  flex-shrink: 0;
  font-family: "Inter", sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.05em;
  color: var(--wh-black-text);
  white-space: nowrap;
}

.offer-card__location {
  margin: 6px 0 0;
  font-family: "Inter", sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 130%;
  letter-spacing: -0.05em;
  color: var(--wh-black-text);
}
</style>
