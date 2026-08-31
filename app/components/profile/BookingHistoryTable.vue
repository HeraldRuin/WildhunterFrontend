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

const scrollEl = ref<HTMLElement | null>(null)
const listPageCount = ref(1)
const listPageIndex = ref(0)
let listResizeObserver: ResizeObserver | null = null

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

function roomDayTotal(room: BookingRoomDetail) {
  return room.pricePerDay * room.quantity
}

function roomStayTotal(room: BookingRoomDetail, nights: number) {
  return roomDayTotal(room) * Math.max(nights, 1)
}

function roomsStayTotal(rooms: BookingRoomDetail[], nights: number) {
  return rooms.reduce((sum, room) => sum + roomStayTotal(room, nights), 0)
}

function hasRoomNewPrices(room: BookingRoomDetail) {
  return room.priceTotal != null || room.pricePerPerson != null
}

function hasAccommodationTotals(accommodation: NonNullable<BookingHistoryItem['accommodation']>) {
  return accommodation.total != null || accommodation.totalPerPerson != null
}

function isPaymentVisibleStatus(code?: string) {
  return code === 'finish_bed_collection'
    || code === 'paid'
    || code === 'completed'
}

function isHuntingFinishedCollection(item: BookingHistoryItem) {
  return item.type === 'animal' && item.status.code === 'finished_collection'
}

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
                  <div class="booking-table__stay-grid">
                    <div>
                      Заезд: {{ item.accommodation.checkIn }}<br>
                      Выезд: {{ item.accommodation.checkOut }}
                    </div>
                    <div>
                      Длительность: {{ nightsLabel(item.accommodation.nights) }}<br>
                      Кол-во: {{ item.accommodation.guests }} чел.
                    </div>
                  </div>

                  <div
                    v-if="showDetailsButtons && item.accommodation.rooms?.length"
                    class="booking-table__rooms"
                  >
                    <div class="booking-table__stay-grid">
                      <div>
                        <template
                          v-for="(room, roomIndex) in item.accommodation.rooms"
                          :key="`room-${item.id}-${roomIndex}`"
                        >
                          <template v-if="roomIndex > 0"><br></template>
                          {{ room.name }}, Вместимость номера = {{ room.capacity }} чел.
                        </template>
                      </div>
                      <div>
                        <template
                          v-for="(room, roomIndex) in item.accommodation.rooms"
                          :key="`room-booked-${item.id}-${roomIndex}`"
                        >
                          <template v-if="roomIndex > 0"><br></template>
                          Забронировано номеров: {{ room.quantity }}
                        </template>
                      </div>
                    </div>
                    <div>
                      <template v-if="hasAccommodationTotals(item.accommodation)">
                        <template v-if="item.accommodation.total != null">
                          Общая сумма = {{ formatHotelPriceLabel(item.accommodation.total) }}<br>
                        </template>
                        <template v-if="item.accommodation.totalPerPerson != null">
                          На человека = {{ formatHotelPriceLabel(item.accommodation.totalPerPerson) }}
                        </template>
                      </template>
                      <template v-else>
                        <template
                          v-for="(room, roomIndex) in item.accommodation.rooms"
                          :key="`room-price-${item.id}-${roomIndex}`"
                        >
                          <template v-if="roomIndex > 0"><br><br></template>
                          <template v-if="hasRoomNewPrices(room)">
                            <template v-if="room.priceTotal != null">
                              Сумма = {{ formatHotelPriceLabel(room.priceTotal) }}<br>
                            </template>
                            <template v-if="room.pricePerPerson != null">
                              На человека = {{ formatHotelPriceLabel(room.pricePerPerson) }}
                            </template>
                          </template>
                          <template v-else>
                            Сумма за сутки = {{ formatHotelPriceLabel(roomDayTotal(room)) }}<br>
                            Сумма за проживание = {{ formatHotelPriceLabel(roomStayTotal(room, item.accommodation.nights)) }}
                          </template>
                        </template>
                        <template v-if="item.accommodation.rooms.length > 1">
                          <br><br>
                          Итого = {{ formatHotelPriceLabel(roomsStayTotal(item.accommodation.rooms, item.accommodation.nights)) }}
                        </template>
                        <template v-else-if="item.payment?.total">
                          <br>
                          Итого по брони = {{ formatHotelPriceLabel(item.payment.total) }}
                        </template>
                      </template>
                    </div>
                  </div>
                </template>

                <template v-if="item.hunt">
                  <strong>Охота:</strong>
                  <div class="booking-table__stay-grid">
                    <div>
                      Дата: {{ item.hunt.date }}<br>
                      Животное: {{ item.hunt.animal }}<br>
                      Кол-во: {{ item.hunt.hunters }} чел.
                    </div>
                    <div>
                      <template v-if="item.hunt.total != null || item.hunt.totalPerPerson != null">
                        <template v-if="item.hunt.total != null">
                          Общая сумма = {{ formatHotelPriceLabel(item.hunt.total) }}<br>
                        </template>
                        <template v-if="item.hunt.totalPerPerson != null">
                          На человека = {{ formatHotelPriceLabel(item.hunt.totalPerPerson) }}
                        </template>
                      </template>
                      <template v-else-if="item.hunt.priceTotal != null || item.hunt.pricePerPerson != null">
                        <template v-if="item.hunt.priceTotal != null">
                          Сумма = {{ formatHotelPriceLabel(item.hunt.priceTotal) }}<br>
                        </template>
                        <template v-if="item.hunt.pricePerPerson != null">
                          На человека = {{ formatHotelPriceLabel(item.hunt.pricePerPerson) }}
                        </template>
                      </template>
                      <template v-else-if="item.hunt.pricePerHunter != null">
                        Цена охоты = {{ formatHotelPriceLabel(item.hunt.pricePerHunter) }}
                      </template>
                      <template v-else>
                        —
                      </template>
                    </div>
                  </div>
                </template>
              </div>
            </td>
            <td class="booking-table__status" data-label="Статус">
              <div class="booking-table__value">
                <div
                  class="booking-table__status-label"
                  :class="{
                    'booking-table__status-label--danger':
                      item.status.code === 'processing'
                      || item.status.code === 'cancelled',
                    'booking-table__status-label--confirmed':
                      item.status.code === 'confirmed'
                      || item.status.code === 'finish_bed_collection',
                    'booking-table__status-label--collection':
                      item.status.code === 'collection'
                      || item.status.code === 'prepayment_collection',
                  }"
                >
                  {{ item.status.label }}<template v-if="item.status.timerHours"> ({{ item.status.timerHours }} ч)</template>
                </div>
                <div
                  v-if="item.status.timer && item.status.code !== 'finish_bed_collection'"
                  class="booking-table__status-meta booking-table__status-meta--timer"
                  :class="{
                    'booking-table__status-meta--expired':
                      item.status.timer === '00 мин 00 сек'
                      || item.status.timer === 'Время оплаты истекло',
                  }"
                >
                  {{ item.status.timer }}
                </div>
                <template v-if="item.status.code === 'prepayment_collection'">
                  <div v-if="item.status.paid" class="booking-table__status-meta booking-table__status-meta--collected">
                    {{ item.status.paid }}
                  </div>
                  <div
                    v-if="item.status.subStatus"
                    class="booking-table__status-meta booking-table__status-meta--substatus"
                  >
                    {{ item.status.subStatus }}
                  </div>
                  <div v-if="item.status.collected" class="booking-table__status-meta booking-table__status-meta--collected">
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
                  <div v-if="item.status.paid" class="booking-table__status-meta booking-table__status-meta--collected">
                    {{ item.status.paid }}
                  </div>
                  <div
                    v-if="item.status.collectionStatus"
                    class="booking-table__status-meta booking-table__status-meta--substatus"
                  >
                    {{ item.status.collectionStatus }}
                  </div>
                  <div v-if="item.status.collected" class="booking-table__status-meta booking-table__status-meta--collected">
                    {{ item.status.collected }}
                  </div>
                </template>
                <template v-else>
                  <div v-if="item.status.collected" class="booking-table__status-meta booking-table__status-meta--collected">
                    {{ item.status.collected }}
                  </div>
                  <div
                    v-if="item.status.subStatus"
                    class="booking-table__status-meta booking-table__status-meta--substatus"
                  >
                    {{ item.status.subStatus }}
                  </div>
                  <div v-if="item.status.paid" class="booking-table__status-meta booking-table__status-meta--collected">
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
  width: 340px;
  min-width: 300px;
  max-width: 380px;
}

