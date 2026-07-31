<script setup lang="ts">
const columns = [
  {
    title: 'Охотникам',
    links: [
      { label: 'Вопрос - ответ', to: '/faq' },
      { label: 'Служба поддержки', to: '/support' },
    ],
  },
  {
    title: 'Охотохозяйствам',
    links: [
      { label: 'Вопрос - ответ', to: '/faq' },
      { label: 'Служба поддержки', to: '/support' },
    ],
  },
  {
    title: 'О компании',
    links: [
      { label: 'Вопрос - ответ', to: '/faq' },
      { label: 'Служба поддержки', to: '/support' },
    ],
  },
]

const legalLinks = [
  { label: 'Правила и условия', to: '/terms' },
  { label: 'Оферта', to: '/offer' },
  { label: 'Политика конфиденциальности', to: '/privacy' },
  { label: 'Согласие на обработку персональных данных', to: '/personal-data' },
]

const socials = [
  { label: 'Max', href: '#', src: '/icons/max.png' },
  { label: 'Telegram', href: '#', src: '/icons/telegram.png' },
  { label: 'VK', href: '#', src: '/icons/vk.png' },
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
          <h4 class="footer__title">{{ column.title }}</h4>
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
          <a href="tel:+79991234567" class="footer__link">+7 (999) 123-45-67</a>
          <a href="mailto:info@oxota.com" class="footer__link">info@oxota.com</a>
        </div>

        <div class="footer__column footer__column--social">
          <h4 class="footer__title">
            Присоединиться<br>
            к нашему сообществу
          </h4>
          <div class="footer__socials">
            <a
              v-for="social in socials"
              :key="social.label"
              :href="social.href"
              class="footer__social"
              :aria-label="social.label"
            >
              <img
                :src="social.src"
                :alt="social.label"
                width="37"
                height="36"
                loading="lazy"
              >
            </a>
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

.footer__grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
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
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

.footer__social {
  display: block;
  flex-shrink: 0;
  width: 37px;
  height: 36px;
  border-radius: 10px;
  overflow: hidden;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.footer__social img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.footer__social:hover {
  transform: translateY(-1px);
  opacity: 0.9;
}

.footer__bottom {
  /* border-top: 1px solid var(--wh-black-text); */
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
