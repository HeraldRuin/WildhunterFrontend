<script setup lang="ts">
import type { OfferItem } from '~/types/api'
import { featureFlags, FAVORITE_NOTIFICATION_GROUP } from '~/config/features'
import { FAVORITE_REGISTRATION_MESSAGE } from '~/composables/useFavoriteAuthModal'
import {
  formatDisplayDate,
  getDefaultStayCheckIn,
  getDefaultStayCheckOut,
} from '~/utils/date'
import { formatHotelPrice, getHotelPath } from '~/utils/hotel'
import { shouldShowOfferImage, shouldUseCustomOfferPlaceholder } from '~/utils/image'
import { packItemsByWidth } from '~/utils/packItems'

const props = defineProps<{
  item: OfferItem
}>()

const route = useRoute()

function queryParam(key: string): string {
  const raw = route.query[key]
  return Array.isArray(raw) ? String(raw[0] || '') : String(raw || '')
}

function searchQueryForHotel() {
  const query: Record<string, string> = {}

  for (const key of ['checkIn', 'checkOut', 'guests'] as const) {
    const value = queryParam(key)

    if (value) {
      query[key] = value
    }
  }

  if (route.path.startsWith('/bases')) {
    if (!query.checkIn) {
      query.checkIn = formatDisplayDate(getDefaultStayCheckIn())
    }

    if (!query.checkOut) {
      query.checkOut = formatDisplayDate(getDefaultStayCheckOut())
    }

    if (!query.guests) {
      query.guests = '1'
    }
  }

  return query
}

const hotelLink = computed(() => {
  if (
    props.item.object_model === 'hotel'
    && props.item.slug
    && props.item.locationSlug
  ) {
    return {
      path: getHotelPath(props.item.locationSlug, props.item.slug),
      query: searchQueryForHotel(),
    }
  }

  return `/${props.item.object_model}/${props.item.id}`
})

function prefetchTargetPage() {
  if (
    props.item.object_model === 'hotel'
    && props.item.slug
    && props.item.locationSlug
  ) {
    prefetchHotelDetail(props.item.locationSlug, props.item.slug)
  }
}

const { services } = useApi()
const { open: openFavoriteAuthModal } = useFavoriteAuthModal()
const { isFavorite: isHotelFavorite, setFavorite, loadFavorites, isLoaded } = useFavoriteHotels()
const { isBaseAdmin } = useUserRole()
const notifications = useNotifications()

const isFavoriteLoading = ref(false)
const isFavorite = computed(() => isHotelFavorite(props.item.id))
const showImage = computed(() => shouldShowOfferImage(props.item.image))
const showCustomPlaceholder = computed(() => shouldUseCustomOfferPlaceholder(props.item.image))

const ANIMALS_PREVIEW_LIMIT = 4
const ANIMALS_GAP_PX = 8

type AnimalPreview = {
  id: number
  title: string
}

const animalsRowRef = ref<HTMLElement | null>(null)
const animalsLabelRef = ref<HTMLElement | null>(null)
const packedAnimals = ref<AnimalPreview[] | null>(null)
let animalsResizeObserver: ResizeObserver | null = null
let measureCanvas: HTMLCanvasElement | null = null

const allAnimals = computed(() => {
  const animals = props.item.animals ?? []
  return animals
    .map(animal => ({
      id: animal.id,
      title: animal.title.trim(),
    }))
    .filter(animal => animal.title)
})

const previewAnimals = computed(() => allAnimals.value.slice(0, ANIMALS_PREVIEW_LIMIT))
const hasMoreAnimals = computed(() => allAnimals.value.length > ANIMALS_PREVIEW_LIMIT)
const displayAnimals = computed(() => packedAnimals.value ?? previewAnimals.value)

function getMeasureCanvas(): HTMLCanvasElement {
  if (!measureCanvas) {
    measureCanvas = document.createElement('canvas')
  }
  return measureCanvas
}

function measureChipWidth(title: string): number {
  if (typeof document === 'undefined') {
    return title.length * 7 + 18
  }

  const canvas = getMeasureCanvas()
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return title.length * 7 + 18
  }

  // Совпадает с .offer-card__animal-item: 12px / 500, letter-spacing -0.02em
  ctx.font = '500 12px Inter, sans-serif'
  const textWidth = ctx.measureText(title).width
  const letterSpacing = title.length * 12 * -0.02
  // padding 8+8 + border 1+1 + небольшой запас на погрешность шрифта
  return Math.ceil(textWidth + letterSpacing + 18) + 1
}

function repackAnimals() {
  const row = animalsRowRef.value
  const label = animalsLabelRef.value
  const animals = previewAnimals.value

  if (!row || !animals.length) {
    packedAnimals.value = null
    return
  }

  const containerWidth = row.clientWidth
  if (containerWidth <= 0) {
    return
  }

  const packed = packItemsByWidth(
    animals,
    animal => measureChipWidth(animal.title),
    containerWidth,
    {
      gap: ANIMALS_GAP_PX,
      firstLineOffset: label?.offsetWidth ?? 0,
    },
  )

  const sameOrder = packed.every((animal, index) => animal.id === animals[index]?.id)
  packedAnimals.value = sameOrder ? animals : packed
}

