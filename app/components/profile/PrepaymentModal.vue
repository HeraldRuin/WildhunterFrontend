<script setup lang="ts">
import type { BookingHistoryItem } from '~/types/booking'

const props = defineProps<{
  booking: BookingHistoryItem | null
}>()

const emit = defineEmits<{
  close: []
}>()

const { bookings } = useApi()
const notifications = useNotifications()
const isPaying = ref(false)
const isOpen = computed(() => Boolean(props.booking))

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

function getPaymentUrl(value: unknown): string | null {
  if (typeof value === 'string' && /^(?:https?:)?\/\//.test(value)) {
    return value
  }

  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>
  const keys = [
    'url',
    'payment_url',
    'paymentUrl',
    'payment_link',
    'redirect_url',
    'redirectUrl',
    'link',
  ]

  for (const key of keys) {
    if (typeof record[key] === 'string' && record[key]) {
      return record[key]
    }
  }

  return getPaymentUrl(record.data)
}

async function pay() {
  if (!props.booking || isPaying.value) {
    return
  }

  const paymentTab = window.open('', '_blank')
  isPaying.value = true

  try {
    const response = await bookings.markPrepaymentPaid(props.booking.code)

    if (!response.success) {
      paymentTab?.close()
      notifications.error(response.message || 'Не удалось выполнить оплату')
      return
    }

    const paymentUrl = getPaymentUrl(response)

    if (paymentUrl) {
      paymentTab?.location.replace(paymentUrl)
    } else if (paymentTab) {
      paymentTab.document.title = 'Результат оплаты'
      paymentTab.document.body.textContent = JSON.stringify(response, null, 2)
    }
  } catch (error) {
    paymentTab?.close()
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || 'Не удалось выполнить оплату')
  } finally {
    isPaying.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="prepayment-modal">
      <div
        v-if="booking"
        class="prepayment-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prepayment-modal-title"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <div class="prepayment-modal__card">
          <CommonModalCloseButton @click="close" />

          <h2 id="prepayment-modal-title" class="prepayment-modal__title">
            Предоплата для брони #{{ booking.number }}
          </h2>

          <div class="prepayment-modal__footer">
            <button
              type="button"
              class="prepayment-modal__pay"
              :disabled="isPaying"
              @click="pay"
            >
              {{ isPaying ? 'Открываем…' : 'Оплатить' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.prepayment-modal {
  position: fixed;
  inset: 0;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  isolation: isolate;
}

.prepayment-modal::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: rgba(17, 24, 39, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  pointer-events: none;
}

.prepayment-modal__card {
  position: relative;
  width: min(100%, 520px);
  padding: 28px 28px 24px;
  border: 1px solid var(--wh-gray-200);
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.prepayment-modal__title {
  margin: 0 48px 40px 0;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  color: var(--wh-gray-900);
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.4;
}

.prepayment-modal__footer {
  display: flex;
  justify-content: flex-end;
}

.prepayment-modal__pay {
  min-height: 40px;
  padding: 10px 24px;
  border: 1px solid var(--wh-orange-500);
  border-radius: 20px;
  background: var(--wh-orange-500);
  color: var(--wh-white);
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.prepayment-modal__pay:hover {
  border-color: var(--wh-orange-600);
  background: var(--wh-orange-600);
}

.prepayment-modal-enter-active,
.prepayment-modal-leave-active {
  transition: opacity 0.2s ease;
}

.prepayment-modal-enter-from,
.prepayment-modal-leave-to {
  opacity: 0;
}

.prepayment-modal-enter-from .prepayment-modal__card,
.prepayment-modal-leave-to .prepayment-modal__card {
  transform: translateY(8px);
}
</style>
