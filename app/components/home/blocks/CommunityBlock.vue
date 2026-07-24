<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'side' | 'centered'
}>(), {
  variant: 'side',
})

const { newsletter } = useApi()
const notifications = useNotifications()

const email = ref('')
const agreed = ref(true)
const isSubmitting = ref(false)
const submitError = ref('')
const fieldErrors = ref<Record<string, string[]>>({})

function getFieldError(field: string) {
  return fieldErrors.value[field]?.[0]
}

function clearFieldError(field: string) {
  if (!fieldErrors.value[field]) {
    return
  }

  const nextErrors = { ...fieldErrors.value }
  delete nextErrors[field]
  fieldErrors.value = nextErrors
  submitError.value = ''
}

function applyValidationErrors(data: unknown) {
  if (!data || typeof data !== 'object') {
    return false
  }

  const response = data as {
    success?: boolean
    message?: string
    errors?: Record<string, string[]>
  }

  if (response.errors && Object.keys(response.errors).length > 0) {
    fieldErrors.value = response.errors
    submitError.value = ''
    return true
  }

  if (response.message) {
    fieldErrors.value = {}
    submitError.value = response.message
    return true
  }

  return false
}

async function handleSubmit() {
  isSubmitting.value = true
  fieldErrors.value = {}
  submitError.value = ''

  try {
    const response = await newsletter.subscribe({
      email: email.value.trim(),
      privacy_policy: agreed.value,
    })

    if (response.success) {
      notifications.success(response.message || 'Вы подписаны на рассылку')
      email.value = ''
      return
    }

    if (!applyValidationErrors(response)) {
      submitError.value = 'Не удалось подписаться на рассылку'
    }
  } catch (error) {
    if (!applyValidationErrors((error as { data?: unknown }).data)) {
      submitError.value = 'Не удалось подписаться на рассылку'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <section
    class="community-block"
    :class="{ 'community-block--centered': variant === 'centered' }"
  >
    <div class="community-block__media" aria-hidden="true">
      <img
        :src="variant === 'centered' ? '/images/communutu2-bg.jpg' : '/images/community-bg.png'"
        alt=""
        loading="lazy"
      >
    </div>

    <div class="community-block__inner">
      <div class="community-block__content">
        <h2 class="community-block__title">
          <template v-if="variant === 'centered'">
            Присоединяйтесь<br>
            к нашему сообществу
          </template>
          <template v-else>
            <span class="community-block__title-line">Присоединяйтесь</span>
            <span class="community-block__title-line">к нашему</span>
            <span class="community-block__title-line">сообществу</span>
          </template>
        </h2>

        <form class="community-block__form" @submit.prevent="handleSubmit">
          <label class="community-block__field">
            <input
              v-model="email"
              type="email"
              name="email"
              autocomplete="email"
              placeholder="Ваш email"
              aria-label="Ваш email"
              :aria-invalid="Boolean(getFieldError('email'))"
              :aria-describedby="getFieldError('email') ? 'community-block-email-error' : undefined"
              @input="clearFieldError('email')"
            >
            <p
              v-if="getFieldError('email')"
              id="community-block-email-error"
              class="community-block__error"
            >
              {{ getFieldError('email') }}
            </p>
          </label>

          <label class="community-block__checkbox">
            <input
              v-model="agreed"
              type="checkbox"
              name="privacy"
              :aria-invalid="Boolean(getFieldError('privacy_policy'))"
              :aria-describedby="getFieldError('privacy_policy') ? 'community-block-privacy-error' : undefined"
              @change="clearFieldError('privacy_policy')"
            >
            <span>Я согласен с политикой конфиденциальности</span>
          </label>
          <p
            v-if="getFieldError('privacy_policy')"
            id="community-block-privacy-error"
            class="community-block__error community-block__error--checkbox"
          >
            {{ getFieldError('privacy_policy') }}
          </p>

          <p v-if="submitError" class="community-block__error community-block__error--submit">
            {{ submitError }}
          </p>

          <button
            type="submit"
            class="community-block__submit btn btn--primary"
            :disabled="isSubmitting"
          >
            Подписаться на рассылку
          </button>

          <div v-if="variant !== 'centered'" class="community-block__social">
            <a href="#" class="community-block__social-btn">Telegram</a>
            <a href="#" class="community-block__social-btn">Max</a>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.community-block {
  position: relative;
  overflow: hidden;
  min-height: 400px;
  background: #243d31;
}

.community-block__media {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.community-block__media img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  min-width: 100%;
  object-fit: cover;
  object-position: 26% 10%;
}

.community-block__media::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(17, 24, 39, 0.05) 0%,
    rgba(17, 24, 39, 0.18) 45%,
    rgba(17, 24, 39, 0.55) 100%
  );
}

.community-block__inner {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  width: 100%;
  min-height: 640px;
  margin-inline: 0;
  padding: 56px clamp(16px, calc(80px - (1422px - 100vw) * 64 / 398), 80px) 56px 24px;
}

.community-block__content {
  width: min(100%, 554px);
  color: var(--wh-white);
}

.community-block__title {
  margin: 0 0 28px;
  width: min(100%, 554px);
  min-height: 96px;
  font-family: 'UNCAGE', 'Manrope', system-ui, sans-serif;
  font-size: 44px;
  font-weight: 400;
  line-height: 1.1;
  letter-spacing: -0.05em;
  text-transform: uppercase;
  color: #ffffff;
}

.community-block__title-line {
  display: block;
}

.community-block__title-line:nth-child(2),
.community-block__title-line:nth-child(3) {
  display: inline;
}

.community-block__title-line:nth-child(2)::after {
  content: ' ';
}

.community-block__form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: min(100%, 372px);
}

