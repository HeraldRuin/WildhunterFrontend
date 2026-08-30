<script setup lang="ts">
import type { ManagedRoomDetail, RoomManageUpdatePayload } from '~/api/rooms'
import type { HotelRoomAttribute, HotelRoomAttributeTerm } from '~/types/api'
import type { BreadcrumbItem } from '~/types/breadcrumb'
import { formatHotelPrice } from '~/utils/hotel'
import { extractMediaIdFromUrl, shouldShowOfferImage } from '~/utils/image'

definePageMeta({
  layout: 'profile',
  path: '/rooms/:id',
})

const route = useRoute()
const notifications = useNotifications()
const { rooms: roomsApi, media: mediaApi, services: servicesApi } = useApi()
const authToken = useAuthToken()
const ready = ref(false)

onBeforeMount(() => {
  authToken.initFromStorage()

  if (!authToken.isAuthenticated.value) {
    const { open: openLoginModal } = useLoginModal()
    nextTick(() => openLoginModal())
    void navigateTo('/', { replace: true })
    return
  }

  ready.value = true
})

const isCreateMode = computed(() => route.params.id === 'new')
const roomId = computed(() => Number(route.params.id))

const hotelId = computed(() => {
  const raw = route.query.hotelId
  return typeof raw === 'string' && raw ? raw : null
})

const roomsListTo = computed(() => (
  hotelId.value ? { path: '/rooms', query: { hotelId: hotelId.value } } : '/rooms'
))

type RoomEditTab = 'content' | 'pricing' | 'attributes'

type GalleryItem = {
  id: number | null
  url: string
  file?: File | null
}

const editTabs: { id: RoomEditTab, label: string }[] = [
  { id: 'content', label: 'Содержимое комнаты' },
  { id: 'pricing', label: 'Ценообразование' },
  { id: 'attributes', label: 'Атрибуты' },
]

const room = ref<ManagedRoomDetail | null>(null)
const isLoading = ref(true)
const isSaving = ref(false)
const loadError = ref('')
const activeEditTab = ref<RoomEditTab>('content')
const editTitle = ref('')
const editRating = ref(0)
const editContent = ref('')
const editPrice = ref('')
const editRoomsCount = ref('')
const editMinStayDays = ref('')
const editBedsCount = ref('')
const editRoomSize = ref('')
const editMaxAdults = ref('')
const selectedTermIds = ref<number[]>([])
const attributeGroups = ref<HotelRoomAttribute[]>([])
const attributesLoading = ref(false)
const attributesError = ref('')
const attrScrollEl = ref<HTMLElement | null>(null)
const attrPageCount = ref(1)
const attrPageIndex = ref(0)
let attributesLoaded = false
let attrResizeObserver: ResizeObserver | null = null
const hoverRating = ref(0)
const galleryItems = ref<GalleryItem[]>([])
const galleryInputRef = ref<HTMLInputElement | null>(null)
const selectedGalleryIndex = ref<number | null>(null)
const showForm = computed(() => isCreateMode.value || !!room.value)

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

function revokeGalleryBlobUrls() {
  for (const item of galleryItems.value) {
    if (item.url.startsWith('blob:')) {
      URL.revokeObjectURL(item.url)
    }
  }
}

const hotelTitle = 'Хромой кабан-2'

const hotelEditTo = computed(() => (
  hotelId.value ? `/profile/base/${hotelId.value}` : '/profile/base'
))

const pageTitle = computed(() => (
  isCreateMode.value ? 'Новый номер' : 'Редактирование номера'
))

const roomTitle = computed(() => {
  const fromRoom = room.value?.title?.trim()
  if (fromRoom) {
    return fromRoom
  }

  const fromForm = editTitle.value.trim()
  return fromForm || null
})

const roomEditTo = computed(() => {
  if (isCreateMode.value || !Number.isFinite(roomId.value) || roomId.value <= 0) {
    return undefined
  }

  return hotelId.value
    ? { path: `/rooms/${roomId.value}`, query: { hotelId: hotelId.value } }
    : `/rooms/${roomId.value}`
})

const breadcrumbs = computed(() => {
  const items: BreadcrumbItem[] = [
    { label: 'Главная', to: '/' },
    { label: 'Управление базой', to: '/profile/base' },
    { label: hotelTitle, to: hotelEditTo.value },
    { label: 'Управление номерами', to: roomsListTo.value },
  ]

  if (!isCreateMode.value && roomTitle.value) {
    items.push({
      label: roomTitle.value,
      ...(roomEditTo.value ? { to: roomEditTo.value } : {}),
    })
  }

  items.push({ label: pageTitle.value })

  return items
})

