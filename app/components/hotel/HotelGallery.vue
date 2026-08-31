<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import type { HotelGalleryImage } from '~/types/api'
import { isValidGalleryImage } from '~/utils/image'

const props = defineProps<{
  images: HotelGalleryImage[]
  title: string
  placeholder?: boolean
}>()

const COLLAPSED_THUMB_COUNT = 4
const TABLET_THUMB_TIER_WIDE = 6
const TABLET_THUMB_TIER_MEDIUM = 4
const TABLET_THUMB_TIER_NARROW = 2

const PREFETCH_CONCURRENCY = 2

const collapsedThumbCount = ref(COLLAPSED_THUMB_COUNT)

function syncCollapsedThumbCount() {
  if (!import.meta.client) {
    return
  }

  const width = window.innerWidth

  if (width <= 640 || width > 1024) {
    collapsedThumbCount.value = COLLAPSED_THUMB_COUNT
    return
  }

  if (width >= 901) {
    collapsedThumbCount.value = TABLET_THUMB_TIER_WIDE
    return
  }

  if (width >= 769) {
    collapsedThumbCount.value = TABLET_THUMB_TIER_MEDIUM
    return
  }

  collapsedThumbCount.value = TABLET_THUMB_TIER_NARROW
}

let tabletMediaQuery: MediaQueryList | null = null

function handleTabletMediaChange() {
  syncCollapsedThumbCount()
}

const visibleImages = computed(() => props.images.filter(image => isValidGalleryImage(image)))
const isSingleImage = computed(() => visibleImages.value.length === 1)
const isEmpty = computed(() => !props.placeholder && visibleImages.value.length === 0)

const galleryLayoutClass = computed(() => ({
  'hotel-gallery--expanded': expanded.value,
  'hotel-gallery--single': isSingleImage.value,
  [`hotel-gallery--thumbs-${collapsedThumbCount.value}`]: !expanded.value && !isSingleImage.value,
}))

const activeIndex = ref(0)
const expanded = ref(false)

const readyLargeUrls = ref(new Set<string>())

const paintedMainSrc = ref('')

const failedMainUrls = ref(new Set<string>())

const loadedThumbUrls = ref(new Set<string>())

const thumbImages = computed(() => {
  const all = visibleImages.value

  if (expanded.value) {
    return all
  }

  return all.slice(0, collapsedThumbCount.value)
})

const hasMore = computed(() => visibleImages.value.length > collapsedThumbCount.value)

const activeImage = computed(() => visibleImages.value[activeIndex.value] ?? visibleImages.value[0])

const mainImage = computed(() => {
  const item = activeImage.value
  if (!item) {
    return ''
  }

  const large = item.large || ''
  const medium = item.medium || ''
  const thumb = item.thumb || ''

  if (large && readyLargeUrls.value.has(large)) {
    return large
  }

  return medium || thumb || large
})

function handleMainImageError() {
  const item = activeImage.value
  if (!item) {
    return
  }

  const current = paintedMainSrc.value
  if (current) {
    const failed = new Set(failedMainUrls.value)
    failed.add(current)
    failedMainUrls.value = failed
  }

  const candidates = [item.thumb, item.medium, item.large]
    .filter((url): url is string => Boolean(url))

  const next = candidates.find(url => !failedMainUrls.value.has(url))
  if (next) {
    paintedMainSrc.value = next
  }
}

function thumbSrc(image: HotelGalleryImage) {
  return image.thumb || image.medium || image.large || ''
}

function isThumbLoaded(image: HotelGalleryImage) {
  const src = thumbSrc(image)
  return Boolean(src && loadedThumbUrls.value.has(src))
}

function markThumbLoaded(event: Event | HTMLImageElement) {
  const img = event instanceof HTMLImageElement
    ? event
    : event.target as HTMLImageElement | null
  const src = img?.currentSrc || img?.src
  if (!src || loadedThumbUrls.value.has(src)) {
    return
  }

  const next = new Set(loadedThumbUrls.value)
  next.add(src)
  loadedThumbUrls.value = next
}

