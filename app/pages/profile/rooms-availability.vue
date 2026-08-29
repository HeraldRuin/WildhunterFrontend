<script setup lang="ts">
import type { ManagedRoom, RoomAvailabilityDay } from '~/api/rooms'
import { formatApiDate, getCalendarDays, getWeekdayNames } from '~/utils/date'

definePageMeta({
  layout: 'profile',
  path: '/rooms/availability',
})

useHead({
  title: 'Доступные номера — WH',
})

const SUMMARY_TAB_ID = 'summary'

const route = useRoute()
const { rooms: roomsApi } = useApi()
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

const rooms = ref<ManagedRoom[]>([])
const roomSelectOptions = computed(() => [
  { value: SUMMARY_TAB_ID, label: 'Сводный' },
  ...rooms.value.map(room => ({
    value: String(room.id),
    label: room.title,
  })),
])

const activeTabId = ref(SUMMARY_TAB_ID)
const isSummaryTab = computed(() => activeTabId.value === SUMMARY_TAB_ID)

const now = new Date()
const viewDate = ref(new Date(now.getFullYear(), now.getMonth(), 1))

const monthTitle = computed(() => {
  const month = viewDate.value.toLocaleDateString('ru-RU', { month: 'long' })
  return `${month} ${viewDate.value.getFullYear()} г.`
})

const weekdays = getWeekdayNames()

const availabilityDays = ref<RoomAvailabilityDay[]>([])
const availabilityByDate = computed(() => {
  const map = new Map<string, RoomAvailabilityDay>()
  for (const day of availabilityDays.value) {
    map.set(day.start, day)
  }
  return map
})

const isLoadingRooms = ref(true)
const isLoadingAvailability = ref(false)
const loadError = ref('')
const availabilityError = ref('')

const periodRange = computed(() => {
  const year = viewDate.value.getFullYear()
  const month = viewDate.value.getMonth()
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)
  return {
    start: formatApiDate(start),
    end: formatApiDate(end),
  }
})

const calendarDays = computed(() =>
  getCalendarDays(viewDate.value.getFullYear(), viewDate.value.getMonth()).map(day => {
    const key = formatApiDate(day.date)
    const event = day.isCurrentMonth ? availabilityByDate.value.get(key) : undefined

    return {
      ...day,
      key,
      event: event ?? null,
      bookings: event?.bookings ?? [],
      badgeText: event?.title ?? null,
      badgeClass: resolveBadgeClass(event),
      isCheckoutDay: Boolean(event?.is_checkout_day),
      canEdit: Boolean(event) && !isSummaryTab.value && !event?.extendedProps?.is_summary,
    }
  }),
)

function resolveBadgeClass(event?: RoomAvailabilityDay | null) {
  if (!event) {
    return ''
  }

  const names = event.classNames ?? []

  if (names.includes('blocked-event') || event.active === 0) {
    return 'rooms-availability__badge--blocked'
  }

  if (names.includes('full-book-event') || event.number === 0) {
    return 'rooms-availability__badge--full'
  }

  if (event.extendedProps?.price_changed) {
    return 'rooms-availability__badge--price-changed'
  }

  if (event.extendedProps?.number_changed) {
    return 'rooms-availability__badge--number-changed'
  }

  return 'rooms-availability__badge--available'
}

function bookingLabel(booking: NonNullable<RoomAvailabilityDay['bookings']>[number]) {
  const number = booking.booking_number ?? ''
  const status = booking.statusName || booking.status
  const checkout = booking.is_checkout ? ' (В)' : ''
  return `Б${number} ${status}${checkout}`.trim()
}

function extractErrorMessage(source: unknown, fallback: string) {
  if (!source || typeof source !== 'object') {
    return fallback
  }

  const payload = source as {
    success?: boolean
    message?: string
    data?: unknown
  }

  if (payload.message) {
    return payload.message
  }

  if (payload.data && payload.data !== source) {
    return extractErrorMessage(payload.data, fallback)
  }

  return fallback
}

function goToday() {
  const today = new Date()
  viewDate.value = new Date(today.getFullYear(), today.getMonth(), 1)
}

function shiftMonth(delta: number) {
  viewDate.value = new Date(
    viewDate.value.getFullYear(),
    viewDate.value.getMonth() + delta,
    1,
  )
}

function onDayClick(canEdit: boolean) {
  if (!canEdit) {
    return
  }

  // Редактирование дат — только для конкретного номера (не summary).
}

async function loadAvailability() {
  if (!activeTabId.value) {
    return
  }

  isLoadingAvailability.value = true
  availabilityError.value = ''

  try {
    const response = await roomsApi.getAvailability({
      id: activeTabId.value,
      start: periodRange.value.start,
      end: periodRange.value.end,
    })

    if ('success' in response && response.success) {
      availabilityDays.value = response.data ?? []
      return
    }

    availabilityDays.value = []
    availabilityError.value = extractErrorMessage(response, 'Не удалось загрузить календарь')
  }
  catch (error) {
    availabilityDays.value = []
    const data = (error as { data?: unknown }).data
    availabilityError.value = extractErrorMessage(data, 'Не удалось загрузить календарь')
  }
  finally {
    isLoadingAvailability.value = false
  }
}

