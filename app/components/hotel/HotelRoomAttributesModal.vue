<script setup lang="ts">
import type { HotelGalleryImage } from '~/types/api'
import type { HotelRoomOption } from '~/types/hotelBooking'

const props = defineProps<{
  open: boolean
  room: HotelRoomOption | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const lightboxOpen = ref(false)
const lightboxIndex = ref(0)
const galleryTrackRef = ref<HTMLElement | null>(null)
const galleryActiveIndex = ref(0)
let galleryScrollRaf = 0

const isOpen = computed(() => props.open && Boolean(props.room))

const galleryImages = computed<HotelGalleryImage[]>(() => {
  const room = props.room
  if (!room) {
    return []
  }

  if (room.gallery.length) {
    return room.gallery
  }

  if (room.image) {
    return [{
      large: room.image,
      medium: room.image,
      thumb: room.image,
    }]
  }

  return []
})

const showGalleryDots = computed(() => galleryImages.value.length > 1)

useBodyScrollLock(isOpen)

function close() {
  emit('update:open', false)
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    close()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && !lightboxOpen.value) {
    close()
  }
}

function imageSrc(image: HotelGalleryImage) {
  return image.medium || image.large || image.thumb
}

function openLightbox(index: number) {
  lightboxIndex.value = index
  lightboxOpen.value = true
}

