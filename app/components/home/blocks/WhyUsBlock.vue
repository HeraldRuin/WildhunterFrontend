<script setup lang="ts">
const items = [
  {
    number: '01.',
    title: 'Планируй охоту под себя',
    text: 'Индивидуальные и групповые форматы, выбор региона, сезона и вида добычи',
  },
  {
    number: '02.',
    title: 'Проверенные организаторы и условия',
    text: 'Платформа собирает лучшие варианты и помогает выбрать надежный вариант',
  },
  {
    number: '03.',
    title: 'Прозрачные калькуляции и расходы',
    text: 'Все платежи и траты фиксируются в системе, видно распределение средств',
  },
]
</script>

<template>
  <section class="why-us">
    <div class="container why-us__inner">
      <h2 class="why-us__title">Почему мы?</h2>

      <div class="why-us__grid">
        <article
          v-for="item in items"
          :key="item.number"
          class="why-us__card"
        >
          <span class="why-us__number">{{ item.number }}</span>
          <h3 class="why-us__card-title">{{ item.title }}</h3>
          <p class="why-us__card-text">{{ item.text }}</p>
        </article>
        <div class="why-us__placeholder" aria-hidden="true" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.why-us {
  padding-block: 72px 88px;
  background: var(--wh-white);
}

.why-us__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 48px;
}

.why-us__title {
  margin: 0;
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--wh-gray-900);
}

.why-us__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  width: 100%;
}

.why-us__card {
  min-height: 280px;
  padding: 28px 28px 32px;
  border-radius: 18px;
  background: #5f7256;
  color: var(--wh-white);
}

.why-us__number {
  display: block;
  margin-bottom: 28px;
  font-size: clamp(2rem, 3vw, 2.75rem);
  line-height: 1;
  font-weight: 700;
}

.why-us__card-title {
  margin: 0 0 16px;
  font-size: clamp(1.15rem, 1.6vw, 1.35rem);
  line-height: 1.35;
  font-weight: 700;
}

.why-us__card-text {
  margin: 0;
  max-width: 34ch;
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.55;
  font-size: 0.98rem;
}

.why-us__placeholder {
  display: none;
}

@media (max-width: 1024px) {
  .why-us__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .why-us__card {
    min-height: auto;
  }

  .why-us__placeholder {
    display: block;
    min-height: 280px;
    border-radius: 18px;
    background: #dddddd;
  }
}

@media (max-width: 640px) {
  .why-us__grid {
    grid-template-columns: 1fr;
  }

  .why-us__placeholder {
    display: none;
  }
}
</style>