async function loadRooms() {
  isLoadingRooms.value = true
  loadError.value = ''

  try {
    const response = await roomsApi.getList()

    if ('success' in response && response.success) {
      rooms.value = response.data?.rooms ?? []
      activeTabId.value = SUMMARY_TAB_ID
      await loadAvailability()
      return
    }

    loadError.value = extractErrorMessage(response, 'Не удалось загрузить номера')
  }
  catch (error) {
    const data = (error as { data?: unknown }).data
    loadError.value = extractErrorMessage(data, 'Не удалось загрузить номера')
  }
  finally {
    isLoadingRooms.value = false
  }
}

watch(
  [activeTabId, () => periodRange.value.start, () => periodRange.value.end],
  () => {
    if (isLoadingRooms.value || loadError.value) {
      return
    }

    void loadAvailability()
  },
)

onMounted(() => {
  void loadRooms()
})
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

    <p v-if="loadError" class="rooms-availability__status rooms-availability__status--error">
      {{ loadError }}
    </p>

    <div
      v-else-if="isLoadingRooms"
      class="rooms-availability__loading"
      aria-live="polite"
    >
      <CommonSpinner variant="ring" size="lg" label="Загрузка номеров" />
    </div>

    <div
      v-else
      class="rooms-availability__layout"
      :class="{
        'rooms-availability__layout--summary': isSummaryTab,
        'rooms-availability__layout--refreshing': isLoadingAvailability,
      }"
      :aria-busy="isLoadingAvailability"
    >
      <section class="rooms-availability__calendar">
        <p
          v-if="availabilityError"
          class="rooms-availability__status rooms-availability__status--error rooms-availability__status--inline"
        >
          {{ availabilityError }}
        </p>

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
            v-for="day in calendarDays"
            :key="day.key"
            class="rooms-availability__cell"
            :class="{
              'rooms-availability__cell--outside': !day.isCurrentMonth,
              'rooms-availability__cell--editable': day.canEdit,
              'rooms-availability__cell--checkout': day.isCheckoutDay,
            }"
            @click="onDayClick(day.canEdit)"
          >
            <span class="rooms-availability__day-num">{{ day.date.getDate() }}</span>

            <template v-if="day.isCurrentMonth && day.event">
              <div
                v-if="day.bookings.length"
                class="rooms-availability__bookings"
              >
                <span
                  v-for="booking in day.bookings"
                  :key="`${booking.id}-${booking.is_checkout ? 'out' : 'in'}`"
                  class="rooms-availability__note"
                  :class="{ 'rooms-availability__note--checkout': booking.is_checkout }"
                >
                  {{ bookingLabel(booking) }}
                </span>
              </div>

              <span
                v-if="day.badgeText"
                class="rooms-availability__badge"
                :class="day.badgeClass"
              >
                {{ day.badgeText }}
              </span>
            </template>
          </div>
        </div>

        <div
          v-if="isLoadingAvailability"
          class="rooms-availability__refresh"
          aria-hidden="true"
        >
          <CommonSpinner variant="ring" size="lg" label="Загрузка календаря" />
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

.rooms-availability__status {
  margin: 0 0 16px;
  color: rgba(0, 0, 0, 0.55);
  font-size: 15px;
}

.rooms-availability__status--error {
  color: #dc3545;
}

.rooms-availability__status--inline {
  margin: 12px 16px 0;
}

.rooms-availability__loading {
  display: grid;
  place-items: center;
  flex: 1 1 auto;
  min-height: 280px;
}

.rooms-availability__layout {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1 1 auto;
  min-height: 0;
  border: 1px solid var(--wh-gray-400);
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  overflow: auto;
  box-sizing: border-box;
}

.rooms-availability__layout--refreshing {
  pointer-events: none;
}

.rooms-availability__calendar {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1 0 auto;
  min-width: 0;
  min-height: 100%;
  overflow: visible;
  box-sizing: border-box;
}

.rooms-availability__refresh {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: grid;
  place-items: center;
  background: rgb(255 255 255 / 55%);
  pointer-events: none;
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
  position: sticky;
  top: 0;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  flex-shrink: 0;
  margin-top: 0;
  border-top: none;
  border-left: none;
  background: var(--wh-white);
}

.rooms-availability__weekday {
  padding: 10px 6px;
  border-right: 1px solid var(--wh-gray-300);
  border-bottom: 1px solid var(--wh-gray-300);
  background: var(--wh-white);
  color: #5e6d77;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  text-transform: lowercase;
}

.rooms-availability__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  grid-template-rows: repeat(6, minmax(110px, 1fr));
  flex: 1 0 auto;
  min-height: calc(6 * 110px);
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

.rooms-availability__layout--summary .rooms-availability__cell {
  cursor: default;
}

.rooms-availability__cell--editable {
  cursor: pointer;
}

.rooms-availability__cell--outside {
  background: #fafafa;
}

.rooms-availability__cell--checkout {
  background: #f3f8fc;
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

.rooms-availability__bookings {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  max-width: 100%;
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

.rooms-availability__note--checkout {
  color: #5e6d77;
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
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;
}

.rooms-availability__badge--available {
  background: var(--wh-green);
  color: var(--wh-white);
}

.rooms-availability__badge--blocked {
  background: #fe2727;
  color: var(--wh-white);
}

.rooms-availability__badge--full {
  background: #ff9800;
  color: var(--wh-white);
}

.rooms-availability__badge--price-changed {
  background: #fff3cd;
  color: #856404;
}

.rooms-availability__badge--number-changed {
  background: #d1ecf1;
  color: #0c5460;
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

  .rooms-availability__grid {
    grid-template-rows: repeat(6, minmax(96px, 1fr));
    min-height: calc(6 * 96px);
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
