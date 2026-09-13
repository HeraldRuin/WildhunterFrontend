<script setup lang="ts">
const { breadcrumbs } = useProfileHeader()
</script>

<template>
  <header
    v-if="breadcrumbs.length"
    class="profile-page-breadcrumbs"
  >
    <AppBreadcrumbs :items="breadcrumbs" />
    <ProfileNotificationsBell />
  </header>
</template>

<style scoped>
.profile-page-breadcrumbs {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  min-height: 31px;
  margin-bottom: 20px;
  padding: 0;
  box-sizing: border-box;
}
</style>
