<script setup lang="ts">
import type { OfferItem } from '~/types/api'

definePageMeta({
  layout: 'profile',
  middleware: 'auth',
  path: '/profile/favorites',
})

useHead({
  title: 'Избранное — WH',
})

const { hotels } = useApi()
const {
  favoriteHotelIds,
  loadFavorites,
} = useFavoriteHotels()

const breadcrumbs = [
  { label: 'Главная', to: '/' },
  { label: 'Избранное' },
]

const favoriteOffers = ref<OfferItem[]>([])
const isPageLoading = ref(true)
const scrollEl = ref<HTMLElement | null>(null)
const listPageCount = ref(1)
const listPageIndex = ref(0)
let listResizeObserver: ResizeObserver | null = null

function getListMaxScroll(el: HTMLElement) {
  return Math.max(0, el.scrollHeight - el.clientHeight)
}

function getListPageCount(el: HTMLElement) {
  const pageSize = el.clientHeight || 1
  const maxScroll = getListMaxScroll(el)

  if (maxScroll <= 8) {
    return 1
  }

  return Math.max(1, Math.ceil((maxScroll + pageSize) / pageSize))
}

function getListPageIndex(el: HTMLElement, pageCount: number) {
  if (pageCount <= 1) {
    return 0
  }

  const maxScroll = getListMaxScroll(el)

  if (el.scrollTop >= maxScroll - 2) {
    return pageCount - 1
  }

  return Math.min(
    pageCount - 1,
    Math.round((el.scrollTop / maxScroll) * (pageCount - 1)),
  )
}

function updateListPages() {
  const el = scrollEl.value
  if (!el) {
    listPageCount.value = 1
    listPageIndex.value = 0
    return
  }

  const pages = getListPageCount(el)
  listPageCount.value = pages
  listPageIndex.value = getListPageIndex(el, pages)
}

function scheduleListPagesUpdate() {
  void nextTick(() => {
    updateListPages()
    requestAnimationFrame(() => {
      updateListPages()
      requestAnimationFrame(updateListPages)
    })
  })
}

function onListScroll() {
  const el = scrollEl.value
  if (!el) return

  listPageIndex.value = getListPageIndex(el, listPageCount.value)
}

function scrollListToPage(index: number) {
  const el = scrollEl.value
  if (!el) return

  const pageCount = listPageCount.value
  if (pageCount <= 1) return

  const maxScroll = getListMaxScroll(el)
  const top = pageCount === 1
    ? 0
    : Math.round((index / (pageCount - 1)) * maxScroll)

  el.scrollTo({ top, behavior: 'smooth' })
  listPageIndex.value = index
}

watch(() => favoriteOffers.value.length, () => {
  scheduleListPagesUpdate()
  void nextTick(() => {
    if (scrollEl.value && listResizeObserver) {
      listResizeObserver.disconnect()
      listResizeObserver.observe(scrollEl.value)
    }
  })
})

watch(scrollEl, (el) => {
  if (!el || !listResizeObserver) return
  listResizeObserver.disconnect()
  listResizeObserver.observe(el)
  updateListPages()
})

watch(isPageLoading, (loading) => {
  if (!loading) {
    scheduleListPagesUpdate()
  }
})

async function refreshOffers() {
  const ids = favoriteHotelIds.value

  if (!ids.length) {
    favoriteOffers.value = []
    return
  }

  const offers = await hotels.getHotelOfferItems()
  const idSet = new Set(ids)
  favoriteOffers.value = offers.filter(item => idSet.has(item.id))
}

