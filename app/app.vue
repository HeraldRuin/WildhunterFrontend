<script setup lang="ts">
import { getResponseStatus } from 'h3'

useAuthModalsScrollLock()

const PRODUCTION_HOSTS = new Set(['wild-hunter.ru', 'www.wild-hunter.ru'])
const route = useRoute()
const requestHostname = useRequestURL().hostname
const requestEvent = import.meta.server ? useRequestEvent() : null

function canonicalHref(path: string) {
  const collapsed = path.replace(/\/{2,}/g, '/').toLowerCase() || '/'
  const bare = collapsed.length > 1 ? collapsed.replace(/\/+$/, '') : '/'

  if (bare === '/') {
    return 'https://wild-hunter.ru'
  }

  return `https://wild-hunter.ru${bare}/`
}

useHead(() => {
  if (!PRODUCTION_HOSTS.has(requestHostname)) {
    return {}
  }

  if (route.path === '/404' || route.path === '/404/') {
    return {}
  }

  if (import.meta.server && requestEvent && getResponseStatus(requestEvent) !== 200) {
    return {}
  }

  const isMapPage = /\/map\/?$/.test(route.path)

  return {
    meta: [{
      name: 'robots',
      key: 'robots',
      content: isMapPage ? 'noindex, nofollow' : 'index, follow',
    }],
    link: [{
      rel: 'canonical',
      key: 'canonical',
      href: canonicalHref(route.path),
    }],
  }
})

const { public: { chatragWidgetKey, chatragEnabled } } = useRuntimeConfig()
// runtime env может прийти строкой "false" — она truthy, поэтому сравниваем явно
const isChatragEnabled = chatragEnabled !== false && chatragEnabled !== 'false'

useHead({
  script: isChatragEnabled && chatragWidgetKey
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
