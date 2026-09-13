<script setup lang="ts">
import { getLocationMapPath } from '~/utils/location'

// Старые проиндексированные ссылки вида /locations/:slug/:id/map — id больше не нужен.
definePageMeta({
  middleware: to => navigateTo(
    {
      path: getLocationMapPath(String(to.params.slug || '')),
      query: to.query,
      hash: to.hash,
    },
    { redirectCode: 301, replace: true },
  ),
})
</script>

<template>
  <div />
</template>
