<script setup lang="ts">
import { ROLE_BASE_ADMIN, ROLE_HUNTER } from '~/utils/roles'

const status = defineModel<string | undefined>({ required: true })

const props = withDefaults(defineProps<{
  role?: string | null
  tabStatuses?: string[]
  dropdownStatuses?: string[]
}>(), {
  role: ROLE_HUNTER,
  tabStatuses: () => [],
  dropdownStatuses: () => [],
})

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  unpaid: 'Не оплачено',
  paid: 'Оплачено',
  processing: 'Ожидается подтверждение базой',
  completed: 'Завершено',
  confirmed: 'Подтверждено',
  cancelled: 'Отменено',
  partial_payment: 'Частичная оплата',
  collection: 'Сбор охотников',
  finished_collection: 'Сбор завершен',
  invitation: 'Приглашения',
  prepayment: 'Предоплата',
  prepayment_collection: 'Сбор предоплаты',
  finish_prepayment: 'Предоплата собрана',
  bed_collection: 'Выбор койко-мест',
  finish_bed_collection: 'Койко-места выбраны',
}

const isBaseAdmin = computed(() =>
  (props.role || '').trim().toLowerCase() === ROLE_BASE_ADMIN,
)

const hunterTabs = [
  { id: undefined as string | undefined, label: 'Мои брони' },
  { id: 'invitation', label: 'Приглашения' },
]

const adminTabs = computed(() => [
  { id: undefined as string | undefined, label: 'Все бронирования' },
  ...props.tabStatuses.map(code => ({
    id: code,
    label: STATUS_LABELS[code] || code,
  })),
])

const dropdownOptions = computed(() =>
  props.dropdownStatuses.map(code => ({
    value: code,
    label: STATUS_LABELS[code] || code,
  })),
)

const dropdownValue = computed({
  get() {
    if (!status.value) return ''
    return props.dropdownStatuses.includes(status.value) ? status.value : ''
  },
  set(value: string) {
    status.value = value || undefined
  },
})

function isTabActive(tabId: string | undefined) {
  if (tabId === undefined) {
    return !status.value
  }

  return status.value === tabId
}

function selectTab(tabId: string | undefined) {
  status.value = tabId
}
</script>

<template>
  <div
    class="booking-history-tabs"
    :class="{ 'booking-history-tabs--admin': isBaseAdmin }"
  >
    <div
      class="booking-history-tabs__list"
      role="tablist"
      :aria-label="isBaseAdmin ? 'Фильтр бронирований базы' : 'Разделы бронирований'"
    >
      <button
        v-for="tab in (isBaseAdmin ? adminTabs : hunterTabs)"
        :key="tab.id ?? 'all'"
        type="button"
        role="tab"
        class="booking-history-tabs__tab"
        :class="{ 'booking-history-tabs__tab--active': isTabActive(tab.id) }"
        :aria-selected="isTabActive(tab.id)"
        @click="selectTab(tab.id)"
      >
        {{ tab.label }}
      </button>

      <CommonSelectField
        v-if="isBaseAdmin && dropdownOptions.length"
        v-model="dropdownValue"
        class="booking-history-tabs__status-select"
        placeholder="Статусы"
        no-margin
        :options="dropdownOptions"
      />
    </div>
  </div>
</template>

<style scoped>
.booking-history-tabs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px 28px;
  margin-bottom: 16px;
}

.booking-history-tabs__list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 28px;
  min-width: 0;
}

.booking-history-tabs__tab {
  position: relative;
  padding: 10px 0 12px;
  border: none;
  border-bottom: 2px solid transparent;
  background: none;
  color: var(--wh-gray-400);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.booking-history-tabs__tab:hover {
  color: var(--wh-gray-600);
}

.booking-history-tabs__tab--active {
  border-bottom-color: var(--wh-orange-500);
}

.booking-history-tabs--admin .booking-history-tabs__tab {
  color: var(--wh-gray-900);
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.booking-history-tabs--admin .booking-history-tabs__tab:hover {
  color: var(--wh-gray-900);
}

.booking-history-tabs--admin .booking-history-tabs__tab--active {
  color: var(--wh-gray-900);
}

.booking-history-tabs__status-select {
  flex-shrink: 0;
  width: 360px;
  max-width: 100%;
}

.booking-history-tabs__status-select :deep(.select-field__trigger) {
  min-height: 36px;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.9rem;
  line-height: 1.3;
}


.booking-history-tabs__status-select :deep(.select-field__list) {
  font-size: 0.9rem;
}

@media (--wh-tablet) {
  .booking-history-tabs,
  .booking-history-tabs__list {
    width: 100%;
    gap: 16px 20px;
  }

  .booking-history-tabs__status-select {
    width: min(100%, 360px);
  }
}
</style>
