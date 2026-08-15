<script setup lang="ts">
import type { LocationItem, OfferItem } from '~/types/api'
import type { BreadcrumbItem } from '~/types/breadcrumb'
import { offerToMapHotel, type MapHotelItem } from '~/utils/map'

definePageMeta({
  layout: 'home',
  key: (route) => route.path,
})

const route = useRoute()
const { location: locationApi } = useApi()

const locationId = computed(() => Number(route.params.id))

function getCachedPageData<T>(key: string, nuxtApp: ReturnType<typeof useNuxtApp>) {
  return nuxtApp.payload.data[key] as T | undefined
    ?? nuxtApp.static.data[key] as T | undefined
}

const { data: homeLocations } = useNuxtData<LocationItem[]>('home-location-offers')

const cachedLocationName = computed(() => {
  return homeLocations.value?.find(item => item.id === locationId.value)?.title ?? ''
})

const { data: locationHotels, pending: hotelsPending } = useAsyncData(
  () => `location-hotels-${route.params.id}`,
  async () => {
    if (!Number.isFinite(locationId.value) || locationId.value <= 0) {
      return [] as OfferItem[]
    }

    try {
      return await locationApi.getLocationHotelItems(locationId.value)
    }
    catch {
      return [] as OfferItem[]
    }
  },
  {
    lazy: true,
    default: () => [] as OfferItem[],
    watch: [locationId],
    getCachedData: (key, nuxtApp) => {
      const cached = getCachedPageData<OfferItem[]>(key, nuxtApp)
      if (!cached?.length) {
        return cached
      }

      // Drop stale list payload from before the API started returning coords.
      const hasCoords = cached.some(
        item => item.map_lat != null && item.map_lng != null,
      )

      return hasCoords ? cached : undefined
    },
  },
)

const { data: fetchedLocationName } = useAsyncData(
  () => `location-name-${route.params.id}`,
  async () => {
    if (cachedLocationName.value) {
      return cachedLocationName.value
    }

    const fromHotels = locationHotels.value.find(item => item.location)?.location
    if (fromHotels) {
      return fromHotels
    }

    try {
      const locations = await locationApi.getLocationItems()
      const match = locations.find(item => item.id === locationId.value)

      return match?.name ?? ''
    }
    catch {
      return ''
    }
  },
  {
    lazy: true,
    server: false,
    default: () => '',
    getCachedData: (key, nuxtApp) => getCachedPageData(key, nuxtApp),
  },
)

const locationName = computed(() => {
  if (cachedLocationName.value) {
    return cachedLocationName.value
  }

  const fromHotels = locationHotels.value.find(item => item.location)?.location
  if (fromHotels) {
    return fromHotels
  }

  return fetchedLocationName.value || ''
})

useHead(() => ({
  title: locationName.value
    ? `${locationName.value} — карта — WH`
    : 'Базы на карте — WH',
}))

const hotels = computed<MapHotelItem[]>(() => {
  return locationHotels.value
    .map(offerToMapHotel)
    .filter((item): item is MapHotelItem => item != null)
})

const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const name = locationName.value || 'Область'
  const id = locationId.value

  return [
    { label: 'Главная', to: '/' },
    {
      label: name,
      to: Number.isFinite(id) && id > 0 ? `/locations/${id}` : undefined,
    },
    { label: 'Карта' },
  ]
})
</script>

<template>
  <div class="location-map-page">
    <SearchHero
      :title="locationName || 'Область'"
      background-image="/images/location-img.jpg"
      hide-search
    />

    <SearchBasesMapPanel
      :hotels="hotels"
      :loading="hotelsPending && !locationHotels.length"
      :breadcrumbs="breadcrumbs"
    />

    <HomeBlocksCommunityBlock variant="centered" />
    <LayoutAppFooter />
  </div>
</template>

<style scoped>
.location-map-page {
  background: var(--wh-white);
}
</style>
