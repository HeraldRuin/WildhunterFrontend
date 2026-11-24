<script lang="ts">
import type { BlogFlowBlock } from '~/types/blog-article'

export type { BlogFlowBlock, BlogHeadingVariant, BlogImageVariant } from '~/types/blog-article'

/** Пример наполнения. Скопируйте массив и оставьте только нужные блоки. */
export const blogArticleTemplate: BlogFlowBlock[] = [
  { type: 'paragraph', text: 'Вводный абзац.' },
  { type: 'aside', text: 'Короткая врезка. <a href="/">Wild Hunter</a>.' },
  {
    type: 'image',
    variant: 'hero',
    src: '/images/blog/example.jpg',
    alt: 'Описание изображения',
    width: 800,
    height: 450,
  },
  { type: 'heading', variant: 'section', text: 'Заголовок раздела' },
  { type: 'paragraph', text: 'Текст раздела.' },
  { type: 'heading', variant: 'subsection', text: 'Подзаголовок' },
  { type: 'list', items: ['Пункт списка'] },
  { type: 'list', ordered: true, items: ['Первый пункт', 'Второй пункт'] },
  { type: 'heading', variant: 'minor', text: 'Мелкий заголовок' },
  { type: 'paragraph', text: 'Короткий абзац под мелким заголовком.' },
  {
    type: 'table',
    headers: ['Колонка', 'Значение'],
    rows: [['Строка', 'Текст ячейки']],
  },
  {
    type: 'lead',
    title: 'Заголовок лида',
    date: '01.01.2026 г.',
    blocks: [
      { type: 'paragraph', text: 'Текст справа от заголовка.' },
      { type: 'list', items: ['Пункт в лиде'] },
    ],
  },
  {
    type: 'split',
    media: [
      {
        type: 'image',
        variant: 'portrait',
        src: '/images/blog/example.jpg',
        alt: 'Фото в колонке',
        width: 560,
        height: 700,
      },
      { type: 'heading', variant: 'compact', text: 'Подпись под фото' },
    ],
    text: [
      { type: 'title', text: 'Заголовок внутри колонки' },
      { type: 'date', text: '01.01.2026 г.' },
      { type: 'paragraph', text: 'Текст колонки.' },
    ],
  },
  {
    type: 'split',
    reverse: true,
    media: [
      {
        type: 'image',
        variant: 'wide',
        src: '/images/blog/example.jpg',
        alt: 'Широкое фото',
        width: 800,
        height: 450,
      },
    ],
    text: [
      { type: 'heading', variant: 'display', text: 'Крупный заголовок' },
      { type: 'paragraph', text: 'Текст напротив фото.' },
    ],
  },
  {
    type: 'split',
    reverse: true,
    sign: true,
    media: [
      {
        type: 'image',
        variant: 'sign',
        src: '/images/blog/example.png',
        alt: 'Табличка',
        width: 800,
        height: 320,
      },
    ],
    text: [
      {
        type: 'table',
        headers: ['Вид', 'Срок'],
        rows: [['Кабан', 'август']],
      },
    ],
  },
  { type: 'heading', variant: 'display', text: 'Заголовок по центру' },
  {
    type: 'steps',
    columns: [
      [
        { type: 'heading', variant: 'subsection', text: 'Шаг 1' },
        { type: 'paragraph', text: 'Описание шага.' },
        {
          type: 'image',
          variant: 'step',
          src: '/images/blog/example.jpg',
          alt: 'Иллюстрация шага',
          width: 800,
          height: 800,
        },
      ],
      [
        { type: 'heading', variant: 'subsection', text: 'Шаг 2' },
        { type: 'paragraph', text: 'Описание шага.' },
      ],
      [
        { type: 'heading', variant: 'subsection', text: 'Шаг 3' },
        { type: 'paragraph', text: 'Описание шага.' },
      ],
    ],
  },
  {
    type: 'cards',
    items: [
      [
        { type: 'heading', variant: 'subsection', text: 'Карточка' },
        { type: 'paragraph', text: 'Текст карточки.' },
        { type: 'list', items: ['Пункт карточки'] },
      ],
    ],
  },
  {
    type: 'image',
    variant: 'links',
    src: '/images/blog/example.jpg',
    alt: 'Изображение перед списком ссылок',
    width: 1024,
    height: 682,
  },
  { type: 'cta', title: 'Заголовок призыва к регистрации' },
  { type: 'join' },
  {
    type: 'faq',
    title: 'Часто задаваемые вопросы',
    items: [
      { question: 'Вопрос?', answer: 'Ответ.' },
    ],
  },
]
</script>

