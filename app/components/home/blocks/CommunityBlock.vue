<script setup lang="ts">
const email = ref('')
const agreed = ref(true)

function handleSubmit() {
  // API подключим позже
}
</script>

<template>
  <section class="community-block">
    <div class="community-block__media" aria-hidden="true">
      <img
        src="/images/community-bg.png"
        alt=""
        loading="lazy"
      >
    </div>

    <div class="community-block__inner">
      <div class="community-block__content">
        <h2 class="community-block__title">
          <span class="community-block__title-line">Присоединяйтесь</span>
          <span class="community-block__title-line">к нашему</span>
          <span class="community-block__title-line">сообществу</span>
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
            >
          </label>

          <label class="community-block__checkbox">
            <input v-model="agreed" type="checkbox" name="privacy">
            <span>Я согласен с политикой конфиденциальности</span>
          </label>

          <button type="submit" class="community-block__submit btn btn--primary">
            Подписаться на рассылку
          </button>

          <div class="community-block__social">
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
  min-height: 562px;
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
  width: min(100%, 1440px);
  min-height: 640px;
  margin-inline: auto;
  padding: 56px 80px 56px 24px;
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
}

.community-block__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.community-block__field input {
  width: 100%;
  padding: 8px 0 10px;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.85);
  background: transparent;
  color: var(--wh-white);
  outline: none;
}

.community-block__field input::placeholder {
  color: rgba(255, 255, 255, 0.85);
}

.community-block__checkbox {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.875rem;
  line-height: 1.4;
  cursor: pointer;
}

.community-block__checkbox input {
  width: 16px;
  height: 16px;
  margin-top: 2px;
  flex-shrink: 0;
  accent-color: var(--wh-orange-500);
}

.community-block__submit {
  width: 100%;
  margin-top: 4px;
  padding-block: 14px;
  font-size: 0.98rem;
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

@media (max-width: 1024px) {
  .community-block__content {
    width: min(100%, 360px);
  }

  .community-block__title {
    width: min(100%, 360px);
    min-height: auto;
    font-size: 32px;
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
  .community-block__media img {
    object-position: 42% 16%;
  }

  .community-block__inner {
    justify-content: center;
    min-height: auto;
    padding: 48px 24px;
  }

  .community-block__content {
    width: 100%;
  }

  .community-block__title {
    width: 100%;
    font-size: clamp(24px, 6vw, 32px);
    line-height: 1.15;
  }
}
</style>
