<script setup lang="ts">
import type { InputHTMLAttributes } from 'vue'

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()

const props = withDefaults(defineProps<{
  /** Пустой label — только placeholder (модалки и т.п.) */
  label?: string
  placeholder?: string
  modelValue?: string
  type?: string
  error?: string
  /** URL иконки слева внутри инпута */
  icon?: string
  id?: string
  disabled?: boolean
  readonly?: boolean
  rows?: number
  /** textarea вместо input */
  multiline?: boolean
  /** стиль маски пароля (letter-spacing) */
  masked?: boolean
  /** состояние «открыт» (календарь и т.п.) */
  open?: boolean
  cursorPointer?: boolean
  /** плавное появление значения (профиль) */
  reveal?: boolean
  /** убрать нижний отступ (когда gap задаёт родитель) */
  noMargin?: boolean
  /** разрешить только цифры */
  digitsOnly?: boolean
  /** скелетон вместо лейбла и инпута */
  skeleton?: boolean
  /** Широкий trailing (сгенерировать + глаз) */
  trailingWide?: boolean
  /** Не привязывать :value — браузер сам управляет autofill (пароли) */
  allowAutofill?: boolean
}>(), {
  label: '',
  placeholder: '',
  modelValue: '',
  type: 'text',
  error: '',
  icon: '',
  id: undefined,
  disabled: false,
  readonly: false,
  rows: 4,
  multiline: false,
  masked: false,
  open: false,
  cursorPointer: false,
  reveal: false,
  noMargin: false,
  digitsOnly: false,
  skeleton: false,
  trailingWide: false,
  allowAutofill: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  click: [event: MouseEvent]
  keydown: [event: KeyboardEvent]
  paste: [event: ClipboardEvent]
}>()

const slots = useSlots()
const generatedId = useId()
const fieldId = computed(() => props.id || generatedId)

const hasIcon = computed(() => Boolean(props.icon) || Boolean(slots.icon))
const hasTrailing = computed(() => Boolean(slots.trailing))

const inputAttrs = computed(() => ({
  ...attrs,
  inputmode: props.digitsOnly
    ? 'numeric'
    : attrs.inputmode as InputHTMLAttributes['inputmode'],
}) as InputHTMLAttributes)

/** Пустое / пробельное значение → '', чтобы браузер показал placeholder */
const displayValue = computed(() => {
  const value = props.modelValue ?? ''
  return value.trim() === '' ? '' : value
})

/** allowAutofill: без :value только пока модель пуста — иначе type toggle сбрасывает поле */
const bindValueFromModel = computed(() => {
  if (!props.allowAutofill) {
    return true
  }

  return displayValue.value !== ''
})

function toDigits(value: string) {
  return value.replace(/\D/g, '')
}

function onInput(event: Event) {
  if (syncingFromModel) {
    return
  }

  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  const nextValue = props.digitsOnly ? toDigits(target.value) : target.value

  if (props.digitsOnly && target.value !== nextValue) {
    target.value = nextValue
  }

  emit('update:modelValue', nextValue)
}

const inputRef = ref<HTMLInputElement | null>(null)
let syncingFromModel = false

function applyModelValueToInput(value = props.modelValue ?? '') {
  if (!props.allowAutofill || !inputRef.value) {
    return
  }

  const nextValue = value.trim() === '' ? '' : value

  if (inputRef.value.value === nextValue) {
    return
  }

  syncingFromModel = true
  inputRef.value.value = nextValue
  syncingFromModel = false
}

watch(
  () => props.modelValue,
  value => applyModelValueToInput(value ?? ''),
  { flush: 'post' },
)

watch(
  () => props.type,
  () => {
    if (!props.allowAutofill) {
      return
    }

    nextTick(() => {
      if (bindValueFromModel.value) {
        applyModelValueToInput()
        return
      }

      syncDomValue()
    })
  },
)

function normalizeDomValue(value: string) {
  return props.digitsOnly ? toDigits(value) : value
}

function syncDomValue(source?: Event | HTMLInputElement) {
  if (props.disabled || props.readonly || props.multiline) {
    return
  }

  const target = source instanceof HTMLInputElement
    ? source
    : (source?.target as HTMLInputElement | undefined) ?? inputRef.value

  if (!target) {
    return
  }

  const domValue = target.value
  const modelValue = props.modelValue ?? ''

  if (domValue === modelValue) {
    return
  }

  // Браузерное autofill: в DOM есть значение, в Vue — нет.
  if (!modelValue && domValue) {
    emit('update:modelValue', normalizeDomValue(domValue))
    return
  }

  // Controlled input перезаписал DOM — восстанавливаем из модели.
  if (modelValue && !domValue) {
    target.value = modelValue
    return
  }

  if (domValue) {
    emit('update:modelValue', normalizeDomValue(domValue))
  }
}

function scheduleAutofillSync(source?: Event | HTMLInputElement) {
  syncDomValue(source)
  requestAnimationFrame(() => syncDomValue(source))
  window.setTimeout(() => syncDomValue(source), 100)
}

function onFocus(event: FocusEvent) {
  emit('focus', event)
  scheduleAutofillSync(event)
}

function onChange(event: Event) {
  syncDomValue(event)
}

function onAnimationStart(event: AnimationEvent) {
  if (event.animationName === 'onAutoFillStart') {
    syncDomValue(event)
  }
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') {
    scheduleAutofillSync()
  }
}

