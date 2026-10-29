<script setup lang="ts">
import type { BookingCalculatingData, BookingCalculationLine } from '~/types/api'
import { formatHotelPriceLabel } from '~/utils/hotel'

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
let loadRequestId = 0
let refreshRequestId = 0
let refreshAfterLoad = false

useBodyScrollLock(isOpen)

const showMyCosts = computed(() => !calculation.value?.is_baseAdmin)
const columnCount = computed(() => (showMyCosts.value ? 3 : 2))

const BASE_SUMMARY_NAMES = new Set(['Внесена предоплата', 'Остаток базе'])
const HUNTER_PERSONAL_TOTAL_NAME = 'Итог охотникам'
const BASE_SERVICE_PLACE = 'base'

function isAccommodationLine(name: string) {
  return name.toLowerCase().includes('прожив')
}

function isBasePlace(line: BookingCalculationLine) {
  const place = line.place?.trim().toLowerCase()
  return !place || place === BASE_SERVICE_PLACE
}

function extraServiceLines(data: BookingCalculatingData) {
  return [
    ...(data.meals ?? []),
    ...(data.preparation ?? []),
    ...(data.addetionals ?? []),
  ]
}

function sumLineCost(lines: BookingCalculationLine[], field: 'total_cost' | 'my_cost' | 'due_to_me') {
  return lines.reduce((sum, line) => sum + (line[field] ?? 0), 0)
}

const baseAdminBlocks = computed(() => {
  const data = calculation.value
  if (!data) {
    return null
  }

  const items = data.items ?? []
  const summary = data.all_items ?? []
  const extras = extraServiceLines(data)
  const baseExtras = extras.filter(isBasePlace)
  const huntExtras = extras.filter(line => !isBasePlace(line))
  const huntServices = items.filter(item => !isAccommodationLine(item.name))
  const trophies = data.trophy_show ? data.trophies ?? [] : []
  const penalties = data.penalties_show ? data.penalties ?? [] : []
  const huntLines = [...huntServices, ...huntExtras, ...trophies, ...penalties]
  const baseRemainder = summary.filter(item => item.name === 'Остаток базе')
  const spendings = data.spendings ?? []
  const personalTotal = summary.find(item => item.name === HUNTER_PERSONAL_TOTAL_NAME) ?? null
  const huntPaymentMy = sumLineCost(huntLines, 'my_cost')

  return {
    baseServices: items.filter(item => isAccommodationLine(item.name)),
    baseExtras,
    basePrepayment: summary.filter(item => item.name === 'Внесена предоплата'),
    baseRemainder,
    huntServices,
    huntExtras,
    huntSummary: summary.filter(item => !BASE_SUMMARY_NAMES.has(item.name) && item.name !== HUNTER_PERSONAL_TOTAL_NAME),
    huntPayment: sumLineCost(huntLines, 'total_cost'),
    huntPaymentMy,
    personalGrand: (baseRemainder[0]?.my_cost ?? 0) + huntPaymentMy,
    spendings,
    dueToMeTotal: spendings.some(item => item.due_to_me != null) || personalTotal?.due_to_me != null
      ? personalTotal?.due_to_me ?? sumLineCost(spendings, 'due_to_me')
      : null,
    personalTotal,
    total: data.total ?? data.base_total ?? null,
  }
})

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

useBookingServicesChannel(
  computed(() => (isOpen.value ? booking.value?.id ?? null : null)),
  (payload) => {
    const current = booking.value
    const code = current?.code
    if (!code || !bookingMatchesServicesUpdate(current, payload)) {
      return
    }

    void refreshCalculation(code)
  },
  computed(() => (isOpen.value ? booking.value?.code ?? null : null)),
)

function resetCalculation() {
  loadRequestId += 1
  refreshAfterLoad = false
  isLoading.value = false
  loadError.value = ''
  calculation.value = null
}

