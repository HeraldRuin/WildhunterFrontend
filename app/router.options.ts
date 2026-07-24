import type { RouterConfig } from '@nuxt/schema'
import { queueNavigationScroll } from '~/utils/navigation-scroll'

export default {
  scrollBehavior(to, _from, savedPosition) {
    queueNavigationScroll(to, savedPosition)
    // Прокрутку не выполняем здесь: в SPA это тот же document,
    // и пользователь видит «скролл старой страницы» до смены URL.
    return false
  },
} satisfies RouterConfig