function handleGalleryScroll() {
  cancelAnimationFrame(galleryScrollRaf)
  galleryScrollRaf = requestAnimationFrame(() => {
    const track = galleryTrackRef.value
    if (!track) {
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

    galleryActiveIndex.value = closestIndex
  })
}

function scrollGalleryToIndex(index: number) {
  const track = galleryTrackRef.value
  const slide = track?.children[index] as HTMLElement | undefined
  if (!track || !slide) {
    return
  }

  track.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' })
  galleryActiveIndex.value = index
}

watch(isOpen, async (open) => {
  if (!open) {
    lightboxOpen.value = false
    galleryActiveIndex.value = 0
    return
  }

  galleryActiveIndex.value = 0
  await nextTick()
  galleryTrackRef.value?.scrollTo({ left: 0 })
})

watch(
  () => props.room?.id,
  async () => {
    galleryActiveIndex.value = 0
    await nextTick()
    galleryTrackRef.value?.scrollTo({ left: 0 })
  },
)

onUnmounted(() => {
  cancelAnimationFrame(galleryScrollRaf)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="room-attrs-modal">
      <div
        v-if="isOpen && room"
        class="room-attrs-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-attrs-modal-title"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <div class="room-attrs-modal__card">
          <CommonModalCloseButton @click="close" />

          <header class="room-attrs-modal__header">
            <h2 id="room-attrs-modal-title" class="room-attrs-modal__title">
              {{ room.title }}
            </h2>
          </header>

          <div class="room-attrs-modal__content">
            <div class="room-attrs-modal__sidebar">
              <h3 class="room-attrs-modal__sidebar-title">
                Услуги и удобства
              </h3>

              <div
                v-if="room.attributes.length"
                class="room-attrs-modal__attrs"
              >
                <section
                  v-for="group in room.attributes"
                  :key="group.id"
                  class="room-attrs-modal__group"
                >
                  <h4 class="room-attrs-modal__group-title">{{ group.name }}</h4>
                  <ul class="room-attrs-modal__list">
                    <li
                      v-for="term in group.terms"
                      :key="term.id"
                      class="room-attrs-modal__item"
                    >
                      <img
                        v-if="term.imageUrl"
                        class="room-attrs-modal__term-image"
                        :src="term.imageUrl"
                        alt=""
                        width="14"
                        height="14"
                      >
                      <i
                        v-else-if="term.icon"
                        class="room-attrs-modal__term-icon"
                        :class="term.icon"
                        aria-hidden="true"
                      />
                      <span>{{ term.name }}</span>
                    </li>
                  </ul>
                </section>
              </div>

              <p
                v-else
                class="room-attrs-modal__attrs-empty"
              >
                Список услуг пока не указан
              </p>
            </div>

            <div class="room-attrs-modal__gallery-block">
              <div
                ref="galleryTrackRef"
                class="room-attrs-modal__gallery"
                @scroll.passive="handleGalleryScroll"
              >
                <button
                  v-for="(image, index) in galleryImages"
                  :key="`${image.large}-${index}`"
                  type="button"
                  class="room-attrs-modal__photo"
                  :aria-label="`Открыть фото ${index + 1}`"
                  @click="openLightbox(index)"
                >
                  <img
                    :src="imageSrc(image)"
                    :alt="`${room.title} — фото ${index + 1}`"
                    loading="lazy"
                    decoding="async"
                  >
                </button>

                <div
                  v-if="!galleryImages.length"
                  class="room-attrs-modal__photo-empty"
                >
                  Нет фото
                </div>
              </div>

              <div
                v-if="showGalleryDots"
                class="room-attrs-modal__dots"
                role="tablist"
                aria-label="Фотографии номера"
              >
                <button
                  v-for="(image, index) in galleryImages"
                  :key="`gallery-dot-${index}`"
                  type="button"
                  class="room-attrs-modal__dot"
                  :class="{ 'room-attrs-modal__dot--active': index === galleryActiveIndex }"
                  :aria-label="`Фото ${index + 1} из ${galleryImages.length}`"
                  :aria-current="index === galleryActiveIndex ? 'true' : undefined"
                  @click="scrollGalleryToIndex(index)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <HotelGalleryLightbox
      v-model:open="lightboxOpen"
      :images="galleryImages"
      :title="room?.title"
      :start-index="lightboxIndex"
    />
  </Teleport>
</template>

<style scoped>
.room-attrs-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  isolation: isolate;
}

.room-attrs-modal::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: rgba(17, 24, 39, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  pointer-events: none;
}

.room-attrs-modal__card {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(100%, 1120px);
  max-height: min(90vh, 860px);
  padding: 24px 28px 28px;
  border: 1px solid var(--wh-gray-200);
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
  overflow: hidden;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.room-attrs-modal__header {
  flex-shrink: 0;
  padding-right: 44px;
  margin-bottom: 18px;
}

.room-attrs-modal__title {
  margin: 0;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: clamp(1.15rem, 2vw, 1.4rem);
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.04em;
  color: var(--wh-black-text);
}

.room-attrs-modal__content {
  display: grid;
  grid-template-columns: minmax(280px, 0.95fr) minmax(0, 1.55fr);
  grid-template-areas: "sidebar gallery";
  gap: 24px;
  min-height: 0;
  flex: 1 1 auto;
  overflow: hidden;
}

.room-attrs-modal__gallery-block {
  grid-area: gallery;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  min-height: 0;
}

.room-attrs-modal__gallery {
  display: flex;
  flex-wrap: nowrap;
  align-items: stretch;
  gap: 12px;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0;
  box-sizing: border-box;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.room-attrs-modal__gallery::-webkit-scrollbar {
  display: none;
}

.room-attrs-modal__photo {
  position: relative;
  box-sizing: border-box;
  flex: 0 0 calc(30% - 6px);
  width: calc(30% - 6px);
  min-width: 100px;
  aspect-ratio: 4 / 3;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 12px;
  background: var(--wh-gray-100);
  overflow: hidden;
  cursor: pointer;
  scroll-snap-align: start;
}

.room-attrs-modal__photo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.room-attrs-modal__photo-empty {
  flex: 0 0 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  border-radius: 12px;
  background: var(--wh-gray-100);
  color: var(--wh-gray-600);
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
}

.room-attrs-modal__dots {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 0 0 auto;
}

.room-attrs-modal__dot {
  width: 8px;
  height: 8px;
  padding: 0;
  border: 1px solid rgb(28 33 28 / 25%);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.room-attrs-modal__dot:hover:not(.room-attrs-modal__dot--active) {
  border-color: rgb(28 33 28 / 45%);
}

.room-attrs-modal__dot--active {
  border-color: #e8883a;
  background: #e8883a;
}

.room-attrs-modal__sidebar {
  grid-area: sidebar;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  padding-right: 4px;
}

.room-attrs-modal__sidebar-title {
  margin: 0 0 16px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.03em;
  color: var(--wh-black-text);
}

.room-attrs-modal__attrs {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.room-attrs-modal__group {
  min-width: 0;
}

.room-attrs-modal__group-title {
  margin: 0 0 6px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.02em;
  color: var(--wh-gray-600);
}

.room-attrs-modal__list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.room-attrs-modal__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 0.88rem;
  font-weight: 500;
  line-height: 1.35;
  letter-spacing: -0.02em;
  color: var(--wh-black-text);
}

.room-attrs-modal__term-image {
  display: block;
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  object-fit: contain;
}

.room-attrs-modal__term-icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 14px;
  font-size: 13px;
  line-height: 1;
  color: var(--wh-green);
}

.room-attrs-modal__attrs-empty {
  margin: 0;
  color: var(--wh-gray-600);
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
}

.room-attrs-modal-enter-active,
.room-attrs-modal-leave-active {
  transition: visibility 0.2s linear;
}

.room-attrs-modal-enter-from,
.room-attrs-modal-leave-to {
  visibility: visible;
}

.room-attrs-modal-enter-from .room-attrs-modal__card,
.room-attrs-modal-leave-to .room-attrs-modal__card {
  opacity: 0;
  transform: translateY(8px);
}

@media (--wh-tablet) {
  .room-attrs-modal {
    padding: 12px;
  }

  .room-attrs-modal__card {
    padding: 18px 16px 16px;
    max-height: calc(100vh - 24px);
  }

  .room-attrs-modal__content {
    grid-template-columns: 1fr;
    grid-template-areas:
      "sidebar"
      "gallery";
    gap: 18px;
  }

  .room-attrs-modal__photo {
    flex-basis: min(132px, 48%);
    width: min(132px, 48%);
    min-width: min(132px, 48%);
  }

  .room-attrs-modal__sidebar {
    height: auto;
    max-height: none;
  }
}
</style>
