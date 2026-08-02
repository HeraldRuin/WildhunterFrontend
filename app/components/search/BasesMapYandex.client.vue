<script setup lang="ts">
import { DEFAULT_MAP_CENTER, formatMapDistance, type BasesMapMarker } from '~/utils/map'
import { formatBasesCount } from '~/utils/pluralize'
import {
  loadYandexMaps21,
  type YmapsApi,
  type YmapsCoords,
  type YmapsEvent,
  type YmapsMap,
} from '~/utils/yandexMaps21'

export type { BasesMapMarker }

interface MarkerCluster {
  key: string
  lat: number
  lng: number
  items: BasesMapMarker[]
}

interface LatLngPoint {
  lat: number
  lng: number
}

const CLUSTER_PIXEL_DISTANCE = 32

const props = withDefaults(defineProps<{
  lat?: number
  lng?: number
  zoom?: number
  markers?: BasesMapMarker[]
  activeId?: number | null
  fitVersion?: number
  measureMode?: boolean
  measureOriginPoint?: { lat: number, lng: number, key?: number } | null
}>(), {
  lat: DEFAULT_MAP_CENTER.lat,
  lng: DEFAULT_MAP_CENTER.lng,
  zoom: DEFAULT_MAP_CENTER.zoom,
  markers: () => [],
  activeId: null,
  fitVersion: 0,
  measureMode: false,
  measureOriginPoint: null,
})

const emit = defineEmits<{
  select: [id: number]
}>()

const mapEl = ref<HTMLElement | null>(null)
const mapError = ref('')

let ymapsApi: YmapsApi | null = null
let map: (YmapsMap & { getCenter: () => YmapsCoords }) | null = null
const clusterObjects: unknown[] = []
let measureOrigin: LatLngPoint | null = null
let measureTarget: LatLngPoint | null = null
let measureOriginMarker: unknown = null
let measureLine: unknown = null
let measureLabelMarker: unknown = null
let syncMarkersScheduled = false
let lastClusterZoom: number | null = null
let ignoreBoundsChange = false
let pinLayout: unknown = null
let measureOriginLayout: unknown = null
let measureLabelLayout: unknown = null

function withQuietMove(run: () => void) {
  ignoreBoundsChange = true
  run()
  // boundschange may fire after animation frame / short delay
  window.setTimeout(() => {
    ignoreBoundsChange = false
    if (map && lastClusterZoom !== map.getZoom()) {
      syncMarkers()
    }
  }, 350)
}

function toCoords(point: LatLngPoint): YmapsCoords {
  return [point.lat, point.lng]
}

function projectToPixel(lat: number, lng: number, zoom: number) {
  const scale = 256 * 2 ** zoom
  const x = ((lng + 180) / 360) * scale
  const sin = Math.sin((lat * Math.PI) / 180)
  const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale
  return { x, y }
}

function boundsContain(bounds: [YmapsCoords, YmapsCoords], point: LatLngPoint): boolean {
  const south = Math.min(bounds[0][0], bounds[1][0])
  const north = Math.max(bounds[0][0], bounds[1][0])
  const west = Math.min(bounds[0][1], bounds[1][1])
  const east = Math.max(bounds[0][1], bounds[1][1])

  return point.lat >= south
    && point.lat <= north
    && point.lng >= west
    && point.lng <= east
}

function coordsBounds(points: LatLngPoint[]): [YmapsCoords, YmapsCoords] {
  const lats = points.map((item) => item.lat)
  const lngs = points.map((item) => item.lng)

  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ]
}

function ensureLayouts() {
  if (!ymapsApi || pinLayout) {
    return
  }

  const PinLayout = ymapsApi.templateLayoutFactory.createClass(
    `<div class="bases-map-pin $[properties.pinClass]" style="width:$[properties.pinSize]px;height:$[properties.pinSize]px;">
      <span class="bases-map-pin__dot">$[properties.iconContent]</span>
    </div>`,
  )
  pinLayout = PinLayout

  measureOriginLayout = ymapsApi.templateLayoutFactory.createClass(
    `<div class="bases-map-measure-origin">
      <span class="bases-map-measure-origin__dot"></span>
    </div>`,
  )

  measureLabelLayout = ymapsApi.templateLayoutFactory.createClass(
    `<div class="bases-map-measure-label">
      <span class="bases-map-measure-label__text">$[properties.iconContent]</span>
    </div>`,
  )
}

