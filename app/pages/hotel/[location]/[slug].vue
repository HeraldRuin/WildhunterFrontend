<script setup lang="ts">
import { featureFlags, FAVORITE_NOTIFICATION_GROUP } from '~/config/features'
import { FAVORITE_REGISTRATION_MESSAGE } from '~/composables/useFavoriteAuthModal'
import { createMockHotelDetail } from '~/utils/hotel'
import { formatReviewsCount } from '~/utils/pluralize'
import HotelBookingSection from '~/components/hotel/HotelBookingSection.vue'

definePageMeta({
  layout: 'home',
})

const route = useRoute()
const hotelParams = computed(() => ({
  locationSlug: String(route.params.location || ''),
  hotelSlug: String(route.params.slug || ''),
}))

const { data: hotel, pending, status } = useHotelDetail(hotelParams)
const placeholderHotel = computed(() => createMockHotelDetail(hotelParams.value))
const isHotelLoading = computed(() => pending.value || status.value === 'idle' || !hotel.value)
const displayHotel = computed(() => {
  if (isHotelLoading.value) {
    return placeholderHotel.value
  }

  return hotel.value ?? placeholderHotel.value
})
const { services } = useApi()
const { open: openFavoriteAuthModal } = useFavoriteAuthModal()
const { isFavorite: isHotelFavorite, setFavorite, loadFavorites, isLoaded } = useFavoriteHotels()
const notifications = useNotifications()

const isFavoriteLoading = ref(false)
const isFavorite = computed(() => hotel.value ? isHotelFavorite(hotel.value.id) : false)

onMounted(() => {
  if (!isLoaded.value) {
    loadFavorites()
  }
})

const pageTitle = computed(() => `${displayHotel.value.title} — WH`)

const breadcrumbs = computed(() => [
  { label: 'Главная', to: '/' },
  { label: 'Базы' },
  { label: displayHotel.value.title },
])

useHead({
  title: pageTitle,
})

const ratingValue = computed(() => {
  const score = displayHotel.value.review_score?.score_total

  if (!score) {
    return '4,9'
  }

  return score.toFixed(1).replace('.', ',')
})

const reviewsCount = computed(() => {
  const fromScore = Number(displayHotel.value.review_score?.total_review)
  if (Number.isFinite(fromScore) && fromScore >= 0) {
    return fromScore
  }

  return 0
})
const reviewsLabel = computed(() => formatReviewsCount(reviewsCount.value))

const amenitiesGroup = computed(() => {
  return displayHotel.value.terms.find(group => /услуг/i.test(group.title)) ?? null
})

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

