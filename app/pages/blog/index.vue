<script setup lang="ts">
import type { BreadcrumbItem } from '~/types/breadcrumb'
import { blogPosts } from '~/utils/blog-posts'

definePageMeta({
  layout: 'home',
  path: '/blog',
})

const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Главная', to: '/' },
  { label: 'Блог' },
]

useHead({
  title: 'Блог',
  meta: [
    {
      name: 'description',
      content: 'Тематический блог об охоте и охотниках — новости, статьи и материалы Wild Hunter.',
    },
  ],
})
</script>

<template>
  <div class="blog-page">
    <section class="blog-hero">
      <div class="blog-hero__header">
        <HomeHeroHeader />
      </div>
      <div class="blog-hero__title">
        <HomeHeroTitle />
      </div>
    </section>

    <main class="blog-listing">
      <!-- <div class="blog-listing__bg" aria-hidden="true" /> -->
      <div class="container blog-listing__inner">
        <AppBreadcrumbs
          :items="breadcrumbs"
          class="blog-listing__breadcrumbs"
        />

        <h1 class="blog-listing__title">
          Тематический блог об охоте и охотниках
        </h1>

        <div class="blog-listing__grid">
          <article
            v-for="post in blogPosts"
            :key="post.slug"
            class="blog-card"
          >
            <h2 class="blog-card__title">{{ post.title }}</h2>
            <p class="blog-card__date">{{ post.date }}</p>
            <img
              class="blog-card__image"
              :src="post.image"
              :alt="post.title"
              width="290"
              height="200"
              loading="lazy"
            >
            <NuxtLink
              class="blog-card__button"
              :to="`/blog/${post.slug}`"
            >
              Прочитать статью
            </NuxtLink>
          </article>
        </div>
      </div>
    </main>

    <LayoutAppFooter />
  </div>
</template>

<style scoped>
.blog-hero {
  position: relative;
  min-height: 520px;
  background:
    linear-gradient(180deg, rgba(17, 24, 39, 0.08) 0%, rgba(17, 24, 39, 0.18) 100%),
    url('/images/headBlock.jpg') center / 100% 100% no-repeat;
  color: var(--wh-white);
}

.blog-hero__header {
  display: flex;
  justify-content: center;
  padding-inline: 12px;
}

.blog-hero__title {
  position: absolute;
  top: 300px;
  left: 50%;
  width: 100%;
  max-width: calc(100% - 24px);
  transform: translateX(-50%);
}

.blog-listing {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding-block: 56px 80px;
  background: var(--wh-white);
}

/*
.blog-listing__bg {
  position: absolute;
  inset: -32px;
  z-index: -2;
  background: url('/images/blog/listing-bg.jpg') center / cover no-repeat;
  filter: blur(10px) brightness(1.25);
  transform: scale(1.06);
}

.blog-listing::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: rgb(255 255 255 / 55%);
  pointer-events: none;
}
*/

.blog-listing__inner.container {
  display: flex;
  flex-direction: column;
  width: min(100% - 32px, 1240px);
}

.blog-listing__breadcrumbs {
  align-self: start;
  margin-bottom: 28px;
}

.blog-listing__title {
  margin: 0 0 40px;
  font-family: 'UNCAGE', sans-serif;
  font-weight: 400;
  font-size: 32px;
  line-height: 1.2;
  letter-spacing: -0.03em;
  text-transform: uppercase;
  text-align: center;
  color: var(--wh-black-text);
}

.blog-listing__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

.blog-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 30px 30px;
  background: var(--wh-white);
  border: 1px solid var(--wh-field-border);
  border-radius: var(--wh-radius);
  box-shadow: var(--wh-shadow);
}

.blog-card__title {
  margin: 0;
  min-height: 2.9em;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.45;
  text-align: center;
  color: var(--wh-black-text);
}

.blog-card__date {
  margin: 8px 0 16px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.4;
  text-align: center;
  color: var(--wh-black-text);
}

.blog-card__image {
  display: block;
  width: 100%;
  height: 200px;
  margin-bottom: 16px;
  object-fit: cover;
}

.blog-card__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 48px;
  margin-top: auto;
  padding: 14px 24px;
  border: none;
  border-radius: var(--wh-radius-lg);
  background: var(--wh-orange-500);
  color: var(--wh-white);
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.47;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.blog-card__button:hover {
  background: var(--wh-orange-600);
  transform: var(--wh-button-hover-lift);
}

@media (--wh-tablet) {
  .blog-hero {
    min-height: 500px;
  }

  .blog-hero__title {
    top: 290px;
  }

  .blog-listing {
    padding-block: 40px 64px;
  }

  .blog-listing__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .blog-listing__title {
    font-size: 28px;
  }
}

@media (--wh-mobile) {
  .blog-hero {
    min-height: 390px;
    background-size: cover;
  }

  .blog-hero__title {
    top: 220px;
  }

  .blog-listing {
    padding-block: 32px 48px;
  }

  .blog-listing__title {
    margin-bottom: 24px;
    font-size: 22px;
  }

  .blog-listing__grid {
    grid-template-columns: 1fr;
  }

  .blog-card {
    padding: 20px;
  }

  .blog-card__title {
    min-height: 0;
  }
}
</style>