.community-block__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.community-block__field input {
  width: 284px;
  padding: 8px 0 10px;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.85);
  background: transparent;
  color: var(--wh-white);
  outline: none;
}

.community-block__field input::placeholder {
  color: rgba(255, 255, 255, 0.55);
}

.community-block__error {
  margin: 0;
  font-family: Inter, sans-serif;
  font-size: 12px;
  line-height: 1.3;
  color: #ffb4b4;
}

.community-block__error--checkbox {
  margin-top: -10px;
}

.community-block__error--submit {
  margin-top: -6px;
}

.community-block__checkbox {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.55);

  font-family: Inter, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 120%;
  letter-spacing: -0.05em;
}

.community-block__checkbox input {
  width: 16px;
  height: 16px;
  margin-top: 2px;
  flex-shrink: 0;
  appearance: none;
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 2px;
  background: transparent;
  cursor: pointer;
  position: relative;
}

.community-block__checkbox input:checked::after {
  content: '';
  position: absolute;
  top: 1px;
  left: 4px;
  width: 5px;
  height: 9px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.community-block__submit {
  width: 372px;
  margin-top: 4px;
  padding-block: 14px;
  font-family: Inter, sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 100%;
  letter-spacing: -0.05em;
}

.community-block__social {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.community-block__social-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border-radius: 999px;
  background: var(--wh-orange-500);
  color: var(--wh-white);

  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  transition: background 0.15s ease, transform 0.15s ease;
}

.community-block__social-btn:hover {
  background: var(--wh-orange-600);
  transform: translateY(-1px);
}

.community-block--centered .community-block__media img {
  object-position: center 82%;
}

.community-block--centered .community-block__media::after {
  background: rgba(17, 24, 39, 0.42);
}

.community-block--centered .community-block__inner {
  justify-content: center;
  align-items: center;
  min-height: 390px;
  padding: 64px 24px;
}

.community-block--centered .community-block__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(100%, 720px);
  text-align: center;
}

.community-block--centered .community-block__title {
  width: 100%;
  min-height: auto;
  margin-bottom: 32px;

  font-family: "UNCAGE", sans-serif;
  font-size: 44px;
  font-weight: 400;
  line-height: 110%;
  letter-spacing: -0.05em;

  text-align: center;
}

.community-block--centered .community-block__form {
  align-items: stretch;
  width: min(100%, 372px);
}

.community-block--centered .community-block__field input {
  width: 100%;
}

.community-block--centered .community-block__submit {
  width: 100%;
}

@media (max-width: 1024px) {
  .community-block__inner {
    min-height: 400px;
    padding: 56px 16px 56px 24px;
  }

  .community-block__content {
    width: min(100%, 360px);
  }

  .community-block__title {
    width: min(100%, 360px);
    min-height: auto;
    font-size: 32px;
  }

  .community-block__form {
    width: min(100%, 360px);
  }

  .community-block__submit {
    width: 360px;
  }

  .community-block__field input,
  .community-block__field input::placeholder {
    font-size: 16px;
  }

  .community-block__checkbox {
    font-size: 12px;
  }

  .community-block__title-line:nth-child(2),
  .community-block__title-line:nth-child(3) {
    display: block;
  }

  .community-block__title-line:nth-child(2)::after {
    content: none;
  }
}

@media (max-width: 640px) {
  .community-block {
    min-height: 560px;
  }

  .community-block--centered .community-block__inner {
    min-height: 480px;
    padding: 48px 24px;
  }

  .community-block__media img {
    object-position: 42% 16%;
  }

  .community-block--centered .community-block__media img {
    object-position: center 72%;
  }

  .community-block__inner {
    justify-content: flex-start;
    align-items: flex-end;
    min-height: 560px;
    padding: 24px 24px 40px;
  }

  .community-block__content {
    width: 100%;
  }

  .community-block__title {
    width: 100%;
    font-size: 24px;
    line-height: 1.15;
  }

  .community-block__title-line:nth-child(2),
  .community-block__title-line:nth-child(3) {
    display: inline;
  }

  .community-block__title-line:nth-child(2)::after {
    content: ' ';
  }

  .community-block__form {
    width: 100%;
  }

  .community-block__field input {
    width: 100%;
  }

  .community-block__submit {
    width: 100%;
  }
}
</style>
