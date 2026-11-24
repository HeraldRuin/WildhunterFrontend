<script setup lang="ts">
import type { BreadcrumbItem } from '~/types/breadcrumb'
import { descriptionFromHeading } from '~/utils/metaDescription'

definePageMeta({
  layout: 'home',
  key: route => route.path,
})

const route = useRoute()
const slug = computed(() => {
  const param = route.params.slug
  return Array.isArray(param) ? String(param[0] || '') : String(param || '')
})

const { blogs } = useApi()

function httpStatus(error: unknown): number {
  if (!error || typeof error !== 'object') {
    return 0
  }

  const record = error as { statusCode?: number, status?: number }
  return Number(record.statusCode || record.status || 0)
}

const { data: article, error } = await useAsyncData(
  () => `blog-article-${slug.value}`,
  () => {
    if (!slug.value) {
      return Promise.resolve(null)
    }

    return blogs.getBlog(slug.value)
  },
)

if (!slug.value || httpStatus(error.value) === 404 || (!error.value && !article.value)) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Страница не найдена',
    fatal: true,
  })
}

if (error.value || !article.value) {
  throw createError({
    statusCode: httpStatus(error.value) || 500,
    statusMessage: 'Не удалось загрузить статью',
    fatal: true,
  })
}

const post = article.value

const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Главная', to: '/' },
  { label: 'Блог', to: '/blog/' },
  { label: post.title },
]

const { open: openRegisterModal } = useRegisterModal()

/** Кнопки внутри v-html не имеют обработчиков, ловим клик делегированием */
function onBodyClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  if (target?.closest('[data-register-cta]')) {
    openRegisterModal()
  }
}

useHead({
  title: post.title,
  meta: [
    {
      name: 'description',
      content: post.description || descriptionFromHeading(post.title),
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
      path: '/bases/',
      query: payload,
    })
  }
  catch {
    isSearching.value = false
  }
}
</script>

<template>
  <div class="blog-article">
    <section class="blog-article__hero">
      <div class="blog-article__header">
        <HomeHeroHeader />
      </div>
      <div class="blog-article__hero-panel">
        <p class="blog-article__hero-heading">Организуйте охоту с понятными расходами для каждого</p>
        <HomeHeroSearchForm :loading="isSearching" @search="handleSearch" />
      </div>
    </section>

    <div class="blog-article__main">
      <div class="container blog-article__frame">
        <AppBreadcrumbs
          :items="breadcrumbs"
          class="blog-article__breadcrumbs"
        />
        <div class="blog-article__content">
        <img
          v-if="!post.blocks.length && post.image"
          class="blog-article__image"
          :src="post.image"
          :alt="post.title"
          width="800"
          height="450"
        >
        <div
          v-if="post.blocks.length"
          class="blog-article__body"
          @click="onBodyClick"
        >
          <BlogArticleTemplate :blocks="post.blocks" />
        </div>
        </div>
      </div>
    </div>

    <LayoutAppFooter />
  </div>
</template>

<style scoped>
.blog-article__hero {
  position: relative;
  z-index: 2;
  min-height: 680px;
  background:
    linear-gradient(180deg, rgba(17, 24, 39, 0.08) 0%, rgba(17, 24, 39, 0.18) 100%),
    url('/images/headBlock.webp') center / 100% 100% no-repeat;
  color: var(--wh-white);
}

.blog-article__header {
  position: relative;
  z-index: 30;
  display: flex;
  justify-content: center;
  padding-inline: 12px;
  pointer-events: none;
}

.blog-article__header > * {
  pointer-events: auto;
}

