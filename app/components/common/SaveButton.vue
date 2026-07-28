<script setup lang="ts">
const props = withDefaults(defineProps<{
  type?: 'button' | 'submit'
  disabled?: boolean
  loading?: boolean
  /** CSS border-radius, например var(--wh-radius-lg) */
  radius?: string
  /** Ширина на desktop / tablet */
  width?: string
  /** Ширина на mobile */
  mobileWidth?: string
}>(), {
  type: 'button',
  disabled: false,
  loading: false,
  radius: 'var(--wh-radius-lg)',
  width: '288px',
  mobileWidth: '346px',
})

const buttonStyle = computed(() => ({
  '--save-button-radius': props.radius,
  '--save-button-width': props.width,
  '--save-button-mobile-width': props.mobileWidth,
}))
</script>

<template>
  <button
    class="save-button"
    :class="{ 'save-button--loading': loading }"
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading"
    :style="buttonStyle"
  >
    <CommonSpinner
      v-if="loading"
      variant="ring"
      :size="22"
      color="var(--wh-white)"
      label="Сохранение"
    />
    <span v-else>
      <slot>Сохранить изменения</slot>
    </span>
  </button>
</template>

<style scoped>
.save-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--save-button-width, 288px);
  min-width: var(--save-button-width, 288px);
  padding: 14px 28px;
  border: none;
  border-radius: var(--save-button-radius, var(--wh-radius-lg));
  background: var(--wh-orange-500);
  color: var(--wh-white);
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
  box-sizing: border-box;
}

.save-button:hover:not(:disabled) {
  background: var(--wh-orange-600);
  transform: translateY(-1px);
}

.save-button:disabled {
  cursor: default;
  opacity: 0.85;
  transform: none;
}

@media (max-width: 640px) {
  .save-button {
    display: flex;
    width: var(--save-button-mobile-width, 346px);
    min-width: var(--save-button-mobile-width, 346px);
  }
}
</style>
