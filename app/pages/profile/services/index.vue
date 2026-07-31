<script setup lang="ts">
definePageMeta({
  layout: 'profile',
  middleware: 'baseadmin',
})

await navigateTo('/profile/services/hunting', { replace: true })
</script>

<template>
  <div />
</template>
