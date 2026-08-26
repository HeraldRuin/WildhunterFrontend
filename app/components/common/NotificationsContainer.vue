<script setup lang="ts">
import type { NotificationType } from '~/types/notifications'

const { notifications, close, handleAction } = useNotifications()

const icons: Record<NotificationType, { path: string, viewBox?: string }> = {
  success: {
    viewBox: '0 0 24 24',
    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
  },
  error: {
    viewBox: '0 0 24 24',
    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
  },
  warning: {
    viewBox: '0 0 24 24',
    path: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
  },
  info: {
    viewBox: '0 0 24 24',
    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
  },
}
</script>

<template>
  <Teleport to="body">
    <TransitionGroup name="notif" tag="div" class="notif-container">
      <div
        v-for="n in notifications"
        :key="n.id"
        class="notif"
        :class="`notif--${n.type}`"
      >
        <div class="notif__aside">
          <svg
            width="18"
            height="18"
            :viewBox="icons[n.type].viewBox"
            aria-hidden="true"
          >
            <path :d="icons[n.type].path" fill="currentColor" />
          </svg>
        </div>

        <div class="notif__body">
          <p class="notif__title">{{ n.title }}</p>
          <p class="notif__message">{{ n.message }}</p>

          <div v-if="n.actions?.length" class="notif__actions">
            <button
              v-for="(action, i) in n.actions"
              :key="i"
              type="button"
              class="notif__action"
              :class="action.class"
              @click="handleAction(n.id, action)"
            >
              {{ action.text }}
            </button>
          </div>
        </div>

        <button
          type="button"
          class="notif__close"
          aria-label="Закрыть"
          @click="close(n.id)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<style scoped>
.notif-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 440px;
  max-width: calc(100vw - 40px);
  pointer-events: none;
}

.notif {
  display: flex;
  align-items: flex-start;
  background: var(--wh-white);
  border: 1px solid rgb(28 33 28 / 18%);
  border-radius: var(--wh-radius);
  box-shadow: 0 4px 16px rgb(17 24 39 / 10%);
  overflow: hidden;
  pointer-events: auto;
}

.notif--success .notif__aside {
  color: var(--wh-green);
}

.notif--error .notif__aside {
  color: var(--wh-field-error);
}

.notif--warning .notif__aside {
  color: var(--wh-orange-500);
}

.notif--info .notif__aside {
  color: var(--wh-black-text);
}

.notif__aside {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  flex-shrink: 0;
  padding: 14px 0;
}

.notif__body {
  flex: 1;
  padding: 12px 8px 12px 0;
  min-width: 0;
}

.notif__title {
  margin: 0 0 3px;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--wh-black-text);
  line-height: 1.3;
}

.notif__message {
  margin: 0;
  font-size: 0.875rem;
  color: var(--wh-gray-900);
  opacity: 0.7;
  line-height: 1.5;
}

.notif__actions {
  display: flex;
  gap: 6px;
  margin-top: 10px;
}

.notif__action {
  padding: 4px 10px;
  background: var(--wh-gray-100);
  border: 1px solid var(--wh-gray);
  border-radius: 8px;
  color: var(--wh-black-text);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.notif__action:hover {
  background: rgba(82, 113, 79, 0.1);
  border-color: var(--wh-green);
  color: var(--wh-green);
}

.notif__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin: 6px 6px 0 0;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--wh-gray-900);
  opacity: 0.45;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease, opacity 0.15s ease;
}

.notif__close:hover {
  background: var(--wh-gray-100);
  opacity: 0.8;
}

.notif-enter-active,
.notif-leave-active {
  transition: all 0.25s ease;
}

.notif-enter-from,
.notif-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

@media (--wh-mobile) {
  .notif-container {
    top: 72px;
    right: 12px;
    left: 12px;
    width: auto;
  }
}
</style>
