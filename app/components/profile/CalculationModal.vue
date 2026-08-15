<script setup lang="ts">
import type { BookingCalculation, BookingCalculationLine } from '~/types/booking'

const MOCK_CALCULATION: BookingCalculation = {
  items: [
    { name: 'Проживание, 1 сутки', totalCost: 4000, myCost: 0 },
    {
      name: 'Организация охоты',
      totalCost: 60000,
      myCost: 30000,
      hasTooltip: true,
      tooltip: 'За человека в сутки',
    },
  ],
  trophies: [
    { name: 'Косуля европейская (1 рог х 1шт)', totalCost: 123, myCost: 62 },
    { name: 'Кабан (мелкий пятак х 1шт)', totalCost: 555, myCost: 278 },
    { name: 'Кабан (мелкий пятак х 1шт)', totalCost: 555, myCost: 278 },
  ],
  additionalServices: [
    { name: 'Питание', totalCost: 500, myCost: 250 },
    { name: 'Питание', totalCost: 500, myCost: 250 },
    { name: 'Питание', totalCost: 500, myCost: 250 },
    { name: 'Разделка (Кабан х 3шт)', totalCost: 3000, myCost: 1500 },
    { name: 'Снегоход', totalCost: 3333, myCost: 0 },
  ],
  prepaid: { name: 'Внесена предоплата', totalCost: 4000, myCost: 2000 },
  remainder: { name: 'Остаток базе', totalCost: 69066, myCost: 30867 },
}

const { isOpen, booking, close } = useCalculationModal()

useBodyScrollLock(isOpen)

const calculation = computed(() => MOCK_CALCULATION)

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
            <table class="calculation-modal__table">
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
                  <td>{{ item.totalCost }}</td>
                  <td>
                    <span>{{ item.myCost }}</span>
                    <button
                      v-if="item.hasTooltip"
                      type="button"
                      class="calculation-modal__alert"
                      :title="item.tooltip"
                      :aria-label="item.tooltip"
                    >
                      !
                    </button>
                  </td>
                </tr>

                <tr class="calculation-modal__section">
                  <td>Трофеи</td>
                  <td></td>
                  <td></td>
                </tr>
                <tr
                  v-for="(item, index) in calculation.trophies"
                  :key="lineKey(item, index)"
                >
                  <td>{{ item.name }}</td>
                  <td>{{ item.totalCost }}</td>
                  <td>{{ item.myCost }}</td>
                </tr>

                <tr class="calculation-modal__section">
                  <td>Доп. услуги</td>
                  <td></td>
                  <td></td>
                </tr>
                <tr
                  v-for="(item, index) in calculation.additionalServices"
                  :key="lineKey(item, index)"
                >
                  <td>{{ item.name }}</td>
                  <td>{{ item.totalCost }}</td>
                  <td>{{ item.myCost }}</td>
                </tr>

                <tr class="calculation-modal__section">
                  <td>Подытог</td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>{{ calculation.prepaid.name }}</td>
                  <td>{{ calculation.prepaid.totalCost }}</td>
                  <td>{{ calculation.prepaid.myCost }}</td>
                </tr>
                <tr class="calculation-modal__owe-row">
                  <td></td>
                  <td></td>
                  <td class="calculation-modal__owe">Я должен</td>
                </tr>
                <tr>
                  <td>{{ calculation.remainder.name }}</td>
                  <td>{{ calculation.remainder.totalCost }}</td>
                  <td>{{ calculation.remainder.myCost }}</td>
                </tr>
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