function buildClusters(): MarkerCluster[] {
  if (!map || props.markers.length === 0) {
    return []
  }

  const zoom = map.getZoom()
  const points = props.markers.map((item) => ({
    item,
    point: projectToPixel(item.lat, item.lng, zoom),
  }))

  const used = new Set<number>()
  const clusters: MarkerCluster[] = []

  for (let i = 0; i < points.length; i += 1) {
    if (used.has(i)) {
      continue
    }

    const groupIndexes = [i]
    used.add(i)

    let changed = true
    while (changed) {
      changed = false

      for (let j = 0; j < points.length; j += 1) {
        if (used.has(j)) {
          continue
        }

        const nearGroup = groupIndexes.some((index) => {
          const dx = points[index].point.x - points[j].point.x
          const dy = points[index].point.y - points[j].point.y
          return Math.hypot(dx, dy) <= CLUSTER_PIXEL_DISTANCE
        })

        if (nearGroup) {
          groupIndexes.push(j)
          used.add(j)
          changed = true
        }
      }
    }

    const items = groupIndexes.map((index) => points[index].item)
    const lat = items.reduce((sum, item) => sum + item.lat, 0) / items.length
    const lng = items.reduce((sum, item) => sum + item.lng, 0) / items.length

    clusters.push({
      key: items.map((item) => item.id).sort((a, b) => a - b).join('-'),
      lat,
      lng,
      items,
    })
  }

  return clusters
}

function hintContent(items: BasesMapMarker[]) {
  if (items.length === 1) {
    return items[0].title
  }

  return `${formatBasesCount(items.length)} рядом: ${items.map((item) => item.title).join(', ')}`
}

function clearClusterObjects() {
  if (!map) {
    clusterObjects.length = 0
    return
  }

  for (const object of clusterObjects) {
    map.geoObjects.remove(object)
  }
  clusterObjects.length = 0
}

function clearMeasureGraphics() {
  if (!map) {
    measureOriginMarker = null
    measureLine = null
    measureLabelMarker = null
    return
  }

  if (measureOriginMarker) {
    map.geoObjects.remove(measureOriginMarker)
    measureOriginMarker = null
  }

  if (measureLine) {
    map.geoObjects.remove(measureLine)
    measureLine = null
  }

  if (measureLabelMarker) {
    map.geoObjects.remove(measureLabelMarker)
    measureLabelMarker = null
  }
}

function resetMeasure() {
  measureOrigin = null
  measureTarget = null
  clearMeasureGraphics()
}

function syncMeasureGraphics() {
  if (!map || !ymapsApi) {
    return
  }

  clearMeasureGraphics()
  ensureLayouts()

  if (!props.measureMode || !measureOrigin) {
    return
  }

  measureOriginMarker = new ymapsApi.Placemark(
    toCoords(measureOrigin),
    {},
    {
      iconLayout: measureOriginLayout,
      iconShape: { type: 'Circle', coordinates: [0, 0], radius: 10 },
      zIndex: 200,
      interactive: false,
    },
  )
  map.geoObjects.add(measureOriginMarker)

  if (!measureTarget) {
    return
  }

  measureLine = new ymapsApi.Polyline(
    [toCoords(measureOrigin), toCoords(measureTarget)],
    {},
    {
      strokeColor: '#e8883a',
      strokeWidth: 2.5,
      strokeOpacity: 0.9,
      strokeStyle: 'dash',
      interactivityModel: 'default#silent',
    },
  )
  map.geoObjects.add(measureLine)

  const meters = ymapsApi.coordSystem.geo.getDistance(
    toCoords(measureOrigin),
    toCoords(measureTarget),
  )
  const label = formatMapDistance(meters)
  const mid: LatLngPoint = {
    lat: (measureOrigin.lat + measureTarget.lat) / 2,
    lng: (measureOrigin.lng + measureTarget.lng) / 2,
  }

  measureLabelMarker = new ymapsApi.Placemark(
    toCoords(mid),
    { iconContent: label },
    {
      iconLayout: measureLabelLayout,
      iconShape: { type: 'Rectangle', coordinates: [[-40, -12], [40, 12]] },
      zIndex: 250,
      interactive: false,
    },
  )
  map.geoObjects.add(measureLabelMarker)
}

