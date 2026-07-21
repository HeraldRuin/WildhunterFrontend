<script setup lang="ts">
import type { HotelDetailApiResponse, ReviewItem } from '~/types/api'
import {
  MOCK_HOTEL_REVIEWS,
  createMockHotelDetail,
  formatHotelPrice,
  normalizeHotelDetail,
  toRelatedOffers,
} from '~/utils/hotel'

definePageMeta({
  layout: 'home',
})

const route = useRoute()
const hotelId = computed(() => Number(route.params.id))
const { search: searchApi, reviews: reviewsApi } = useApi()

const { data: hotel, pending } = await useAsyncData(
  () => `hotel-detail-${hotelId.value}`,
  async () => {
    try {
      const response = await searchApi.getDetail('hotel', hotelId.value) as HotelDetailApiResponse

      if (response.status === 1 && response.data) {
        const normalized = normalizeHotelDetail(response.data, hotelId.value)

        if (normalized) {
          return normalized
        }
      }
    }
    catch {
      // API недоступен — используем мок-данные
    }

    return createMockHotelDetail(hotelId.value)
  },
  {
    watch: [hotelId],
  },
)

const { data: reviewItems } = await useAsyncData(
  () => `hotel-reviews-${hotelId.value}`,
  async () => {
    try {
      const items = await reviewsApi.getReviewItems({
        type: 'hotel',
        limit: 6,
      })

      if (items.length) {
        return items
      }
    }
    catch {
      // fallback ниже
    }

    return MOCK_HOTEL_REVIEWS
  },
  {
    watch: [hotelId],
    default: () => MOCK_HOTEL_REVIEWS,
  },
)

const pageTitle = computed(() => hotel.value ? `${hotel.value.title} — WH` : 'База — WH')

useHead({
  title: pageTitle,
})

const displayPrice = computed(() => {
  if (!hotel.value) {
    return ''
  }

  return formatHotelPrice(hotel.value.sale_price ?? hotel.value.price)
})

const ratingValue = computed(() => {
  const score = hotel.value?.review_score?.score_total

  if (!score) {
    return '4,9'
  }

  return score.toFixed(1).replace('.', ',')
})

const reviewsCount = computed(() => hotel.value?.review_score?.total_review ?? 32)

const relatedOffers = computed(() =>
  hotel.value ? toRelatedOffers(hotel.value.related) : [],
)

function handleSearch(payload: Record<string, string>) {
  navigateTo({
    path: '/bases',
    query: payload,
  })
}
</script>

