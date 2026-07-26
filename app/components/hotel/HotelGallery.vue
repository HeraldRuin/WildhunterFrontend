<script setup lang="ts">
import type { HotelGalleryImage } from '~/types/api'

const props = defineProps<{
  images: HotelGalleryImage[]
  title: string
}>()

const COLLAPSED_THUMB_COUNT = 4

const activeIndex = ref(0)
const expanded = ref(false)
/** large URLs already in browser cache — allows instant swap after medium preview */
const readyLargeUrls = ref(new Set<string>())

const thumbImages = computed(() => {
  const rest = props.images.slice(1)

  if (expanded.value) {
    return rest
  }

  return rest.slice(0, COLLAPSED_THUMB_COUNT)
})

const hasMore = computed(() => props.images.length > 1 + COLLAPSED_THUMB_COUNT)

const activeImage = computed(() => props.images[activeIndex.value] ?? props.images[0])

const mainImage = computed(() => {
  const item = activeImage.value
  if (!item) {
    return ''
  }

  const large = item.large || item.medium || ''
  const medium = item.medium || item.thumb || large

  // Show cached medium immediately; promote to large once prefetched/loaded.
  if (large && readyLargeUrls.value.has(large)) {
    return large
  }

  return medium || large
})

function markLargeReady(url: string) {
  if (!url || readyLargeUrls.value.has(url)) {
    return
  }

  const next = new Set(readyLargeUrls.value)
  next.add(url)
  readyLargeUrls.value = next
}

function prefetchLarge(url: string) {
  if (!url || readyLargeUrls.value.has(url) || !import.meta.client) {
    return
  }

  const img = new Image()
  img.decoding = 'async'
  img.onload = () => markLargeReady(url)
  img.onerror = () => markLargeReady(url)
  img.src = url

  if (img.complete) {
    markLargeReady(url)
  }
}

function prefetchGalleryLarge(images: HotelGalleryImage[]) {
  for (const image of images) {
    if (image.large) {
      prefetchLarge(image.large)
    }
  }
}

watch(
  () => props.images,
  (images) => {
    activeIndex.value = 0
    expanded.value = false
    readyLargeUrls.value = new Set()
    prefetchGalleryLarge(images)
  },
  { immediate: true },
)

function selectImage(index: number) {
  activeIndex.value = index
  const item = props.images[index]
  if (item?.large) {
    prefetchLarge(item.large)
  }
}

function handleThumbClick(thumbIndex: number) {
  const isMoreButton = !expanded.value
    && hasMore.value
    && thumbIndex === thumbImages.value.length - 1

  if (isMoreButton) {
    expanded.value = true
    prefetchGalleryLarge(props.images)
    return
  }

  selectImage(thumbIndex + 1)
}

function handleThumbHover(thumbIndex: number) {
  const item = props.images[thumbIndex + 1]
  if (item?.large) {
    prefetchLarge(item.large)
  }
}

const lightboxOpen = ref(false)
const lightboxZoom = ref(1)
const lightboxPanX = ref(0)
const lightboxPanY = ref(0)
const lightboxDragging = ref(false)
const lightboxStageRef = ref<HTMLElement | null>(null)
const lightboxImgRef = ref<HTMLImageElement | null>(null)

const ZOOM_MIN = 1
const ZOOM_MAX = 4
const ZOOM_STEP = 0.18

let dragStartX = 0
let dragStartY = 0
let dragOriginX = 0
let dragOriginY = 0

const canNavigateLightbox = computed(() => props.images.length > 1)

const lightboxImage = computed(() => {
  const item = activeImage.value
  if (!item) {
    return ''
  }

  return item.large || item.medium || item.thumb || ''
})

const lightboxStageSize = ref({ width: 0, height: 0 })

function measureLightboxStage() {
  const stageEl = lightboxStageRef.value
  if (!stageEl) {
    return
  }

  lightboxStageSize.value = {
    width: stageEl.clientWidth,
    height: stageEl.clientHeight,
  }
}

function getLightboxPanLimits() {
  const stageEl = lightboxStageRef.value
  const imgEl = lightboxImgRef.value

  if (!stageEl || !imgEl || lightboxZoom.value <= ZOOM_MIN) {
    return { maxX: 0, maxY: 0 }
  }

  const stage = stageEl.getBoundingClientRect()
  const img = imgEl.getBoundingClientRect()

  // Use painted size so scale is accounted for correctly.
  return {
    maxX: Math.max(0, (img.width - stage.width) / 2),
    maxY: Math.max(0, (img.height - stage.height) / 2),
  }
}

