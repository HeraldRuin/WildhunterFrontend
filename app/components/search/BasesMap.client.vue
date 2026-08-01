<script setup lang="ts">
import type { DivIcon, Map as LeafletMap, Marker } from 'leaflet'
import { DEFAULT_MAP_CENTER } from '~/utils/map'
import { formatBasesCount } from '~/utils/pluralize'

export interface BasesMapMarker {
  id: number
  title: string
  lat: number
  lng: number
}

interface MarkerCluster {
  key: string
  lat: number
  lng: number
  items: BasesMapMarker[]
}

const props = withDefaults(defineProps<{
  lat?: number
  lng?: number
  zoom?: number
  markers?: BasesMapMarker[]
  activeId?: number | null
  /** Increment to fit all markers into view. */
  fitVersion?: number
}>(), {
  lat: DEFAULT_MAP_CENTER.lat,
  lng: DEFAULT_MAP_CENTER.lng,
  zoom: DEFAULT_MAP_CENTER.zoom,
  markers: () => [],
  activeId: null,
  fitVersion: 0,
})

const emit = defineEmits<{
  select: [id: number]
}>()

const CLUSTER_PIXEL_DISTANCE = 32

const mapEl = ref<HTMLElement | null>(null)
let map: LeafletMap | null = null
let leaflet: typeof import('leaflet').default | null = null
const clusterLayers: Marker[] = []

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

function tooltipHtml(items: BasesMapMarker[]) {
  if (items.length === 1) {
    return escapeHtml(items[0].title)
  }

  const rows = items
    .map((item) => `<li>${escapeHtml(item.title)}</li>`)
    .join('')

  return `<div class="bases-map-tooltip__title">${formatBasesCount(items.length)} рядом</div><ul class="bases-map-tooltip__list">${rows}</ul>`
}

function clearClusterLayers() {
  for (const layer of clusterLayers) {
    layer.remove()
  }
  clusterLayers.length = 0
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

    marker.bindTooltip(tooltipHtml(cluster.items), {
      direction: 'top',
      offset: [0, -14],
      opacity: 1,
      className: cluster.items.length > 1
        ? 'bases-map-tooltip bases-map-tooltip--multi'
        : 'bases-map-tooltip',
    })

    marker.on('click', () => {
      if (cluster.items.length > 1) {
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

      if (props.activeId === item.id) {
        map?.flyTo([item.lat, item.lng], props.zoom, {
          duration: 0.6,
        })
        return
      }

      emit('select', item.id)
    })

    clusterLayers.push(marker)
  }
}

function focusActive() {
  if (!map || props.activeId == null) {
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

onMounted(async () => {
  const [{ default: L }] = await Promise.all([
    import('leaflet'),
    import('leaflet/dist/leaflet.css'),
  ])

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

  syncMarkers()

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

onBeforeUnmount(() => {
  map?.off('zoomend', syncMarkers)
  map?.off('moveend', syncMarkers)
  clearClusterLayers()
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

.bases-map :deep(.leaflet-control-attribution) {
  font-size: 11px;
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

.bases-map :deep(.bases-map-tooltip::before) {
  border-top-color: var(--wh-gray-900, #1c211c);
}
</style>
