<script setup lang="ts">
export interface SelectFieldOption {
  value: string
  label: string
  /** Closed trigger text; falls back to `label` when omitted. */
  triggerLabel?: string
  /** Shown only in the open list (e.g. price sum), not in the closed trigger. */
  suffix?: string
}

const props = withDefaults(defineProps<{
  label?: string
  placeholder?: string
  options?: SelectFieldOption[]
  disabled?: boolean
  error?: string
  noMargin?: boolean
}>(), {
  label: '',
  placeholder: 'Выберите',
  options: () => [],
  disabled: false,
  error: '',
  noMargin: false,
})

const model = defineModel<string>({ default: '' })

const isOpen = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const hoveredValue = ref<string | null>(null)

const selectedLabel = computed(() => {
  const option = props.options.find(item => item.value === model.value)
  if (!option) {
    return ''
  }

  return option.triggerLabel ?? option.label
})

const triggerLabel = computed(() => selectedLabel.value || props.placeholder)

function toggle() {
  if (props.disabled || !props.options.length) {
    return
  }

  isOpen.value = !isOpen.value

  if (!isOpen.value) {
    hoveredValue.value = null
  }
}

function select(value: string) {
  model.value = value
  isOpen.value = false
  hoveredValue.value = null
}

function handleDocumentClick(event: MouseEvent) {
  if (!rootRef.value?.contains(event.target as Node)) {
    isOpen.value = false
    hoveredValue.value = null
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <div
    ref="rootRef"
    class="select-field"
    :class="{
      'select-field--open': isOpen,
      'select-field--no-margin': noMargin,
      'select-field--error': error,
    }"
  >
    <span v-if="label" class="select-field__label">{{ label }}</span>

    <button
      type="button"
      class="select-field__trigger"
      :class="{ 'select-field__trigger--placeholder': !selectedLabel }"
      :disabled="disabled || !options.length"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      @click.stop="toggle"
    >
      <span class="select-field__value">{{ triggerLabel }}</span>
      <svg class="select-field__chevron" viewBox="0 0 12 8" aria-hidden="true">
        <path
          d="M1 2 6 6.5 11 2"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <ul
      v-if="isOpen && options.length"
      class="select-field__list"
      role="listbox"
      :aria-label="label || placeholder"
      @mouseleave="hoveredValue = null"
    >
      <li v-for="option in options" :key="option.value">
        <button
          type="button"
          class="select-field__option"
          role="option"
          :aria-selected="option.value === model"
          :class="{
            'select-field__option--active': option.value === model,
            'select-field__option--hovered': hoveredValue === option.value,
          }"
          @mouseenter="hoveredValue = option.value"
          @click.stop="select(option.value)"
        >
          <span class="select-field__option-dot" aria-hidden="true" />
          <span class="select-field__option-label">{{ option.label }}</span>
          <span
            v-if="option.suffix"
            class="select-field__option-suffix"
          >{{ option.suffix }}</span>
        </button>
      </li>
    </ul>

    <p v-if="error" class="select-field__error">{{ error }}</p>
  </div>
</template>

<style scoped>
.select-field {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
  min-width: 0;
}

.select-field--no-margin {
  margin-bottom: 0;
}

.select-field--open {
  z-index: 20;
}

.select-field__label {
  font-family: "Inter", sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.05em;
  color: var(--wh-gray-600);
}

.select-field__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1px solid var(--wh-field-border);
  border-radius: 10px;
  background: var(--wh-white);
  color: var(--wh-gray-900);
  font-family: "Inter", sans-serif;
  font-weight: 400;
  font-size: 18px;
  line-height: 130%;
  letter-spacing: -0.05em;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.select-field__trigger--placeholder {
  color: var(--wh-gray-400);
}

.select-field__trigger:focus-visible,
.select-field--open .select-field__trigger {
  border-color: var(--wh-field-border-active);
  box-shadow: 0 0 0 3px var(--wh-field-focus-ring);
  outline: none;
}

.select-field--error .select-field__trigger {
  border-color: var(--wh-field-border-error);
  box-shadow: 0 0 0 3px var(--wh-field-focus-ring-error);
}

.select-field--error.select-field--open .select-field__trigger,
.select-field--error .select-field__trigger:focus-visible {
  border-color: var(--wh-field-border-error-focus);
  box-shadow: 0 0 0 3px var(--wh-field-focus-ring-error-focus);
}

.select-field__trigger:disabled {
  opacity: 0.7;
  cursor: default;
}

.select-field__value {
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
  white-space: normal;
}

.select-field__chevron {
  flex-shrink: 0;
  width: 12px;
  height: 8px;
  color: #1c211c;
  transition: transform 0.2s ease;
}

.select-field--open .select-field__chevron {
  transform: rotate(180deg);
}

.select-field__list {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 50;
  margin: 0;
  padding: 6px 8px;
  list-style: none;
  border: 1px solid var(--wh-gray);
  border-radius: 14px;
  background: var(--wh-white);
  color: var(--wh-black-text);
  max-height: 280px;
  overflow-x: hidden;
  overflow-y: auto;
  box-shadow: var(--wh-shadow);
}

.select-field__option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  border: none;
  border-radius: 10px;
  appearance: none;
  background-color: transparent;
  color: var(--wh-black-text);
  font-family: "Inter", sans-serif;
  font-size: 0.98rem;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.05em;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.select-field__option-dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: transparent;
}

.select-field__option-label {
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
  white-space: normal;
}

.select-field__option-suffix {
  margin-left: auto;
  flex-shrink: 0;
  font-weight: 500;
  white-space: nowrap;
}

.select-field__option:hover,
.select-field__option--hovered,
.select-field__option:focus-visible,
.select-field__option--active {
  background-color: #e8883a;
  color: #ffffff;
}

.select-field__option--active .select-field__option-dot {
  background-color: #ffffff;
}

.select-field__error {
  margin: 0;
  font-family: "Inter", "Manrope", system-ui, sans-serif;
  font-size: 0.875rem;
  line-height: 1.35;
  color: var(--wh-field-error);
}
</style>
