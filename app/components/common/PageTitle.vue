<script setup lang="ts">
withDefaults(defineProps<{
  divider?: boolean
  helpText?: string
}>(), {
  divider: false,
})

const isHelpOpen = ref(false)
const helpWrapRef = ref<HTMLElement | null>(null)

function toggleHelp() {
  isHelpOpen.value = !isHelpOpen.value
}

function closeHelp() {
  isHelpOpen.value = false
}

function onDocumentPointerDown(event: PointerEvent) {
  if (!isHelpOpen.value) {
    return
  }

  const target = event.target
  if (!(target instanceof Node)) {
    return
  }

  if (helpWrapRef.value?.contains(target)) {
    return
  }

  closeHelp()
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeHelp()
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
  document.addEventListener('keydown', onDocumentKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  document.removeEventListener('keydown', onDocumentKeydown)
})
</script>

<template>
  <div
    class="page-title"
    :class="{ 'page-title--divider': divider }"
  >
    <h1 class="page-title__text">
      <slot />
    </h1>

    <div
      ref="helpWrapRef"
      class="page-title__help"
    >
      <button
        type="button"
        class="page-title__help-btn"
        aria-label="Справка"
        :aria-expanded="isHelpOpen"
        aria-haspopup="dialog"
        @click="toggleHelp"
      >
        <span class="page-title__help-icon" aria-hidden="true">?</span>
      </button>

      <div
        v-if="isHelpOpen"
        class="page-title__help-popup"
        role="dialog"
        aria-label="Справка"
      >
        <p
          v-if="helpText"
          class="page-title__help-text"
        >
          {{ helpText }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-title {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 0 0 24px;
}

.page-title--divider {
  width: 100%;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
}

.page-title__text {
  margin: 0;
  font-family: "UNCAGE", sans-serif;
  font-weight: 400;
  font-size: 32px;
  line-height: 130%;
  letter-spacing: -0.03em;
  text-transform: uppercase;
  color: var(--wh-gray-900);
}

.page-title__help {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  margin-top: 10px;
}

.page-title__help-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: 1.5px solid currentColor;
  border-radius: 50%;
  background: transparent;
  color: var(--wh-gray-400);
  cursor: pointer;
  box-sizing: border-box;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.page-title__help-btn:hover,
.page-title__help-btn[aria-expanded='true'] {
  color: var(--wh-gray-900);
}

.page-title__help-icon {
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.page-title__help-popup {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 20;
  width: 280px;
  min-height: 72px;
  padding: 12px;
  border: 1px solid var(--wh-gray-200, #ddd);
  border-radius: 8px;
  background: var(--wh-white, #fff);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
}

.page-title__help-text {
  margin: 0;
  color: var(--wh-gray-900, #1c211c);
  font-size: 14px;
  font-weight: 400;
  line-height: 1.4;
}

@media (--wh-tablet) {
  .page-title__text {
    font-size: 28px;
  }
}

@media (--wh-mobile) {
  .page-title__text {
    font-size: 24px;
  }
}
</style>
