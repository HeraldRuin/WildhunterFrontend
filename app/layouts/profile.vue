<template>
  <div class="profile-layout">
    <div class="profile-layout__header">
      <HomeHeroHeader />
    </div>

    <div class="profile-layout__body">
      <ProfileSidebar />
      <div
        class="profile-layout__content"
        :class="{ 'profile-layout__content--scroll-lock': profileScrollLock }"
      >
        <slot />
      </div>
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

const { clearProfileHeader } = useProfileHeader()

onMounted(() => {
  loadProfile()
  document.documentElement.classList.add('profile-layout-active')
})

onBeforeUnmount(() => {
  clearProfileHeader()
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
  --profile-header-height: 112px;

  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
  background: var(--wh-gray-100);
}

.profile-layout__header {
  position: relative;
  z-index: 50;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  padding: 0 12px;
}

.profile-layout__header :deep(.hero-header) {
  width: min(100%, calc(100vw - 2 * clamp(12px, 1.5vw + 4px, 80px)));
  border: 1px solid var(--wh-gray-400);
  border-top: none;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: var(--wh-shadow);
}

.profile-layout__body {
  position: relative;
  flex: 1 1 0;
  min-height: 0;
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
    --profile-header-height: 100px;

    gap: var(--profile-sidebar-gap);
    height: auto;
    max-height: none;
    overflow-x: hidden;
    overflow-y: visible;
    padding: 8px;
    box-sizing: border-box;
  }

  .profile-layout__header {
    padding: 0;
  }

  .profile-layout__header :deep(.hero-header) {
    width: 100%;
  }

  .profile-layout__body {
    display: flex;
    flex-direction: column;
    gap: var(--profile-sidebar-gap);
    flex: none;
    min-height: 0;
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
  .profile-layout {
    --profile-header-height: 86px;
  }

  .profile-layout__header :deep(.hero-header) {
    width: 100%;
    max-width: 100%;
    margin-inline: 0;
    border-left: none;
    border-right: none;
    border-radius: 0 0 12px 12px;
  }

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
