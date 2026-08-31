<script setup lang="ts">
import type { RoomAvailabilityDay, RoomAvailabilityStorePayload } from '~/api/rooms'
import { formatApiDate, formatBookingDate, startOfDay } from '~/utils/date'

const WEEKDAY_OPTIONS = [
  { value: 1, label: 'Понедельник' },
  { value: 2, label: 'Вторник' },
  { value: 3, label: 'Среда' },
  { value: 4, label: 'Четверг' },
  { value: 5, label: 'Пятница' },
  { value: 6, label: 'Суббота' },
  { value: 7, label: 'Воскресенье' },
] as const

const props = defineProps<{
  day: RoomAvailabilityDay | null
  date: Date | null
  roomId: string | number | null
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const { rooms: roomsApi } = useApi()
const notifications = useNotifications()

const isOpen = computed(() => Boolean(props.day && props.date && props.roomId != null))

useBodyScrollLock(isOpen)

const active = ref(true)
const price = ref('')
const number = ref('')
const dayOfWeekSelect = ref<number[]>([])
const rangeStart = ref<Date | null>(null)
const rangeEnd = ref<Date | null>(null)
const isDateRangeOpen = ref(false)
const activeDatePart = ref<'start' | 'end' | null>('start')
const dateRangeFieldRef = ref<HTMLElement | null>(null)
const isSaving = ref(false)
const saveError = ref('')
const rangeError = ref('')
const priceError = ref('')
const numberError = ref('')

const maxNumber = computed(() => props.day?.extendedProps?.max_number ?? props.day?.number ?? 0)

const dateRangeDisplay = computed(() => {
  if (!rangeStart.value) {
    return ''
  }

  const startLabel = formatBookingDate(rangeStart.value)
  const endLabel = rangeEnd.value ? formatBookingDate(rangeEnd.value) : startLabel

  return `${startLabel} - ${endLabel}`
})

function formatPriceAmount(value: number | string | null | undefined) {
  const numeric = typeof value === 'number'
    ? value
    : Number.parseFloat(String(value ?? '').replace(',', '.'))

  if (Number.isNaN(numeric)) {
    return '0,00'
  }

  return numeric.toFixed(2).replace('.', ',')
}

function parsePriceInput(value: string) {
  const numeric = Number.parseFloat(value.trim().replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(numeric) ? numeric : null
}

function parseNumberInput(value: string) {
  const numeric = Number.parseInt(value.trim(), 10)
  return Number.isFinite(numeric) ? numeric : null
}

function resetForm() {
  isDateRangeOpen.value = false
  activeDatePart.value = 'start'
  isSaving.value = false
  saveError.value = ''
  rangeError.value = ''
  priceError.value = ''
  numberError.value = ''

  if (!props.day) {
    active.value = true
    price.value = ''
    number.value = ''
    dayOfWeekSelect.value = []
    rangeStart.value = null
    rangeEnd.value = null
    return
  }

  if (props.date) {
    const day = startOfDay(props.date)
    rangeStart.value = day
    rangeEnd.value = day
  }
  else {
    rangeStart.value = null
    rangeEnd.value = null
  }

  active.value = Number(props.day.active) === 1
  price.value = formatPriceAmount(props.day.price)
  number.value = String(props.day.number ?? '')
  dayOfWeekSelect.value = []
}

function toggleDateRangeCalendar() {
  isDateRangeOpen.value = !isDateRangeOpen.value

  if (isDateRangeOpen.value) {
    activeDatePart.value = 'start'
  }
}

function handleDateDocumentClick(event: MouseEvent) {
  if (!isDateRangeOpen.value) {
    return
  }

  if (!dateRangeFieldRef.value?.contains(event.target as Node)) {
    isDateRangeOpen.value = false
  }
}

watch(
  () => isOpen.value,
  (open) => {
    if (open) {
      document.addEventListener('click', handleDateDocumentClick)
      return
    }

    document.removeEventListener('click', handleDateDocumentClick)
    isDateRangeOpen.value = false
  },
  { immediate: true },
)

watch(rangeEnd, (end) => {
  if (end && rangeStart.value) {
    isDateRangeOpen.value = false
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleDateDocumentClick)
})

watch(
  () => [props.day, props.date] as const,
  () => {
    resetForm()
  },
  { immediate: true },
)

function close() {
  if (isSaving.value) {
    return
  }

  emit('close')
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    close()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (isDateRangeOpen.value) {
      isDateRangeOpen.value = false
      return
    }

    close()
  }
}

function toggleWeekday(value: number, checked: boolean) {
  if (checked) {
    if (!dayOfWeekSelect.value.includes(value)) {
      dayOfWeekSelect.value = [...dayOfWeekSelect.value, value]
    }
    return
  }

  dayOfWeekSelect.value = dayOfWeekSelect.value.filter(day => day !== value)
}

function isWeekdaySelected(value: number) {
  return dayOfWeekSelect.value.includes(value)
}

function clearFieldErrors() {
  rangeError.value = ''
  priceError.value = ''
  numberError.value = ''
  saveError.value = ''
}

function buildPayload(): RoomAvailabilityStorePayload | null {
  clearFieldErrors()

  if (!rangeStart.value) {
    rangeError.value = 'Укажите диапазон дат'
    return null
  }

  const start = startOfDay(rangeStart.value)
  const end = startOfDay(rangeEnd.value ?? rangeStart.value)

  const payload: RoomAvailabilityStorePayload = {
    start_date: formatApiDate(start),
    end_date: formatApiDate(end.getTime() < start.getTime() ? start : end),
    active: active.value,
    day_of_week_select: [...dayOfWeekSelect.value],
  }

  if (active.value) {
    const parsedPrice = parsePriceInput(price.value)
    if (parsedPrice == null) {
      priceError.value = 'Укажите стоимость'
      return null
    }

    const parsedNumber = parseNumberInput(number.value)
    if (parsedNumber == null) {
      numberError.value = 'Укажите количество комнат'
      return null
    }

    if (parsedNumber < 1 || (maxNumber.value > 0 && parsedNumber > maxNumber.value)) {
      numberError.value = `Количество комнат должно быть от 1 до ${maxNumber.value}`
      return null
    }

    payload.price = parsedPrice
    payload.number = parsedNumber
  }

  return payload
}

async function save() {
  if (isSaving.value || props.roomId == null) {
    return
  }

  const payload = buildPayload()
  if (!payload) {
    return
  }

  isSaving.value = true

  try {
    const response = await roomsApi.storeAvailability(props.roomId, payload)

    if (!response.success) {
      saveError.value = response.message || 'Не удалось сохранить изменения'
      notifications.error(saveError.value)
      return
    }

    notifications.success(response.message || 'Доступность номера обновлена')
    emit('saved')
    emit('close')
  }
  catch (error) {
    const data = (error as { data?: { message?: string } }).data
    saveError.value = data?.message || 'Не удалось сохранить изменения'
    notifications.error(saveError.value)
  }
  finally {
    isSaving.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="room-availability-date-modal">
      <div
        v-if="isOpen && day && date"
        class="room-availability-date-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-availability-date-modal-title"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <div class="room-availability-date-modal__card" @click.stop>
          <CommonModalCloseButton @click="close" />

          <h2 id="room-availability-date-modal-title" class="room-availability-date-modal__title">
            Информация о дате
          </h2>

          <form class="room-availability-date-modal__form" @submit.prevent>
            <div class="room-availability-date-modal__row">
              <div
                ref="dateRangeFieldRef"
                class="room-availability-date-modal__field room-availability-date-modal__date-field"
                :class="{ 'room-availability-date-modal__date-field--open': isDateRangeOpen }"
              >
                <CommonFormField
                  label="Диапазоны дат"
                  :model-value="dateRangeDisplay"
                  readonly
                  cursor-pointer
                  no-margin
                  :open="isDateRangeOpen"
                  :error="rangeError"
                  @click.stop="toggleDateRangeCalendar(); rangeError = ''"
                >
                  <template v-if="isDateRangeOpen" #append>
                    <div class="room-availability-date-modal__date-panel" @click.stop>
                      <HomeHeroSearchDatePicker
                        v-model:start="rangeStart"
                        v-model:end="rangeEnd"
                        v-model:active-part="activeDatePart"
                      />
                    </div>
                  </template>
                </CommonFormField>
              </div>

              <div class="room-availability-date-modal__status">
                <span class="room-availability-date-modal__status-label">Статус</span>
                <label
                  class="room-availability-date-modal__checkbox"
                  @click.prevent="active = !active"
                >
                  <input
                    type="checkbox"
                    :checked="active"
                    tabindex="-1"
                  >
                  <span class="room-availability-date-modal__checkmark" aria-hidden="true" />
                  <span class="room-availability-date-modal__checkbox-label">Доступно для бронирования?</span>
                </label>
              </div>
            </div>

            <div class="room-availability-date-modal__weekdays">
              <span class="room-availability-date-modal__weekdays-label">Дни недели</span>

              <div class="room-availability-date-modal__weekdays-list">
                <label
                  v-for="weekday in WEEKDAY_OPTIONS"
                  :key="weekday.value"
                  class="room-availability-date-modal__weekday"
                >
                  <input
                    type="checkbox"
                    :checked="isWeekdaySelected(weekday.value)"
                    @change="toggleWeekday(weekday.value, ($event.target as HTMLInputElement).checked)"
                  >
                  <span class="room-availability-date-modal__checkmark" aria-hidden="true" />
                  <span class="room-availability-date-modal__checkbox-label">{{ weekday.label }}</span>
                </label>
              </div>
            </div>

            <div class="room-availability-date-modal__row">
              <CommonFormField
                class="room-availability-date-modal__field"
                label="Стоимость"
                :model-value="price"
                amount-only
                no-margin
                :error="priceError"
                @update:model-value="price = $event; priceError = ''"
              />

              <CommonFormField
                class="room-availability-date-modal__field"
                :label="`Количество комнат (Максимум: ${maxNumber})`"
                :model-value="number"
                digits-only
                no-margin
                :error="numberError"
                @update:model-value="number = $event; numberError = ''"
              />
            </div>
          </form>

          <div class="room-availability-date-modal__footer">
            <CommonSaveButton
              type="button"
              width="auto"
              mobile-width="auto"
              :loading="isSaving"
              @click="save"
            >
              Сохранить изменения
            </CommonSaveButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.room-availability-date-modal {
  position: fixed;
  inset: 0;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  isolation: isolate;
}

.room-availability-date-modal::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: rgba(17, 24, 39, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  pointer-events: none;
}

.room-availability-date-modal__card {
  position: relative;
  width: min(100%, 960px);
  max-height: calc(100vh - 48px);
  padding: 32px 36px 28px;
  overflow: visible;
  border: 1px solid var(--wh-gray-200);
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.room-availability-date-modal__title {
  margin: 0 48px 24px 0;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  color: var(--wh-gray-900);
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.4;
}

.room-availability-date-modal__form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.room-availability-date-modal__row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 20px;
}

.room-availability-date-modal__field {
  min-width: 0;
}

.room-availability-date-modal__date-field {
  position: relative;
  z-index: 1;
}

.room-availability-date-modal__date-field--open {
  z-index: 20;
}

.room-availability-date-modal__date-panel {
  width: 100%;
  min-width: 280px;
  padding: 18px 20px;
  border: 1px solid var(--wh-gray-300);
  border-radius: 10px;
  background: var(--wh-white);
  box-shadow: 0 12px 28px rgb(28 33 28 / 12%);
  box-sizing: border-box;
}

.room-availability-date-modal__status {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.room-availability-date-modal__status-label,
.room-availability-date-modal__weekdays-label {
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.05em;
  color: var(--wh-gray-900);
}

.room-availability-date-modal__checkbox,
.room-availability-date-modal__weekday {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  color: var(--wh-gray-900);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.3;
  cursor: pointer;
}

.room-availability-date-modal__checkbox input,
.room-availability-date-modal__weekday input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.room-availability-date-modal__checkmark {
  position: relative;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border: 1px solid var(--wh-gray-300);
  border-radius: 4px;
  background: var(--wh-white);
}

.room-availability-date-modal__checkbox input:checked + .room-availability-date-modal__checkmark::after,
.room-availability-date-modal__weekday input:checked + .room-availability-date-modal__checkmark::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 16px;
  height: 16px;
  border-radius: 2px;
  background: var(--wh-orange-500);
  transform: translate(-50%, -50%);
}

.room-availability-date-modal__checkbox-label {
  min-width: 0;
}

.room-availability-date-modal__weekdays {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.room-availability-date-modal__weekdays-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
}

.room-availability-date-modal__footer {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  margin-top: 40px;
}

.room-availability-date-modal__footer :deep(.save-button) {
  width: auto;
  min-width: 0;
  white-space: nowrap;
}

.room-availability-date-modal-enter-active,
.room-availability-date-modal-leave-active {
  transition: opacity 0.2s ease;
}

.room-availability-date-modal-enter-from,
.room-availability-date-modal-leave-to {
  opacity: 0;
}

.room-availability-date-modal-enter-from .room-availability-date-modal__card,
.room-availability-date-modal-leave-to .room-availability-date-modal__card {
  transform: translateY(8px);
}

@media (--wh-narrow) {
  .room-availability-date-modal__row {
    grid-template-columns: 1fr;
  }
}
</style>
