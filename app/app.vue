<script setup lang="ts">
useAuthModalsScrollLock()
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage :page-key="(route) => route.path" />
    </NuxtLayout>
    <AuthLoginModal />
    <AuthRegisterModal />
    <AuthForgotPasswordModal />
    <AuthFavoriteAuthModal />
    <CommonNotificationsContainer />
  </div>
</template>
