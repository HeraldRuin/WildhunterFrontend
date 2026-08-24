<script setup lang="ts">
import { formatMemberSince } from '~/utils/user'

interface NavItem {
  label: string
  labelShort?: string
  to: string
  iconSrc: string
  showChevron?: boolean
  children?: Array<{ label: string, to: string }>
}

const route = useRoute()
const { user, logout } = useAuth()
const { profile } = useProfile()
const { isBaseAdmin } = useUserRole()

const baseNavItems: NavItem[] = [
  { label: 'Бронирования', to: '/profile/bookings', iconSrc: '/icons/iconoir_clock-solid.png' },
  { label: 'Мой профиль', to: '/profile', iconSrc: '/icons/user-profile.svg' },
  {
    label: 'Лицензия на оружие',
    labelShort: 'Оружие',
    to: '/profile/weapons',
    iconSrc: '/icons/material-symbols_license-rounded.png',
  },
  { label: 'Изменить пароль', to: '/profile/password', iconSrc: '/icons/boxicons_pencil-filled.png' },
]

const servicesNavChildren = [
  { label: 'Организация охоты', to: '/profile/services/hunting' },
  { label: 'Трофеи и штрафы', to: '/profile/services/trophies' },
  { label: 'Доп услуги', to: '/profile/services/extra' },
]

const timerNavChildren = [
  { label: 'Таймер сбора', to: '/profile/timers/collection' },
  { label: 'Таймер койко-мест', to: '/profile/timers/beds' },
  { label: 'Таймер предоплаты', to: '/profile/timers/prepayment' },
]

const settingsSubNavItems: NavItem[] = [
  {
    label: 'Управление базой',
    labelShort: 'База',
    to: '/profile/base',
    iconSrc: '/icons/base-building.svg',
    showChevron: false,
  },
  {
    label: 'Животные',
    to: '/profile/animals',
    iconSrc: '/icons/animal-face.svg',
    showChevron: false,
  },
  {
    label: 'Услуги',
    to: '/profile/services',
    iconSrc: '/icons/services.svg',
    children: servicesNavChildren,
  },
  {
    label: 'Таймеры',
    to: '/profile/timers',
    iconSrc: '/icons/timers.svg',
    children: timerNavChildren,
  },
]

const settingsSectionPaths = [
  ...settingsSubNavItems.map(item => item.to),
  ...servicesNavChildren.map(item => item.to),
  ...timerNavChildren.map(item => item.to),
  '/rooms',
]

const isSettingsRoute = computed(() =>
  settingsSectionPaths.some(path => route.path === path || route.path.startsWith(`${path}/`)),
)

const settingsMenuOpen = ref(false)
const openSubmenus = ref<Record<string, boolean>>({})
/** Планшет / мобильный: сайдбар ≤1024px */
const isCompactSidebar = ref(false)

watch(
  isSettingsRoute,
  (onSettingsRoute) => {
    if (onSettingsRoute) {
      settingsMenuOpen.value = true
    }
  },
  { immediate: true },
)

watch(
  () => route.path,
  (path) => {
    for (const item of settingsSubNavItems) {
      if (!item.children?.length) {
        continue
      }

      const onItemRoute = path === item.to
        || path.startsWith(`${item.to}/`)
        || item.children.some(child => path === child.to || path.startsWith(`${child.to}/`))

      if (onItemRoute) {
        if (isCompactSidebar.value) {
          openSubmenus.value = { [item.to]: true }
        }
        else {
          openSubmenus.value[item.to] = true
        }
      }
    }
  },
  { immediate: true },
)

const showSettingsMenu = computed(() => isBaseAdmin.value && settingsMenuOpen.value)

/** На компактном сайдбаре — drill-down: только дети раскрытого пункта */
const compactDrilldownItem = computed(() => {
  if (!isCompactSidebar.value || !showSettingsMenu.value) {
    return null
  }

  return settingsSubNavItems.find(item =>
    Boolean(item.children?.length) && isSubmenuOpen(item.to),
  ) ?? null
})

