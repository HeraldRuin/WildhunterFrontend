<script setup lang="ts">
definePageMeta({
  layout: false,
  path: '/404',
})

setResponseStatus(404)

useHead({
  title: '404 — Страница не найдена',
})
</script>

<template>
  <ErrorPageBlock :status-code="404" />
</template>
