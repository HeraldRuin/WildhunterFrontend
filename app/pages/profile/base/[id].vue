<script setup lang="ts">
import type { HotelManageUpdatePayload, ManagedHotelDetail } from '~/api/hotels'
import type { HotelRoomAttribute, HotelRoomAttributeTerm, SearchLocation } from '~/types/api'
import { DEFAULT_MAP_CENTER } from '~/utils/map'
import { extractMediaIdFromUrl } from '~/utils/image'

definePageMeta({
  layout: 'profile',
  middleware: 'baseadmin',
  profileScrollLock: true,
})

const route = useRoute()
const notifications = useNotifications()
const { hotels: hotelsApi, media: mediaApi, services: servicesApi, location: locationApi } = useApi()

const isCreateMode = computed(() => route.params.id === 'new')
const hotelId = computed(() => Number(route.params.id))

type BaseHotelEditTab = 'content' | 'places' | 'pricing' | 'attributes'
type ContentSubTab = 'content' | 'policy'
type PlacesSubTab = 'location' | 'surrounding'

type GalleryItem = {
  id: number | null
  url: string
  file?: File | null
}

const editTabs: { id: BaseHotelEditTab, label: string }[] = [
  { id: 'content', label: 'Контент базы' },
  { id: 'places', label: 'Места' },
  { id: 'pricing', label: 'Ценообразование' },
  { id: 'attributes', label: 'Атрибуты' },
]

const contentSubTabs: { id: ContentSubTab, label: string }[] = [
  { id: 'content', label: 'Контент' },
  { id: 'policy', label: 'Политика' },
]

const placesSubTabs: { id: PlacesSubTab, label: string }[] = [
  { id: 'location', label: 'Локация' },
  { id: 'surrounding', label: 'Окрестности' },
]

const hotel = ref<ManagedHotelDetail | null>(null)
const isLoading = ref(true)
const loadError = ref('')
const activeEditTab = ref<BaseHotelEditTab>('content')
const activeContentTab = ref<ContentSubTab>('content')
const activePlacesTab = ref<PlacesSubTab>('location')
const editTitle = ref('')
const editRating = ref(0)
const editContent = ref('')
const hoverRating = ref(0)
const galleryItems = ref<GalleryItem[]>([])
const galleryInputRef = ref<HTMLInputElement | null>(null)
const selectedGalleryIndex = ref<number | null>(null)
const attributeGroups = ref<HotelRoomAttribute[]>([])
const attributesLoading = ref(false)
const attributesError = ref('')
const selectedTermIds = ref<number[]>([])
const attrScrollEl = ref<HTMLElement | null>(null)
const attrPageCount = ref(1)
const attrPageIndex = ref(0)
const isSaving = ref(false)
let attributesLoaded = false
let attrResizeObserver: ResizeObserver | null = null

const editLocationId = ref<number | null>(null)
const editLocationQuery = ref('')
const editAddress = ref('')
const editMapLat = ref('')
const editMapLng = ref('')
const editMapZoom = ref('8')
const mapSearchQuery = ref('')
const mapSearchError = ref('')
const isLocationDropdownOpen = ref(false)
const locations = ref<SearchLocation[]>([])
const locationsLoading = ref(false)
const locationsError = ref('')
const locationMapRef = ref<{ searchByName: (query: string) => Promise<boolean> } | null>(null)
let locationsLoaded = false

type PolicyItem = {
  id: number
  title: string
  content: string
}

type SurroundingDistanceType = 'm' | 'km'

type SurroundingItem = {
  id: number
  name: string
  content: string
  value: string
  type: SurroundingDistanceType
}

let policyItemIdSeq = 0
const policyItems = ref<PolicyItem[]>([])

let surroundingItemIdSeq = 0
const surroundingItems = ref<SurroundingItem[]>([])

function addPolicyItem() {
  policyItemIdSeq += 1
  policyItems.value.push({
    id: policyItemIdSeq,
    title: '',
    content: '',
  })
}

function removePolicyItem(id: number) {
  policyItems.value = policyItems.value.filter(item => item.id !== id)
}

function addSurroundingItem() {
  surroundingItemIdSeq += 1
  surroundingItems.value.push({
    id: surroundingItemIdSeq,
    name: '',
    content: '',
    value: '',
    type: 'km',
  })
}

function removeSurroundingItem(id: number) {
  surroundingItems.value = surroundingItems.value.filter(item => item.id !== id)
}

function normalizeSurroundingType(value: unknown): SurroundingDistanceType {
  return value === 'm' ? 'm' : 'km'
}

function flattenSurroundingSource(source: ManagedHotelDetail['surrounding']): Array<{
  name?: string | null
  content?: string | null
  value?: string | number | null
  type?: string | null
}> {
  if (!source) {
    return []
  }

  if (Array.isArray(source)) {
    return source
  }

  if (typeof source === 'object') {
    return Object.values(source).flatMap((group) => {
      if (!Array.isArray(group)) {
        return []
      }

      return group
    })
  }

  return []
}

const ratingStars = [1, 2, 3, 4, 5] as const

const displayRating = computed(() => hoverRating.value || editRating.value)

function setEditRating(value: number) {
  editRating.value = value
}

function clearEditRating() {
  editRating.value = 0
  hoverRating.value = 0
}

function onRatingHover(value: number) {
  hoverRating.value = value
}

function onRatingLeave() {
  hoverRating.value = 0
}

function openGalleryPicker() {
  galleryInputRef.value?.click()
}

function onGalleryFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? []).filter(file => file.type.startsWith('image/'))

  if (!files.length) {
    return
  }

  galleryItems.value = [
    ...galleryItems.value,
    ...files.map(file => ({
      id: null as number | null,
      url: URL.createObjectURL(file),
      file,
    })),
  ]
  selectedGalleryIndex.value = null
  input.value = ''
}

function selectGalleryImage(index: number) {
  selectedGalleryIndex.value = selectedGalleryIndex.value === index ? null : index
}

function removeGalleryImage(index: number) {
  const item = galleryItems.value[index]
  if (item?.url.startsWith('blob:')) {
    URL.revokeObjectURL(item.url)
  }

  galleryItems.value = galleryItems.value.filter((_, i) => i !== index)
  selectedGalleryIndex.value = null
}

function resolveGalleryItemId(item: {
  id?: number | null
  large?: string | null
  medium?: string | null
  thumb?: string | null
}, fallbackUrl = ''): number | null {
  const directId = Number(item.id)
  if (Number.isFinite(directId) && directId > 0) {
    return directId
  }

  return extractMediaIdFromUrl(item.large || item.medium || item.thumb || fallbackUrl)
}

function uniquePositiveIds(ids: Array<number | null | undefined>): number[] {
  const result: number[] = []
  const seen = new Set<number>()

  for (const value of ids) {
    const id = Number(value)
    if (!Number.isFinite(id) || id <= 0 || seen.has(id)) {
      continue
    }

    seen.add(id)
    result.push(id)
  }

  return result
}

