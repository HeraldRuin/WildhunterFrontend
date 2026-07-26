<script setup lang="ts">
import type { HotelGalleryImage } from '~/types/api'

const props = defineProps<{
  images: HotelGalleryImage[]
  title: string
}>()

const COLLAPSED_THUMB_COUNT = 4

const activeIndex = ref(0)
const expanded = ref(false)

const thumbImages = computed(() => {
  const rest = props.images.slice(1)

  if (expanded.value) {
    return rest
  }

  return rest.slice(0, COLLAPSED_THUMB_COUNT)
})

const hasMore = computed(() => props.images.length > 1 + COLLAPSED_THUMB_COUNT)

const mainImage = computed(() => {
  const item = props.images[activeIndex.value] ?? props.images[0]
  return item?.large || item?.medium || ''
})

watch(
  () => props.images,
  () => {
    activeIndex.value = 0
    expanded.value = false
  },
)

function selectImage(index: number) {
  activeIndex.value = index
}

function handleThumbClick(thumbIndex: number) {
  const isMoreButton = !expanded.value
    && hasMore.value
    && thumbIndex === thumbImages.value.length - 1

  if (isMoreButton) {
    expanded.value = true
    return
  }

  selectImage(thumbIndex + 1)
}
</script>

<template>
  <div
    class="hotel-gallery"
    :class="{ 'hotel-gallery--expanded': expanded }"
  >
    <button
      type="button"
      class="hotel-gallery__main"
      :aria-label="`Фото ${activeIndex + 1}`"
      @click="selectImage(activeIndex)"
    >
      <img
        :src="mainImage"
        :alt="`${title} — фото ${activeIndex + 1}`"
        loading="eager"
      >
    </button>

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

.hotel-gallery__main:hover img,
.hotel-gallery__thumb:hover img {
  transform: scale(1.02);
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
