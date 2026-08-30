<script setup lang="ts">
import { DEFAULT_MAP_CENTER } from '~/utils/map'
import {
  loadYandexMaps21,
  type YmapsApi,
  type YmapsCoords,
  type YmapsEvent,
  type YmapsMap,
} from '~/utils/yandexMaps21'

const props = withDefaults(defineProps<{
  lat?: number | null
  lng?: number | null
  zoom?: number | null
}>(), {
  lat: null,
  lng: null,
  zoom: null,
})

const emit = defineEmits<{
  'update:lat': [value: number]
  'update:lng': [value: number]
  'update:zoom': [value: number]
  address: [value: string]
}>()

const mapEl = ref<HTMLElement | null>(null)
const mapError = ref('')
const isMapLoading = ref(true)

let ymapsApi: YmapsApi | null = null
let map: YmapsMap | null = null
let placemark: {
  events: YmapsMap['events']
  geometry: { getCoordinates: () => YmapsCoords }
} | null = null
let mapResizeObserver: ResizeObserver | null = null
let syncingFromProps = false

function resolveCenter(): YmapsCoords {
  const lat = Number(props.lat)
  const lng = Number(props.lng)

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return [lat, lng]
  }

  return [DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng]
}

function resolveZoom() {
  const zoom = Number(props.zoom)
  return Number.isFinite(zoom) && zoom > 0 ? zoom : 8
}

function setPlacemark(coords: YmapsCoords) {
  if (!ymapsApi || !map) {
    return
  }

  if (placemark) {
    map.geoObjects.remove(placemark)
  }

  placemark = new ymapsApi.Placemark(coords, {}, {
    preset: 'islands#redDotIcon',
    draggable: true,
  })

  placemark.events.add('dragend', () => {
    const next = placemark?.geometry.getCoordinates()

    if (!next) {
      return
    }

    emitCoords(next[0], next[1], map?.getZoom() ?? resolveZoom())
    void reverseGeocode(next)
  })

  map.geoObjects.add(placemark)
}

function emitCoords(lat: number, lng: number, zoom: number) {
  emit('update:lat', lat)
  emit('update:lng', lng)
  emit('update:zoom', zoom)
}

async function reverseGeocode(coords: YmapsCoords) {
  if (!ymapsApi) {
    return
  }

  try {
    const result = await ymapsApi.geocode(coords, { results: 1 })
    const geoObject = result.geoObjects.get(0)
    const address = geoObject?.getAddressLine()

    if (address) {
      emit('address', address)
    }
  }
  catch {
    // reverse geocode is best-effort
  }
}

async function searchByName(query: string) {
  const value = query.trim()

  if (!value || !ymapsApi || !map) {
    return false
  }

  try {
    const result = await ymapsApi.geocode(value, { results: 1 })
    const geoObject = result.geoObjects.get(0)

    if (!geoObject) {
      return false
    }

    const coords = geoObject.geometry.getCoordinates()
    const zoom = Math.max(map.getZoom(), 12)

    syncingFromProps = true
    map.setCenter(coords, zoom)
    setPlacemark(coords)
    syncingFromProps = false

    emitCoords(coords[0], coords[1], zoom)

    const address = geoObject.getAddressLine()
    if (address) {
      emit('address', address)
    }

    return true
  }
  catch {
    return false
  }
}

function applyPropsToMap() {
  if (!map) {
    return
  }

  const center = resolveCenter()
  const zoom = resolveZoom()

  syncingFromProps = true
  map.setCenter(center, zoom)
  setPlacemark(center)
  syncingFromProps = false
}

async function initMap() {
  if (!mapEl.value || map) {
    return
  }

  isMapLoading.value = true
  mapError.value = ''

  try {
    const config = useRuntimeConfig()
    const apikey = String(config.public.yandexMapsApiKey || '')
    ymapsApi = await loadYandexMaps21(apikey)

    const center = resolveCenter()
    const zoom = resolveZoom()

    map = new ymapsApi.Map(mapEl.value, {
      center,
      zoom,
      controls: ['zoomControl', 'geolocationControl'],
    }, {
      minZoom: 3,
      maxZoom: 18,
      yandexMapDisablePoiInteractivity: true,
    })

    setPlacemark(center)

    map.events.add('click', (event: YmapsEvent) => {
      const coords = event.get('coords') as YmapsCoords | undefined

      if (!coords) {
        return
      }

      setPlacemark(coords)
      emitCoords(coords[0], coords[1], map?.getZoom() ?? resolveZoom())
      void reverseGeocode(coords)
    })

    map.events.add('boundschange', (event: YmapsEvent) => {
      if (syncingFromProps || !map) {
        return
      }

      const newZoom = event.get('newZoom')
      const oldZoom = event.get('oldZoom')

      if (typeof newZoom === 'number' && newZoom !== oldZoom) {
        emit('update:zoom', newZoom)
      }
    })

    mapResizeObserver = new ResizeObserver(() => {
      map?.container.fitToViewport()
    })
    mapResizeObserver.observe(mapEl.value)
  }
  catch (error) {
    mapError.value = error instanceof Error ? error.message : 'Не удалось загрузить карту'
  }
  finally {
    isMapLoading.value = false
  }
}

watch(
  () => [props.lat, props.lng, props.zoom] as const,
  ([lat, lng, zoom]) => {
    if (!map || syncingFromProps) {
      return
    }

    const nextLat = Number(lat)
    const nextLng = Number(lng)
    const nextZoom = Number(zoom)

    if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) {
      return
    }

    const [currentLat, currentLng] = map.getCenter()
    const currentZoom = map.getZoom()
    const sameCenter = Math.abs(currentLat - nextLat) < 1e-9
      && Math.abs(currentLng - nextLng) < 1e-9
    const sameZoom = !Number.isFinite(nextZoom) || Math.abs(currentZoom - nextZoom) < 1e-9

    if (sameCenter && sameZoom) {
      setPlacemark([nextLat, nextLng])
      return
    }

    syncingFromProps = true
    map.setCenter(
      [nextLat, nextLng],
      Number.isFinite(nextZoom) && nextZoom > 0 ? nextZoom : currentZoom,
    )
    setPlacemark([nextLat, nextLng])
    syncingFromProps = false
  },
)

onMounted(() => {
  void initMap()
})

onBeforeUnmount(() => {
  mapResizeObserver?.disconnect()
  mapResizeObserver = null
  map?.destroy()
  map = null
  placemark = null
  ymapsApi = null
})

defineExpose({
  searchByName,
  applyPropsToMap,
})
</script>

<template>
  <div class="base-location-map">
    <div
      ref="mapEl"
      class="base-location-map__canvas"
      aria-label="Карта расположения базы"
    />

    <div
      v-if="isMapLoading"
      class="base-location-map__status"
      aria-live="polite"
    >
      <CommonSpinner variant="ring" size="md" label="Загрузка карты" />
    </div>

    <p v-else-if="mapError" class="base-location-map__status base-location-map__status--error">
      {{ mapError }}
    </p>
  </div>
</template>

<style scoped>
.base-location-map {
  position: relative;
  width: 100%;
  min-width: 0;
  height: 390px;
  border: 1px solid var(--wh-gray-400);
  border-radius: 10px;
  overflow: hidden;
  background: #f3f3f3;
  box-sizing: border-box;
}

.base-location-map__canvas {
  width: 100%;
  height: 100%;
}

.base-location-map__status {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 16px;
  background: rgba(255, 255, 255, 0.88);
  color: rgba(0, 0, 0, 0.55);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.35;
  text-align: center;
  pointer-events: none;
}

.base-location-map__status--error {
  color: #dc3545;
}
</style>
