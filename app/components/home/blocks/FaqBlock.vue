<script setup lang="ts">
interface FaqItem {
  id: number
  question: string
  answer: string
}

const items: FaqItem[] = [
  {
    id: 1,
    question: 'Нужно ли проходить обучение, чтобы стать охотником?',
    answer: 'Да, обучение является обязательным этапом для законной охоты в России. Чтобы получить охотничий билет, вам необходимо изучить и успешно сдать экзамен по правилам охоты, технике безопасности при обращении с оружием, основам биологии диких животных и правилам оказания первой помощи в полевых условиях.',
  },
  {
    id: 2,
    question: 'Как оформить бронирование?',
    answer: 'Выберите охотхозяйство, укажите даты, количество гостей и необходимые услуги в форме поиска. После подтверждения заявки администратором базы вы сможете внести предоплату и получить подтверждение бронирования на платформе.',
  },
  {
    id: 3,
    question: 'Можно ли отменить бронь?',
    answer: 'Да, отмена возможна в личном кабинете. Условия возврата предоплаты зависят от правил конкретного охотхозяйства и срока до начала охоты — они указаны при бронировании.',
  },
  {
    id: 4,
    question: 'Есть ли поддержка?',
    answer: 'Да, служба поддержки Wild Hunter работает через раздел «Поддержка» на сайте. Мы поможем с бронированием, оплатой и любыми вопросами по использованию платформы.',
  },
  {
    id: 5,
    question: 'Как выбрать регион?',
    answer: 'В форме поиска откройте поле «Локация» и выберите интересующий регион или охотхозяйство. Вы также можете фильтровать базы по видам дичи, сезону и доступным услугам.',
  },
]

const openId = ref<number | null>(null)

const faqIconPlus = '/icons/Property%201=icon%20plus.png'
const faqIconMinus = '/icons/line-md_plus.png'

function toggleItem(id: number) {
  openId.value = openId.value === id ? null : id
}
</script>

<template>
  <section class="faq-block">
    <div class="container faq-block__inner">
      <h2 class="faq-block__title">Часто задаваемые вопросы</h2>

      <div class="faq-block__panel">
        <div class="faq-block__list">
          <div
            v-for="item in items"
            :key="item.id"
            class="faq-block__item"
            :class="{ 'faq-block__item--open': openId === item.id }"
          >
            <button
              type="button"
              class="faq-block__trigger"
              :aria-expanded="openId === item.id"
              @click="toggleItem(item.id)"
            >
              <span class="faq-block__question-block">
                <span class="faq-block__number">{{ item.id }}</span>
                <span class="faq-block__question">{{ item.question }}</span>
              </span>
              <span
                v-if="openId === item.id"
                class="faq-block__answer"
              >
                {{ item.answer }}
              </span>
              <img
                :src="openId === item.id ? faqIconMinus : faqIconPlus"
                alt=""
                width="40"
                height="40"
                class="faq-block__icon"
                aria-hidden="true"
              >
            </button>
          </div>
        </div>

        <div class="faq-block__cta">
          <h3 class="faq-block__cta-title">Остались вопросы?</h3>
          <p class="faq-block__cta-text">
            <span class="faq-block__cta-text-desktop">
              Напишите нам и мы проконсультируем<br>
              вас и ответим на вопросы
            </span>
            <span class="faq-block__cta-text-mobile">
              Напишите нам и мы<br>
              проконсультируем вас и ответим<br>
              на вопросы
            </span>
          </p>
          <NuxtLink to="/support" class="btn btn--primary faq-block__cta-btn">
            Поддержка
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.faq-block {
  padding-block: 48px 64px;
  background: var(--wh-white);
}

.faq-block__inner {
  display: flex;
  flex-direction: column;
  gap: 48px;
}

.faq-block__inner.container {
  width: min(100% - 32px, 1600px);
}

.faq-block__title {
  margin: 0;
  font-family: UNCAGE;
  font-weight: 400;
  font-style: normal;
  font-size: 44px;
  line-height: 110%;
  text-transform: uppercase;
  text-align: center;
  color: var(--wh-gray-900);
}

.faq-block__panel {
  border-top: 1px solid rgb(28 33 28 / 20%);
  border-bottom: 1px solid rgb(28 33 28 / 20%);
}

.faq-block__list {
  border-top: none;
}

