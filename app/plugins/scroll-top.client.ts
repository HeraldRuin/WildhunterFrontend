export default defineNuxtPlugin({
  name: 'scroll-top',
  enforce: 'pre',
  setup(nuxtApp) {
    if (!import.meta.client) return

    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }

    const resetScroll = () => {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0

      const active = document.activeElement
      if (active instanceof HTMLElement && active !== document.body) {
        active.blur()
      }

      document.body.focus({ preventScroll: true })
    }

    resetScroll()

    window.addEventListener('pageshow', resetScroll)
    window.addEventListener('load', resetScroll)
    document.addEventListener('DOMContentLoaded', resetScroll)

    // Браузер иногда восстанавливает позицию уже после hydration.
    requestAnimationFrame(resetScroll)
    setTimeout(resetScroll, 0)
    setTimeout(resetScroll, 50)
    setTimeout(resetScroll, 150)

    nuxtApp.hook('app:mounted', resetScroll)
    nuxtApp.hook('page:finish', resetScroll)
  },
})
