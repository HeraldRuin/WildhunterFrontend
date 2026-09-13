<script setup lang="ts">
import { getLocationPath } from '~/utils/location'

// Старые проиндексированные ссылки вида /locations/:slug/:id — id больше не нужен.
definePageMeta({
  middleware: to => navigateTo(
    {
      path: getLocationPath(String(to.params.slug || '')),
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
