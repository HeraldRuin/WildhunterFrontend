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
  min-height: 400px;
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
  width: 100%;
  min-height: 640px;
  margin-inline: 0;
  padding: 56px clamp(16px, calc(80px - (1422px - 100vw) * 64 / 398), 80px) 56px 24px;
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
  text-transform: uppercase;
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
  width: min(100%, 372px);
}

.community-block__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.community-block__field input {
  width: 284px;
  padding: 8px 0 10px;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.85);
  background: transparent;
  color: var(--wh-white);
  outline: none;
}

.community-block__field input::placeholder {
  color: rgba(255, 255, 255, 0.55);
}

.community-block__checkbox {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.55);

  font-family: Inter, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 120%;
  letter-spacing: -0.05em;
}

.community-block__checkbox input {
  width: 16px;
  height: 16px;
  margin-top: 2px;
  flex-shrink: 0;
  appearance: none;
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 2px;
  background: transparent;
  cursor: pointer;
  position: relative;
}

.community-block__checkbox input:checked::after {
  content: '';
  position: absolute;
  top: 1px;
  left: 4px;
  width: 5px;
  height: 9px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.community-block__submit {
  width: 372px;
  margin-top: 4px;
  padding-block: 14px;
  font-family: Inter, sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 100%;
  letter-spacing: -0.05em;
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
  .community-block__inner {
    min-height: 400px;
    padding: 56px 16px 56px 24px;
  }

  .community-block__content {
    width: min(100%, 360px);
  }

  .community-block__title {
    width: min(100%, 360px);
    min-height: auto;
    font-size: 32px;
  }

  .community-block__form {
    width: min(100%, 360px);
  }

  .community-block__submit {
    width: 360px;
  }

  .community-block__field input,
  .community-block__field input::placeholder {
    font-size: 16px;
  }

  .community-block__checkbox {
    font-size: 12px;
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
  .community-block {
    min-height: 560px;
  }

  .community-block__media img {
    object-position: 42% 16%;
  }

  .community-block__inner {
    justify-content: flex-start;
    align-items: flex-end;
    min-height: 560px;
    padding: 24px 24px 40px;
  }

  .community-block__content {
    width: 100%;
  }

  .community-block__title {
    width: 100%;
    font-size: 24px;
    line-height: 1.15;
  }

  .community-block__title-line:nth-child(2),
  .community-block__title-line:nth-child(3) {
    display: inline;
  }

  .community-block__title-line:nth-child(2)::after {
    content: ' ';
  }
}
</style>
