<script setup lang="ts">
import type { BreadcrumbItem } from '~/types/breadcrumb'

definePageMeta({
  layout: 'home',
  path: '/hunting-farms',
})

const { open: openRegisterModal } = useRegisterModal()

const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Главная', to: '/' },
  { label: 'Для охотохозяйств' },
]

useHead({
  title: 'Добавить охотхозяйство в каталог | wild-hunter.ru',
  meta: [
    {
      name: 'description',
      content: 'Онлайн-портал wild-hunter.ru предлагает выгодное сотрудничество по реализации услуг, предоставляемых вашим охотхозяйством, загородной базой или гостиницей ✔️ Добавьте их в наш каталог',
    },
  ],
})

const isSearching = ref(false)

async function handleSearch(payload: Record<string, string>) {
  if (isSearching.value) {
    return
  }

  isSearching.value = true

  try {
    await navigateTo({
      path: '/bases',
      query: payload,
    })
  }
  catch {
    isSearching.value = false
  }
}
</script>

<template>
  <div class="hunters-page">
    <section class="hunters-hero">
      <div class="hunters-hero__header">
        <HomeHeroHeader />
      </div>
      <div class="hunters-hero__panel">
        <p class="hunters-hero__heading">Организуйте охоту с понятными расходами для каждого</p>
        <HomeHeroSearchForm :loading="isSearching" @search="handleSearch" />
      </div>
    </section>

    <main class="hunters-main">
      <div class="hunters-breadcrumbs">
        <div class="container">
          <AppBreadcrumbs :items="breadcrumbs" />
        </div>
      </div>

      <section class="hunters-section hunters-section--split">
        <div class="container">
          <div class="hunters-grid hunters-grid--intro">
            <h1 class="hunters-heading">
              Платформа для размещения охотничьих туров
            </h1>
            <div class="hunters-copy">
              <p>
                Онлайн-портал wild-hunter.ru специально разработан для любителей и ценителей охоты, наша цель — автоматизировать и упорядочить взаимоотношения между охотниками и владельцами охотхозяйств (загородных баз).
              </p>
              <p>
                Мы разработали и внедряем абсолютно новый формат взаимоотношений в интернет-пространстве: общение и организацию групповой и индивидуальной охоты (включая проживание, питание и дополнительные услуги). Это позволяет нашим клиентам получать абсолютно прозрачные и выгодные условия, а загородным хозяйствам — встречать новых гостей!
              </p>
              <p>
                Всегда работаем с охотхозяйствами только напрямую, поэтому предлагаем самые выгодные условия, а для клиентов системы действуют только цены без дополнительных сборов.
              </p>
            </div>
          </div>

          <div class="hunters-features">
            <p>
              Wild-hunter.ru предлагает выгодное сотрудничество по реализации услуг, предоставляемых вашим охотхозяйством, загородной базой или гостиницей: проживание, питание, организация охоты и т.д.
            </p>
            <p>
              Наш онлайн-портал — это эффективный, современный канал дистрибуции и продаж, уменьшающий количество незаездов и увеличивающий заполняемость охотхозяйств, с каждым днем набирающий всё большую популярность.
            </p>
            <p>
              Начать сотрудничество очень легко — просто пришлите нам письмо с вашими контактными данными по электронной почте
              <a href="mailto:wh.online@yandex.ru">wh.online@yandex.ru</a>,
              и наш менеджер свяжется для дополнительной консультации, обсуждения условий и заключения договора.
            </p>
            <p>
              Как итог, охотхозяйство получает гарантированные заезды с возможностью применять штрафные санкции к клиентам, а также прием наличных (или эквайринг) денежных средств в наших московских офисах, транзакции через платежные системы и терминалы.
            </p>
            <p>
              Вам будет доступна в режиме реального времени информация по заявкам охотников, желающих поехать на определенную охоту, и возможность выставить им свое предложение.
            </p>
            <p>
              Удобство нашей системы также заключается в том, что все услуги клиент бронирует заранее, а вы обладаете полным контролем над заказом услуг и смело планируете мероприятия!
            </p>
            <p>
              При проведении загонной охоты вы можете заранее выставлять особые условия (какое оружие, запрет на определенные виды животных, количество загонов и т.д.), информировать о правилах поведения на ваших базах и на проводимых вами охотах. В результате, на портале появится обширная информация, интересующая вас и клиентов, которая будет являться предварительным договором между вами.
            </p>
          </div>
        </div>
      </section>

      <section class="hunters-section hunters-section--join">
        <div class="container hunters-join">
          <h2 class="hunters-heading">
            Присоединяйтесь к нам прямо сейчас
          </h2>
          <div class="hunters-join__row">
            <p class="hunters-join__text">
              Будьте на связи с нами через удобные каналы общения! Мы доступны в популярных мессенджерах и социальных сетях, чтобы вы могли легко задать вопросы, получить поддержку или поделиться своими идеями
            </p>
            <LayoutAppSocialLinks />
          </div>
        </div>
      </section>

      <section class="hunters-section hunters-section--unique">
        <div class="container hunters-grid hunters-grid--equal">
          <h2 class="hunters-heading">
            Уникальность мероприятий и прозрачность расчетов
          </h2>
          <div class="hunters-unique__copy">
            <p>
              Платформа обеспечивает полную прозрачность финансовых операций, связанных с организацией охоты. Все расходы и платежи фиксируются в системе, что позволяет участникам видеть распределение средств и избегать недоразумений.
            </p>
            <button
              type="button"
              class="hunters-cta__button"
              @click="openRegisterModal"
            >
              Зарегистрироваться
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path fill="currentColor" d="M4.5 11.5 11 5v5.2h1.5V2.5H4.8V4h5.1l-6.5 6.5 1.1 1z" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <section class="hunters-banner">
        <div class="container">
          <img
            class="hunters-banner__image"
            src="/images/hunting-farms-hunter.webp"
            alt="Охотник с биноклем в охотничьих угодьях"
            width="960"
            height="480"
          >
        </div>
      </section>

      <section class="hunters-section hunters-section--article">
        <div class="container hunters-article">
          <div class="hunters-copy">
            <p>
              Современный цифровой агрегатор выступает связующим звеном между охотхозяйствами и охотниками, предлагая комплексное решение для автоматизации бронирования и его полной прозрачности.
            </p>
            <p>
              Интеграция специализированного программного обеспечения позволяет охотничьим хозяйствам выйти на новый уровень клиентского сервиса, обеспечивая прозрачность сделок и легальность всех этапов организации охоты.
            </p>
          </div>

          <div class="hunters-article__group">
            <h2 class="hunters-heading">Как работает система для охотничьих хозяйств</h2>
            <div class="hunters-subsections">
              <article class="hunters-subsection">
                <h3 class="hunters-subheading">Регистрация и создание личного кабинета угодий</h3>
                <p>
                  Процесс начинается с верификации юридического лица или индивидуального предпринимателя. В личном кабинете формируется детализированный профиль охотничьего хозяйства, включающий географическое расположение, площадь угодий, инфраструктуру и контактные данные. Это формирует базовый уровень доверия со стороны конечных пользователей.
                </p>
              </article>
              <article class="hunters-subsection">
                <h3 class="hunters-subheading">Добавление тура: типы животных, виды охоты, сезонность, стоимость и условия проживания</h3>
                <p>
                  Инструментарий нашей платформы позволяет конструировать предложения с высокой степенью детализации. Указываются конкретные виды дичи (лось, кабан, медведь, косуля, водоплавающая дичь), допустимые сроки охоты, тип размещения для проживания (от эконом-вариантов до премиум-сегмента), а также перечень включенных или дополнительных услуг: работа егеря, трансфер, питание и разделка трофеев.
                </p>
              </article>
              <article class="hunters-subsection">
                <h3 class="hunters-subheading">Управление заявками и прием безопасных онлайн-платежей</h3>
                <p>
                  Встроенная CRM-система онлайн-платформы wild-hunter.ru агрегирует входящие запросы (бронирования) в едином окне. Платформа поддерживает интеграцию с платежными шлюзами, обеспечивая безопасное резервирование доступных мест и прозрачное финансовое взаимодействие без риска неоплаты или незаездов.
                </p>
              </article>
            </div>
          </div>

          <div class="hunters-article__group">
            <h2 class="hunters-heading">Возможности для охотников: единый каталог туров</h2>
            <div class="hunters-subsections">
              <article class="hunters-subsection">
                <h3 class="hunters-subheading">Популярные направления</h3>
                <p>
                  Каталог охватывает широкий географический спектр, включая популярные регионы России (Тверская область, Ярославская область, Алтай, Карелия, Сибирь и другие), территории Беларуси и другие страны СНГ. Каждое предложение сопровождается фотоматериалами и детальным описанием условий на базе.
                </p>
              </article>
              <article class="hunters-subsection">
                <h3 class="hunters-subheading">Умные фильтры поиска</h3>
                <p>
                  Семантический поиск и система навигации позволяют пользователям фильтровать предложения по ключевым атрибутам: типу животных, виду охоты (загонная, с подхода, трофейная), региону, бюджету, уровню комфорта и наличию свободных мест на конкретные даты.
                </p>
              </article>
            </div>
          </div>

          <div class="hunters-article__group">
            <h2 class="hunters-heading">Преимущества размещения на платформе</h2>
            <div class="hunters-subsections">
              <article class="hunters-subsection">
                <h3 class="hunters-subheading">Прямой контакт с целевой аудиторией без посредников</h3>
                <p>
                  Исключение цепочки посредников снижает конечную стоимость для охотника и увеличивает прямую маржинальность для охотничьего хозяйства. Прямая коммуникация минимизирует искажение информации об условиях предоставления услуг и их реальном перечне.
                </p>
              </article>
              <article class="hunters-subsection">
                <h3 class="hunters-subheading">Маркетинговое продвижение и аналитика спроса</h3>
                <p>
                  Платформа в онлайн-режиме в личном кабинете предоставляет партнерам (охотхозяйствам и их собственникам) аналитические отчеты по бронированиям, оплатам, просмотрам, позволяя корректировать ценовую политику и наполнение предложений в зависимости от сезонных трендов и загрузки базы.
                </p>
              </article>
            </div>
          </div>

          <div class="hunters-article__group">
            <h2 class="hunters-heading">Требования к размещаемым турам: чек-лист для партнеров</h2>
            <div class="hunters-subsections">
              <article class="hunters-subsection">
                <h3 class="hunters-subheading">Необходимые документы</h3>
                <p>(Перечень документов для верификации и подключения к системе)</p>
              </article>
              <article class="hunters-subsection">
                <h3 class="hunters-subheading">Стандарты описания услуг</h3>
                <p>
                  Описание должно содержать исчерпывающую информацию о базе (охотхозяйстве), размещении (тип коттеджа или домика), питании, предоставляемом арендном оборудовании, видам охоты, порядке оформления охотничьих путевок. Четкость формулировок снижает количество уточняющих вопросов и повышает конверсию в бронирование.
                </p>
              </article>
            </div>
          </div>

          <div class="hunters-article__group">
            <h2 class="hunters-heading">Доверие и репутация: отзывы охотников и партнеров</h2>
            <p class="hunters-subsection__text">
              Система модерации отзывов формирует репутационный рейтинг охотничьих хозяйств. Подтвержденные отзывы пользователей, реально забронировавших и посетивших угодья и базы, служат ключевым фактором принятия решения для новых клиентов. Высокий рейтинг напрямую влияет на позицию в поисковой выдаче внутри платформы.
            </p>
          </div>

          <div class="hunters-article__group">
            <h2 class="hunters-heading">Часто задаваемые вопросы</h2>
            <article class="hunters-subsection">
              <h3 class="hunters-subheading">Как гарантируется безопасность финансовой сделки?</h3>
              <p>
                Используются механизмы безопасной сделки (эскроу-счета) или предоплаты через защищенные платежные шлюзы с фискализацией чеков. Средства перечисляются охотничьему хозяйству (базе) в соответствии с условиями договора.
              </p>
            </article>
          </div>

          <p class="hunters-subsection__text">
            Интеграция в цифровую платформу и агрегатор охотничьих туров представляет собой стратегический шаг для модернизации бизнеса охотничьего хозяйства. Заполнение профиля и публикация актуальных предложений открывает доступ к новой целевой аудитории, ищущей легальные, прозрачные и комфортно организованные охотничьи туры. Регистрация профиля охотничьего хозяйства или поиск подходящего тура доступны в основном меню платформы wild-hunter.ru.
          </p>
        </div>
      </section>
    </main>

    <LayoutAppFooter />
  </div>
