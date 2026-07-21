<template>
  <section class="cta-block">
    <div class="container cta-block__inner">
      <div>
        <h2>Готовы к новому приключению?</h2>
        <p>Забронируйте охотничью базу уже сегодня.</p>
      </div>
      <NuxtLink to="/bases" class="btn btn--primary">
        Смотреть базы
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped>
.cta-block {
  padding-block: 56px;
  background: var(--wh-green-800);
  color: var(--wh-white);
}

.cta-block__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.cta-block h2 {
  margin: 0 0 8px;
  font-size: clamp(1.5rem, 2vw, 2rem);
}

.cta-block p {
  margin: 0;
  color: rgba(255, 255, 255, 0.78);
}

@media (max-width: 640px) {
  .cta-block__inner {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
