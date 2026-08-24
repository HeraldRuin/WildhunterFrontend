<script setup lang="ts">
interface ProfileNotificationItem {
  id: string
  title: string
  message: string
  time: string
  unread?: boolean
}

const DEFAULT_NOTIFICATIONS: ProfileNotificationItem[] = [
  {
    id: 'booking-new',
    title: 'Новое бронирование',
    message: 'Поступила заявка на базу «Хромой кабан-2»',
    time: '10 мин назад',
    unread: true,
  },
  {
    id: 'profile-reminder',
    title: 'Профиль',
    message: 'Проверьте и обновите данные профиля',
    time: '2 ч назад',
    unread: true,
  },
  {
    id: 'payment-success',
    title: 'Оплата',
    message: 'Предоплата по бронированию №1247 подтверждена',
    time: 'Вчера',
    unread: false,
  },
]

const isOpen = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const items = ref<ProfileNotificationItem[]>([...DEFAULT_NOTIFICATIONS])

const unreadCount = computed(() => items.value.filter(item => item.unread).length)

function toggle() {
  isOpen.value = !isOpen.value
}

function selectItem(id: string) {
  items.value = items.value.map(item =>
    item.id === id ? { ...item, unread: false } : item,
  )
  isOpen.value = false
}

function handleDocumentClick(event: MouseEvent) {
  if (!rootRef.value?.contains(event.target as Node)) {
    isOpen.value = false
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
  <div
    ref="rootRef"
    class="profile-notifications"
    :class="{ 'profile-notifications--open': isOpen }"
  >
    <button
      type="button"
      class="profile-notifications__trigger"
      aria-label="Уведомления"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      @click.stop="toggle"
    >
      <img
        src="/icons/bell.png"
        alt=""
        aria-hidden="true"
        class="profile-notifications__icon"
        width="18"
        height="22"
      >
      <span
        v-if="unreadCount"
        class="profile-notifications__badge"
      >{{ unreadCount }}</span>
    </button>

    <ul
      v-if="isOpen"
      class="profile-notifications__list"
      role="listbox"
      aria-label="Уведомления"
    >
      <li
        v-for="item in items"
        :key="item.id"
      >
        <button
          type="button"
          class="profile-notifications__option"
          role="option"
          :aria-selected="item.unread"
          @click.stop="selectItem(item.id)"
        >
          <span
            class="profile-notifications__option-dot"
            :class="{ 'profile-notifications__option-dot--active': item.unread }"
            aria-hidden="true"
          />
          <span class="profile-notifications__option-content">
            <span class="profile-notifications__option-title">{{ item.title }}</span>
            <span class="profile-notifications__option-message">{{ item.message }}</span>
          </span>
          <span class="profile-notifications__option-time">{{ item.time }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.profile-notifications {
  position: relative;
  flex-shrink: 0;
}

.profile-notifications--open {
  z-index: 30;
}

.profile-notifications__trigger {
  position: relative;
  width: 18px;
  height: 22px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  overflow: visible;
}

.profile-notifications__icon {
  display: block;
  width: 18px;
  height: 22px;
  object-fit: contain;
}

.profile-notifications__badge {
  position: absolute;
  top: -6px;
  right: -8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  min-width: 16px;
  height: 16px;
  padding: 0;
  border-radius: 50%;
  background: #e74c3c;
  color: var(--wh-white);
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1;
}

.profile-notifications__list {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 50;
  width: min(360px, calc(100vw - 32px));
  margin: 0;
  padding: 6px 8px;
  list-style: none;
  border: 1px solid var(--wh-gray);
  border-radius: 14px;
  background: var(--wh-white);
  color: var(--wh-black-text);
  max-height: 320px;
  overflow-x: hidden;
  overflow-y: auto;
  box-shadow: var(--wh-shadow);
}

.profile-notifications__option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  border: none;
  border-radius: 10px;
  appearance: none;
  background-color: transparent;
  color: var(--wh-black-text);
  font-family: "Inter", sans-serif;
  font-size: 0.98rem;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.05em;
  text-align: left;
  cursor: pointer;
}

.profile-notifications__option-dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  margin-top: 7px;
  border-radius: 50%;
  background-color: transparent;
}

.profile-notifications__option-dot--active {
  background-color: #e8883a;
}

.profile-notifications__option-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.profile-notifications__option-title {
  font-weight: 600;
}

.profile-notifications__option-message {
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.35;
  color: var(--wh-gray-600);
}

.profile-notifications__option-time {
  margin-left: auto;
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  color: var(--wh-gray-600);
}
</style>
