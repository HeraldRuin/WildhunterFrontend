<script setup lang="ts">
definePageMeta({
  layout: 'profile',
  middleware: 'baseadmin',
})

useHead({
  title: 'Таймер предоплаты — WH',
})

const breadcrumbs = [
  { label: 'Главная', to: '/' },
  { label: 'Параметры' },
  { label: 'Таймер предоплаты' },
]
</script>

<template>
  <ProfileTimerSettingsForm
    type="prepayment"
    title="Таймер предоплаты"
    section-title="Настройки таймера предоплаты"
    hint="Установите размер таймера предоплаты в часах (например: 24)"
    :breadcrumbs="breadcrumbs"
  />
</template>
