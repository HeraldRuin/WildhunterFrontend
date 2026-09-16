<script setup lang="ts">
const geography = [
  {
    title: 'Сибирь и Дальний Восток (Якутия, Камчатка, Красноярск)',
    text: 'На территории Сибири и Дальнего Востока добывают крупнейшего бурого медведя, снежного барана и соболя. Туры носят экспедиционный характер, часто с использованием вертолетной заброски.',
  },
  {
    title: 'Алтай, Саяны и Кавказ (Горные экспедиции)',
    text: 'Жемчужина трофейной охоты. Величественные пейзажи, трофейные маралы, архары и козероги. Сочетание спортивного интереса и альпинистского вызова.',
  },
  {
    title: 'Европейский Север и Карелия (Медведь, Лось, Боровая дичь)',
    text: 'Классическая таежная охота. Отличные условия для добычи медведя и лося, позволяющие совместить добычу зверя и полноценный отдых. Комфортные базы и развитая инфраструктура.',
  },
  {
    title: 'Юг России (Астрахань, Калмыкия)',
    text: 'Регион для охоты на гуся и утку. Миллионные стаи на пролете, плавневый заяц, шакал. Высокий уровень сервиса на частных охотничьих базах.',
  },
]

const gameTypes = [
  {
    title: 'Охота на копытных (Лось, Марал, Косуля, Кабан, Олень)',
    text: 'Классическое направление охотничьего туризма. Предлагаются туры на лося, кабана, а также охота на марала и изюбря. Проживание на оборудованных базах и работа профессиональных загонщиков гарантируют максимальный комфорт.',
  },
  {
    title: 'Трофейная охота на хищника (Медведь, Волк, Рысь, Росомаха)',
    text: 'Экстремальные и азартные направления, которые являются активным времяпрепровождением. Охота на бурого и белогрудого медведя организуется на овсяных полях, на приваде или с использованием собак. Для охоты на волка предлагаются туры с флажков и на ваб. Все мероприятия сопровождаются экспертами из самых опытных команд.',
  },
  {
    title: 'Охота на боровую и водоплавающую дичь (Глухарь, Тетерев, Гусь, Утка)',
    text: 'Классическая русская охота на глухаря на току, а также весенние, летние и осенние сезоны охоты на гуся в дельте Волги или Калмыкии. Обеспечивается установка скрадок, использование манков и организация полевой кухни непосредственно в угодьях.',
  },
  {
    title: 'Горная охота (Козерог, Архар, Тур)',
    text: 'Экспедиционные туры на Алтае, в Саянах и на Кавказе, где каждый маршрут пролегает через суровый горный край. Туры требуют хорошей физической подготовки. Программы включают акклиматизацию, работу горных егерей и использование вездеходов или лошадей для заброски в высокогорные районы.',
  },
]

const serviceItems = [
  {
    title: 'Проживание на охотничьих базах и кордонах',
    text: 'Размещение варьируется от уютных таежных кордонов с баней до VIP-лоджей, где для гостей созданы все удобства. Все базы оборудованы морозильными камерами для сохранения мяса.',
  },
  {
    title: 'Егерское сопровождение и техника',
    text: 'Безопасность и успех мероприятия гарантируются профессиональным егерским сопровождением. Предоставляются вездеходы, снегоходы, катера и квадроциклы для доставки в точку охоты.',
  },
  {
    title: 'Питание и полевая кухня',
    text: 'Организуется трехразовое горячее питание. При необходимости обустраивается полевая кухня непосредственно в угодьях.',
  },
  {
    title: 'Первичная разделка и консервация трофея',
    text: 'Егеря проводят первичную обработку (снятие шкуры, разделка туши, засолка мяса, консервация черепа) сразу после добычи для безопасной транспортировки.',
  },
]

const legalItems = [
  {
    title: 'Оформление лицензий и разрешений на добычу',
    text: 'Оформление всех необходимых разрешений производится заблаговременно, чтобы клиент мог получить документы к приезду.',
  },
  {
    title: 'Правила провоза охотничьего оружия (Авиа/ЖД/Авто)',
    text: 'Предоставляются подробные инструкции и помощь в оформлении документов для провоза оружия при наличии разрешения на хранение и ношение (РОХа) в самолете или поезде.',
  },
  {
    title: 'Помощь в приобретении патронов и временный ввоз',
    text: 'На месте можно заказать боеприпасы. Для иностранных граждан организуется полный цикл временного ввоза оружия через Росгвардию и Федеральную таможенную службу (ФТС).',
  },
]

