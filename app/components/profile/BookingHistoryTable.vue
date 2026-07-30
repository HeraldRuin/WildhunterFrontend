<script setup lang="ts">
import type { BookingHistoryItem } from '~/types/booking'

defineProps<{
  items: BookingHistoryItem[]
  emptyText?: string
}>()

const expandedDetails = ref<Record<number, boolean>>({})

function toggleDetails(id: number) {
  expandedDetails.value[id] = !expandedDetails.value[id]
}

function nightsLabel(count: number) {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod10 === 1 && mod100 !== 11) return `${count} ночь`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${count} ночи`

  return `${count} ночей`
}
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
            <td>{{ item.date }}</td>
            <td>
              <NuxtLink
                v-if="item.baseUrl"
                :to="item.baseUrl"
                class="booking-table__base-link"
                target="_blank"
              >
                {{ item.baseName }}
              </NuxtLink>
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
              </template>

              <template v-if="item.hunt">
                <strong>Охота:</strong>
                <div>
                  Дата: {{ item.hunt.date }}<br>
                  Животное: {{ item.hunt.animal }}<br>
                  {{ item.hunt.hunters }} чел.
                </div>
              </template>

              <button
                type="button"
                class="booking-table__details-btn"
                @click="toggleDetails(item.id)"
              >
                {{ expandedDetails[item.id] ? 'Скрыть' : 'Подробности' }}
              </button>

              <div v-if="expandedDetails[item.id] && item.accommodation?.rooms" class="booking-table__details-extra">
                {{ item.accommodation.rooms }}
              </div>
            </td>
            <td class="booking-table__status">
              <div>{{ item.status.label }}</div>
              <div v-if="item.status.timer" class="booking-table__status-meta">
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
              <button
                v-for="(action, index) in item.actions"
                :key="`${item.id}-${index}`"
                type="button"
                class="booking-table__action"
                :class="`booking-table__action--${action.variant}`"
              >
                {{ action.label }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.booking-table-wrap {
  background: var(--wh-white);
  border: 1px solid var(--wh-gray-200);
  border-radius: var(--wh-radius);
  overflow: hidden;
}

.booking-table-empty {
  padding: 48px 24px;
  text-align: center;
  color: var(--wh-gray-500);
  font-size: 0.95rem;
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
  border-bottom: 1px solid var(--wh-gray-200);
  vertical-align: top;
  text-align: left;
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

.booking-table__number {
  font-weight: 600;
  color: var(--wh-gray-900);
}

.booking-table__base-link {
  color: var(--wh-green);
  font-weight: 600;
  transition: color 0.15s ease;
}

.booking-table__base-link:hover {
  color: var(--wh-green);
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

.booking-table__details-btn {
  margin-top: 8px;
  padding: 0;
  border: none;
  background: none;
  color: var(--wh-orange-text);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s ease;
}

.booking-table__details-btn:hover {
  color: var(--wh-orange-600);
}

.booking-table__details-extra {
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--wh-gray-100);
  color: var(--wh-gray-600);
  font-size: 0.78rem;
}

.booking-table__status-meta {
  margin-top: 4px;
  color: var(--wh-gray-500);
  font-size: 0.78rem;
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

.booking-table__actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 130px;
}

.booking-table__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
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