async function handleFavoriteClick() {
  if (!hotel.value || isFavoriteLoading.value || isHotelLoading.value) {
    return
  }

  isFavoriteLoading.value = true

  const hotelId = hotel.value.id
  const wasFavorite = isFavorite.value

  try {
    const response = wasFavorite
      ? await services.removeFavorite(hotelId)
      : await services.addFavorite(hotelId)

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

    setFavorite(hotelId, !wasFavorite)

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
  <div class="hotel-page">
    <div class="hotel-page__header">
      <HomeHeroHeader />
    </div>

    <div
      class="hotel-page__body"
      :class="{ 'hotel-page__body--loading': isHotelLoading }"
      :aria-busy="isHotelLoading"
    >
      <section class="hotel-page__hero">
        <div class="hotel-page__hero-inner">
          <AppBreadcrumbs :items="breadcrumbs" />

          <div class="hotel-page__title-row">
            <h1 class="hotel-page__title">{{ displayHotel.title }}</h1>
            <button
              type="button"
              class="hotel-page__favorite"
              :class="{ 'hotel-page__favorite--active': isFavorite }"
              :aria-label="isFavorite ? 'Убрать из избранного' : 'В избранное'"
              :aria-pressed="isFavorite"
              :disabled="isFavoriteLoading || isHotelLoading"
              @click="handleFavoriteClick"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  class="hotel-page__favorite-icon"
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>

          <section
            v-if="displayHotel.address || amenitiesGroup"
            class="hotel-section hotel-section--amenities"
          >
            <p v-if="displayHotel.address" class="hotel-page__address">
              {{ displayHotel.address }}
            </p>
            <div class="hotel-page__amenities-row">
              <ul v-if="amenitiesGroup" class="hotel-amenities">
                <li
                  v-for="term in amenitiesGroup.terms"
                  :key="term.id"
                  class="hotel-amenities__item"
                >
                  <img
                    class="hotel-amenities__icon"
                    src="/icons/carbon_checkmark-filled.png"
                    alt=""
                    width="28"
                    height="28"
                    aria-hidden="true"
                  >
                  {{ term.title }}
                </li>
              </ul>

              <div class="hotel-page__rating">
                <span class="hotel-page__star">★</span>
                <span class="hotel-page__score">{{ ratingValue }}</span>
                <span class="hotel-page__reviews">{{ reviewsLabel }}</span>
              </div>
            </div>
          </section>
        </div>

        <HotelGallery
          class="hotel-page__gallery"
          :images="displayHotel.gallery"
          :title="displayHotel.title"
          :placeholder="isHotelLoading"
        />

        <div class="hotel-page__hero-inner">
          <section
            v-if="displayHotel.content"
            class="hotel-page__description"
          >
            <div
              class="hotel-page__description-content"
              v-html="displayHotel.content"
            />
          </section>

          <section class="hotel-page__booking">
            <HotelBookingSection width="90%" />
          </section>
        </div>
      </section>

      <div
        v-if="isHotelLoading"
        class="hotel-page__loading-overlay"
        aria-hidden="true"
      >
        <CommonSpinner
          variant="ring"
          color="var(--wh-orange-500)"
          size="lg"
        />
      </div>
    </div>

    <HomeBlocksCommunityBlock />
    <LayoutAppFooter />
  </div>
</template>

<style scoped>
.hotel-page {
  background: var(--wh-white);
}

.hotel-page__header {
  display: flex;
  justify-content: center;
  padding: 0 12px;
}

.hotel-page__header :deep(.hero-header) {
  width: min(100%, calc(100vw - 160px));
  border: 1px solid var(--wh-gray-400);
  border-top: none;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: var(--wh-shadow);
}

.hotel-page__body {
  position: relative;
}

.hotel-page__body--loading {
  pointer-events: none;
  user-select: none;
}

.hotel-page__body--loading .hotel-page__hero-inner {
  filter: blur(5px);
  opacity: 0.55;
}

.hotel-page__loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: min(400px, 44vh);
  pointer-events: none;
}

.hotel-page__hero {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 28px 0 72px;
}

.hotel-page__gallery {
  width: min(100% - 48px, calc(100vw - 220px));
  margin-inline: auto;
}

.hotel-page__hero-inner {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: min(100% - 48px, calc(100vw - 220px));
  margin-inline: auto;
}

.hotel-page__title-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.hotel-page__title {
  margin: 0;
  font-size: clamp(1.5rem, 2.8vw, 2rem);
  font-weight: 800;
  line-height: 1.25;
  color: var(--wh-gray-900);
}

.hotel-page__amenities-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.hotel-page__amenities-row .hotel-amenities {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  min-width: 0;
}

.hotel-page__favorite {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid var(--wh-gray-200);
  border-radius: 8px;
  background: var(--wh-white);
  color: var(--wh-gray-400);
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;
}

.hotel-page__favorite:disabled {
  opacity: 0.7;
  cursor: wait;
}

.hotel-page__favorite--active {
  color: #e53935;
}

.hotel-page__favorite svg {
  display: block;
  width: 24px;
  height: 24px;
}

.hotel-page__favorite-icon {
  fill: none;
}

.hotel-page__favorite--active .hotel-page__favorite-icon {
  fill: currentColor;
}

.hotel-page__rating {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
  padding: 10px 14px;
  border-radius: var(--wh-radius);
  background: var(--wh-green);
  color: var(--wh-white);
}

.hotel-page__reviews {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: -0.05em;
  color: rgb(255 255 255 / 80%);
  white-space: nowrap;
}

.hotel-page__star {
  color: #f2c100;
  font-size: 0.875rem;
}

.hotel-page__score {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.05em;
  color: var(--wh-white);
  white-space: nowrap;
}

.hotel-page__description-content {
  color: var(--wh-gray-600);
  line-height: 1.65;
}

.hotel-page__description-content :deep(p) {
  margin: 0 0 14px;
}

.hotel-page__description-content :deep(p:last-child) {
  margin-bottom: 0;
}

.hotel-page__booking {
  margin-top: 40px;
}

.hotel-page__address {
  margin: 0 0 18px;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.4;
  color: var(--wh-gray-600);
}

.hotel-amenities {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 24px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.hotel-amenities__item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.98rem;
  color: var(--wh-gray-700);
}

.hotel-amenities__icon {
  display: block;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  object-fit: contain;
}

@media (--wh-tablet) {
  .hotel-page__header :deep(.hero-header) {
    width: calc(100% - 24px);
  }

  .hotel-page__hero-inner,
  .hotel-page__gallery {
    width: min(100% - 32px, calc(100vw - 48px));
  }
}

@media (--wh-mobile) {
  .hotel-page__header {
    padding: 0;
  }

  .hotel-page__header :deep(.hero-header) {
    width: 100%;
    max-width: 100%;
    margin-inline: 0;
    border-left: none;
    border-right: none;
    border-radius: 0 0 12px 12px;
  }

  .hotel-page__hero {
    padding-top: 20px;
    overflow-x: clip;
  }

  .hotel-page__hero-inner {
    width: 100%;
    padding-inline: 16px;
    box-sizing: border-box;
  }

  .hotel-page__gallery {
    width: 100%;
    max-width: none;
    margin-inline: 0;
  }

  .hotel-page__title-row {
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .hotel-page__amenities-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .hotel-page__amenities-row .hotel-amenities {
    gap: 8px 12px;
  }

  .hotel-page__rating {
    align-self: flex-start;
  }
}
</style>