function bindThumbImg(el: Element | ComponentPublicInstance | null) {
  if (!(el instanceof HTMLImageElement)) {
    return
  }

  if (el.complete && el.naturalWidth > 0) {
    markThumbLoaded(el)
  }
}

function markLargeReady(url: string) {
  if (!url || readyLargeUrls.value.has(url)) {
    return
  }

  const next = new Set(readyLargeUrls.value)
  next.add(url)
  readyLargeUrls.value = next
}

type PrefetchPriority = 'high' | 'normal'

const prefetchQueued = new Set<string>()
const prefetchInFlight = new Set<string>()
const prefetchQueue: Array<{ url: string, priority: PrefetchPriority }> = []
let idlePrefetchHandle: number | null = null

function clearPrefetchQueue() {
  prefetchQueue.length = 0
  prefetchQueued.clear()
  prefetchInFlight.clear()

  if (idlePrefetchHandle != null && import.meta.client) {
    if (typeof cancelIdleCallback === 'function') {
      cancelIdleCallback(idlePrefetchHandle)
    }
    else {
      clearTimeout(idlePrefetchHandle)
    }
    idlePrefetchHandle = null
  }
}

function pumpPrefetchQueue() {
  while (prefetchInFlight.size < PREFETCH_CONCURRENCY && prefetchQueue.length > 0) {
    const next = prefetchQueue.shift()
    if (!next) {
      break
    }

    const { url } = next
    if (readyLargeUrls.value.has(url) || prefetchInFlight.has(url)) {
      prefetchQueued.delete(url)
      continue
    }

    prefetchInFlight.add(url)

    const img = new Image()
    img.decoding = 'async'
    let settled = false

    const finish = (loaded: boolean) => {
      if (settled) {
        return
      }
      settled = true
      prefetchInFlight.delete(url)
      prefetchQueued.delete(url)
      if (loaded) {
        markLargeReady(url)
      }
      pumpPrefetchQueue()
    }

    img.onload = () => finish(true)
    img.onerror = () => finish(false)
    img.src = url

    if (img.complete) {
      finish(img.naturalWidth > 0)
    }
  }
}

function prefetchLarge(url: string, priority: PrefetchPriority = 'normal') {
  if (!url || readyLargeUrls.value.has(url) || !import.meta.client) {
    return
  }

  if (prefetchInFlight.has(url)) {
    return
  }

  if (prefetchQueued.has(url)) {
    if (priority !== 'high') {
      return
    }

    const index = prefetchQueue.findIndex(item => item.url === url)
    if (index >= 0) {
      prefetchQueue.splice(index, 1)
    }
  }

  prefetchQueued.add(url)

  if (priority === 'high') {
    prefetchQueue.unshift({ url, priority })
  }
  else {
    prefetchQueue.push({ url, priority })
  }

  pumpPrefetchQueue()
}

function scheduleIdlePrefetch(urls: string[]) {
  if (!import.meta.client || !urls.length) {
    return
  }

  const run = () => {
    idlePrefetchHandle = null
    for (const url of urls) {
      prefetchLarge(url, 'normal')
    }
  }

  if (typeof requestIdleCallback === 'function') {
    idlePrefetchHandle = requestIdleCallback(run, { timeout: 2500 })
  }
  else {
    idlePrefetchHandle = window.setTimeout(run, 600)
  }
}

function prefetchVisibleLarges(images: HotelGalleryImage[]) {
  const visibleCount = Math.min(images.length, collapsedThumbCount.value)

  for (let index = 0; index < visibleCount; index += 1) {
    const large = images[index]?.large
    if (large) {
      prefetchLarge(large, index === 0 ? 'high' : 'normal')
    }
  }

  const deferred = images
    .slice(visibleCount)
    .map(image => image.large)
    .filter((url): url is string => Boolean(url))

  scheduleIdlePrefetch(deferred)
}

