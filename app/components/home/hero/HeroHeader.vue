<script setup lang="ts">
const { open: openLoginModal } = useLoginModal()
const { open: openRegisterModal } = useRegisterModal()
const { isAuthenticated } = useAuth()

const route = useRoute()
const menuRef = ref<HTMLElement | null>(null)
const isMenuOpen = ref(false)
const hoveredKey = ref<string | null>(null)
const isLogoNavigating = ref(false)

const menuItems = [
  { label: 'Для охотников', to: '/hunters' },
  { label: 'Для охотохозяйств', to: '/hunting-farms' },
]

function isCompactViewport() {
  return window.matchMedia('(max-width: 1024px)').matches
}

function onLogoClick() {
  if (!import.meta.client || !isCompactViewport()) return
  if (route.path === '/') return
  isLogoNavigating.value = true
}

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
  hoveredKey.value = null
}

function handleDocumentClick(event: MouseEvent) {
  if (!menuRef.value?.contains(event.target as Node)) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <header
    ref="menuRef"
    class="hero-header"
    :class="{ 'hero-header--menu-open': isMenuOpen }"
  >
    <div class="hero-header__left">
      <button
        type="button"
        class="hero-header__burger"
        :class="{ 'hero-header__burger--open': isMenuOpen }"
        :aria-expanded="isMenuOpen"
        aria-haspopup="menu"
        aria-label="Меню"
        @click.stop="toggleMenu"
      >
        <img
          src="/icons/material-symbols_menu-rounded.png"
          alt=""
          width="34"
          height="34"
          aria-hidden="true"
        >
      </button>
      <NuxtLink
        v-for="item in menuItems"
        :key="item.to"
        :to="item.to"
        class="hero-header__menu hero-header__menu--desktop"
      >
        {{ item.label }}
      </NuxtLink>
    </div>

    <NuxtLink
      to="/"
      class="hero-header__logo"
      aria-label="WH"
      @click="onLogoClick"
    >
      <CommonAppLogo :width="104" />
    </NuxtLink>

    <div class="hero-header__right">
      <CommonAuthUserMenu class="hero-header__user-menu" />

      <button
        v-if="!isAuthenticated"
        type="button"
        class="hero-header__register hero-header__register--desktop"
        @click="openRegisterModal"
      >
        Регистрация
      </button>

      <button
        v-if="!isAuthenticated"
        type="button"
        class="hero-header__login"
        @click="openLoginModal"
      >
        Вход
      </button>
    </div>

    <ul
      v-if="isMenuOpen"
      class="hero-header__dropdown-list"
      role="menu"
      @mouseleave="hoveredKey = null"
    >
      <li v-for="item in menuItems" :key="item.to">
        <NuxtLink
          :to="item.to"
          class="wh-menu-item hero-header__dropdown-item"
          :class="{ 'wh-menu-item--hovered': hoveredKey === item.label }"
          role="menuitem"
          @mouseenter="hoveredKey = item.label"
          @click="closeMenu"
        >
          {{ item.label }}
        </NuxtLink>
      </li>
    </ul>
  </header>

  <Teleport to="body">
    <div
      v-if="isLogoNavigating"
      class="hero-header__logo-spinner"
      aria-live="polite"
      aria-busy="true"
    >
      <CommonSpinner
        variant="ring"
        size="lg"
        label="Загрузка"
      />
    </div>
  </Teleport>
</template>

<style scoped>
.hero-header {
  position: relative;
  z-index: 50;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  width: calc(100vw - 160px);
  max-width: none;
  height: 112px;
  padding: 0 24px;
  border-radius: 0 0 12px 12px;
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
  overflow: visible;
}

.hero-header--menu-open {
  z-index: 60;
}

.hero-header__left,
.hero-header__right {
  display: flex;
  align-items: center;
  gap: 28px;
}

.hero-header__right {
  justify-content: flex-end;
}

.hero-header__burger {
  display: none;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
}

.hero-header__burger img {
  display: block;
  width: 34px;
  height: 34px;
}

.hero-header__menu {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 10px 0 12px;
  border: none;
  background: transparent;
  color: var(--wh-black-text);
  font-size: 18px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: -0.9px;
  text-decoration: none;
  cursor: pointer;
}

.hero-header__menu::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  border-radius: 2px;
  background: var(--wh-orange-500);
  opacity: 0;
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.28s ease, opacity 0.28s ease;
  pointer-events: none;
}