<script setup lang="ts">
import type { BlogFlowBlock, BlogHeadingVariant, BlogImageVariant } from '~/types/blog-article'
import { normalizeBlogBlocks } from '~/utils/strip-blog-faq'

defineOptions({ name: 'BlogArticleTemplate' })

const props = withDefaults(defineProps<{
  blocks: BlogFlowBlock[]
  nested?: boolean
}>(), {
  nested: false,
})

const displayBlocks = computed(() => normalizeBlogBlocks(props.blocks))

const defaultJoinTitle = 'Присоединяйтесь к нам прямо сейчас'
const defaultJoinText = 'Будьте на связи с нами через удобные каналы общения! Мы доступны в популярных мессенджерах и социальных сетях, чтобы вы могли легко задать вопросы, получить поддержку или поделиться своими идеями'
const defaultFaqTitle = 'Часто задаваемые вопросы'
const defaultFaqLead = 'Мы подготовили подробные ответы на самые основные вопросы, которые возникают у наших подписчиков'
const defaultCtaButton = 'Зарегистрироваться'

function headingTag(variant: BlogHeadingVariant) {
  switch (variant) {
    case 'display':
    case 'compact':
    case 'section':
      return 'h2'
    case 'subsection':
      return 'h3'
    case 'minor':
      return 'h4'
    default: {
      const exhaustive: never = variant
      return exhaustive
    }
  }
}

function headingClass(variant: BlogHeadingVariant) {
  switch (variant) {
    case 'display':
      return 'blog-display'
    case 'compact':
      return 'blog-display blog-display--compact'
    case 'section':
    case 'subsection':
      return 'blog-subtitle'
    case 'minor':
      return 'blog-minor'
    default: {
      const exhaustive: never = variant
      return exhaustive
    }
  }
}

function imageClass(variant: BlogImageVariant) {
  switch (variant) {
    case 'hero':
      return 'blog-hero-image'
    case 'links':
      return 'blog-links-image'
    case 'portrait':
      return 'blog-split__image'
    case 'wide':
      return 'blog-split__image blog-split__image--wide'
    case 'sign':
      return 'blog-split__image blog-split__image--sign'
    case 'step':
      return 'blog-steps__image'
    default: {
      const exhaustive: never = variant
      return exhaustive
    }
  }
}
</script>