function setupAnimalsPacking() {
  animalsResizeObserver?.disconnect()
  animalsResizeObserver = null

  const row = animalsRowRef.value
  if (!row || typeof ResizeObserver === 'undefined') {
    repackAnimals()
    return
  }

  animalsResizeObserver = new ResizeObserver(() => {
    repackAnimals()
  })
  animalsResizeObserver.observe(row)
  repackAnimals()
}

watch(previewAnimals, () => {
  packedAnimals.value = null
  nextTick(repackAnimals)
})

onMounted(() => {
  if (!isBaseAdmin.value && !isLoaded.value) {
    loadFavorites()
  }

  nextTick(setupAnimalsPacking)
})

onBeforeUnmount(() => {
  animalsResizeObserver?.disconnect()
  animalsResizeObserver = null
})

function formatPrice(value: number) {
  return formatHotelPrice(value)
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
  <NuxtLink
    :to="hotelLink"
    class="offer-card"
    @mouseenter="prefetchTargetPage"
    @focus="prefetchTargetPage"
  >
    <div class="offer-card__media">
      <img v-if="showImage" :src="item.image" :alt="item.title" loading="lazy" decoding="async">
      <div v-else-if="showCustomPlaceholder" class="offer-card__placeholder" aria-hidden="true">
        <span>Фото отсутствует</span>
      </div>
      <button
        v-if="!isBaseAdmin"
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
      <div
        v-if="item.location || item.rating > 0"
        class="offer-card__rating"
      >
        <div v-if="item.rating > 0" class="offer-card__score-row">
          <span class="offer-card__star">★</span>
          <span class="offer-card__score">{{ item.rating.toFixed(1).replace('.', ',') }}</span>
        </div>
        <p v-if="item.location" class="offer-card__location-badge">
          {{ item.location }}
        </p>
      </div>
    </div>

    <div class="offer-card__body">
      <div class="offer-card__row">
        <h3 class="offer-card__title">{{ item.title }}</h3>
        <p v-if="item.price > 0" class="offer-card__price">{{ formatPrice(item.price) }} ₽</p>
      </div>
      <div
        ref="animalsRowRef"
        class="offer-card__animals"
      >
        <span
          ref="animalsLabelRef"
          class="offer-card__animals-label"
        >Животные для охоты:</span>
        <ul
          v-if="displayAnimals.length"
          class="offer-card__animals-list"
        >
          <li
            v-for="animal in displayAnimals"
            :key="animal.id"
            class="offer-card__animal-item"
          >
            {{ animal.title }}
          </li>
          <li
            v-if="hasMoreAnimals"
            class="offer-card__animal-item offer-card__animal-item--more"
            aria-hidden="true"
          >
            ...
          </li>
        </ul>
        <span
          v-else
          class="offer-card__animals-empty"
        >
          нет животных для охоты
        </span>
      </div>
      <div class="offer-card__footer">
        <span class="offer-card__more">подробнее</span>
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
.offer-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  color: inherit;
  border: 1px solid var(--wh-gray-200);
  border-radius: var(--wh-radius);
  background: #ffffff;
}

.offer-card__media {
  position: relative;
  overflow: hidden;
  width: 100%;
  aspect-ratio: 288 / 300;
  border-radius: 0;
  background: var(--wh-gray-100);
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

.offer-card__favorite--active:hover:not(:disabled) {
  transform: scale(1.13);
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
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  max-width: calc(100% - 28px);
}

.offer-card__score-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.offer-card__star {
  color: #f2c100;
  font-size: 0.875rem;
  line-height: 1.3;
  text-shadow: 0 1px 3px rgb(0 0 0 / 35%);
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

.offer-card__location-badge {
  margin: 0;
  max-width: 100%;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: -0.05em;
  text-align: right;
  color: rgb(255 255 255 / 90%);
  text-shadow: 0 1px 3px rgb(0 0 0 / 35%);
}

.offer-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 14px 16px 16px;
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
  font-size: 16px;
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

.offer-card__animals {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.offer-card__animals-label {
  font-family: "Inter", sans-serif;
  font-size: 12px;
  font-weight: 600;
  line-height: 130%;
  letter-spacing: -0.05em;
  color: var(--wh-orange-500);
}

.offer-card__animals-list {
  display: contents;
  margin: 0;
  padding: 0;
  list-style: none;
}

.offer-card__animal-item {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  padding: 4px 8px;
  border: 1px solid var(--wh-gray-200);
  border-radius: 8px;
  background: var(--wh-white);
  font-family: "Inter", sans-serif;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.35;
  letter-spacing: -0.02em;
  color: var(--wh-black-text);
}

.offer-card__animal-item--more {
  padding: 4px 0;
  border: none;
  border-radius: 0;
  background: transparent;
}

.offer-card__animals-empty {
  font-family: "Inter", sans-serif;
  font-size: 12px;
  font-weight: 600;
  line-height: 130%;
  letter-spacing: -0.05em;
  color: #e53935;
}

.offer-card__footer {
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
  padding-top: 12px;
}

.offer-card__more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 999px;
  background: var(--wh-green);
  font-family: "Inter", sans-serif;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.05em;
  color: #ffffff;
  transition: background 0.15s ease;
}

.offer-card__more:hover {
  background: color-mix(in srgb, var(--wh-green) 78%, white);
}
</style>
