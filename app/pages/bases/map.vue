<script setup lang="ts">
import type { HotelSearchBody, OfferItem } from '~/types/api'
import type { BreadcrumbItem } from '~/types/breadcrumb'
import { mapHotelOfferToItem } from '~/api/hotels'
import { parseDisplayDateToApiDate } from '~/utils/date'
import { offerToMapHotel, type MapHotelItem } from '~/utils/map'

definePageMeta({
  layout: 'home',
  key: (route) => route.path,
})

useHead({
  titleTemplate: '%s',
  title: 'Базы на карте — WH',
})

const route = useRoute()
const { params: basesSearchParams, setParams } = useBasesSearchParams()
const { search: searchApi, hotels: hotelsApi, location: locationApi } = useApi()

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: 'Главная', to: '/' },
  {
    label: 'Базы',
    to: '/bases',
  },
  { label: 'Карта' },
])

function queryString(key: string): string {
  const stored = basesSearchParams.value[key as keyof typeof basesSearchParams.value]
  if (stored) {
    return stored
  }

  const value = route.query[key]
  return Array.isArray(value) ? String(value[0] || '') : String(value || '')
}

const isCatalogMode = computed(() => !queryString('checkIn') && !queryString('checkOut'))

const searchRequest = computed(() => {
  const catalog = isCatalogMode.value
  const body: HotelSearchBody = {}

  if (!catalog) {
    if (queryString('location')) {
      body.location_id = Number(queryString('location'))
    }

    if (queryString('animal')) {
      body.animal_id = Number(queryString('animal'))
    }

    const checkIn = parseDisplayDateToApiDate(queryString('checkIn'))
    if (checkIn) {
      body.check_in = checkIn
    }

    const checkOut = parseDisplayDateToApiDate(queryString('checkOut'))
    if (checkOut) {
      body.check_out = checkOut
    }

    if (queryString('guests')) {
      body.adults = Number(queryString('guests'))
    }
  }

  return {
    catalog,
    body,
    key: [
      basesSearchParams.value.location,
      basesSearchParams.value.animal,
      basesSearchParams.value.checkIn,
      basesSearchParams.value.checkOut,
      basesSearchParams.value.guests,
      route.fullPath,
    ].join('|'),
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

async function resolveLocationSlug(id: number): Promise<string> {
  const locations = await locationApi.getLocationItems()

  return locations.find(item => item.id === id)?.slug || ''
}

async function loadMapHotels() {
  const loadId = ++searchLoadId
  isLoading.value = true

  try {
    const locationId = Number(queryString('location'))
    const hasLocation = Number.isFinite(locationId) && locationId > 0

    let items: OfferItem[]

    if (searchRequest.value.catalog && hasLocation) {
      const slug = await resolveLocationSlug(locationId)

      items = slug ? await locationApi.getLocationHotelItems(slug) : []
    }
    else if (searchRequest.value.catalog) {
      items = await hotelsApi.getHotelOfferItems({ all: true })
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

    const hotelId = Number(queryString('hotel'))
    if (Number.isFinite(hotelId) && hotelId > 0) {
      hotels.value = hotels.value.filter(item => item.id === hotelId)
    }
  }
  catch {
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
  isLoading.value = true

  try {
    setParams(payload)
    if (route.path !== '/bases/map') {
      await navigateTo('/bases/map')
    }
    await loadMapHotels()
  }
  catch {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="bases-map-page">
    <SearchHero :loading="isLoading" @search="handleSearch" />

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

.bases-map-page :deep(.search-top__tagline) {
  width: auto;
}
</style>