function prefetchGalleryLarge(images: HotelGalleryImage[], priority: PrefetchPriority = 'normal') {
  for (const image of images) {
    if (image.large) {
      prefetchLarge(image.large, priority)
    }
  }
}

async function paintMainSrc(url: string) {
  if (!url || url === paintedMainSrc.value) {
    return
  }

  if (!import.meta.client) {
    paintedMainSrc.value = url
    return
  }

  if (!paintedMainSrc.value) {
    paintedMainSrc.value = url
    return
  }

  const img = new Image()
  img.decoding = 'async'
  img.src = url

  try {
    if (!img.complete) {
      await img.decode()
    }
  }
  catch {
  }

  if (mainImage.value === url && img.naturalWidth > 0) {
    paintedMainSrc.value = url
  }
}

watch(
  collapsedThumbCount,
  () => {
    if (!expanded.value && visibleImages.value.length) {
      prefetchVisibleLarges(visibleImages.value)
    }
  },
)

watch(
  () => visibleImages.value,
  (images) => {
    activeIndex.value = 0
    expanded.value = false
    readyLargeUrls.value = new Set()
    failedMainUrls.value = new Set()
      loadedThumbUrls.value = new Set()
    clearPrefetchQueue()
    paintedMainSrc.value = ''
    prefetchVisibleLarges(images)
    nextTick(() => scrollCarouselToIndex(0))
  },
  { immediate: true },
)

watch(
  mainImage,
  (url) => {
    void paintMainSrc(url)
  },
  { immediate: true },
)

function selectImage(index: number) {
  const item = visibleImages.value[index]
  if (!item) {
    return
  }

  const switching = index !== activeIndex.value
  activeIndex.value = index
  failedMainUrls.value = new Set()

  if (switching) {
    const instant = item.thumb || item.medium || item.large || ''
    if (instant) {
      paintedMainSrc.value = instant
    }
  }

  if (item.large) {
    prefetchLarge(item.large, 'high')
  }
}

function handleThumbClick(thumbIndex: number) {
  const isMoreButton = !expanded.value
    && hasMore.value
    && thumbIndex === thumbImages.value.length - 1

  if (isMoreButton) {
    expanded.value = true
    prefetchGalleryLarge(visibleImages.value, 'normal')
    return
  }

  selectImage(thumbIndex)
}

function handleThumbHover(thumbIndex: number) {
  const item = visibleImages.value[thumbIndex]
  if (item?.large) {
    prefetchLarge(item.large, 'high')
  }
}

const carouselTrackRef = ref<HTMLElement | null>(null)
const carouselScrollLock = ref(false)
let carouselScrollRaf = 0

function carouselSlideSrc(image: HotelGalleryImage) {
  return image.medium || image.thumb || image.large || ''
}

function scrollCarouselToIndex(index: number, behavior: ScrollBehavior = 'auto') {
  const track = carouselTrackRef.value
  if (!track) {
    return
  }

  const slide = track.children[index] as HTMLElement | undefined
  if (!slide) {
    return
  }

  track.scrollTo({ left: slide.offsetLeft, behavior })
}

function handleCarouselScroll() {
  cancelAnimationFrame(carouselScrollRaf)
  carouselScrollRaf = requestAnimationFrame(() => {
    const track = carouselTrackRef.value
    if (!track || carouselScrollLock.value) {
      return
    }

    const scrollLeft = track.scrollLeft
    let closestIndex = 0
    let closestDistance = Infinity

    Array.from(track.children).forEach((child, index) => {
      const slide = child as HTMLElement
      const distance = Math.abs(slide.offsetLeft - scrollLeft)
      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = index
      }
    })

    if (closestIndex === activeIndex.value) {
      return
    }

    const item = visibleImages.value[closestIndex]
    if (!item) {
      return
    }

    carouselScrollLock.value = true
    activeIndex.value = closestIndex
    failedMainUrls.value = new Set()

    const instant = item.thumb || item.medium || item.large || ''
    if (instant) {
      paintedMainSrc.value = instant
    }

    if (item.large) {
      prefetchLarge(item.large, 'high')
    }

    carouselScrollLock.value = false
  })
}