.blog-article__hero-panel {
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

.blog-article__hero-heading {
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

.blog-article__main {
  overflow-x: clip;
  background: var(--wh-white);
}

.blog-article__frame.container {
  width: min(100% - 32px, 1800px);
  padding-block: 48px 0;
}

.blog-article__breadcrumbs {
  margin: 0 0 28px 22px;
}

.blog-article__content {
  max-width: 1100px;
  margin-inline: auto;
  color: #111;
}

.blog-article__content h1 {
  margin: 0 0 16px;
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 700;
  font-size: clamp(22px, 3.2vw, 34px);
  line-height: 1.25;
  letter-spacing: -0.02em;
  text-transform: uppercase;
  text-align: center;
}

.blog-article__date {
  margin: 0 0 36px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.4;
  text-align: center;
  color: #111;
}

.blog-article__image {
  display: block;
  width: 100%;
  height: auto;
  margin-bottom: 32px;
  object-fit: cover;
}

.blog-article__body {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 16px;
  line-height: 1.55;
  color: #111;
}

.blog-article__body :deep(p) {
  margin: 0 0 18px;
}

.blog-article__body :deep(.blog-aside) {
  margin: 8px 0 28px;
  padding: 16px 24px;
  border-left: 3px solid var(--wh-orange-500);
  background: #f6f4ef;
  font-style: italic;
  text-align: center;
}

.blog-article__body :deep(.blog-inline-title) {
  margin: 0 0 12px;
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 700;
  font-size: clamp(22px, 3vw, 32px);
  line-height: 1.25;
  letter-spacing: -0.02em;
  text-transform: none;
  text-align: left;
}

.blog-article__body :deep(.blog-inline-date) {
  margin: 0 0 24px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.4;
  text-align: left;
  color: #111;
}

.blog-article__body :deep(.blog-article-template:not(.blog-article-template--nested) > .blog-inline-title) {
  margin: 0 0 16px;
  font-size: clamp(22px, 3.2vw, 34px);
  text-transform: uppercase;
  text-align: center;
}

.blog-article__body :deep(.blog-article-template:not(.blog-article-template--nested) > .blog-inline-date) {
  margin: 0 0 36px;
  text-align: center;
}

.blog-article__body :deep(a) {
  color: #1a5fb4;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.blog-article__body :deep(.blog-lead) {
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
  gap: 24px 48px;
  align-items: start;
  margin: 0 0 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid #e0ddd6;
}

.blog-article__body :deep(.blog-lead__title) {
  margin: 0;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: clamp(20px, 2.4vw, 26px);
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.02em;
  text-transform: uppercase;
}

.blog-article__body :deep(.blog-lead__date) {
  margin: 8px 0 0;
  font-size: 15px;
}

.blog-article__body :deep(.blog-lead__copy p) {
  margin: 0 0 16px;
}

.blog-article__body :deep(.blog-cta) {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 24px 40px;
  align-items: center;
  width: 100vw;
  max-width: 100vw;
  margin: 40px calc(50% - 50vw);
  padding: 40px max(24px, calc((100vw - 1100px) / 2 + 16px));
  background: #f2f0eb;
}

.blog-article__body :deep(.blog-cta__title) {
  margin: 0;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: clamp(18px, 2vw, 24px);
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.02em;
  text-transform: uppercase;
}

.blog-article__body :deep(.blog-cta__button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  justify-self: start;
  min-width: 260px;
  padding: 14px 24px;
  border: none;
  border-radius: var(--wh-radius-lg);
  background: var(--wh-orange-500);
  color: var(--wh-white);
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.47;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.blog-article__body :deep(.blog-cta__button:hover) {
  background: var(--wh-orange-600);
  transform: var(--wh-button-hover-lift);
}

.blog-article__body :deep(.blog-cta__button svg) {
  width: 16px;
  height: 16px;
}

.blog-article__body :deep(.blog-minor) {
  margin: 20px 0 6px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.35;
}

.blog-article__body :deep(.blog-subtitle) {
  margin: 28px 0 14px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.35;
  text-transform: none;
  text-align: left;
  letter-spacing: 0;
}

.blog-article__body :deep(.blog-blocks) {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  margin: 8px 0 28px;
}

.blog-article__body :deep(.blog-block) {
  padding: 20px 22px 8px;
  background: var(--wh-white);
  border: 1px solid var(--wh-field-border);
  border-radius: var(--wh-radius);
  box-shadow: var(--wh-shadow);
}

.blog-article__body :deep(.blog-block .blog-subtitle) {
  margin: 0 0 12px;
}

.blog-article__body :deep(.blog-block p) {
  margin-bottom: 12px;
}

.blog-article__body :deep(.blog-block ul) {
  margin-bottom: 12px;
}

.blog-article__body :deep(.blog-display) {
  margin: 40px 0 20px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: clamp(18px, 2.2vw, 24px);
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.02em;
  text-transform: uppercase;
  text-align: center;
}

.blog-article__body :deep(.blog-display--compact) {
  margin: 24px 0 16px;
  font-size: clamp(15px, 1.6vw, 18px);
}

.blog-article__body :deep(.blog-split) {
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
  gap: 40px 48px;
  align-items: start;
  margin: 40px 0 24px;
}

.blog-article__body :deep(.blog-split:first-child) {
  margin-top: 0;
}

.blog-article__body :deep(.blog-split--reverse) {
  grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr);
}

.blog-article__body :deep(.blog-split--reverse .blog-split__media) {
  order: 2;
}

.blog-article__body :deep(.blog-split--reverse .blog-split__text) {
  order: 1;
}

.blog-article__body :deep(.blog-split__image) {
  display: block;
  width: 100%;
  height: auto;
  margin: 0 0 8px;
  object-fit: cover;
  aspect-ratio: 4 / 5;
}

.blog-article__body :deep(.blog-split__image--wide) {
  aspect-ratio: 16 / 9;
}

.blog-article__body :deep(.blog-split__image--sign) {
  aspect-ratio: auto;
  object-fit: contain;
  background: #000;
}

.blog-article__body :deep(.blog-split--table-sign) {
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 0.65fr);
  align-items: center;
}

.blog-article__body :deep(.blog-steps) {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 28px 32px;
  margin: 28px 0 36px;
  align-items: start;
}

.blog-article__body :deep(.blog-steps__image) {
  display: block;
  width: 100%;
  height: auto;
  margin: 16px 0 0;
  object-fit: cover;
}

.blog-article__body :deep(.blog-links-image) {
  display: block;
  width: 100%;
  max-width: 900px;
  height: auto;
  margin: 0 auto 24px;
  object-fit: cover;
}

.blog-article__body :deep(.blog-hero-image) {
  display: block;
  width: 100%;
  height: auto;
  margin: 0 0 28px;
  object-fit: cover;
}

.blog-article__body :deep(ol) {
  margin: 0 0 18px;
  padding-left: 22px;
}

.blog-article__body :deep(ol li) {
  margin-bottom: 8px;
}

.blog-article__body :deep(.blog-table-wrap) {
  overflow-x: auto;
  margin: 0 0 20px;
}

.blog-article__body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  line-height: 1.4;
}

