<script setup lang="ts">
withDefaults(defineProps<{
  loading?: boolean
}>(), {
  loading: false,
})

const emit = defineEmits<{
  search: [payload: Record<string, string>]
}>()
</script>

<template>
  <HomeHeroBlock :loading="loading" @search="emit('search', $event)" />
</template>
