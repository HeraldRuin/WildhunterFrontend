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
    },
  },
  routeRules: {
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
