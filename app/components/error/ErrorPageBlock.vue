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
    return 'Ошибка сервера'
  }

  if (code === 403) {
    return 'Доступ запрещён'
  }

  return 'Ошибка сервера'
})
const nuxtError = useError()

const bgImage = '/images/error.jpg'

const bgStyle = computed(() => ({
  backgroundImage: `linear-gradient(180deg, rgba(17, 24, 39, 0.04) 0%, rgba(17, 24, 39, 0.1) 100%), url(${bgImage})`,
}))

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
    <section class="error-hero" :style="bgStyle">
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

    <HomeBlocksCommunityBlock variant="centered" plain />
    <LayoutAppFooter />
  </div>
</template>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.error-hero {
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  min-height: 810px;
  background-size: cover;
  background-position: center 35%;
  background-repeat: no-repeat;
  color: var(--wh-white);
}

.error-hero__inner {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.error-hero__content {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex: 1;
  width: 100%;
  padding: 48px 80px 80px 120px;
}

.error-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: min(100%, 592px);
  padding: 48px 56px 40px;
  border-radius: var(--wh-radius-lg);
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  text-align: center;
}

.error-card__code {
  margin: 0;
  font-size: 200px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.02em;
}

.error-card__label {
  margin: 0 0 32px;
  font-family: UNCAGE, sans-serif;
  font-weight: 400;
  font-style: normal;
  font-size: 32px;
  line-height: 130%;
  letter-spacing: -0.96px;
  text-align: center;
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
  border-radius: var(--wh-radius-lg);
  background: var(--wh-orange-500);
  color: var(--wh-white);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.error-card__btn:hover {
  background: var(--wh-orange-600);
  transform: var(--wh-button-hover-lift);
}

@media (--wh-tablet) {
  .error-hero {
    background-size: 240%;
    background-position: center 40%;
  }

  .error-hero__content {
    justify-content: center;
    padding: 40px 32px 64px;
  }

  .error-card {
    width: 592px;
    height: 537px;
    padding: 40px 40px 32px;
    justify-content: center;
  }

  .error-card__label {
    font-size: 28px;
  }
}

@media (--wh-mobile) {
  .error-hero {
    background-size: auto 180%;
    background-position: center 35%;
  }

  .error-hero__content {
    padding: 32px 16px 48px;
  }

  .error-card {
    width: 345px;
    height: 515px;
    padding: 32px 28px 28px;
    justify-content: center;
  }

  .error-card__code {
    font-size: 120px;
  }

  .error-card__label {
    font-size: 24px;
  }

  .error-card__btn {
    width: 100%;
    min-width: 0;
  }
}
</style>