async function uploadPendingGalleryItems() {
  const nextItems = [...galleryItems.value]

  for (let index = 0; index < nextItems.length; index += 1) {
    const item = nextItems[index]
    if (!item || item.id != null || !item.file) {
      continue
    }

    const uploaded = await mediaApi.store(item.file)
    const previousUrl = item.url

    nextItems[index] = {
      id: uploaded.id,
      url: uploaded.url || item.url,
      file: null,
    }

    if (previousUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previousUrl)
    }
  }

  galleryItems.value = nextItems
}

const pageTitle = computed(() => {
  if (isCreateMode.value) {
    return 'Новая база'
  }

  return hotel.value?.title ?? 'Редактирование базы'
})

const breadcrumbs = computed(() => [
  { label: 'Главная', to: '/' },
  { label: 'Параметры' },
  { label: 'Управление базой', to: '/profile/base' },
  { label: pageTitle.value },
])

const showForm = computed(() => isCreateMode.value || Boolean(hotel.value))

useHead({
  title: () => `${pageTitle.value} — WH`,
})

function selectEditTab(tab: BaseHotelEditTab) {
  activeEditTab.value = tab

  if (tab === 'content') {
    activeContentTab.value = 'content'
  }

  if (tab === 'attributes') {
    void loadAttributes()
    scheduleAttrPagesUpdate()
  }

  if (tab === 'places') {
    activePlacesTab.value = 'location'
    void loadLocations()
  }
}

function selectContentTab(tab: ContentSubTab) {
  activeContentTab.value = tab
}

function selectPlacesTab(tab: PlacesSubTab) {
  activePlacesTab.value = tab
}

const filteredLocations = computed(() => {
  const query = editLocationQuery.value.trim().toLowerCase()

  if (!query) {
    return locations.value
  }

  return locations.value.filter(item => item.name.toLowerCase().includes(query))
})

const mapLatNumber = computed(() => {
  const value = Number(editMapLat.value.replace(',', '.'))
  return Number.isFinite(value) ? value : null
})

const mapLngNumber = computed(() => {
  const value = Number(editMapLng.value.replace(',', '.'))
  return Number.isFinite(value) ? value : null
})

const mapZoomNumber = computed(() => {
  const value = Number(editMapZoom.value.replace(',', '.'))
  return Number.isFinite(value) && value > 0 ? value : 8
})

function openLocationDropdown() {
  isLocationDropdownOpen.value = true
  void loadLocations()
}

function closeLocationDropdown() {
  isLocationDropdownOpen.value = false
}

function selectLocation(item: SearchLocation) {
  editLocationId.value = item.id
  editLocationQuery.value = item.name
  closeLocationDropdown()
}

function onLocationQueryInput(value: string) {
  editLocationQuery.value = value

  const match = locations.value.find(
    item => item.name.toLowerCase() === value.trim().toLowerCase(),
  )

  editLocationId.value = match?.id ?? null
  openLocationDropdown()
}

function onLocationBlur() {
  window.setTimeout(() => {
    closeLocationDropdown()
  }, 150)
}

function onMapLatUpdate(value: number) {
  editMapLat.value = String(value)
}

function onMapLngUpdate(value: number) {
  editMapLng.value = String(value)
}

function onMapZoomUpdate(value: number) {
  editMapZoom.value = String(Math.round(value))
}

function onMapAddress(value: string) {
  if (value) {
    editAddress.value = value
  }
}

async function searchMapByName() {
  mapSearchError.value = ''
  const query = mapSearchQuery.value.trim()

  if (!query) {
    return
  }

  const found = await locationMapRef.value?.searchByName(query)

  if (!found) {
    mapSearchError.value = 'Ничего не найдено'
  }
}

function onMapSearchKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter') {
    return
  }

  event.preventDefault()
  void searchMapByName()
}

function clearMapSearch() {
  mapSearchQuery.value = ''
  mapSearchError.value = ''
}

async function loadLocations() {
  if (locationsLoaded || locationsLoading.value) {
    return
  }

  locationsLoading.value = true
  locationsError.value = ''

  try {
    locations.value = await locationApi.getLocationItems()
    locationsLoaded = true

    if (editLocationId.value && !editLocationQuery.value) {
      const match = locations.value.find(item => item.id === editLocationId.value)
      if (match) {
        editLocationQuery.value = match.name
      }
    }
  }
  catch {
    locationsError.value = 'Не удалось загрузить локации'
  }
  finally {
    locationsLoading.value = false
  }
}

function attributeGroupTitle(group: HotelRoomAttribute) {
  return `Атрибут: ${group.name}`
}

function termLabel(term: HotelRoomAttributeTerm) {
  return term.translation?.name || term.name
}

function isTermSelected(termId: number) {
  return selectedTermIds.value.includes(termId)
}

function toggleTerm(termId: number) {
  if (selectedTermIds.value.includes(termId)) {
    selectedTermIds.value = selectedTermIds.value.filter(id => id !== termId)
    return
  }

  selectedTermIds.value = [...selectedTermIds.value, termId]
}

function getAttrMaxScroll(el: HTMLElement) {
  return Math.max(0, el.scrollHeight - el.clientHeight)
}

function getAttrPageCount(el: HTMLElement) {
  const pageSize = el.clientHeight || 1
  const maxScroll = getAttrMaxScroll(el)

  if (maxScroll <= 8) {
    return 1
  }

  return Math.max(1, Math.ceil((maxScroll + pageSize) / pageSize))
}

function getAttrPageIndex(el: HTMLElement, pageCount: number) {
  if (pageCount <= 1) {
    return 0
  }

  const maxScroll = getAttrMaxScroll(el)

  if (el.scrollTop >= maxScroll - 2) {
    return pageCount - 1
  }

  return Math.min(
    pageCount - 1,
    Math.round((el.scrollTop / maxScroll) * (pageCount - 1)),
  )
}

function updateAttrPages() {
  const el = attrScrollEl.value
  if (!el) {
    attrPageCount.value = 1
    attrPageIndex.value = 0
    return
  }

  const pages = getAttrPageCount(el)
  attrPageCount.value = pages
  attrPageIndex.value = getAttrPageIndex(el, pages)
}

function scheduleAttrPagesUpdate() {
  void nextTick(() => {
    updateAttrPages()
    requestAnimationFrame(() => {
      updateAttrPages()
      requestAnimationFrame(updateAttrPages)
    })
  })
}

function onAttrScroll() {
  const el = attrScrollEl.value
  if (!el) {
    return
  }

  attrPageIndex.value = getAttrPageIndex(el, attrPageCount.value)
}

function scrollAttrToPage(index: number) {
  const el = attrScrollEl.value
  if (!el || attrPageCount.value <= 1) {
    return
  }

  const maxScroll = getAttrMaxScroll(el)
  const top = Math.round((index / (attrPageCount.value - 1)) * maxScroll)

  el.scrollTo({ top, behavior: 'smooth' })
  attrPageIndex.value = index
}

