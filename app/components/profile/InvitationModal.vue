<script setup lang="ts">
import type { BookingHistoryItem } from '~/types/booking'

const props = defineProps<{
  booking: BookingHistoryItem | null
}>()

const emit = defineEmits<{
  close: []
  accepted: []
  declined: []
}>()

const isOpen = computed(() => Boolean(props.booking))
const isAccepting = ref(false)
const isDeclining = ref(false)
const { bookings: bookingsApi } = useApi()
const notifications = useNotifications()
const { open: openConfirmModal } = useConfirmModal()

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

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date).replace(',', '')
}

async function acceptInvitation() {
  const bookingCode = props.booking?.code
  if (!bookingCode || isAccepting.value || isDeclining.value) return

  isAccepting.value = true

  try {
    const response = await bookingsApi.acceptInvitation(bookingCode)

    if (response.success) {
      notifications.success(response.message || 'Приглашение принято')
      emit('accepted')
      close()
      return
    }

    notifications.error(response.message || 'Не удалось принять приглашение')
  } catch (error) {
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || 'Не удалось принять приглашение')
  } finally {
    isAccepting.value = false
  }
}

async function declineInvitation() {
  const bookingCode = props.booking?.code
  if (!bookingCode || isAccepting.value || isDeclining.value) return

  isDeclining.value = true

  try {
    const response = await bookingsApi.declineInvitation(bookingCode)

    if (response.success) {
      notifications.success(response.message || 'Приглашение отклонено')
      emit('declined')
      close()
      return
    }

    notifications.error(response.message || 'Не удалось отказаться от приглашения')
  } catch (error) {
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || 'Не удалось отказаться от приглашения')
  } finally {
    isDeclining.value = false
  }
}

function requestAcceptInvitation() {
  openConfirmModal({
    title: 'Вы уверены, что хотите принять приглашение?',
    confirmLabel: 'Принять',
    onConfirm: acceptInvitation,
  })
}

function requestDeclineInvitation() {
  openConfirmModal({
    title: 'Вы уверены, что хотите отказаться от приглашения?',
    confirmLabel: 'Отказаться',
    onConfirm: declineInvitation,
  })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="invitation-modal">
      <div
        v-if="booking"
        class="invitation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invitation-modal-title"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <div class="invitation-modal__card">
          <CommonModalCloseButton @click="close" />

          <h2 id="invitation-modal-title" class="invitation-modal__title">
            Открыт сбор для охотников
          </h2>

          <div class="invitation-modal__actions">
            <button
              type="button"
              class="invitation-modal__action invitation-modal__action--accept"
              :disabled="isAccepting || isDeclining"
              @click="requestAcceptInvitation"
            >
              {{ isAccepting ? 'Принимаем…' : 'Принять' }}
            </button>
            <button
              type="button"
              class="invitation-modal__action invitation-modal__action--decline"
              :disabled="isAccepting || isDeclining"
              @click="requestDeclineInvitation"
            >
              {{ isDeclining ? 'Отказываемся…' : 'Отказаться' }}
            </button>
          </div>

          <section class="invitation-modal__participants">
            <h3 class="invitation-modal__subtitle">
              Приглашенные охотники
            </h3>

            <div class="invitation-modal__participant">
              <div class="invitation-modal__participant-main">
                <span class="invitation-modal__name">{{ booking.customerName || 'Охотник' }}</span>
                <span class="invitation-modal__badge">
                  Приглашение принято
                </span>
                <span class="invitation-modal__payment">Ожидается оплата</span>
              </div>
              <span class="invitation-modal__date">
                Приглашен:
                {{ booking.invitationAcceptedAt ? formatDateTime(booking.invitationAcceptedAt) : booking.date }}
              </span>
            </div>
          </section>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.invitation-modal {
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

.invitation-modal__card {
  position: relative;
  width: min(100%, 780px);
  padding: 0 20px 20px;
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
}

.invitation-modal__title {
  margin: 0 -20px 28px;
  padding: 18px 52px 18px 20px;
  color: var(--wh-gray-900);
  font-size: 1rem;
  font-weight: 600;
}

.invitation-modal__actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  min-height: 52px;
  margin-bottom: 20px;
  padding: 12px;
  border: 1px solid var(--wh-gray-200);
  border-radius: 4px;
}

.invitation-modal__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 86px;
  min-height: 40px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  color: var(--wh-white);
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  transition: background 0.15s ease, opacity 0.15s ease;
}

.invitation-modal__action--accept {
  background: var(--wh-orange-500);
}

.invitation-modal__action--accept:hover {
  background: var(--wh-orange-600);
}

.invitation-modal__action--decline {
  background: var(--wh-field-error);
}

.invitation-modal__action--decline:hover {
  opacity: 0.85;
}

.invitation-modal__action:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.invitation-modal__subtitle {
  margin: 0 0 10px;
  color: var(--wh-gray-900);
  font-size: 0.9rem;
  font-weight: 500;
}

.invitation-modal__participant {
  padding: 10px;
  border: 1px solid var(--wh-gray-200);
  border-radius: 4px;
}

.invitation-modal__participant-main {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.invitation-modal__name {
  color: var(--wh-gray-900);
  font-size: 0.85rem;
}

.invitation-modal__badge {
  padding: 2px 5px;
  border-radius: 2px;
  background: var(--wh-green);
  color: var(--wh-white);
  font-size: 0.7rem;
}

.invitation-modal__payment {
  color: var(--wh-gray-700);
  font-size: 0.78rem;
}

.invitation-modal__date {
  display: block;
  margin-top: 4px;
  color: var(--wh-gray-600);
  font-size: 0.7rem;
}

.invitation-modal-enter-active,
.invitation-modal-leave-active {
  transition: opacity 0.2s ease;
}

.invitation-modal-enter-from,
.invitation-modal-leave-to {
  opacity: 0;
}

@media (--wh-mobile) {
  .invitation-modal {
    padding: 12px;
  }

  .invitation-modal__actions {
    flex-direction: column;
  }

  .invitation-modal__action {
    width: 100%;
  }
}
</style>
