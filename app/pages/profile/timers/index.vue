<script setup lang="ts">
definePageMeta({
  layout: 'profile',
  middleware: 'baseadmin',
})

await navigateTo('/profile/timers/collection', { replace: true })
</script>

<template>
  <div />
</template>
