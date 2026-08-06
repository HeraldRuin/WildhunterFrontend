<script setup lang="ts">
const { isOpen, state, close } = useCollectionModal()

useBodyScrollLock(isOpen)

const inviteQueries = ref<string[]>([])

const emptySlotCount = computed(() => {
  if (!state.value) return 0
  return Math.max(0, state.value.slotsTotal - state.value.participants.length)
})

watch(isOpen, (open) => {
  if (!open) {
    inviteQueries.value = []
    return
  }

  inviteQueries.value = Array.from({ length: emptySlotCount.value }, () => '')
})

watch(emptySlotCount, (count) => {
  if (!isOpen.value) return

  const next = inviteQueries.value.slice(0, count)
  while (next.length < count) {
    next.push('')
  }
  inviteQueries.value = next
})

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

function copyCollectionLink() {
  const url = state.value?.collectionUrl
  if (!url || !import.meta.client) return

  const absolute = new URL(url, window.location.origin).toString()
  void navigator.clipboard?.writeText(absolute)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="collection-modal">
      <div
        v-if="isOpen && state"
        class="collection-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="collection-modal-title"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <div class="collection-modal__card">
          <CommonModalCloseButton @click="close" />

          <header class="collection-modal__header">
            <h2 id="collection-modal-title" class="collection-modal__title">
              Открыт сбор для брони #{{ state.bookingNumber }}
            </h2>

            <button
              type="button"
              class="collection-modal__link"
              @click="copyCollectionLink"
            >
              Ссылка на сбор
            </button>
          </header>

          <div class="collection-modal__body">
            <div
              v-for="participant in state.participants"
              :key="participant.id ?? participant.name"
              class="collection-modal__participant"
            >
              <div class="collection-modal__participant-info">
                <div class="collection-modal__participant-name">
                  {{ participant.name }}
                </div>
                <div
                  v-if="participant.email"
                  class="collection-modal__participant-email"
                >
                  {{ participant.email }}
                </div>
              </div>

              <span
                v-if="participant.status === 'confirmed'"
                class="collection-modal__badge"
              >
                Подтвержден
              </span>
            </div>

            <input
              v-for="(_, index) in inviteQueries"
              :key="`invite-${index}`"
              v-model="inviteQueries[index]"
              type="text"
              class="collection-modal__invite-input"
              placeholder="Ник / Фамилия / email / ID"
              autocomplete="off"
            >
          </div>

          <footer class="collection-modal__footer">
            <button type="button" class="collection-modal__btn collection-modal__btn--accent">
              Продлить сбор
            </button>
            <button type="button" class="collection-modal__btn">
              Отменить сбор
            </button>
            <button type="button" class="collection-modal__btn">
              Завершить сбор
            </button>
            <button type="button" class="collection-modal__btn">
              Открытый сбор
            </button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.collection-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  isolation: isolate;
}

.collection-modal::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: rgba(17, 24, 39, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  pointer-events: none;
}

.collection-modal__card {
  position: relative;
  width: min(100%, 720px);
  padding: 28px 28px 24px;
  border: 1px solid var(--wh-gray-200);
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.collection-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-right: 40px;
  margin-bottom: 20px;
}

.collection-modal__title {
  margin: 0;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.35;
  color: var(--wh-gray-900);
}

.collection-modal__link {
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: none;
  color: #4aa3d9;
  font-size: 0.92rem;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.15s ease;
}

.collection-modal__link:hover {
  color: #2f8fc9;
  text-decoration: underline;
}

.collection-modal__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.collection-modal__participant {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 52px;
  padding: 10px 14px;
  border-radius: 8px;
  background: var(--wh-gray-100);
}

.collection-modal__participant-name {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--wh-gray-900);
}

.collection-modal__participant-email {
  margin-top: 2px;
  font-size: 0.78rem;
  color: var(--wh-gray-600);
}

.collection-modal__badge {
  flex-shrink: 0;
  padding: 5px 10px;
  border-radius: 6px;
  background: #7cb342;
  color: var(--wh-white);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
}

.collection-modal__invite-input {
  width: 100%;
  min-height: 48px;
  padding: 12px 14px;
  border: 1px solid var(--wh-field-border);
  border-radius: 8px;
  background: var(--wh-white);
  color: var(--wh-gray-900);
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.collection-modal__invite-input::placeholder {
  color: var(--wh-gray-400);
}

.collection-modal__invite-input:focus {
  border-color: var(--wh-field-border-active);
  box-shadow: 0 0 0 3px var(--wh-field-focus-ring);
}

.collection-modal__footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.collection-modal__btn {
  min-height: 40px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  background: #2a9d8f;
  color: var(--wh-white);
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  transition: background 0.15s ease;
}

.collection-modal__btn:hover {
  background: #238b7e;
}

.collection-modal__btn--accent {
  background: #4db6ac;
}

.collection-modal__btn--accent:hover {
  background: #3aa89d;
}

.collection-modal-enter-active,
.collection-modal-leave-active {
  transition: visibility 0.2s linear;
}

.collection-modal-enter-from,
.collection-modal-leave-to {
  visibility: visible;
}

.collection-modal-enter-from .collection-modal__card,
.collection-modal-leave-to .collection-modal__card {
  opacity: 0;
  transform: translateY(8px);
}

@media (--wh-tablet) {
  .collection-modal__card {
    padding: 22px 18px 18px;
  }

  .collection-modal__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding-right: 36px;
  }

  .collection-modal__footer {
    justify-content: stretch;
  }

  .collection-modal__btn {
    flex: 1 1 calc(50% - 10px);
  }
}

@media (--wh-mobile) {
  .collection-modal__btn {
    flex: 1 1 100%;
  }
}
</style>
