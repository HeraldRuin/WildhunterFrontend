<script setup lang="ts">
const emit = defineEmits<{
  search: [payload: Record<string, string>]
}>()
</script>

<template>
  <HomeHeroBlock @search="emit('search', $event)" />
</template>
