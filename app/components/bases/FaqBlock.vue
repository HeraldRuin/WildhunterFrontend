<script setup lang="ts">
interface FaqTable {
  headers: string[]
  rows: string[][]
}

interface FaqItem {
  id: number
  question: string
  lead?: string
  numbered?: Array<{ title: string, text: string }>
  bullets?: string[]
  table?: FaqTable
  after?: string
  schemaText: string
}

const items: FaqItem[] = [
  {
    id: 1,
    question: 'Что нужно учитывать при выборе охотничьего тура?',
    numbered: [
      {
        title: 'Статус угодий.',
        text: 'Хозяйство должно иметь закрепленные права на охотничьи угодья и легальную базу. Охота в общедоступных охотничьих угодьях (ООУТ) без путевки квалифицируется как браконьерство.',
      },
      {
        title: 'Квалификация егеря.',
        text: 'От специалиста зависит не только наличие трофея, но и безопасность. Егерь обязан знать повадки зверя, рельеф местности и правила техники безопасности.',
      },
      {
        title: 'Плотность дичи (биотехния).',
        text: 'На основе данных о биотехнии качественное хозяйство ведет подкормку, строит солонцы и регулирует численность хищников, что гарантирует результат.',
      },
      {
        title: 'Логистика.',
        text: 'Необходимо оценить расстояние от аэропорта или вокзала до угодий. Иногда низкая стоимость тура компенсируется высокими расходами на бензин и заброску.',
      },
      {
        title: 'Политика по подранкам.',
        text: 'Заранее уточняется, как хозяйство компенсирует или штрафует за подранка, и входит ли в стоимость работа с собаками для его добора.',
      },
    ],
    schemaText: 'При выборе тура важно проверить статус угодий и легальность базы, квалификацию егеря, плотность дичи и биотехнию, логистику до угодий и политику хозяйства по подранкам.',
  },
  {
    id: 2,
    question: 'Что не входит в базовую цену тура?',
    lead: 'При бронировании рекомендуется уточнять состав пакета. В него могут не входить:',
    bullets: [
      'Трансфер от областного центра до базы (иногда требуется заказ вертолета или вездехода).',
      'Покупка патронов (на базах стоимость может отличаться от городской).',
      'Ветеринарные справки на вывоз мяса и трофеев (оформляются в государственных ветеринарных клиниках).',
      'Чаевые егерскому составу (принято оставлять 10-15% от стоимости трофея).',
      'Штраф за недобор (если тур заявлен как гарантированный, но трофей не добыт по вине охотника).',
    ],
    schemaText: 'В базовую цену могут не входить трансфер до базы, патроны, ветеринарные справки, чаевые егерям и штраф за недобор.',
  },
  {
    id: 3,
    question: 'Возможна ли охота для иностранных граждан?',
    lead: 'Да. Для иностранных граждан обеспечивается:',
    bullets: [
      'Оформление официальных приглашений.',
      'Согласование временного ввоза оружия с Росгвардией и Федеральной таможенной службой (ФТС).',
      'Предоставление переводчика-егеря.',
      'Помощь в оформлении таксидермии и экспорта трофеев (разрешение Минприроды, CITES).',
    ],
    schemaText: 'Да. Для иностранных граждан оформляются приглашения, временный ввоз оружия, переводчик-егерь и помощь с экспортом трофеев.',
  },
  {
    id: 4,
    question: 'Какие виды охоты возможны и как выбрать?',
    lead: 'Выбирая вид охоты, стоит ориентироваться на свою физическую подготовку и навыки.',
    table: {
      headers: [
        'Способ охоты',
        'Целевой трофей',
        'Физическая нагрузка',
        'Требования к оружию / навыкам',
      ],
      rows: [
        ['С вышки / засидки', 'Кабан, медведь, косуля', 'Минимальная (сидячая)', 'Гладкоствольное/нарезное, ночная оптика (по закону), терпение.'],
        ['С подхода', 'Лось, козерог, тур', 'Высокая (трекинг, горы)', 'Нарезное оружие, дальномер, хорошая физподготовка, знание местности.'],
        ['Загоном', 'Лось, кабан, олень', 'Средняя (перемещение по номерам)', 'Гладкоствольное/нарезное, строгое соблюдение ТБ, командная работа.'],
        ['На вабу / с манком', 'Гусь, утка, глухарь', 'Низкая (стационарная)', 'Гладкоствольное, знание манков, умение маскироваться (скрадок).'],
      ],
    },
    schemaText: 'Способ охоты выбирают по физической подготовке: с вышки, с подхода, загоном или на вабу. От этого зависят трофей, нагрузка и требования к оружию.',
  },
  {
    id: 5,
    question: 'Какие запреты действуют на охоте?',
    lead: 'Обязательным условием является строгое соблюдение Правил охоты в РФ. На организуемых турах категорически запрещены:',
    bullets: [
      'Стрельба в условиях недостаточной видимости (сумерки, туман) вне оборудованных и зарегистрированных вышек.',
      'Отстрел самок (за исключением специально отведенных сезонов и регионов) и молодняка.',
      'Использование браконьерских методов (петли, капканы на копытных, использование приборов ночного видения вне вышек).',
    ],
    after: 'Нарушение данных правил ведет к аннулированию тура без возврата средств и передаче материалов в правоохранительные органы. Приоритет отдается культурной и законной охоте.',
    schemaText: 'Запрещены стрельба при плохой видимости вне вышек, отстрел самок и молодняка вне специальных сезонов, а также браконьерские методы. Нарушение аннулирует тур без возврата средств.',
  },
]