async function loadAttributes() {
  if (attributesLoaded || attributesLoading.value) {
    return
  }

  attributesLoading.value = true
  attributesError.value = ''

  try {
    attributeGroups.value = await servicesApi.getAttributeGroups('hotel')
    attributesLoaded = true
    scheduleAttrPagesUpdate()
  }
  catch {
    attributesError.value = 'Не удалось загрузить атрибуты'
  }
  finally {
    attributesLoading.value = false
  }
}

function revokeGalleryBlobUrls() {
  for (const item of galleryItems.value) {
    if (item.url.startsWith('blob:')) {
      URL.revokeObjectURL(item.url)
    }
  }
}

function resetForm() {
  revokeGalleryBlobUrls()
  editTitle.value = ''
  editRating.value = 0
  editContent.value = ''
  hoverRating.value = 0
  galleryItems.value = []
  selectedGalleryIndex.value = null
  selectedTermIds.value = []
  policyItems.value = []
  policyItemIdSeq = 0
  surroundingItems.value = []
  surroundingItemIdSeq = 0
  editLocationId.value = null
  editLocationQuery.value = ''
  editAddress.value = ''
  editMapLat.value = String(DEFAULT_MAP_CENTER.lat)
  editMapLng.value = String(DEFAULT_MAP_CENTER.lng)
  editMapZoom.value = '8'
  mapSearchQuery.value = ''
  mapSearchError.value = ''
  isLocationDropdownOpen.value = false
  activeEditTab.value = 'content'
  activeContentTab.value = 'content'
  activePlacesTab.value = 'location'
}

function extractErrorMessage(source: unknown, fallback: string) {
  if (!source || typeof source !== 'object') {
    return fallback
  }

  const payload = source as {
    success?: boolean
    message?: string
    data?: unknown
  }

  if (payload.message) {
    return payload.message
  }

  if (payload.data && payload.data !== source) {
    return extractErrorMessage(payload.data, fallback)
  }

  return fallback
}

function galleryPreviewUrl(item: ManagedHotelDetail['gallery'][number]) {
  return item.medium || item.large || item.thumb || ''
}

function fillFormFromHotel(item: ManagedHotelDetail) {
  revokeGalleryBlobUrls()

  editTitle.value = item.title ?? ''
  editRating.value = Math.min(5, Math.max(0, Math.round(Number(item.star_rate) || 0)))
  editContent.value = item.content ?? ''
  selectedGalleryIndex.value = null

  const galleryFromApi = (item.gallery ?? [])
    .map((galleryItem) => {
      const url = galleryPreviewUrl(galleryItem)
      if (!url) {
        return null
      }

      return {
        id: resolveGalleryItemId(galleryItem, url),
        url,
        file: null,
      }
    })
    .filter((galleryItem): galleryItem is GalleryItem => Boolean(galleryItem))

  const uniqueGallery: GalleryItem[] = []
  const seenIds = new Set<number>()

  for (const galleryItem of galleryFromApi) {
    if (galleryItem.id != null) {
      if (seenIds.has(galleryItem.id)) {
        continue
      }
      seenIds.add(galleryItem.id)
    }

    uniqueGallery.push(galleryItem)
  }

  if (uniqueGallery.length) {
    galleryItems.value = uniqueGallery
  }
  else if (item.image_url) {
    galleryItems.value = [{
      id: item.image_id ?? extractMediaIdFromUrl(item.image_url),
      url: item.image_url,
      file: null,
    }]
  }
  else {
    galleryItems.value = []
  }

  policyItemIdSeq = 0
  policyItems.value = (item.policy ?? []).map((policyItem) => {
    policyItemIdSeq += 1
    return {
      id: policyItemIdSeq,
      title: policyItem.title ?? '',
      content: policyItem.content ?? '',
    }
  })

  selectedTermIds.value = Array.isArray(item.term_ids)
    ? item.term_ids.map(Number).filter(id => Number.isFinite(id) && id > 0)
    : []

  editLocationId.value = item.location_id ?? item.location?.id ?? null
  editLocationQuery.value = item.location?.name ?? ''
  editAddress.value = item.address ?? ''

  const lat = Number(item.map_lat)
  const lng = Number(item.map_lng)
  const zoom = Number(item.map_zoom)

  editMapLat.value = Number.isFinite(lat) ? String(lat) : String(DEFAULT_MAP_CENTER.lat)
  editMapLng.value = Number.isFinite(lng) ? String(lng) : String(DEFAULT_MAP_CENTER.lng)
  editMapZoom.value = Number.isFinite(zoom) && zoom > 0 ? String(Math.round(zoom)) : '8'
  mapSearchQuery.value = ''
  mapSearchError.value = ''

  surroundingItemIdSeq = 0
  surroundingItems.value = flattenSurroundingSource(item.surrounding)
    .filter((entry) => {
      const name = String(entry.name ?? '').trim()
      const content = String(entry.content ?? '').trim()
      const value = entry.value == null ? '' : String(entry.value).trim()
      return Boolean(name || content || value)
    })
    .map((entry) => {
      surroundingItemIdSeq += 1
      return {
        id: surroundingItemIdSeq,
        name: entry.name ?? '',
        content: entry.content ?? '',
        value: entry.value == null ? '' : String(entry.value),
        type: normalizeSurroundingType(entry.type),
      }
    })
}

function buildSavePayload(galleryIds: number[]): HotelManageUpdatePayload {
  const current = hotel.value
  const uniqueGalleryIds = uniquePositiveIds(galleryIds)
  const currentImageId = current?.image_id ?? null
  const imageId = uniqueGalleryIds.includes(currentImageId ?? -1)
    ? currentImageId
    : (uniqueGalleryIds[0] ?? null)

  return {
    title: editTitle.value.trim(),
    slug: current?.slug,
    content: editContent.value,
    star_rate: Math.min(5, Math.max(0, Math.round(editRating.value) || 0)),
    address: editAddress.value.trim(),
    image_id: imageId,
    gallery: uniqueGalleryIds,
    policy: policyItems.value.map(item => ({
      title: item.title.trim(),
      content: item.content.trim(),
    })),
    surrounding: surroundingItems.value.map(item => ({
      name: item.name.trim(),
      content: item.content.trim(),
      value: item.value.trim(),
      type: item.type,
    })),
    price: current?.price ?? null,
    extra_price: current?.extra_price ?? [],
    service_fee: current?.service_fee ?? [],
    map_lat: editMapLat.value.trim(),
    map_lng: editMapLng.value.trim(),
    map_zoom: editMapZoom.value.trim(),
    location_id: editLocationId.value,
    status: current?.status ?? 'publish',
    has_food: current?.has_food ?? false,
    term_ids: [...selectedTermIds.value],
  }
}

