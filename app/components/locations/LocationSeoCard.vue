<script setup lang="ts">
import type { LocationSeoCard } from '~/content/location-seo/types'

defineProps<{
  card: LocationSeoCard
}>()
</script>

<template>
  <article class="location-seo__card">
    <h3 class="location-seo__card-title">{{ card.title }}</h3>
    <p
      v-if="card.text"
      class="location-seo__card-text"
    >
      {{ card.text }}
    </p>
    <ul
      v-if="card.bullets"
      class="location-seo__list"
    >
      <li
        v-for="item in card.bullets"
        :key="item"
      >
        {{ item }}
      </li>
    </ul>
    <ol
      v-if="card.numbered"
      class="location-seo__list"
    >
      <li
        v-for="item in card.numbered"
        :key="item"
      >
        {{ item }}
      </li>
    </ol>
    <p
      v-if="card.note"
      class="location-seo__note"
    >
      {{ card.note }}
    </p>
  </article>
</template>
