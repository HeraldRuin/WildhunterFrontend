<script setup lang="ts">
import { getCalendarDays, getWeekdayNames } from '~/utils/date'

definePageMeta({
  layout: 'profile',
  path: '/rooms/availability',
})

useHead({
  title: 'Доступные номера — WH',
})

const route = useRoute()
const authToken = useAuthToken()
const ready = ref(false)

onBeforeMount(() => {
  authToken.initFromStorage()

  if (!authToken.isAuthenticated.value) {
    const { open: openLoginModal } = useLoginModal()
    nextTick(() => openLoginModal())
    void navigateTo('/', { replace: true })
    return
  }

  ready.value = true
})

const hotelId = computed(() => {
  const raw = route.query.hotelId
  return typeof raw === 'string' && raw ? raw : null
})

const hotelTitle = 'Хромой кабан-2'

const breadcrumbs = computed(() => [
  { label: 'Главная', to: '/' },
  { label: 'Отели', to: '/profile/base' },
  {
    label: `Управление номерами: ${hotelTitle}`,
    to: hotelId.value ? { path: '/rooms', query: { hotelId: hotelId.value } } : '/rooms',
  },
  { label: 'Наличие' },
])

type RoomTab = {
  id: string
  label: string
  price: number
  quantity: number
}

const roomTabs: RoomTab[] = [
  { id: 'summary', label: 'Сводный', price: 3000, quantity: 3 },
  { id: '1', label: '3-х местный', price: 3000, quantity: 3 },
  { id: '2', label: '4-х местный', price: 4000, quantity: 4 },
]

const roomSelectOptions = roomTabs.map(tab => ({
  value: tab.id,
  label: tab.label,
}))

const activeTabId = ref('')

const activeTab = computed(() =>
  roomTabs.find(tab => tab.id === activeTabId.value) ?? roomTabs[0],
)

const viewDate = ref(new Date(2026, 7, 1))

const monthTitle = computed(() => {
  const month = viewDate.value.toLocaleDateString('ru-RU', { month: 'long' })
  return `${month} ${viewDate.value.getFullYear()} г.`
})

const weekdays = getWeekdayNames()

const calendarDays = computed(() =>
  getCalendarDays(viewDate.value.getFullYear(), viewDate.value.getMonth()).map(day => ({
    ...day,
    badge: day.isCurrentMonth ? getDayBadge(day.date) : null,
  })),
)

type DayNote = {
  label: string
  quantity?: number
}

const dayNotes: Record<string, DayNote> = {
  '2026-08-15': { label: 'Б27 Сбор предоплаты', quantity: 1 },
  '2026-08-16': { label: 'Б27 Сбор предоплаты (В)', quantity: 1 },
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatPrice(value: number) {
  return `${new Intl.NumberFormat('ru-RU').format(value).replace(/\s/g, '.')} руб`
}

function getDayBadge(date: Date) {
  const note = dayNotes[toDateKey(date)]
  const quantity = note?.quantity ?? activeTab.value.quantity

  return {
    note: note?.label ?? null,
    text: `${formatPrice(activeTab.value.price)} x ${quantity}`,
  }
}

function goToday() {
  const now = new Date()
  viewDate.value = new Date(now.getFullYear(), now.getMonth(), 1)
}

function shiftMonth(delta: number) {
  viewDate.value = new Date(
    viewDate.value.getFullYear(),
    viewDate.value.getMonth() + delta,
    1,
  )
}
</script>

<template>
  <div v-if="ready" class="profile-page">
    <header class="profile-page__header">
      <AppBreadcrumbs :items="breadcrumbs" />

      <ProfileNotificationsBell />
    </header>

    <div class="rooms-availability__toolbar">
      <CommonPageTitle>Доступные номера</CommonPageTitle>

      <CommonSelectField
        v-model="activeTabId"
        class="rooms-availability__select"
        placeholder="Выберите тип номера"
        no-margin
        :options="roomSelectOptions"
      />

      <div class="rooms-availability__calendar-header">
        <h2 class="rooms-availability__month">{{ monthTitle }}</h2>

        <div class="rooms-availability__nav">
          <button
            type="button"
            class="rooms-availability__nav-btn rooms-availability__nav-btn--today"
            @click="goToday"
          >
            Сегодня
          </button>
          <button
            type="button"
            class="rooms-availability__nav-btn rooms-availability__nav-btn--arrow"
            aria-label="Предыдущий месяц"
            @click="shiftMonth(-1)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            class="rooms-availability__nav-btn rooms-availability__nav-btn--arrow"
            aria-label="Следующий месяц"
            @click="shiftMonth(1)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M9 6l6 6-6 6"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div class="rooms-availability__layout">
      <section class="rooms-availability__calendar">
        <div class="rooms-availability__weekdays">
          <span
            v-for="day in weekdays"
            :key="day"
            class="rooms-availability__weekday"
          >
            {{ day }}
          </span>
        </div>

        <div class="rooms-availability__grid">
          <div
            v-for="(day, index) in calendarDays"
            :key="index"
            class="rooms-availability__cell"
            :class="{ 'rooms-availability__cell--outside': !day.isCurrentMonth }"
          >
            <span class="rooms-availability__day-num">{{ day.date.getDate() }}</span>

            <template v-if="day.badge">
              <span
                v-if="day.badge.note"
                class="rooms-availability__note"
              >
                {{ day.badge.note }}
              </span>
              <span class="rooms-availability__badge">
                {{ day.badge.text }}
              </span>
            </template>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 0px);
  height: 100%;
  padding: 20px 40px 24px;
  box-sizing: border-box;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
}

