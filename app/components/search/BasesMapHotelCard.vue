<script setup lang="ts">
import { FAVORITE_REGISTRATION_MESSAGE } from '~/composables/useFavoriteAuthModal'
import { featureFlags, FAVORITE_NOTIFICATION_GROUP } from '~/config/features'
import type { MapHotelItem } from '~/utils/map'

const props = defineProps<{
  item: MapHotelItem
  active?: boolean
  compact?: boolean
  imageOnly?: boolean
}>()

const emit = defineEmits<{
  select: [id: number]
}>()

const { services } = useApi()
const { open: openFavoriteAuthModal } = useFavoriteAuthModal()
const { isFavorite: isHotelFavorite, setFavorite, loadFavorites, isLoaded } = useFavoriteHotels()
const notifications = useNotifications()

const isFavoriteLoading = ref(false)
const isFavorite = computed(() => isHotelFavorite(props.item.id))

const tipVisible = ref(false)
const tipStyle = ref<Record<string, string>>({})

onMounted(() => {
  if (!isLoaded.value) {
    loadFavorites()
  }
})

function formatPrice(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value)
}

function formatRating(value: number) {
  return value.toFixed(1).replace('.', ',')
}

const imageOnlyLabel = computed(() => {
  const parts = [
    props.item.title,
    `${formatPrice(props.item.price)} ₽`,
    props.item.location,
  ]

  if (props.item.rating > 0) {
    parts.push(`★ ${formatRating(props.item.rating)}`)
  }

  return parts.filter(Boolean).join(', ')
})

function showTip(event: Event) {
  if (!props.imageOnly) {
    return
  }

  const target = event.currentTarget as HTMLElement | null
  if (!target) {
    return
  }

  const rect = target.getBoundingClientRect()
  tipStyle.value = {
    left: `${Math.round(rect.right + 8)}px`,
    top: `${Math.round(rect.top + rect.height / 2)}px`,
  }
  tipVisible.value = true
}

function hideTip() {
  tipVisible.value = false
}

function selectCard() {
  emit('select', props.item.id)
}

function onCardKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    selectCard()
  }
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
    notifications.success(message, { group: FAVORITE_NOTIFICATION_GROUP })
  }
}

function notifyFavoriteError(message: string) {
  if (featureFlags.favoriteNotifications && message) {
    notifications.error(message, { group: FAVORITE_NOTIFICATION_GROUP })
  }
}

async function handleFavoriteClick(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  hideTip()

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
      }
      else {
        notifyFavoriteError(message)
      }

      return
    }

    setFavorite(props.item.id, !wasFavorite)

    if (response.message) {
      notifyFavoriteSuccess(response.message)
    }
  }
  catch (error) {
    const message = getErrorMessage(error)

    if (shouldOpenRegistrationModal(error, message)) {
      openFavoriteAuthModal(message || FAVORITE_REGISTRATION_MESSAGE)
    }
    else {
      notifyFavoriteError(message)
    }
  }
  finally {
    isFavoriteLoading.value = false
  }
}
</script>

