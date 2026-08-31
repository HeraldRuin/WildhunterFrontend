<script setup lang="ts">
import type { DivIcon, LatLng, LeafletEvent, Map as LeafletMap, Marker, Polyline, Tooltip } from 'leaflet'
import { DEFAULT_MAP_CENTER, formatMapDistance, type BasesMapMarker } from '~/utils/map'
import { formatBasesCount } from '~/utils/pluralize'

export type { BasesMapMarker }

interface MarkerCluster {
  key: string
  lat: number
  lng: number
  items: BasesMapMarker[]
}

type TooltipDirection = 'top' | 'bottom' | 'left' | 'right'

const TOOLTIP_EDGE_PAD = 96

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
  open: [id: number]
}>()

const CLUSTER_PIXEL_DISTANCE = 32

const mapEl = ref<HTMLElement | null>(null)
let map: LeafletMap | null = null
let leaflet: typeof import('leaflet') | null = null
let mapResizeObserver: ResizeObserver | null = null
const clusterLayers: Marker[] = []

let measureOrigin: LatLng | null = null
let measureTarget: LatLng | null = null
let measureOriginMarker: Marker | null = null
let measureLine: Polyline | null = null
let measureLabelMarker: Marker | null = null

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function createPinIcon(count: number, isActive: boolean): DivIcon {
  if (!leaflet) {
    throw new Error('Leaflet is not initialized')
  }

  const isCluster = count > 1
  const size = isCluster ? 28 : (isActive ? 18 : 14)
  const classes = [
    'bases-map-pin',
    isActive ? 'bases-map-pin--active' : '',
    isCluster ? 'bases-map-pin--cluster' : '',
  ].filter(Boolean).join(' ')

  const inner = isCluster
    ? `<span class="bases-map-pin__dot" aria-hidden="true">${count}</span>`
    : '<span class="bases-map-pin__dot" aria-hidden="true"></span>'

  return leaflet.divIcon({
    className: classes,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: inner,
  })
}

function createMeasureOriginIcon(): DivIcon {
  if (!leaflet) {
    throw new Error('Leaflet is not initialized')
  }

  return leaflet.divIcon({
    className: 'bases-map-measure-origin',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    html: '<span class="bases-map-measure-origin__dot" aria-hidden="true"></span>',
  })
}

function createMeasureLabelIcon(text: string): DivIcon {
  if (!leaflet) {
    throw new Error('Leaflet is not initialized')
  }

  return leaflet.divIcon({
    className: 'bases-map-measure-label',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    html: `<span class="bases-map-measure-label__text">${escapeHtml(text)}</span>`,
  })
}

function buildClusters(): MarkerCluster[] {
  if (!map || props.markers.length === 0) {
    return []
  }

  const points = props.markers.map((item) => ({
    item,
    point: map!.latLngToLayerPoint([item.lat, item.lng]),
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
          const groupPoint = points[index]
          const candidatePoint = points[j]
          if (!groupPoint || !candidatePoint) {
            return false
          }

          const dx = groupPoint.point.x - candidatePoint.point.x
          const dy = groupPoint.point.y - candidatePoint.point.y
          return Math.hypot(dx, dy) <= CLUSTER_PIXEL_DISTANCE
        })

        if (nearGroup) {
          groupIndexes.push(j)
          used.add(j)
          changed = true
        }
      }
    }

    const items = groupIndexes.flatMap((index) => {
      const point = points[index]
      return point ? [point.item] : []
    })
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

function tooltipHtml(items: BasesMapMarker[]) {
  if (items.length === 1) {
    return escapeHtml(items[0]!.title)
  }

  const rows = items
    .map((item) => `<li>${escapeHtml(item.title)}</li>`)
    .join('')

  return `<div class="bases-map-tooltip__title">${formatBasesCount(items.length)} рядом</div><ul class="bases-map-tooltip__list">${rows}</ul>`
}

function tooltipOffsetForDirection(direction: TooltipDirection): [number, number] {
  switch (direction) {
    case 'bottom':
      return [0, 14]
    case 'left':
      return [-14, 0]
    case 'right':
      return [14, 0]
    case 'top':
    default:
      return [0, -14]
  }
}