<template>
  <div
    class="blog-article-template"
    :class="{ 'blog-article-template--nested': nested }"
  >
    <template v-for="(block, index) in displayBlocks" :key="index">
      <p
        v-if="block.type === 'paragraph'"
        v-html="block.text"
      />

      <p
        v-else-if="block.type === 'aside'"
        class="blog-aside"
        v-html="block.text"
      />

      <component
        :is="headingTag(block.variant)"
        v-else-if="block.type === 'heading'"
        :class="headingClass(block.variant)"
        v-html="block.text"
      />

      <h1
        v-else-if="block.type === 'title'"
        class="blog-inline-title"
      >
        {{ block.text }}
      </h1>

      <p
        v-else-if="block.type === 'date'"
        class="blog-inline-date"
      >
        {{ block.text }}
      </p>

      <img
        v-else-if="block.type === 'image'"
        :class="imageClass(block.variant)"
        :src="block.src"
        :alt="block.alt"
        :width="block.width"
        :height="block.height"
      >

      <ul v-else-if="block.type === 'list' && !block.ordered">
        <li
          v-for="(item, itemIndex) in block.items"
          :key="itemIndex"
          v-html="item"
        />
      </ul>

      <ol v-else-if="block.type === 'list'">
        <li
          v-for="(item, itemIndex) in block.items"
          :key="itemIndex"
          v-html="item"
        />
      </ol>

      <div
        v-else-if="block.type === 'table'"
        class="blog-table-wrap"
      >
        <table>
          <thead>
            <tr>
              <th
                v-for="(header, headerIndex) in block.headers"
                :key="headerIndex"
                v-html="header"
              />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, rowIndex) in block.rows"
              :key="rowIndex"
            >
              <td
                v-for="(cell, cellIndex) in row"
                :key="cellIndex"
                v-html="cell"
              />
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-else-if="block.type === 'lead'"
        class="blog-lead"
      >
        <div class="blog-lead__head">
          <h1 class="blog-lead__title">{{ block.title }}</h1>
          <p class="blog-lead__date">{{ block.date }}</p>
        </div>
        <div class="blog-lead__copy">
          <BlogArticleTemplate :blocks="block.blocks" nested />
        </div>
      </div>

      <div
        v-else-if="block.type === 'split'"
        class="blog-split"
        :class="{
          'blog-split--reverse': block.reverse,
          'blog-split--table-sign': block.sign,
        }"
      >
        <div class="blog-split__media">
          <BlogArticleTemplate :blocks="block.media" nested />
        </div>
        <div class="blog-split__text">
          <BlogArticleTemplate :blocks="block.text" nested />
        </div>
      </div>

      <div
        v-else-if="block.type === 'steps'"
        class="blog-steps"
      >
        <div
          v-for="(column, columnIndex) in block.columns"
          :key="columnIndex"
          class="blog-steps__col"
        >
          <BlogArticleTemplate :blocks="column" nested />
        </div>
      </div>

      <div
        v-else-if="block.type === 'cards'"
        class="blog-blocks"
      >
        <section
          v-for="(card, cardIndex) in block.items"
          :key="cardIndex"
          class="blog-block"
        >
          <BlogArticleTemplate :blocks="card" nested />
        </section>
      </div>

      <section
        v-else-if="block.type === 'cta'"
        class="blog-cta"
      >
        <h2 class="blog-cta__title">{{ block.title }}</h2>
        <button
          type="button"
          class="blog-cta__button"
          data-register-cta
        >
          {{ block.button || defaultCtaButton }}
          <svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M4.5 11.5 11 5v5.2h1.5V2.5H4.8V4h5.1l-6.5 6.5 1.1 1z" /></svg>
        </button>
      </section>

      <section
        v-else-if="block.type === 'join'"
        class="blog-join"
      >
        <div class="blog-join__copy">
          <h2 class="blog-join__title">{{ block.title || defaultJoinTitle }}</h2>
          <p>{{ block.text || defaultJoinText }}</p>
        </div>
        <div class="blog-join__socials" aria-label="Социальные сети">
          <a class="blog-join__social" href="https://t.me/wild_hunter_ru" target="_blank" rel="noopener noreferrer nofollow" aria-label="Telegram" style="--social-color:#2AABEE">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M1.19434 10.1345C5.85934 8.12369 8.9693 6.7979 10.5243 6.15739C14.9693 4.3284 15.8918 4.01074 16.4943 4.0001C16.6268 3.99788 16.9218 4.03029 17.1143 4.18441C17.2743 4.3143 17.3193 4.48995 17.3418 4.61315C17.3618 4.73635 17.3893 5.01715 17.3668 5.23634C17.1268 7.73998 16.0843 13.8155 15.5543 16.6197C15.3318 17.8063 14.8893 18.2041 14.4618 18.2429C13.5318 18.3275 12.8268 17.6353 11.9268 17.0517C10.5193 16.1381 9.72432 15.5695 8.35682 14.6782C6.77682 13.648 7.80179 13.0817 8.70179 12.1565C8.93679 11.9143 13.0318 8.22932 13.1093 7.89509C13.1193 7.85328 13.1293 7.69742 13.0343 7.61529C12.9418 7.53291 12.8042 7.56111 12.7042 7.58337C12.5617 7.61504 10.3142 9.08655 5.95423 11.9976C5.31673 12.4316 4.73925 12.6431 4.21925 12.632C3.64925 12.6198 2.54932 12.3123 1.73182 12.0496C0.73182 11.7272 -0.0657192 11.5568 0.00428084 11.0093C0.0392808 10.7243 0.436844 10.4326 1.19434 10.1345Z" /></svg>
          </a>
          <a class="blog-join__social" href="https://vk.ru/wild_hunter_ru" target="_blank" rel="noopener noreferrer nofollow" aria-label="VK" style="--social-color:#0077FF">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M11.0158 17C4.25958 17 0.160951 12.1161 0 4H3.42207C3.52875 9.96227 6.1311 12.4886 8.12708 13.0083V4H11.406V9.1452C13.3308 8.9229 15.3455 6.58284 16.023 4H19.2514C18.7339 7.17565 16.5405 9.51571 14.9909 10.481C16.5424 11.262 19.0371 13.3047 20 17H16.4525C15.7039 14.5303 13.868 12.6173 11.4079 12.3569V17H11.0158Z" /></svg>
          </a>
          <a class="blog-join__social" href="https://wa.me/74994509596" target="_blank" rel="noopener noreferrer nofollow" aria-label="WhatsApp" style="--social-color:#25D366">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M13.608 2.325A7.88 7.88 0 0 0 7.998 0C3.625 0 .067 3.556.065 7.928c0 1.397.365 2.76 1.06 3.964L0 16l4.204-1.102a7.928 7.928 0 0 0 3.79.965h.004c4.37 0 7.93-3.557 7.93-7.93a7.88 7.88 0 0 0-2.32-5.608zm-5.61 12.2h-.003a6.583 6.583 0 0 1-3.355-.92l-.24-.143-2.496.654.666-2.43-.157-.25a6.573 6.573 0 0 1-1.007-3.508A6.6 6.6 0 0 1 8 1.338a6.55 6.55 0 0 1 4.66 1.934 6.55 6.55 0 0 1 1.93 4.662 6.6 6.6 0 0 1-6.592 6.59zm2.26-5.58c-.18-.068-.313-.1-.445.098s-.512.644-.627.777c-.116.132-.23.148-.43.05-.198-.1-.836-.31-1.593-.984-.59-.525-.987-1.174-1.102-1.373-.115-.198-.012-.305.087-.404.09-.09.2-.232.298-.348.1-.116.132-.198.198-.33.066-.133.033-.248-.017-.348-.05-.1-.446-1.074-.61-1.47-.162-.387-.325-.334-.447-.34a7.945 7.945 0 0 0-.38-.007.728.728 0 0 0-.53.247c-.18.2-.692.678-.692 1.653s.71 1.917.81 2.05c.098.132 1.396 2.133 3.384 2.99.473.205.842.327 1.13.418.474.15.906.13 1.248.08.38-.058 1.172-.48 1.338-.943.165-.463.165-.86.115-.942-.05-.083-.182-.133-.38-.232-.198-.1-1.172-.578-1.354-.644z" /></svg>
          </a>
          <a class="blog-join__social" href="https://youtube.com/@wh_online" target="_blank" rel="noopener noreferrer nofollow" aria-label="YouTube" style="--social-color:#FF0000">
            <svg viewBox="0 0 32 23" aria-hidden="true"><path fill="currentColor" d="M31.68 4.96s-.313-2.252-1.272-3.244C29.19.413 27.828.406 27.202.33 22.724 0 16.007 0 16.007 0h-.014S9.276 0 4.798.33c-.626.077-1.99.083-3.207 1.386C.633 2.708.32 4.96.32 4.96S0 7.61 0 10.255v2.48c0 2.648.32 5.293.32 5.293s.312 2.254 1.27 3.246c1.22 1.303 2.818 1.262 3.53 1.398C7.68 22.923 16 23 16 23s6.724-.01 11.202-.34c.625-.078 1.99-.084 3.206-1.387.96-.992 1.272-3.246 1.272-3.246s.32-2.645.32-5.292v-2.48c0-2.647-.32-5.294-.32-5.294z" /><path fill="#fff" d="M12.696 15.74V6.554l8.645 4.61-8.644 4.578z" /></svg>
          </a>
          <a class="blog-join__social" href="mailto:wh.online@yandex.ru" aria-label="Email" style="--social-color:#1c211c">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M17 3C18.6569 3 20 4.34315 20 6V14C20 15.6569 18.6569 17 17 17H3C1.34315 17 0 15.6569 0 14V6C0 4.34315 1.34315 3 3 3H17ZM10 9L3 5V7L10 11L17 7V5L10 9Z" /></svg>
          </a>
        </div>
      </section>

      <div
        v-else-if="block.type === 'text'"
        class="blog-article-text"
        v-html="block.content"
      />

      <section
        v-else-if="block.type === 'faq'"
        class="blog-faq"
      >
        <div class="blog-faq__head">
          <h2 class="blog-faq__title">{{ block.title || defaultFaqTitle }}</h2>
          <p class="blog-faq__lead">{{ block.lead || defaultFaqLead }}</p>
        </div>
        <div class="blog-faq__list">
          <details
            v-for="(item, itemIndex) in block.items"
            :key="itemIndex"
          >
            <summary>{{ item.question }}</summary>
            <p v-html="item.answer" />
          </details>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.blog-article-template--nested {
  display: contents;
}

