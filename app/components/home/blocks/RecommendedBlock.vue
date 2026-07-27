<script setup lang="ts">
import type { BookableItem } from '~/types/api'

defineProps<{
  items: BookableItem[]
}>()
</script>

<template>
  <section class="recommended">
    <div class="container">
      <h2 class="section-title">Рекомендуемые базы</h2>
      <p class="section-desc">
        Популярные охотничьи базы с удобным бронированием онлайн.
      </p>
      <div class="recommended__grid">
        <HomeBaseCard
          v-for="item in items"
          :key="item.id"
          :item="item"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.recommended {
  padding-block: 56px 72px;
}

.recommended__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}

@media (--wh-tablet) {
  .recommended__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (--wh-mobile) {
  .recommended__grid {
    grid-template-columns: 1fr;
  }
}
</style>
