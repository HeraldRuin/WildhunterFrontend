<script setup lang="ts">
import type { BookingHistoryItem } from '~/types/booking'

const props = defineProps<{
  booking: BookingHistoryItem | null
}>()

const emit = defineEmits<{
  close: []
}>()

const isOpen = computed(() => Boolean(props.booking))
const { user } = useAuth()

useBodyScrollLock(isOpen)

function close() {
  emit('close')
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    close()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    close()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="collection-invitations-modal">
      <div
        v-if="booking"
        class="collection-invitations-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="collection-invitations-modal-title"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <div class="collection-invitations-modal__card">
          <header class="collection-invitations-modal__header">
            <h2 id="collection-invitations-modal-title" class="collection-invitations-modal__title">
              Открыт сбор для охотников
            </h2>

            <CommonModalCloseButton @click="close" />
          </header>

          <section class="collection-invitations-modal__participants">
            <h3 class="collection-invitations-modal__subtitle">
              Приглашенные охотники
            </h3>

            <div
              v-for="invitation in booking.collectionInvitations"
              :key="invitation.invitationId"
              class="collection-invitations-modal__participant"
            >
              <div class="collection-invitations-modal__participant-header">
                <span
                  v-if="Number(invitation.hunterId) === Number(user?.id)"
                  class="collection-invitations-modal__self"
                >
                  Вы
                </span>
                <strong>{{ invitation.name }}</strong>
                <span
                  v-if="invitation.status"
                  class="collection-invitations-modal__badge"
                >
                  {{ invitation.status }}
                </span>
              </div>
              <span>
                ID: {{ invitation.hunterId }}
                (<strong>{{ invitation.userName || 'ник не задан' }}</strong>)
              </span>
              <span v-if="invitation.email">{{ invitation.email }}</span>
            </div>

            <p
              v-if="!booking.collectionInvitations?.length"
              class="collection-invitations-modal__empty"
            >
              Нет приглашённых охотников
            </p>
          </section>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.collection-invitations-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(17, 24, 39, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.collection-invitations-modal__card {
  position: relative;
  width: min(100%, 780px);
  padding: 20px;
  border: 1px solid var(--wh-gray-200);
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
}

.collection-invitations-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 22px;
}

.collection-invitations-modal__title {
  flex: 1;
  min-width: 0;
  margin: 0;
  padding: 14px 16px;
  border-radius: 6px;
  background: var(--wh-green-gray);
  color: var(--wh-green-900);
  font-size: 1rem;
  font-weight: 600;
}

.collection-invitations-modal__header :deep(.modal-close-button) {
  position: static;
  flex-shrink: 0;
}

.collection-invitations-modal__subtitle {
  margin: 0 0 12px;
  color: var(--wh-gray-900);
  font-size: 0.95rem;
  font-weight: 600;
}

.collection-invitations-modal__participant {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px 0;
  color: var(--wh-gray-600);
  font-size: 0.8rem;
}

.collection-invitations-modal__participant + .collection-invitations-modal__participant {
  border-top: 1px solid var(--wh-gray-200);
}

.collection-invitations-modal__participant-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--wh-gray-900);
}

.collection-invitations-modal__badge {
  padding: 3px 7px;
  border-radius: 4px;
  background: var(--wh-green);
  color: var(--wh-white);
  font-size: 0.7rem;
  font-weight: 600;
}

.collection-invitations-modal__self {
  padding: 3px 12px;
  border-radius: 4px;
  background: var(--wh-orange-500);
  color: var(--wh-white);
  font-size: 0.7rem;
  font-weight: 600;
}

.collection-invitations-modal__empty {
  margin: 0;
  padding: 16px;
  border: 1px solid var(--wh-gray-200);
  border-radius: 6px;
  color: var(--wh-gray-600);
  text-align: center;
}

.collection-invitations-modal-enter-active,
.collection-invitations-modal-leave-active {
  transition: opacity 0.2s ease;
}

.collection-invitations-modal-enter-from,
.collection-invitations-modal-leave-to {
  opacity: 0;
}

@media (--wh-mobile) {
  .collection-invitations-modal {
    padding: 12px;
  }
}
</style>