useHead({
  title: () => `${pageTitle.value} — WH`,
})

function selectEditTab(tab: RoomEditTab) {
  activeEditTab.value = tab

  if (tab === 'attributes') {
    void loadAttributes()
    scheduleAttrPagesUpdate()
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
    attributeGroups.value = await servicesApi.getAttributeGroups('hotel_room')
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

function formatPriceInput(value: number | string | null | undefined) {
  const num = Number(value)
  if (!Number.isFinite(num)) {
    return ''
  }

  return formatHotelPrice(Math.round(num))
}

function formatOptionalInt(value: number | null | undefined) {
  if (value == null) {
    return ''
  }

  const num = Number(value)
  if (!Number.isFinite(num)) {
    return ''
  }

  return String(Math.trunc(num))
}

function parseOptionalInt(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const num = Number(trimmed)
  if (!Number.isFinite(num)) {
    return null
  }

  return Math.trunc(num)
}

function parsePrice(value: string): number | null {
  let raw = value
    .trim()
    .replace(/\s*руб\.?\s*/gi, '')
    .replace(/\s/g, '')

  if (!raw) {
    return null
  }

  if (raw.includes(',') && raw.includes('.')) {
    raw = raw.replace(/\./g, '').replace(',', '.')
  }
  else if (raw.includes(',')) {
    raw = raw.replace(',', '.')
  }
  else if (/^\d{1,3}(\.\d{3})+$/.test(raw)) {
    raw = raw.replace(/\./g, '')
  }

  const price = Number(raw)
  if (!Number.isFinite(price) || price < 0) {
    return null
  }

  return price
}

function galleryPreviewUrl(item: ManagedRoomDetail['gallery'][number]) {
  return item.medium || item.large || item.thumb || ''
}

function fillFormFromRoom(item: ManagedRoomDetail) {
  revokeGalleryBlobUrls()

  editTitle.value = item.title ?? ''
  editRating.value = 0
  editContent.value = item.content ?? ''
  editPrice.value = formatPriceInput(item.price)
  editRoomsCount.value = formatOptionalInt(item.number)
  editMinStayDays.value = formatOptionalInt(item.min_day_stays)
  editBedsCount.value = formatOptionalInt(item.beds)
  editRoomSize.value = formatOptionalInt(item.size)
  editMaxAdults.value = formatOptionalInt(item.adults)
  hoverRating.value = 0
  selectedGalleryIndex.value = null
  selectedTermIds.value = Array.isArray(item.term_ids)
    ? item.term_ids.map(Number).filter(id => Number.isFinite(id) && id > 0)
    : []

  const galleryFromApi = (item.gallery ?? [])
    .map((galleryItem) => {
      const url = galleryPreviewUrl(galleryItem)
      if (!shouldShowOfferImage(url)) {
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
  else if (shouldShowOfferImage(item.image_url)) {
    galleryItems.value = [{
      id: item.image_id ?? extractMediaIdFromUrl(item.image_url),
      url: item.image_url!,
      file: null,
    }]
  }
  else {
    galleryItems.value = []
  }
}

function resetFormForCreate() {
  revokeGalleryBlobUrls()
  room.value = null
  editTitle.value = ''
  editRating.value = 0
  editContent.value = ''
  editPrice.value = ''
  editRoomsCount.value = ''
  editMinStayDays.value = ''
  editBedsCount.value = ''
  editRoomSize.value = ''
  editMaxAdults.value = ''
  hoverRating.value = 0
  galleryItems.value = []
  selectedGalleryIndex.value = null
  selectedTermIds.value = []
  loadError.value = ''
  isLoading.value = false
}

function buildSavePayload(galleryIds: number[]): RoomManageUpdatePayload {
  const current = room.value
  const uniqueGalleryIds = uniquePositiveIds(galleryIds)
  const currentImageId = current?.image_id ?? null
  const imageId = uniqueGalleryIds.includes(currentImageId ?? -1)
    ? currentImageId
    : (uniqueGalleryIds[0] ?? null)

  return {
    title: editTitle.value.trim(),
    content: editContent.value.trim() || null,
    image_id: imageId,
    gallery: uniqueGalleryIds,
    price: parsePrice(editPrice.value),
    number: parseOptionalInt(editRoomsCount.value),
    beds: parseOptionalInt(editBedsCount.value),
    size: parseOptionalInt(editRoomSize.value),
    adults: parseOptionalInt(editMaxAdults.value),
    children: current?.children ?? null,
    status: current?.status ?? 'draft',
    min_day_stays: parseOptionalInt(editMinStayDays.value),
    ical_import_url: current?.ical_import_url ?? null,
    video: current?.video ?? null,
    term_ids: [...selectedTermIds.value],
  }
}

function roomEditPath(id: number) {
  return hotelId.value
    ? { path: `/rooms/${id}`, query: { hotelId: hotelId.value } }
    : `/rooms/${id}`
}

async function saveRoom() {
  if (isSaving.value || isLoading.value) {
    return
  }

  const title = editTitle.value.trim()

  if (!title) {
    notifications.error('Укажите название номера')
    return
  }

  if (!isCreateMode.value && (!Number.isFinite(roomId.value) || roomId.value <= 0)) {
    notifications.error('Некорректный идентификатор номера')
    return
  }

  isSaving.value = true

  try {
    await uploadPendingGalleryItems()

    const galleryIds = galleryItems.value.map(item => item.id)
    const payload = buildSavePayload(galleryIds)

    const response = isCreateMode.value
      ? await roomsApi.create(payload)
      : await roomsApi.update(roomId.value, payload)

    if ('success' in response && response.success) {
      room.value = response.data
      fillFormFromRoom(response.data)
      notifications.success(
        response.message || (isCreateMode.value ? 'Номер создан' : 'Номер сохранён'),
      )

      if (isCreateMode.value && response.data.id) {
        await navigateTo(roomEditPath(response.data.id), { replace: true })
      }

      return
    }

    notifications.error(
      extractErrorMessage(
        response,
        isCreateMode.value ? 'Не удалось создать номер' : 'Не удалось сохранить номер',
      ),
    )
  }
  catch (error) {
    const data = (error as { data?: unknown, message?: string }).data
    notifications.error(
      extractErrorMessage(
        data,
        (error as { message?: string }).message
          || (isCreateMode.value ? 'Не удалось создать номер' : 'Не удалось сохранить номер'),
      ),
    )
  }
  finally {
    isSaving.value = false
  }
}

async function loadRoom() {
  if (isCreateMode.value) {
    resetFormForCreate()
    return
  }

  if (!Number.isFinite(roomId.value) || roomId.value <= 0) {
    room.value = null
    loadError.value = 'Некорректный идентификатор номера'
    isLoading.value = false
    return
  }

  isLoading.value = true
  loadError.value = ''

  try {
    const response = await roomsApi.getById(roomId.value)

    if ('success' in response && response.success) {
      room.value = response.data
      fillFormFromRoom(response.data)
      return
    }

    room.value = null
    loadError.value = extractErrorMessage(response, 'Не удалось загрузить номер')
  }
  catch (error) {
    room.value = null
    const data = (error as { data?: unknown }).data
    loadError.value = extractErrorMessage(data, 'Не удалось загрузить номер')
  }
  finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void loadRoom()
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
  revokeGalleryBlobUrls()
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
  <div v-if="ready" class="profile-page">
    <div class="room-edit">
      <header class="profile-page__header">
        <AppBreadcrumbs :items="breadcrumbs" />

        <ProfileNotificationsBell />
      </header>

      <div class="room-edit__title-row">
        <CommonPageTitle>{{ pageTitle }}</CommonPageTitle>

        <CommonSaveButton
          v-if="showForm"
          type="button"
          class="room-edit__save"
          width="auto"
          mobile-width="100%"
          :loading="isSaving"
          :disabled="isLoading"
          @click="saveRoom"
        />
      </div>

      <div class="room-edit__panel-area">
        <div v-if="loadError || isLoading" class="room-edit__panel">
          <div class="room-edit__body">
            <p v-if="loadError" class="room-edit__status room-edit__status--error">
              {{ loadError }}
            </p>

            <div
              v-else
              class="room-edit__loading"
              aria-live="polite"
            >
              <CommonSpinner variant="ring" size="lg" label="Загрузка номера" />
            </div>
          </div>
        </div>

        <div
          v-else-if="showForm"
          class="room-edit__panel-shell"
        >
          <div
            v-if="activeEditTab === 'attributes' && attributeGroups.length"
            class="room-edit__attr-dots"
            :class="{ 'room-edit__attr-dots--hidden': attrPageCount <= 1 }"
            role="tablist"
            aria-label="Страницы атрибутов"
            :aria-hidden="attrPageCount <= 1"
          >
            <button
              v-for="page in attrPageCount"
              :key="page"
              type="button"
              class="room-edit__attr-dot"
              :class="{ 'room-edit__attr-dot--active': page - 1 === attrPageIndex }"
              :aria-label="`Страница ${page}`"
              :aria-current="page - 1 === attrPageIndex ? 'true' : undefined"
              :tabindex="attrPageCount > 1 ? 0 : -1"
              @click="scrollAttrToPage(page - 1)"
            />
          </div>

          <div class="room-edit__panel">
          <div class="room-edit__panel-top">
            <nav class="room-edit__nav" aria-label="Разделы редактирования">
              <button
                v-for="tab in editTabs"
                :key="tab.id"
                type="button"
                class="room-edit__nav-link"
                :class="{ 'room-edit__nav-link--active': activeEditTab === tab.id }"
                @click="selectEditTab(tab.id)"
              >
                {{ tab.label }}
              </button>
            </nav>
          </div>

          <div
            ref="attrScrollEl"
            class="room-edit__body"
            @scroll.passive="onAttrScroll"
          >
            <div v-if="activeEditTab === 'content'" class="room-edit__content">
              <div class="room-edit__form">
                <div class="room-edit__form-row">
                  <CommonFormField
                    v-model="editTitle"
                    label="Название номера"
                    placeholder="Название номера"
                    no-margin
                  />
                  <!--
                  <div class="room-edit__rating">
                    <span class="room-edit__rating-label">Рейтинг</span>
                    <div
                      class="room-edit__stars"
                      role="radiogroup"
                      aria-label="Рейтинг"
                      @mouseleave="onRatingLeave"
                    >
                      <button
                        v-for="star in ratingStars"
                        :key="star"
                        type="button"
                        class="room-edit__star"
                        :class="{ 'room-edit__star--active': star <= displayRating }"
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
                        class="room-edit__rating-clear"
                        @mouseenter="onRatingLeave"
                        @click.stop="clearEditRating"
                      >
                        Очистить
                      </button>
                    </div>
                  </div>
                  -->
                </div>
                <CommonFormField
                  v-model="editContent"
                  class="room-edit__form-content"
                  label="Контент"
                  placeholder=""
                  multiline
                  :rows="4"
                  no-margin
                />
              </div>

              <section class="room-edit__gallery" aria-label="Галерея">
                <h3 class="room-edit__gallery-title">Галерея</h3>

                <div v-if="galleryItems.length" class="room-edit__gallery-list">
                  <div
                    v-for="(item, index) in galleryItems"
                    :key="`${item.id ?? 'new'}-${item.url}-${index}`"
                    class="room-edit__gallery-item"
                    :class="{ 'room-edit__gallery-item--selected': selectedGalleryIndex === index }"
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
                      class="room-edit__gallery-image"
                    >
                    <button
                      v-if="selectedGalleryIndex === index"
                      type="button"
                      class="room-edit__gallery-remove"
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
                  class="room-edit__gallery-input"
                  accept="image/*"
                  multiple
                  @change="onGalleryFilesSelected"
                >

                <button
                  type="button"
                  class="room-edit__gallery-btn"
                  @click="openGalleryPicker"
                >
                  <svg
                    class="room-edit__gallery-btn-icon"
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

            <div v-else-if="activeEditTab === 'pricing'" class="room-edit__pricing">
              <div class="room-edit__pricing-row">
                <CommonFormField
                  v-model="editPrice"
                  label="Стоимость *"
                  placeholder="0"
                  amount-only
                  required
                  no-margin
                />
                <CommonFormField
                  v-model="editRoomsCount"
                  label="Количество комнат *"
                  placeholder="0"
                  digits-only
                  required
                  no-margin
                />
              </div>

              <div class="room-edit__pricing-field">
                <CommonFormField
                  v-model="editMinStayDays"
                  label="Минимальные требования к дневному пребыванию"
                  placeholder="Пример: 2"
                  digits-only
                  no-margin
                />
                <p class="room-edit__pricing-hint">
                  Оставьте пустым, если вам не нужно устанавливать опцию минимального количества дней пребывания
                </p>
              </div>

              <div class="room-edit__pricing-row">
                <CommonFormField
                  v-model="editBedsCount"
                  label="Количество спальных мест"
                  placeholder="0"
                  digits-only
                  no-margin
                />
                <CommonFormField
                  v-model="editRoomSize"
                  class="room-edit__pricing-size"
                  label="Размер номера"
                  placeholder="0"
                  digits-only
                  no-margin
                >
                  <template #trailing>
                    <span class="room-edit__unit">м²</span>
                  </template>
                </CommonFormField>
              </div>

              <div class="room-edit__pricing-row room-edit__pricing-row--single">
                <CommonFormField
                  v-model="editMaxAdults"
                  label="Максимальное число взрослых"
                  placeholder="0"
                  digits-only
                  no-margin
                />
              </div>
            </div>

            <div
              v-else-if="activeEditTab === 'attributes'"
              class="room-edit__attributes"
            >
              <p v-if="attributesError" class="room-edit__status room-edit__status--error">
                {{ attributesError }}
              </p>

              <div
                v-else-if="attributesLoading"
                class="room-edit__loading room-edit__loading--inline"
                aria-live="polite"
              >
                <CommonSpinner variant="ring" size="lg" label="Загрузка атрибутов" />
              </div>

              <p v-else-if="!attributeGroups.length" class="room-edit__status">
                Нет атрибутов
              </p>

              <div
                v-else
                class="room-edit__attr-list"
              >
                <section
                  v-for="group in attributeGroups"
                  :key="group.id"
                  class="room-edit__attr-block"
                >
                  <h3 class="room-edit__attr-title">
                    {{ attributeGroupTitle(group) }}
                  </h3>

                  <div class="room-edit__attr-body">
                    <label
                      v-for="term in group.terms"
                      :key="term.id"
                      class="room-edit__attr-item"
                    >
                      <input
                        type="checkbox"
                        :checked="isTermSelected(term.id)"
                        @change="toggleTerm(term.id)"
                      >
                      <span class="room-edit__attr-checkmark" />
                      <span class="room-edit__attr-label">{{ termLabel(term) }}</span>
                    </label>
                  </div>
                </section>
              </div>
            </div>
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
  flex: 1;
  min-height: 0;
  height: 100%;
  max-height: 100%;
  width: 100%;
  padding: 20px 40px 16px;
  padding-left: 20px;
  box-sizing: border-box;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  overflow: hidden;
}

.room-edit {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: stretch;
  min-height: 0;
  max-width: 100%;
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

.room-edit__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
  width: 100%;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
}

.room-edit__title-row :deep(.page-title) {
  margin: 0;
  flex: 1;
  min-width: 0;
}

.room-edit__panel-area {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  overflow: hidden;
}

.room-edit__panel-shell {
  display: flex;
  flex: 1;
  align-items: stretch;
  gap: 12px;
  min-height: 0;
  min-width: 0;
  width: 100%;
  overflow: hidden;
}

.room-edit__panel-top {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.room-edit__save {
  flex-shrink: 0;
  min-width: 0;
  padding: 10px 24px;
  white-space: nowrap;
}

.room-edit__status {
  margin: 16px 0 0;
  color: rgba(0, 0, 0, 0.55);
  font-size: 16px;
}

.room-edit__status--error {
  color: #dc3545;
}

.room-edit__loading {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 220px;
}

.room-edit__loading--inline {
  flex: 0 0 auto;
  min-height: 160px;
}

.room-edit__panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  margin-top: 0;
  padding: 24px;
  border: 1px solid var(--wh-gray-400);
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  box-sizing: border-box;
  overflow: hidden;
}

.room-edit__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  margin-top: 32px;
  overflow: auto;
  overscroll-behavior: contain;
}

.room-edit__nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 28px;
  min-width: 0;
}

.room-edit__nav-link {
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

.room-edit__nav-link::after {
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

.room-edit__nav-link--active::after {
  transform: scaleX(1);
}

.room-edit__nav-link:not(.room-edit__nav-link--active)::after {
  transition-duration: 0s;
}

.room-edit__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.room-edit__content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.room-edit__form-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px 24px;
  align-items: start;
}

.room-edit__pricing {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 920px;
}

.room-edit__pricing-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px 24px;
  align-items: start;
}

.room-edit__pricing-row--single {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.room-edit__pricing-row--single > :first-child {
  grid-column: 1;
}

.room-edit__pricing-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.room-edit__pricing-hint {
  margin: 0;
  color: rgba(0, 0, 0, 0.45);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 13px;
  font-style: italic;
  line-height: 1.4;
}

.room-edit__pricing-size :deep(.form-field__input--with-trailing) {
  padding-right: 56px;
}

.room-edit__unit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--wh-gray-100, #f3f3f3);
  color: var(--wh-gray-900);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.02em;
  pointer-events: none;
  user-select: none;
}

.room-edit__attributes {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 0;
  width: 100%;
  min-width: 0;
  min-height: 0;
}

.room-edit__attr-dots {
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

.room-edit__attr-dots--hidden {
  visibility: hidden;
  pointer-events: none;
}

.room-edit__attr-dot {
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

.room-edit__attr-dot--active {
  border-color: #e8883a;
  background: #e8883a;
}

.room-edit__attr-dot:hover:not(.room-edit__attr-dot--active) {
  border-color: rgb(28 33 28 / 45%);
}

.room-edit__attr-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  min-width: 0;
}

.room-edit__attr-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.room-edit__attr-title {
  margin: 0;
  color: #1a2b50;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.room-edit__attr-body {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px 20px;
  padding: 16px 18px;
  border: 1px solid var(--wh-gray-400);
  border-radius: 4px;
  background: #f5f5f5;
  box-sizing: border-box;
}

.room-edit__attr-item {
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

.room-edit__attr-item input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.room-edit__attr-checkmark {
  position: relative;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  margin-top: 0;
  border: 1px solid var(--wh-gray-300);
  border-radius: 4px;
  background: var(--wh-white);
}

.room-edit__attr-item input:checked + .room-edit__attr-checkmark::after {
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

.room-edit__attr-label {
  min-width: 0;
}

.room-edit__gallery {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.room-edit__gallery-title {
  margin: 0;
  color: var(--wh-gray-900);
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.05em;
}

.room-edit__gallery-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
}

.room-edit__gallery-item {
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

.room-edit__gallery-item--selected {
  border-color: var(--wh-orange-500);
}

.room-edit__gallery-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.room-edit__gallery-remove {
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

.room-edit__gallery-remove:hover {
  background: #dc3545;
  color: var(--wh-white);
  transform: scale(1.05);
}

.room-edit__gallery-input {
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

.room-edit__gallery-btn {
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

.room-edit__gallery-btn:hover {
  border-color: var(--wh-orange-600);
  background: var(--wh-orange-600);
}

.room-edit__gallery-btn-icon {
  flex-shrink: 0;
}

.room-edit__rating {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.room-edit__rating-label {
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.05em;
  color: var(--wh-gray-900);
}

.room-edit__stars {
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

.room-edit__star {
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

.room-edit__star svg {
  display: block;
  overflow: visible;
  fill: none;
  stroke: currentColor;
}

.room-edit__star:hover {
  transform: scale(1.06);
}

.room-edit__star--active {
  color: var(--wh-orange-500);
}

.room-edit__star--active svg {
  fill: currentColor;
}

.room-edit__rating-clear {
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

.room-edit__rating-clear:hover {
  color: var(--wh-orange-500);
}

.room-edit__form-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.room-edit__form-content :deep(.form-field__control) {
  display: flex;
}

.room-edit__form-content :deep(.form-field__input--textarea) {
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

  .room-edit__panel-area {
    flex: none;
    min-height: 0;
  }

  .room-edit__panel {
    flex: none;
    min-height: calc(100dvh - 220px);
  }

  .room-edit__body {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  .room-edit__attr-dots {
    display: none;
  }

  .room-edit__attr-body {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (--wh-mobile) {
  .profile-page {
    height: auto;
    max-height: none;
    overflow: visible;
    padding: 16px 20px 32px;
  }

  .room-edit__panel {
    min-height: calc(100dvh - 260px);
  }

  .profile-page__header {
    height: auto;
    min-height: 31px;
    padding: 0;
    background: transparent;
    border-radius: 0;
  }

  .room-edit__panel-top {
    flex-direction: column;
    align-items: stretch;
  }

  .room-edit__title-row {
    flex-wrap: wrap;
  }

  .room-edit__save {
    width: 100%;
  }

  .room-edit__nav {
    gap: 16px 20px;
  }

  .room-edit__form-row {
    grid-template-columns: 1fr;
  }

  .room-edit__pricing-row,
  .room-edit__pricing-row--single {
    grid-template-columns: 1fr;
  }

  .room-edit__attr-body {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
