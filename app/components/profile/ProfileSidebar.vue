<script setup lang="ts">
interface NavItem {
  label: string
  to: string
  icon: 'bookings' | 'profile' | 'password'
}

const route = useRoute()

const user = {
  name: 'Назар Тихонов',
  role: 'Охотник',
  memberSince: 'Feb 2026',
  avatar: null as string | null,
}

const navItems: NavItem[] = [
  { label: 'Бронирования', to: '/profile/bookings', icon: 'bookings' },
  { label: 'Мой профиль', to: '/profile', icon: 'profile' },
  { label: 'Изменить пароль', to: '/profile/password', icon: 'password' },
]

function isActive(to: string) {
  if (to === '/profile') {
    return route.path === '/profile' || route.path === '/profile/'
  }

  return route.path.startsWith(to)
}
</script>

<template>
  <aside class="profile-sidebar">
    <div class="profile-sidebar__user">
      <div class="profile-sidebar__avatar">
        <img
          v-if="user.avatar"
          :src="user.avatar"
          :alt="user.name"
        >
        <svg v-else viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="4" fill="currentColor" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="currentColor" />
        </svg>
      </div>

      <span class="profile-sidebar__role">{{ user.role }}</span>
      <h2 class="profile-sidebar__name">{{ user.name }}</h2>
      <p class="profile-sidebar__since">Участник с {{ user.memberSince }}</p>
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
          <svg v-if="item.icon === 'bookings'" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8" />
            <path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
          <svg v-else-if="item.icon === 'profile'" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8" />
            <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
          <svg v-else viewBox="0 0 24 24">
            <path d="M4 20h4l10-10-4-4L4 16v4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
            <path d="M13 7l4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
        </span>
        {{ item.label }}
      </NuxtLink>
    </nav>

    <div class="profile-sidebar__footer">
      <NuxtLink to="/" class="profile-sidebar__footer-link">
        Назад на Главную
      </NuxtLink>
      <button type="button" class="profile-sidebar__footer-link profile-sidebar__footer-link--logout">
        Выйти
      </button>
    </div>
  </aside>
</template>

<style scoped>
.profile-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 40;
  display: flex;
  flex-direction: column;
  width: 280px;
  height: 100vh;
  padding: 32px 24px 24px;
  background: var(--wh-green-800);
  color: var(--wh-white);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
}

.profile-sidebar__user {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-bottom: 28px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.profile-sidebar__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
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
  width: 44px;
  height: 44px;
  color: rgba(255, 255, 255, 0.85);
}

.profile-sidebar__role {
  display: inline-block;
  margin-bottom: 10px;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--wh-white);
  color: var(--wh-green-800);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.profile-sidebar__name {
  margin: 0 0 4px;
  font-size: 1rem;
  font-weight: 700;
}

.profile-sidebar__since {
  margin: 0;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.65);
}

.profile-sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 24px 0;
  flex: 1;
}

.profile-sidebar__nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
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
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.profile-sidebar__nav-icon svg {
  width: 18px;
  height: 18px;
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
  color: #6dd4a8;
  font-size: 0.88rem;
  font-weight: 500;
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