async function saveHotel() {
  if (isSaving.value || isLoading.value) {
    return
  }

  const title = editTitle.value.trim()

  if (!title) {
    notifications.error('Укажите название базы')
    return
  }

  if (!isCreateMode.value && (!Number.isFinite(hotelId.value) || hotelId.value <= 0)) {
    notifications.error('Некорректный идентификатор базы')
    return
  }

  isSaving.value = true

  try {
    await uploadPendingGalleryItems()

    const galleryIds = galleryItems.value.map(item => item.id)
    const payload = buildSavePayload(galleryIds)

    const response = isCreateMode.value
      ? await hotelsApi.createManage(payload)
      : await hotelsApi.updateManage(hotelId.value, payload)

    if ('success' in response && response.success) {
      hotel.value = response.data
      fillFormFromHotel(response.data)
      notifications.success(
        response.message || (isCreateMode.value ? 'База создана' : 'База сохранена'),
      )

      if (isCreateMode.value && response.data.id) {
        await navigateTo(`/profile/base/${response.data.id}`, { replace: true })
      }

      return
    }

    notifications.error(
      extractErrorMessage(
        response,
        isCreateMode.value ? 'Не удалось создать базу' : 'Не удалось сохранить базу',
      ),
    )
  }
  catch (error) {
    const data = (error as { data?: unknown, message?: string }).data
    notifications.error(
      extractErrorMessage(
        data,
        (error as { message?: string }).message
          || (isCreateMode.value ? 'Не удалось создать базу' : 'Не удалось сохранить базу'),
      ),
    )
  }
  finally {
    isSaving.value = false
  }
}

async function loadHotel() {
  if (isCreateMode.value) {
    hotel.value = null
    resetForm()
    loadError.value = ''
    isLoading.value = false
    return
  }

  if (!Number.isFinite(hotelId.value) || hotelId.value <= 0) {
    hotel.value = null
    loadError.value = 'Некорректный идентификатор базы'
    isLoading.value = false
    return
  }

  isLoading.value = true
  loadError.value = ''

  try {
    const response = await hotelsApi.getManageById(hotelId.value)

    if ('success' in response && response.success) {
      hotel.value = response.data
      fillFormFromHotel(response.data)
      return
    }

    hotel.value = null
    loadError.value = extractErrorMessage(response, 'Не удалось загрузить базу')
  }
  catch (error) {
    hotel.value = null
    const data = (error as { data?: unknown }).data
    loadError.value = extractErrorMessage(data, 'Не удалось загрузить базу')
  }
  finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void loadHotel()
  window.addEventListener('resize', scheduleAttrPagesUpdate)

  if (import.meta.client && typeof ResizeObserver !== 'undefined') {
    attrResizeObserver = new ResizeObserver(() => {
      updateAttrPages()
    })

    void nextTick(() => {
      if (attrScrollEl.value) {
        attrResizeObserver?.observe(attrScrollEl.value)
      }
      updateAttrPages()
    })
  }
  else {
    scheduleAttrPagesUpdate()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', scheduleAttrPagesUpdate)
  attrResizeObserver?.disconnect()
  attrResizeObserver = null
})

watch(() => route.params.id, () => {
  void loadHotel()
})

watch(() => attributeGroups.value.length, () => {
  scheduleAttrPagesUpdate()
  void nextTick(() => {
    if (attrScrollEl.value && attrResizeObserver) {
      attrResizeObserver.disconnect()
      attrResizeObserver.observe(attrScrollEl.value)
    }
  })
})

watch(attrScrollEl, (el) => {
  if (!el || !attrResizeObserver) {
    return
  }

  attrResizeObserver.disconnect()
  attrResizeObserver.observe(el)
  updateAttrPages()
})

watch(activeEditTab, (tab) => {
  if (tab === 'attributes') {
    scheduleAttrPagesUpdate()
  }
})
</script>

