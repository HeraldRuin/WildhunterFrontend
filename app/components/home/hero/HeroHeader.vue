<script setup lang="ts">
const { open: openLoginModal } = useLoginModal()
const { open: openRegisterModal } = useRegisterModal()
const { isAuthenticated } = useAuth()
</script>

<template>
  <header class="hero-header">
    <div class="hero-header__left">
      <button type="button" class="hero-header__burger" aria-label="Меню">
        <img
          src="/icons/material-symbols_menu-rounded.png"
          alt=""
          width="34"
          height="34"
          aria-hidden="true"
        >
      </button>
      <button type="button" class="hero-header__menu hero-header__menu--desktop">
        Для охотников
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" />
        </svg>
      </button>
      <button type="button" class="hero-header__menu hero-header__menu--desktop">
        Для охотохозяйств
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" />
        </svg>
      </button>
    </div>

    <NuxtLink to="/" class="hero-header__logo" aria-label="WH">
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
  </header>
</template>

<style scoped>
.hero-header {
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
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--wh-black-text);
  font-size: 18px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: -0.9px;
  cursor: pointer;
}

.hero-header__logo {
  justify-self: center;
  align-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
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
  transform: translateY(-1px);
}

@media (max-width: 1024px) {
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

  .hero-header__right {
    gap: 16px;
  }

  .hero-header__logo :deep(.app-logo) {
    width: 86px !important;
    max-width: 86px !important;
  }
}

@media (max-width: 640px) {
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
  }

  .hero-header__logo :deep(.app-logo) {
    width: 72px !important;
    max-width: 72px !important;
  }

  .hero-header__login {
    width: 96px;
  }
}
</style>
