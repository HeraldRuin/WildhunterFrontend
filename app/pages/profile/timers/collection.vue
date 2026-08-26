<script setup lang="ts">
definePageMeta({
  layout: 'profile',
  middleware: 'baseadmin',
})

useHead({
  title: 'Таймер сбора — WH',
})

const breadcrumbs = [
  { label: 'Главная', to: '/' },
  { label: 'Параметры' },
  { label: 'Таймер сбора' },
]
</script>

<template>
  <ProfileTimerSettingsForm
    type="collection"
    title="Таймер сбора"
    section-title="Настройки таймера сбора"
    hint="Установите размер таймера сбора в часах (например: 24)"
    :breadcrumbs="breadcrumbs"
  />
</template>
