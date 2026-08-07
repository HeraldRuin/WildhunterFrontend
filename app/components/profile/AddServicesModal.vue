<script setup lang="ts">
const { isOpen, booking, close } = useAddServicesModal()

useBodyScrollLock(isOpen)

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
</script>

<template>
  <Teleport to="body">
    <Transition name="add-services-modal">
      <div
        v-if="isOpen && booking"
        class="add-services-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-services-modal-title"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <div class="add-services-modal__card">
          <CommonModalCloseButton @click="close" />

          <h2 id="add-services-modal-title" class="add-services-modal__title">
            Добавить услуги для брони #{{ booking.number }}
          </h2>

          <div class="add-services-modal__body">
            <section class="add-services-modal__block">
              <div class="add-services-modal__block-head">
                <h3 class="add-services-modal__block-title">Трофеи:</h3>
                <button type="button" class="add-services-modal__add" aria-label="Добавить трофей">+</button>
              </div>
              <div class="add-services-modal__columns add-services-modal__columns--3">
                <span>Животное</span>
                <span>Тип</span>
                <span>Количество</span>
              </div>
            </section>

            <section class="add-services-modal__block">
              <div class="add-services-modal__block-head">
                <h3 class="add-services-modal__block-title">Штрафы:</h3>
                <button type="button" class="add-services-modal__add" aria-label="Добавить штраф">+</button>
              </div>
              <div class="add-services-modal__columns add-services-modal__columns--3">
                <span>Животное</span>
                <span>Тип штрафа</span>
                <span>Охотник</span>
              </div>
            </section>

            <h3 class="add-services-modal__group-title">Доп. услуги:</h3>

            <section class="add-services-modal__block">
              <div class="add-services-modal__block-head">
                <h3 class="add-services-modal__block-title">Разделка:</h3>
                <button type="button" class="add-services-modal__add" aria-label="Добавить разделку">+</button>
              </div>
              <div class="add-services-modal__columns add-services-modal__columns--2">
                <span>Животное</span>
                <span>Количество</span>
              </div>
            </section>

            <section class="add-services-modal__block">
              <div class="add-services-modal__block-head">
                <h3 class="add-services-modal__block-title">Питание:</h3>
                <button type="button" class="add-services-modal__add" aria-label="Добавить питание">+</button>
              </div>
              <div class="add-services-modal__columns add-services-modal__columns--2">
                <span>Питание</span>
                <span>Количество чел</span>
              </div>
            </section>

            <section class="add-services-modal__block">
              <div class="add-services-modal__block-head">
                <h3 class="add-services-modal__block-title">Другое:</h3>
                <button type="button" class="add-services-modal__add" aria-label="Добавить другое">+</button>
              </div>
              <div class="add-services-modal__columns add-services-modal__columns--3">
                <span>Название</span>
                <span>Количество</span>
                <span>Охотник</span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.add-services-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  isolation: isolate;
}

.add-services-modal::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: rgba(17, 24, 39, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  pointer-events: none;
}

.add-services-modal__card {
  position: relative;
  width: min(100%, 720px);
  max-height: min(90vh, 860px);
  padding: 28px 28px 24px;
  overflow: auto;
  border: 1px solid var(--wh-gray-200);
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.add-services-modal__title {
  margin: 0 40px 24px 0;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.35;
  color: var(--wh-gray-900);
}

.add-services-modal__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.add-services-modal__group-title {
  margin: 4px 0 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--wh-gray-900);
}

.add-services-modal__block {
  padding: 14px 16px 16px;
  border: 1px solid var(--wh-gray-200);
  border-radius: 8px;
  background: #f8f9fa;
}

.add-services-modal__block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.add-services-modal__block-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--wh-gray-900);
}

.add-services-modal__add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid #4aa3d9;
  border-radius: 6px;
  background: var(--wh-white);
  color: #4aa3d9;
  font-size: 1.15rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.add-services-modal__add:hover {
  background: #4aa3d9;
  color: var(--wh-white);
}

.add-services-modal__columns {
  display: grid;
  gap: 12px;
  color: var(--wh-gray-600);
  font-size: 0.82rem;
  font-weight: 500;
}

.add-services-modal__columns--2 {
  grid-template-columns: 1fr 1fr;
}

.add-services-modal__columns--3 {
  grid-template-columns: 1fr 1fr 1fr;
}

.add-services-modal-enter-active,
.add-services-modal-leave-active {
  transition: visibility 0.2s linear;
}

.add-services-modal-enter-from,
.add-services-modal-leave-to {
  visibility: visible;
}

.add-services-modal-enter-from .add-services-modal__card,
.add-services-modal-leave-to .add-services-modal__card {
  opacity: 0;
  transform: translateY(8px);
}

@media (--wh-tablet) {
  .add-services-modal__card {
    padding: 22px 18px 18px;
  }

  .add-services-modal__columns--2,
  .add-services-modal__columns--3 {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>
