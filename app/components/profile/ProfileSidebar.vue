<script setup lang="ts">
import { formatMemberSince } from '~/utils/user'

interface NavItem {
  label: string
  to: string
  iconSrc: string
}

const route = useRoute()
const { user, logout } = useAuth()
const { profile } = useProfile()

const navItems: NavItem[] = [
  { label: 'Бронирования', to: '/profile/bookings', iconSrc: '/icons/iconoir_clock-solid.png' },
  { label: 'Мой профиль', to: '/profile', iconSrc: '/icons/lets-icons_setting-fill.png' },
  { label: 'Изменить пароль', to: '/profile/password', iconSrc: '/icons/boxicons_pencil-filled.png' },
]

const displayName = computed(() => {
  const profileUser = profile.value

  if (profileUser) {
    const fullName = [profileUser.first_name, profileUser.last_name].filter(Boolean).join(' ')
    return fullName || profileUser.user_name || profileUser.email
  }

  if (!user.value) {
    return 'Пользователь'
  }

  return [user.value.first_name, user.value.last_name].filter(Boolean).join(' ') || user.value.email
})

const avatarUrl = computed(() => profile.value?.avatar ?? user.value?.avatar ?? null)
const roleName = computed(() => profile.value?.role_name || user.value?.role_name || '')
const memberSince = computed(() => formatMemberSince(profile.value?.created_at ?? user.value?.created_at ?? ''))

function isActive(to: string) {
  if (to === '/profile') {
    return route.path === '/profile' || route.path === '/profile/'
  }

  return route.path.startsWith(to)
}

async function handleLogout() {
  await logout()
  await navigateTo('/')
}
</script>

<template>
  <aside class="profile-sidebar">
    <div class="profile-sidebar__user">
      <div class="profile-sidebar__avatar">
        <img
          v-if="avatarUrl"
          :src="avatarUrl"
          :alt="displayName"
        >
        <svg v-else viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="4" fill="currentColor" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="currentColor" />
        </svg>
      </div>

      <span v-if="roleName" class="profile-sidebar__role">{{ roleName }}</span>
      <h2 class="profile-sidebar__name">{{ displayName }}</h2>
      <p v-if="memberSince" class="profile-sidebar__since">Участник с: {{ memberSince }}</p>
    </div>

    <nav class="profile-sidebar__nav">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="profile-sidebar__nav-link"
        :class="{ 'profile-sidebar__nav-link--active': isActive(item.to) }"
      >
        <span class="profile-sidebar__nav-icon" aria-hidden="true">
          <img
            :src="item.iconSrc"
            :alt="''"
            width="24"
            height="24"
          >
        </span>
        {{ item.label }}
      </NuxtLink>
    </nav>

    <div class="profile-sidebar__footer">
      <NuxtLink to="/" class="profile-sidebar__footer-link">
        Назад на Главную
      </NuxtLink>
      <button
        type="button"
        class="profile-sidebar__footer-link profile-sidebar__footer-link--logout"
        @click="handleLogout"
      >
        Выйти
      </button>
    </div>
  </aside>
</template>

<style scoped>
.profile-sidebar {
  position: fixed;
  top: var(--profile-sidebar-gap, 16px);
  left: var(--profile-sidebar-gap, 16px);
  z-index: 40;
  display: flex;
  flex-direction: column;
  width: var(--profile-sidebar-width, 280px);
  height: calc(100vh - var(--profile-sidebar-gap, 16px) * 2);
  padding: 32px 24px 24px;
  border-radius: var(--wh-radius-lg);
  background: var(--wh-green);
  color: var(--wh-white);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  overflow: hidden;
}

.profile-sidebar__user {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-bottom: 37px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.profile-sidebar__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  margin-bottom: 12px;
  border-radius: 50%;
  background: #656c77;
  overflow: hidden;
}

.profile-sidebar__avatar img,
.profile-sidebar__avatar svg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-sidebar__avatar svg {
  width: 64px;
  height: 64px;
  color: rgba(255, 255, 255, 0.85);
}

.profile-sidebar__role {
  display: inline-block;
  margin-bottom: 0;
  padding: 10px;
  border: 1px solid var(--wh-white);
  border-radius: 12px;
  background: transparent;
  color: var(--wh-white);
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.profile-sidebar__name {
  margin: 14px 0 4px;
  font-size: 20px;
  font-weight: 700;
}

.profile-sidebar__since {
  margin: 0;

  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 120%;
  letter-spacing: -0.05em;
  text-align: center;
  color: rgba(255, 255, 255, 0.65);
}

.profile-sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 0;
  flex: 1;
}

.profile-sidebar__nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 18px;
  font-weight: 500;
  transition: background 0.15s ease, color 0.15s ease;
}

.profile-sidebar__nav-link:hover {
  background: rgba(255, 255, 255, 0.08);
}

.profile-sidebar__nav-link--active {
  background: rgba(255, 255, 255, 0.12);
  color: var(--wh-white);
}

.profile-sidebar__nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.profile-sidebar__nav-icon img {
  display: block;
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.profile-sidebar__footer {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.profile-sidebar__footer-link {
  display: block;
  padding: 10px 14px;
  border: none;
  background: none;

  font-family: "Inter", sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 130%;
  letter-spacing: -0.05em;

  color: var(--wh-white);
  text-align: left;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.profile-sidebar__footer-link:hover {
  opacity: 0.85;
}

.profile-sidebar__footer-link--logout {
  font-family: inherit;
}

@media (max-width: 900px) {
  .profile-sidebar {
    transform: translateX(-100%);
    transition: transform 0.25s ease;
  }
}
</style>
