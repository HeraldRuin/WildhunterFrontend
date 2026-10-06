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
              Для<br>охотников
            </h1>
            <div class="hunters-copy">
              <p>
                Онлайн-портал wild-hunter.ru специально разрабатывается для любителей и ценителей охоты, наша цель автоматизировать и упорядочить взаимоотношения между охотниками и владельцами охотхозяйств (загородных баз).
              </p>
              <p>
                Мы разработали и внедряем абсолютно новый формат взаимоотношений в интернет-пространстве, общение и организацию охоты (включая проживание, питание и дополнительные услуги), что позволяет нашим клиентам получать абсолютно прозрачные и выгодные условия по организации групповых и индивидуальных охот и охотничьих туров, а загородным хозяйствам встречать новых и новых охотников!
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
            Уникальность мероприятий и прозрачность расчетов для охотников
          </h2>
          <div class="hunters-unique__copy">
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
    </main>

    <LayoutAppFooter />
  </div>
</template>

<style scoped>
.hunters-hero {
  position: relative;
  z-index: 2;
  min-height: 680px;
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
  top: 268px;
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
  max-width: 640px;
  margin: 0;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 16px;
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
    min-height: 760px;
  }

  .hunters-hero__panel {
    top: 240px;
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
