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

useHead({
  title: post.title,
  meta: [
    {
      name: 'description',
      content: post.title,
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

    <main class="container blog-article__content">
      <h1>{{ post.title }}</h1>
      <p class="blog-article__date">{{ post.date }}</p>
      <img
        class="blog-article__image"
        :src="post.image"
        :alt="post.title"
        width="800"
        height="450"
      >
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

.blog-article__content {
  max-width: 900px;
  padding-block: 40px 72px;
  color: var(--wh-black-text);
}

.blog-article__content h1 {
  margin: 0 0 12px;
  font-family: 'UNCAGE', sans-serif;
  font-weight: 400;
  font-size: 32px;
  line-height: 1.25;
  letter-spacing: -0.03em;
  text-transform: uppercase;
  text-align: center;
}

.blog-article__date {
  margin: 0 0 24px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.4;
  text-align: center;
}

.blog-article__image {
  display: block;
  width: 100%;
  height: auto;
  object-fit: cover;
}

@media (--wh-tablet) {
  .blog-article__hero {
    min-height: 500px;
  }

  .blog-article__hero-title {
    top: 290px;
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
    padding-block: 24px 48px;
  }

  .blog-article__content h1 {
    font-size: 22px;
  }
}
</style>