function setMeasureOrigin(point: LatLngPoint, pan = false) {
  measureOrigin = point
  syncMeasureGraphics()

  if (pan && map) {
    void map.panTo(toCoords(point), {
      duration: 550,
      flying: false,
    })
  }
}

function setMeasureTarget(lat: number, lng: number) {
  measureTarget = { lat, lng }
  syncMeasureGraphics()
  fitMeasurePoints()
}

function fitMeasurePoints() {
  if (!map || !measureOrigin || !measureTarget) {
    return
  }

  const bounds = map.getBounds()
  if (bounds && boundsContain(bounds, measureOrigin) && boundsContain(bounds, measureTarget)) {
    return
  }

  const currentZoom = map.getZoom()
  map.setBounds(
    [toCoords(measureOrigin), toCoords(measureTarget)],
    {
      checkZoomRange: true,
      zoomMargin: 64,
      duration: 550,
    },
  )

  requestAnimationFrame(() => {
    if (!map) {
      return
    }

    if (map.getZoom() > currentZoom) {
      map.setCenter(map.getCenter(), currentZoom, { duration: 0 })
    }
  })
}

function applySingleBaseTargetIfNeeded() {
  if (props.markers.length !== 1) {
    return
  }

  const hotel = props.markers[0]
  setMeasureTarget(hotel.lat, hotel.lng)
  emit('select', hotel.id)
}

function onMapClick(event: YmapsEvent) {
  if (!props.measureMode) {
    return
  }

  const coords = event.get('coords') as YmapsCoords | undefined
  if (!coords) {
    return
  }

  setMeasureOrigin({ lat: coords[0], lng: coords[1] })
  applySingleBaseTargetIfNeeded()
}

function onBoundsChange(event: YmapsEvent) {
  if (ignoreBoundsChange) {
    return
  }

  // Clusters depend on zoom only (mercator pixels), not pan — skip rebuild while dragging.
  const newZoom = event.get('newZoom') as number | undefined
  const oldZoom = event.get('oldZoom') as number | undefined
  if (newZoom != null && oldZoom != null && newZoom === oldZoom) {
    return
  }

  if (syncMarkersScheduled) {
    return
  }

  syncMarkersScheduled = true
  requestAnimationFrame(() => {
    syncMarkersScheduled = false
    if (!map) {
      return
    }

    if (lastClusterZoom === map.getZoom()) {
      return
    }

    syncMarkers()
  })
}

function syncMarkers() {
  if (!map || !ymapsApi) {
    return
  }

  ensureLayouts()
  clearClusterObjects()
  lastClusterZoom = map.getZoom()

  const clusters = buildClusters()

  for (const cluster of clusters) {
    const isActive = cluster.items.some((item) => item.id === props.activeId)
    const isMulti = cluster.items.length > 1
    const size = isMulti ? 28 : (isActive ? 18 : 14)
    const pinClass = [
      isActive ? 'bases-map-pin--active' : '',
      isMulti ? 'bases-map-pin--cluster' : '',
    ].filter(Boolean).join(' ')

    const placemark = new ymapsApi.Placemark(
      [cluster.lat, cluster.lng],
      {
        iconContent: isMulti ? String(cluster.items.length) : '',
        pinClass,
        pinSize: size,
        hintContent: hintContent(cluster.items),
      },
      {
        iconLayout: pinLayout,
        iconShape: {
          type: 'Circle',
          coordinates: [0, 0],
          radius: size / 2,
        },
        zIndex: isActive ? 100 : (isMulti ? 50 : 0),
        hasBalloon: false,
      },
    )

    placemark.events.add('click', () => {
      if (isMulti) {
        if (props.measureMode) {
          if (measureOrigin) {
            setMeasureTarget(cluster.lat, cluster.lng)
          }
          return
        }

        fitClusterBounds(cluster.items)
        return
      }

      const item = cluster.items[0]

      if (props.measureMode) {
        if (measureOrigin) {
          setMeasureTarget(item.lat, item.lng)
        }

        emit('select', item.id)
        return
      }

      if (props.activeId === item.id) {
        withQuietMove(() => {
          map?.setCenter([item.lat, item.lng], props.zoom, { duration: 250 })
        })
        return
      }

      emit('select', item.id)
    })

    map.geoObjects.add(placemark)
    clusterObjects.push(placemark)
  }
}