const canPanLightbox = computed(() => {
  void lightboxZoom.value
  void lightboxPanX.value
  void lightboxPanY.value
  void lightboxStageSize.value
  const { maxX, maxY } = getLightboxPanLimits()
  return maxX > 1 || maxY > 1
})

const lightboxPanStyle = computed(() => ({
  transform: `translate(${lightboxPanX.value}px, ${lightboxPanY.value}px)`,
  cursor: lightboxZoom.value > 1
    ? (canPanLightbox.value
      ? (lightboxDragging.value ? 'grabbing' : 'grab')
      : 'default')
    : 'zoom-in',
}))

const lightboxScaleStyle = computed(() => ({
  transform: `scale(${lightboxZoom.value})`,
  maxWidth: lightboxStageSize.value.width
    ? `${lightboxStageSize.value.width}px`
    : '100%',
  maxHeight: lightboxStageSize.value.height
    ? `${lightboxStageSize.value.height}px`
    : '100%',
}))

function constrainLightboxPanToFrame() {
  const stageEl = lightboxStageRef.value
  const imgEl = lightboxImgRef.value

  if (!stageEl || !imgEl || lightboxZoom.value <= ZOOM_MIN) {
    lightboxPanX.value = 0
    lightboxPanY.value = 0
    return
  }

  const stage = stageEl.getBoundingClientRect()
  const img = imgEl.getBoundingClientRect()

  // Shorter than frame → keep vertically centered (no downward "drop").
  if (img.height <= stage.height + 1) {
    lightboxPanY.value = 0
  }
  else {
    if (img.top > stage.top + 0.5) {
      lightboxPanY.value -= img.top - stage.top
    }
    if (img.bottom < stage.bottom - 0.5) {
      lightboxPanY.value += stage.bottom - img.bottom
    }
  }

  if (img.width <= stage.width + 1) {
    lightboxPanX.value = 0
  }
  else {
    if (img.left > stage.left + 0.5) {
      lightboxPanX.value -= img.left - stage.left
    }
    if (img.right < stage.right - 0.5) {
      lightboxPanX.value += stage.right - img.right
    }
  }
}

function setLightboxPan(x: number, y: number) {
  if (lightboxZoom.value <= ZOOM_MIN) {
    lightboxPanX.value = 0
    lightboxPanY.value = 0
    return
  }

  lightboxPanX.value = x
  lightboxPanY.value = y

  nextTick(() => constrainLightboxPanToFrame())
}

function resetLightboxZoom() {
  lightboxZoom.value = 1
  lightboxPanX.value = 0
  lightboxPanY.value = 0
  lightboxDragging.value = false
}

function openLightbox() {
  const item = activeImage.value
  if (item?.large) {
    prefetchLarge(item.large)
  }

  resetLightboxZoom()
  lightboxOpen.value = true
}

function closeLightbox() {
  lightboxOpen.value = false
  resetLightboxZoom()
}

function showLightboxImage(index: number) {
  if (!props.images.length) {
    return
  }

  const total = props.images.length
  const nextIndex = ((index % total) + total) % total
  selectImage(nextIndex)
  resetLightboxZoom()

  const prev = props.images[(nextIndex - 1 + total) % total]
  const next = props.images[(nextIndex + 1) % total]
  if (prev?.large) {
    prefetchLarge(prev.large)
  }
  if (next?.large) {
    prefetchLarge(next.large)
  }
}

function handleLightboxWheel(event: WheelEvent) {
  event.preventDefault()

  const direction = event.deltaY > 0 ? -1 : 1
  const next = Math.min(
    ZOOM_MAX,
    Math.max(ZOOM_MIN, lightboxZoom.value + direction * ZOOM_STEP),
  )

  lightboxZoom.value = Math.round(next * 100) / 100

  if (lightboxZoom.value <= ZOOM_MIN) {
    lightboxPanX.value = 0
    lightboxPanY.value = 0
    return
  }

  nextTick(() => setLightboxPan(lightboxPanX.value, lightboxPanY.value))
}

