// https://nuxt.com/docs/api/configuration/nuxt-config
const apiBase = process.env.NUXT_PUBLIC_API_BASE || 'http://109.172.31.240/api'
const apiUrl = new URL(apiBase)
const uploadsOrigin = apiUrl.origin

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  experimental: {
    defaults: {
      nuxtLink: {
        trailingSlash: 'append',
      },
    },
  },
  css: ['~/assets/css/fonts.css', '~/assets/css/main.css'],
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
      htmlAttrs: {
        lang: 'ru',
      },
      title: 'WH — Охотничьи базы',
      titleTemplate: '%s | wild-hunter.ru',
      link: [
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '96x96',
          href: '/favicon-96x96.png',
        },
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: '/favicon.svg',
        },
        {
          rel: 'shortcut icon',
          href: '/favicon.ico',
        },
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/apple-touch-icon.png',
        },
        {
          rel: 'manifest',
          href: '/site.webmanifest',
        },
        {
          rel: 'preconnect',
          href: uploadsOrigin,
        },
      ],
      script: [
        {
          key: 'yandex-metrika',
          tagPosition: 'bodyClose',
          innerHTML: `window.addEventListener('load',function(){var start=function(){(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");ym(101818500,"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});};if('requestIdleCallback' in window){requestIdleCallback(start,{timeout:4000})}else{setTimeout(start,1500)}});`,
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
      type PageWithPath = {
        path?: string
        alias?: string | string[]
        children?: PageWithPath[]
      }

      const withSlash = (path: string) => {
        if (!path || path === '/' || path.endsWith('/')) {
          return path
        }

        return `${path}/`
      }

      const applyTrailingSlash = (items: PageWithPath[]) => {
        for (const page of items) {
          if (page.path) {
            page.path = withSlash(page.path)
          }

          if (typeof page.alias === 'string') {
            page.alias = withSlash(page.alias)
          }
          else if (Array.isArray(page.alias)) {
            page.alias = page.alias.map(alias => withSlash(alias))
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
    '/profile': { ssr: false },
    '/profile/**': { ssr: false },
    '/rooms': { ssr: false },
    '/rooms/**': { ssr: false },
    '/images/**': { headers: { 'cache-control': 'public, max-age=31536000' } },
    '/fonts/**': { headers: { 'cache-control': 'public, max-age=31536000' } },
    '/icons/**': { headers: { 'cache-control': 'public, max-age=31536000' } },
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