onMounted(async () => {
  isPageLoading.value = true

  if (import.meta.client && typeof ResizeObserver !== 'undefined') {
    listResizeObserver = new ResizeObserver(() => {
      updateListPages()
    })
  }

  window.addEventListener('resize', scheduleListPagesUpdate)

  try {
    await loadFavorites()
    await refreshOffers()
  }
  catch {
    favoriteOffers.value = []
  }
  finally {
    isPageLoading.value = false
    scheduleListPagesUpdate()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', scheduleListPagesUpdate)
  listResizeObserver?.disconnect()
  listResizeObserver = null
})

watch(favoriteHotelIds, (ids) => {
  if (isPageLoading.value) {
    return
  }

  const idSet = new Set(ids)
  favoriteOffers.value = favoriteOffers.value.filter(item => idSet.has(item.id))
})
</script>

<template>
  <div class="profile-page">
    <div class="profile-page__fixed">
      <header class="profile-page__header">
        <AppBreadcrumbs :items="breadcrumbs" />

        <ProfileNotificationsBell />
      </header>

      <CommonPageTitle divider>Избранное</CommonPageTitle>
    </div>

    <div class="profile-page__scroll">
      <div
        v-if="isPageLoading"
        class="favorites-page__state favorites-page__state--loading"
      >
        <CommonSpinner
          variant="ring"
          size="lg"
        />
      </div>

      <p
        v-else-if="!favoriteOffers.length"
        class="favorites-page__empty"
      >
        В избранном пока нет баз. Добавляйте понравившиеся отели на главной или в каталоге.
      </p>

      <div
        v-else
        class="favorites-page__shell"
      >
        <div
          v-if="listPageCount > 1"
          class="favorites-page__dots"
          role="tablist"
          aria-label="Страницы списка избранного"
        >
          <button
            v-for="page in listPageCount"
            :key="page"
            type="button"
            class="favorites-page__dot"
            :class="{ 'favorites-page__dot--active': page - 1 === listPageIndex }"
            :aria-label="`Страница ${page}`"
            :aria-current="page - 1 === listPageIndex ? 'true' : undefined"
            @click="scrollListToPage(page - 1)"
          />
        </div>

        <div
          ref="scrollEl"
          class="favorites-page__scroll-inner"
          @scroll.passive="onListScroll"
        >
          <div class="favorites-page__grid">
            <HomeOfferCard
              v-for="item in favoriteOffers"
              :key="item.id"
              :item="item"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
  padding: 20px 40px 0;
  /* Чуть меньше слева — место под точки у сайдбара */
  padding-left: 20px;
  box-sizing: border-box;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
}

.profile-page__fixed {
  flex-shrink: 0;
  background: var(--wh-gray-100);
}

.profile-page__scroll {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.favorites-page__shell {
  display: flex;
  flex: 1;
  align-items: stretch;
  gap: 12px;
  min-height: 0;
  min-width: 0;
  width: 100%;
}

.favorites-page__dots {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  align-self: center;
  gap: 8px;
  width: 10px;
  padding: 4px 0;
  z-index: 2;
}

.favorites-page__dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  padding: 0;
  border: 1px solid rgb(28 33 28 / 25%);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.favorites-page__dot--active {
  border-color: #e8883a;
  background: #e8883a;
}

.favorites-page__dot:hover:not(.favorites-page__dot--active) {
  border-color: rgb(28 33 28 / 45%);
}

.favorites-page__scroll-inner {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
  padding-bottom: 48px;
}

.profile-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  max-width: 1100px;
  height: 31px;
  margin-bottom: 20px;
  padding: 0;
  box-sizing: border-box;
  overflow: visible;
}

.profile-page :deep(.page-title--divider) {
  width: 100%;
  max-width: 1100px;
}

.favorites-page__state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
}

.favorites-page__empty {
  margin: 24px 0 0;
  color: rgba(0, 0, 0, 0.55);
  font-size: 16px;
  line-height: 1.5;
}

@media (--wh-desktop) {
  .favorites-page__empty {
    white-space: nowrap;
  }
}

.favorites-page__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px 20px;
  width: 100%;
  max-width: 1100px;
  margin-top: 24px;
}

@media (--wh-tablet) {
  .favorites-page__empty {
    max-width: 520px;
  }

  .profile-page {
    height: auto;
    max-height: none;
    overflow: visible;
    padding: 12px 8px 32px;
  }

  .profile-page__scroll {
    overflow: visible;
  }

  .favorites-page__dots {
    display: none;
  }

  .favorites-page__scroll-inner {
    overflow: visible;
    padding-bottom: 0;
  }

  .favorites-page__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (--wh-mobile) {
  .favorites-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>
