<script setup lang="ts">
useAuthModalsScrollLock()

const { public: { chatragWidgetKey } } = useRuntimeConfig()

useHead({
  script: chatragWidgetKey
    ? [
        {
          src: 'https://chatrag.ru/embed.js',
          tagPosition: 'bodyClose',
          domain: 'https://chatrag.ru',
          'widget-key': chatragWidgetKey,
        },
      ]
    : [],
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <AuthLoginModal />
    <AuthRegisterModal />
    <AuthForgotPasswordModal />
    <AuthFavoriteAuthModal />
    <CommonNotificationsContainer />
  </div>
</template>
