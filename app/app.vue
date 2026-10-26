<script setup lang="ts">
import { getResponseStatus } from 'h3'

useAuthModalsScrollLock()

const PRODUCTION_HOSTS = new Set(['wild-hunter.ru', 'www.wild-hunter.ru'])
const route = useRoute()
const requestHostname = useRequestURL().hostname
const requestEvent = import.meta.server ? useRequestEvent() : null

function canonicalHref(path: string) {
  const collapsed = path.replace(/\/{2,}/g, '/') || '/'
  const withoutTrailingSlash = collapsed.length > 1
    ? collapsed.replace(/\/+$/, '')
    : '/'

  if (withoutTrailingSlash === '/') {
    return 'https://wild-hunter.ru'
  }

  return `https://wild-hunter.ru${withoutTrailingSlash}`
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

  const hotelQuery = route.query.hotel
  const hotelValue = Array.isArray(hotelQuery) ? hotelQuery[0] : hotelQuery
  const isLocationHotelMap = /^\/locations\/[^/]+\/map\/?$/.test(route.path)
    && Boolean(hotelValue)

  return {
    meta: [{
      name: 'robots',
      key: 'robots',
      content: isLocationHotelMap ? 'noindex, nofollow' : 'index, follow',
    }],
    link: [{
      rel: 'canonical',
      key: 'canonical',
      href: canonicalHref(route.path),
    }],
  }
})

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