.blog-article__body :deep(th),
.blog-article__body :deep(td) {
  padding: 10px 12px;
  border: 1px solid #111;
  text-align: left;
  vertical-align: top;
}

.blog-article__body :deep(th) {
  font-weight: 700;
  background: transparent;
}

.blog-article__body :deep(ul) {
  margin: 0 0 18px;
  padding-left: 22px;
}

.blog-article__body :deep(li) {
  margin-bottom: 8px;
}

.blog-article__body :deep(.blog-faq) {
  margin: 48px 0 0;
  padding-block: 8px 40px;
}

.blog-article__body :deep(.blog-faq__head) {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 24px 40px;
  align-items: start;
  margin-bottom: 28px;
}

.blog-article__body :deep(.blog-faq__title) {
  margin: 0;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: clamp(18px, 2vw, 24px);
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.02em;
  text-transform: uppercase;
}

.blog-article__body :deep(.blog-faq__lead) {
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
  text-align: right;
  color: #111;
}

.blog-article__body :deep(.blog-faq__list) {
  counter-reset: blog-faq;
  border-top: 1px solid rgb(28 33 28 / 20%);
}

.blog-article__body :deep(.blog-faq details) {
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

.blog-article__body :deep(.blog-faq details:not([open])) {
  align-items: center;
}

.blog-article__body :deep(.blog-faq details:not([open]) > :not(summary)) {
  display: none;
}

.blog-article__body :deep(.blog-faq summary) {
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

.blog-article__body :deep(.blog-faq summary::-webkit-details-marker) {
  display: none;
}

.blog-article__body :deep(.blog-faq summary::marker) {
  content: '';
}

.blog-article__body :deep(.blog-faq summary::before) {
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

.blog-article__body :deep(.blog-faq summary::after) {
  content: '';
  position: absolute;
  top: 22px;
  right: 0;
  width: 40px;
  height: 40px;
  background: url('/icons/Property%201=icon%20plus.png') center / contain no-repeat;
}

.blog-article__body :deep(.blog-faq details:not([open]) summary::after) {
  top: 50%;
  transform: translateY(-50%);
}

.blog-article__body :deep(.blog-faq details[open] summary::after) {
  background-image: url('/icons/line-md_plus.png');
}

.blog-article__body :deep(.blog-faq details[open]::details-content),
.blog-article__body :deep(.blog-faq details[open] > p) {
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
}

.blog-article__body :deep(.blog-faq details[open] > p) {
  margin: 0;
  padding: 0;
  color: #000;
  font-family: Inter, system-ui, sans-serif;
  font-size: 18px;
  font-weight: 400;
  line-height: 130%;
  letter-spacing: -0.05em;
}

.blog-article__body :deep(.blog-join) {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  gap: 24px 40px;
  align-items: center;
  width: 100vw;
  max-width: 100vw;
  margin: 48px calc(50% - 50vw) 0;
  padding: 40px max(24px, calc((100vw - 1100px) / 2 + 16px));
  background: #f2f0eb;
}

.blog-article__body :deep(.blog-join__title) {
  margin: 0 0 12px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: clamp(18px, 2vw, 24px);
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.02em;
  text-transform: uppercase;
}

.blog-article__body :deep(.blog-join__copy p) {
  margin: 0;
}

.blog-article__body :deep(.blog-join__socials) {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;
}

.blog-article__body :deep(.blog-join__social) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--social-color, #111);
  border-radius: 999px;
  color: var(--social-color, #111);
  text-decoration: none;
}

.blog-article__body :deep(.blog-join__social:hover) {
  background: color-mix(in srgb, var(--social-color, #111) 12%, transparent);
}

.blog-article__body :deep(.blog-join__social svg) {
  width: 20px;
  height: 20px;
}

.blog-article__body :deep(.blog-contacts) {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 24px 40px;
  align-items: start;
  width: 100vw;
  max-width: 100vw;
  margin: 0 calc(50% - 50vw);
  padding: 40px max(24px, calc((100vw - 1100px) / 2 + 16px));
  background: #f2f0eb;
}

.blog-article__body :deep(.blog-contacts__title) {
  margin: 0;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: clamp(18px, 2vw, 24px);
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.02em;
  text-transform: uppercase;
}

.blog-article__body :deep(.blog-contacts__info) {
  text-align: right;
}

.blog-article__body :deep(.blog-contacts__info p) {
  margin: 0 0 8px;
}

.blog-article__body :deep(.blog-contacts__info a) {
  color: #111;
}

@media (--wh-tablet) {
  .blog-article__hero {
    min-height: 760px;
  }

  .blog-article__hero-panel {
    top: 240px;
    width: 100%;
    max-width: none;
    padding-inline: 12px;
  }

  .blog-article__hero-heading {
    font-size: 32px;
  }

  .blog-article__body :deep(.blog-split) {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .blog-article__body :deep(.blog-steps) {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .blog-article__body :deep(.blog-blocks) {
    grid-template-columns: 1fr;
  }

  .blog-article__body :deep(.blog-split__image) {
    aspect-ratio: 16 / 10;
  }

  .blog-article__body :deep(.blog-faq__head),
  .blog-article__body :deep(.blog-join),
  .blog-article__body :deep(.blog-contacts),
  .blog-article__body :deep(.blog-lead),
  .blog-article__body :deep(.blog-cta) {
    grid-template-columns: 1fr;
  }

  .blog-article__body :deep(.blog-faq__lead),
  .blog-article__body :deep(.blog-contacts__info) {
    text-align: left;
  }

  .blog-article__body :deep(.blog-join__socials) {
    justify-content: flex-start;
  }

  .blog-article__body :deep(.blog-split--reverse .blog-split__media),
  .blog-article__body :deep(.blog-split--reverse .blog-split__text) {
    order: initial;
  }
}

@media (--wh-mobile) {
  .blog-article__hero {
    min-height: 0;
    padding-bottom: 32px;
    background-size: cover;
  }

  .blog-article__hero-panel {
    position: static;
    top: auto;
    width: 100%;
    margin-top: 28px;
    transform: none;
    gap: 20px;
  }

  .blog-article__hero-heading {
    font-size: 26px;
  }

  .blog-article__frame.container {
    padding-block: 28px 0;
  }

  .blog-article__content h1 {
    font-size: 20px;
  }

  .blog-article__date {
    margin-bottom: 24px;
  }

  .blog-article__body :deep(.blog-subtitle) {
    font-size: 16px;
  }

  .blog-article__body :deep(.blog-join),
  .blog-article__body :deep(.blog-contacts) {
    padding-block: 28px;
  }

  .blog-article__body :deep(.blog-faq details) {
    grid-template-columns: minmax(0, 1fr) 40px;
    align-items: start;
  }

  .blog-article__body :deep(.blog-faq summary) {
    grid-column: 1;
    grid-row: 1;
    gap: 16px;
    font-size: 18px;
  }

  .blog-article__body :deep(.blog-faq summary::after),
  .blog-article__body :deep(.blog-faq details:not([open]) summary::after) {
    top: 22px;
    transform: none;
  }

  .blog-article__body :deep(.blog-faq details[open]::details-content),
  .blog-article__body :deep(.blog-faq details[open] > p) {
    grid-column: 1;
    grid-row: 2;
  }

  .blog-article__body :deep(.blog-faq details[open] > p) {
    padding-top: 12px;
    padding-left: calc(40px + 16px);
    font-size: 16px;
  }
}
</style>
