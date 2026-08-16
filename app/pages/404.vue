<script setup lang="ts">
definePageMeta({
  layout: false,
})

setResponseStatus(404)

useHead({
  title: '404 — Страница не найдена',
})
</script>

<template>
  <ErrorPageBlock :status-code="404" />
</template>