.blog-faq {
  margin: 48px 0 0;
  padding-block: 8px 40px;
}

.blog-faq__head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 24px 40px;
  align-items: start;
  margin-bottom: 28px;
}

.blog-faq__title {
  margin: 0;
  font-family: Inter, system-ui, sans-serif;
  font-size: clamp(18px, 2vw, 24px);
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.02em;
  text-transform: uppercase;
}

.blog-faq__lead {
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
  text-align: right;
  color: #111;
}

.blog-faq__list {
  counter-reset: blog-faq;
  border-top: 1px solid rgb(28 33 28 / 20%);
}

.blog-faq details {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 40px;
  align-items: start;
  column-gap: clamp(16px, 3vw, 48px);
  margin: 0;
  padding: 22px 0;
  border: 0;
  border-bottom: 1px solid rgb(28 33 28 / 20%);
  border-radius: 0;
  background: transparent;
}

.blog-faq details:not([open]) {
  align-items: center;
}

.blog-faq details:not([open]) > :not(summary) {
  display: none;
}

.blog-faq summary {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  align-items: start;
  gap: 32px;
  min-width: 0;
  padding: 0;
  cursor: pointer;
  color: var(--wh-black-text);
  font-family: Inter, system-ui, sans-serif;
  font-size: 24px;
  font-weight: 600;
  line-height: 130%;
  letter-spacing: -0.05em;
  list-style: none;
}