async function refreshCalculation(code: string) {
  if (isLoading.value) {
    refreshAfterLoad = true
    return
  }

  const requestId = ++refreshRequestId

  try {
    const response = await bookings.calculating(code)

    if (requestId !== refreshRequestId || booking.value?.code !== code) {
      return
    }

    if (!response.success || !response.data) {
      return
    }

    calculation.value = response.data
    loadError.value = ''
  }
  catch {
  }
}

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
      if (refreshAfterLoad && booking.value?.code === code) {
        refreshAfterLoad = false
        void refreshCalculation(code)
      }
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
    return 'Остаток оплаты по базе'
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

            <div v-else-if="calculation && baseAdminBlocks" class="calculation-modal__blocks">
              <div class="calculation-modal__block">
              <table class="calculation-modal__table">
                <thead>
                  <tr class="calculation-modal__section calculation-modal__block-head">
                    <th class="calculation-modal__block-title">Расходы по базе</th>
                    <th>Коллективные расходы</th>
                    <th v-if="showMyCosts">Мои личные расходы</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="calculation-modal__gap" aria-hidden="true">
                    <td :colspan="columnCount"></td>
                  </tr>
                  <tr
                    v-if="baseAdminBlocks.baseServices.length"
                    class="calculation-modal__section"
                  >
                    <td>Услуги проживания на базе</td>
                    <td></td>
                    <td v-if="showMyCosts"></td>
                  </tr>
                  <tr
                    v-for="(item, index) in baseAdminBlocks.baseServices"
                    :key="`base-${lineKey(item, index)}`"
                  >
                    <td>{{ item.name }}</td>
                    <td>{{ formatHotelPriceLabel(item.total_cost) }}</td>
                    <td v-if="showMyCosts">{{ formatHotelPriceLabel(item.my_cost) }}</td>
                  </tr>

                  <template v-if="calculation.additional_services_show && baseAdminBlocks.baseExtras.length">
                    <tr class="calculation-modal__section">
                      <td>Дополнительные услуги базы</td>
                      <td></td>
                      <td v-if="showMyCosts"></td>
                    </tr>
                    <tr
                      v-for="(item, index) in baseAdminBlocks.baseExtras"
                      :key="`base-extra-${lineKey(item, index)}`"
                    >
                      <td>{{ item.name }}</td>
                      <td>{{ formatHotelPriceLabel(item.total_cost) }}</td>
                      <td v-if="showMyCosts">{{ formatHotelPriceLabel(item.my_cost) }}</td>
                    </tr>
                  </template>

                  <template v-if="baseAdminBlocks.basePrepayment.length">
                    <tr class="calculation-modal__section">
                      <td>Предоплата</td>
                      <td></td>
                      <td v-if="showMyCosts"></td>
                    </tr>
                    <tr
                      v-for="(item, index) in baseAdminBlocks.basePrepayment"
                      :key="`base-prepay-${lineKey(item, index)}`"
                    >
                      <td>{{ lineName(item.name) }}</td>
                      <td>{{ formatHotelPriceLabel(item.total_cost) }}</td>
                      <td v-if="showMyCosts">{{ formatHotelPriceLabel(item.my_cost) }}</td>
                    </tr>
                  </template>

                  <tr class="calculation-modal__section">
                    <td>Итого по расходам базы</td>
                    <td></td>
                    <td v-if="showMyCosts"></td>
                  </tr>
                  <tr
                    v-for="(item, index) in baseAdminBlocks.baseRemainder"
                    :key="`base-remainder-${lineKey(item, index)}`"
                  >
                    <td class="calculation-modal__total">{{ lineName(item.name) }}</td>
                    <td class="calculation-modal__regular">{{ formatHotelPriceLabel(item.total_cost) }}</td>
                    <td v-if="showMyCosts" class="calculation-modal__owe">{{ formatHotelPriceLabel(item.my_cost) }}</td>
                  </tr>
                </tbody>
              </table>
              </div>

              <div class="calculation-modal__block">
              <table class="calculation-modal__table">
                <thead>
                  <tr class="calculation-modal__section calculation-modal__block-head">
                    <th class="calculation-modal__block-title">Расходы по охоте</th>
                    <th>Коллективные расходы</th>
                    <th v-if="showMyCosts">Мои личные расходы</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="calculation-modal__gap" aria-hidden="true">
                    <td :colspan="columnCount"></td>
                  </tr>
                  <tr
                    v-if="baseAdminBlocks.huntServices.length"
                    class="calculation-modal__section"
                  >
                    <td>Проведение охоты</td>
                    <td></td>
                    <td v-if="showMyCosts"></td>
                  </tr>
                  <tr
                    v-for="(item, index) in baseAdminBlocks.huntServices"
                    :key="`hunt-${lineKey(item, index)}`"
                  >
                    <td>{{ item.name }}</td>
                    <td>{{ formatHotelPriceLabel(item.total_cost) }}</td>
                    <td v-if="showMyCosts">{{ formatHotelPriceLabel(item.my_cost) }}</td>
                  </tr>

                  <template v-if="calculation.additional_services_show && baseAdminBlocks.huntExtras.length">
                    <tr class="calculation-modal__section">
                      <td>Дополнительные расходы охоты</td>
                      <td></td>
                      <td v-if="showMyCosts"></td>
                    </tr>
                    <tr
                      v-for="(item, index) in baseAdminBlocks.huntExtras"
                      :key="`hunt-extra-${lineKey(item, index)}`"
                    >
                      <td>{{ item.name }}</td>
                      <td>{{ formatHotelPriceLabel(item.total_cost) }}</td>
                      <td v-if="showMyCosts">{{ formatHotelPriceLabel(item.my_cost) }}</td>
                    </tr>
                  </template>

                  <template v-if="calculation.trophy_show">
                    <tr class="calculation-modal__section">
                      <td>Трофеи</td>
                      <td></td>
                      <td v-if="showMyCosts"></td>
                    </tr>
                    <tr
                      v-for="(item, index) in calculation.trophies"
                      :key="`hunt-trophy-${lineKey(item, index)}`"
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
                      :key="`hunt-penalty-${lineKey(item, index)}`"
                    >
                      <td>{{ item.name }}</td>
                      <td>{{ formatHotelPriceLabel(item.total_cost) }}</td>
                      <td v-if="showMyCosts">{{ formatHotelPriceLabel(item.my_cost) }}</td>
                    </tr>
                  </template>

                  <tr
                    v-for="(item, index) in baseAdminBlocks.huntSummary"
                    :key="`hunt-summary-${lineKey(item, index)}`"
                    :class="{ 'calculation-modal__total': isBoldLine(item.name) }"
                  >
                    <td>{{ lineName(item.name) }}</td>
                    <td>{{ formatHotelPriceLabel(item.total_cost) }}</td>
                    <td v-if="showMyCosts">{{ formatHotelPriceLabel(item.my_cost) }}</td>
                  </tr>

                  <tr class="calculation-modal__section">
                    <td>Итого по охоте</td>
                    <td></td>
                    <td v-if="showMyCosts"></td>
                  </tr>
                  <tr>
                    <td class="calculation-modal__total">Итого оплата по охоте</td>
                    <td class="calculation-modal__regular">{{ formatHotelPriceLabel(baseAdminBlocks.huntPayment) }}</td>
                    <td v-if="showMyCosts" class="calculation-modal__owe">{{ formatHotelPriceLabel(baseAdminBlocks.huntPaymentMy) }}</td>
                  </tr>
                </tbody>
              </table>
              </div>

              <div class="calculation-modal__block">
              <table class="calculation-modal__table">
                <thead>
                  <tr class="calculation-modal__section calculation-modal__block-head">
                    <th></th>
                    <th>Коллективные расходы</th>
                    <th v-if="showMyCosts">Мои личные расходы</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="calculation-modal__section calculation-modal__total calculation-modal__plain">
                    <td class="calculation-modal__block-title">Всего базе</td>
                    <td class="calculation-modal__block-title calculation-modal__grand">{{ baseAdminBlocks.total == null ? '' : formatHotelPriceLabel(baseAdminBlocks.total) }}</td>
                    <td v-if="showMyCosts" class="calculation-modal__owe calculation-modal__grand">{{ formatHotelPriceLabel(baseAdminBlocks.personalGrand) }}</td>
                  </tr>
                </tbody>
              </table>
              </div>

              <div v-if="showMyCosts && calculation.spendings_show" class="calculation-modal__block">
              <table class="calculation-modal__table">
                <thead>
                  <tr class="calculation-modal__section calculation-modal__block-head">
                    <th class="calculation-modal__block-title">Личные расходы охотников</th>
                    <th>Коллективные расходы</th>
                    <th>Мои личные расходы</th>
                    <th>Мне должны</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="calculation-modal__gap" aria-hidden="true">
                    <td colspan="4"></td>
                  </tr>
                  <tr class="calculation-modal__section">
                    <td>Дополнительные расходы</td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                  <tr
                    v-for="(item, index) in baseAdminBlocks.spendings"
                    :key="`spending-${lineKey(item, index)}`"
                  >
                    <td>{{ item.name }}</td>
                    <td>{{ formatHotelPriceLabel(item.total_cost) }}</td>
                    <td>{{ formatHotelPriceLabel(item.my_cost) }}</td>
                    <td>{{ item.due_to_me == null ? '' : formatHotelPriceLabel(item.due_to_me) }}</td>
                  </tr>
                  <tr class="calculation-modal__section">
                    <td>Итого между охотниками</td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                  <tr>
                    <td class="calculation-modal__total">Итого</td>
                    <td class="calculation-modal__regular">{{ formatHotelPriceLabel(baseAdminBlocks.personalTotal?.total_cost ?? sumLineCost(baseAdminBlocks.spendings, 'total_cost')) }}</td>
                    <td class="calculation-modal__regular">{{ formatHotelPriceLabel(baseAdminBlocks.personalTotal?.my_cost ?? sumLineCost(baseAdminBlocks.spendings, 'my_cost')) }}</td>
                    <td class="calculation-modal__regular">{{ baseAdminBlocks.dueToMeTotal == null ? '' : formatHotelPriceLabel(baseAdminBlocks.dueToMeTotal) }}</td>
                  </tr>
                </tbody>
              </table>
              </div>
            </div>

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