</template>

<style scoped>
.hunters-hero {
  position: relative;
  z-index: 2;
  min-height: calc(680px * 2 / 3);
  background:
    linear-gradient(180deg, rgba(17, 24, 39, 0.08) 0%, rgba(17, 24, 39, 0.18) 100%),
    url('/images/headBlock.jpg') center / 100% 100% no-repeat;
  color: var(--wh-white);
}

.hunters-hero__header {
  position: relative;
  z-index: 20;
  display: flex;
  justify-content: center;
  padding-inline: 12px;
  pointer-events: none;
}

.hunters-hero__header > * {
  pointer-events: auto;
}

.hunters-hero__panel {
  position: absolute;
  top: calc(268px * 2 / 3);
  left: 50%;
  z-index: 21;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  width: 1500px;
  max-width: calc(100% - 24px);
  transform: translateX(-50%);
}

.hunters-hero__heading {
  width: 100%;
  margin: 0;
  text-align: center;
  color: var(--wh-white);
  font-family: 'Manrope', system-ui, sans-serif;
  font-size: 48px;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45), 0 4px 18px rgba(0, 0, 0, 0.35);
}

.hunters-main {
  background: #f0efec;
  color: var(--wh-black-text);
}

.hunters-breadcrumbs {
  background: #e9e7e3;
  padding-block: 16px;
}

