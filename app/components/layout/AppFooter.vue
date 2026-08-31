<script setup lang="ts">
const columns = [
  {
    title: 'Охотникам',
    to: '/hunters',
    links: [
      // { label: 'Вопрос - ответ', to: '/faq' },
      // { label: 'Служба поддержки', to: '/support' },
    ],
  },
  {
    title: 'Охотохозяйствам',
    to: '/hunting-farms',
    links: [
      // { label: 'Вопрос - ответ', to: '/faq' },
      // { label: 'Служба поддержки', to: '/support' },
    ],
  },
  {
    title: 'Блог',
    to: '/blog',
    links: [
      // { label: 'Вопрос - ответ', to: '/faq' },
      // { label: 'Служба поддержки', to: '/support' },
    ],
  },
]

const legalLinks = [
  { label: 'Политика конфиденциальности', to: '/politika_konfidencialnosti' },
  { label: 'Согласие на обработку персональных данных', to: '/personal-data' },
  { label: 'Правила и условия', to: '/terms' },
  { label: 'Оферта', to: '/offer' },
]

</script>

<template>
  <footer class="footer">
    <div class="container footer__main">
      <div class="footer__grid">
        <div
          v-for="column in columns"
          :key="column.title"
          class="footer__column"
        >
          <h4 class="footer__title">
            <NuxtLink
              v-if="column.to"
              :to="column.to"
              class="footer__title-link"
            >
              {{ column.title }}
            </NuxtLink>
            <template v-else>
              {{ column.title }}
            </template>
          </h4>
          <NuxtLink
            v-for="link in column.links"
            :key="link.to"
            :to="link.to"
            class="footer__link"
          >
            {{ link.label }}
          </NuxtLink>
        </div>

        <div class="footer__column">
          <h4 class="footer__title">Контакты</h4>
          <a href="tel:+74994509596" class="footer__link">8 (499) 450-95-96</a>
          <a href="mailto:online@wild-hunter.ru" class="footer__link">online@wild-hunter.ru</a>
          <a href="mailto:wh.online@yandex.ru" class="footer__link">wh.online@yandex.ru</a>
          <span class="footer__link">г. Москва, Дмитровское ш., 60</span>
        </div>

        <div class="footer__column footer__column--social">
          <h4 class="footer__title">
            Присоединиться<br>
            к нашему сообществу
          </h4>
          <div class="footer__socials">
            <LayoutAppSocialLinks />
          </div>
        </div>
      </div>
    </div>

    <div class="footer__bottom">
      <div class="container footer__bottom-inner">
        <div class="footer__legal">
          <template v-for="(link, index) in legalLinks" :key="link.to">
            <NuxtLink
              :to="link.to"
              class="footer__legal-link"
            >
              {{ link.label }}
            </NuxtLink>
            <span
              v-if="index === 1 || index === 2"
              class="footer__legal-break"
              aria-hidden="true"
            />
          </template>
        </div>
        <p class="footer__copyright">
          © 2014–2026 гг. | wild-hunter.ru | Все права защищены.
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  width: 100%;
  background: var(--wh-gray);
}

.footer__main {
  padding-block: 56px 40px;
}

.footer__main.container,
.footer__bottom-inner.container {
  width: min(100% - 32px, 1600px);
}

.footer__grid {
  display: grid;

  grid-template-columns: repeat(4, minmax(0, 1fr)) max-content;
  gap: 32px;
}

.footer__column {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer__title {
  font-family: 'Inter', system-ui, sans-serif;
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--wh-black-text);
}

.footer__title-link {
  color: inherit;
  text-decoration: none;
}

.footer__link {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14px;
  line-height: 130%;
  font-weight: 400;
  color: var(--wh-black-text);
  transition: color 0.15s ease;
}

.footer__link:hover {
  color: var(--wh-black-text);
}

.footer__column--social .footer__title {
  max-width: none;
}

.footer__socials {
  margin-top: 4px;
}

.footer__bottom {

}

.footer__bottom-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding-block: 20px 24px;
}

.footer__legal {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
}

.footer__legal-link {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: 120%;
  letter-spacing: -0.05em;
  color: #888888;
  text-decoration: underline;
  text-decoration-color: #888888;
  text-underline-offset: 3px;
  transition: opacity 0.15s ease;
}

.footer__legal-link:hover {
  opacity: 0.75;
}

.footer__legal-break {
  display: none;
}

.footer__copyright {
  margin: 0;
  flex-shrink: 0;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: 120%;
  letter-spacing: -0.05em;
  color: #888888;
  white-space: nowrap;
}

@media (--wh-tablet) {
  .footer__grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    column-gap: 24px;
    row-gap: 32px;
  }

  .footer__column--social {
    grid-column: 1 / -1;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 24px;
  }

  .footer__column--social .footer__title {
    margin: 0;
    flex: 0 1 auto;
    max-width: 280px;
  }

  .footer__socials {
    margin-top: 0;
    flex-shrink: 0;
  }

  .footer__bottom-inner {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .footer__copyright {
    white-space: nowrap;
  }
}

@media (--wh-narrow) {
  .footer__main {
    padding-block: 40px 28px;
  }

  .footer__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 28px 20px;
  }

  .footer__column {
    gap: 8px;
  }

  .footer__title {
    margin-bottom: 4px;
  }

  .footer__column--social {
    grid-column: 1 / -1;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 0;
  }

  .footer__column--social .footer__title {
    max-width: none;
  }

  .footer__socials {
    margin-top: 16px;
  }

  .footer__bottom-inner {
    flex-direction: column;
    align-items: flex-start;
    gap: 24px;
    padding-block: 20px 28px;
  }

  .footer__legal {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 8px 20px;
  }

  .footer__legal-break {
    display: block;
    flex-basis: 100%;
    width: 0;
    height: 0;
  }

  .footer__copyright {
    white-space: normal;
  }
}
</style>
