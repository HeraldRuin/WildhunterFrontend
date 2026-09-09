import {
  clearAllPersistedSearchFilters,
  shouldPreserveSearchFilters,
} from '~/composables/usePersistedSearchFilters'

export default defineNuxtPlugin({
  name: 'clear-search-filters',
  setup() {
    const router = useRouter()

    router.afterEach((to) => {
      if (shouldPreserveSearchFilters(to.path)) {
        return
      }

      clearAllPersistedSearchFilters()
    })
  },
})
