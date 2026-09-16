<script setup lang="ts">
</script>

<template>
  <section class="bases-seo-intro">
    <div class="container bases-seo-intro__inner">
      <h1 class="bases-seo-intro__title">
        Охотничьи туры в России: организация охоты под ключ
      </h1>
      <p class="bases-seo-intro__text">
        Организация охотничьих туров в России любой сложности от подбора региона и целевого трофея до полного юридического и логистического сопровождения. Оформление лицензий на добычу, егерское сопровождение, первичная обработка туши и трансфер в угодья. Если вы находитесь в поисках идеального приключения, отправляйтесь с нами!
      </p>
    </div>
  </section>
</template>

<style scoped>
.bases-seo-intro {
  padding-block: 8px 48px;
  background: var(--wh-white);
}

.bases-seo-intro__inner.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: min(100% - 32px, 1600px);
}

.bases-seo-intro__title {
  margin: 0;
  max-width: 920px;
  font-family: "UNCAGE", sans-serif;
  font-size: 36px;
  font-weight: 400;
  line-height: 120%;
  letter-spacing: -0.03em;
  text-align: center;
  text-transform: uppercase;
  color: var(--wh-gray-900);
}

.bases-seo-intro__text {
  margin: 0;
  max-width: 920px;
  font-family: "Inter", sans-serif;
  font-size: 18px;
  font-weight: 400;
  line-height: 140%;
  letter-spacing: -0.02em;
  text-align: center;
  color: var(--wh-gray-600);
}

@media (--wh-tablet) {
  .bases-seo-intro {
    padding-block: 8px 36px;
  }

  .bases-seo-intro__title {
    font-size: 28px;
  }
}

@media (--wh-mobile) {
  .bases-seo-intro {
    padding-block: 4px 28px;
  }

  .bases-seo-intro__title {
    font-size: 24px;
  }

  .bases-seo-intro__text {
    font-size: 16px;
    text-align: left;
  }
}
</style>
