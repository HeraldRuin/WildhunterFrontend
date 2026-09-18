<script setup lang="ts">
</script>

<template>
  <section class="bases-seo-intro">
    <div class="container bases-seo-intro__inner">
      <h1 class="bases-seo-intro__title">
        Охотничьи туры в России:<br>
        организация охоты под ключ
      </h1>
      <p class="bases-seo-intro__text">
        Организация охотничьих туров в России любой сложности от подбора региона и целевого трофея до полного юридического и логистического сопровождения. Оформление лицензий на добычу, егерское сопровождение, первичная обработка туши и трансфер в угодья. Если вы находитесь в поисках идеального приключения, отправляйтесь с нами!
      </p>
    </div>
  </section>
</template>

<style scoped>
.bases-seo-intro {
  padding-block: 56px 24px;
  background: transparent;
}

.bases-seo-intro__inner.container {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(0, 1.2fr);
  align-items: start;
  gap: 32px 64px;
  width: min(100% - 32px, 1240px);
}

.bases-seo-intro__title {
  margin: 0;
  font-family: "UNCAGE", sans-serif;
  font-size: 32px;
  font-weight: 400;
  line-height: 1.15;
  letter-spacing: 0;
  text-transform: uppercase;
  color: var(--wh-black-text);
}

.bases-seo-intro__text {
  margin: 0;
  font-family: "Inter", sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.55;
  color: var(--wh-black-text);
}

@media (--wh-tablet) {
  .bases-seo-intro {
    padding-block: 40px 16px;
  }

  .bases-seo-intro__inner.container {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .bases-seo-intro__title {
    font-size: 28px;
  }
}

@media (--wh-mobile) {
  .bases-seo-intro {
    padding-block: 32px 12px;
  }

  .bases-seo-intro__title {
    font-size: 24px;
  }
}
</style>
