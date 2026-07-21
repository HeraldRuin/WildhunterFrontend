<script setup lang="ts">
import type { LocationItem } from '~/types/api'

defineProps<{
  item: LocationItem
}>()

function formatBasesCount(count: number) {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod100 >= 11 && mod100 <= 14) return `${count} баз`
  if (mod10 === 1) return `${count} база`
  if (mod10 >= 2 && mod10 <= 4) return `${count} базы`
  return `${count} баз`
}
</script>

<template>
  <NuxtLink :to="`/regions/${item.id}`" class="location-card">
    <img :src="item.image" :alt="item.title" loading="lazy">
    <div class="location-card__overlay">
      <h3 class="location-card__title">{{ item.title }}</h3>
      <p class="location-card__count">{{ formatBasesCount(item.bases_count) }}</p>
    </div>
  </NuxtLink>
</template>

<style scoped>
.location-card {
  position: relative;
  display: block;
  overflow: hidden;
  aspect-ratio: 4 / 3;
  border-radius: 18px;
  color: var(--wh-white);
}

.location-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.location-card:hover img {
  transform: scale(1.04);
}

.location-card__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 24px;
  text-align: center;
  background: rgba(17, 24, 39, 0.28);
}

.location-card__title {
  margin: 0;
  font-size: clamp(1.125rem, 2vw, 1.5rem);
  line-height: 1.3;
  font-weight: 700;
}

.location-card__count {
  margin: 0;
  font-size: clamp(0.95rem, 1.5vw, 1.125rem);
  font-weight: 500;
  opacity: 0.95;
}
</style>
