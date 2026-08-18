<script setup lang="ts">
definePageMeta({
  layout: 'home',
  path: '/support',
})

useHead({
  title: 'Поддержка',
  meta: [
    {
      name: 'description',
      content: 'Напишите в службу поддержки Wild Hunter — мы проконсультируем вас и ответим на вопросы.',
    },
  ],
})

const { contact } = useApi()
const notifications = useNotifications()

const name = ref('')
const email = ref('')
const message = ref('')
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

  try {
    const response = await contact.sendMessage({
      name: name.value.trim(),
      email: email.value.trim(),
      message: message.value.trim(),
    })

    if (response.success) {
      notifications.success(response.message || 'Сообщение отправлено')
      name.value = ''
      email.value = ''
      message.value = ''
      fieldErrors.value = {}
      submitError.value = ''
      return
    }

    if (!applyValidationErrors(response)) {
      submitError.value = 'Не удалось отправить сообщение'
    }
  } catch (error) {
    if (!applyValidationErrors((error as { data?: unknown }).data)) {
      submitError.value = 'Не удалось отправить сообщение'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="support-page">
    <section class="support-hero">
      <div class="support-hero__header">
        <HomeHeroHeader />
      </div>
      <div class="support-hero__title">
        <HomeHeroTitle />
      </div>
    </section>

    <main class="support-content container">
      <h1>Поддержка</h1>
      <p class="support-content__lead">
        Напишите нам, и мы проконсультируем вас и ответим на вопросы.
      </p>

      <form
        class="support-form"
        novalidate
        @submit.prevent="handleSubmit"
      >
        <CommonFormField
          id="support-name"
          label="Имя"
          placeholder="Как к вам обращаться"
          autocomplete="name"
          :model-value="name"
          :error="getFieldError('name')"
          :disabled="isSubmitting"
          @update:model-value="name = $event; clearFieldError('name')"
        />

        <CommonFormField
          id="support-email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          autocomplete="email"
          :model-value="email"
          :error="getFieldError('email')"
          :disabled="isSubmitting"
          @update:model-value="email = $event; clearFieldError('email')"
        />

        <CommonFormField
          id="support-message"
          label="Сообщение"
          placeholder="Ваш вопрос"
          multiline
          :rows="6"
          :model-value="message"
          :error="getFieldError('message')"
          :disabled="isSubmitting"
          @update:model-value="message = $event; clearFieldError('message')"
        />

        <p v-if="submitError" class="support-form__error">
          {{ submitError }}
        </p>

        <CommonSaveButton
          type="submit"
          width="100%"
          mobile-width="100%"
          :disabled="isSubmitting"
          :loading="isSubmitting"
        >
          Отправить
        </CommonSaveButton>
      </form>
    </main>

    <LayoutAppFooter />
  </div>
</template>

<style scoped>
.support-hero {
  position: relative;
  min-height: 520px;
  background:
    linear-gradient(180deg, rgba(17, 24, 39, 0.08) 0%, rgba(17, 24, 39, 0.18) 100%),
    url('/images/headBlock.jpg') center / 100% 100% no-repeat;
  color: var(--wh-white);
}

.support-hero__header {
  display: flex;
  justify-content: center;
  padding-inline: 12px;
}

.support-hero__title {
  position: absolute;
  top: 300px;
  left: 50%;
  width: 100%;
  max-width: calc(100% - 24px);
  transform: translateX(-50%);
}

.support-content {
  max-width: 1200px;
  padding-block: 40px 72px;
  color: var(--wh-black-text);
}

.support-content h1 {
  font-family: 'UNCAGE', sans-serif;
  font-weight: 400;
  text-transform: uppercase;
  margin: 0 0 24px;
  font-size: 32px;
  line-height: 1.3;
  letter-spacing: -0.03em;
  text-align: center;
}

.support-content__lead {
  margin: 0 0 32px;
  text-align: center;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.05em;
  color: rgb(0 0 0 / 80%);
}

.support-form {
  width: 100%;
  max-width: 640px;
  margin-inline: auto;
}

.support-form__error {
  margin: 0 0 16px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 0.875rem;
  line-height: 1.35;
  color: var(--wh-field-error);
}

@media (--wh-tablet) {
  .support-hero {
    min-height: 500px;
  }

  .support-hero__title {
    top: 290px;
  }

  .support-content {
    max-width: 900px;
    padding-block: 32px 64px;
  }
}

@media (--wh-mobile) {
  .support-hero {
    min-height: 390px;
    background-size: cover;
  }

  .support-hero__title {
    top: 220px;
  }

  .support-content {
    padding-block: 24px 48px;
  }

  .support-content h1 {
    font-size: 24px;
  }

  .support-content__lead {
    font-size: 16px;
    text-align: left;
  }
}
</style>
