<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import type { BreadcrumbItem } from '~/types/breadcrumb'

defineProps<{
  items: BreadcrumbItem[]
}>()

async function onLinkClick(to: RouteLocationRaw, event: MouseEvent) {
  if (
    event.defaultPrevented
    || event.button !== 0
    || event.metaKey
    || event.altKey
    || event.ctrlKey
    || event.shiftKey
  ) {
    return
  }

  event.preventDefault()
  await navigateTo(to)
}
</script>

<template>
  <nav class="app-breadcrumbs" aria-label="Хлебные крошки">
    <template v-for="(item, index) in items" :key="`${item.label}-${index}`">
      <span v-if="index > 0" aria-hidden="true">&gt;</span>
      <NuxtLink
        v-if="item.to"
        :to="item.to"
        :prefetch="false"
        @click="onLinkClick(item.to, $event)"
      >
        {{ item.label }}
      </NuxtLink>
      <span
        v-else-if="index === items.length - 1"
        class="app-breadcrumbs__current"
        aria-current="page"
      >
        {{ item.label }}
      </span>
      <span v-else>{{ item.label }}</span>
    </template>
  </nav>
</template>

<style scoped>
.app-breadcrumbs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 0.875rem;
  color: var(--wh-gray-400);
}

.app-breadcrumbs a {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding-bottom: 2px;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.15s ease;
}

.app-breadcrumbs a::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  border-radius: 2px;
  background: var(--wh-orange-500);
  opacity: 0;
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.28s ease, opacity 0.28s ease;
  pointer-events: none;
}

.app-breadcrumbs a:hover {
  color: var(--wh-gray-900);
}

.app-breadcrumbs a:hover::after {
  opacity: 1;
  transform: scaleX(1);
}

.app-breadcrumbs__current {
  color: var(--wh-gray-900);
}
</style>