function resolveTooltipDirection(lat: number, lng: number, isMulti: boolean): TooltipDirection {
  if (!map) {
    return 'top'
  }

  const point = map.latLngToContainerPoint([lat, lng])
  const size = map.getSize()
  const padX = isMulti ? 140 : TOOLTIP_EDGE_PAD
  const padY = isMulti ? 120 : TOOLTIP_EDGE_PAD

  const nearTop = point.y < padY
  const nearBottom = point.y > size.y - padY
  const nearLeft = point.x < padX
  const nearRight = point.x > size.x - padX

  if (nearTop) {
    return 'bottom'
  }

  if (nearBottom) {
    return 'top'
  }

  if (nearRight) {
    return 'left'
  }

  if (nearLeft) {
    return 'right'
  }

  return 'top'
}

function applyTooltipDirection(tooltip: Tooltip, direction: TooltipDirection) {
  if (!leaflet) {
    return
  }

  tooltip.options.direction = direction
  tooltip.options.offset = leaflet.point(...tooltipOffsetForDirection(direction))

  const el = tooltip.getElement()
  if (!el) {
    return
  }

  el.classList.remove(
    'leaflet-tooltip-top',
    'leaflet-tooltip-bottom',
    'leaflet-tooltip-left',
    'leaflet-tooltip-right',
  )
  el.classList.add(`leaflet-tooltip-${direction}`)
}

function clearClusterLayers() {
  for (const layer of clusterLayers) {
    layer.remove()
  }
  clusterLayers.length = 0
}

function clearMeasureGraphics() {
  measureOriginMarker?.remove()
  measureOriginMarker = null
  measureLine?.remove()
  measureLine = null
  measureLabelMarker?.remove()
  measureLabelMarker = null
}

function resetMeasure() {
  measureOrigin = null
  measureTarget = null
  clearMeasureGraphics()
}

function syncMeasureGraphics() {
  if (!map || !leaflet) {
    return
  }

  clearMeasureGraphics()

  if (!props.measureMode || !measureOrigin) {
    return
  }

  const L = leaflet

  measureOriginMarker = L.marker(measureOrigin, {
    icon: createMeasureOriginIcon(),
    interactive: false,
    keyboard: false,
    zIndexOffset: 200,
  }).addTo(map)

  if (!measureTarget) {
    return
  }

  measureLine = L.polyline([measureOrigin, measureTarget], {
    color: '#e8883a',
    weight: 2.5,
    opacity: 0.9,
    dashArray: '6 6',
    interactive: false,
  }).addTo(map)

  const meters = measureOrigin.distanceTo(measureTarget)
  const label = formatMapDistance(meters)
  const mid = L.latLng(
    (measureOrigin.lat + measureTarget.lat) / 2,
    (measureOrigin.lng + measureTarget.lng) / 2,
  )

  measureLabelMarker = L.marker(mid, {
    icon: createMeasureLabelIcon(label),
    interactive: false,
    keyboard: false,
    zIndexOffset: 250,
  }).addTo(map)
}

function setMeasureOrigin(latlng: LatLng, pan = false) {
  measureOrigin = latlng
  syncMeasureGraphics()

  if (pan && map) {
    map.panTo(latlng, {
      animate: true,
      duration: 0.55,
    })
  }
}

function setMeasureTarget(lat: number, lng: number) {
  if (!leaflet) {
    return
  }

  measureTarget = leaflet.latLng(lat, lng)
  syncMeasureGraphics()
  fitMeasurePoints()
}

function fitMeasurePoints() {
  if (!map || !leaflet || !measureOrigin || !measureTarget) {
    return
  }

  const view = map.getBounds()
  if (view.contains(measureOrigin) && view.contains(measureTarget)) {
    return
  }

  map.flyToBounds(leaflet.latLngBounds([measureOrigin, measureTarget]), {
    padding: [64, 64],
    maxZoom: map.getZoom(),
    duration: 0.55,
  })
}

function applySingleBaseTargetIfNeeded() {
  if (props.markers.length !== 1) {
    return
  }

  const hotel = props.markers[0]
  if (!hotel) {
    return
  }

  setMeasureTarget(hotel.lat, hotel.lng)
  emit('select', hotel.id)
}