.calculation-modal__blocks {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px;
  border: 1px solid var(--wh-gray-600);
  border-radius: 8px;
}

.calculation-modal__block {
  border: 1px solid #000;
  border-radius: 8px;
  overflow: hidden;
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

.calculation-modal__section th.calculation-modal__block-title,
.calculation-modal__section td.calculation-modal__block-title {
  color: #000;
  font-size: 0.88rem;
  font-weight: 700;
  text-transform: uppercase;
}

.calculation-modal__gap td {
  height: 12px;
  padding: 0;
  border: none;
  background: var(--wh-white);
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

.calculation-modal__section.calculation-modal__block-head th {
  background: var(--wh-white);
  border: none;
}

.calculation-modal__section.calculation-modal__plain td {
  background: var(--wh-white);
  border-color: var(--wh-gray-200);
}

.calculation-modal__total,
.calculation-modal__total td {
  font-weight: 700;
}

.calculation-modal__regular {
  font-weight: 400;
}

.calculation-modal__table td:nth-child(2),
.calculation-modal__table td:nth-child(3),
.calculation-modal__table td:nth-child(4),
.calculation-modal__table th:nth-child(2),
.calculation-modal__table th:nth-child(3),
.calculation-modal__table th:nth-child(4) {
  width: 22%;
  white-space: nowrap;
}

.calculation-modal__table td:nth-child(2),
.calculation-modal__table td:nth-child(3),
.calculation-modal__table td:nth-child(4) {
  font-size: 0.78rem;
  font-weight: 700;
  text-align: right;
}

.calculation-modal__table td.calculation-modal__owe {
  color: var(--wh-field-error);
  font-size: 0.78rem;
  font-weight: 700;
  text-align: right;
  white-space: nowrap;
}

.calculation-modal__table td.calculation-modal__grand {
  font-size: 1.05rem;
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