const navItems = computed<NavItem[]>(() => {
  if (showSettingsMenu.value) {
    return settingsSubNavItems
  }

  if (isBaseAdmin.value) {
    return baseNavItems.filter(item => item.to !== '/profile/weapons')
  }

  return baseNavItems
})

function openSettingsMenu() {
  settingsMenuOpen.value = true
}

async function closeSettingsMenu() {
  settingsMenuOpen.value = false
  openSubmenus.value = {}

  if (isSettingsRoute.value) {
    await navigateTo('/profile')
  }
}

function isSubmenuOpen(to: string) {
  return Boolean(openSubmenus.value[to])
}

function toggleSubmenu(to: string) {
  const willOpen = !openSubmenus.value[to]

  if (isCompactSidebar.value && willOpen) {
    openSubmenus.value = { [to]: true }
    return
  }

  openSubmenus.value[to] = willOpen
}

async function handleSettingsBack() {
  if (compactDrilldownItem.value) {
    openSubmenus.value = {}
    return
  }

  await closeSettingsMenu()
}

let compactMedia: MediaQueryList | null = null

function syncCompactSidebar() {
  isCompactSidebar.value = Boolean(compactMedia?.matches)
}

onMounted(() => {
  compactMedia = window.matchMedia('(max-width: 1024px)')
  syncCompactSidebar()
  compactMedia.addEventListener('change', syncCompactSidebar)
})

onUnmounted(() => {
  compactMedia?.removeEventListener('change', syncCompactSidebar)
  compactMedia = null
})

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

const SIDEBAR_AVATAR_PLACEHOLDER = '/images/Frame%20145423.png'

const avatarUrl = computed(() => profile.value?.avatar ?? user.value?.avatar ?? null)
const avatarLoadFailed = ref(false)

watch(avatarUrl, () => {
  avatarLoadFailed.value = false
})

const showAvatarImage = computed(() => Boolean(avatarUrl.value) && !avatarLoadFailed.value)

function handleAvatarError() {
  avatarLoadFailed.value = true
}
const roleName = computed(() => profile.value?.role_name || user.value?.role_name || '')
const memberSince = computed(() => formatMemberSince(profile.value?.created_at ?? user.value?.created_at ?? ''))

function isActive(to: string) {
  if (to === '/profile') {
    return route.path === '/profile' || route.path === '/profile/'
  }

  return route.path === to || route.path.startsWith(`${to}/`)
}

async function handleLogout() {
  try {
    await logout()
  }
  catch {
    // Сессия уже очищена в finally — переход на главную всё равно нужен.
  }

  await navigateTo('/')
}

async function goHome(event: MouseEvent) {
  if (
    event.defaultPrevented
    || event.button !== 0
    || event.metaKey
    || event.altKey
    || event.ctrlKey
    || event.shiftKey
  ) {
    return
  }

  event.preventDefault()
  await navigateTo('/')
}
</script>

