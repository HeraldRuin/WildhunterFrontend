<script setup lang="ts">
import type { BookingAction, BookingHistoryItem, BookingRoomDetail } from '~/types/booking'

const props = defineProps<{
  items: BookingHistoryItem[]
  emptyText?: string
}>()

const emit = defineEmits<{
  action: [payload: { booking: BookingHistoryItem, action: BookingAction }]
}>()

const openDetailsId = ref<number | null>(null)
const popoverStyle = ref<Record<string, string>>({})
const detailsButtonRefs = new Map<number, HTMLElement>()

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
  const estimatedWidth = 320
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

function handleAction(booking: BookingHistoryItem, action: BookingAction) {
  emit('action', { booking, action })
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

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', updatePopoverPosition)
  window.addEventListener('scroll', updatePopoverPosition, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', updatePopoverPosition)
  window.removeEventListener('scroll', updatePopoverPosition, true)
})
</script>

<template>
  <div class="booking-table-wrap">
    <div v-if="!items.length" class="booking-table-empty">
      {{ emptyText ?? 'Нет бронирований' }}
    </div>

    <div v-else class="booking-table-scroll">
      <table class="booking-table">
        <thead>
          <tr>
            <th>№ брони</th>
            <th>Дата брони</th>
            <th>Охотн. База</th>
            <th>Тип</th>
            <th>Детали</th>
            <th>Статус</th>
            <th>Оплата</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td class="booking-table__number">{{ item.number }}</td>
            <td class="booking-table__date">{{ item.date }}</td>
            <td class="booking-table__base">
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
            </td>
            <td class="booking-table__type">{{ item.typeLabel }}</td>
            <td class="booking-table__details">
              <template v-if="item.accommodation">
                <strong>Проживание:</strong>
                <div>
                  Заезд: {{ item.accommodation.checkIn }}<br>
                  Выезд: {{ item.accommodation.checkOut }}<br>
                  {{ nightsLabel(item.accommodation.nights) }}<br>
                  {{ item.accommodation.guests }} чел.
                </div>

                <div
                  v-if="item.accommodation.rooms?.length"
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
            </td>
            <td class="booking-table__status">
              <div
                class="booking-table__status-label"
                :class="{
                  'booking-table__status-label--danger': item.status.code === 'processing',
                }"
              >
                {{ item.status.label }}<template v-if="item.status.timerHours"> ({{ item.status.timerHours }} ч)</template>
              </div>
              <div
                v-if="item.status.timer"
                class="booking-table__status-meta"
                :class="{
                  'booking-table__status-meta--expired': item.status.timer === '00 мин 00 сек',
                }"
              >
                {{ item.status.timer }}
              </div>
              <div v-if="item.status.collected" class="booking-table__status-meta">
                {{ item.status.collected }}
              </div>
              <div v-if="item.status.subStatus" class="booking-table__status-meta">
                {{ item.status.subStatus }}
              </div>
              <div v-if="item.status.paid" class="booking-table__status-meta">
                {{ item.status.paid }}
              </div>
            </td>
            <td class="booking-table__payment">
              <button
                v-if="item.paymentAction"
                type="button"
                class="booking-table__payment-btn"
              >
                {{ item.paymentAction }}
              </button>
            </td>
            <td class="booking-table__actions">
              <div class="booking-table__actions-list">
                <button
                  v-for="(action, index) in item.actions"
                  :key="`${item.id}-${index}`"
                  type="button"
                  class="booking-table__action"
                  :class="`booking-table__action--${action.variant}`"
                  @click="handleAction(item, action)"
                >
                  {{ action.label }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <div
        v-if="openDetailsItem?.accommodation && openDetailsRooms.length"
        class="booking-table__details-popover"
        role="tooltip"
        :style="popoverStyle"
      >
        <div>
          Общее кол-во номеров: {{ openDetailsItem.accommodation.roomsTotal ?? openDetailsRooms.length }}
        </div>
        <div
          v-for="(room, roomIndex) in openDetailsRooms"
          :key="`open-room-${roomIndex}`"
        >
          {{ room.name }}, вместимость = {{ room.capacity }}; кол-во = {{ room.quantity }}; цена = {{ formatPrice(room.pricePerDay) }} р/сут
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.booking-table-wrap {
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

.booking-table-scroll {
  overflow-x: auto;
}

.booking-table {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
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

.booking-table th:nth-child(-n+4),
.booking-table td:nth-child(-n+4) {
  text-align: center;
}

.booking-table th:last-child,
.booking-table td:last-child {
  border-right: none;
}

.booking-table th {
  background: var(--wh-gray-100);
  color: var(--wh-gray-900);
  font-weight: 700;
  white-space: nowrap;
}

.booking-table tbody tr:last-child td {
  border-bottom: none;
}

.booking-table th:first-child,
.booking-table th:nth-child(2),
.booking-table th:nth-child(3),
.booking-table th:nth-child(4),
.booking-table__number,
.booking-table__date,
.booking-table__base,
.booking-table__type {
  width: 1%;
  white-space: nowrap;
}

.booking-table th:nth-child(5),
.booking-table__details {
  width: 180px;
  min-width: 160px;
  max-width: 200px;
}

.booking-table th:nth-child(6),
.booking-table__status {
  width: 220px;
  min-width: 200px;
  max-width: 240px;
}

.booking-table th:nth-child(8),
.booking-table td.booking-table__actions {
  width: 200px;
  min-width: 200px;
  max-width: 200px;
}

.booking-table th:nth-child(7),
.booking-table__payment {
  width: 130px;
  min-width: 110px;
  max-width: 150px;
  white-space: nowrap;
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

.booking-table__type {
  white-space: nowrap;
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

.booking-table__details > div:not(.booking-table__details-more) {
  color: var(--wh-gray-600);
}

.booking-table__details-more {
  margin-top: 8px;
}

.booking-table__details-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  background: #17a2b8;
  color: var(--wh-white);
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  transition: background 0.15s ease;
}

.booking-table__details-btn:hover {
  background: #138496;
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
  width: 140px;
  padding: 7px 10px;
  border-radius: 999px;
  border: 1.5px solid transparent;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
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
</style>

<style>
.booking-table__details-popover {
  position: fixed;
  z-index: 1100;
  max-width: 320px;
  padding: 10px 12px;
  border: 1px solid var(--wh-gray-200);
  border-radius: 6px;
  background: var(--wh-white);
  box-shadow: 0 4px 16px rgba(17, 24, 39, 0.18);
  color: var(--wh-gray-900);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 0.78rem;
  line-height: 1.45;
  pointer-events: auto;
}

.booking-table__details-popover > div + div {
  margin-top: 4px;
}
</style>
