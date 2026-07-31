<script setup lang="ts">
export type SpinnerVariant = 'ring' | 'dots' | 'pulse'
export type SpinnerSize = number | 'sm' | 'md' | 'lg'

const props = withDefaults(defineProps<{
  /** Вид спиннера */
  variant?: SpinnerVariant
  /** Цвет акцента (CSS color / var) */
  color?: string
  /** Размер: число в px или пресет */
  size?: SpinnerSize
  /** Подпись для скринридеров */
  label?: string
}>(), {
  variant: 'ring',
  color: 'var(--wh-green)',
  size: 'md',
  label: 'Загрузка',
})

const SIZE_PRESETS: Record<'sm' | 'md' | 'lg', number> = {
  sm: 20,
  md: 32,
  lg: 48,
}

const sizePx = computed(() => {
  if (typeof props.size === 'number' && Number.isFinite(props.size)) {
    return Math.max(12, props.size)
  }

  return SIZE_PRESETS[props.size] ?? SIZE_PRESETS.md
})

const rootStyle = computed(() => ({
  '--spinner-size': `${sizePx.value}px`,
  '--spinner-color': props.color,
  width: `${sizePx.value}px`,
  height: `${sizePx.value}px`,
}))
</script>

<template>
  <span
    class="spinner"
    :class="`spinner--${variant}`"
    :style="rootStyle"
    role="status"
    :aria-label="label"
  >
    <template v-if="variant === 'ring'">
      <span class="spinner__ring" aria-hidden="true" />
    </template>

    <template v-else-if="variant === 'dots'">
      <span class="spinner__dot" aria-hidden="true" />
      <span class="spinner__dot" aria-hidden="true" />
      <span class="spinner__dot" aria-hidden="true" />
    </template>

    <template v-else>
      <span class="spinner__pulse" aria-hidden="true" />
    </template>
  </span>
</template>

<style scoped>
.spinner {
  --spinner-size: 32px;
  --spinner-color: var(--wh-green);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  vertical-align: middle;
}

.spinner__ring {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  border: calc(var(--spinner-size) * 0.1) solid var(--spinner-color);
  border-right-color: transparent;
  border-bottom-color: transparent;
  border-radius: 50%;
  animation: spinner-rotate 0.75s linear infinite;
}

.spinner--dots {
  gap: calc(var(--spinner-size) * 0.12);
}

.spinner__dot {
  width: calc(var(--spinner-size) * 0.22);
  height: calc(var(--spinner-size) * 0.22);
  border-radius: 50%;
  background: var(--spinner-color);
  animation: spinner-dot 1s ease-in-out infinite;
}

.spinner__dot:nth-child(2) {
  animation-delay: 0.15s;
}

.spinner__dot:nth-child(3) {
  animation-delay: 0.3s;
}

.spinner__pulse {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--spinner-color);
  animation: spinner-pulse 1s ease-in-out infinite;
}

@keyframes spinner-rotate {
  to {
    transform: rotate(360deg);
  }
}

@keyframes spinner-dot {
  0%,
  80%,
  100% {
    opacity: 0.28;
    transform: scale(0.75);
  }

  40% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes spinner-pulse {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(0.72);
  }

  50% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
