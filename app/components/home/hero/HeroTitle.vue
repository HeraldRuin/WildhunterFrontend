<template>
  <div class="hero-title">
    <h1 class="hero-title__heading">
      <span>Онлайн-платформа</span>
      <span>для настоящих <br class="hero-title__break">охотников</span>
    </h1>
  </div>
</template>

<style scoped>
.hero-title {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.hero-title__heading {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 0 auto;
  max-width: 858px;
  text-align: center;
  font-family: 'UNCAGE', 'Manrope', system-ui, sans-serif;
  font-size: 56px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.03em;
  color: #ffffff;
}

.hero-title__heading span {
  display: block;
}

.hero-title__break {
  display: none;
}

@media (max-width: 1024px) {
  .hero-title__heading {
    max-width: 100%;
  }

  .hero-title__break {
    display: block;
  }
}
</style>
