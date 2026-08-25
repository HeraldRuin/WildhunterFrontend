<script setup lang="ts">
import { getBlogPost } from '~/utils/blog-posts'

definePageMeta({
  layout: 'home',
})

const route = useRoute()
const slug = Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug
const post = getBlogPost(String(slug || ''))

if (!post) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Страница не найдена',
    fatal: true,
  })
}

const pageTitle = post.pageTitle || post.title

useHead({
  title: pageTitle,
  meta: [
    {
      name: 'description',
      content: pageTitle,
    },
  ],
})
</script>

<template>
  <div class="blog-article">
    <section class="blog-article__hero">
      <div class="blog-article__header">
        <HomeHeroHeader />
      </div>
      <div class="blog-article__hero-title">
        <HomeHeroTitle />
      </div>
    </section>

    <main class="blog-article__main">
      <div class="container blog-article__content">
        <h1>{{ pageTitle }}</h1>
        <p class="blog-article__date">{{ post.date }}</p>
        <img
          v-if="!post.content"
          class="blog-article__image"
          :src="post.image"
          :alt="post.title"
          width="800"
          height="450"
        >
        <div
          v-if="post.content"
          class="blog-article__body"
          v-html="post.content"
        />
      </div>
    </main>

    <LayoutAppFooter />
  </div>
</template>

<style scoped>
.blog-article__hero {
  position: relative;
  min-height: 520px;
  background:
    linear-gradient(180deg, rgba(17, 24, 39, 0.08) 0%, rgba(17, 24, 39, 0.18) 100%),
    url('/images/headBlock.jpg') center / 100% 100% no-repeat;
  color: var(--wh-white);
}

.blog-article__header {
  display: flex;
  justify-content: center;
  padding-inline: 12px;
}

.blog-article__hero-title {
  position: absolute;
  top: 300px;
  left: 50%;
  width: 100%;
  max-width: calc(100% - 24px);
  transform: translateX(-50%);
}

.blog-article__main {
  overflow-x: clip;
  background: var(--wh-white);
}

.blog-article__content {
  max-width: 1100px;
  padding-block: 48px 0;
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

.blog-article__body :deep(a) {
  color: #1a5fb4;
  text-decoration: underline;
  text-underline-offset: 2px;
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

.blog-article__body :deep(.blog-split__image) {
  display: block;
  width: 100%;
  height: auto;
  margin: 0 0 8px;
  object-fit: cover;
  aspect-ratio: 4 / 5;
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
  border-top: 1px solid #ddd;
}

.blog-article__body :deep(.blog-faq details) {
  margin: 0;
  padding: 0;
  border: 0;
  border-bottom: 1px solid #ddd;
  border-radius: 0;
  background: transparent;
}

.blog-article__body :deep(.blog-faq summary) {
  position: relative;
  display: block;
  padding: 18px 36px 18px 0;
  cursor: pointer;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
  list-style: none;
}

.blog-article__body :deep(.blog-faq summary::-webkit-details-marker) {
  display: none;
}

.blog-article__body :deep(.blog-faq summary::after) {
  content: '';
  position: absolute;
  top: 50%;
  right: 4px;
  width: 10px;
  height: 10px;
  border-right: 1.5px solid #111;
  border-bottom: 1.5px solid #111;
  transform: translateY(-70%) rotate(45deg);
  transition: transform 0.15s ease;
}

.blog-article__body :deep(.blog-faq details[open] summary::after) {
  transform: translateY(-20%) rotate(225deg);
}

.blog-article__body :deep(.blog-faq details p) {
  margin: 0 0 18px;
  padding-right: 36px;
  font-weight: 400;
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
    min-height: 500px;
  }

  .blog-article__hero-title {
    top: 290px;
  }

  .blog-article__body :deep(.blog-split) {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .blog-article__body :deep(.blog-split__image) {
    aspect-ratio: 16 / 10;
  }

  .blog-article__body :deep(.blog-faq__head),
  .blog-article__body :deep(.blog-contacts) {
    grid-template-columns: 1fr;
  }

  .blog-article__body :deep(.blog-faq__lead),
  .blog-article__body :deep(.blog-contacts__info) {
    text-align: left;
  }
}

@media (--wh-mobile) {
  .blog-article__hero {
    min-height: 390px;
    background-size: cover;
  }

  .blog-article__hero-title {
    top: 220px;
  }

  .blog-article__content {
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

  .blog-article__body :deep(.blog-contacts) {
    padding-block: 28px;
  }
}
</style>
