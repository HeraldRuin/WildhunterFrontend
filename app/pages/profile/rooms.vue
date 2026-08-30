<script setup lang="ts">
import type { ManagedRoom } from '~/api/rooms'
import type { RoomManageItem } from '~/components/profile/RoomManageCard.vue'

definePageMeta({
  layout: 'profile',
  path: '/rooms',
})

useHead({
  title: 'Управление номерами — WH',
})

const { rooms: roomsApi } = useApi()
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

const hotelTitle = 'Хромой кабан-2'

const breadcrumbs = [
  { label: 'Главная', to: '/' },
  { label: `Управление базой: ${hotelTitle}`, to: '/profile/base' },
  { label: 'Управление номерами' },
]

const route = useRoute()

const rooms = ref<RoomManageItem[]>([])
const isLoading = ref(true)
const loadError = ref('')

const roomsCount = computed(() => rooms.value.length)

function formatUpdatedAt(value?: string) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date).replace(',', '')
}

function mapToRoomManageItem(room: ManagedRoom): RoomManageItem {
  return {
    id: room.id,
    title: room.title,
    image: room.image_url ?? '',
    quantity: Number(room.number) || 0,
    price: Number(room.price) || 0,
    status: room.status === 'publish' ? 'publish' : 'draft',
    updatedAt: formatUpdatedAt(room.updated_at),
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

function addRoom() {
  const hotelId = route.query.hotelId
  void navigateTo({
    path: '/rooms/new',
    query: typeof hotelId === 'string' && hotelId ? { hotelId } : undefined,
  })
}

function openAvailability() {
  const hotelId = route.query.hotelId
  void navigateTo({
    path: '/rooms/availability',
    query: typeof hotelId === 'string' && hotelId ? { hotelId } : undefined,
  })
}

function onVisibilityChanged(id: number, status: RoomManageItem['status']) {
  const room = rooms.value.find(item => item.id === id)
  if (!room) {
    return
  }

  room.status = status
}

function onRoomDeleted(id: number) {
  rooms.value = rooms.value.filter(room => room.id !== id)
}

async function loadRooms() {
  isLoading.value = true
  loadError.value = ''

  try {
    const response = await roomsApi.getList()

    if ('success' in response && response.success) {
      rooms.value = (response.data?.rooms ?? []).map(mapToRoomManageItem)
      return
    }

    loadError.value = extractErrorMessage(response, 'Не удалось загрузить номера')
  }
  catch (error) {
    const data = (error as { data?: unknown }).data
    loadError.value = extractErrorMessage(data, 'Не удалось загрузить номера')
  }
  finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void loadRooms()
})
</script>

<template>
  <div v-if="ready" class="profile-page">
    <header class="profile-page__header">
      <AppBreadcrumbs :items="breadcrumbs" />

      <ProfileNotificationsBell />
    </header>

    <div class="rooms-manage__toolbar">
      <CommonPageTitle>Управление номерами</CommonPageTitle>

      <div class="rooms-manage__actions">
        <button
          type="button"
          class="rooms-manage__btn rooms-manage__btn--success"
          @click="addRoom"
        >
          + Добавить Номер
        </button>

        <button
          type="button"
          class="rooms-manage__btn rooms-manage__btn--primary"
          @click="openAvailability"
        >
          <svg
            class="rooms-manage__btn-icon"
            width="14"
            height="14"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <rect x="2.25" y="3.75" width="15.5" height="14" rx="1.75" stroke="currentColor" stroke-width="1.5" />
            <path d="M2.25 8.25h15.5" stroke="currentColor" stroke-width="1.5" />
            <path d="M6.5 2.25v3.25M13.5 2.25v3.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          Доступные номера
        </button>
      </div>
    </div>

    <p v-if="loadError" class="rooms-manage__status rooms-manage__status--error">
      {{ loadError }}
    </p>

    <div
      v-else-if="isLoading"
      class="rooms-manage__loading"
      aria-live="polite"
    >
      <CommonSpinner variant="ring" size="lg" label="Загрузка номеров" />
    </div>

    <div v-else-if="roomsCount > 0" class="rooms-manage__list">
      <ProfileRoomManageCard
        v-for="room in rooms"
        :key="room.id"
        :item="room"
        @visibility-changed="status => onVisibilityChanged(room.id, status)"
        @deleted="onRoomDeleted"
      />
    </div>

    <p v-else class="rooms-manage__empty">Нет номеров</p>

    <CommonConfirmModal />
  </div>
</template>

<style scoped>
.profile-page {
  padding: 20px 40px 16px;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
}

.profile-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  max-width: 1100px;
  height: 31px;
  margin-bottom: 20px;
  padding: 0;
  box-sizing: border-box;
  overflow: visible;
}

.rooms-manage__toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  max-width: 1100px;
  margin-bottom: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
}

.rooms-manage__toolbar :deep(.page-title) {
  margin: 0;
  flex: 1;
  min-width: 0;
}

.rooms-manage__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex-shrink: 0;
  padding-top: 6px;
}

.rooms-manage__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 16px;
  border: 1.5px solid transparent;
  border-radius: 999px;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  box-sizing: border-box;
  transition: opacity 0.15s ease, background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.rooms-manage__btn-icon {
  flex-shrink: 0;
}

.rooms-manage__btn--success {
  border-color: var(--wh-green);
  background: var(--wh-green);
  color: var(--wh-white);
}

.rooms-manage__btn--primary {
  border-color: var(--wh-orange-500);
  background: var(--wh-orange-500);
  color: var(--wh-white);
}

.rooms-manage__btn--primary:hover {
  border-color: var(--wh-orange-600);
  background: var(--wh-orange-600);
}

.rooms-manage__list {
  display: flex;
  flex-direction: column;
  gap: 30px;
  width: 100%;
  max-width: 1100px;
}

.rooms-manage__status {
  margin: 16px 0 0;
  color: rgba(0, 0, 0, 0.55);
  font-size: 16px;
}

.rooms-manage__status--error {
  color: #dc3545;
}

.rooms-manage__loading {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 220px;
}

.rooms-manage__empty {
  margin: 16px 0 0;
  color: rgba(0, 0, 0, 0.55);
  font-size: 16px;
}

@media (--wh-tablet) {
  .profile-page {
    padding: 12px 8px 32px;
  }

  .profile-page__header {
    width: 100%;
  }

  .rooms-manage__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .rooms-manage__actions {
    padding-top: 0;
  }
}

@media (--wh-mobile) {
  .profile-page {
    padding: 16px 20px 32px;
  }

  .profile-page__header {
    height: auto;
    min-height: 31px;
    padding: 0;
    background: transparent;
    border-radius: 0;
  }

  .rooms-manage__btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
