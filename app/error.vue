<script setup lang="ts">
const error = useError()

const statusCode = computed(() => error.value?.statusCode ?? 404)

useHead({
  title: statusCode.value === 404 ? '404 — Страница не найдена' : 'Ошибка сервера',
})
</script>

<template>
  <ErrorPageBlock :status-code="statusCode" />
</template>