onMounted(() => {
  if (props.multiline) {
    return
  }

  applyModelValueToInput()

  if (props.allowAutofill) {
    return
  }

  scheduleAutofillSync()
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onUnmounted(() => {
  if (props.allowAutofill || props.multiline) {
    return
  }

  document.removeEventListener('visibilitychange', onVisibilityChange)
})

defineExpose({
  syncFromDom: () => syncDomValue(),
  applyToDom: () => applyModelValueToInput(),
})

function onKeydown(event: KeyboardEvent) {
  emit('keydown', event)

  if (!props.digitsOnly || event.defaultPrevented || props.multiline) {
    return
  }

  if (event.ctrlKey || event.metaKey || event.altKey) {
    return
  }

  const allowedKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'Escape',
    'Enter',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ]

  if (allowedKeys.includes(event.key) || /^\d$/.test(event.key)) {
    return
  }

  event.preventDefault()
}

function onPaste(event: ClipboardEvent) {
  emit('paste', event)

  if (!props.digitsOnly || event.defaultPrevented || props.multiline) {
    return
  }

  event.preventDefault()

  const target = event.target as HTMLInputElement
  const pasted = toDigits(event.clipboardData?.getData('text') ?? '')
  const start = target.selectionStart ?? target.value.length
  const end = target.selectionEnd ?? target.value.length
  const nextValue = toDigits(
    `${target.value.slice(0, start)}${pasted}${target.value.slice(end)}`,
  )

  target.value = nextValue
  emit('update:modelValue', nextValue)
}
</script>

<template>
  <div
    class="form-field"
    :class="{ 'form-field--no-margin': noMargin }"
    :aria-busy="skeleton || undefined"
    :aria-label="skeleton ? label : undefined"
  >
    <template v-if="skeleton">
      <div class="form-field__skeleton form-field__skeleton--label" />
      <div class="form-field__skeleton form-field__skeleton--input" />
    </template>

    <template v-else>
      <label v-if="label" class="form-field__label" :for="fieldId">{{ label }}</label>

      <div class="form-field__control">
        <span v-if="hasIcon" class="form-field__icon" aria-hidden="true">
          <slot name="icon">
            <img v-if="icon" :src="icon" alt="">
          </slot>
        </span>

        <textarea
          v-if="multiline"
          :id="fieldId"
          class="form-field__input form-field__input--textarea"
          :class="{
            'form-field__input--error': error,
            'form-field__input--with-icon': hasIcon,
            'form-field__input--with-trailing': hasTrailing,
            'form-field__input--with-trailing-wide': trailingWide,
            'form-field__input--reveal': reveal,
          }"
          :value="displayValue"
          :placeholder="placeholder"
          :disabled="disabled"
          :readonly="readonly"
          :rows="rows"
          :aria-label="label || placeholder || undefined"
          v-bind="attrs"
          @input="onInput"
          @focus="emit('focus', $event)"
          @blur="emit('blur', $event)"
          @keydown="onKeydown"
          @paste="onPaste"
        />
        <input
          v-else
          :id="fieldId"
          class="form-field__input"
          :class="{
            'form-field__input--error': error,
            'form-field__input--with-icon': hasIcon,
            'form-field__input--with-trailing': hasTrailing,
            'form-field__input--with-trailing-wide': trailingWide,
            'form-field__input--masked': masked,
            'form-field__input--open': open,
            'form-field__input--pointer': cursorPointer,
            'form-field__input--reveal': reveal,
          }"
          :type="type"
          :value="bindValueFromModel ? displayValue : undefined"
          :placeholder="placeholder"
          :disabled="disabled"
          :readonly="readonly"
          :aria-label="label || placeholder || undefined"
          v-bind="inputAttrs"
          ref="inputRef"
          @input="onInput"
          @change="onChange"
          @focus="onFocus"
          @blur="emit('blur', $event)"
          @click="emit('click', $event)"
          @keydown="onKeydown"
          @paste="onPaste"
          @animationstart="onAnimationStart"
        >

        <div v-if="hasTrailing" class="form-field__trailing">
          <slot name="trailing" />
        </div>

        <div v-if="$slots.append" class="form-field__append">
          <slot name="append" />
        </div>
      </div>

      <p v-if="error" class="form-field__error">{{ error }}</p>
    </template>
  </div>
