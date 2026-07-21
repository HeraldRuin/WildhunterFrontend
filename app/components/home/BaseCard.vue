<script setup lang="ts">
import type { BookableItem } from '~/types/api'

defineProps<{
  item: BookableItem
}>()
</script>

<template>
  <NuxtLink :to="`/${item.object_model}/${item.id}`" class="card">
    <img
      :src="item.image || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800'"
      :alt="item.title"
      loading="lazy"
    >
    <span v-if="item.is_featured" class="card__badge">Топ</span>
  </NuxtLink>
</template>

<style scoped>
.card {
  position: relative;
  display: block;
  overflow: hidden;
  aspect-ratio: 1 / 1;
  border-radius: 18px;
  background: var(--wh-gray-100);
}

.card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.card:hover img {
  transform: scale(1.04);
}

.card__badge {
  position: absolute;
  top: 14px;
  left: 14px;
  min-width: 52px;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--wh-orange-500);
  color: var(--wh-white);
  font-size: 0.8125rem;
  font-weight: 700;
  text-align: center;
}
</style>