.hero-header__menu:hover::after {
  opacity: 1;
  transform: scaleX(1);
}

.hero-header__logo {
  justify-self: center;
  align-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  -webkit-tap-highlight-color: transparent;
  outline: none;
  background: transparent;
}

.hero-header__logo:focus,
.hero-header__logo:active {
  outline: none;
  background: transparent;
  -webkit-tap-highlight-color: transparent;
}

.hero-header__logo :deep(.app-logo) {
  width: 104px !important;
  max-width: 104px !important;
  height: auto !important;
}

.hero-header__register {
  padding: 0;
  border: none;
  background: transparent;
  color: var(--wh-orange-500);
  font: inherit;
  font-weight: 500;
  font-size: 18px;
  line-height: 18px;
  opacity: 0.8;
  letter-spacing: -0.9px;
  cursor: pointer;
  transition: color 0.15s ease;
}

.hero-header__register:hover {
  color: var(--wh-orange-600);
}

.hero-header__login {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 126px;
  padding: 16px 20px;
  border: none;
  border-radius: var(--wh-radius-lg);
  background: var(--wh-orange-500);
  color: var(--wh-white);
  font: inherit;
  font-size: 18px;
  font-weight: 500;
  line-height: 18px;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.hero-header__login:hover {
  background: var(--wh-orange-600);
  transform: var(--wh-button-hover-lift);
}

.hero-header__dropdown-list {
  position: absolute;
  top: calc(100% + 8px);
  left: 12px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  min-width: 220px;
  max-width: calc(100vw - 24px);
  margin: 0;
  padding: 6px 8px;
  list-style: none;
  border: 1px solid var(--wh-gray);
  border-radius: 14px;
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
  color: var(--wh-black-text);
  pointer-events: auto;
}

.hero-header__dropdown-list li {
  list-style: none;
}

.hero-header__dropdown-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px 14px;
  border: none;
  border-radius: 10px;
  appearance: none;
  -webkit-appearance: none;
  background-color: transparent;
  color: var(--wh-black-text);
  font: inherit;
  font-size: 0.98rem;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.05em;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}

@media (--wh-tablet) {
  .hero-header {
    width: calc(100vw - 24px);
    max-width: none;
    gap: 12px;
    height: 100px;
    min-height: 100px;
    padding: 0 16px;
  }

  .hero-header__left {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .hero-header__menu {
    padding: 0 0 4px;
  }

  .hero-header__right {
    gap: 16px;
  }

  .hero-header__logo {
    -webkit-tap-highlight-color: transparent;
    outline: none;
    background: transparent;
  }

  .hero-header__logo :deep(.app-logo) {
    width: 86px !important;
    max-width: 86px !important;
  }
}

@media (--wh-mobile) {
  .hero-header {
    grid-template-columns: 1fr auto 1fr;
    justify-items: stretch;
    gap: 12px;
    width: 100vw;
    max-width: 100vw;
    margin-inline: calc(50% - 50vw);
    height: 86px;
    min-height: 86px;
    padding: 0 12px;
  }

  .hero-header__burger {
    display: inline-flex;
  }

  .hero-header__menu--desktop {
    display: none;
  }

  .hero-header__register--desktop {
    display: none;
  }

  .hero-header__left {
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 0;
  }

  .hero-header__right {
    justify-content: flex-end;
    flex-wrap: nowrap;
    gap: 0;
  }

  .hero-header__logo {
    justify-self: center;
    -webkit-tap-highlight-color: transparent;
    outline: none;
    background: transparent;
  }

  .hero-header__logo :deep(.app-logo) {
    width: 72px !important;
    max-width: 72px !important;
  }

  .hero-header__login {
    width: 96px;
  }
}

.hero-header__logo-spinner {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.55);
}

@media (--wh-desktop) {
  .hero-header__logo-spinner {
    display: none;
  }
}
</style>
