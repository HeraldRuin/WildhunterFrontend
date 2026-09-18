<script setup lang="ts">
import type { BookingHistoryItem } from '~/types/booking'

const POLL_INTERVAL_MS = 4000
const IFRAME_BLANK_FALLBACK_MS = 2000
const IFRAME_SAFETY_FALLBACK_MS = 5000

const props = defineProps<{
  booking: BookingHistoryItem | null
}>()

const emit = defineEmits<{
  close: []
  paid: []
}>()

const { bookings } = useApi()
const notifications = useNotifications()
const isPaying = ref(false)
const paymentError = ref(false)
const paymentUrl = ref<string | null>(null)
const iframeReady = ref(false)
const iframeRef = ref<HTMLIFrameElement | null>(null)
const isOpen = computed(() => Boolean(props.booking))

useBodyScrollLock(isOpen)

let pollTimer: ReturnType<typeof setInterval> | undefined
let iframeCheckTimer: ReturnType<typeof setTimeout> | undefined

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = undefined
  }
}

function clearIframeCheck() {
  if (iframeCheckTimer) {
    clearTimeout(iframeCheckTimer)
    iframeCheckTimer = undefined
  }
}

function resetPaymentUi() {
  stopPolling()
  clearIframeCheck()
  paymentUrl.value = null
  paymentError.value = false
  iframeReady.value = false
}

function close() {
  resetPaymentUi()
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

function getPaymentStatusValue(value: unknown): string | null {
  if (typeof value === 'string' && value) {
    return value.toLowerCase()
  }

  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>

  if (record.paid === true) {
    return 'paid'
  }

  const keys = ['status', 'payment_status', 'paymentStatus']

  for (const key of keys) {
    if (typeof record[key] === 'string' && record[key]) {
      return record[key].toLowerCase()
    }
  }

  return getPaymentStatusValue(record.data)
}

function openPaymentInSameTab(url: string) {
  resetPaymentUi()
  window.location.assign(url)
}

function isIframeBlocked(iframe: HTMLIFrameElement): boolean {
  try {
    const doc = iframe.contentDocument
    if (!doc) {
      return false
    }

    const href = doc.location?.href ?? ''
    const body = doc.body
    const empty = !body || (!body.childElementCount && !body.textContent?.trim())

    return href === 'about:blank' || empty
  } catch {
    return false
  }
}

function fallbackIfIframeBlocked(url: string) {
  const iframe = iframeRef.value
  if (!iframe || paymentUrl.value !== url) {
    return
  }

  if (isIframeBlocked(iframe)) {
    openPaymentInSameTab(url)
    return
  }

  iframeReady.value = true
}

function handleIframeLoad() {
  const url = paymentUrl.value
  const iframe = iframeRef.value
  if (!iframe || !url) {
    return
  }

  try {
    const doc = iframe.contentDocument
    const blank = !doc
      || doc.location.href === 'about:blank'
      || !doc.body
      || (!doc.body.childElementCount && !doc.body.textContent?.trim())

    if (blank) {
      clearIframeCheck()
      iframeCheckTimer = setTimeout(() => {
        fallbackIfIframeBlocked(url)
      }, IFRAME_BLANK_FALLBACK_MS)
      return
    }

    clearIframeCheck()
    iframeReady.value = true
  } catch {
    clearIframeCheck()
    iframeReady.value = true
  }
}

function scheduleIframeFallback(url: string) {
  clearIframeCheck()
  iframeCheckTimer = setTimeout(() => {
    fallbackIfIframeBlocked(url)
  }, IFRAME_SAFETY_FALLBACK_MS)
}

async function checkPaymentStatus() {
  if (!props.booking) {
    return
  }

  try {
    const response = await bookings.getPaymentStatus(props.booking.code)

    if (!response.success) {
      return
    }

    if (getPaymentStatusValue(response) === 'paid') {
      resetPaymentUi()
      emit('paid')
      emit('close')
    }
  } catch {
    // Ошибки поллинга не показываем: статус проверим на следующем тике.
  }
}

function startPolling() {
  stopPolling()
  void checkPaymentStatus()
  pollTimer = setInterval(() => {
    void checkPaymentStatus()
  }, POLL_INTERVAL_MS)
}

async function pay() {
  if (!props.booking || isPaying.value || paymentUrl.value) {
    return
  }

  isPaying.value = true
  paymentError.value = false

  try {
    const response = await bookings.markPrepaymentPaid(props.booking.code)

    if (!props.booking) {
      return
    }

    if (!response.success) {
      paymentError.value = true
      notifications.error(response.message || 'Не удалось выполнить оплату')
      return
    }

    const nextPaymentUrl = getPaymentUrl(response)

    if (!nextPaymentUrl) {
      paymentError.value = true
      notifications.error('Не удалось получить ссылку на оплату')
      return
    }

    paymentUrl.value = nextPaymentUrl
    scheduleIframeFallback(nextPaymentUrl)
    startPolling()
  } catch (error) {
    paymentError.value = true
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || 'Не удалось выполнить оплату')
  } finally {
    isPaying.value = false
  }
}

watch(() => props.booking, (booking) => {
  resetPaymentUi()

  if (booking) {
    void pay()
  }
})

onUnmounted(() => {
  resetPaymentUi()
})
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

          <div class="prepayment-modal__frame">
            <iframe
              v-if="paymentUrl"
              ref="iframeRef"
              :src="paymentUrl"
              class="prepayment-modal__iframe"
              allow="payment *"
              @load="handleIframeLoad"
            />

            <div v-if="!iframeReady" class="prepayment-modal__loading">
              <p v-if="paymentError" class="prepayment-modal__error">
                Не удалось открыть оплату
              </p>
              <CommonSpinner
                v-else
                variant="ring"
                size="lg"
                label="Открываем оплату"
              />
            </div>
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
  width: min(100%, 960px);
  padding: 28px 28px 24px;
  border: 1px solid var(--wh-gray-200);
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.prepayment-modal__title {
  margin: 0 48px 16px 0;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  color: var(--wh-gray-900);
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.4;
}

.prepayment-modal__frame {
  position: relative;
  min-height: 70vh;
}

.prepayment-modal__iframe {
  width: 100%;
  height: 70vh;
  border: 0;
}

.prepayment-modal__loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--wh-white);
}

.prepayment-modal__error {
  margin: 0;
  color: var(--wh-gray-500);
  font-size: 0.95rem;
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