<template>
  <div class="profile-page">
    <div class="base-edit">
      <header class="profile-page__header">
        <AppBreadcrumbs :items="breadcrumbs" />

        <ProfileNotificationsBell />
      </header>

      <div class="base-edit__title-row">
        <CommonPageTitle>{{ pageTitle }}</CommonPageTitle>

        <NuxtLink
          to="/profile/base"
          class="base-edit__back"
        >
          <svg
            class="base-edit__back-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Назад к списку баз
        </NuxtLink>
      </div>

      <div
        v-if="showForm && !loadError && !isLoading"
        class="base-edit__nav-row"
      >
        <nav
          class="base-edit__nav"
          aria-label="Разделы редактирования"
        >
          <button
            v-for="tab in editTabs"
            :key="tab.id"
            type="button"
            class="base-edit__nav-link"
            :class="{ 'base-edit__nav-link--active': activeEditTab === tab.id }"
            @click="selectEditTab(tab.id)"
          >
            {{ tab.label }}
          </button>
        </nav>

        <CommonSaveButton
          type="button"
          class="base-edit__nav-save"
          :loading="isSaving"
          :disabled="isLoading"
          @click="saveHotel"
        />
      </div>

      <div class="base-edit__panel-area">
        <div v-if="loadError || isLoading" class="base-edit__panel">
          <div class="base-edit__body">
            <p v-if="loadError" class="base-edit__status base-edit__status--error">
              {{ loadError }}
            </p>

            <div
              v-else
              class="base-edit__loading"
              aria-live="polite"
            >
              <CommonSpinner variant="ring" size="lg" label="Загрузка базы" />
            </div>
          </div>
        </div>

        <div
          v-else-if="showForm"
          class="base-edit__panel-shell"
        >
          <div
            v-if="activeEditTab === 'attributes' && attributeGroups.length"
            class="base-edit__attr-dots"
            :class="{ 'base-edit__attr-dots--hidden': attrPageCount <= 1 }"
            role="tablist"
            aria-label="Страницы атрибутов"
            :aria-hidden="attrPageCount <= 1"
          >
            <button
              v-for="page in attrPageCount"
              :key="page"
              type="button"
              class="base-edit__attr-dot"
              :class="{ 'base-edit__attr-dot--active': page - 1 === attrPageIndex }"
              :aria-label="`Страница ${page}`"
              :aria-current="page - 1 === attrPageIndex ? 'true' : undefined"
              :tabindex="attrPageCount > 1 ? 0 : -1"
              @click="scrollAttrToPage(page - 1)"
            />
          </div>

          <div class="base-edit__panel">
          <div
            ref="attrScrollEl"
            class="base-edit__body"
            @scroll.passive="onAttrScroll"
          >
            <div v-if="activeEditTab === 'content'" class="base-edit__section">
              <nav
                class="base-edit__subnav"
                aria-label="Разделы контента"
              >
                <button
                  v-for="tab in contentSubTabs"
                  :key="tab.id"
                  type="button"
                  class="base-edit__subnav-link"
                  :class="{ 'base-edit__subnav-link--active': activeContentTab === tab.id }"
                  @click="selectContentTab(tab.id)"
                >
                  {{ tab.label }}
                </button>
              </nav>

              <div v-if="activeContentTab === 'content'" class="base-edit__content">
              <div class="base-edit__form">
                <div class="base-edit__form-row">
                  <CommonFormField
                    v-model="editTitle"
                    label="Название"
                    placeholder="Название отеля"
                    no-margin
                  />
                  <div class="base-edit__rating">
                    <span class="base-edit__rating-label">Рейтинг</span>
                    <div
                      class="base-edit__stars"
                      role="radiogroup"
                      aria-label="Рейтинг"
                      @mouseleave="onRatingLeave"
                    >
                      <button
                        v-for="star in ratingStars"
                        :key="star"
                        type="button"
                        class="base-edit__star"
                        :class="{ 'base-edit__star--active': star <= displayRating }"
                        :aria-label="`${star} из 5`"
                        :aria-checked="star === editRating"
                        role="radio"
                        @mouseenter="onRatingHover(star)"
                        @focus="onRatingHover(star)"
                        @blur="onRatingLeave"
                        @click="setEditRating(star)"
                      >
                        <svg
                          width="28"
                          height="28"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path
                            d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.77l-4.94 2.6.94-5.5-4-3.9 5.53-.8L10 1.5Z"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.25"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </button>

                      <button
                        v-if="editRating > 0"
                        type="button"
                        class="base-edit__rating-clear"
                        @mouseenter="onRatingLeave"
                        @click.stop="clearEditRating"
                      >
                        Очистить
                      </button>
                    </div>
                  </div>
                </div>
                <CommonFormField
                  v-model="editContent"
                  class="base-edit__form-content"
                  label="Контент"
                  placeholder=""
                  multiline
                  :rows="4"
                  no-margin
                />
              </div>

              <section class="base-edit__gallery" aria-label="Галерея">
                <h3 class="base-edit__gallery-title">Галерея</h3>

                <div v-if="galleryItems.length" class="base-edit__gallery-list">
                  <div
                    v-for="(item, index) in galleryItems"
                    :key="`${item.id ?? 'new'}-${item.url}-${index}`"
                    class="base-edit__gallery-item"
                    :class="{ 'base-edit__gallery-item--selected': selectedGalleryIndex === index }"
                    role="button"
                    tabindex="0"
                    :aria-label="`Фото галереи ${index + 1}`"
                    @click="selectGalleryImage(index)"
                    @keydown.enter.prevent="selectGalleryImage(index)"
                    @keydown.space.prevent="selectGalleryImage(index)"
                  >
                    <img
                      :src="item.url"
                      :alt="`Фото галереи ${index + 1}`"
                      class="base-edit__gallery-image"
                    >
                    <button
                      v-if="selectedGalleryIndex === index"
                      type="button"
                      class="base-edit__gallery-remove"
                      aria-label="Удалить фото"
                      @click.stop="removeGalleryImage(index)"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M9 3.75A1.75 1.75 0 0 1 10.75 2h2.5A1.75 1.75 0 0 1 15 3.75V5h3.25a.75.75 0 0 1 0 1.5H5.75a.75.75 0 0 1 0-1.5H9V3.75Zm1.5.25v1h3v-1a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z" />
                        <path d="M6.3 8.05c.08-.33.38-.55.72-.55h10c.34 0 .64.22.72.55l1.05 12.1A2.25 2.25 0 0 1 16.55 22.5H7.45a2.25 2.25 0 0 1-2.24-2.4L6.3 8.05Zm3.45 2.7a.75.75 0 0 0-1.5.1l.4 7a.75.75 0 0 0 1.5-.09l-.4-7Zm5.5-.1a.75.75 0 0 0-1.5.09l.4 7a.75.75 0 0 0 1.5-.1l-.4-7Z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <input
                  ref="galleryInputRef"
                  type="file"
                  class="base-edit__gallery-input"
                  accept="image/*"
                  multiple
                  @change="onGalleryFilesSelected"
                >

                <button
                  type="button"
                  class="base-edit__gallery-btn"
                  @click="openGalleryPicker"
                >
                  <svg
                    class="base-edit__gallery-btn-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" />
                    <path
                      d="M12 8v8M8 12h8"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                    />
                  </svg>
                  Выбрать изображения
                </button>
              </section>
              </div>

              <div v-else class="base-edit__policy">
              <div class="base-edit__policy-table">
                <div class="base-edit__policy-head" aria-hidden="true">
                  <span class="base-edit__policy-head-cell">Название</span>
                  <span class="base-edit__policy-head-cell">Контент</span>
                  <span class="base-edit__policy-head-cell base-edit__policy-head-cell--action" />
                </div>

                <div
                  v-for="item in policyItems"
                  :key="item.id"
                  class="base-edit__policy-row"
                >
                  <CommonFormField
                    v-model="item.title"
                    placeholder="Название"
                    no-margin
                  />
                  <CommonFormField
                    v-model="item.content"
                    placeholder="Контент"
                    multiline
                    resizable
                    :rows="1"
                    no-margin
                  />
                  <button
                    type="button"
                    class="base-edit__policy-remove"
                    @click="removePolicyItem(item.id)"
                  >
                    Удалить
                  </button>
                </div>
              </div>
              </div>
            </div>

            <div v-else-if="activeEditTab === 'places'" class="base-edit__places">
              <nav
                class="base-edit__subnav"
                aria-label="Разделы мест"
              >
                <button
                  v-for="tab in placesSubTabs"
                  :key="tab.id"
                  type="button"
                  class="base-edit__subnav-link"
                  :class="{ 'base-edit__subnav-link--active': activePlacesTab === tab.id }"
                  @click="selectPlacesTab(tab.id)"
                >
                  {{ tab.label }}
                </button>
              </nav>

              <div
                v-if="activePlacesTab === 'location'"
                class="base-edit__places-form"
              >
                <div class="base-edit__location-field">
                  <CommonFormField
                    :model-value="editLocationQuery"
                    label="Локация"
                    placeholder="Выберите локацию"
                    autocomplete="off"
                    :open="isLocationDropdownOpen"
                    no-margin
                    @update:model-value="onLocationQueryInput"
                    @focus="openLocationDropdown"
                    @blur="onLocationBlur"
                  />

                  <ul
                    v-if="isLocationDropdownOpen"
                    class="base-edit__location-dropdown"
                    role="listbox"
                    aria-label="Список локаций"
                  >
                    <li
                      v-if="locationsLoading"
                      class="base-edit__location-option base-edit__location-option--muted base-edit__location-option--loading"
                    >
                      <CommonSpinner variant="ring" size="sm" label="Загрузка локаций" />
                    </li>
                    <li v-else-if="locationsError" class="base-edit__location-option base-edit__location-option--error">
                      {{ locationsError }}
                    </li>
                    <li v-else-if="!filteredLocations.length" class="base-edit__location-option base-edit__location-option--muted">
                      Ничего не найдено
                    </li>
                    <li
                      v-for="item in filteredLocations"
                      :key="item.id"
                      role="option"
                      class="base-edit__location-option"
                      :class="{ 'base-edit__location-option--active': editLocationId === item.id }"
                      @mousedown.prevent="selectLocation(item)"
                    >
                      {{ item.name }}
                    </li>
                  </ul>
                </div>

                <CommonFormField
                  v-model="editAddress"
                  label="Действительный адрес"
                  placeholder="Действительный адрес"
                  no-margin
                />

                <section class="base-edit__geo" aria-label="Географические координаты">
                  <h3 class="base-edit__geo-title">Географические координаты</h3>

                  <div class="base-edit__geo-layout">
                    <ProfileBaseLocationMap
                      ref="locationMapRef"
                      :lat="mapLatNumber"
                      :lng="mapLngNumber"
                      :zoom="mapZoomNumber"
                      @update:lat="onMapLatUpdate"
                      @update:lng="onMapLngUpdate"
                      @update:zoom="onMapZoomUpdate"
                      @address="onMapAddress"
                    />

                    <div class="base-edit__geo-fields">
                      <CommonFormField
                        v-model="editMapLat"
                        label="Широта карты"
                        placeholder="0"
                        no-margin
                      />
                      <CommonFormField
                        v-model="editMapLng"
                        label="Долгота карты"
                        placeholder="0"
                        no-margin
                      />
                      <CommonFormField
                        v-model="editMapZoom"
                        label="Масштаб карты"
                        placeholder="8"
                        no-margin
                      />
                    </div>
                  </div>
                </section>

                <div class="base-edit__map-search">
                  <CommonFormField
                    v-model="mapSearchQuery"
                    placeholder="Поиск по имени..."
                    autocomplete="off"
                    no-margin
                    @keydown="onMapSearchKeydown"
                  >
                    <template v-if="mapSearchQuery" #trailing>
                      <button
                        type="button"
                        class="base-edit__map-search-clear"
                        @click="clearMapSearch"
                      >
                        очистить
                      </button>
                    </template>
                  </CommonFormField>

                  <p v-if="mapSearchError" class="base-edit__map-search-error">
                    {{ mapSearchError }}
                  </p>
                </div>
              </div>

              <div
                v-else
                class="base-edit__places-form"
              >
                <section class="base-edit__surrounding" aria-label="Окрестности">
                  <h3 class="base-edit__surrounding-title">Окрестности</h3>

                  <div class="base-edit__surrounding-table">
                    <div class="base-edit__surrounding-head" aria-hidden="true">
                      <span class="base-edit__surrounding-head-cell">Имя</span>
                      <span class="base-edit__surrounding-head-cell">Контент</span>
                      <span class="base-edit__surrounding-head-cell">Расстояние</span>
                      <span class="base-edit__surrounding-head-cell base-edit__surrounding-head-cell--action" />
                    </div>

                    <div
                      v-for="item in surroundingItems"
                      :key="item.id"
                      class="base-edit__surrounding-row"
                    >
                      <CommonFormField
                        v-model="item.name"
                        placeholder="Имя"
                        no-margin
                      />
                      <CommonFormField
                        v-model="item.content"
                        placeholder="Контент"
                        multiline
                        resizable
                        :rows="1"
                        no-margin
                      />
                      <div class="base-edit__surrounding-distance">
                        <CommonFormField
                          v-model="item.value"
                          digits-only
                          no-margin
                        />
                        <label class="base-edit__surrounding-unit">
                          <span class="visually-hidden">Единица расстояния</span>
                          <select v-model="item.type" class="base-edit__surrounding-unit-select">
                            <option value="m">м</option>
                            <option value="km">км</option>
                          </select>
                        </label>
                      </div>
                      <button
                        type="button"
                        class="base-edit__policy-remove"
                        @click="removeSurroundingItem(item.id)"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <div
              v-else-if="activeEditTab === 'attributes'"
              class="base-edit__attributes"
            >
              <p v-if="attributesError" class="base-edit__status base-edit__status--error">
                {{ attributesError }}
              </p>

              <div
                v-else-if="attributesLoading"
                class="base-edit__loading base-edit__loading--inline"
                aria-live="polite"
              >
                <CommonSpinner variant="ring" size="lg" label="Загрузка атрибутов" />
              </div>

              <p v-else-if="!attributeGroups.length" class="base-edit__status">
                Нет атрибутов
              </p>

              <div
                v-else
                class="base-edit__attr-list"
              >
                <section
                  v-for="group in attributeGroups"
                  :key="group.id"
                  class="base-edit__attr-block"
                >
                  <h3 class="base-edit__attr-title">
                    {{ attributeGroupTitle(group) }}
                  </h3>

                  <div class="base-edit__attr-body">
                    <label
                      v-for="term in group.terms"
                      :key="term.id"
                      class="base-edit__attr-item"
                    >
                      <input
                        type="checkbox"
                        :checked="isTermSelected(term.id)"
                        @change="toggleTerm(term.id)"
                      >
                      <span class="base-edit__attr-checkmark" />
                      <span class="base-edit__attr-label">{{ termLabel(term) }}</span>
                    </label>
                  </div>
                </section>
              </div>
            </div>
          </div>

          <div
            v-if="(activeEditTab === 'content' && activeContentTab === 'policy') || (activeEditTab === 'places' && activePlacesTab === 'surrounding')"
            class="base-edit__actions"
          >
            <button
              v-if="activeEditTab === 'content' && activeContentTab === 'policy'"
              type="button"
              class="base-edit__policy-add"
              @click="addPolicyItem"
            >
              <svg
                class="base-edit__gallery-btn-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" />
                <path
                  d="M12 8v8M8 12h8"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                />
              </svg>
              Добавить элемент
            </button>

            <button
              v-else
              type="button"
              class="base-edit__policy-add"
              @click="addSurroundingItem"
            >
              <svg
                class="base-edit__gallery-btn-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" />
                <path
                  d="M12 8v8M8 12h8"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                />
              </svg>
              Добавить элемент
            </button>
          </div>
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
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
  height: 100%;
  max-height: 100%;
  padding: 20px 40px 16px;
  padding-left: 20px;
  box-sizing: border-box;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  overflow: hidden;
}

