// https://nuxt.com/docs/api/configuration/nuxt-config
const apiBase = process.env.NUXT_PUBLIC_API_BASE || 'http://109.172.31.240/api'
const apiUrl = new URL(apiBase)
const uploadsOrigin = apiUrl.origin

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  postcss: {
    plugins: {
      '@csstools/postcss-global-data': {
        files: ['./app/assets/css/breakpoints.css'],
      },
      'postcss-custom-media': {},
    },
  },
  app: {
    head: {
      title: 'WH — Охотничьи базы',
      titleTemplate: '%s | wild-hunter.ru',
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
          href: uploadsOrigin,
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
      script: [
        {
          key: 'yandex-metrika',
          tagPosition: 'bodyClose',
          innerHTML: `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");ym(101818500,"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});`,
        },
      ],
      noscript: [
        {
          key: 'yandex-metrika-noscript',
          tagPosition: 'bodyClose',
          innerHTML: '<div><img src="https://mc.yandex.ru/watch/101818500" style="position:absolute;left:-9999px;" alt="" /></div>',
        },
      ],
    },
  },
  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:8000/api',
      apiVersion: 'v1',
      reverbKey: process.env.NUXT_PUBLIC_REVERB_KEY || '',
      reverbHost: process.env.NUXT_PUBLIC_REVERB_HOST || apiUrl.hostname,
      reverbPort: Number(process.env.NUXT_PUBLIC_REVERB_PORT || (apiUrl.protocol === 'https:' ? 443 : 8080)),
      reverbScheme: process.env.NUXT_PUBLIC_REVERB_SCHEME || apiUrl.protocol.replace(':', ''),
      broadcastAuthUrl: process.env.NUXT_PUBLIC_BROADCAST_AUTH_URL || `${apiUrl.origin}/broadcasting/auth`,

      mapProvider: process.env.NUXT_PUBLIC_MAP_PROVIDER || 'leaflet',
      yandexMapsApiKey: process.env.NUXT_PUBLIC_YANDEX_MAPS_API_KEY || '',
      chatragWidgetKey: process.env.NUXT_PUBLIC_CHATRAG_WIDGET_KEY || '',
    },
  },
  hooks: {
    'pages:extend'(pages) {
      const applyTrailingSlash = (items: Array<{ path?: string, children?: Array<{ path?: string, children?: unknown[] }> }>) => {
        for (const page of items) {
          if (
            page.path === '/profile'
            || page.path?.startsWith('/profile/')
            || page.path === '/rooms'
            || page.path?.startsWith('/rooms/')
          ) {
            if (!page.path.endsWith('/')) {
              page.path = `${page.path}/`
            }
          }

          if (page.children?.length) {
            applyTrailingSlash(page.children)
          }
        }
      }

      applyTrailingSlash(pages)
    },
  },
  routeRules: {
    '/page/home-page-v2': { redirect: { to: '/', statusCode: 301 } },
    '/page/space': { redirect: { to: '/', statusCode: 301 } },
    '/page/polzovatelskoe-soglashenie': { redirect: { to: '/', statusCode: 301 } },
    '/page/home-tour-agency': { redirect: { to: '/', statusCode: 301 } },
    '/hotel': { redirect: { to: '/', statusCode: 301 } },
    '/profile': { ssr: false },
    '/profile/**': { ssr: false },
    '/rooms': { ssr: false },
    '/rooms/**': { ssr: false },
  },

  vite: {
    build: {
      assetsInlineLimit: 4096,
      rolldownOptions: {
        output: {
          codeSplitting: {
            minSize: 80_000,
            groups: [
              { name: 'vendor', test: /node_modules[\\/]/ },
            ],
          },
        },
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return
            }

            if (id.includes('leaflet')) {
              return 'leaflet'
            }

            return 'vendor'
          },
        },
      },
    },
  },
})