const priceRows = [
  ['Кабан (с вышек/привады)', 'Тверская, Московская обл.', '5 000 ₽', '25 000 ₽'],
  ['Лось (загонная/с подхода)', 'Карелия, Ленинградская обл.', '7 000 ₽', '60 000 ₽'],
  ['Медведь бурый (на овсах)', 'Кировская, Тверская обл.', '10 000 ₽', '150 000 ₽'],
  ['Гусь (пролетный)', 'Астраханская область', '8 000 ₽', '15 000 ₽'],
  ['Марал (трофейный)', 'Алтай, Хакасия', '15 000 ₽', '250 000 ₽'],
]

const seasons = [
  {
    title: 'Весна (март–май)',
    text: 'Вальдшнеп, гусь, утка, глухарь на току.',
  },
  {
    title: 'Лето (август–сентябрь)',
    text: 'Степная и полевая дичь, начало охоты на копытных.',
  },
  {
    title: 'Осень (сентябрь–ноябрь)',
    text: 'Пик охоты на лося, кабана, медведя, гуся, пушного зверя.',
  },
  {
    title: 'Зима (декабрь–февраль)',
    text: 'Охота на волка (флажками и с подхода), медведя в берлоге, соболя.',
  },
]
</script>

<template>
  <div class="bases-seo">
    <section class="bases-seo__section">
      <div class="container bases-seo__inner">
        <h2 class="bases-seo__title">
          География угодий: лучшие регионы России для охоты
        </h2>
        <div class="bases-seo__cards">
          <article
            v-for="item in geography"
            :key="item.title"
            class="bases-seo__card"
          >
            <h3 class="bases-seo__card-title">{{ item.title }}</h3>
            <p class="bases-seo__card-text">{{ item.text }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="bases-seo__section bases-seo__section--muted">
      <div class="container bases-seo__inner">
        <h2 class="bases-seo__title">Охотничьи туры по видам дичи</h2>
        <p class="bases-seo__lead">
          Актуальные предложения включают проверенные охотничьи хозяйства с гарантированной высокой плотностью диких животных, профессиональной биотехнией и полным соблюдением законодательства. Мы готовы принять как индивидуальных охотников, так и участников групп.
        </p>
        <div class="bases-seo__cards">
          <article
            v-for="item in gameTypes"
            :key="item.title"
            class="bases-seo__card"
          >
            <h3 class="bases-seo__card-title">{{ item.title }}</h3>
            <p class="bases-seo__card-text">{{ item.text }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="bases-seo__section">
      <div class="container bases-seo__inner">
        <h2 class="bases-seo__title">
          Что входит в стоимость тура: сервис и инфраструктура
        </h2>
        <p class="bases-seo__lead">
          Организация охоты под ключ обеспечивает безупречный сервис на всех этапах.
        </p>
        <div class="bases-seo__cards">
          <article
            v-for="item in serviceItems"
            :key="item.title"
            class="bases-seo__card"
          >
            <h3 class="bases-seo__card-title">{{ item.title }}</h3>
            <p class="bases-seo__card-text">{{ item.text }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="bases-seo__section bases-seo__section--muted">
      <div class="container bases-seo__inner">
        <h2 class="bases-seo__title">Юридические вопросы и провоз оружия</h2>
        <p class="bases-seo__lead">
          Легальность является приоритетным условием работы. Все мероприятия проводятся строго в рамках Федерального закона «Об охоте».
        </p>
        <div class="bases-seo__cards bases-seo__cards--three">
          <article
            v-for="item in legalItems"
            :key="item.title"
            class="bases-seo__card"
          >
            <h3 class="bases-seo__card-title">{{ item.title }}</h3>
            <p class="bases-seo__card-text">{{ item.text }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="bases-seo__section">
      <div class="container bases-seo__inner">
        <h2 class="bases-seo__title">Ценообразование: стоимость охоты в России</h2>
        <h3 class="bases-seo__subtitle">Базовые цены на популярные туры</h3>
        <div class="bases-seo__table-wrap">
          <table class="bases-seo__table">
            <thead>
              <tr>
                <th>Вид охоты / Трофей</th>
                <th>Регион</th>
                <th>Оргсбор (за день)</th>
                <th>Трофейная часть (от)</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in priceRows"
                :key="row[0]"
              >
                <td>{{ row[0] }}</td>
                <td>{{ row[1] }}</td>
                <td>{{ row[2] }}</td>
                <td>{{ row[3] }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <h3 class="bases-seo__subtitle">Факторы, влияющие на итоговую стоимость</h3>
        <p class="bases-seo__lead">
          Базовые цены на сезон 2026 года зависят от длительности тура и размера трофея. На цену влияют трансфер, вертолетная заброска и дополнительные услуги таксидермиста. При бронировании нескольких туров сразу действует специальная скидка. Все направления доступны для бронирования.
        </p>
      </div>
    </section>

    <section class="bases-seo__section bases-seo__section--muted">
      <div class="container bases-seo__inner">
        <h2 class="bases-seo__title">Календарь охотника: сезонность туров</h2>
        <p class="bases-seo__lead">
          Календарь охотника поможет выбрать правильное время для выезда:
        </p>
        <div class="bases-seo__cards">
          <article
            v-for="item in seasons"
            :key="item.title"
            class="bases-seo__card"
          >
            <h3 class="bases-seo__card-title">{{ item.title }}</h3>
            <p class="bases-seo__card-text">{{ item.text }}</p>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.bases-seo__section {
  padding-block: 56px;
  background: var(--wh-white);
}

.bases-seo__section--muted {
  background: var(--wh-gray-100);
}

.bases-seo__inner.container {
  display: flex;
  flex-direction: column;
  gap: 28px;
  width: min(100% - 32px, 1600px);
}

.bases-seo__title {
  margin: 0;
  font-family: "UNCAGE", sans-serif;
  font-size: 36px;
  font-weight: 400;
  line-height: 120%;
  letter-spacing: -0.03em;
  text-align: center;
  text-transform: uppercase;
  color: var(--wh-gray-900);
}

.bases-seo__subtitle {
  margin: 8px 0 0;
  font-family: "Inter", sans-serif;
  font-size: 22px;
  font-weight: 600;
  line-height: 130%;
  letter-spacing: -0.03em;
  color: var(--wh-gray-900);
}

.bases-seo__lead {
  margin: 0 auto;
  max-width: 920px;
  font-family: "Inter", sans-serif;
  font-size: 18px;
  font-weight: 400;
  line-height: 140%;
  letter-spacing: -0.02em;
  text-align: center;
  color: var(--wh-gray-900);
}

.bases-seo__cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.bases-seo__cards--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.bases-seo__card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 100%;
  padding: 24px;
  border: 1px solid rgb(28 33 28 / 12%);
  border-radius: var(--wh-radius);
  background: var(--wh-white);
}

.bases-seo__card-title {
  margin: 0;
  font-family: "Inter", sans-serif;
  font-size: 20px;
  font-weight: 600;
  line-height: 130%;
  letter-spacing: -0.04em;
  color: var(--wh-gray-900);
}

.bases-seo__card-text {
  margin: 0;
  font-family: "Inter", sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 140%;
  letter-spacing: -0.02em;
  color: var(--wh-gray-600);
}

.bases-seo__table-wrap {
  overflow-x: auto;
  border: 1px solid rgb(28 33 28 / 12%);
  border-radius: var(--wh-radius);
}

.bases-seo__table {
  width: 100%;
  border-collapse: collapse;
  font-family: "Inter", sans-serif;
  font-size: 16px;
  line-height: 140%;
}

.bases-seo__table th,
.bases-seo__table td {
  padding: 14px 16px;
  text-align: left;
  vertical-align: top;
  border-bottom: 1px solid rgb(28 33 28 / 10%);
}

.bases-seo__table th {
  background: var(--wh-green);
  font-weight: 600;
  color: var(--wh-white);
  white-space: nowrap;
}

.bases-seo__table tbody tr:last-child td {
  border-bottom: none;
}

.bases-seo__table td:nth-child(3),
.bases-seo__table td:nth-child(4) {
  white-space: nowrap;
  font-weight: 600;
  color: var(--wh-gray-900);
}

@media (--wh-tablet) {
  .bases-seo__section {
    padding-block: 40px;
  }

  .bases-seo__title {
    font-size: 28px;
  }

  .bases-seo__cards,
  .bases-seo__cards--three {
    grid-template-columns: 1fr;
  }
}

@media (--wh-mobile) {
  .bases-seo__title {
    font-size: 24px;
  }

  .bases-seo__lead,
  .bases-seo__card-text {
    font-size: 16px;
    text-align: left;
  }

  .bases-seo__lead {
    text-align: left;
  }
}
</style>