<template>
  <div class="hotel-page">
    <SearchHero @search="handleSearch" />

    <div v-if="pending" class="container hotel-page__state">
      Загрузка...
    </div>

    <template v-else-if="hotel">
      <section class="hotel-page__hero">
        <div class="container hotel-page__hero-inner">
          <nav class="hotel-page__breadcrumbs" aria-label="Хлебные крошки">
            <NuxtLink to="/">Главная</NuxtLink>
            <span aria-hidden="true">&gt;</span>
            <NuxtLink to="/bases">Базы</NuxtLink>
            <span aria-hidden="true">&gt;</span>
            <span>{{ hotel.title }}</span>
          </nav>

          <HotelGallery :images="hotel.gallery" :title="hotel.title" />

          <div class="hotel-page__summary">
            <div class="hotel-page__summary-main">
              <div class="hotel-page__title-row">
                <h1 class="hotel-page__title">{{ hotel.title }}</h1>
                <button type="button" class="hotel-page__favorite" aria-label="В избранное">
                  <svg width="18" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M12 20.25s-7.5-4.35-7.5-10.05c0-2.85 2.25-5.1 5.1-5.1 1.58 0 3.08.75 4.05 1.95.97-1.2 2.47-1.95 4.05-1.95 2.85 0 5.1 2.25 5.1 5.1 0 5.7-7.5 10.05-7.5 10.05z"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
              </div>

              <p v-if="hotel.location?.name || hotel.address" class="hotel-page__location">
                {{ hotel.location?.name }}<template v-if="hotel.location?.name && hotel.address"> · </template>{{ hotel.address }}
              </p>

              <div class="hotel-page__meta">
                <div class="hotel-page__rating">
                  <span class="hotel-page__reviews">{{ reviewsCount }} отзыва</span>
                  <span class="hotel-page__star">★</span>
                  <span class="hotel-page__score">{{ ratingValue }}</span>
                </div>

                <p class="hotel-page__price-mobile">
                  {{ displayPrice }} ₽ / ночь
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="hotel-page__content">
        <div class="container hotel-page__layout">
          <div class="hotel-page__main">
            <section v-if="hotel.content" class="hotel-section">
              <h2 class="hotel-section__title">Описание</h2>
              <div class="hotel-section__content hotel-section__content--html" v-html="hotel.content" />
            </section>

            <section
              v-for="group in hotel.terms"
              :key="group.id"
              class="hotel-section"
            >
              <h2 class="hotel-section__title">{{ group.title }}</h2>
              <ul class="hotel-amenities">
                <li
                  v-for="term in group.terms"
                  :key="term.id"
                  class="hotel-amenities__item"
                >
                  <span class="hotel-amenities__dot" aria-hidden="true" />
                  {{ term.title }}
                </li>
              </ul>
            </section>

            <section v-if="hotel.animals.length" class="hotel-section">
              <h2 class="hotel-section__title">Доступная дичь</h2>
              <div class="hotel-animals">
                <article
                  v-for="animal in hotel.animals"
                  :key="animal.id"
                  class="hotel-animals__item"
                >
                  <div>
                    <h3 class="hotel-animals__name">{{ animal.title }}</h3>
                    <p v-if="animal.season" class="hotel-animals__season">{{ animal.season }}</p>
                  </div>
                  <p v-if="animal.price" class="hotel-animals__price">
                    от {{ formatHotelPrice(animal.price) }} ₽
                  </p>
                </article>
              </div>
            </section>

            <section v-if="hotel.check_in_time || hotel.check_out_time" class="hotel-section">
              <h2 class="hotel-section__title">Правила проживания</h2>
              <dl class="hotel-rules">
                <div v-if="hotel.check_in_time" class="hotel-rules__row">
                  <dt>Заезд</dt>
                  <dd>{{ hotel.check_in_time }}</dd>
                </div>
                <div v-if="hotel.check_out_time" class="hotel-rules__row">
                  <dt>Выезд</dt>
                  <dd>{{ hotel.check_out_time }}</dd>
                </div>
              </dl>
            </section>

            <section class="hotel-section">
              <h2 class="hotel-section__title">Расположение</h2>
              <p v-if="hotel.address" class="hotel-section__address">
                {{ hotel.address }}
              </p>
              <div class="hotel-map" aria-label="Карта расположения базы">
                <iframe
                  v-if="hotel.map_lat && hotel.map_lng"
                  title="Карта"
                  loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade"
                  :src="`https://www.openstreetmap.org/export/embed.html?bbox=${hotel.map_lng - 0.08}%2C${hotel.map_lat - 0.05}%2C${hotel.map_lng + 0.08}%2C${hotel.map_lat + 0.05}&layer=mapnik&marker=${hotel.map_lat}%2C${hotel.map_lng}`"
                />
                <div v-else class="hotel-map__placeholder">
                  Карта будет доступна позже
                </div>
              </div>
            </section>

            <section class="hotel-section hotel-section--reviews">
              <h2 class="hotel-section__title">Отзывы</h2>
              <div class="hotel-reviews">
                <HomeReviewCard
                  v-for="item in (reviewItems as ReviewItem[])"
                  :key="item.id"
                  :item="item"
                  class="hotel-reviews__card"
                />
              </div>
            </section>
          </div>

          <HotelBookingCard :hotel="hotel" />
        </div>
      </section>

      <section v-if="relatedOffers.length" class="hotel-page__related">
        <div class="container">
          <h2 class="hotel-page__related-title">Похожие базы</h2>
          <div class="hotel-page__related-grid">
            <HomeOfferCard
              v-for="(item, index) in relatedOffers"
              :key="`${item.id}-${index}`"
              :item="item"
            />
          </div>
        </div>
      </section>
    </template>

    <HomeBlocksCommunityBlock />
    <LayoutAppFooter />
  </div>
</template>

<style scoped>
.hotel-page {
  background: var(--wh-white);
}

.hotel-page__state {
  padding: 64px 0;
  text-align: center;
  color: var(--wh-gray-500);
}

.hotel-page__hero {
  padding: 28px 0 12px;
}

.hotel-page__hero-inner {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hotel-page__breadcrumbs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 0.875rem;
  color: var(--wh-gray-500);
}

.hotel-page__breadcrumbs a {
  transition: color 0.15s ease;
}