function onMapClick(event: { latlng: LatLng }) {
  if (!props.measureMode) {
    return
  }

  setMeasureOrigin(event.latlng)
  applySingleBaseTargetIfNeeded()
}

function syncMarkers() {
  if (!map || !leaflet) {
    return
  }

  const L = leaflet
  clearClusterLayers()

  const clusters = buildClusters()

  for (const cluster of clusters) {
    const isActive = cluster.items.some((item) => item.id === props.activeId)
    const marker = L.marker([cluster.lat, cluster.lng], {
      icon: createPinIcon(cluster.items.length, isActive),
      keyboard: true,
      zIndexOffset: isActive ? 100 : (cluster.items.length > 1 ? 50 : 0),
    }).addTo(map)

    const isMulti = cluster.items.length > 1

    marker.bindTooltip(tooltipHtml(cluster.items), {
      direction: 'top',
      offset: [0, -14],
      opacity: 1,
      className: isMulti
        ? 'bases-map-tooltip bases-map-tooltip--multi'
        : 'bases-map-tooltip',
    })

    marker.on('mouseover', () => {
      const tooltip = marker.getTooltip()
      if (!tooltip || !leaflet) {
        return
      }

      const direction = resolveTooltipDirection(cluster.lat, cluster.lng, isMulti)
      tooltip.options.direction = direction
      tooltip.options.offset = leaflet.point(...tooltipOffsetForDirection(direction))
    })

    marker.on('tooltipopen', (event: LeafletEvent) => {
      const tooltip = (event as LeafletEvent & { tooltip?: Tooltip }).tooltip
      if (!tooltip || !map) {
        return
      }

      const direction = resolveTooltipDirection(cluster.lat, cluster.lng, isMulti)
      applyTooltipDirection(tooltip, direction)

      const layerPoint = map.latLngToLayerPoint(marker.getLatLng())
      const tooltipWithPosition = tooltip as Tooltip & {
        _setPosition?: (point: { x: number, y: number }) => void
      }
      tooltipWithPosition._setPosition?.(layerPoint)
    })

    marker.on('click', () => {
      if (cluster.items.length > 1) {
        if (props.measureMode) {
          if (measureOrigin) {
            setMeasureTarget(cluster.lat, cluster.lng)
          }
          return
        }

        const bounds = L.latLngBounds(
          cluster.items.map((item) => [item.lat, item.lng] as [number, number]),
        )
        map?.flyToBounds(bounds, {
          padding: [72, 72],
          maxZoom: 15,
          duration: 0.55,
        })
        return
      }

      const item = cluster.items[0]
      if (!item) {
        return
      }

      if (props.measureMode) {
        if (measureOrigin) {
          setMeasureTarget(item.lat, item.lng)
        }

        emit('select', item.id)
        return
      }

      emit('open', item.id)
    })

    clusterLayers.push(marker)
  }
}

function focusActive() {
  if (!map || props.activeId == null || props.measureMode) {
    return
  }

  map.flyTo([props.lat, props.lng], props.zoom, {
    duration: 0.6,
  })
}

function fitAllMarkers() {
  if (!map || !leaflet || props.markers.length === 0) {
    return
  }

  const bounds = leaflet.latLngBounds(
    props.markers.map((item) => [item.lat, item.lng] as [number, number]),
  )

  map.flyToBounds(bounds, {
    padding: [48, 48],
    maxZoom: 10,
    duration: 0.65,
  })
}

function syncMeasureModeCursor() {
  const container = map?.getContainer()
  if (!container) {
    return
  }

  container.classList.toggle('bases-map--measure', props.measureMode)
}

