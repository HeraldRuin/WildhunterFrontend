<script setup lang="ts">
import type { HotelGalleryImage } from '~/types/api'
import { isValidGalleryImage } from '~/utils/image'

const props = defineProps<{
  open: boolean
  images: HotelGalleryImage[]
  title?: string
  startIndex?: number
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:index': [value: number]
}>()

const ZOOM_MIN = 1
const ZOOM_MAX = 4
const ZOOM_STEP = 0.18

const activeIndex = ref(0)
const lightboxZoom = ref(1)
const lightboxPanX = ref(0)
const lightboxPanY = ref(0)
const lightboxDragging = ref(false)
const lightboxStageRef = ref<HTMLElement | null>(null)
const lightboxImgRef = ref<HTMLImageElement | null>(null)
const lightboxStageSize = ref({ width: 0, height: 0 })
const failedUrls = ref(new Set<string>())

const activePointers = ref<Map<number, { x: number, y: number }>>(new Map())
const pinchActive = ref(false)
const pinchStartDistance = ref(0)
const pinchStartZoom = ref(1)

let dragStartX = 0
let dragStartY = 0
let dragOriginX = 0
let dragOriginY = 0

const visibleImages = computed(() => props.images.filter(image => isValidGalleryImage(image)))
const canNavigate = computed(() => visibleImages.value.length > 1)
const activeImage = computed(() => visibleImages.value[activeIndex.value] ?? visibleImages.value[0])

const lightboxImage = computed(() => {
  const item = activeImage.value
  if (!item) {
    return ''
  }

  const candidates = [item.large, item.medium, item.thumb]
    .filter((url): url is string => Boolean(url))

  return candidates.find(url => !failedUrls.value.has(url)) || ''
})

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

  return {
    maxX: Math.max(0, (img.width - stage.width) / 2),
    maxY: Math.max(0, (img.height - stage.height) / 2),
  }
}

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

function closeLightbox() {
  emit('update:open', false)
  resetLightboxZoom()
}

function showImage(index: number) {
  if (!visibleImages.value.length) {
    return
  }

  const total = visibleImages.value.length
  activeIndex.value = ((index % total) + total) % total
  emit('update:index', activeIndex.value)
  resetLightboxZoom()
}

function showPrev() {
  showImage(activeIndex.value - 1)
}

function showNext() {
  showImage(activeIndex.value + 1)
}

function handleImageError() {
  const current = lightboxImage.value
  if (!current) {
    return
  }

  const failed = new Set(failedUrls.value)
  failed.add(current)
  failedUrls.value = failed
}

function handleWheel(event: WheelEvent) {
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

function handlePointerDown(event: PointerEvent) {
  if (event.cancelable) {
    event.preventDefault()
  }

  const nextPointers = new Map(activePointers.value)
  nextPointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
  activePointers.value = nextPointers

  if (activePointers.value.size === 2) {
    const entries = Array.from(activePointers.value.values())
    const dx = entries[0].x - entries[1].x
    const dy = entries[0].y - entries[1].y
    const distance = Math.hypot(dx, dy)

    pinchActive.value = true
    pinchStartDistance.value = distance || 1
    pinchStartZoom.value = lightboxZoom.value

    lightboxDragging.value = false
    lightboxPanX.value = 0
    lightboxPanY.value = 0

    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    return
  }

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

function handlePointerMove(event: PointerEvent) {
  const nextPointers = new Map(activePointers.value)
  if (nextPointers.has(event.pointerId)) {
    nextPointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    activePointers.value = nextPointers
  }

  if (pinchActive.value && activePointers.value.size === 2) {
    const entries = Array.from(activePointers.value.values())
    const dx = entries[0].x - entries[1].x
    const dy = entries[0].y - entries[1].y
    const distance = Math.hypot(dx, dy) || 1

    const ratio = distance / pinchStartDistance.value
    const next = pinchStartZoom.value * ratio
    const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next))

    lightboxZoom.value = Math.round(clamped * 100) / 100
    lightboxPanX.value = 0
    lightboxPanY.value = 0

    if (event.cancelable) {
      event.preventDefault()
    }

    return
  }

  if (!lightboxDragging.value) {
    return
  }

  setLightboxPan(
    dragOriginX + (event.clientX - dragStartX),
    dragOriginY + (event.clientY - dragStartY),
  )
}

