<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <!-- Path only: remount index↔map, keep instance on query/search changes -->
  <NuxtPage :page-key="route.path" />
</template>