.profile-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  height: 31px;
  flex-shrink: 0;
  margin-bottom: 20px;
  padding: 0;
  box-sizing: border-box;
  background: var(--wh-white);
  border-radius: var(--wh-radius);
  overflow: visible;
}

.rooms-availability__toolbar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  width: 100%;
  flex-shrink: 0;
  margin-bottom: 16px;
  box-sizing: border-box;
}

.rooms-availability__toolbar :deep(.page-title) {
  margin: 0;
  justify-self: start;
}

.rooms-availability__select {
  width: 420px;
  max-width: 100%;
  justify-self: center;
}

.rooms-availability__calendar-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  min-width: 0;
  margin: 0;
  justify-self: end;
}

.rooms-availability__layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1 1 auto;
  min-height: calc(100vh - 180px);
  border: 1px solid var(--wh-gray-400);
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  overflow: hidden;
  box-sizing: border-box;
}

.rooms-availability__calendar {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  padding: 0 0 0;
  box-sizing: border-box;
}

.rooms-availability__month {
  margin: 0;
  color: var(--wh-gray-900);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
  text-transform: lowercase;
}

.rooms-availability__nav {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.rooms-availability__nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: auto;
  padding: 7px 20px;
  border: 1.5px solid var(--wh-orange-500);
  border-radius: 999px;
  background: var(--wh-orange-500);
  color: var(--wh-white);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  cursor: pointer;
  box-sizing: border-box;
  transition: opacity 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}

.rooms-availability__nav-btn:hover {
  border-color: var(--wh-orange-600);
  background: var(--wh-orange-600);
}

.rooms-availability__nav-btn--today {
  padding: 7px 22px;
}

.rooms-availability__nav-btn--arrow {
  min-width: 40px;
  padding: 7px 14px;
}

.rooms-availability__nav-btn--arrow svg {
  display: block;
  flex-shrink: 0;
}

.rooms-availability__weekdays {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  flex-shrink: 0;
  margin-top: 0;
  border-top: none;
  border-left: none;
}

.rooms-availability__weekday {
  padding: 10px 6px;
  border-right: 1px solid var(--wh-gray-300);
  border-bottom: 1px solid var(--wh-gray-300);
  color: #5e6d77;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  text-transform: lowercase;
}

.rooms-availability__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  grid-template-rows: repeat(6, minmax(0, 1fr));
  flex: 1 1 auto;
  min-height: 0;
  border-left: none;
}

.rooms-availability__cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  min-height: 110px;
  height: 100%;
  padding: 8px 6px 10px;
  border-right: 1px solid var(--wh-gray-300);
  border-bottom: 1px solid var(--wh-gray-300);
  box-sizing: border-box;
}

.rooms-availability__cell--outside {
  background: #fafafa;
}

.rooms-availability__cell--outside .rooms-availability__day-num {
  opacity: 0.35;
}

.rooms-availability__day-num {
  align-self: flex-end;
  margin-bottom: 4px;
  color: var(--wh-gray-900);
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
}

.rooms-availability__note {
  max-width: 100%;
  color: var(--wh-gray-900);
  font-size: 11px;
  font-weight: 500;
  line-height: 1.2;
  text-align: center;
  overflow-wrap: anywhere;
}

.rooms-availability__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  margin-top: auto;
  margin-bottom: auto;
  padding: 6px 8px;
  border-radius: 4px;
  background: var(--wh-green);
  color: var(--wh-white);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;
}

@media (--wh-tablet) {
  .profile-page {
    padding: 12px 8px 32px;
  }

  .rooms-availability__badge {
    font-size: 10px;
    padding: 3px 4px;
  }
}

@media (--wh-narrow) {
  .rooms-availability__toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .rooms-availability__select {
    width: 100%;
    order: 3;
  }

  .rooms-availability__calendar-header {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .rooms-availability__cell {
    min-height: 96px;
  }
}

@media (--wh-mobile) {
  .profile-page {
    padding: 16px 20px 32px;
  }

  .profile-page__header {
    height: auto;
    min-height: 31px;
    padding: 0;
    background: transparent;
    border-radius: 0;
  }

  .rooms-availability__badge {
    white-space: normal;
  }
}
</style>
