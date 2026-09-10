<script setup lang="ts">
import type { BasesMapMarker } from '~/utils/map'
import { DEFAULT_MAP_CENTER } from '~/utils/map'

export type { BasesMapMarker }

const props = withDefaults(defineProps<{
  lat?: number
  lng?: number
  zoom?: number
  markers?: BasesMapMarker[]
  activeId?: number | null

  fitVersion?: number

  measureMode?: boolean

  measureOriginPoint?: { lat: number, lng: number, key?: number } | null
  showZoomControl?: boolean
  scrollWheelZoom?: boolean
  dragging?: boolean
}>(), {
  lat: DEFAULT_MAP_CENTER.lat,
  lng: DEFAULT_MAP_CENTER.lng,
  zoom: DEFAULT_MAP_CENTER.zoom,
  markers: () => [],
  activeId: null,
  fitVersion: 0,
  measureMode: false,
  measureOriginPoint: null,
  showZoomControl: true,
  scrollWheelZoom: true,
  dragging: true,
})

const emit = defineEmits<{
  select: [id: number]
  open: [id: number]
}>()

const config = useRuntimeConfig()
const provider = computed(() => (
  String(config.public.mapProvider || 'leaflet') === 'yandex' ? 'yandex' : 'leaflet'
))
</script>

<template>
  <SearchBasesMapYandex
    v-if="provider === 'yandex'"
    :lat="props.lat"
    :lng="props.lng"
    :zoom="props.zoom"
    :markers="props.markers"
    :active-id="props.activeId"
    :fit-version="props.fitVersion"
    :measure-mode="props.measureMode"
    :measure-origin-point="props.measureOriginPoint"
    :show-zoom-control="props.showZoomControl"
    :scroll-wheel-zoom="props.scrollWheelZoom"
    :dragging="props.dragging"
    @select="emit('select', $event)"
    @open="emit('open', $event)"
  />
  <SearchBasesMapLeaflet
    v-else
    :lat="props.lat"
    :lng="props.lng"
    :zoom="props.zoom"
    :markers="props.markers"
    :active-id="props.activeId"
    :fit-version="props.fitVersion"
    :measure-mode="props.measureMode"
    :measure-origin-point="props.measureOriginPoint"
    :show-zoom-control="props.showZoomControl"
    :scroll-wheel-zoom="props.scrollWheelZoom"
    :dragging="props.dragging"
    @select="emit('select', $event)"
    @open="emit('open', $event)"
  />
</template>