function handleLightboxPointerDown(event: PointerEvent) {
  if (!canPanLightbox.value || event.button !== 0) {
    return
  }

  lightboxDragging.value = true
  dragStartX = event.clientX
  dragStartY = event.clientY
  dragOriginX = lightboxPanX.value
  dragOriginY = lightboxPanY.value
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function handleLightboxPointerMove(event: PointerEvent) {
  if (!lightboxDragging.value) {
    return
  }

  setLightboxPan(
    dragOriginX + (event.clientX - dragStartX),
    dragOriginY + (event.clientY - dragStartY),
  )
}

function handleLightboxPointerUp(event: PointerEvent) {
  if (!lightboxDragging.value) {
    return
  }

  lightboxDragging.value = false
  setLightboxPan(lightboxPanX.value, lightboxPanY.value)

  try {
    ;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)
  }
  catch {
    // ignore if capture already released
  }
}

function handleLightboxDoubleClick() {
  if (lightboxZoom.value > ZOOM_MIN) {
    resetLightboxZoom()
    return
  }

  lightboxZoom.value = 2
  nextTick(() => setLightboxPan(0, 0))
}

watch(lightboxZoom, () => {
  nextTick(() => {
    measureLightboxStage()
    setLightboxPan(lightboxPanX.value, lightboxPanY.value)
  })
})

function showPrevLightboxImage() {
  showLightboxImage(activeIndex.value - 1)
}

function showNextLightboxImage() {
  showLightboxImage(activeIndex.value + 1)
}

function handleLightboxKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeLightbox()
    return
  }

  if (!canNavigateLightbox.value) {
    return
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    showPrevLightboxImage()
  }
  else if (event.key === 'ArrowRight') {
    event.preventDefault()
    showNextLightboxImage()
  }
}

watch(lightboxOpen, (isOpen) => {
  if (!import.meta.client) {
    return
  }

  document.body.style.overflow = isOpen ? 'hidden' : ''

  if (isOpen) {
    window.addEventListener('keydown', handleLightboxKeydown)
    nextTick(() => {
      measureLightboxStage()
      constrainLightboxPanToFrame()
    })
  }
  else {
    window.removeEventListener('keydown', handleLightboxKeydown)
  }
})

onBeforeUnmount(() => {
  if (!import.meta.client) {
    return
  }

  document.body.style.overflow = ''
  window.removeEventListener('keydown', handleLightboxKeydown)
})
</script>