onMounted(async () => {
  const [leafletModule] = await Promise.all([
    import('leaflet'),
    import('leaflet/dist/leaflet.css'),
  ])
  const L = (leafletModule as { default?: typeof import('leaflet') }).default
    ?? leafletModule

  leaflet = L
  await nextTick()

  if (!mapEl.value || map) {
    return
  }

  map = L.map(mapEl.value, {
    scrollWheelZoom: true,
  }).setView([DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng], DEFAULT_MAP_CENTER.zoom)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map)

  map.on('zoomend', syncMarkers)
  map.on('moveend', syncMarkers)
  map.on('click', onMapClick)

  syncMarkers()
  syncMeasureModeCursor()

  mapResizeObserver = new ResizeObserver(() => {
    map?.invalidateSize({ animate: false })
  })
  mapResizeObserver.observe(mapEl.value)

  requestAnimationFrame(() => {
    map?.invalidateSize()
    if (props.activeId == null) {
      fitAllMarkers()
    }
    else {
      focusActive()
    }
  })
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
    if (!props.measureMode || !leaflet) {
      return
    }

    if (!point) {
      measureOrigin = null
      syncMeasureGraphics()
      return
    }

    setMeasureOrigin(leaflet.latLng(point.lat, point.lng), true)
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
  mapResizeObserver?.disconnect()
  mapResizeObserver = null
  map?.off('zoomend', syncMarkers)
  map?.off('moveend', syncMarkers)
  map?.off('click', onMapClick)
  clearClusterLayers()
  resetMeasure()
  map?.remove()
  map = null
  leaflet = null
})
</script>

<template>
  <div
    ref="mapEl"
    class="bases-map"
    role="img"
    aria-label="Карта баз"
  />
</template>

<style scoped>
.bases-map {
  width: 100%;
  height: 100%;
  min-height: 0;
  border-radius: 12px;
  position: relative;
  z-index: 0;
  overflow: hidden;
  background: var(--wh-gray-200, #dddddd);
}

.bases-map.bases-map--measure,
.bases-map.bases-map--measure :deep(.leaflet-grab),
.bases-map.bases-map--measure :deep(.leaflet-dragging) {
  cursor: crosshair;
}

.bases-map :deep(.bases-map-pin) {
  display: flex;
  align-items: center;
  justify-content: center;
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
  display: flex;
  align-items: center;
  justify-content: center;
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
  background: transparent;
  border: none;
}

.bases-map :deep(.bases-map-measure-label__text) {
  display: inline-block;
  transform: translate(-50%, -50%);
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

.bases-map :deep(.leaflet-control-attribution) {
  margin: 0 1px 1px 0;
  padding: 0 2px;
  max-width: none;
  border-radius: 2px;
  background: rgb(255 255 255 / 12%);
  color: rgb(28 33 28 / 22%);
  font-size: 5px;
  line-height: 1.15;
  white-space: nowrap;
  box-shadow: none;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transform: scale(0.92);
  transform-origin: bottom right;
}

.bases-map :deep(.leaflet-control-attribution a) {
  color: inherit;
}

.bases-map :deep(.bases-map-tooltip) {
  padding: 6px 10px;
  border: none;
  border-radius: 8px;
  background: var(--wh-gray-900, #1c211c);
  color: #fff;
  font-family: "Inter", sans-serif;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;
  box-shadow: 0 4px 12px rgb(0 0 0 / 18%);
}

.bases-map :deep(.bases-map-tooltip--multi) {
  padding: 8px 12px;
  min-width: 160px;
  max-width: 260px;
}

.bases-map :deep(.bases-map-tooltip__title) {
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  opacity: 0.8;
}

.bases-map :deep(.bases-map-tooltip__list) {
  margin: 0;
  padding: 0;
  list-style: none;
}

.bases-map :deep(.bases-map-tooltip__list li) {
  padding: 2px 0;
  line-height: 1.3;
}

.bases-map :deep(.bases-map-tooltip__list li + li) {
  border-top: 1px solid rgb(255 255 255 / 12%);
  margin-top: 2px;
  padding-top: 4px;
}

.bases-map :deep(.bases-map-tooltip.leaflet-tooltip-top::before) {
  border-top-color: var(--wh-gray-900, #1c211c);
}

.bases-map :deep(.bases-map-tooltip.leaflet-tooltip-bottom::before) {
  border-bottom-color: var(--wh-gray-900, #1c211c);
}

.bases-map :deep(.bases-map-tooltip.leaflet-tooltip-left::before) {
  border-left-color: var(--wh-gray-900, #1c211c);
}

.bases-map :deep(.bases-map-tooltip.leaflet-tooltip-right::before) {
  border-right-color: var(--wh-gray-900, #1c211c);
}
</style>