.base-edit {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  align-items: stretch;
  min-height: 0;
  max-width: 100%;
  overflow: hidden;
}

.profile-page__header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  height: 31px;
  margin-bottom: 20px;
  padding: 0;
  box-sizing: border-box;
  overflow: visible;
}

.base-edit__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
  width: 100%;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
}

.base-edit__title-row :deep(.page-title) {
  margin: 0;
  flex: 1;
  min-width: 0;
}

.base-edit__panel-area {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  overflow: hidden;
}

.base-edit__panel-shell {
  display: flex;
  flex: 1 1 0;
  align-items: stretch;
  gap: 12px;
  min-height: 0;
  min-width: 0;
  width: 100%;
  overflow: hidden;
}

.base-edit__back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 16px;
  border: 1.5px solid var(--wh-green);
  border-radius: 999px;
  background: var(--wh-green);
  color: var(--wh-white);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
  cursor: pointer;
  transition: opacity 0.15s ease, background 0.15s ease, border-color 0.15s ease;
  box-sizing: border-box;
}

.base-edit__back:hover {
  opacity: 0.92;
}

.base-edit__back-icon {
  flex-shrink: 0;
}

.base-edit__status {
  margin: 16px 0 0;
  color: rgba(0, 0, 0, 0.55);
  font-size: 16px;
}

