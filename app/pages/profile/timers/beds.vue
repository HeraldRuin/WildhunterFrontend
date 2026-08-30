<script setup lang="ts">
definePageMeta({
  layout: 'profile',
  middleware: 'baseadmin',
})

useHead({
  title: 'Таймер койко-мест — WH',
})

const breadcrumbs = [
  { label: 'Главная', to: '/' },
  { label: 'Таймер койко-мест' },
]
</script>

<template>
  <ProfileTimerSettingsForm
    type="beds"
    title="Таймер койко-мест"
    section-title="Настройки таймера койко-мест"
    hint="Установите размер таймера койко-мест в часах (например: 24)"
    :breadcrumbs="breadcrumbs"
  />
</template>
