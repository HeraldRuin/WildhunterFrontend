import type { RouterConfig } from '@nuxt/schema'
import { queueNavigationScroll } from '~/utils/navigation-scroll'

export default {
  scrollBehavior(to, _from, savedPosition) {
    queueNavigationScroll(to, savedPosition)
    return false
  },
} satisfies RouterConfig
