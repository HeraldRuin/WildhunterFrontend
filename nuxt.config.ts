// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'WH — Охотничьи базы',
      script: [
        {
          key: 'scroll-reset',
          tagPosition: 'head',
          children: `(function(){function r(){window.scrollTo(0,0);document.documentElement.scrollTop=0;document.body.scrollTop=0}if('scrollRestoration'in history){history.scrollRestoration='manual'}r();window.addEventListener('pageshow',r);document.addEventListener('DOMContentLoaded',r);window.addEventListener('load',r)})();`,
        },
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/x-icon',
          href: '/favicon.ico',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: '/favicon-32.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '16x16',
          href: '/favicon-16.png',
        },
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/apple-touch-icon.png',
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@400;500;600;700;800&display=swap',
        },
      ],
    },
  },
  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:8000/api',
      apiVersion: 'v1',
    },
  },
  routeRules: {
    '/profile': { ssr: false },
    '/profile/**': { ssr: false },
  },
})