.hotel-page__breadcrumbs a:hover {
  color: var(--wh-gray-900);
}

.hotel-page__summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.hotel-page__title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.hotel-page__title {
  margin: 0;
  font-size: clamp(1.5rem, 2.8vw, 2rem);
  font-weight: 800;
  line-height: 1.25;
  color: var(--wh-gray-900);
}

.hotel-page__favorite {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid var(--wh-gray-200);
  border-radius: 999px;
  background: var(--wh-white);
  color: var(--wh-gray-900);
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}

.hotel-page__favorite:hover {
  border-color: var(--wh-orange-500);
  color: var(--wh-orange-500);
}

.hotel-page__location {
  margin: 10px 0 0;
  font-size: 0.98rem;
  line-height: 1.5;
  color: var(--wh-gray-500);
}

.hotel-page__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
}

.hotel-page__rating {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.hotel-page__reviews {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: -0.05em;
  color: var(--wh-gray-500);
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
  color: var(--wh-gray-900);
}

.hotel-page__price-mobile {
  display: none;
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--wh-gray-900);
  white-space: nowrap;
}

.hotel-page__content {
  padding: 24px 0 72px;
}

.hotel-page__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 340px);
  gap: 40px;
  align-items: start;
}

.hotel-page__main {
  display: flex;
  flex-direction: column;
  gap: 40px;
  min-width: 0;
}

.hotel-section__title {
  margin: 0 0 18px;
  font-size: clamp(1.1rem, 2vw, 1.35rem);
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--wh-gray-900);
}

.hotel-section__content {
  color: var(--wh-gray-600);
  line-height: 1.65;
}

.hotel-section__content--html :deep(p) {
  margin: 0 0 14px;
}

.hotel-section__content--html :deep(p:last-child) {
  margin-bottom: 0;
}

.hotel-section__address {
  margin: 0 0 16px;
  color: var(--wh-gray-500);
  line-height: 1.5;
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

.hotel-amenities__dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #586a41;
}

.hotel-animals {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hotel-animals__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border: 1px solid var(--wh-gray-200);
  border-radius: var(--wh-radius);
  background: var(--wh-gray-100);
}

.hotel-animals__name {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--wh-gray-900);
}

.hotel-animals__season {
  margin: 4px 0 0;
  font-size: 0.875rem;
  color: var(--wh-gray-500);
}

.hotel-animals__price {
  margin: 0;
  flex-shrink: 0;
  font-size: 0.98rem;
  font-weight: 700;
  color: var(--wh-gray-900);
  white-space: nowrap;
}

.hotel-rules {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
}

.hotel-rules__row {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--wh-gray-200);
}

.hotel-rules__row:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.hotel-rules__row dt {
  margin: 0;
  font-weight: 600;
  color: var(--wh-gray-900);
}

.hotel-rules__row dd {
  margin: 0;
  color: var(--wh-gray-600);
}

.hotel-map,
.hotel-map__placeholder {
  overflow: hidden;
  width: 100%;
  min-height: 280px;
  border-radius: var(--wh-radius-lg);
  background: var(--wh-gray-100);
}

.hotel-map iframe {
  display: block;
  width: 100%;
  min-height: 280px;
  border: 0;
}

.hotel-map__placeholder {
  display: grid;
  place-items: center;
  color: var(--wh-gray-500);
}

.hotel-reviews {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.hotel-reviews__card {
  min-width: 0;
}

.hotel-page__related {
  padding: 0 0 72px;
}

.hotel-page__related-title {
  margin: 0 0 28px;
  font-size: clamp(1.25rem, 2.2vw, 1.75rem);
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--wh-gray-900);
}

.hotel-page__related-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px 20px;
}

@media (max-width: 1200px) {
  .hotel-page__related-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1024px) {
  .hotel-page__layout {
    grid-template-columns: 1fr;
  }

  .hotel-page__price-mobile {
    display: block;
  }

  .hotel-reviews {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hotel-page__related-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .hotel-page__hero {
    padding-top: 20px;
  }

  .hotel-amenities {
    grid-template-columns: 1fr;
  }

  .hotel-animals__item {
    align-items: flex-start;
    flex-direction: column;
  }

  .hotel-rules__row {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .hotel-reviews {
    grid-template-columns: 1fr;
  }

  .hotel-page__related-grid {
    grid-template-columns: 1fr;
  }
}
</style>