.blog-faq summary::-webkit-details-marker {
  display: none;
}

.blog-faq summary::marker {
  content: '';
}

.blog-faq summary::before {
  content: counter(blog-faq);
  counter-increment: blog-faq;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: var(--wh-green);
  color: var(--wh-white);
  font-family: Inter, system-ui, sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.9px;
}

.blog-faq summary::after {
  content: '';
  position: absolute;
  top: 22px;
  right: 0;
  width: 40px;
  height: 40px;
  background: url('/icons/Property%201=icon%20plus.png') center / contain no-repeat;
}

.blog-faq details:not([open]) summary::after {
  top: 50%;
  transform: translateY(-50%);
}

.blog-faq details[open] summary::after {
  background-image: url('/icons/line-md_plus.png');
}

.blog-faq details[open]::details-content,
.blog-faq details[open] > p {
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
}

.blog-faq details[open] > p {
  margin: 0;
  padding: 0;
  color: #000;
  font-family: Inter, system-ui, sans-serif;
  font-size: 18px;
  font-weight: 400;
  line-height: 130%;
  letter-spacing: -0.05em;
}

@media (--wh-tablet) {
  .blog-faq__head {
    grid-template-columns: 1fr;
  }

  .blog-faq__lead {
    text-align: left;
  }
}

@media (--wh-mobile) {
  .blog-faq details {
    grid-template-columns: minmax(0, 1fr) 40px;
    align-items: start;
  }

  .blog-faq summary {
    grid-column: 1;
    grid-row: 1;
    gap: 16px;
    font-size: 18px;
  }

  .blog-faq summary::after,
  .blog-faq details:not([open]) summary::after {
    top: 22px;
    transform: none;
  }

  .blog-faq details[open]::details-content,
  .blog-faq details[open] > p {
    grid-column: 1;
    grid-row: 2;
  }

  .blog-faq details[open] > p {
    padding-top: 12px;
    padding-left: calc(40px + 16px);
    font-size: 16px;
  }
}
</style>
