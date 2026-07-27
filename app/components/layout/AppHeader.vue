<script setup lang="ts">
const mobileOpen = ref(false)
const { open: openLoginModal } = useLoginModal()
const { isAuthenticated } = useAuth()

const navItems = [
  { label: 'Базы', to: '/bases' },
  { label: 'Области', to: '/locations' },
  { label: 'О нас', to: '/about' },
]
</script>

<template>
  <header class="header">
    <div class="container header__inner">
      <NuxtLink to="/" class="header__logo" @click="mobileOpen = false">
        <CommonAppLogo :size="48" />
        <span class="header__logo-text">Охотничьи базы</span>
      </NuxtLink>

      <nav class="header__nav" :class="{ 'header__nav--open': mobileOpen }">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="header__link"
          @click="mobileOpen = false"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="header__actions">
        <CommonAuthUserMenu v-if="isAuthenticated" class="header__user-menu" />

        <button
          v-else
          type="button"
          class="btn btn--outline header__login"
          @click="openLoginModal"
        >
          Вход
        </button>
        <button
          type="button"
          class="header__burger"
          aria-label="Меню"
          @click="mobileOpen = !mobileOpen"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--wh-gray-200);
}

.header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 76px;
}

.header__logo {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.header__logo-text {
  font-weight: 700;
  color: var(--wh-green-900);
}

.header__nav {
  display: flex;
  align-items: center;
  gap: 32px;
}

.header__link {
  font-weight: 600;
  color: var(--wh-gray-600);
  transition: color 0.15s ease;
}

.header__link:hover,
.header__link.router-link-active {
  color: var(--wh-green-800);
}

.header__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header__login {
  padding-inline: 20px;
}

.header__user-menu :deep(.auth-user-menu__content) {
  max-width: 180px;
  padding: 12px 10px 12px 12px;
}

.header__user-menu :deep(.auth-user-menu__name) {
  font-size: 0.95rem;
}

.header__user-menu :deep(.auth-user-menu__arrow) {
  width: 40px;
}

.header__burger {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 42px;
  height: 42px;
  padding: 0;
  border: 1px solid var(--wh-gray-200);
  border-radius: 10px;
  background: var(--wh-white);
  cursor: pointer;
}

.header__burger span {
  display: block;
  width: 18px;
  height: 2px;
  margin-inline: auto;
  background: var(--wh-green-900);
}

@media (--wh-tablet) {
  .header__nav {
    position: absolute;
    top: 76px;
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    padding: 16px;
    background: var(--wh-white);
    border-bottom: 1px solid var(--wh-gray-200);
    transform: translateY(-8px);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  .header__nav--open {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }

  .header__link {
    padding: 14px 8px;
    border-bottom: 1px solid var(--wh-gray-100);
  }

  .header__burger {
    display: flex;
  }
}
</style>
