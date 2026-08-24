<script setup lang="ts">
const { user, isAuthenticated, logout } = useAuth()

const menuRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const hoveredKey = ref<string | null>(null)

const displayName = computed(() => {
  if (!user.value) {
    return 'Профиль'
  }

  const fullName = [user.value.first_name, user.value.last_name].filter(Boolean).join(' ')

  return fullName || user.value.email
})

const navItems = [
  { label: 'Бронирования', to: '/profile/bookings' },
  { label: 'Мой профиль', to: '/profile' },
  { label: 'Изменить пароль', to: '/profile/password' },
  { label: 'Избранное', to: '/profile/favorites' },
]

function toggleMenu() {
  isOpen.value = !isOpen.value
}

function closeMenu() {
  isOpen.value = false
  hoveredKey.value = null
}

function handleDocumentClick(event: MouseEvent) {
  if (!menuRef.value?.contains(event.target as Node)) {
    closeMenu()
  }
}

async function openItem(to: string) {
  closeMenu()
  await navigateTo(to)
}

async function handleLogout() {
  closeMenu()
  await logout()
  await navigateTo('/')
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <div
    v-if="isAuthenticated"
    ref="menuRef"
    class="auth-user-menu"
    :class="{ 'auth-user-menu--open': isOpen }"
  >
    <button
      type="button"
      class="auth-user-menu__mobile"
      :class="{ 'auth-user-menu__mobile--open': isOpen }"
      :aria-expanded="isOpen"
      aria-haspopup="menu"
      aria-label="Открыть меню пользователя"
      @click.stop="toggleMenu"
    >
      <svg
        class="auth-user-menu__mobile-arrow-icon"
        width="12"
        height="12"
        viewBox="0 0 12 12"
        aria-hidden="true"
      >
        <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <div class="auth-user-menu__desktop">
      <div
        class="auth-user-menu__trigger"
        :class="{ 'auth-user-menu__trigger--open': isOpen }"
      >
        <NuxtLink
          to="/profile"
          class="auth-user-menu__content"
          @click="closeMenu"
        >
          <span class="auth-user-menu__name">
            {{ displayName }}
          </span>
        </NuxtLink>

        <button
          type="button"
          class="auth-user-menu__arrow"
          :aria-expanded="isOpen"
          aria-haspopup="menu"
          aria-label="Открыть меню пользователя"
          @click.stop="toggleMenu"
        >
          <svg
            class="auth-user-menu__arrow-icon"
            width="16"
            height="16"
            viewBox="0 0 12 12"
            aria-hidden="true"
          >
            <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </div>

    <ul
      v-if="isOpen"
      class="auth-user-menu__list"
      role="menu"
      @mouseleave="hoveredKey = null"
    >
      <li v-for="item in navItems" :key="item.to">
        <button
          type="button"
          class="wh-menu-item auth-user-menu__item"
          :class="{ 'wh-menu-item--hovered': hoveredKey === item.to }"
          role="menuitem"
          @mouseenter="hoveredKey = item.to"
          @click="openItem(item.to)"
        >
          {{ item.label }}
        </button>
      </li>
      <li>
        <button
          type="button"
          class="wh-menu-item auth-user-menu__item"
          :class="{ 'wh-menu-item--hovered': hoveredKey === 'logout' }"
          role="menuitem"
          @mouseenter="hoveredKey = 'logout'"
          @click="handleLogout"
        >
          Выйти
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.auth-user-menu {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: stretch;
}

.auth-user-menu--open {
  z-index: 1100;
}

.auth-user-menu__mobile {
  display: none;
}

.auth-user-menu__desktop {
  display: inline-flex;
  flex-direction: column;
  align-items: stretch;
}

.auth-user-menu__trigger {
  display: inline-flex;
  align-items: stretch;
  max-width: 100%;
  border-radius: var(--wh-radius-lg);
  background: var(--wh-orange-500);
  color: var(--wh-white);
}

.auth-user-menu__content {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  max-width: 220px;
  padding: 10px 12px;
  color: inherit;
  text-decoration: none;
}

.auth-user-menu__name {
  min-width: 0;
  overflow: hidden;
  font-size: 18px;
  font-weight: 500;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.auth-user-menu__arrow {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 44px;
  padding: 0;
  border: none;
  border-left: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 0 var(--wh-radius-lg) var(--wh-radius-lg) 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition: background 0.15s ease;
}

.auth-user-menu__arrow:hover {
  background: var(--wh-orange-600);
}

.auth-user-menu__trigger--open .auth-user-menu__arrow {
  background: var(--wh-orange-600);
}

.auth-user-menu__arrow-icon {
  display: block;
}

.auth-user-menu__trigger--open .auth-user-menu__arrow-icon {
  transform: rotate(180deg);
}

.auth-user-menu__arrow:hover .auth-user-menu__arrow-icon {
  animation: auth-user-menu-arrow-bounce 0.45s ease-in-out 3;
}

.auth-user-menu__trigger--open .auth-user-menu__arrow:hover .auth-user-menu__arrow-icon {
  animation: auth-user-menu-arrow-bounce-open 0.45s ease-in-out 3;
}

@keyframes auth-user-menu-arrow-bounce {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(4px);
  }
}

@keyframes auth-user-menu-arrow-bounce-open {
  0%,
  100% {
    transform: rotate(180deg) translateY(0);
  }

  50% {
    transform: rotate(180deg) translateY(4px);
  }
}

.auth-user-menu__list {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  width: 260px;
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

.auth-user-menu__list li {
  list-style: none;
}

.auth-user-menu__item {
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

@media (--wh-mobile) {
  .auth-user-menu {
    align-items: flex-end;
  }

  .auth-user-menu__mobile {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: none;
    border-radius: 999px;
    background: var(--wh-orange-500);
    color: var(--wh-white);
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .auth-user-menu__mobile:hover,
  .auth-user-menu__mobile--open {
    background: var(--wh-orange-600);
  }

  .auth-user-menu__mobile-arrow-icon {
    display: block;
  }

  .auth-user-menu__mobile--open .auth-user-menu__mobile-arrow-icon {
    transform: rotate(180deg);
  }

  .auth-user-menu__mobile:hover .auth-user-menu__mobile-arrow-icon {
    animation: auth-user-menu-arrow-bounce 0.45s ease-in-out 3;
  }

  .auth-user-menu__mobile--open:hover .auth-user-menu__mobile-arrow-icon {
    animation: auth-user-menu-arrow-bounce-open 0.45s ease-in-out 3;
  }

  .auth-user-menu__desktop {
    display: none;
  }

  .auth-user-menu__list {
    width: max-content;
    min-width: 0;
    max-width: calc(100vw - 24px);
    padding: 6px 8px;
  }

  .auth-user-menu__item {
    padding: 12px 14px;
    white-space: nowrap;
  }
}
</style>
