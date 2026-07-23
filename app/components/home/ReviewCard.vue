<script setup lang="ts">
import type { ReviewItem } from '~/types/api'

const props = defineProps<{
  item: ReviewItem
}>()

const maxLines = 4
const textWrapRef = ref<HTMLElement | null>(null)
const hasOverflow = ref(false)
const isAtBottom = ref(false)

const showEllipsis = computed(() => hasOverflow.value && !isAtBottom.value)

const maxRating = 5
const filledStarColor = '#fbbf24'
const emptyStarColor = 'rgba(255, 255, 255, 0.28)'

const stars = computed(() =>
  Array.from({ length: maxRating }, (_, index) => index + 1),
)

const normalizedRating = computed(() => {
  const value = Number(props.item.rating)

  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.min(Math.max(Math.round(value), 0), maxRating)
})

function getStarColor(star: number) {
  return star <= normalizedRating.value ? filledStarColor : emptyStarColor
}

function updateScrollState() {
  const element = textWrapRef.value

  if (!element) {
    hasOverflow.value = false
    isAtBottom.value = true
    return
  }

  hasOverflow.value = element.scrollHeight > element.clientHeight + 1
  isAtBottom.value = element.scrollTop + element.clientHeight >= element.scrollHeight - 1
}

watch(() => props.item.text, () => nextTick(updateScrollState))

let resizeObserver: ResizeObserver | undefined

onMounted(() => {
  nextTick(updateScrollState)

  if (textWrapRef.value) {
    resizeObserver = new ResizeObserver(updateScrollState)
    resizeObserver.observe(textWrapRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <article class="review-card">
    <div class="review-card__header">
      <div class="review-card__avatar">
        <img v-if="item.avatar" :src="item.avatar" :alt="item.name" loading="lazy">
      </div>
      <div class="review-card__meta">
        <h3 class="review-card__name">{{ item.name }}</h3>

        <div
          v-if="normalizedRating > 0 || item.ratingText"
          class="review-card__rating"
          :aria-label="`Рейтинг: ${normalizedRating} из ${maxRating}`"
        >
          <div v-if="normalizedRating > 0" class="review-card__stars">
            <svg
              v-for="star in stars"
              :key="star"
              class="review-card__star"
              width="16"
              height="16"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.77l-4.94 2.6.94-5.5-4-3.9 5.53-.8L10 1.5Z"
                :fill="getStarColor(star)"
              />
            </svg>
          </div>
          <span v-if="item.ratingText" class="review-card__rating-text">
            {{ item.ratingText }}
          </span>
        </div>

        <p v-if="item.role" class="review-card__role">{{ item.role }}</p>
      </div>
    </div>

    <div
      class="review-card__text-box"
      :class="{ 'review-card__text-box--more': showEllipsis }"
      :style="{ '--review-text-lines': maxLines }"
    >
      <div
        ref="textWrapRef"
        class="review-card__text-wrap"
        @scroll="updateScrollState"
      >
        <p class="review-card__text">{{ item.text }}</p>
      </div>
      <span v-if="showEllipsis" class="review-card__ellipsis" aria-hidden="true">...</span>
    </div>
  </article>
</template>

<style scoped>
.review-card {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 28px;
  border-radius: 18px;
  background: #5f7256;
  color: var(--wh-white);
}

.review-card__header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.review-card__avatar {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.28);
}

.review-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.review-card__name {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
}

.review-card__rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.review-card__stars {
  display: flex;
  align-items: center;
  gap: 2px;
}

.review-card__star {
  flex-shrink: 0;
}

.review-card__rating-text {
  font-size: 0.9rem;
  line-height: 1;
  color: var(--wh-white);
}

.review-card__role {
  margin: 6px 0 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.72);
}

.review-card__text-box {
  position: relative;
  width: 100%;
}

.review-card__text-box--more::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1.8em;
  background: linear-gradient(to bottom, rgb(95 114 86 / 0), #5f7256 72%);
  pointer-events: none;
}

.review-card__text-wrap {
  height: calc(0.98rem * 1.55 * var(--review-text-lines));
  overflow-y: auto;
  width: 100%;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.45) transparent;
}

.review-card__text-wrap::-webkit-scrollbar {
  width: 4px;
}

.review-card__text-wrap::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.45);
  border-radius: 999px;
}

.review-card__text {
  margin: 0;
  line-height: 1.55;
  font-size: 0.98rem;
  color: var(--wh-green-gray);
}

.review-card__ellipsis {
  position: absolute;
  right: 6px;
  bottom: 0;
  color: var(--wh-green-gray);
  font-size: 0.98rem;
  line-height: 1.55;
  pointer-events: none;
}
</style>
