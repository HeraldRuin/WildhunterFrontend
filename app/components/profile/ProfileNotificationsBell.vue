<script setup lang="ts">
import type { InboxNotification } from '~/types/api'

const {
  items,
  unreadCount,
  listPending,
  listError,
  actionPending,
  fetchList,
  markRead,
  markAllRead,
} = useInboxNotifications()

const isOpen = ref(false)
const rootRef = ref<HTMLElement | null>(null)

const badgeLabel = computed(() => {
  const count = unreadCount.value
  if (count <= 0) {
    return ''
  }

  return count > 99 ? '99+' : String(count)
})

function isBookingNotification(item: InboxNotification): boolean {
  return item.entity_type === 'booking'
    || item.category === 'booking'
    || Boolean(item.event?.startsWith('booking.'))
}

function isInvitationAcceptedNotification(item: InboxNotification): boolean {
  const event = (item.event ?? '').toLowerCase()
  if (event.includes('invitation') && event.includes('accept')) {
    return true
  }

  const text = `${item.title} ${item.message}`.toLowerCase()
  return text.includes('приглашен') && text.includes('принят')
}

function bookingIdFromLink(link: string): number | undefined {
  const trimmed = link.trim()
  if (!trimmed) {
    return undefined
  }

  try {
    const url = new URL(trimmed, 'http://local.invalid')
    const fromQuery = Number(url.searchParams.get('booking_id'))
    if (Number.isFinite(fromQuery) && fromQuery > 0) {
      return fromQuery
    }

    const pathMatch = url.pathname.match(/\/profile\/bookings\/(\d+)\/?$/)
    if (pathMatch?.[1]) {
      const fromPath = Number(pathMatch[1])
      if (Number.isFinite(fromPath) && fromPath > 0) {
        return fromPath
      }
    }
  }
  catch {
    // Некорректный link — ниже вернём undefined.
  }

  return undefined
}

function bookingsTarget(bookingId?: number, openCollection = false): string {
  const params = new URLSearchParams()
  if (bookingId) {
    params.set('booking_id', String(bookingId))
  }
  if (openCollection) {
    params.set('open', 'collection')
  }

  const query = params.toString()
  return query ? `/profile/bookings?${query}` : '/profile/bookings'
}

function resolveNotificationTarget(item: InboxNotification): string | null {
  const openCollection = isInvitationAcceptedNotification(item)
  const entityId = Number(item.entity_id)
  if (isBookingNotification(item) && Number.isFinite(entityId) && entityId > 0) {
    return bookingsTarget(entityId, openCollection)
  }

  const link = item.link?.trim()
  if (!link) {
    return null
  }

  const bookingId = bookingIdFromLink(link)
  if (bookingId) {
    return bookingsTarget(bookingId, openCollection)
  }

  if (isBookingNotification(item)) {
    return bookingsTarget(undefined, openCollection)
  }

  return link
}

async function openList() {
  isOpen.value = true
  await fetchList()
}

function closeList() {
  isOpen.value = false
}

async function toggle() {
  if (isOpen.value) {
    closeList()
    return
  }

  await openList()
}

async function selectItem(id: string) {
  const item = items.value.find(entry => entry.id === id)

  if (!item) {
    return
  }

  if (item.unread) {
    await markRead(id)
  }

  closeList()

  const target = resolveNotificationTarget(item)
  if (!target) {
    return
  }

  if (/^https?:\/\//i.test(target)) {
    await navigateTo(target, { external: true })
    return
  }

  if (target.startsWith('/profile/bookings')) {
    const url = new URL(target, 'http://local.invalid')
    const query: Record<string, string> = {}
    url.searchParams.forEach((value, key) => {
      query[key] = value
    })
    await navigateTo({ path: '/profile/bookings', query })
    return
  }

  await navigateTo(target)
}

async function onMarkAllRead() {
  await markAllRead()
}

function handleDocumentClick(event: MouseEvent) {
  if (!rootRef.value?.contains(event.target as Node)) {
    closeList()
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
        v-if="badgeLabel"
        class="profile-notifications__badge"
      >{{ badgeLabel }}</span>
    </button>

    <div
      v-if="isOpen"
      class="profile-notifications__panel"
    >
      <div
        v-if="unreadCount"
        class="profile-notifications__toolbar"
      >
        <button
          type="button"
          class="profile-notifications__mark-all"
          :disabled="actionPending"
          @click.stop="onMarkAllRead"
        >
          Прочитать все
        </button>
      </div>

      <div
        v-if="listPending && !items.length"
        class="profile-notifications__loading"
        aria-live="polite"
      >
        <CommonSpinner variant="ring" size="sm" label="Загрузка уведомлений" />
      </div>

      <p
        v-else-if="listError && !items.length"
        class="profile-notifications__status profile-notifications__status--error"
      >
        {{ listError }}
      </p>

      <p
        v-else-if="!items.length"
        class="profile-notifications__status"
      >
        Нет уведомлений
      </p>

      <ul
        v-else
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
            <span class="profile-notifications__option-time">{{ item.time_ago }}</span>
          </button>
        </li>
      </ul>
    </div>
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
  padding: 0 3px;
  border-radius: 50%;
  background: #e74c3c;
  color: var(--wh-white);
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1;
  box-sizing: border-box;
}

.profile-notifications__panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 50;
  width: min(360px, calc(100vw - 32px));
  border: 1px solid var(--wh-orange-500);
  border-radius: 14px;
  background: var(--wh-white);
  color: var(--wh-black-text);
  box-shadow: var(--wh-shadow);
  overflow: hidden;
}

.profile-notifications__toolbar {
  display: flex;
  justify-content: flex-end;
  padding: 10px 12px 0;
}

.profile-notifications__mark-all {
  padding: 0;
  border: none;
  background: transparent;
  color: var(--wh-gray-600);
  font-family: "Inter", sans-serif;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: -0.03em;
  cursor: pointer;
}

.profile-notifications__mark-all:hover:not(:disabled) {
  color: var(--wh-black-text);
}

.profile-notifications__mark-all:disabled {
  opacity: 0.6;
  cursor: default;
}

.profile-notifications__status {
  margin: 0;
  padding: 16px 14px;
  font-family: "Inter", sans-serif;
  font-size: 0.875rem;
  color: var(--wh-gray-600);
}

.profile-notifications__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 64px;
  padding: 16px 14px;
}

.profile-notifications__status--error {
  color: var(--wh-field-error);
}

.profile-notifications__list {
  margin: 0;
  padding: 6px 8px;
  list-style: none;
  max-height: 320px;
  overflow-x: hidden;
  overflow-y: auto;
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

.profile-notifications__option:hover .profile-notifications__option-message {
  color: var(--wh-orange-500);
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