<template>
  <aside class="profile-sidebar">
    <div class="profile-sidebar__user">
      <div class="profile-sidebar__avatar">
        <img
          v-if="showAvatarImage"
          :src="avatarUrl!"
          alt=""
          class="profile-sidebar__avatar-photo"
          @error="handleAvatarError"
        >
        <img
          v-else
          :src="SIDEBAR_AVATAR_PLACEHOLDER"
          alt=""
          class="profile-sidebar__avatar-placeholder"
          aria-hidden="true"
        >
      </div>

      <div class="profile-sidebar__meta">
        <span v-if="roleName" class="profile-sidebar__role">{{ roleName }}</span>
        <h2 class="profile-sidebar__name">{{ displayName }}</h2>
        <p v-if="memberSince" class="profile-sidebar__since">Участник с: {{ memberSince }}</p>
      </div>
    </div>

    <div class="profile-sidebar__menu">
      <nav
        class="profile-sidebar__nav"
        :class="{ 'profile-sidebar__nav--drilldown': Boolean(compactDrilldownItem) }"
      >
        <button
          v-if="showSettingsMenu"
          type="button"
          class="profile-sidebar__nav-link profile-sidebar__nav-link--back"
          @click="handleSettingsBack"
        >
          <span class="profile-sidebar__nav-icon" aria-hidden="true">←</span>
          <span class="profile-sidebar__nav-text">Назад</span>
        </button>

        <!-- Планшет/мобила: только подпункты раскрытого «Услуги» / «Таймеры» -->
        <template v-if="compactDrilldownItem?.children?.length">
          <NuxtLink
            v-for="child in compactDrilldownItem.children"
            :key="child.to"
            :to="child.to"
            class="profile-sidebar__nav-link profile-sidebar__nav-link--drilldown"
            :class="{ 'profile-sidebar__nav-link--active': isActive(child.to) }"
          >
            <span class="profile-sidebar__nav-icon" aria-hidden="true" />
            <span class="profile-sidebar__nav-text">{{ child.label }}</span>
          </NuxtLink>
        </template>

        <template v-else>
          <template v-for="item in navItems" :key="item.to">
            <button
              v-if="showSettingsMenu && item.children?.length"
              type="button"
              class="profile-sidebar__nav-link"
              :class="{
                'profile-sidebar__nav-link--active': isActive(item.to),
                'profile-sidebar__nav-link--compact': Boolean(item.labelShort),
                'profile-sidebar__nav-link--open': isSubmenuOpen(item.to),
              }"
              @click="toggleSubmenu(item.to)"
            >
              <span class="profile-sidebar__nav-icon" aria-hidden="true">
                <img
                  :src="item.iconSrc"
                  :alt="''"
                  width="24"
                  height="24"
                >
              </span>
              <span class="profile-sidebar__nav-text">
                <template v-if="item.labelShort">
                  <span class="profile-sidebar__nav-label profile-sidebar__nav-label--full">{{ item.label }}</span>
                  <span class="profile-sidebar__nav-label profile-sidebar__nav-label--short">{{ item.labelShort }}</span>
                </template>
                <template v-else>
                  {{ item.label }}
                </template>
              </span>
              <svg class="profile-sidebar__chevron" viewBox="0 0 12 8" aria-hidden="true">
                <path
                  d="M1 2 6 6.5 11 2"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>

            <NuxtLink
              v-else
              :to="item.to"
              class="profile-sidebar__nav-link"
              :class="{
                'profile-sidebar__nav-link--active': isActive(item.to),
                'profile-sidebar__nav-link--compact': Boolean(item.labelShort),
                'profile-sidebar__nav-link--open': showSettingsMenu && isActive(item.to),
              }"
            >
              <span class="profile-sidebar__nav-icon" aria-hidden="true">
                <img
                  :src="item.iconSrc"
                  :alt="''"
                  width="24"
                  height="24"
                >
              </span>
              <span class="profile-sidebar__nav-text">
                <template v-if="item.labelShort">
                  <span class="profile-sidebar__nav-label profile-sidebar__nav-label--full">{{ item.label }}</span>
                  <span class="profile-sidebar__nav-label profile-sidebar__nav-label--short">{{ item.labelShort }}</span>
                </template>
                <template v-else>
                  {{ item.label }}
                </template>
              </span>
              <svg
                v-if="showSettingsMenu && item.showChevron !== false"
                class="profile-sidebar__chevron"
                viewBox="0 0 12 8"
                aria-hidden="true"
              >
                <path
                  d="M1 2 6 6.5 11 2"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </NuxtLink>

            <template v-if="showSettingsMenu && item.children?.length && isSubmenuOpen(item.to)">
              <NuxtLink
                v-for="child in item.children"
                :key="child.to"
                :to="child.to"
                class="profile-sidebar__nav-link profile-sidebar__nav-link--nested"
                :class="{ 'profile-sidebar__nav-link--active': isActive(child.to) }"
              >
                {{ child.label }}
              </NuxtLink>
            </template>
          </template>
        </template>

        <button
          v-if="isBaseAdmin && !showSettingsMenu"
          type="button"
          class="profile-sidebar__nav-link"
          @click="openSettingsMenu"
        >
          <span class="profile-sidebar__nav-icon" aria-hidden="true">
            <img
              src="/icons/lets-icons_setting-fill.png"
              alt=""
              width="24"
              height="24"
            >
          </span>
          <span class="profile-sidebar__nav-text">Настройки</span>
          <svg class="profile-sidebar__chevron" viewBox="0 0 12 8" aria-hidden="true">
            <path
              d="M1 2 6 6.5 11 2"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </nav>

      <div class="profile-sidebar__footer">
        <NuxtLink
          to="/"
          class="profile-sidebar__footer-link"
          :prefetch="false"
          @click="goHome"
        >
          На главную
        </NuxtLink>
        <button
          type="button"
          class="profile-sidebar__footer-link profile-sidebar__footer-link--logout"
          @click="handleLogout"
        >
          Выйти
        </button>
      </div>
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

