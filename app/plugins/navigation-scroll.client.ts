import { applyNavigationScroll, applyScroll } from '~/utils/navigation-scroll'

export default defineNuxtPlugin({
  name: 'navigation-scroll',
  enforce: 'pre',
  setup(nuxtApp) {
    if (!import.meta.client) {
      return
    }

    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }

    applyScroll({ top: 0, left: 0 })

    nuxtApp.hook('page:finish', () => {
      requestAnimationFrame(() => {
        applyNavigationScroll()
      })
    })

    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        applyScroll({ top: 0, left: 0 })
      }
    })
  },
})