.faq-block__item {
  border-bottom: 1px solid rgb(28 33 28 / 20%);
}

.faq-block__trigger {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  align-items: start;
  gap: clamp(16px, 3vw, 48px);
  width: 100%;
  padding: 22px 0;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.faq-block__item:not(.faq-block__item--open) .faq-block__trigger {
  align-items: center;
}

.faq-block__question-block {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 32px;
  width: 100%;
  max-width: 592px;
}

.faq-block__number {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: var(--wh-green);
  color: var(--wh-white);

  font-family: Inter, sans-serif;
  font-weight: 500;
  font-style: normal;
  font-size: 18px;
  line-height: 120%;
  letter-spacing: -0.9px;

  flex-shrink: 0;
}

.faq-block__question {
  color: var(--wh-black-text);
  font-family: "Inter", sans-serif;
  font-size: 24px;
  font-weight: 600;
  line-height: 130%;
  letter-spacing: -0.05em;
}

.faq-block__icon {
  grid-column: -1;
  display: block;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  object-fit: contain;
}

.faq-block__answer {
  margin: 0;
  color: #000000;
  line-height: 130%;
  font-family: "Inter", sans-serif;
  font-size: 18px;
  font-weight: 400;
  letter-spacing: -0.05em;
}

.faq-block__cta {
  display: grid;
  grid-template-columns: max-content 1fr auto max-content;
  align-items: center;
  column-gap: 20px;
  width: 100%;
  padding-block: 28px;
}

.faq-block__cta-title {
  margin: 0;
  grid-column: 1;
  max-width: 592px;
  font-family: 'UNCAGE', 'Manrope', system-ui, sans-serif;
  font-size: 32px;
  font-weight: 400;
  line-height: 1.3;
  letter-spacing: -0.03em;
  text-transform: uppercase;
  color: #1c211c;
  white-space: nowrap;
}

.faq-block__cta-text {
  margin: 0;
  grid-column: 3;
  width: min(100%, 385px);
  text-align: left;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.05em;
  color: rgb(0 0 0 / 80%);
}

.faq-block__cta-text-mobile {
  display: none;
}

.faq-block__cta-btn {
  grid-column: 4;
  flex: 0 0 auto;
  min-width: 168px;
  padding-inline: 36px;
  border-radius: var(--wh-radius-lg);
  white-space: nowrap;
}

@media (--wh-desktop) {
  .faq-block__trigger {
    grid-template-columns: 592px minmax(0, 1fr) auto;
  }

  .faq-block__question-block {
    width: 592px;
  }
}

@media (--wh-tablet) {
  .faq-block__cta {
    grid-template-columns: max-content minmax(0, 1fr);
    grid-template-rows: auto auto;
    align-items: center;
    column-gap: clamp(20px, 4vw, 64px);
    row-gap: 16px;
  }

  .faq-block__cta-title {
    grid-column: 1;
    grid-row: 1 / span 2;
    align-self: center;
    white-space: normal;
  }

  .faq-block__cta-text {
    grid-column: 2;
    grid-row: 1;
    width: 100%;
    max-width: none;
  }

  .faq-block__cta-btn {
    grid-column: 2;
    grid-row: 2;
    width: 100%;
    max-width: none;
  }
}

@media (--wh-mobile) {
  .faq-block__trigger {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
  }

  .faq-block__question-block {
    width: auto;
    grid-column: 1;
  }

  .faq-block__item--open .faq-block__trigger {
    grid-template-rows: auto auto;
  }

  .faq-block__answer {
    grid-column: 1;
    grid-row: 2;
    padding-top: 12px;
    padding-left: calc(40px + 32px);
  }

  .faq-block__icon {
    grid-column: 2;
    grid-row: 1;
  }

  .faq-block__cta {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    gap: 16px;
  }

  .faq-block__cta-title {
    grid-column: auto;
    grid-row: auto;
    align-self: auto;
  }

  .faq-block__cta-title,
  .faq-block__cta-text,
  .faq-block__cta-btn {
    grid-column: auto;
    grid-row: auto;
  }

  .faq-block__cta-text {
    text-align: left;
  }

  .faq-block__cta-text-desktop {
    display: none;
  }

  .faq-block__cta-text-mobile {
    display: inline;
  }

  .faq-block__cta-btn {
    width: auto;
  }
}
</style>
