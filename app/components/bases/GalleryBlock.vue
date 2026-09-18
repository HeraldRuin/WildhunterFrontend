<script setup lang="ts">
export interface BasesGalleryItem {
  src: string
  alt: string
  href?: string
}

const FALLBACK_ITEMS: BasesGalleryItem[] = [
  { src: '/images/blog/ohotnichii-tury.jpg', alt: 'Охотничий тур в России' },
  { src: '/images/blog/okhota-na-losya.jpg', alt: 'Охота на лося' },
  { src: '/images/blog/okhota-na-kosulyu.jpg', alt: 'Охота на косулю' },
  { src: '/images/blog/okhota-na-losya-podhod.jpg', alt: 'Охота с подхода' },
  { src: '/images/blog/okhota-na-losya-zagon.jpg', alt: 'Загонная охота' },
  { src: '/images/hunting-farms-hunter.webp', alt: 'Охотник в угодьях' },
  { src: '/images/blog/okhota-na-kosulyu-2.jpg', alt: 'Охота в лесу' },
  { src: '/images/blog/chto-vzyat-na-okhotu.jpg', alt: 'Снаряжение охотника' },
]

const props = defineProps<{
  items?: BasesGalleryItem[]
}>()

const photos = computed(() => {
  const incoming = (props.items ?? []).filter(item => item.src)
  return incoming.length >= 4 ? incoming.slice(0, 8) : FALLBACK_ITEMS
})
</script>

<template>
  <section class="bases-gallery" aria-label="Фотогалерея">
    <div class="container bases-gallery__inner">
      <h2 class="bases-gallery__title">Фотогалерея</h2>
      <div class="bases-gallery__grid">
        <component
          :is="item.href ? 'NuxtLink' : 'div'"
          v-for="item in photos"
          :key="item.src"
          class="bases-gallery__item"
          :to="item.href"
        >
          <img
            :src="item.src"
            :alt="item.alt"
            loading="lazy"
            decoding="async"
          >
        </component>
      </div>
    </div>
  </section>
</template>

<style scoped>
.bases-gallery {
  padding-block: 48px;
  border-top: 1px solid rgb(28 33 28 / 14%);
  background: transparent;
}

.bases-gallery__inner.container {
  display: flex;
  flex-direction: column;
  gap: 28px;
  width: min(100% - 32px, 1240px);
}

.bases-gallery__title {
  margin: 0;
  font-family: "UNCAGE", sans-serif;
  font-size: 28px;
  font-weight: 400;
  line-height: 1.15;
  letter-spacing: 0;
  text-transform: uppercase;
  color: var(--wh-black-text);
}

.bases-gallery__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.bases-gallery__item {
  display: block;
  overflow: hidden;
  aspect-ratio: 4 / 3;
  border-radius: var(--wh-radius);
  background: var(--wh-gray-100);
}

.bases-gallery__item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.bases-gallery__item:hover img {
  transform: scale(1.04);
}

@media (--wh-tablet) {
  .bases-gallery {
    padding-block: 40px;
  }

  .bases-gallery__title {
    font-size: 28px;
  }

  .bases-gallery__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (--wh-mobile) {
  .bases-gallery__title {
    font-size: 24px;
  }

  .bases-gallery__grid {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
}
</style>