.booking-table th:nth-child(5),
.booking-table__status {
  width: 160px;
  min-width: 140px;
  max-width: 180px;
}

.booking-table th:nth-child(7),
.booking-table td.booking-table__actions {
  width: 200px;
  min-width: 200px;
  max-width: 200px;
}

.booking-table th:nth-child(6),
.booking-table__payment {
  width: 120px;
  min-width: 100px;
  max-width: 140px;
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

.booking-table__details .booking-table__value > div:not(.booking-table__rooms):not(.booking-table__stay-grid) {
  color: #4a4a4a;
  font-weight: 500;
}

.booking-table__stay-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
  color: #4a4a4a;
  font-weight: 500;
}

.booking-table__stay-grid > div {
  padding: 6px 8px;
  border: 1px solid var(--wh-gray-200);
  border-radius: 4px;
}

.booking-table__rooms {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  color: #4a4a4a;
  font-weight: 500;
}

.booking-table__rooms > div {
  padding: 6px 8px;
  border: 1px solid var(--wh-gray-200);
  border-radius: 4px;
}

.booking-table__rooms > .booking-table__stay-grid {
  padding: 0;
  border: none;
}

.booking-table__status-label {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 3px;
  background: var(--wh-gray-600);
  color: var(--wh-white);
  font-size: 0.68rem;
  font-weight: 600;
  line-height: 1.2;
}

.booking-table__status-label--danger {
  background: var(--wh-field-error);
}

.booking-table__status-label--confirmed {
  background: #25a447;
}

.booking-table__status-label--collection {
  background: #2f8fc9;
}

.booking-table__status-meta {
  margin-top: 4px;
  color: var(--wh-gray-600);
  font-size: 0.78rem;
}

.booking-table__status-meta--timer {
  color: var(--wh-black-text);
  font-weight: 600;
}

.booking-table__status-meta--expired {
  color: var(--wh-field-error);
}

.booking-table__status-meta--substatus {
  display: block;
  width: fit-content;
  margin-top: 6px;
  padding: 3px 8px;
  border-radius: 3px;
  background: #25a447;
  color: var(--wh-white);
  font-size: 0.68rem;
  font-weight: 600;
  line-height: 1.2;
}

.booking-table__status-meta--collected {
  display: block;
  width: fit-content;
  margin-top: 6px;
  padding: 3px 8px;
  border-radius: 3px;
  background: var(--wh-gray-600);
  color: var(--wh-white);
  font-size: 0.68rem;
  font-weight: 600;
  line-height: 1.2;
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
  border-color: #dc3545;
  background: #dc3545;
  color: var(--wh-white);
}

.booking-table__action--danger:hover {
  border-color: #c82333;
  background: #c82333;
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
