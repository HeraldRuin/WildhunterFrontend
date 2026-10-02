<script setup lang="ts">
import type { BookingCalculatingData, BookingCalculationLine } from '~/types/api'
import { formatHotelPriceLabel } from '~/utils/hotel'

const TOOLTIP_TEXT = 'на человека'
const CALCULATION_NOTIFICATION_GROUP = 'calculation'
/** Ожидаемые состояния калькуляции — достаточно текста в модалке, без toast */
const SILENT_CALCULATION_ERROR_CODES = new Set([
  'no_paid_participants',
  'no_hunters',
])

const { isOpen, booking, close } = useCalculationModal()
const { bookings } = useApi()
const notifications = useNotifications()
const notifyOptions = { group: CALCULATION_NOTIFICATION_GROUP }

function shouldNotifyCalculationError(errorCode?: string) {
  return !errorCode || !SILENT_CALCULATION_ERROR_CODES.has(errorCode)
}

const isLoading = ref(false)
const loadError = ref('')
const calculation = ref<BookingCalculatingData | null>(null)
const openTooltipKey = ref<string | null>(null)
let loadRequestId = 0

useBodyScrollLock(isOpen)

const additionalServices = computed(() => [
  ...(calculation.value?.meals ?? []),
  ...(calculation.value?.preparation ?? []),
  ...(calculation.value?.addetionals ?? []),
])

const showMyCosts = computed(() => !calculation.value?.is_baseAdmin)

watch(
  () => booking.value?.code,
  (code) => {
    if (!code) {
      resetCalculation()
      return
    }

    void loadCalculation(code)
  },
)

function resetCalculation() {
  loadRequestId += 1
  isLoading.value = false
  loadError.value = ''
  calculation.value = null
  openTooltipKey.value = null
}

function toggleTooltip(key: string) {
  openTooltipKey.value = openTooltipKey.value === key ? null : key
}

function onDocumentClick(event: MouseEvent) {
  const target = event.target
  if (target instanceof Element && target.closest('.calculation-modal__alert-wrap')) {
    return
  }

  openTooltipKey.value = null
}

