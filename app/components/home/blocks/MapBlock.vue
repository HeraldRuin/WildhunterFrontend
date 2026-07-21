<template>
  <section class="map-block">
    <div class="container">
      <h2 class="section-title">Базы на карте</h2>
      <p class="section-desc">Интерактивная карта будет подключена позже.</p>
      <div class="map-block__placeholder">
        Карта регионов WH
      </div>
    </div>
  </section>
</template>

<style scoped>
.map-block {
  padding-block: 56px 72px;
  background: var(--wh-gray-100);
}

.map-block__placeholder {
  display: grid;
  place-items: center;
  min-height: 360px;
  border-radius: var(--wh-radius-lg);
  background:
    linear-gradient(rgba(26, 46, 36, 0.08), rgba(26, 46, 36, 0.08)),
    repeating-linear-gradient(45deg, #e8e8e8 0 12px, #f5f5f5 12px 24px);
  color: var(--wh-gray-600);
  font-weight: 600;
}
</style>