.base-edit__status--error {
  color: #dc3545;
}

.base-edit__loading {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 220px;
}

.base-edit__loading--inline {
  flex: 0 0 auto;
  min-height: 160px;
}

.base-edit__panel {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  padding: 24px;
  border: 1px solid var(--wh-gray-400);
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  box-sizing: border-box;
  overflow: hidden;
}

.base-edit__body {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
}

.base-edit__actions {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
  flex-shrink: 0;
  margin-top: 24px;
}

.base-edit__nav-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px 24px;
  flex-shrink: 0;
  width: 100%;
  min-width: 0;
  margin-bottom: 16px;
  box-sizing: border-box;
}

.base-edit__nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 28px;
  min-width: 0;
  flex: 1 1 auto;
}

.base-edit__nav-save {
  flex-shrink: 0;
  margin-left: auto;
}

.base-edit__nav-link {
  position: relative;
  padding: 10px 0 12px;
  border: none;
  background: none;
  color: var(--wh-gray-900);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.15s ease;
}

.base-edit__nav-link::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  border-radius: 2px;
  background: var(--wh-orange-500);
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.28s ease;
}

.base-edit__nav-link--active::after {
  transform: scaleX(1);
}

.base-edit__nav-link:not(.base-edit__nav-link--active)::after {
  transition-duration: 0s;
}

.base-edit__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.base-edit__content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.base-edit__section {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  min-width: 0;
}

.base-edit__subnav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 28px;
  flex-shrink: 0;
  width: 100%;
  min-width: 0;
}

.base-edit__subnav-link {
  position: relative;
  padding: 10px 0 12px;
  border: none;
  background: none;
  color: var(--wh-gray-900);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.15s ease;
}

.base-edit__subnav-link::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  border-radius: 2px;
  background: var(--wh-orange-500);
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.28s ease;
}

.base-edit__subnav-link--active::after {
  transform: scaleX(1);
}

.base-edit__subnav-link:not(.base-edit__subnav-link--active)::after {
  transition-duration: 0s;
}

.base-edit__places {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  min-width: 0;
}

.base-edit__places-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  min-width: 0;
}

.base-edit__location-field {
  position: relative;
  z-index: 2;
  width: 100%;
  min-width: 0;
}

.base-edit__location-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 20;
  max-height: 240px;
  margin: 0;
  padding: 6px 0;
  list-style: none;
  border: 1px solid var(--wh-field-border);
  border-radius: 10px;
  background: var(--wh-white);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  overflow: auto;
  box-sizing: border-box;
}

.base-edit__location-option {
  padding: 10px 14px;
  color: var(--wh-gray-900);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.3;
  cursor: pointer;
}

.base-edit__location-option:hover,
.base-edit__location-option--active {
  background: rgba(238, 154, 60, 0.12);
}

.base-edit__location-option--muted,
.base-edit__location-option--error {
  cursor: default;
}

.base-edit__location-option--muted {
  color: rgba(0, 0, 0, 0.55);
}

.base-edit__location-option--loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding-top: 12px;
  padding-bottom: 12px;
  cursor: default;
}

.base-edit__location-option--error {
  color: #dc3545;
}

.base-edit__location-option--muted:hover,
.base-edit__location-option--error:hover {
  background: transparent;
}

.base-edit__geo {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.base-edit__geo-title {
  margin: 0;
  color: var(--wh-gray-900);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.05em;
}

.base-edit__geo-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 250px;
  gap: 16px;
  align-items: start;
  min-width: 0;
}

.base-edit__geo-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  padding: 15px;
  border: 1px solid rgba(204, 204, 204, 0.8);
  border-radius: 10px;
  background: var(--wh-white);
  box-sizing: border-box;
}

.base-edit__map-search {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  min-width: 0;
}

.base-edit__map-search-clear {
  padding: 0;
  border: none;
  background: none;
  color: rgba(0, 0, 0, 0.55);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;
  cursor: pointer;
}

.base-edit__map-search-clear:hover {
  color: var(--wh-gray-900);
}

.base-edit__map-search-error {
  margin: 0;
  color: #dc3545;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 13px;
  line-height: 1.3;
}

.base-edit__surrounding {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  min-width: 0;
}

.base-edit__surrounding-title {
  margin: 0;
  color: var(--wh-gray-900);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.05em;
}

.base-edit__surrounding-table {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  min-width: 0;
}

.base-edit__surrounding-head {
  display: grid;
  grid-template-columns: minmax(0, 0.45fr) minmax(0, 1fr) minmax(160px, 0.4fr) 110px;
  gap: 16px;
  padding: 10px 12px;
  border: 1px solid var(--wh-gray-400);
  border-radius: 8px;
  background: var(--wh-white);
  box-sizing: border-box;
}

.base-edit__surrounding-head-cell {
  color: var(--wh-gray-900);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.3;
  text-align: center;
}

.base-edit__surrounding-head-cell--action {
  width: 110px;
}

.base-edit__surrounding-row {
  display: grid;
  grid-template-columns: minmax(0, 0.45fr) minmax(0, 1fr) minmax(160px, 0.4fr) 110px;
  gap: 16px;
  align-items: start;
}

.base-edit__surrounding-distance {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 88px;
  gap: 8px;
  align-items: start;
  min-width: 0;
}

.base-edit__surrounding-unit {
  display: block;
  min-width: 0;
}

.base-edit__surrounding-unit-select {
  width: 100%;
  box-sizing: border-box;
  min-height: calc(18px * 1.3 + 24px);
  padding: 12px 14px;
  border: 1px solid var(--wh-field-border);
  border-radius: 10px;
  background: var(--wh-white);
  color: var(--wh-gray-900);
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 18px;
  line-height: 130%;
  letter-spacing: -0.05em;
  outline: none;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%231C211C' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.base-edit__surrounding-unit-select:focus {
  border-color: var(--wh-field-border-active);
  box-shadow: 0 0 0 3px var(--wh-field-focus-ring);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.base-edit__attributes {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 0;
  width: 100%;
  min-width: 0;
  min-height: 0;
}

.base-edit__attr-dots {
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

.base-edit__attr-dots--hidden {
  visibility: hidden;
  pointer-events: none;
}

.base-edit__attr-dot {
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

.base-edit__attr-dot--active {
  border-color: #e8883a;
  background: #e8883a;
}

.base-edit__attr-dot:hover:not(.base-edit__attr-dot--active) {
  border-color: rgb(28 33 28 / 45%);
}

.base-edit__attr-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  min-width: 0;
}

.base-edit__attr-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.base-edit__attr-title {
  margin: 0;
  color: #1a2b50;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.base-edit__attr-body {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px 20px;
  padding: 16px 18px;
  border: 1px solid var(--wh-gray-400);
  border-radius: 4px;
  background: #f5f5f5;
  box-sizing: border-box;
}

.base-edit__attr-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
  color: var(--wh-gray-900);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.35;
  cursor: pointer;
}

.base-edit__attr-item input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.base-edit__attr-checkmark {
  position: relative;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  margin-top: 0;
  border: 1px solid var(--wh-gray-300);
  border-radius: 4px;
  background: var(--wh-white);
}

.base-edit__attr-item input:checked + .base-edit__attr-checkmark::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 16px;
  height: 16px;
  border-radius: 2px;
  background: var(--wh-orange-500);
  transform: translate(-50%, -50%);
}

