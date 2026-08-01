<script setup lang="ts">
import type { HotelSearchBody, OfferItem } from '~/types/api'
import type { BreadcrumbItem } from '~/types/breadcrumb'
import { mapHotelOfferToItem } from '~/api/hotels'
import { parseDisplayDateToApiDate } from '~/utils/date'
import { offerToMapHotel, type MapHotelItem } from '~/utils/map'

definePageMeta({
  layout: 'home',
})

useHead({
  title: 'Базы на карте — WH',
})

const route = useRoute()
const { search: searchApi, hotels: hotelsApi, location: locationApi } = useApi()

const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Главная', to: '/' },
  { label: 'Базы', to: '/bases' },
  { label: 'Карта' },
]

function queryString(key: string): string {
  const value = route.query[key]
  return Array.isArray(value) ? String(value[0] || '') : String(value || '')
}

const isCatalogMode = computed(() => !queryString('checkIn') && !queryString('checkOut'))

const searchRequest = computed(() => {
  const catalog = isCatalogMode.value
  const body: HotelSearchBody = {}

  if (!catalog) {
    if (route.query.location) {
      body.location_id = Number(route.query.location)
    }

    if (route.query.animal) {
      body.animal_id = Number(route.query.animal)
    }

    const checkIn = parseDisplayDateToApiDate(queryString('checkIn'))
    if (checkIn) {
      body.check_in = checkIn
    }

    const checkOut = parseDisplayDateToApiDate(queryString('checkOut'))
    if (checkOut) {
      body.check_out = checkOut
    }

    if (route.query.guests) {
      body.adults = Number(route.query.guests)
    }
  }

  return {
    catalog,
    body,
    // Force reactivity when only query values change.
    key: route.fullPath,
  }
})

async function fetchAllSearchHotels(body: HotelSearchBody): Promise<OfferItem[]> {
  const first = await searchApi.searchHotels(1, body)

  if (!first.success) {
    return []
  }

  const items = [...first.data.items]
  const lastPage = Math.max(1, first.data.pagination.last_page)

  for (let page = 2; page <= lastPage; page += 1) {
    const response = await searchApi.searchHotels(page, body)

    if (response.success) {
      items.push(...response.data.items)
    }
  }

  return items.map(mapHotelOfferToItem)
}

const hotels = ref<MapHotelItem[]>([])
const isLoading = ref(false)
let searchLoadId = 0

async function loadMapHotels() {
  const loadId = ++searchLoadId
  isLoading.value = true

  try {
    const locationId = Number(queryString('location'))
    const hasLocation = Number.isFinite(locationId) && locationId > 0

    let items: OfferItem[]

    if (searchRequest.value.catalog && hasLocation) {
      items = await locationApi.getLocationHotelItems(locationId)
    }
    else if (searchRequest.value.catalog) {
      items = await hotelsApi.getHotelOfferItems()
    }
    else {
      items = await fetchAllSearchHotels(searchRequest.value.body)
    }

    if (loadId !== searchLoadId) {
      return
    }

    hotels.value = items
      .map(offerToMapHotel)
      .filter((item): item is MapHotelItem => item != null)
  }
  catch {
    // Keep previous results visible if a refresh fails.
  }
  finally {
    if (loadId === searchLoadId) {
      isLoading.value = false
    }
  }
}

await loadMapHotels()

watch(
  () => searchRequest.value.key,
  () => {
    void loadMapHotels()
  },
)

async function handleSearch(payload: Record<string, string>) {
  await navigateTo({
    path: '/bases/map',
    query: {
      ...payload,
    },
  })
  await loadMapHotels()
}
</script>

<template>
  <div class="bases-map-page">
    <SearchHero @search="handleSearch" />

    <SearchBasesMapPanel
      :hotels="hotels"
      :loading="isLoading"
      :breadcrumbs="breadcrumbs"
    />

    <HomeBlocksCommunityBlock variant="centered" />
    <LayoutAppFooter />
  </div>
</template>

<style scoped>
.bases-map-page {
  background: var(--wh-white);
}
</style>