<template>
  <div
    class="hotel-gallery"
    :class="{ 'hotel-gallery--expanded': expanded }"
  >
    <div class="hotel-gallery__main">
      <img
        :src="mainImage"
        :alt="`${title} — фото ${activeIndex + 1}`"
        loading="eager"
      >

      <button
        type="button"
        class="hotel-gallery__expand"
        aria-label="Открыть фото крупнее"
        @click="openLightbox"
      >
        <svg
          class="hotel-gallery__expand-icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M9 4H4v5M15 4h5v5M9 20H4v-5M20 15v5h-5"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <div class="hotel-gallery__thumbs">
      <button
        v-for="(image, index) in thumbImages"
        :key="`${image.medium}-${index}`"
        type="button"
        class="hotel-gallery__thumb"
        :class="{ 'hotel-gallery__thumb--active': index + 1 === activeIndex }"
        :aria-label="
          !expanded && hasMore && index === thumbImages.length - 1
            ? 'Показать еще'
            : `Показать фото ${index + 2}`
        "
        @click="handleThumbClick(index)"
        @mouseenter="handleThumbHover(index)"
        @focus="handleThumbHover(index)"
      >
        <img
          :src="image.medium || image.thumb"
          :alt="`${title} — фото ${index + 2}`"
          loading="lazy"
        >

        <span
          v-if="!expanded && hasMore && index === thumbImages.length - 1"
          class="hotel-gallery__more"
        >
          Показать еще
        </span>
      </button>
    </div>
  </div>

  <Teleport to="body">
    <Transition name="hotel-gallery-lightbox">
      <div
        v-if="lightboxOpen"
        class="hotel-gallery-lightbox"
        role="dialog"
        aria-modal="true"
        aria-label="Просмотр фото"
        @click.self="closeLightbox"
      >
        <button
          type="button"
          class="hotel-gallery-lightbox__close"
          aria-label="Закрыть"
          @click="closeLightbox"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M5 5l10 10M15 5L5 15"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </button>

        <div class="hotel-gallery-lightbox__layout">
          <button
            v-if="canNavigateLightbox"
            type="button"
            class="hotel-gallery-lightbox__nav hotel-gallery-lightbox__nav--prev"
            aria-label="Предыдущее фото"
            @click="showPrevLightboxImage"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M15 5l-7 7 7 7"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>

          <div class="hotel-gallery-lightbox__viewer">
            <div
              ref="lightboxStageRef"
              class="hotel-gallery-lightbox__stage"
              @wheel="handleLightboxWheel"
              @pointerdown="handleLightboxPointerDown"
              @pointermove="handleLightboxPointerMove"
              @pointerup="handleLightboxPointerUp"
              @pointercancel="handleLightboxPointerUp"
              @dblclick="handleLightboxDoubleClick"
            >
              <div
                class="hotel-gallery-lightbox__pan"
                :style="lightboxPanStyle"
              >
                <img
                  ref="lightboxImgRef"
                  class="hotel-gallery-lightbox__image"
                  :src="lightboxImage"
                  :alt="`${title} — фото ${activeIndex + 1}`"
                  :style="lightboxScaleStyle"
                  draggable="false"
                  @load="measureLightboxStage"
                >
              </div>
            </div>

            <div
              v-if="images.length > 1"
              class="hotel-gallery-lightbox__dots"
              role="tablist"
              :aria-label="`Фото ${activeIndex + 1} из ${images.length}`"
            >
              <button
                v-for="(_, index) in images"
                :key="`lightbox-dot-${index}`"
                type="button"
                class="hotel-gallery-lightbox__dot"
                :class="{ 'hotel-gallery-lightbox__dot--active': index === activeIndex }"
                role="tab"
                :aria-selected="index === activeIndex"
                :aria-label="`Фото ${index + 1}`"
                @click="showLightboxImage(index)"
              />
            </div>
          </div>

          <button
            v-if="canNavigateLightbox"
            type="button"
            class="hotel-gallery-lightbox__nav hotel-gallery-lightbox__nav--next"
            aria-label="Следующее фото"
            @click="showNextLightboxImage"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M9 5l7 7-7 7"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.hotel-gallery {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr);
  gap: 8px;
  width: 100%;
  height: 520px;
}

.hotel-gallery__main,
.hotel-gallery__thumb {
  position: relative;
  overflow: hidden;
  padding: 0;
  border: none;
  border-radius: var(--wh-radius);
  background: var(--wh-gray-100);
}

.hotel-gallery__thumb {
  cursor: pointer;
}

.hotel-gallery__main {
  width: 100%;
  height: 520px;
}

.hotel-gallery__main img,
.hotel-gallery__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.hotel-gallery__thumb:hover img {
  transform: scale(1.02);
}

.hotel-gallery__expand {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 10px;
  background: rgba(17, 24, 39, 0.55);
  color: var(--wh-white);
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: background 0.2s ease, transform 0.2s ease;
}

.hotel-gallery__expand-icon {
  transform-origin: center;
  transition: transform 0.2s ease;
}

.hotel-gallery__main:hover .hotel-gallery__expand,
.hotel-gallery__expand:hover,
.hotel-gallery__expand:focus-visible {
  background: rgba(17, 24, 39, 0.78);
  transform: scale(1.08);
}

.hotel-gallery__main:hover .hotel-gallery__expand-icon,
.hotel-gallery__expand:hover .hotel-gallery__expand-icon,
.hotel-gallery__expand:focus-visible .hotel-gallery__expand-icon {
  transform: scale(1.12);
}

@media (prefers-reduced-motion: reduce) {
  .hotel-gallery__expand,
  .hotel-gallery__expand-icon {
    transition: none;
  }

  .hotel-gallery__main:hover .hotel-gallery__expand,
  .hotel-gallery__expand:hover,
  .hotel-gallery__expand:focus-visible,
  .hotel-gallery__main:hover .hotel-gallery__expand-icon,
  .hotel-gallery__expand:hover .hotel-gallery__expand-icon,
  .hotel-gallery__expand:focus-visible .hotel-gallery__expand-icon {
    transform: none;
  }
}

.hotel-gallery__thumbs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 8px;
  height: 520px;
  min-height: 0;
}