function handlePointerUp(event: PointerEvent) {
  const nextPointers = new Map(activePointers.value)
  nextPointers.delete(event.pointerId)
  activePointers.value = nextPointers

  if (pinchActive.value && activePointers.value.size < 2) {
    pinchActive.value = false
    lightboxDragging.value = false
    return
  }

  if (!lightboxDragging.value) {
    return
  }

  lightboxDragging.value = false
  setLightboxPan(lightboxPanX.value, lightboxPanY.value)

  try {
    ;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)
  }
  catch {
  }
}

function handleDoubleClick() {
  if (lightboxZoom.value > ZOOM_MIN) {
    resetLightboxZoom()
    return
  }

  lightboxZoom.value = 2
  nextTick(() => setLightboxPan(0, 0))
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeLightbox()
    return
  }

  if (!canNavigate.value) {
    return
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    showPrev()
  }
  else if (event.key === 'ArrowRight') {
    event.preventDefault()
    showNext()
  }
}

watch(() => props.open, (isOpen) => {
  if (!import.meta.client) {
    return
  }

  if (isOpen) {
    activeIndex.value = Math.max(0, Math.min(props.startIndex ?? 0, Math.max(visibleImages.value.length - 1, 0)))
    failedUrls.value = new Set()
    resetLightboxZoom()
    window.addEventListener('keydown', handleKeydown)
    nextTick(() => {
      measureLightboxStage()
      constrainLightboxPanToFrame()
    })
    return
  }

  window.removeEventListener('keydown', handleKeydown)
})

watch(lightboxZoom, () => {
  nextTick(() => {
    measureLightboxStage()
    setLightboxPan(lightboxPanX.value, lightboxPanY.value)
  })
})

const isOpen = computed(() => props.open)
useBodyScrollLock(isOpen)

onBeforeUnmount(() => {
  if (!import.meta.client) {
    return
  }

  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="hotel-gallery-lightbox">
      <div
        v-if="open && visibleImages.length"
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
            v-if="canNavigate"
            type="button"
            class="hotel-gallery-lightbox__nav hotel-gallery-lightbox__nav--prev"
            aria-label="Предыдущее фото"
            @click="showPrev"
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
              @wheel="handleWheel"
              @pointerdown="handlePointerDown"
              @pointermove="handlePointerMove"
              @pointerup="handlePointerUp"
              @pointercancel="handlePointerUp"
              @dblclick="handleDoubleClick"
            >
              <div
                class="hotel-gallery-lightbox__pan"
                :style="lightboxPanStyle"
              >
                <img
                  ref="lightboxImgRef"
                  class="hotel-gallery-lightbox__image"
                  :src="lightboxImage"
                  :alt="`${title || 'Номер'} — фото ${activeIndex + 1}`"
                  :style="lightboxScaleStyle"
                  draggable="false"
                  @load="measureLightboxStage"
                  @error="handleImageError"
                >
              </div>
            </div>

            <div
              v-if="visibleImages.length > 1"
              class="hotel-gallery-lightbox__dots"
              role="tablist"
              :aria-label="`Фото ${activeIndex + 1} из ${visibleImages.length}`"
            >
              <button
                v-for="(_, index) in visibleImages"
                :key="`lightbox-dot-${index}`"
                type="button"
                class="hotel-gallery-lightbox__dot"
                :class="{ 'hotel-gallery-lightbox__dot--active': index === activeIndex }"
                role="tab"
                :aria-selected="index === activeIndex"
                :aria-label="`Фото ${index + 1}`"
                @click="showImage(index)"
              />
            </div>
          </div>

          <button
            v-if="canNavigate"
            type="button"
            class="hotel-gallery-lightbox__nav hotel-gallery-lightbox__nav--next"
            aria-label="Следующее фото"
            @click="showNext"
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

@media (--wh-mobile) {
  .hotel-gallery-lightbox {
    padding: 56px 8px 16px;
  }

  .hotel-gallery-lightbox__layout {
    gap: 6px;
    width: calc(100vw - 16px);
  }

  .hotel-gallery-lightbox__viewer {
    width: calc(100vw - 104px);
    height: auto;
    max-height: calc(100vh - 88px);
  }

  .hotel-gallery-lightbox__stage {
    flex: 0 0 auto;
    height: min(60vh, 440px);
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
