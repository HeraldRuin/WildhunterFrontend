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
  title: 'Для охотохозяйств',
  meta: [
    {
      name: 'description',
      content: 'Wild-hunter.ru для охотхозяйств: канал продаж, гарантированные заезды и прозрачные расчёты.',
    },
  ],
})
</script>

<template>
  <div class="hunters-page">
    <section class="hunters-hero">
      <div class="hunters-hero__header">
        <HomeHeroHeader />
      </div>
      <div class="hunters-hero__title">
        <HomeHeroTitle />
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
              Для<br>охотхозяйств
            </h1>
            <div class="hunters-copy">
              <p>
                Онлайн-портал wild-hunter.ru специально разрабатывается для любителей и ценителей охоты, наша цель автоматизировать и упорядочить взаимоотношения между охотниками и владельцами охотхозяйств (загородных баз).
              </p>
              <p>
                Мы разработали и внедряем абсолютно новый формат взаимоотношений в интернет-пространстве, общение и организацию охоты (включая проживание, питание и дополнительные услуги), что позволяет нашим клиентам получать абсолютно прозрачные и выгодные условия по организации групповых и индивидуальных охот и охотничьих туров, а загородным хозяйствам встречать новых и новых гостей!
              </p>
              <p>
                Всегда работаем с охотхозяйствами только напрямую, поэтому предлагаем самые выгодные условия.
              </p>
            </div>
          </div>

          <div class="hunters-features">
            <p>
              Wild-hunter.ru предлагает выгодное сотрудничество по реализации услуг, предоставляемых вашим охотхозяйством, загородной базой или гостиницей: проживание, питание, организация охоты и т.д.
            </p>
            <p>
              Наш онлайн-портал - это эффективный, современный канал дистрибуции и продаж, уменьшающий количество не заездов и увеличивающий заполняемость охотхозяйств, c каждым днем набирающий всё большую популярность. Начать сотрудничество очень легко — просто пришлите нам письмо с Вашими контактными данными по электронной почте
              <a href="mailto:wh.online@yandex.ru">wh.online@yandex.ru</a>
              и наш менеджер свяжется с Вами для дополнительной консультации, обсуждения условий и заключения договора.
            </p>
            <p>
              Как итог, вы получаете гарантированные заезды с возможностью применять штрафные санкции к клиентам, а также прием наличных (или эквайринг) денежных средств в наших московских офисах, транзакции через наши платежные системы и терминалы.
            </p>
            <p>
              Вам будет доступна в режиме реального времени информация по заявкам охотников, желающих поехать на определенную охоту и выставить им свое предложение.
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
        <div class="container hunters-grid hunters-grid--equal">
          <h2 class="hunters-heading">
            Присоединяйтесь к нам прямо сейчас
          </h2>
          <p class="hunters-join__text">
            Будьте на связи с нами через удобные каналы общения! Мы доступны в популярных мессенджерах и социальных сетях, чтобы вы могли легко задать вопросы, получить поддержку или поделиться своими идеями
          </p>
        </div>
      </section>

      <section class="hunters-section hunters-section--split">
        <div class="container hunters-grid hunters-grid--equal">
          <h2 class="hunters-heading">
            Уникальность мероприятий и прозрачность расчетов
          </h2>
          <div class="hunters-copy">
            <p>
              Платформа обеспечивает полную прозрачность финансовых операций, связанных с организацией охоты. Все расходы и платежи фиксируются в системе, что позволяет участникам видеть распределение средств и избегать недоразумений.
            </p>
            <button
              type="button"
              class="hunters-cta__button"
              @click="openRegisterModal"
            >
              Зарегистрироваться
            </button>
          </div>
        </div>
      </section>
    </main>

    <LayoutAppFooter />
  </div>
</template>

<style scoped>
.hunters-hero {
  position: relative;
  min-height: 520px;
  background:
    linear-gradient(180deg, rgba(17, 24, 39, 0.08) 0%, rgba(17, 24, 39, 0.18) 100%),
    url('/images/headBlock.jpg') center / 100% 100% no-repeat;
  color: var(--wh-white);
}

.hunters-hero__header {
  display: flex;
  justify-content: center;
  padding-inline: 12px;
}

.hunters-hero__title {
  position: absolute;
  top: 300px;
  left: 50%;
  width: 100%;
  max-width: calc(100% - 24px);
  transform: translateX(-50%);
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

.hunters-section--join + .hunters-section {
  border-top: none;
  padding-top: 0;
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
  margin: 0;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 16px;
  line-height: 1.5;
}

.hunters-cta__button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 360px;
  margin-top: 8px;
  margin-inline: auto;
  padding: 14px 24px;
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

.hunters-cta__button:hover {
  background: var(--wh-orange-600);
  transform: var(--wh-button-hover-lift);
}

@media (--wh-tablet) {
  .hunters-hero {
    min-height: 500px;
  }

  .hunters-hero__title {
    top: 290px;
  }

  .hunters-grid--intro,
  .hunters-grid--equal {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .hunters-section {
    padding-block: 40px;
  }
}

@media (--wh-mobile) {
  .hunters-hero {
    min-height: 390px;
    background-size: cover;
  }

  .hunters-hero__title {
    top: 220px;
  }

  .hunters-section {
    padding-block: 32px;
  }

  .hunters-heading {
    font-size: 32px;
  }

  .hunters-cta__button {
    width: 100%;
    min-width: 0;
  }
}
</style>