<template>
  <div
    class="map-hotel-card"
    :class="{
      'map-hotel-card--active': active,
      'map-hotel-card--compact': compact && !imageOnly,
      'map-hotel-card--image-only': imageOnly,
      'map-hotel-card--image-only-compact': imageOnly && compact,
    }"
    role="button"
    tabindex="0"
    :aria-label="imageOnly ? imageOnlyLabel : undefined"
    @click="selectCard"
    @keydown="onCardKeydown"
    @mouseenter="showTip"
    @mouseleave="hideTip"
    @focus="showTip"
    @blur="hideTip"
  >
    <div class="map-hotel-card__media">
      <img
        :src="item.image"
        :alt="item.title"
        loading="lazy"
        decoding="async"
      >
      <button
        type="button"
        class="map-hotel-card__favorite"
        :class="{ 'map-hotel-card__favorite--active': isFavorite }"
        :aria-label="isFavorite ? 'Убрать из избранного' : 'В избранное'"
        :aria-pressed="isFavorite"
        :disabled="isFavoriteLoading"
        @click="handleFavoriteClick"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
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
    </div>

    <div
      class="map-hotel-card__body"
      :aria-hidden="imageOnly ? 'true' : undefined"
    >
      <div class="map-hotel-card__row">
        <h3 class="map-hotel-card__title">
          {{ item.title }}
        </h3>
        <p class="map-hotel-card__price">
          {{ formatPrice(item.price) }} ₽
        </p>
      </div>
      <p class="map-hotel-card__location">
        {{ item.location }}
      </p>
      <p
        v-if="item.rating > 0"
        class="map-hotel-card__rating"
      >
        <span class="map-hotel-card__star">★</span>
        {{ formatRating(item.rating) }}
      </p>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="imageOnly && tipVisible"
      class="map-hotel-card-tip"
      :style="tipStyle"
      aria-hidden="true"
    >
      <div class="map-hotel-card-tip__row">
        <p class="map-hotel-card-tip__title">
          {{ item.title }}
        </p>
        <p class="map-hotel-card-tip__price">
          {{ formatPrice(item.price) }} ₽
        </p>
      </div>
      <p class="map-hotel-card-tip__location">
        {{ item.location }}
      </p>
      <p
        v-if="item.rating > 0"
        class="map-hotel-card-tip__rating"
      >
        <span class="map-hotel-card-tip__star">★</span>
        {{ formatRating(item.rating) }}
      </p>
    </div>
  </Teleport>
</template>

