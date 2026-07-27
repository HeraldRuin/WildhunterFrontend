<script setup lang="ts">
import type { BookableItem, LocationItem } from '~/types/api'

const props = defineProps<{
  block: {
    type: string
    model: Record<string, unknown>
  }
}>()

const emit = defineEmits<{
  search: [payload: Record<string, string>]
}>()

const model = computed(() => props.block.model || {})
const searchBlockTypes = [
  'form_search_all_service',
  'form_search_tour',
  'form_search_hotel',
  'form_search_space',
  'form_search_car',
  'form_search_event',
  'form_search_flight',
]

const listBlockTypes = [
  'list_tours',
  'list_hotel',
  'list_space',
  'list_car',
  'list_event',
  'list_boat',
  'list_flight',
]

const items = computed(() => (model.value.data as BookableItem[]) || [])
const locations = computed(() => (model.value.data as LocationItem[]) || [])
const featuredItems = computed(() => (model.value.list_item as Array<Record<string, unknown>>) || [])
</script>

<template>
  <HomeHeroSearch
    v-if="searchBlockTypes.includes(block.type)"
    :title="String(model.title || '')"
    :sub-title="String(model.sub_title || '')"
    :bg-image="String(model.bg_image_url || model.bg_image || '')"
    :service-types="(model.service_types as string[]) || ['tour']"
    @search="emit('search', $event)"
  />

  <section
    v-else-if="listBlockTypes.includes(block.type)"
    class="section"
  >
    <div class="container">
      <h2 class="section-title">{{ model.title || 'Рекомендуемые базы' }}</h2>
      <p v-if="model.desc" class="section-desc">{{ model.desc }}</p>

      <div class="grid">
        <HomeBaseCard
          v-for="item in items"
          :key="`${item.object_model}-${item.id}`"
          :item="item"
        />
      </div>
    </div>
  </section>

  <section
    v-else-if="block.type === 'list_locations'"
    class="section section--cream"
  >
    <div class="container">
      <h2 class="section-title">{{ model.title || 'Популярные регионы' }}</h2>
      <p v-if="model.desc" class="section-desc">{{ model.desc }}</p>

      <div class="regions">
        <NuxtLink
          v-for="location in locations"
          :key="location.id"
          :to="`/locations/${location.id}`"
          class="region-card"
        >
          <img
            :src="location.image || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600'"
            :alt="location.title"
            loading="lazy"
          >
          <div class="region-card__overlay">
            <h3>{{ location.title }}</h3>
          </div>
        </NuxtLink>
      </div>
    </div>
  </section>

  <section
    v-else-if="block.type === 'list_featured_item'"
    class="section"
  >
    <div class="container features">
      <article
        v-for="(item, index) in featuredItems"
        :key="index"
        class="feature"
      >
        <div class="feature__icon">✓</div>
        <h3>{{ item.title }}</h3>
        <p>{{ item.sub_title }}</p>
      </article>
    </div>
  </section>

  <section
    v-else-if="block.type === 'call_to_action'"
    class="cta"
  >
    <div class="container cta__inner">
      <div>
        <h2>{{ model.title || 'Готовы к новому приключению?' }}</h2>
        <p>{{ model.sub_title }}</p>
      </div>
      <NuxtLink
        v-if="model.link_more"
        :to="String(model.link_more)"
        class="btn btn--primary"
      >
        {{ model.link_title || 'Подробнее' }}
      </NuxtLink>
    </div>
  </section>

  <section
    v-else-if="block.type === 'offer_block'"
    class="section"
  >
    <div class="container offers">
      <article
        v-for="(item, index) in (model.list_item as Array<Record<string, unknown>>) || []"
        :key="index"
        class="offer"
        :style="{ backgroundImage: `url(${item.background_image || ''})` }"
      >
        <span v-if="item.featured_text" class="offer__tag">{{ item.featured_text }}</span>
        <h3>{{ item.title }}</h3>
        <p v-html="item.desc" />
        <NuxtLink
          v-if="item.link_more"
          :to="String(item.link_more)"
          class="btn btn--ghost"
        >
          {{ item.link_title }}
        </NuxtLink>
      </article>
    </div>
  </section>
</template>

<style scoped>
.section {
  padding-block: 64px;
}

.section--cream {
  background: var(--wh-cream);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.regions {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

.region-card {
  position: relative;
  overflow: hidden;
  border-radius: var(--wh-radius);
  aspect-ratio: 4 / 3;
}

.region-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.region-card:hover img {
  transform: scale(1.05);
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

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 24px;
}

.feature {
  padding: 24px;
  border-radius: var(--wh-radius);
  background: var(--wh-cream);
}

.feature__icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-bottom: 16px;
  border-radius: 12px;
  background: var(--wh-green-800);
  color: var(--wh-white);
  font-weight: 700;
}

.feature h3 {
  margin: 0 0 8px;
}

.feature p {
  margin: 0;
  color: var(--wh-gray-600);
  line-height: 1.5;
}

.cta {
  padding-block: 56px;
  background: var(--wh-green-800);
  color: var(--wh-white);
}

.cta__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.cta h2 {
  margin: 0 0 8px;
  font-size: clamp(1.5rem, 2vw, 2rem);
}

.cta p {
  margin: 0;
  color: rgba(255, 255, 255, 0.78);
}

.offers {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.offer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 280px;
  padding: 24px;
  border-radius: var(--wh-radius-lg);
  background-size: cover;
  background-position: center;
  color: var(--wh-white);
  background-color: var(--wh-green-700);
}

.offer__tag {
  align-self: flex-start;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--wh-orange-500);
  font-size: 0.75rem;
  font-weight: 700;
}

.offer h3 {
  margin: 0;
  font-size: 1.4rem;
}

.offer p {
  margin: 0;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.85);
}

@media (--wh-narrow) {
  .section {
    padding-block: 48px;
  }

  .cta__inner {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
