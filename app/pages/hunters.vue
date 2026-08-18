<script setup lang="ts">
import type { BreadcrumbItem } from '~/types/breadcrumb'

definePageMeta({
  layout: 'home',
  path: '/hunters',
})

const { open: openRegisterModal } = useRegisterModal()

const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Главная', to: '/' },
  { label: 'Для охотников' },
]

useHead({
  title: 'Для охотников',
  meta: [
    {
      name: 'description',
      content: 'Онлайн-портал wild-hunter.ru для любителей охоты: прозрачная организация охот, бронирование и сообщество охотников.',
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
              Для<br>охотников
            </h1>
            <div class="hunters-copy">
              <p>
                Онлайн-портал wild-hunter.ru специально разрабатывается для любителей и ценителей охоты, наша цель автоматизировать и упорядочить взаимоотношения между охотниками и владельцами охотхозяйств (загородных баз).
              </p>
              <p>
                Мы разработали и внедряем абсолютно новый формат взаимоотношений в интернет-пространстве, общение и организацию охоты (включая проживание, питание и дополнительные услуги), что позволяет нашим клиентам получать абсолютно прозрачные и выгодные условия по организации групповых и индивидуальных охот и охотничьих туров, а загородным хозяйствам встречать новых и новых гостей!
              </p>
              <p>
                Всегда работаем с охотхозяйствами только напрямую, поэтому предлагаем самые выгодные условия!
              </p>
            </div>
          </div>

          <div class="hunters-features">
            <p class="hunters-copy__lead">
              Что вас ждет на портале в ближайшее время:
            </p>
            <ol class="hunters-list">
              <li>Создание индивидуальных и групповых мероприятий и охот.</li>
              <li>Полная автоматизация процесса подготовки и организации охоты. Выбор кого приглашать и брать с собой всегда остается только за вами!</li>
              <li>Различные регионы (от Москвы до «самых-до окраин»), любые сезоны и места проведения охоты, а также виды животных для добычи.</li>
              <li>Цены без дополнительных наценок и сборов. Возможность онлайн-подтверждений и оплат.</li>
              <li>Режимы полной конфиденциальности и приватности участников портала.</li>
              <li>Автоматизированное бронирование проживания каждого охотника (кто, с кем, период) и моментальные онлайн-подтверждения.</li>
              <li>Прозрачная калькуляция загонной охоты на каждого участника загона (предварительный заказ добычи, загон, разделка и т.д.)</li>
              <li>Автоматизированное оповещение всех участников до заезда на базу (кто добавился, кто выбыл, с каким оружием и с последующим пересчетом общей цены)</li>
              <li>Честный рейтинг охотхозяйств и качества проведения охоты на них, включая дополнительные услуги.</li>
              <li>Общение между участниками, обмен опытом и реальными мнениями</li>
              <li>Фотогалерея, истории достижений и трофеи каждого из участников в едином интернет-пространстве. Просто нажмите «Поделиться» и об этом узнают Ваши друзья.</li>
              <li>Интернет-магазин «Настоящий охотник» и автоматизированная система заказов/доставки.</li>
              <li>«Школа охотника» - уникальные программы обучения.</li>
              <li>И многое многое другое…</li>
            </ol>
            <p>
              С нашим порталом вы получите полноценное общение, грамотный подход в процессе организации охоты: новички станут полноценными охотниками, профессионалы приобретут дополнительный опыт и новые связи и, каждый гарантированно сможет добыть свой трофей. Незаменимым опытом, также для вас, может стать специально разработанные нами программы и тренинги в «Школе охотника».
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
            Уникальность мероприятий и прозрачность расчетов для охотников
          </h2>
          <div class="hunters-copy">
            <p>
              Wild-Hunter.ru предоставляет охотникам инструменты для самостоятельной организации охоты, включая выбор охотничьих угодий, согласование условий и управление участниками. Это позволяет создавать мероприятия, полностью соответствующие предпочтениям и требованиям охотников.
            </p>
            <p>
              Платформа обеспечивает полную прозрачность финансовых операций, связанных с организацией охоты. Все расходы и платежи фиксируются в системе, что позволяет участникам видеть распределение средств и избегать недоразумений.
            </p>
            <p>
              Также платформа по сути это социальная сеть охотников, где они могут общаться, собираться на коллективные охоты и хвалиться трофеями!
            </p>
            <button
              type="button"
              class="hunters-cta__button"
              @click="openRegisterModal"
            >
              Зарегистрироваться
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M7 17 17 7M8 7h9v9"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
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
  margin: 0 0 16px;
}

.hunters-features p:last-child {
  margin-bottom: 0;
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
  gap: 10px;
  min-width: 220px;
  margin-top: 8px;
  margin-inline: auto;
  padding: 12px 22px;
  border: none;
  border-radius: 1px;
  background: var(--wh-orange-500);
  color: var(--wh-white);
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.47;
  letter-spacing: 0;
  cursor: pointer;
  transition: background 0.15s ease;
}

.hunters-cta__button:hover {
  background: var(--wh-orange-600);
}

.hunters-cta__button svg {
  display: block;
  flex-shrink: 0;
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
    font-size: 12px;
  }
}
</style>