function fitClusterBounds(items: BasesMapMarker[]) {
  if (!map || items.length === 0) {
    return
  }

  withQuietMove(() => {
    if (!map) {
      return
    }

    if (items.length === 1) {
      map.setCenter([items[0].lat, items[0].lng], Math.min(props.zoom, 15), { duration: 250 })
      return
    }

    map.setBounds(coordsBounds(items), {
      checkZoomRange: true,
      zoomMargin: 72,
      duration: 250,
    })
  })
}

function focusActive() {
  if (!map || props.activeId == null || props.measureMode) {
    return
  }

  withQuietMove(() => {
    map?.setCenter([props.lat, props.lng], props.zoom, { duration: 250 })
  })
}

function fitAllMarkers() {
  if (!map || props.markers.length === 0) {
    return
  }

  withQuietMove(() => {
    if (!map) {
      return
    }

    if (props.markers.length === 1) {
      const hotel = props.markers[0]
      map.setCenter([hotel.lat, hotel.lng], Math.min(props.zoom, 10), { duration: 300 })
      return
    }

    map.setBounds(coordsBounds(props.markers), {
      checkZoomRange: true,
      zoomMargin: 48,
      duration: 300,
    })

    requestAnimationFrame(() => {
      if (map && map.getZoom() > 10) {
        map.setCenter(map.getCenter(), 10, { duration: 0 })
      }
    })
  })
}

function syncMeasureModeCursor() {
  mapEl.value?.classList.toggle('bases-map--measure', Boolean(props.measureMode))
}

onMounted(async () => {
  const config = useRuntimeConfig()
  const apikey = String(config.public.yandexMapsApiKey || '')

  try {
    ymapsApi = await loadYandexMaps21(apikey)
    await nextTick()

    if (!mapEl.value || map) {
      return
    }

    map = new ymapsApi.Map(mapEl.value, {
      center: [DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng],
      zoom: DEFAULT_MAP_CENTER.zoom,
      controls: ['zoomControl'],
    }, {
      // Fewer interactive POIs — less UI chrome, snappier map.
      yandexMapDisablePoiInteractivity: true,
    }) as YmapsMap & { getCenter: () => YmapsCoords }

    map.events.add('click', onMapClick)
    map.events.add('boundschange', onBoundsChange)

    ensureLayouts()
    syncMarkers()
    syncMeasureModeCursor()

    requestAnimationFrame(() => {
      if (props.activeId == null) {
        fitAllMarkers()
      }
      else {
        focusActive()
      }
    })
  }
  catch (error) {
    console.error('[BasesMapYandex] init failed', error)
    mapError.value = 'Не удалось загрузить Яндекс.Карты. Проверьте API-ключ.'
  }
})

watch(
  () => [props.lat, props.lng, props.zoom, props.activeId] as const,
  () => {
    if (props.activeId == null) {
      return
    }

    focusActive()
  },
)

watch(
  () => props.fitVersion,
  (version, previous) => {
    if (version === previous) {
      return
    }

    fitAllMarkers()
  },
)

watch(
  () => [props.markers, props.activeId] as const,
  () => {
    syncMarkers()
  },
  { deep: true },
)

watch(
  () => props.markers.map((item) => item.id).join(','),
  (ids, previousIds) => {
    if (!props.measureMode || ids === previousIds) {
      return
    }

    if (props.markers.length !== 1) {
      resetMeasure()
      return
    }

    if (measureOrigin) {
      applySingleBaseTargetIfNeeded()
    }
  },
)

watch(
  () => props.measureMode,
  (enabled) => {
    syncMeasureModeCursor()

    if (!enabled) {
      resetMeasure()
      return
    }

    syncMeasureGraphics()
  },
)

watch(
  () => props.measureOriginPoint,
  (point) => {
    if (!props.measureMode) {
      return
    }

    if (!point) {
      measureOrigin = null
      syncMeasureGraphics()
      return
    }

    setMeasureOrigin({ lat: point.lat, lng: point.lng }, true)
    applySingleBaseTargetIfNeeded()
  },
)

watch(
  () => props.activeId,
  (id) => {
    if (!props.measureMode || id == null || !measureOrigin) {
      return
    }

    const hotel = props.markers.find((item) => item.id === id)
    if (!hotel) {
      return
    }

    setMeasureTarget(hotel.lat, hotel.lng)
  },
)

