<script setup lang="ts">
import type { BookingAction, BookingHistoryItem, BookingRoomDetail } from '~/types/booking'
import { formatHotelPriceLabel } from '~/utils/hotel'

const props = defineProps<{
  items: BookingHistoryItem[]
  selectedId?: number | null
  emptyText?: string
  showDetailsButtons?: boolean
  showCustomer?: boolean
  showCalculation?: boolean
  showHunterCalculation?: boolean
  loadingCollectionBookingId?: number | null
}>()

const emit = defineEmits<{
  action: [payload: { booking: BookingHistoryItem, action: BookingAction }]
  customer: [booking: BookingHistoryItem]
}>()

const openDetailsId = ref<number | null>(null)
const popoverStyle = ref<Record<string, string>>({})
const detailsButtonRefs = new Map<number, HTMLElement>()
const scrollEl = ref<HTMLElement | null>(null)
const listPageCount = ref(1)
const listPageIndex = ref(0)
let listResizeObserver: ResizeObserver | null = null

const openDetailsItem = computed(() =>
  props.items.find(item => item.id === openDetailsId.value) ?? null,
)

const openDetailsRooms = computed<BookingRoomDetail[]>(() =>
  openDetailsItem.value?.accommodation?.rooms ?? [],
)

function setDetailsButtonRef(id: number, el: Element | null) {
  if (el instanceof HTMLElement) {
    detailsButtonRefs.set(id, el)
    return
  }

  detailsButtonRefs.delete(id)
}

function updatePopoverPosition() {
  if (openDetailsId.value === null) return

  const button = detailsButtonRefs.get(openDetailsId.value)
  if (!button) return

  const rect = button.getBoundingClientRect()
  const gap = 8
  const estimatedWidth = Math.min(520, window.innerWidth - 16)
  const spaceRight = window.innerWidth - rect.right - gap
  const placeLeft = spaceRight < estimatedWidth && rect.left > spaceRight

  popoverStyle.value = {
    top: `${Math.max(8, rect.top)}px`,
    left: placeLeft
      ? `${Math.max(8, rect.left - estimatedWidth - gap)}px`
      : `${rect.right + gap}px`,
  }
}

function closeDetails() {
  openDetailsId.value = null
}

function toggleDetails(id: number) {
  if (openDetailsId.value === id) {
    closeDetails()
    return
  }

  openDetailsId.value = id
  nextTick(() => {
    updatePopoverPosition()
  })
}

function isCollectionActionLoading(booking: BookingHistoryItem, action: BookingAction) {
  return props.loadingCollectionBookingId === booking.id
    && (action.id === 'open_collection' || action.id === 'start_collection')
}

function handleAction(booking: BookingHistoryItem, action: BookingAction) {
  if (isCollectionActionLoading(booking, action)) return

  emit('action', { booking, action })
}

function openCalculation(booking: BookingHistoryItem) {
  handleAction(booking, {
    id: 'calculating',
    label: booking.paymentAction || 'Калькуляция',
    variant: 'primary',
  })
}

