<script setup lang="ts">
defineProps<{
  regions: Array<{
    id: number
    title: string
    image: string
  }>
}>()
</script>

<template>
  <section class="regions-block section--cream">
    <div class="container">
      <h2 class="section-title">Популярные регионы</h2>
      <p class="section-desc">Выберите область и найдите базу рядом с вами.</p>
      <div class="regions-block__grid">
        <NuxtLink
          v-for="region in regions"
          :key="region.id"
          :to="`/locations/${region.id}`"
          class="region-card"
        >
          <img :src="region.image" :alt="region.title" loading="lazy">
          <div class="region-card__overlay">
            <h3>{{ region.title }}</h3>
          </div>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.regions-block {
  padding-block: 56px 72px;
}

.section--cream {
  background: var(--wh-cream);
}

.regions-block__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}

.region-card {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  aspect-ratio: 4 / 3;
}

.region-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.region-card:hover img {
  transform: scale(1.04);
}

.region-card__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  padding: 18px;
  background: linear-gradient(transparent, rgba(26, 46, 36, 0.75));
  color: var(--wh-white);
}

.region-card__overlay h3 {
  margin: 0;
  font-size: 1.1rem;
}

@media (max-width: 1024px) {
  .regions-block__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .regions-block__grid {
    grid-template-columns: 1fr;
  }
}
</style>