.hotel-gallery--expanded .hotel-gallery__thumbs {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: none;
  grid-auto-rows: minmax(120px, 1fr);
  overflow-y: auto;
  scrollbar-width: thin;
}

.hotel-gallery__thumb {
  min-height: 0;
  aspect-ratio: auto;
}

.hotel-gallery__thumb--active::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 2;
  border: 2px solid var(--wh-orange-500);
  border-radius: inherit;
  pointer-events: none;
}

.hotel-gallery__more {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  place-items: center;
  background: rgba(17, 24, 39, 0.45);
  color: var(--wh-white);
  font-size: 1rem;
  font-weight: 700;
}

@media (max-width: 900px) {
  .hotel-gallery {
    grid-template-columns: 1fr;
    height: auto;
  }

  .hotel-gallery__main {
    width: 100%;
    height: auto;
    aspect-ratio: 3 / 2;
  }

  .hotel-gallery__thumbs {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    grid-template-rows: none;
    height: auto;
  }

  .hotel-gallery--expanded .hotel-gallery__thumbs {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    max-height: 360px;
  }

  .hotel-gallery__thumb {
    aspect-ratio: 1 / 1;
  }
}

@media (max-width: 640px) {
  .hotel-gallery__thumbs,
  .hotel-gallery--expanded .hotel-gallery__thumbs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

<style>
.hotel-gallery-lightbox {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: grid;
  place-items: center;
  padding: 40px 16px 24px;
  background: rgba(17, 24, 39, 0.88);
  backdrop-filter: blur(6px);
}

.hotel-gallery-lightbox__close {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 3;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 50%;
  background: rgba(17, 24, 39, 0.45);
  color: #fff;
  cursor: pointer;
}

.hotel-gallery-lightbox__close:hover {
  background: rgba(17, 24, 39, 0.7);
}

.hotel-gallery-lightbox__layout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: min(1520px, calc(100vw - 32px));
  max-height: calc(100vh - 88px);
}

.hotel-gallery-lightbox__viewer {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 14px;
  box-sizing: border-box;
  min-width: 0;
  width: min(1400px, calc(100vw - 152px));
  height: min(860px, calc(100vh - 88px));
  padding: 16px 16px 18px;
  border: 1px solid rgba(255, 255, 255, 0.38);
  border-radius: var(--wh-radius);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.25);
}

.hotel-gallery-lightbox__nav {
  flex: 0 0 48px;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 50%;
  background: rgba(17, 24, 39, 0.65);
  color: #fff;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.hotel-gallery-lightbox__nav:hover {
  background: rgba(17, 24, 39, 0.85);
  transform: scale(1.05);
}

.hotel-gallery-lightbox__stage {
  position: relative;
  flex: 1 1 auto;
  display: grid;
  place-items: center;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  touch-action: none;
  user-select: none;
}

.hotel-gallery-lightbox__pan {
  line-height: 0;
  width: fit-content;
  height: fit-content;
  max-width: 100%;
  max-height: 100%;
  will-change: transform;
}

.hotel-gallery-lightbox__dots {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 0 0 auto;
}

.hotel-gallery-lightbox__dot {
  width: 9px;
  height: 9px;
  padding: 0;
  border: 1.5px solid rgba(255, 255, 255, 0.7);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}

.hotel-gallery-lightbox__dot:hover {
  border-color: #fff;
  transform: scale(1.15);
}

.hotel-gallery-lightbox__dot--active {
  background: #fff;
  border-color: #fff;
}

.hotel-gallery-lightbox__image {
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: var(--wh-radius);
  transform-origin: center center;
  will-change: transform;
  transition: none;
}

.hotel-gallery-lightbox-enter-active,
.hotel-gallery-lightbox-leave-active {
  transition: opacity 0.2s ease;
}

.hotel-gallery-lightbox-enter-from,
.hotel-gallery-lightbox-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .hotel-gallery-lightbox {
    padding: 56px 8px 16px;
  }

  .hotel-gallery-lightbox__layout {
    gap: 6px;
    width: calc(100vw - 16px);
  }

  .hotel-gallery-lightbox__viewer {
    width: calc(100vw - 104px);
    height: calc(100vh - 88px);
  }

  .hotel-gallery-lightbox__nav {
    flex-basis: 40px;
    width: 40px;
    height: 40px;
  }

  .hotel-gallery-lightbox__nav svg {
    width: 22px;
    height: 22px;
  }
}
</style>