const openId = ref<number | null>(null)
const faqIconPlus = '/icons/Property%201=icon%20plus.png'
const faqIconMinus = '/icons/line-md_plus.png'

function toggleItem(id: number) {
  openId.value = openId.value === id ? null : id
}

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map(item => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.schemaText,
          },
        })),
      }),
    },
  ],
})
</script>

<template>
  <section class="faq-block">
    <div class="container faq-block__inner">
      <h2 class="faq-block__title">Часто задаваемые вопросы</h2>
    </div>

    <div class="faq-block__panel">
      <div class="container faq-block__panel-inner">
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
              <img
                :src="openId === item.id ? faqIconMinus : faqIconPlus"
                alt=""
                width="40"
                height="40"
                class="faq-block__icon"
                aria-hidden="true"
              >
            </button>
            <div
              v-if="openId === item.id"
              class="faq-block__answer"
            >
              <p v-if="item.lead">{{ item.lead }}</p>
              <ol v-if="item.numbered">
                <li
                  v-for="row in item.numbered"
                  :key="row.title"
                >
                  <strong>{{ row.title }}</strong>
                  {{ row.text }}
                </li>
              </ol>
              <ul v-if="item.bullets">
                <li
                  v-for="row in item.bullets"
                  :key="row"
                >
                  {{ row }}
                </li>
              </ul>
              <div
                v-if="item.table"
                class="faq-block__table-wrap"
              >
                <table class="faq-block__table">
                  <thead>
                    <tr>
                      <th
                        v-for="header in item.table.headers"
                        :key="header"
                      >
                        {{ header }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="row in item.table.rows"
                      :key="row[0]"
                    >
                      <td
                        v-for="cell in row"
                        :key="cell"
                      >
                        {{ cell }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-if="item.after">{{ item.after }}</p>
            </div>
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
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding-block: 48px 64px;
  border-top: 1px solid rgb(28 33 28 / 14%);
  background: transparent;
}

.faq-block__inner.container,
.faq-block__panel-inner.container {
  width: min(100% - 32px, 1240px);
}

.faq-block__title {
  margin: 0;
  font-family: UNCAGE;
  font-weight: 400;
  font-style: normal;
  font-size: 28px;
  line-height: 1.15;
  text-transform: uppercase;
  text-align: left;
  color: var(--wh-black-text);
}

.faq-block__panel {
  width: 100%;
}

.faq-block__item {
  border-bottom: 1px solid rgb(28 33 28 / 20%);
}

.faq-block__trigger {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: clamp(16px, 3vw, 48px);
  width: 100%;
  padding: 22px 0;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
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
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0 0 24px calc(40px + 32px);
  color: #000;
  font-family: "Inter", sans-serif;
  font-size: 18px;
  font-weight: 400;
  line-height: 140%;
  letter-spacing: -0.05em;
}

.faq-block__answer p,
.faq-block__answer ol,
.faq-block__answer ul {
  margin: 0;
}

.faq-block__answer ol,
.faq-block__answer ul {
  padding-left: 20px;
}

.faq-block__answer li + li {
  margin-top: 8px;
}

.faq-block__table-wrap {
  overflow-x: auto;
}

.faq-block__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 15px;
  line-height: 140%;
}

.faq-block__table th,
.faq-block__table td {
  padding: 10px 12px;
  text-align: left;
  vertical-align: top;
  border: 1px solid rgb(28 33 28 / 12%);
}

.faq-block__table th {
  background: var(--wh-green);
  color: var(--wh-white);
  font-weight: 600;
  white-space: nowrap;
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
  .faq-block__title {
    font-size: 28px;
  }

  .faq-block__question {
    font-size: 18px;
  }

  .faq-block__answer {
    padding-left: 0;
    font-size: 16px;
  }

  .faq-block__cta {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    gap: 16px;
  }

  .faq-block__cta-title,
  .faq-block__cta-text,
  .faq-block__cta-btn {
    grid-column: auto;
    grid-row: auto;
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
