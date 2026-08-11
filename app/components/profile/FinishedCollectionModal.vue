<script setup lang="ts">
import type { BookingHistoryItem } from '~/types/booking'

const props = defineProps<{
  booking: BookingHistoryItem | null
}>()

const emit = defineEmits<{
  close: []
}>()

const { user } = useAuth()
const isOpen = computed(() => Boolean(props.booking))

useBodyScrollLock(isOpen)

function isCurrentUser(hunterId: number) {
  return Number(hunterId) === Number(user.value?.id)
}

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
    <Transition name="finished-collection-modal">
      <div
        v-if="booking"
        class="finished-collection-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="finished-collection-modal-title"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <div class="finished-collection-modal__card">
          <CommonModalCloseButton @click="close" />

          <h2 id="finished-collection-modal-title" class="finished-collection-modal__title">
            Сбор для брони #{{ booking.number }}
          </h2>

          <div class="finished-collection-modal__success">
            Сбор завершен
          </div>

          <section>
            <h3 class="finished-collection-modal__subtitle">
              Приглашенные охотники
            </h3>

            <div
              v-for="invitation in booking.collectionInvitations"
              :key="invitation.invitationId"
              class="finished-collection-modal__participant"
            >
              <div class="finished-collection-modal__participant-main">
                <div class="finished-collection-modal__participant-header">
                  <span
                    v-if="isCurrentUser(invitation.hunterId)"
                    class="finished-collection-modal__badge finished-collection-modal__badge--self"
                  >
                    Вы
                  </span>
                  <strong>{{ invitation.name }}</strong>
                  <span
                    v-if="invitation.isAccepted"
                    class="finished-collection-modal__badge finished-collection-modal__badge--accepted"
                  >
                    Приглашение принято
                  </span>
                  <span class="finished-collection-modal__badge finished-collection-modal__badge--payment">
                    Ожидается оплата
                  </span>
                </div>

                <span>
                  ID: {{ invitation.hunterId }}
                  ({{ invitation.userName || 'ник не задан' }})
                </span>
                <span v-if="invitation.email">{{ invitation.email }}</span>
              </div>

              <div
                v-if="!isCurrentUser(invitation.hunterId)"
                class="finished-collection-modal__actions"
              >
                <button type="button">Заменить</button>
                <button type="button" class="finished-collection-modal__delete">Удалить</button>
              </div>
            </div>

            <p
              v-if="!booking.collectionInvitations?.length"
              class="finished-collection-modal__empty"
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
.finished-collection-modal {
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

.finished-collection-modal__card {
  position: relative;
  width: min(100%, 1000px);
  padding: 20px 24px 28px;
  border: 1px solid var(--wh-gray-200);
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
}

.finished-collection-modal__title {
  margin: 0 -24px 14px;
  padding: 0 24px 18px;
  border-bottom: 1px solid var(--wh-gray-200);
  color: var(--wh-gray-900);
  font-size: 1.1rem;
  font-weight: 500;
}

.finished-collection-modal__success {
  margin-bottom: 20px;
  padding: 14px 18px;
  border: 1px solid #bfe3c8;
  border-radius: 4px;
  background: #d9f0df;
  color: #236b35;
  font-size: 0.85rem;
  font-weight: 600;
}

.finished-collection-modal__subtitle {
  margin: 0 0 8px;
  color: var(--wh-gray-900);
  font-size: 0.95rem;
  font-weight: 500;
}

.finished-collection-modal__participant {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 8px 0;
  color: var(--wh-gray-600);
  font-size: 0.75rem;
}

.finished-collection-modal__participant-main {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.finished-collection-modal__participant-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--wh-gray-900);
}

.finished-collection-modal__badge {
  padding: 3px 8px;
  border-radius: 3px;
  color: var(--wh-white);
  font-size: 0.68rem;
  font-weight: 600;
  line-height: 1.2;
}

.finished-collection-modal__badge--self {
  min-width: 44px;
  background: #25a447;
  text-align: center;
}

.finished-collection-modal__badge--accepted {
  background: var(--wh-gray-600);
}

.finished-collection-modal__badge--payment {
  background: #f4c533;
}

.finished-collection-modal__actions {
  display: flex;
  gap: 18px;
}

.finished-collection-modal__actions button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #4aa3d9;
  font: inherit;
  cursor: pointer;
}

.finished-collection-modal__actions .finished-collection-modal__delete {
  color: #d75b69;
}

.finished-collection-modal__empty {
  margin: 0;
  padding: 18px;
  color: var(--wh-gray-600);
  text-align: center;
}

.finished-collection-modal-enter-active,
.finished-collection-modal-leave-active {
  transition: opacity 0.2s ease;
}

.finished-collection-modal-enter-from,
.finished-collection-modal-leave-to {
  opacity: 0;
}

@media (--wh-mobile) {
  .finished-collection-modal {
    padding: 12px;
  }

  .finished-collection-modal__card {
    padding: 18px;
  }

  .finished-collection-modal__title {
    margin-right: -18px;
    margin-left: -18px;
    padding-left: 18px;
  }

  .finished-collection-modal__participant {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