.hunters-section {
  padding-block: 50px;
}

.hunters-section + .hunters-section {
  border-top: 1px solid rgba(28, 33, 28, 0.14);
}

.hunters-section--join + .hunters-section--unique {
  border-top: none;
}

.hunters-join {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.hunters-join__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px 48px;
}

.hunters-section--unique {
  background: #e6e4df;
}

.hunters-unique__copy {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 28px;
}

.hunters-unique__copy p {
  margin: 0;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
}

.hunters-grid {
  display: grid;
  align-items: start;
  gap: 28px 32px;
}

.hunters-grid--intro {
  grid-template-columns: 1fr 1fr;
}

.hunters-features {
  margin-top: 56px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
}

.hunters-features p {
  margin: 0 0 24px;
}

.hunters-features p:last-child {
  margin-bottom: 0;
}

.hunters-features a {
  font-weight: 700;
  color: inherit;
  text-decoration: underline;
}

.hunters-grid--equal {
  grid-template-columns: minmax(260px, 2fr) minmax(0, 3fr);
  column-gap: 64px;
}

.hunters-heading {
  margin: 0;
  font-family: 'UNCAGE', sans-serif;
  font-size: 24px;
  font-weight: 400;
  line-height: 1.1;
  letter-spacing: 0;
  color: var(--wh-black-text);
}