</template>

<style scoped>
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
  min-width: 0;
}

.form-field--no-margin {
  margin-bottom: 0;
}

.form-field__skeleton {
  border-radius: 8px;
  background: linear-gradient(90deg, #d9d9d9 0%, #ececec 45%, #d9d9d9 100%);
  background-size: 200% 100%;
  animation: form-field-skeleton-shine 1.4s ease-in-out infinite;
}

.form-field__skeleton--label {
  width: 180px;
  height: 22px;
}

.form-field__skeleton--input {
  width: 100%;
  height: 49px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 10px;
  box-sizing: border-box;
  background-color: #e0e0e0;
}

@keyframes form-field-skeleton-shine {
  0% {
    background-position: 100% 0;
  }

  100% {
    background-position: -100% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .form-field__skeleton {
    animation: none;
  }
}

.form-field__label {
  font-family: "Inter", sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.05em;
  color: var(--wh-gray-900);
}

.form-field__control {
  position: relative;
  width: 100%;
  z-index: 0;
}

.form-field__icon {
  position: absolute;
  top: 50%;
  left: 14px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  transform: translateY(-50%);
  pointer-events: none;
}

.form-field__icon img,
.form-field__icon :deep(img),
.form-field__icon :deep(svg) {
  display: block;
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.form-field__trailing {
  position: absolute;
  top: 50%;
  right: 12px;
  z-index: 1;
  display: flex;
  align-items: center;
  transform: translateY(-50%);
}

.form-field__input {
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
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.form-field__input--with-icon {
  padding-left: 44px;
}

.form-field__input--with-trailing {
  padding-right: 44px;
}

.form-field__input--with-trailing-wide {
  padding-right: 168px;
}

.form-field__input--textarea {
  resize: none;
  min-height: 132px;
}

.form-field__input--pointer {
  cursor: pointer;
}

.form-field__input--masked {
  font-size: 16px;
  line-height: 24px;
  letter-spacing: 0.22em;
}

.form-field__input::placeholder {
  font-family: "Inter", sans-serif;
  font-weight: 400;
  font-size: 18px;
  line-height: 130%;
  letter-spacing: -0.05em;
  color: var(--wh-gray-400);
}

.form-field__input--masked::placeholder {
  letter-spacing: normal;
}

.form-field__input:focus,
.form-field__input--open {
  border-color: var(--wh-field-border-active);
  box-shadow: 0 0 0 3px var(--wh-field-focus-ring);
}

.form-field__input--open {
  box-shadow: 0 0 0 2px var(--wh-field-focus-ring);
}

.form-field__input--error {
  border-color: var(--wh-field-border-error);
  box-shadow: 0 0 0 3px var(--wh-field-focus-ring-error);
}

.form-field__input--error:focus {
  border-color: var(--wh-field-border-error-focus);
  box-shadow: 0 0 0 3px var(--wh-field-focus-ring-error-focus);
}

@keyframes onAutoFillStart {
  from {}

  to {}
}

.form-field__input:-webkit-autofill,
.form-field__input:-webkit-autofill:hover,
.form-field__input:-webkit-autofill:focus {
  -webkit-text-fill-color: var(--wh-gray-900);
  box-shadow: 0 0 0 1000px var(--wh-white) inset;
  transition: background-color 9999s ease-out 0s;
  animation-name: onAutoFillStart;
  animation-duration: 0.001s;
}

.form-field__append {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 30;
}

.form-field__error {
  margin: 0;
  font-family: "Inter", "Manrope", system-ui, sans-serif;
  font-size: 0.875rem;
  line-height: 1.35;
  color: var(--wh-field-error);
}
</style>
