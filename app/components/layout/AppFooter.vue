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
  { label: 'Odnoklassniki', href: '#', icon: 'ok' },
  { label: 'Telegram', href: '#', icon: 'telegram' },
  { label: 'VK', href: '#', icon: 'vk' },
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
              <svg v-if="social.icon === 'ok'" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.8" />
                <path d="M8.5 12.5c1.2 1.4 2.4 2.1 3.5 2.1s2.3-.7 3.5-2.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
              <svg v-else-if="social.icon === 'telegram'" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 4L4 11l6 2 3 7 2-7 6-9z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6.5 8h3.2c3.1 0 5.6 2.5 5.6 5.6v4.8M6.5 8v10.4M6.5 8L4 5.5M9.7 18.4h3.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="footer__bottom">
      <div class="container footer__bottom-inner">
        <div class="footer__legal">
          <NuxtLink
            v-for="link in legalLinks"
            :key="link.to"
            :to="link.to"
            class="footer__legal-link"
          >
            {{ link.label }}
          </NuxtLink>
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
  margin: 0 0 6px;
  font-size: 0.98rem;
  font-weight: 700;
  line-height: 1.35;
  color: var(--wh-gray-900);
}

.footer__link {
  font-size: 0.92rem;
  line-height: 1.45;
  color: var(--wh-gray-500);
  transition: color 0.15s ease;
}

.footer__link:hover {
  color: var(--wh-gray-900);
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
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--wh-orange-500);
  color: var(--wh-white);
  transition: background 0.15s ease, transform 0.15s ease;
}

.footer__social:hover {
  background: var(--wh-orange-600);
  transform: translateY(-1px);
}

.footer__bottom {
  border-top: 1px solid var(--wh-gray-200);
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
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--wh-gray-500);
  text-decoration: underline;
  text-decoration-color: #000;
  text-underline-offset: 3px;
  transition: color 0.15s ease;
}

.footer__legal-link:hover {
  color: var(--wh-gray-900);
}

.footer__copyright {
  margin: 0;
  flex-shrink: 0;
  font-size: 0.8125rem;
  color: var(--wh-gray-500);
  white-space: nowrap;
}

@media (max-width: 1024px) {
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

@media (max-width: 768px) {
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
    margin-top: 8px;
  }

  .footer__bottom-inner {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding-block: 20px 28px;
  }

  .footer__legal {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 8px 20px;
  }

  .footer__copyright {
    white-space: normal;
  }
}
</style>