.hunters-copy {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
}

.hunters-copy p {
  margin: 0 0 24px;
}

.hunters-copy p:last-child {
  margin-bottom: 0;
}

.hunters-copy__lead {
  margin-bottom: 16px;
  font-weight: 700;
}

.hunters-list {
  margin: 0 0 24px;
  padding-left: 22px;
}

.hunters-list li + li {
  margin-top: 10px;
}

.hunters-join__text {
  max-width: 640px;
  margin: 0;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 16px;
  line-height: 1.5;
}

.hunters-section--article {
  border-top: 1px solid rgba(28, 33, 28, 0.14);
}

.hunters-article {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.hunters-article__group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hunters-subsections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hunters-subheading {
  margin: 0 0 10px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--wh-black-text);
}

.hunters-subsection p,
.hunters-subsection__text {
  margin: 0;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
}

.hunters-banner {
  padding-block: 0 50px;
  line-height: 0;
}

.hunters-banner__image {
  display: block;
  width: 100%;
  height: auto;
  margin-inline: auto;
}

.hunters-cta__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: flex-end;
  gap: 10px;
  width: fit-content;
  margin: 0;
  padding: 14px 28px;
  border: none;
  border-radius: var(--wh-radius-lg);
  background: var(--wh-orange-500);
  color: var(--wh-white);
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.47;
  letter-spacing: 0;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.hunters-cta__button svg {
  width: 16px;
  height: 16px;
}

.hunters-cta__button:hover {
  background: var(--wh-orange-600);
  transform: var(--wh-button-hover-lift);
}

@media (--wh-tablet) {
  .hunters-hero {
    min-height: calc(760px * 2 / 3);
  }

  .hunters-hero__panel {
    top: calc(240px * 2 / 3);
    width: 100%;
    max-width: none;
    padding-inline: 12px;
  }

  .hunters-hero__heading {
    font-size: 32px;
  }

  .hunters-grid--intro,
  .hunters-grid--equal {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .hunters-join__row {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  .hunters-section {
    padding-block: 40px;
  }

  .hunters-banner {
    padding-block: 0 40px;
  }
}

@media (--wh-mobile) {
  .hunters-hero {
    min-height: 0;
    padding-bottom: 32px;
    background-size: cover;
  }

  .hunters-hero__panel {
    position: static;
    top: auto;
    width: 100%;
    margin-top: 28px;
    transform: none;
    gap: 20px;
  }

  .hunters-hero__heading {
    font-size: 26px;
  }

  .hunters-section {
    padding-block: 32px;
  }

  .hunters-banner {
    padding-block: 0 32px;
  }

  .hunters-heading {
    font-size: 32px;
  }

  .hunters-cta__button {
    align-self: stretch;
    width: 100%;
  }
}
</style>
