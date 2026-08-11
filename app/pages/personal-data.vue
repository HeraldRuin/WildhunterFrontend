<script setup lang="ts">
definePageMeta({
  layout: 'home',
})

useHead({
  title: 'Согласие на обработку персональных данных',
  meta: [
    {
      name: 'description',
      content: 'Согласие на обработку персональных данных ООО «Лесной главбух».',
    },
  ],
})
</script>

<template>
  <div class="personal-data-page">
    <section class="personal-data-hero">
      <div class="personal-data-hero__header">
        <HomeHeroHeader />
      </div>
      <div class="personal-data-hero__title">
        <HomeHeroTitle />
      </div>
    </section>

    <main class="personal-data-content container">
      <h1>Согласие на обработку персональных данных</h1>

      <p>Настоящим, в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных», свободно, своей волей и в своём интересе, я выражаю согласие Обществу с ограниченной ответственностью «Лесной главбух» (ИНН: 9713032347, e-mail: wh.online@yandex.ru) на обработку моих персональных данных.</p>

      <section>
        <h2>Перечень персональных данных, на обработку которых даётся согласие:</h2>
        <ul>
          <li>фамилия, имя, отчество;</li>
          <li>контактный номер телефона;</li>
          <li>адрес электронной почты;</li>
          <li>данные о годовом обороте бизнеса, указанные мной в анкете или заявке;</li>
          <li>иные сведения, предоставленные мной добровольно при использовании Сайта.</li>
        </ul>
      </section>

      <section>
        <h2>Примечание:</h2>
        <p>Если информация о годовом обороте относится ко мне как к индивидуальному предпринимателю, самозанятому или физическому лицу, я подтверждаю согласие на её обработку как персональных данных в соответствии с ФЗ № 152-ФЗ.</p>
      </section>

      <section>
        <h2>Цели обработки персональных данных:</h2>
        <ul>
          <li>установление и поддержание обратной связи;</li>
          <li>организация интервью и взаимодействие по проектам компании «Лесной главбух»;</li>
          <li>анализ, отбор и сопровождение участников мероприятий и программ;</li>
          <li>статистический и аналитический учёт (в обезличенном виде);</li>
          <li>улучшение качества сервиса и интерфейсов Сайта.</li>
        </ul>
      </section>

      <section>
        <h2>Действия с персональными данными:</h2>
        <p>Я даю согласие на следующие действия с моими персональными данными: сбор, запись, систематизация, накопление, хранение, уточнение (обновление), извлечение, использование, обезличивание, блокирование, удаление, уничтожение.</p>
      </section>

      <section>
        <h2>Условия обработки и хранения:</h2>
        <ul>
          <li>Обработка осуществляется с использованием автоматизированных и неавтоматизированных средств.</li>
          <li>Персональные данные хранятся на серверах, расположенных на территории Российской Федерации.</li>
          <li>Срок хранения — не более 5 лет с момента последнего взаимодействия, либо до достижения целей обработки, либо до отзыва согласия — в зависимости от того, что наступит раньше.</li>
        </ul>
      </section>

      <section>
        <h2>Передача и трансграничная передача:</h2>
        <ul>
          <li>Персональные данные не передаются третьим лицам, за исключением случаев, предусмотренных законодательством Российской Федерации.</li>
          <li>Трансграничная передача персональных данных не осуществляется.</li>
        </ul>
      </section>

      <section>
        <h2>Отзыв согласия:</h2>
        <p>Согласие может быть отозвано мной в любое время путём направления уведомления:</p>
        <ul>
          <li>в письменной форме — по адресу: г. Москва, Дмитровское ш., 60;</li>
          <li>либо в форме электронного документа — на e-mail: wh.online@yandex.ru.</li>
        </ul>
        <p>Отзыв согласия не влияет на законность обработки, осуществлённой до момента его отзыва.</p>
      </section>

      <section>
        <h2>Использование файлов cookie:</h2>
        <p>Я уведомлён(а) и соглашаюсь, что при посещении Сайта wild-hunter.ru оператор может использовать cookie-файлы, сохраняемые на моём устройстве.</p>
        <p>Cookie используются для:</p>
        <ul>
          <li>обеспечения корректной работы сайта;</li>
          <li>хранения пользовательской сессии;</li>
          <li>анализа поведения на Сайте (если подключены аналитические сервисы).</li>
        </ul>
        <p>Обработка cookie осуществляется в соответствии с Политикой конфиденциальности. Я вправе отключить cookie в настройках браузера.</p>
      </section>

      <section>
        <h2>Информированность пользователя:</h2>
        <p>Я подтверждаю, что до момента предоставления настоящего согласия:</p>
        <ul>
          <li>ознакомлен(а) с содержанием и условиями Политики конфиденциальности, размещённой на Сайте;</li>
          <li>понимаю цели, способы и условия обработки моих персональных данных;</li>
          <li>уведомлён(а) о своих правах в соответствии с законодательством Российской Федерации.</li>
        </ul>
      </section>

      <p>Настоящее согласие вступает в силу с момента его предоставления и действует до его отзыва.</p>
    </main>

    <LayoutAppFooter />
  </div>
</template>

<style scoped>
.personal-data-hero {
  position: relative;
  min-height: 520px;
  background:
    linear-gradient(180deg, rgba(17, 24, 39, 0.08) 0%, rgba(17, 24, 39, 0.18) 100%),
    url('/images/headBlock.jpg') center / 100% 100% no-repeat;
  color: var(--wh-white);
}

.personal-data-hero__header {
  display: flex;
  justify-content: center;
  padding-inline: 12px;
}

.personal-data-hero__title {
  position: absolute;
  top: 300px;
  left: 50%;
  width: 100%;
  max-width: calc(100% - 24px);
  transform: translateX(-50%);
}

.personal-data-content {
  max-width: 1200px;
  padding-block: 40px 72px;
  color: var(--wh-black-text);
}

.personal-data-content h1 {
  font-family: 'UNCAGE', sans-serif;
  font-weight: 400;
  text-transform: uppercase;
  margin: 0 0 24px;
  font-size: 24px;
  line-height: 1.2;
  text-align: center;
}

.personal-data-content h2 {
  margin: 24px 0 18px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.45;
  text-transform: none;
}

.personal-data-content p,
.personal-data-content li {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.5;
}

.personal-data-content p {
  margin: 0 0 16px;
  text-align: justify;
}

.personal-data-content ul {
  margin: 0 0 18px;
  padding-left: 20px;
}

.personal-data-content li + li {
  margin-top: 5px;
}

@media (--wh-tablet) {
  .personal-data-hero {
    min-height: 500px;
  }

  .personal-data-hero__title {
    top: 290px;
  }

  .personal-data-content {
    max-width: 900px;
    padding-block: 32px 64px;
  }
}

@media (--wh-mobile) {
  .personal-data-hero {
    min-height: 390px;
    background-size: cover;
  }

  .personal-data-hero__title {
    top: 220px;
  }

  .personal-data-content {
    padding-block: 24px 48px;
  }

  .personal-data-content h1 {
    font-size: 20px;
  }

  .personal-data-content p,
  .personal-data-content li {
    font-size: 13px;
    text-align: left;
  }
}
</style>