function nightsLabel(count: number) {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod10 === 1 && mod100 !== 11) return `${count} ночь`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${count} ночи`

  return `${count} ночей`
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value)
}

function isPaymentVisibleStatus(code?: string) {
  return code === 'finish_bed_collection'
    || code === 'paid'
    || code === 'completed'
}

function isHuntingFinishedCollection(item: BookingHistoryItem) {
  return item.type === 'animal' && item.status.code === 'finished_collection'
}

function handleDocumentClick(event: MouseEvent) {
  if (openDetailsId.value === null) return

  const target = event.target
  if (!(target instanceof Node)) return

  const button = detailsButtonRefs.get(openDetailsId.value)
  const popover = document.querySelector('.booking-table__details-popover')

  if (button?.contains(target) || popover?.contains(target)) {
    return
  }

  closeDetails()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeDetails()
  }
}

watch(openDetailsId, (id) => {
  if (id === null || !import.meta.client) return

  nextTick(() => {
    updatePopoverPosition()
  })
})

function getListMaxScroll(el: HTMLElement) {
  return Math.max(0, el.scrollHeight - el.clientHeight)
}

function getListPageCount(el: HTMLElement) {
  const pageSize = el.clientHeight || 1
  const maxScroll = getListMaxScroll(el)

  if (maxScroll <= 8) {
    return 1
  }

  return Math.max(1, Math.ceil((maxScroll + pageSize) / pageSize))
}

function getListPageIndex(el: HTMLElement, pageCount: number) {
  if (pageCount <= 1) {
    return 0
  }

  const maxScroll = getListMaxScroll(el)

  if (el.scrollTop >= maxScroll - 2) {
    return pageCount - 1
  }

  return Math.min(
    pageCount - 1,
    Math.round((el.scrollTop / maxScroll) * (pageCount - 1)),
  )
}

function updateListPages() {
  const el = scrollEl.value
  if (!el) {
    listPageCount.value = 1
    listPageIndex.value = 0
    return
  }

  const pages = getListPageCount(el)
  listPageCount.value = pages
  listPageIndex.value = getListPageIndex(el, pages)
}

function scheduleListPagesUpdate() {
  void nextTick(() => {
    updateListPages()
    requestAnimationFrame(() => {
      updateListPages()
      requestAnimationFrame(updateListPages)
    })
  })
}

function onListScroll() {
  const el = scrollEl.value
  if (!el) return

  listPageIndex.value = getListPageIndex(el, listPageCount.value)
}

function scrollListToPage(index: number) {
  const el = scrollEl.value
  if (!el) return

  const pageCount = listPageCount.value
  if (pageCount <= 1) return

  const maxScroll = getListMaxScroll(el)
  const top = pageCount === 1
    ? 0
    : Math.round((index / (pageCount - 1)) * maxScroll)

  el.scrollTo({ top, behavior: 'smooth' })
  listPageIndex.value = index
}

watch(() => props.items.length, () => {
  scheduleListPagesUpdate()
  void nextTick(() => {
    if (scrollEl.value && listResizeObserver) {
      listResizeObserver.disconnect()
      listResizeObserver.observe(scrollEl.value)
    }
  })
})

watch(scrollEl, (el) => {
  if (!el || !listResizeObserver) return
  listResizeObserver.disconnect()
  listResizeObserver.observe(el)
  updateListPages()
})

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', updatePopoverPosition)
  window.addEventListener('scroll', updatePopoverPosition, true)
  window.addEventListener('resize', scheduleListPagesUpdate)

  if (import.meta.client && typeof ResizeObserver !== 'undefined') {
    listResizeObserver = new ResizeObserver(() => {
      updateListPages()
    })

    void nextTick(() => {
      if (scrollEl.value) {
        listResizeObserver?.observe(scrollEl.value)
      }
      updateListPages()
    })
  }
  else {
    scheduleListPagesUpdate()
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', updatePopoverPosition)
  window.removeEventListener('scroll', updatePopoverPosition, true)
  window.removeEventListener('resize', scheduleListPagesUpdate)
  listResizeObserver?.disconnect()
  listResizeObserver = null
})
</script>

<template>
  <div class="booking-table-shell">
    <div
      v-if="items.length && listPageCount > 1"
      class="booking-table-dots"
      role="tablist"
      aria-label="Страницы списка бронирований"
    >
      <button
        v-for="page in listPageCount"
        :key="page"
        type="button"
        class="booking-table-dot"
        :class="{ 'booking-table-dot--active': page - 1 === listPageIndex }"
        :aria-label="`Страница ${page}`"
        :aria-current="page - 1 === listPageIndex ? 'true' : undefined"
        @click="scrollListToPage(page - 1)"
      />
    </div>

    <div class="booking-table-wrap">
      <div v-if="!items.length" class="booking-table-empty">
        {{ emptyText ?? 'Нет бронирований' }}
      </div>

      <div
        v-else
        ref="scrollEl"
        class="booking-table-scroll"
        @scroll.passive="onListScroll"
      >
        <table class="booking-table">
          <thead>
            <tr>
              <th>№ брони</th>
              <th>Дата брони</th>
              <th>{{ showCustomer ? 'Заказчик' : 'Охотн. База' }}</th>
              <th>Детали</th>
              <th>Статус</th>
              <th>Оплата</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
          <tr
            v-for="item in items"
            :key="item.id"
            :class="{
              'booking-table__row--mobile-hidden':
                selectedId != null && item.id !== selectedId,
            }"
          >
            <td class="booking-table__number" data-label="№ брони">
              <div class="booking-table__value">{{ item.number }}</div>
            </td>
            <td class="booking-table__date" data-label="Дата брони">
              <div class="booking-table__value">{{ item.date }}</div>
            </td>
            <td
              class="booking-table__base"
              :data-label="showCustomer ? 'Заказчик' : 'Охотн. База'"
            >
              <div class="booking-table__value">
                <button
                  v-if="showCustomer"
                  type="button"
                  class="booking-table__customer-btn"
                  @click="emit('customer', item)"
                >
                  {{ item.customerName ?? '—' }}
                </button>
                <template v-else>
                  <a
                    v-if="item.baseUrl"
                    :href="item.baseUrl"
                    class="booking-table__base-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {{ item.baseName }}
                  </a>
                  <span v-else>{{ item.baseName }}</span>
                </template>
              </div>
            </td>
            <td class="booking-table__details" data-label="Детали">
              <div class="booking-table__value">
                <template v-if="item.accommodation">
                  <strong>Проживание:</strong>
                  <div>
                    Заезд: {{ item.accommodation.checkIn }}<br>
                    Выезд: {{ item.accommodation.checkOut }}<br>
                    {{ nightsLabel(item.accommodation.nights) }}<br>
                    {{ item.accommodation.guests }} чел.
                  </div>

                  <div
                    v-if="showDetailsButtons && item.accommodation.rooms?.length"
                    class="booking-table__details-more"
                  >
                    <button
                      :ref="(el) => setDetailsButtonRef(item.id, el as Element | null)"
                      type="button"
                      class="booking-table__details-btn"
                      :aria-expanded="openDetailsId === item.id"
                      @click.stop="toggleDetails(item.id)"
                    >
                      Подробности
                    </button>
                  </div>
                </template>

                <template v-if="item.hunt">
                  <strong>Охота:</strong>
                  <div>
                    Дата: {{ item.hunt.date }}<br>
                    Животное: {{ item.hunt.animal }}<br>
                    {{ item.hunt.hunters }} чел.
                  </div>
                </template>
              </div>
            </td>
            <td class="booking-table__status" data-label="Статус">
              <div class="booking-table__value">
                <div
                  class="booking-table__status-label"
                  :class="{
                    'booking-table__status-label--danger': item.status.code === 'processing',
                  }"
                >
                  {{ item.status.label }}<template v-if="item.status.timerHours"> ({{ item.status.timerHours }} ч)</template>
                </div>
                <div
                  v-if="item.status.timer && item.status.code !== 'finish_bed_collection'"
                  class="booking-table__status-meta"
                  :class="{
                    'booking-table__status-meta--expired':
                      item.status.timer === '00 мин 00 сек'
                      || item.status.timer === 'Время оплаты истекло',
                  }"
                >
                  {{ item.status.timer }}
                </div>
                <template v-if="item.status.code === 'prepayment_collection'">
                  <div v-if="item.status.paid" class="booking-table__status-meta">
                    {{ item.status.paid }}
                  </div>
                  <div
                    v-if="item.status.subStatus"
                    class="booking-table__status-meta booking-table__status-meta--substatus"
                  >
                    {{ item.status.subStatus }}
                  </div>
                  <div v-if="item.status.collected" class="booking-table__status-meta">
                    {{ item.status.collected }}
                  </div>
                </template>
                <template v-else-if="item.status.code === 'bed_collection'">
                  <div
                    v-if="item.status.subStatus"
                    class="booking-table__status-meta booking-table__status-meta--substatus"
                  >
                    {{ item.status.subStatus }}
                  </div>
                  <div v-if="item.status.paid" class="booking-table__status-meta">
                    {{ item.status.paid }}
                  </div>
                  <div
                    v-if="item.status.collectionStatus"
                    class="booking-table__status-meta booking-table__status-meta--substatus"
                  >
                    {{ item.status.collectionStatus }}
                  </div>
                  <div v-if="item.status.collected" class="booking-table__status-meta">
                    {{ item.status.collected }}
                  </div>
                </template>
                <template v-else>
                  <div v-if="item.status.collected" class="booking-table__status-meta">
                    {{ item.status.collected }}
                  </div>
                  <div
                    v-if="item.status.subStatus"
                    class="booking-table__status-meta booking-table__status-meta--substatus"
                  >
                    {{ item.status.subStatus }}
                  </div>
                  <div v-if="item.status.paid" class="booking-table__status-meta">
                    {{ item.status.paid }}
                  </div>
                </template>
              </div>
            </td>
            <td class="booking-table__payment" data-label="Оплата">
              <div class="booking-table__value">
                <button
                  v-if="
                    showHunterCalculation
                    && isPaymentVisibleStatus(item.status.code)
                  "
                  type="button"
                  class="booking-table__payment-btn"
                  @click="openCalculation(item)"
                >
                  {{ item.paymentAction || 'Калькуляция' }}
                </button>
                <div
                  v-else-if="showCustomer && isHuntingFinishedCollection(item)"
                  class="booking-table__payment-summary"
                >
                  <div>Остаток базе: {{ formatPrice(item.payment?.baseTotal ?? 0) }} руб</div>
                </div>
              </div>
            </td>
            <td class="booking-table__actions" data-label="Действия">
              <div class="booking-table__value">
                <div class="booking-table__actions-list">
                  <button
                    v-for="(action, index) in item.actions"
                    :key="`${item.id}-${index}`"
                    type="button"
                    class="booking-table__action"
                    :class="`booking-table__action--${action.variant}`"
                    :disabled="isCollectionActionLoading(item, action)"
                    :aria-busy="isCollectionActionLoading(item, action)"
                    @click="handleAction(item, action)"
                  >
                    <CommonSpinner
                      v-if="isCollectionActionLoading(item, action)"
                      variant="ring"
                      :size="14"
                      color="var(--wh-white)"
                      :label="action.label"
                    />
                    {{ action.label }}
                  </button>
                  <button
                    v-if="
                      showCalculation
                      && (
                        (item.status.code === 'prepayment_collection' && item.paymentAction)
                        || isPaymentVisibleStatus(item.status.code)
                        || isHuntingFinishedCollection(item)
                      )
                    "
                    type="button"
                    class="booking-table__action booking-table__action--primary"
                    @click="openCalculation(item)"
                  >
                    {{ item.paymentAction || 'Калькуляция' }}
                  </button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="openDetailsItem?.accommodation && openDetailsRooms.length"
        class="booking-table__details-popover"
        role="tooltip"
        :style="popoverStyle"
      >
        <CommonModalCloseButton @click="closeDetails" />
        <div>
          Общее кол-во номеров: {{ openDetailsItem.accommodation.roomsTotal ?? openDetailsRooms.length }}
        </div>
        <div
          v-for="(room, roomIndex) in openDetailsRooms"
          :key="`open-room-${roomIndex}`"
        >
          {{ room.name }}, вместимость = {{ room.capacity }}, кол-во = {{ room.quantity }}, цена = {{ formatHotelPriceLabel(room.pricePerDay) }}/сут
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.booking-table-shell {
  display: flex;
  flex: 1;
  align-items: stretch;
  gap: 12px;
  min-height: 0;
  min-width: 0;
  width: 100%;
}

.booking-table-wrap {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  background: var(--wh-white);
  border: 1px solid var(--wh-gray-400);
  border-radius: var(--wh-radius);
  overflow: hidden;
}

.booking-table-empty {
  padding: 48px 24px;
  text-align: center;
  color: var(--wh-gray-900);
  font-size: 0.95rem;
  font-weight: 600;
}

.booking-table-dots {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  align-self: center;
  gap: 8px;
  width: 10px;
  padding: 4px 0;
  z-index: 2;
}

.booking-table-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  padding: 0;
  border: 1px solid rgb(28 33 28 / 25%);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.booking-table-dot--active {
  border-color: #e8883a;
  background: #e8883a;
}

.booking-table-dot:hover:not(.booking-table-dot--active) {
  border-color: rgb(28 33 28 / 45%);
}

.booking-table-scroll {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: auto;
}

@media (--wh-tablet) {
  .booking-table-scroll {
    max-height: calc(100dvh - 220px);
  }
}

.booking-table {
  width: 100%;
  min-width: 980px;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.82rem;
  line-height: 1.45;
}

.booking-table th,
.booking-table td {
  padding: 14px 12px;
  border-bottom: 1px solid var(--wh-gray-400);
  border-right: 1px solid var(--wh-gray-400);
  vertical-align: middle;
  text-align: left;
}

.booking-table th:nth-child(-n+3),
.booking-table td:nth-child(-n+3) {
  text-align: center;
}

.booking-table th:last-child,
.booking-table td:last-child {
  border-right: none;
}

.booking-table th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--wh-gray-450);
  color: var(--wh-gray-900);
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 1px 0 var(--wh-gray-400);
}

.booking-table th:first-child,
.booking-table th:nth-child(2),
.booking-table th:nth-child(3),
.booking-table__number,
.booking-table__date,
.booking-table__base {
  width: 1%;
  white-space: nowrap;
}

.booking-table th:nth-child(4),
.booking-table__details {
  width: 180px;
  min-width: 160px;
  max-width: 200px;
}

.booking-table th:nth-child(5),
.booking-table__status {
  width: 220px;
  min-width: 200px;
  max-width: 240px;
}

.booking-table th:nth-child(7),
.booking-table td.booking-table__actions {
  width: 200px;
  min-width: 200px;
  max-width: 200px;
}

.booking-table th:nth-child(6),
.booking-table__payment {
  width: 180px;
  min-width: 160px;
  max-width: 240px;
}

.booking-table__payment-summary {
  white-space: normal;
  color: var(--wh-gray-900);
  font-size: 0.82rem;
  line-height: 1.45;
}

.booking-table__number {
  font-weight: 600;
  color: var(--wh-gray-900);
}

.booking-table__base-link {
  color: #4aa3d9;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.15s ease;
}

.booking-table__base-link:hover {
  color: #2f8fc9;
  text-decoration: underline;
}

.booking-table__customer-btn {
  padding: 0;
  border: none;
  background: transparent;
  color: #4aa3d9;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.booking-table__customer-btn:hover {
  color: #2f8fc9;
  text-decoration: underline;
}

.booking-table__details strong {
  display: block;
  margin-top: 6px;
  font-weight: 700;
  color: var(--wh-gray-900);
}

.booking-table__details strong:first-child {
  margin-top: 0;
}

.booking-table__details .booking-table__value > div:not(.booking-table__details-more) {
  color: var(--wh-gray-600);
}

.booking-table__details-more {
  margin-top: 8px;
}

.booking-table__details-btn {
  padding: 0;
  border: none;
  background: transparent;
  color: var(--wh-orange-500);
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.booking-table__details-btn:hover {
  background: transparent;
  opacity: 0.7;
}

.booking-table__status-label {
  color: var(--wh-black-text);
  font-weight: 700;
}

.booking-table__status-label--danger {
  color: var(--wh-field-error);
}

.booking-table__status-meta {
  margin-top: 4px;
  color: var(--wh-gray-600);
  font-size: 0.78rem;
}

.booking-table__status-meta--expired {
  color: var(--wh-field-error);
}

.booking-table__status-meta--substatus {
  margin-top: 16px;
  color: var(--wh-black-text);
  font-size: inherit;
  font-weight: 700;
}

.booking-table__payment-btn {
  padding: 0;
  border: none;
  background: none;
  color: var(--wh-orange-text);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s ease;
}

.booking-table__payment-btn:hover {
  color: var(--wh-orange-600);
}

.booking-table__actions-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.booking-table__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 168px;
  padding: 7px 16px;
  border-radius: 999px;
  border: 1.5px solid transparent;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.booking-table__action:disabled {
  cursor: default;
}

.booking-table__action[aria-busy="true"] {
  width: auto;
  min-width: 168px;
}

.booking-table__action--danger {
  border-color: var(--wh-orange-500);
  background: var(--wh-white);
  color: var(--wh-orange-600);
}

.booking-table__action--danger:hover {
  background: rgba(238, 154, 60, 0.08);
}

.booking-table__action--primary {
  border-color: var(--wh-orange-500);
  background: var(--wh-orange-500);
  color: var(--wh-white);
}

.booking-table__action--primary:hover {
  background: var(--wh-orange-600);
  border-color: var(--wh-orange-600);
}

.booking-table__action--success {
  border-color: var(--wh-green);
  background: var(--wh-green);
  color: var(--wh-white);
}

.booking-table__action--success:hover {
  background: var(--wh-green);
  border-color: var(--wh-green);
}

@media (--wh-mobile) {
  .booking-table {
    min-width: 0;
  }

  .booking-table thead {
    display: none;
  }

  .booking-table tbody,
  .booking-table tr {
    display: block;
    width: 100%;
  }

  .booking-table tbody tr.booking-table__row--mobile-hidden {
    display: none;
  }

  .booking-table th,
  .booking-table td {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    width: 100%;
    min-width: 0;
    max-width: none;
    padding: 14px 16px;
    border-right: none;
    text-align: left;
    white-space: normal;
    vertical-align: top;
  }

  .booking-table th:nth-child(-n+3),
  .booking-table td:nth-child(-n+3) {
    text-align: left;
  }

  .booking-table-shell {
    width: 100%;
  }

  .booking-table-wrap {
    flex: none;
  }

  .booking-table-dots {
    display: none;
  }

  .booking-table-scroll {
    flex: none;
    max-height: none;
    overflow: visible;
  }

  .booking-table tbody tr:last-child td {
    border-bottom: 1px solid var(--wh-gray-400);
  }

  .booking-table tbody tr td:last-child {
    border-bottom: none;
  }

  .booking-table td::before {
    content: attr(data-label);
    flex: 0 0 auto;
    width: 7.4em;
    color: var(--wh-gray-900);
    font-weight: 700;
  }

  .booking-table__value {
    flex: 1;
    min-width: 0;
  }

  .booking-table td.booking-table__actions {
    width: 100%;
    min-width: 0;
    max-width: none;
    gap: 12px;
  }

  .booking-table__actions .booking-table__value {
    display: flex;
    justify-content: flex-end;
  }

  .booking-table__actions-list {
    align-items: stretch;
    width: max-content;
    max-width: 100%;
  }

  .booking-table__action,
  .booking-table__action[aria-busy="true"] {
    width: 100%;
    min-width: 168px;
    box-sizing: border-box;
  }
}
</style>

<style>
.booking-table__details-popover {
  position: fixed;
  z-index: 1100;
  width: 520px;
  max-width: 520px;
  padding: 10px 32px 10px 12px;
  border: 1px solid var(--wh-gray-200);
  border-radius: 6px;
  background: var(--wh-white);
  box-shadow: 0 12px 40px rgba(17, 24, 39, 0.32);
  color: var(--wh-gray-900);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 0.78rem;
  line-height: 1.45;
  pointer-events: auto;
}

.booking-table__details-popover .modal-close-button {
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
}

.booking-table__details-popover .modal-close-button svg {
  width: 14px;
  height: 14px;
}

.booking-table__details-popover > div + div {
  margin-top: 4px;
}

@media (--wh-mobile) {
  .booking-table__details-popover {
    width: calc(100vw - 24px);
    max-width: calc(100vw - 24px);
  }
}
</style>