onBeforeUnmount(() => {
  if (map) {
    map.events.remove('click', onMapClick)
    map.events.remove('boundschange', onBoundsChange)
  }

  clearClusterObjects()
  resetMeasure()
  map?.destroy()
  map = null
  ymapsApi = null
})
</script>

<template>
  <div class="bases-map-wrap">
    <div
      ref="mapEl"
      class="bases-map"
      role="img"
      aria-label="Карта баз"
    />
    <p
      v-if="mapError"
      class="bases-map__error"
    >
      {{ mapError }}
    </p>
  </div>
</template>

<style scoped>
.bases-map-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  border-radius: 12px;
  background: #e8e8e8;
  overflow: hidden;
}

.bases-map {
  width: 100%;
  height: 100%;
  min-height: 0;
  border-radius: 12px;
  position: relative;
  z-index: 0;
  overflow: hidden;
  background: #e8e8e8;
}

.bases-map :deep([class*="map-bg"]),
.bases-map :deep([class*="ground-pane"]),
.bases-map :deep(.ymaps-2-1-79-map) {
  background: #e8e8e8 !important;
}

.bases-map.bases-map--measure,
.bases-map.bases-map--measure :deep(*) {
  cursor: crosshair;
}

.bases-map__error {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  place-items: center;
  margin: 0;
  padding: 24px;
  border-radius: 12px;
  text-align: center;
  color: var(--wh-gray-700, #4a4f4a);
  font-family: "Inter", sans-serif;
  font-size: 14px;
  line-height: 1.4;
  background: var(--wh-gray-200, #dddddd);
}

.bases-map :deep(.bases-map-pin) {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translate(-50%, -50%);
  background: transparent;
  border: none;
}

.bases-map :deep(.bases-map-pin__dot) {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  border: 2px solid #1a2e24;
  border-radius: 50%;
  background: #4a6b5a;
  box-sizing: border-box;
  box-shadow: 0 1px 3px rgb(0 0 0 / 25%);
  color: #fff;
  font-family: "Inter", sans-serif;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
}

.bases-map :deep(.bases-map-pin--cluster .bases-map-pin__dot) {
  border-color: #1a2e24;
  background: #3f5f4f;
}

.bases-map :deep(.bases-map-pin--active .bases-map-pin__dot) {
  border-color: #d64545;
  background: #e8883a;
}

.bases-map :deep(.bases-map-measure-origin) {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translate(-50%, -50%);
  background: transparent;
  border: none;
}

.bases-map :deep(.bases-map-measure-origin__dot) {
  display: block;
  width: 100%;
  height: 100%;
  border: 2px solid #fff;
  border-radius: 50%;
  background: #e8883a;
  box-shadow: 0 0 0 2px #e8883a, 0 2px 6px rgb(0 0 0 / 28%);
  box-sizing: border-box;
}

.bases-map :deep(.bases-map-measure-label) {
  transform: translate(-50%, -50%);
  background: transparent;
  border: none;
}

.bases-map :deep(.bases-map-measure-label__text) {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 8px;
  background: var(--wh-gray-900, #1c211c);
  color: #fff;
  font-family: "Inter", sans-serif;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgb(0 0 0 / 18%);
}

/* Keep «Открыть в Яндекс Картах» bottom-right; hide constructor/logo promo. */
.bases-map :deep([class*="copyrights-pane"]),
.bases-map :deep([class*="copyright-pane"]) {
  left: auto !important;
  right: 0 !important;
}

.bases-map :deep([class*="map-copyrights-promo"]) {
  left: auto !important;
  right: 8px !important;
  bottom: 8px !important;
}

/* Hide logo, constructor promo and «Условия использования»; keep open-in-maps link. */
.bases-map :deep([class*="gototech"]),
.bases-map :deep([class*="copyright__logo"]),
.bases-map :deep([class*="copyright-logo"]),
.bases-map :deep([class*="copyright__text"]),
.bases-map :deep([class*="copyright-text"]),
.bases-map :deep([class*="copyrights__text"]),
.bases-map :deep([class*="copyrights-pane"] > ymaps:not([class*="map-copyrights-promo"])),
.bases-map :deep(a[href*="map-constructor"]),
.bases-map :deep(a[href*="constructor.maps"]),
.bases-map :deep(a[href*="legal.yandex"]),
.bases-map :deep(a[href*="termsofuse"]) {
  display: none !important;
}
</style>