<style scoped>
.map-hotel-card {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  grid-template-rows: 96px;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 122px;
  height: auto;
  padding: 11px;
  border: 1px solid var(--wh-field-border);
  border-radius: 12px;
  background: var(--wh-white);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    grid-template-columns 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    grid-template-rows 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    gap 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    padding 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    min-height 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.map-hotel-card:hover:not(.map-hotel-card--active) {
  border-color: var(--wh-field-border-active);
}

.map-hotel-card--active,
.map-hotel-card--active:hover {
  border-color: #e8883a;
}

.map-hotel-card--compact {
  grid-template-columns: 1fr;
  grid-template-rows: auto auto;
  align-items: stretch;
  align-self: start;
  gap: 8px;
  min-height: min-content;
  padding: 8px;
}

.map-hotel-card--image-only {
  position: relative;
  grid-template-columns: 120px;
  grid-template-rows: 120px;
  align-items: stretch;
  gap: 0;
  width: 120px;
  min-height: 120px;
  max-width: 100%;
  padding: 0;
  overflow: hidden;
}

.map-hotel-card__media {
  position: relative;
  overflow: hidden;
  width: 96px;
  height: 96px;
  min-width: 96px;
  min-height: 96px;
  border-radius: 8px;
  background: var(--wh-gray-100, #f5f5f5);
  transition:
    width 0.4s cubic-bezier(0.22, 1, 0.36, 1),
    height 0.4s cubic-bezier(0.22, 1, 0.36, 1),
    min-width 0.4s cubic-bezier(0.22, 1, 0.36, 1),
    min-height 0.4s cubic-bezier(0.22, 1, 0.36, 1),
    border-radius 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.map-hotel-card--compact .map-hotel-card__media {
  width: 100%;
  height: auto;
  min-width: 0;
  min-height: auto;
  aspect-ratio: 1 / 1;
}

.map-hotel-card--image-only .map-hotel-card__media {
  width: 120px;
  height: 120px;
  min-width: 120px;
  min-height: 120px;
  border-radius: 12px;
}

.map-hotel-card--image-only-compact {
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto;
  width: 100%;
  min-height: 0;
  aspect-ratio: 1 / 1;
}

.map-hotel-card--image-only-compact .map-hotel-card__media {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  border-radius: 8px;
}

.map-hotel-card__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}

.map-hotel-card__favorite {
  position: absolute;
  top: 8px;
  right: 8px;
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

.map-hotel-card__favorite:hover:not(:disabled) {
  transform: scale(1.08);
}

.map-hotel-card__favorite:disabled {
  opacity: 0.7;
  cursor: wait;
}

.map-hotel-card__favorite--active {
  transform: scale(1.05);
  color: #e53935;
}

.map-hotel-card__favorite--active:hover:not(:disabled) {
  transform: scale(1.13);
}

.map-hotel-card__favorite svg {
  display: block;
  width: 24px;
  height: 24px;
  filter: drop-shadow(0 1px 2px rgb(0 0 0 / 35%));
}

.map-hotel-card--image-only-compact .map-hotel-card__favorite {
  top: 4px;
  right: 4px;
  width: 18px;
  height: 18px;
}

.map-hotel-card--image-only-compact .map-hotel-card__favorite svg {
  width: 18px;
  height: 18px;
}

.map-hotel-card__body {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
  justify-content: center;
}

.map-hotel-card--image-only .map-hotel-card__body {
  display: none;
}

.map-hotel-card__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.map-hotel-card__title {
  margin: 0;
  min-width: 0;
  flex: 1 1 auto;
  font-family: "Inter", sans-serif;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.25;
  color: var(--wh-gray-900);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  transition: font-size 0.55s cubic-bezier(0.16, 1, 0.3, 1);
}

.map-hotel-card--compact .map-hotel-card__title {
  font-size: 13px;
}

.map-hotel-card__price {
  margin: 0;
  flex-shrink: 0;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--wh-gray-900);
  white-space: nowrap;
  transition: font-size 0.55s cubic-bezier(0.16, 1, 0.3, 1);
}

.map-hotel-card--compact .map-hotel-card__price {
  font-size: 12px;
}

.map-hotel-card__location {
  margin: 0;
  font-family: "Inter", sans-serif;
  font-size: 13px;
  line-height: 1.3;
  color: var(--wh-gray-600, #6b7280);
  transition: font-size 0.55s cubic-bezier(0.16, 1, 0.3, 1);
}

.map-hotel-card--compact .map-hotel-card__location,
.map-hotel-card--compact .map-hotel-card__rating {
  font-size: 12px;
}

.map-hotel-card__rating {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 2px 0 0;
  font-family: "Inter", sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: var(--wh-gray-900);
  transition: font-size 0.55s cubic-bezier(0.16, 1, 0.3, 1);
}

.map-hotel-card__star {
  color: #e8b84a;
}
</style>

<style>
.map-hotel-card-tip {
  position: fixed;
  z-index: 40;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 180px;
  max-width: 260px;
  padding: 10px 12px;
  border: 1px solid var(--wh-field-border, #dddddd);
  border-radius: 12px;
  background: var(--wh-white, #fff);
  box-shadow: 0 8px 24px rgb(0 0 0 / 14%);
  transform: translateY(-50%);
  pointer-events: none;
  text-align: left;
}

.map-hotel-card-tip__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.map-hotel-card-tip__title {
  margin: 0;
  min-width: 0;
  flex: 1 1 auto;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.25;
  color: var(--wh-gray-900, #1c211c);
}

.map-hotel-card-tip__price {
  margin: 0;
  flex-shrink: 0;
  font-family: "Inter", sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: var(--wh-gray-900, #1c211c);
  white-space: nowrap;
}

.map-hotel-card-tip__location {
  margin: 0;
  font-family: "Inter", sans-serif;
  font-size: 12px;
  line-height: 1.3;
  color: var(--wh-gray-600, #6b7280);
}

.map-hotel-card-tip__rating {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  font-family: "Inter", sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: var(--wh-gray-900, #1c211c);
}

.map-hotel-card-tip__star {
  color: #e8b84a;
}
</style>
