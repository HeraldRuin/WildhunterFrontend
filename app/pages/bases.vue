<script setup lang="ts">
const route = useRoute()
</script>

<template>

  <NuxtPage :page-key="route.path" />
</template>