watch(activeIndex, (index) => {
  if (carouselScrollLock.value || !import.meta.client) {
    return
  }

  nextTick(() => scrollCarouselToIndex(index, 'smooth'))
})

const lightboxOpen = ref(false)

function openLightbox() {
  const item = activeImage.value
  if (item?.large) {
    prefetchLarge(item.large, 'high')
  }

  lightboxOpen.value = true
}

function handleLightboxIndex(index: number) {
  selectImage(index)
}

onMounted(() => {
  if (!import.meta.client) {
    return
  }

  syncCollapsedThumbCount()
  tabletMediaQuery = window.matchMedia('(max-width: 1024px)')
  tabletMediaQuery.addEventListener('change', handleTabletMediaChange)
  window.addEventListener('resize', handleTabletMediaChange, { passive: true })
})

onBeforeUnmount(() => {
  if (!import.meta.client) {
    return
  }

  window.removeEventListener('resize', handleTabletMediaChange)
  tabletMediaQuery?.removeEventListener('change', handleTabletMediaChange)
  tabletMediaQuery = null
  clearPrefetchQueue()
})
</script>

<template>
  <div
    v-if="placeholder"
    class="hotel-gallery hotel-gallery--placeholder"
    :class="galleryLayoutClass"
    aria-hidden="true"
  >
    <div class="hotel-gallery__main hotel-gallery__skeleton" />
    <div class="hotel-gallery__thumbs">
      <div
        v-for="index in 6"
        :key="index"
        class="hotel-gallery__thumb hotel-gallery__skeleton"
      />
    </div>
  </div>

  <div
    v-else-if="isEmpty"
    class="hotel-gallery hotel-gallery--empty"
    aria-label="Фотографии отсутствуют"
  >
    <div class="hotel-gallery__main hotel-gallery__skeleton hotel-gallery__empty">
      <span class="hotel-gallery__empty-label">Нет фото</span>
    </div>
  </div>

  <div
    v-else
    class="hotel-gallery"
    :class="galleryLayoutClass"
  >
    <div class="hotel-gallery__main">
      <img
        v-if="paintedMainSrc"
        class="hotel-gallery__main-image"
        :src="paintedMainSrc"
        :alt="`${title} — фото ${activeIndex + 1}`"
        loading="eager"
        decoding="async"
        fetchpriority="high"
        @error="handleMainImageError"
      >

      <div
        ref="carouselTrackRef"
        class="hotel-gallery__carousel-track"
        @scroll.passive="handleCarouselScroll"
      >
        <div
          v-for="(image, index) in visibleImages"
          :key="`${carouselSlideSrc(image)}-${index}`"
          class="hotel-gallery__carousel-slide"
        >
          <img
            :src="carouselSlideSrc(image)"
            :alt="`${title} — фото ${index + 1}`"
            :loading="index === 0 ? 'eager' : 'lazy'"
            decoding="async"
          >
        </div>
      </div>

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

    <div
      v-if="!isSingleImage"
      class="hotel-gallery__thumbs"
    >
      <button
        v-for="(image, index) in thumbImages"
        :key="`${thumbSrc(image)}-${index}`"
        type="button"
        class="hotel-gallery__thumb"
        :class="{ 'hotel-gallery__thumb--active': index === activeIndex }"
        :aria-label="
          !expanded && hasMore && index === thumbImages.length - 1
            ? 'Показать еще'
            : `Показать фото ${index + 1}`
        "
        @click="handleThumbClick(index)"
        @mouseenter="handleThumbHover(index)"
        @focus="handleThumbHover(index)"
      >
        <img
          :ref="bindThumbImg"
          :src="thumbSrc(image)"
          :alt="`${title} — фото ${index + 1}`"
          :loading="expanded ? 'lazy' : 'eager'"
          decoding="async"
          :fetchpriority="index < 2 ? 'high' : 'auto'"
          @load="markThumbLoaded"
        >

        <span
          v-if="!expanded && hasMore && index === thumbImages.length - 1"
          class="hotel-gallery__more"
          :class="{ 'hotel-gallery__more--ready': isThumbLoaded(image) }"
        >
          Показать еще
        </span>
      </button>
    </div>
  </div>

  <HotelGalleryLightbox
    v-model:open="lightboxOpen"
    :images="visibleImages"
    :title="title"
    :start-index="activeIndex"
    @update:index="handleLightboxIndex"
  />
