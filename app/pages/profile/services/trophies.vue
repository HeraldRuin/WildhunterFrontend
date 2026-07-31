<script setup lang="ts">
definePageMeta({
  layout: 'profile',
  middleware: 'baseadmin',
})

useHead({
  title: 'Трофеи и штрафы — WH',
})
</script>

<template>
  <div class="profile-admin-page">
    <h1 class="profile-admin-page__title">Трофеи и штрафы</h1>
    <p class="profile-admin-page__hint">Раздел в разработке</p>
  </div>
</template>

<style scoped>
.profile-admin-page {
  padding: 32px;
}

.profile-admin-page__title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 700;
  color: var(--wh-black, #1a1a1a);
}

.profile-admin-page__hint {
  margin: 0;
  font-size: 16px;
  color: rgba(0, 0, 0, 0.55);
}
</style>
