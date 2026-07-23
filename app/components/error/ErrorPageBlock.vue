<script setup lang="ts">
const props = withDefaults(defineProps<{
  statusCode?: number | string
}>(), {
  statusCode: 404,
})

const displayCode = computed(() => String(props.statusCode))

const errorLabel = computed(() => {
  const code = Number(props.statusCode)

  if (code === 404) {
    return 'Страница не найдена'
  }

  if (code === 403) {
    return 'Доступ запрещён'
  }

  return 'Ошибка сервера'
})
const nuxtError = useError()

function goHome() {
  if (nuxtError.value) {
    clearError({ redirect: '/' })
    return
  }

  navigateTo('/')
}
</script>

<template>
  <div class="error-page">
    <section class="error-hero">
      <div class="error-hero__inner">
        <HomeHeroHeader />

        <div class="error-hero__content">
          <div class="error-card">
            <p class="error-card__code">{{ displayCode }}</p>
            <p class="error-card__label">{{ errorLabel }}</p>
            <button type="button" class="error-card__btn" @click="goHome">
              Вернуться на главную
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.error-page {
  min-height: 100vh;
}

.error-hero {
  width: 100%;
  min-height: 100vh;
  background: var(--wh-green-700);
  color: var(--wh-white);
}

.error-hero__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(100%, 1440px);
  min-height: 100vh;
  margin-inline: auto;
}

.error-hero__content {
  display: flex;
  align-items: center;
  flex: 1;
  width: 100%;
  padding: 48px 80px 80px;
}

.error-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  width: min(100%, 480px);
  padding: 48px 56px 40px;
  border-radius: var(--wh-radius-lg);
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.error-card__code {
  margin: 0;
  font-size: clamp(4.5rem, 10vw, 7rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
}

.error-card__label {
  margin: 0 0 32px;
  font-size: clamp(1.25rem, 2.5vw, 1.75rem);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.error-card__btn {
  align-self: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 240px;
  min-height: 48px;
  padding: 0 32px;
  border: none;
  border-radius: 999px;
  background: var(--wh-orange-500);
  color: var(--wh-white);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.error-card__btn:hover {
  background: var(--wh-orange-600);
  transform: translateY(-1px);
}

@media (max-width: 1024px) {
  .error-hero__content {
    padding: 40px 32px 64px;
  }

  .error-card {
    padding: 40px 40px 32px;
  }
}

@media (max-width: 640px) {
  .error-hero__content {
    padding: 32px 16px 48px;
  }

  .error-card {
    padding: 32px 28px 28px;
  }

  .error-card__btn {
    width: 100%;
    min-width: 0;
  }
}
</style>