</template>

<style scoped>
.hotel-gallery {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr);
  gap: 8px;
  width: 100%;
  height: 520px;
}

.hotel-gallery--single {
  grid-template-columns: minmax(0, 1fr);
}

.hotel-gallery__main.hotel-gallery__skeleton,
.hotel-gallery__thumb.hotel-gallery__skeleton {
  box-sizing: border-box;
  border: 1px solid #c5cad3;
  background: #dce0e6;
}

.hotel-gallery--placeholder .hotel-gallery__main {
  width: 100%;
  height: 520px;
  min-height: 520px;
}

.hotel-gallery--placeholder .hotel-gallery__thumbs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 8px;
  height: 520px;
  min-height: 520px;
}

.hotel-gallery--placeholder .hotel-gallery__thumb {
  width: 100%;
  min-height: 0;
}

.hotel-gallery--placeholder .hotel-gallery__thumb:nth-child(n + 5) {
  display: none;
}

.hotel-gallery--empty {
  display: block;
  height: 520px;
}

.hotel-gallery--empty .hotel-gallery__main {
  width: 100%;
  height: 520px;
  min-height: 520px;
}

.hotel-gallery__empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.hotel-gallery__empty-label {
  font-size: 1rem;
  color: var(--wh-gray-400);
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
.hotel-gallery__carousel-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.hotel-gallery__carousel-track {
  display: none;
}

.hotel-gallery__carousel-slide {
  overflow: hidden;
  border-radius: var(--wh-radius);
  background: var(--wh-gray-100);
}

.hotel-gallery__thumb:hover img {
  transform: scale(1.02);
}

.hotel-gallery__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
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
  background: rgba(255, 255, 255, 0.55);
  color: var(--wh-gray-700);
  font-size: 1rem;
  font-weight: 700;
  transition: background 0.2s ease, color 0.2s ease;
}

.hotel-gallery__more--ready {
  background: rgba(17, 24, 39, 0.45);
  color: var(--wh-white);
}

