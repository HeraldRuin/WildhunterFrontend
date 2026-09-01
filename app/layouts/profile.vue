<template>
  <div class="profile-layout">
    <ProfileSidebar />
    <div
      class="profile-layout__content"
      :class="{ 'profile-layout__content--scroll-lock': profileScrollLock }"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { loadProfile } = useProfile()
const { user } = useAuth()
const { fetchUnreadCount, prependRealtime, reset } = useInboxNotifications()
const { subscribe, disconnect } = useNotificationsChannel((payload) => {
  prependRealtime(payload)
})

const profileScrollLock = computed(() => {
  if (route.meta.profileScrollLock === true) {
    return true
  }

  const path = route.path
  return (
    /^\/profile\/base\/[^/]+\/?$/.test(path)
    || /^\/rooms\/[^/]+\/?$/.test(path)
    || path === '/profile/bookings'
    || path === '/profile/favorites'
    || path === '/profile/animals'
    || path === '/profile/services/extra'
    || path === '/profile/services/hunting'
    || path === '/profile/services/trophies'
    || path.startsWith('/profile/timers/')
  )
})

onMounted(() => {
  loadProfile()
  document.documentElement.classList.add('profile-layout-active')
})

onBeforeUnmount(() => {
  document.documentElement.classList.remove('profile-layout-active')
})

watch(
  () => user.value?.id,
  (userId) => {
    if (userId) {
      void fetchUnreadCount()
      subscribe(userId)
      return
    }

    reset()
    disconnect()
  },
  { immediate: true },
)
</script>

<style scoped>
.profile-layout {
  --profile-sidebar-width: 340px;
  --profile-sidebar-gap: 16px;

  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
  background: var(--wh-gray-100);
}

.profile-layout__content {
  display: flex;
  flex-direction: column;
  margin-left: calc(var(--profile-sidebar-width) + var(--profile-sidebar-gap) * 2);
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--wh-gray-100);
}

.profile-layout__content--scroll-lock {
  overflow: hidden;
}

@media (--wh-tablet) {
  .profile-layout {
    --profile-sidebar-gap: 8px;

    display: flex;
    flex-direction: column;
    gap: var(--profile-sidebar-gap);
    height: auto;
    max-height: none;
    overflow-x: hidden;
    overflow-y: visible;
    padding: 8px;
    box-sizing: border-box;
  }

  .profile-layout__content {
    margin-left: 0;
    height: auto;
    min-height: 0;
    max-height: none;
    overflow: visible;
  }

  .profile-layout__content--scroll-lock {
    overflow: visible;
  }
}

@media (--wh-mobile) {
  .profile-layout__content {
    border-radius: var(--wh-radius-lg);
    background: var(--wh-white);
  }
}
</style>

<style>
html.profile-layout-active,
html.profile-layout-active body {
  height: 100%;
  overflow: hidden;
}

html.profile-layout-active #__nuxt,
html.profile-layout-active #__nuxt > div {
  height: 100%;
}

html.profile-layout-active .profile-layout__content--scroll-lock > * {
  flex: 1 1 0;
  min-height: 0;
  max-height: 100%;
}

@media (max-width: 1024px) {
  html.profile-layout-active,
  html.profile-layout-active body {
    height: auto;
    overflow: visible;
  }

  html.profile-layout-active #__nuxt,
  html.profile-layout-active #__nuxt > div {
    height: auto;
  }

  html.profile-layout-active .profile-layout__content--scroll-lock > * {
    flex: none;
    max-height: none;
  }
}
</style>