.base-edit__attr-label {
  min-width: 0;
}

.base-edit__policy {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  min-width: 0;
  min-height: 0;
}

.base-edit__policy-table {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  min-width: 0;
}

.base-edit__policy-head {
  display: grid;
  grid-template-columns: minmax(0, 0.55fr) minmax(0, 1fr) 110px;
  gap: 16px 16px;
  padding: 10px 12px;
  border: 1px solid var(--wh-gray-400);
  border-radius: 8px;
  background: var(--wh-white);
  box-sizing: border-box;
}

.base-edit__policy-head-cell {
  color: var(--wh-gray-900);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.3;
  text-align: center;
}

.base-edit__policy-head-cell--action {
  width: 110px;
}

.base-edit__policy-row {
  display: grid;
  grid-template-columns: minmax(0, 0.55fr) minmax(0, 1fr) 110px;
  gap: 16px 16px;
  align-items: start;
}

.base-edit__policy-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: calc(18px * 1.3 + 24px);
  padding: 7px 16px;
  border: 1.5px solid #dc3545;
  border-radius: 999px;
  background: #dc3545;
  color: var(--wh-white);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  box-sizing: border-box;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.base-edit__policy-remove:hover {
  border-color: #c82333;
  background: #c82333;
}

.base-edit__policy-add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 16px;
  border: 1.5px solid var(--wh-green);
  border-radius: 999px;
  background: var(--wh-green);
  color: var(--wh-white);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  cursor: pointer;
  transition: opacity 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}

.base-edit__policy-add:hover {
  opacity: 0.92;
}

.base-edit__form-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px 24px;
  align-items: start;
}

.base-edit__gallery {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.base-edit__gallery-title {
  margin: 0;
  color: var(--wh-gray-900);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.05em;
}

.base-edit__gallery-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
}

.base-edit__gallery-item {
  position: relative;
  width: 220px;
  height: 152px;
  border: 1px solid var(--wh-gray-400);
  border-radius: 2px;
  background: #f3f3f3;
  overflow: hidden;
  box-sizing: border-box;
  cursor: pointer;
}

.base-edit__gallery-item--selected {
  border-color: var(--wh-orange-500);
}

.base-edit__gallery-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.base-edit__gallery-remove {
  position: absolute;
  top: 8px;
  right: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: var(--wh-white);
  color: #dc3545;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
}

.base-edit__gallery-remove:hover {
  background: #dc3545;
  color: var(--wh-white);
  transform: scale(1.05);
}

.base-edit__gallery-input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.base-edit__gallery-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 16px;
  border: 1.5px solid var(--wh-orange-500);
  border-radius: 999px;
  background: var(--wh-orange-500);
  color: var(--wh-white);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.base-edit__gallery-btn:hover {
  border-color: var(--wh-orange-600);
  background: var(--wh-orange-600);
}

.base-edit__gallery-btn-icon {
  flex-shrink: 0;
}

.base-edit__rating {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.base-edit__rating-label {
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.05em;
  color: var(--wh-gray-900);
}

.base-edit__stars {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1px solid var(--wh-field-border);
  border-radius: 10px;
  background: var(--wh-white);
}

.base-edit__star {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: none;
  color: #c4c4c4;
  cursor: pointer;
  transition: color 0.15s ease, transform 0.15s ease;
}

.base-edit__star svg {
  display: block;
  overflow: visible;
  fill: none;
  stroke: currentColor;
}

.base-edit__star:hover {
  transform: scale(1.06);
}

.base-edit__star--active {
  color: var(--wh-orange-500);
}

.base-edit__star--active svg {
  fill: currentColor;
}

.base-edit__rating-clear {
  margin-left: auto;
  padding: 0;
  border: none;
  background: none;
  color: var(--wh-gray-900);
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.02em;
  cursor: pointer;
  transition: color 0.15s ease;
}

.base-edit__rating-clear:hover {
  color: var(--wh-orange-500);
}

.base-edit__form-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.base-edit__form-content :deep(.form-field__control) {
  display: flex;
}

.base-edit__form-content :deep(.form-field__input--textarea) {
  width: 100%;
  min-height: 340px;
  height: 340px;
  resize: none;
  box-sizing: border-box;
}

@media (--wh-tablet) {
  .profile-page {
    height: auto;
    max-height: none;
    overflow: visible;
    padding: 12px 8px 32px;
  }

  .base-edit__panel-area {
    flex: none;
    min-height: 0;
  }

  .base-edit__panel {
    flex: none;
    min-height: calc(100dvh - 220px);
  }

  .base-edit__body {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  .base-edit__attr-dots {
    display: none;
  }

  .base-edit__attr-body {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .base-edit__geo-layout {
    grid-template-columns: minmax(0, 1fr) 220px;
  }
}

@media (--wh-mobile) {
  .profile-page {
    height: auto;
    max-height: none;
    overflow: visible;
    padding: 16px 20px 32px;
  }

  .base-edit__panel {
    min-height: calc(100dvh - 260px);
  }

  .profile-page__header {
    height: auto;
    min-height: 31px;
    padding: 0;
    background: transparent;
    border-radius: 0;
  }

  .base-edit__title-row {
    flex-wrap: wrap;
  }

  .base-edit__back {
    align-self: flex-start;
  }

  .base-edit__nav {
    gap: 16px 20px;
  }

  .base-edit__form-row {
    grid-template-columns: 1fr;
  }

  .base-edit__geo-layout {
    grid-template-columns: 1fr;
  }

  .base-edit__attr-body {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .base-edit__policy-head,
  .base-edit__policy-row {
    grid-template-columns: 1fr;
  }

  .base-edit__surrounding-head,
  .base-edit__surrounding-row {
    grid-template-columns: 1fr;
  }

  .base-edit__surrounding-distance {
    grid-template-columns: minmax(0, 1fr) 88px;
  }

  .base-edit__policy-remove {
    justify-self: end;
  }
}
</style>
