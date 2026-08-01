<script setup lang="ts">
import type { LocationItem } from '~/types/api'
import type { BreadcrumbItem } from '~/types/breadcrumb'

definePageMeta({
  layout: 'home',
})

useHead({
  title: 'Все локации — WH',
})

const { location: locationApi } = useApi()

function getCachedPageData<T>(key: string, nuxtApp: ReturnType<typeof useNuxtApp>) {
  return nuxtApp.payload.data[key] as T | undefined
    ?? nuxtApp.static.data[key] as T | undefined
}

const { data: homeLocations } = useNuxtData<LocationItem[]>('home-location-offers')

const { data: locations, pending } = useAsyncData(
  'all-locations',
  async () => {
    if (homeLocations.value?.length) {
      return homeLocations.value
    }

    try {
      return await locationApi.getLocationOfferItems()
    }
    catch {
      return [] as LocationItem[]
    }
  },
  {
    lazy: true,
    default: () => [] as LocationItem[],
    getCachedData: (key, nuxtApp) => {
      const fromHome = homeLocations.value
      if (fromHome?.length) {
        return fromHome
      }

      return getCachedPageData(key, nuxtApp)
    },
  },
)

const totalCount = computed(() => locations.value.length)

const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Главная', to: '/' },
  { label: 'Все локации' },
]
</script>

<template>
  <div class="locations-page">
    <SearchHero
      background-image="/images/location-img.jpg"
      hide-search
    />

    <section class="locations-page__results">
      <div class="container locations-page__results-inner">
        <AppBreadcrumbs
          :items="breadcrumbs"
          class="locations-page__breadcrumbs"
        />

        <div class="locations-page__toolbar">
          <h1
            v-if="!pending || totalCount"
            class="locations-page__title"
          >
            Всего локаций: {{ totalCount }}
          </h1>
        </div>

        <div
          v-if="pending && !locations.length"
          class="locations-page__state locations-page__state--loading"
        >
          <CommonSpinner
            variant="ring"
            size="lg"
          />
        </div>

        <div
          v-else-if="!locations.length"
          class="locations-page__state locations-page__state--empty"
        >
          Локации не найдены
        </div>

        <div
          v-else
          class="locations-page__grid"
        >
          <HomeLocationCard
            v-for="item in locations"
            :key="item.id"
            :item="item"
          />
        </div>
      </div>
    </section>

    <HomeBlocksLocationAboutBlock title="Об охоте в областях" />
    <HomeBlocksCommunityBlock variant="centered" />
    <LayoutAppFooter />
  </div>
</template>

<style scoped>
.locations-page {
  background: var(--wh-white);
}

.locations-page__results {
  padding: 80px 0 104px;
}

.locations-page__results-inner {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.locations-page__breadcrumbs {
  align-self: start;
}

.locations-page__toolbar {
  display: grid;
  place-items: center;
  min-height: calc(32px * 1.3);
}

.locations-page__title {
  margin: 0;
  font-family: "UNCAGE", sans-serif;
  font-size: 32px;
  font-weight: 400;
  line-height: 130%;
  letter-spacing: -0.03em;
  text-align: center;
  color: var(--wh-gray-900);
  white-space: nowrap;
}

.locations-page__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px 20px;
}

.locations-page__state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  padding: 64px 24px;
  text-align: center;
}

.locations-page__state--empty {
  font-family: "Inter", sans-serif;
  font-size: 20px;
  font-weight: 500;
  line-height: 140%;
  letter-spacing: -0.03em;
  color: var(--wh-gray-900);
}

@media (--wh-tablet) {
  .locations-page__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (--wh-mobile) {
  .locations-page__results {
    padding-top: 48px;
  }

  .locations-page__results-inner {
    gap: 12px;
  }

  .locations-page__title {
    font-size: 24px;
    white-space: normal;
  }

  .locations-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>
