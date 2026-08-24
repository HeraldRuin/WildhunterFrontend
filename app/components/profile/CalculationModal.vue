<script setup lang="ts">
import type { BookingCalculatingData, BookingCalculationLine } from '~/types/api'

const TOOLTIP_TEXT = 'За человека в сутки'
const CALCULATION_NOTIFICATION_GROUP = 'calculation'

const { isOpen, booking, close } = useCalculationModal()
const { bookings } = useApi()
const notifications = useNotifications()
const notifyOptions = { group: CALCULATION_NOTIFICATION_GROUP }

const isLoading = ref(false)
const loadError = ref('')
const calculation = ref<BookingCalculatingData | null>(null)
let loadRequestId = 0

useBodyScrollLock(isOpen)

const additionalServices = computed(() => [
  ...(calculation.value?.meals ?? []),
  ...(calculation.value?.preparation ?? []),
  ...(calculation.value?.addetionals ?? []),
])

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
      notifications.error(loadError.value, notifyOptions)
      return
    }

    calculation.value = response.data
    loadError.value = ''
  }
  catch (error) {
    if (requestId !== loadRequestId) {
      return
    }

    const data = (error as { data?: { message?: string } }).data
    loadError.value = data?.message || 'Не удалось загрузить калькуляцию'
    notifications.error(loadError.value, notifyOptions)
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
            Калькуляция
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
                  <th>Всего расходы</th>
                  <th>Мои расходы</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, index) in calculation.items"
                  :key="lineKey(item, index)"
                >
                  <td>{{ item.name }}</td>
                  <td>{{ item.total_cost }}</td>
                  <td>
                    <span>{{ item.my_cost }}</span>
                    <button
                      v-if="item.has_tooltip"
                      type="button"
                      class="calculation-modal__alert"
                      :title="TOOLTIP_TEXT"
                      :aria-label="TOOLTIP_TEXT"
                    >
                      !
                    </button>
                  </td>
                </tr>

                <template v-if="calculation.trophy_show">
                  <tr class="calculation-modal__section">
                    <td>Трофеи</td>
                    <td></td>
                    <td></td>
                  </tr>
                  <tr
                    v-for="(item, index) in calculation.trophies"
                    :key="`trophy-${lineKey(item, index)}`"
                  >
                    <td>{{ item.name }}</td>
                    <td>{{ item.total_cost }}</td>
                    <td>{{ item.my_cost }}</td>
                  </tr>
                </template>

                <template v-if="calculation.penalties_show">
                  <tr class="calculation-modal__section">
                    <td>Штрафы</td>
                    <td></td>
                    <td></td>
                  </tr>
                  <tr
                    v-for="(item, index) in calculation.penalties"
                    :key="`penalty-${lineKey(item, index)}`"
                  >
                    <td>{{ item.name }}</td>
                    <td>{{ item.total_cost }}</td>
                    <td>{{ item.my_cost }}</td>
                  </tr>
                </template>

                <template v-if="calculation.additional_services_show">
                  <tr class="calculation-modal__section">
                    <td>Доп. услуги</td>
                    <td></td>
                    <td></td>
                  </tr>
                  <tr
                    v-for="(item, index) in additionalServices"
                    :key="`extra-${lineKey(item, index)}`"
                  >
                    <td>{{ item.name }}</td>
                    <td>{{ item.total_cost }}</td>
                    <td>{{ item.my_cost }}</td>
                  </tr>
                </template>

                <template v-if="!calculation.is_baseAdmin && calculation.spendings_show">
                  <tr class="calculation-modal__section">
                    <td>Расходы охотников</td>
                    <td></td>
                    <td class="calculation-modal__owe">Я должен</td>
                  </tr>
                  <tr
                    v-for="(item, index) in calculation.spendings"
                    :key="`spending-${lineKey(item, index)}`"
                  >
                    <td>{{ item.name }}</td>
                    <td>{{ item.total_cost }}</td>
                    <td>{{ item.my_cost }}</td>
                  </tr>
                </template>

                <tr class="calculation-modal__section">
                  <td>Подытог</td>
                  <td></td>
                  <td></td>
                </tr>
                <template
                  v-for="(item, index) in calculation.all_items"
                  :key="`total-${lineKey(item, index)}`"
                >
                  <tr v-if="index === 1" class="calculation-modal__owe-row">
                    <td></td>
                    <td></td>
                    <td class="calculation-modal__owe">Я должен</td>
                  </tr>
                  <tr>
                    <td>{{ item.name }}</td>
                    <td>{{ item.total_cost }}</td>
                    <td>{{ item.my_cost }}</td>
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
  background: var(--wh-gray-100);
  font-weight: 700;
}

.calculation-modal__table td:nth-child(2),
.calculation-modal__table td:nth-child(3),
.calculation-modal__table th:nth-child(2),
.calculation-modal__table th:nth-child(3) {
  width: 28%;
  white-space: nowrap;
}

.calculation-modal__alert {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
  padding: 0;
  border: none;
  background: none;
  color: var(--wh-field-error);
  font: inherit;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
}

.calculation-modal__owe-row td {
  padding-top: 4px;
  padding-bottom: 4px;
}

.calculation-modal__owe {
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