@media (max-width: 1024px) and (min-width: 641px) {
  .hotel-gallery,
  .hotel-gallery--placeholder {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-rows: repeat(2, minmax(0, 1fr));
    gap: 8px;
    width: 100%;
    max-width: 100%;
    aspect-ratio: 2 / 1;
    height: auto;
    margin-inline: 0;
  }

  .hotel-gallery--single {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
    aspect-ratio: 2 / 1;
  }

  .hotel-gallery--placeholder .hotel-gallery__main,
  .hotel-gallery__main {
    grid-column: 1;
    grid-row: 1 / span 2;
    width: 100%;
    height: 100%;
    min-height: 0;
    aspect-ratio: auto;
  }

  .hotel-gallery--single .hotel-gallery__main {
    grid-column: 1;
    grid-row: 1;
  }

  .hotel-gallery--placeholder .hotel-gallery__thumbs,
  .hotel-gallery__thumbs {
    display: grid;
    grid-column: 2;
    grid-row: 1 / span 2;
    gap: 8px;
    width: 100%;
    height: 100%;
    min-height: 0;
  }

  .hotel-gallery--placeholder .hotel-gallery__thumb,
  .hotel-gallery:not(.hotel-gallery--expanded) .hotel-gallery__thumb {
    width: 100%;
    height: 100%;
    min-height: 0;
    aspect-ratio: auto;
  }

  .hotel-gallery:not(.hotel-gallery--expanded).hotel-gallery--thumbs-6 .hotel-gallery__thumbs {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: repeat(2, minmax(0, 1fr));
  }

  .hotel-gallery:not(.hotel-gallery--expanded).hotel-gallery--thumbs-4 .hotel-gallery__thumbs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(2, minmax(0, 1fr));
  }

  .hotel-gallery:not(.hotel-gallery--expanded).hotel-gallery--thumbs-2 .hotel-gallery__thumbs {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: repeat(2, minmax(0, 1fr));
  }

  .hotel-gallery--placeholder.hotel-gallery--thumbs-6 .hotel-gallery__thumb:nth-child(n + 5) {
    display: block;
  }

  .hotel-gallery--placeholder.hotel-gallery--thumbs-4 .hotel-gallery__thumb:nth-child(n + 5),
  .hotel-gallery--placeholder.hotel-gallery--thumbs-2 .hotel-gallery__thumb:nth-child(n + 5) {
    display: none;
  }

  .hotel-gallery--placeholder.hotel-gallery--thumbs-2 .hotel-gallery__thumb:nth-child(n + 3) {
    display: none;
  }

  .hotel-gallery--empty {
    display: block;
    aspect-ratio: auto;
    height: auto;
  }

  .hotel-gallery--empty .hotel-gallery__main {
    width: 100%;
    aspect-ratio: 1 / 1;
    height: auto;
    min-height: 0;
    margin-inline: 0;
  }

  .hotel-gallery--expanded {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-rows: repeat(2, minmax(0, 1fr));
    gap: 8px;
    width: 100%;
    max-width: 100%;
    aspect-ratio: 2 / 1;
    height: auto;
    margin-inline: 0;
    overflow: hidden;
  }

  .hotel-gallery--expanded .hotel-gallery__main {
    grid-column: 1;
    grid-row: 1 / span 2;
    width: 100%;
    height: 100%;
    min-height: 0;
    aspect-ratio: auto;
  }

  .hotel-gallery--expanded .hotel-gallery__thumbs {
    grid-column: 2;
    grid-row: 1 / span 2;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: none;
    grid-auto-rows: max-content;
    align-content: start;
    gap: 8px;
    width: 100%;
    height: 100%;
    min-height: 0;
    overflow-y: auto;
    scrollbar-width: thin;
    -webkit-overflow-scrolling: touch;
  }

  .hotel-gallery--expanded .hotel-gallery__thumb {
    width: 100%;
    height: auto;
    min-height: 0;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    padding: 0;
  }

  .hotel-gallery--expanded .hotel-gallery__thumb img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

@media (--wh-mobile) {
  .hotel-gallery,
  .hotel-gallery--placeholder,
  .hotel-gallery--expanded {
    display: block;
    width: 100%;
    max-width: none;
    margin-inline: 0;
    height: auto;
  }

  .hotel-gallery--placeholder .hotel-gallery__thumbs,
  .hotel-gallery__thumbs,
  .hotel-gallery--expanded .hotel-gallery__thumbs {
    display: none;
  }

  .hotel-gallery--placeholder .hotel-gallery__main,
  .hotel-gallery--empty .hotel-gallery__main,
  .hotel-gallery__main,
  .hotel-gallery--expanded .hotel-gallery__main {
    grid-column: auto;
    grid-row: auto;
    width: 100%;
    height: 345px;
    aspect-ratio: auto;
    overflow: visible;
    background: transparent;
  }

  .hotel-gallery--empty {
    height: auto;
  }

  .hotel-gallery__main-image {
    display: none;
  }

  .hotel-gallery__carousel-track {
    display: flex;
    gap: 8px;
    width: 100%;
    height: 345px;
    padding-left: 0;
    padding-right: 0;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-snap-type: x mandatory;
    scroll-padding-left: 0;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .hotel-gallery__carousel-track::-webkit-scrollbar {
    display: none;
  }

  .hotel-gallery__carousel-slide {
    flex: 0 0 345px;
    width: 345px;
    height: 345px;
    scroll-snap-align: start;
    scroll-snap-stop: always;
  }

  .hotel-gallery__expand {
    display: none;
  }
}
</style>