watch(openTooltipKey, (key) => {
  if (key) {
    document.addEventListener('click', onDocumentClick)
    return
  }

  document.removeEventListener('click', onDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
})

async function loadCalculation(code: string) {
  const requestId = ++loadRequestId
  isLoading.value = true
  loadError.value = ''
  calculation.value = null

  try {
    const response = await bookings.calculating(code)

    if (requestId !== loadRequestId) {
      return
    }

    if (!response.success || !response.data) {
      loadError.value = response.message || 'Не удалось загрузить калькуляцию'
      const errorCode = (response as { error_code?: string }).error_code
      if (shouldNotifyCalculationError(errorCode)) {
        notifications.error(loadError.value, notifyOptions)
      }
      return
    }

    calculation.value = response.data
    loadError.value = ''
  }
  catch (error) {
    if (requestId !== loadRequestId) {
      return
    }

    const data = (error as { data?: { message?: string, error_code?: string } }).data
    loadError.value = data?.message || 'Не удалось загрузить калькуляцию'
    if (shouldNotifyCalculationError(data?.error_code)) {
      notifications.error(loadError.value, notifyOptions)
    }
  }
  finally {
    if (requestId === loadRequestId) {
      isLoading.value = false
    }
  }
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

function lineKey(line: BookingCalculationLine, index: number) {
  return `${line.name}-${index}`
}

const BOLD_LINE_NAMES = new Set(['Остаток базе', 'Итог охотникам'])

function lineName(name: string) {
  if (name === 'Остаток базе') {
    return 'Остаток оплаты на базу'
  }

  if (name === 'Итог охотникам') {
    return 'Итого по личным расходам охотникам'
  }

  return name
}

function isBoldLine(name: string) {
  return BOLD_LINE_NAMES.has(name)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="calculation-modal">
      <div
        v-if="isOpen && booking"
        class="calculation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calculation-modal-title"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <div class="calculation-modal__card">
          <CommonModalCloseButton @click="close" />

          <h2 id="calculation-modal-title" class="calculation-modal__title">
            Предварительная калькуляция по мероприятию
          </h2>

          <div class="calculation-modal__body">
            <div v-if="isLoading" class="calculation-modal__loading">
              <CommonSpinner size="md" label="Загрузка калькуляции" />
            </div>

            <div v-else-if="loadError" class="calculation-modal__empty">
              {{ loadError }}
            </div>

            <table v-else-if="calculation" class="calculation-modal__table">
              <thead>
                <tr class="calculation-modal__section">
                  <th>Услуги</th>
                  <th>Общие расходы</th>
                  <th v-if="showMyCosts">Мои личные расходы</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, index) in calculation.items"
                  :key="lineKey(item, index)"
                >
                  <td>{{ item.name }}</td>
                  <td>{{ formatHotelPriceLabel(item.total_cost) }}</td>
                  <td v-if="showMyCosts">
                    <span>{{ formatHotelPriceLabel(item.my_cost) }}</span>
                    <span v-if="item.has_tooltip" class="calculation-modal__alert-wrap">
                      <button
                        type="button"
                        class="calculation-modal__alert"
                        :aria-expanded="openTooltipKey === lineKey(item, index)"
                        :aria-label="TOOLTIP_TEXT"
                        @click.stop="toggleTooltip(lineKey(item, index))"
                      >
                        !
                      </button>
                      <span
                        v-if="openTooltipKey === lineKey(item, index)"
                        class="calculation-modal__alert-popup"
                        role="tooltip"
                      >
                        {{ TOOLTIP_TEXT }}
                      </span>
                    </span>
                  </td>
                </tr>

                <template v-if="calculation.trophy_show">
                  <tr class="calculation-modal__section">
                    <td>Трофеи</td>
                    <td></td>
                    <td v-if="showMyCosts"></td>
                  </tr>
                  <tr
                    v-for="(item, index) in calculation.trophies"
                    :key="`trophy-${lineKey(item, index)}`"
                  >
                    <td>{{ item.name }}</td>
                    <td>{{ formatHotelPriceLabel(item.total_cost) }}</td>
                    <td v-if="showMyCosts">{{ formatHotelPriceLabel(item.my_cost) }}</td>
                  </tr>
                </template>

                <template v-if="calculation.penalties_show">
                  <tr class="calculation-modal__section">
                    <td>Штрафы</td>
                    <td></td>
                    <td v-if="showMyCosts"></td>
                  </tr>
                  <tr
                    v-for="(item, index) in calculation.penalties"
                    :key="`penalty-${lineKey(item, index)}`"
                  >
                    <td>{{ item.name }}</td>
                    <td>{{ formatHotelPriceLabel(item.total_cost) }}</td>
                    <td v-if="showMyCosts">{{ formatHotelPriceLabel(item.my_cost) }}</td>
                  </tr>
                </template>

                <template v-if="calculation.additional_services_show">
                  <tr class="calculation-modal__section">
                    <td>Доп. услуги</td>
                    <td></td>
                    <td v-if="showMyCosts"></td>
                  </tr>
                  <tr
                    v-for="(item, index) in additionalServices"
                    :key="`extra-${lineKey(item, index)}`"
                  >
                    <td>{{ item.name }}</td>
                    <td>{{ formatHotelPriceLabel(item.total_cost) }}</td>
                    <td v-if="showMyCosts">{{ formatHotelPriceLabel(item.my_cost) }}</td>
                  </tr>
                </template>

                <template v-if="showMyCosts && calculation.spendings_show">
                  <tr class="calculation-modal__section">
                    <td>Личные расходы охотников на мероприятии</td>
                    <td></td>
                    <td class="calculation-modal__owe">Я должен</td>
                  </tr>
                  <tr
                    v-for="(item, index) in calculation.spendings"
                    :key="`spending-${lineKey(item, index)}`"
                  >
                    <td>{{ item.name }}</td>
                    <td>{{ formatHotelPriceLabel(item.total_cost) }}</td>
                    <td>{{ formatHotelPriceLabel(item.my_cost) }}</td>
                  </tr>
                </template>

                <tr class="calculation-modal__section">
                  <td>Подытог</td>
                  <td></td>
                  <td v-if="showMyCosts"></td>
                </tr>
                <template
                  v-for="(item, index) in calculation.all_items"
                  :key="`total-${lineKey(item, index)}`"
                >
                  <tr v-if="showMyCosts && index === 1" class="calculation-modal__section">
                    <td></td>
                    <td></td>
                    <td class="calculation-modal__owe">Я должен</td>
                  </tr>
                  <tr :class="{ 'calculation-modal__total': isBoldLine(item.name) }">
                    <td>{{ lineName(item.name) }}</td>
                    <td>{{ formatHotelPriceLabel(item.total_cost) }}</td>
                    <td v-if="showMyCosts">{{ formatHotelPriceLabel(item.my_cost) }}</td>
                  </tr>
                  <tr v-if="item.name === 'Внесена предоплата'" class="calculation-modal__section">
                    <td></td>
                    <td></td>
                    <td v-if="showMyCosts"></td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.calculation-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  isolation: isolate;
}

.calculation-modal::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: rgba(17, 24, 39, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  pointer-events: none;
}

.calculation-modal__card {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(100%, 1200px);
  max-height: min(90vh, 860px);
  padding: 28px 28px 24px;
  overflow: hidden;
  border: 1px solid var(--wh-gray-200);
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.calculation-modal__title {
  margin: 0 40px 16px 0;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.35;
  color: var(--wh-gray-900);
}

.calculation-modal__body {
  min-height: 0;
  overflow: auto;
}

.calculation-modal__loading {
  display: flex;
  justify-content: center;
  padding: 48px 16px;
}

.calculation-modal__empty {
  padding: 32px 16px;
  color: var(--wh-gray-600);
  text-align: center;
}

.calculation-modal__table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 0.88rem;
  line-height: 1.4;
  color: var(--wh-gray-900);
}

.calculation-modal__table th,
.calculation-modal__table td {
  padding: 8px 10px;
  border: 1px solid var(--wh-gray-200);
  text-align: left;
  vertical-align: middle;
  font-weight: 400;
}

.calculation-modal__table th {
  font-weight: 700;
}

.calculation-modal__section th,
.calculation-modal__section td {
  background: var(--wh-gray-450);
  border-top-color: var(--wh-gray-450);
  border-bottom-color: var(--wh-gray-450);
  color: var(--wh-orange-500);
  font-weight: 700;
}

.calculation-modal__section th:not(:first-child),
.calculation-modal__section td:not(:first-child) {
  border-left-color: #bcbcbc;
}

.calculation-modal__section th:not(:last-child),
.calculation-modal__section td:not(:last-child) {
  border-right-color: #bcbcbc;
}

.calculation-modal__total td {
  font-weight: 700;
}

.calculation-modal__table td:nth-child(2),
.calculation-modal__table td:nth-child(3),
.calculation-modal__table th:nth-child(2),
.calculation-modal__table th:nth-child(3) {
  width: 28%;
  white-space: nowrap;
}

.calculation-modal__alert-wrap {
  position: relative;
  display: inline-flex;
  margin-left: 4px;
}

.calculation-modal__alert {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: none;
  color: var(--wh-field-error);
  font: inherit;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
}

.calculation-modal__alert-popup {
  position: absolute;
  top: 50%;
  left: calc(100% + 6px);
  z-index: 2;
  transform: translateY(-50%);
  padding: 8px 10px;
  border: 1px solid var(--wh-gray-200);
  border-radius: 8px;
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
  color: var(--wh-gray-900);
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
}

.calculation-modal__table td.calculation-modal__owe {
  color: var(--wh-field-error);
  font-size: 0.78rem;
  font-weight: 700;
  text-align: right;
  white-space: nowrap;
}

.calculation-modal-enter-active,
.calculation-modal-leave-active {
  transition: visibility 0.2s linear;
}

.calculation-modal-enter-from,
.calculation-modal-leave-to {
  visibility: visible;
}

.calculation-modal-enter-from .calculation-modal__card,
.calculation-modal-leave-to .calculation-modal__card {
  opacity: 0;
  transform: translateY(8px);
}

@media (--wh-mobile) {
  .calculation-modal {
    padding: 12px;
  }

  .calculation-modal__card {
    padding: 22px 16px 16px;
  }

  .calculation-modal__table {
    font-size: 0.8rem;
  }

  .calculation-modal__table th,
  .calculation-modal__table td {
    padding: 6px 8px;
  }
}
</style>
