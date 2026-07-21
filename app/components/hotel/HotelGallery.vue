<script setup lang="ts">
const props = defineProps<{
  images: string[]
  title: string
}>()

const activeIndex = ref(0)

const visibleImages = computed(() => props.images.slice(0, 5))
const extraCount = computed(() => Math.max(props.images.length - 5, 0))

function selectImage(index: number) {
  activeIndex.value = index
}
</script>

<template>
  <div class="hotel-gallery">
    <button
      type="button"
      class="hotel-gallery__main"
      :aria-label="`Открыть фото ${activeIndex + 1}`"
      @click="selectImage(activeIndex)"
    >
      <img
        :src="visibleImages[activeIndex] ?? visibleImages[0]"
        :alt="`${title} — фото ${activeIndex + 1}`"
        loading="eager"
      >
    </button>

    <div class="hotel-gallery__thumbs">
      <button
        v-for="(image, index) in visibleImages.slice(1)"
        :key="`${image}-${index}`"
        type="button"
        class="hotel-gallery__thumb"
        :class="{ 'hotel-gallery__thumb--active': index + 1 === activeIndex }"
        :aria-label="`Показать фото ${index + 2}`"
        @click="selectImage(index + 1)"
      >
        <img :src="image" :alt="`${title} — фото ${index + 2}`" loading="lazy">

        <span
          v-if="index === visibleImages.slice(1).length - 1 && extraCount"
          class="hotel-gallery__more"
        >
          +{{ extraCount }} фото
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.hotel-gallery {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(0, 1fr);
  gap: 8px;
  min-height: 420px;
}

.hotel-gallery__main,
.hotel-gallery__thumb {
  position: relative;
  overflow: hidden;
  padding: 0;
  border: none;
  border-radius: 18px;
  background: var(--wh-gray-100);
  cursor: pointer;
}

.hotel-gallery__main {
  grid-row: 1 / span 2;
  min-height: 100%;
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
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 8px;
  min-height: 100%;
}

.hotel-gallery__thumb {
  min-height: 0;
  aspect-ratio: auto;
}

.hotel-gallery__thumb--active {
  outline: 2px solid var(--wh-orange-500);
  outline-offset: -2px;
}

.hotel-gallery__more {
  position: absolute;
  inset: 0;
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
    min-height: auto;
  }

  .hotel-gallery__main {
    grid-row: auto;
    aspect-ratio: 4 / 3;
  }

  .hotel-gallery__thumbs {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    grid-template-rows: none;
  }

  .hotel-gallery__thumb {
    aspect-ratio: 1 / 1;
  }
}

@media (max-width: 640px) {
  .hotel-gallery__thumbs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