.profile-sidebar__meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.profile-sidebar__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  margin-bottom: 12px;
  border-radius: 8px;
  background: #656c77;
  overflow: hidden;
  flex-shrink: 0;
}

.profile-sidebar__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-sidebar__avatar-placeholder {
  object-fit: contain;
  background: var(--wh-white);
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

.profile-sidebar__menu {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.profile-sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 0;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.profile-sidebar__nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 48px;
  padding: 12px 14px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  font: inherit;
  font-size: 18px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  box-sizing: border-box;
  transition: background 0.15s ease, color 0.15s ease;
}

.profile-sidebar__nav-link:hover {
  background: rgba(255, 255, 255, 0.08);
}

.profile-sidebar__nav-link--active {
  background: rgba(255, 255, 255, 0.12);
  color: var(--wh-white);
}

.profile-sidebar__nav-text {
  flex: 1;
  min-width: 0;
}

.profile-sidebar__chevron {
  flex-shrink: 0;
  width: 12px;
  height: 8px;
  margin-left: auto;
  color: var(--wh-white);
  transform: rotate(-90deg);
  transition: transform 0.2s ease;
}

.profile-sidebar__nav-link--open .profile-sidebar__chevron {
  transform: rotate(0deg);
}

.profile-sidebar__nav-link--back {
  margin-bottom: 4px;
  font-weight: 500;
  opacity: 0.95;
}

/* Вложенные пункты только на десктопе (раскрытие в том же списке) */
.profile-sidebar__nav-link--nested {
  padding-left: 48px;
  font-size: 16px;
  font-weight: 400;
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

.profile-sidebar__nav-label--short {
  display: none;
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
  border-radius: 10px;
  background: transparent;

  font-family: "Inter", sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 130%;
  letter-spacing: -0.05em;

  color: var(--wh-white);
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}

.profile-sidebar__footer-link:hover {
  background: rgba(255, 255, 255, 0.08);
}

.profile-sidebar__footer-link--logout {
  font-family: inherit;
}

@media (--wh-tablet) {
  .profile-sidebar {
    position: relative;
    top: auto;
    left: auto;
    z-index: 1;
    width: 100%;
    height: auto;
    min-height: 0;
    flex-direction: row;
    align-items: stretch;
    gap: 0;
    padding: 24px 32px 24px 56px;
    overflow: visible;
  }

  .profile-sidebar__user {
    flex: 1 1 0;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 0 28px 0 0;
    margin-right: 28px;
    border-bottom: none;
    border-right: 1px solid rgba(255, 255, 255, 0.2);
    text-align: left;
  }

  .profile-sidebar__avatar {
    width: 120px;
    height: 120px;
    margin-bottom: 0;
  }

  .profile-sidebar__meta {
    align-items: flex-start;
    text-align: left;
    min-width: 0;
  }

  .profile-sidebar__role {
    order: 3;
    margin-top: 10px;
  }

  .profile-sidebar__name {
    order: 1;
    margin: 0 0 4px;
  }

  .profile-sidebar__since {
    order: 2;
    text-align: left;
  }

  .profile-sidebar__menu {
    flex: 0 0 280px;
    align-items: stretch;
    justify-content: center;
    width: 280px;
    min-width: 280px;
  }

  .profile-sidebar__nav {
    flex: 0 0 auto;
    align-items: stretch;
    width: 100%;
    padding: 0 0 12px;
  }

  .profile-sidebar__nav-link {
    width: 100%;
    max-width: none;
    min-height: 40px;
    padding: 8px 12px;
    font-size: 15px;
    font-weight: 500;
    box-sizing: border-box;
  }

  /* Настройки = тот же стиль, что основное меню (без лишних отступов) */
  .profile-sidebar__nav-link--back,
  .profile-sidebar__nav-link--nested,
  .profile-sidebar__nav-link--drilldown {
    margin-bottom: 0;
    min-height: 40px;
    padding: 8px 12px;
    font-size: 15px;
    font-weight: 500;
  }

  /* 3 подпункта + «Назад» ≈ высота меню из 4–5 пунктов */
  .profile-sidebar__nav--drilldown .profile-sidebar__nav-link {
    min-height: 50px;
    padding-top: 12px;
    padding-bottom: 12px;
  }

  .profile-sidebar__footer {
    align-items: stretch;
    width: 100%;
    padding-top: 12px;
  }

  .profile-sidebar__footer-link {
    width: 100%;
    max-width: none;
    padding: 8px 12px;
    font-size: 15px;
    box-sizing: border-box;
  }

  .profile-sidebar__nav-link--compact .profile-sidebar__nav-label--full {
    display: none;
  }

  .profile-sidebar__nav-link--compact .profile-sidebar__nav-label--short {
    display: inline;
  }
}

@media (--wh-mobile) {
  .profile-sidebar {
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    gap: 0;
    padding: 24px 20px 20px;
  }

  .profile-sidebar__user {
    flex: 0 0 auto;
    flex-direction: column;
    align-items: center;
    gap: 0;
    padding: 0 0 20px;
    margin-right: 0;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    text-align: center;
  }

  .profile-sidebar__avatar {
    width: 120px;
    height: 120px;
    margin-bottom: 12px;
  }

  .profile-sidebar__meta {
    align-items: center;
    text-align: center;
  }

  .profile-sidebar__role {
    order: 0;
    margin-top: 0;
    padding: 10px;
    font-size: 20px;
  }

  .profile-sidebar__name {
    order: 0;
    margin: 14px 0 4px;
    font-size: 20px;
  }

  .profile-sidebar__since {
    order: 0;
    text-align: center;
  }

  .profile-sidebar__menu {
    flex: 0 0 auto;
    align-items: stretch;
    width: 100%;
  }

  .profile-sidebar__nav {
    width: 100%;
    padding: 12px 0;
  }

  .profile-sidebar__nav-link {
    width: 100%;
    min-height: 48px;
    padding: 12px 14px;
    font-size: 16px;
    font-weight: 500;
  }

  .profile-sidebar__nav-link--back,
  .profile-sidebar__nav-link--nested,
  .profile-sidebar__nav-link--drilldown {
    margin-bottom: 0;
    min-height: 48px;
    padding: 12px 14px;
    font-size: 16px;
    font-weight: 500;
  }

  .profile-sidebar__nav--drilldown .profile-sidebar__nav-link {
    min-height: 60px;
    padding-top: 18px;
    padding-bottom: 18px;
  }

  .profile-sidebar__footer {
    align-items: stretch;
    width: 100%;
  }

  .profile-sidebar__footer-link {
    width: 100%;
    padding: 10px 14px;
    font-size: 16px;
  }

  .profile-sidebar__nav-link--compact .profile-sidebar__nav-label--full {
    display: inline;
  }

  .profile-sidebar__nav-link--compact .profile-sidebar__nav-label--short {
    display: none;
  }
}
</style>
