<script setup lang="ts">
import type {
  BookingPlaceAssignment,
  BookingPlaceRoom,
  BookingPlacesMap,
} from '~/types/api'
import type { BookingHistoryItem } from '~/types/booking'

const props = defineProps<{
  booking: BookingHistoryItem | null
}>()

const emit = defineEmits<{
  close: []
}>()

const BED_SELECTION_NOTIFICATION_GROUP = 'bed-selection'

const { bookings } = useApi()
const notifications = useNotifications()
const notifyOptions = { group: BED_SELECTION_NOTIFICATION_GROUP }

const isOpen = computed(() => Boolean(props.booking))
const isLoading = ref(false)
const loadError = ref('')
const selectingKey = ref<string | null>(null)
const placeRooms = ref<BookingPlaceRoom[]>([])
const placesMap = ref<BookingPlacesMap>({})

let loadRequestId = 0

useBodyScrollLock(isOpen)

interface PlaceRow {
  key: string
  roomId: number
  roomIndex: number
  placeNumber: number
  placeId: number | null
  status: string
  occupied: boolean
}

interface RoomSection {
  key: string
  typeLabel: string
  nameLabel: string
  places: PlaceRow[]
}

const rooms = computed<RoomSection[]>(() =>
  placeRooms.value.flatMap((room) => {
    const roomsCount = Math.max(1, room.booking_number || 1)
    const placesPerRoom = Math.max(0, room.number || 0)

    return Array.from({ length: roomsCount }, (_, index) => {
      const roomIndex = index + 1

      return {
        key: `${room.room_id}-${roomIndex}`,
        typeLabel: roomType(room),
        nameLabel: roomName(room, roomIndex, roomsCount),
        places: Array.from({ length: placesPerRoom }, (_, placeIndex) => {
          const placeNumber = placeIndex + 1
          const assignment = getPlaceAssignment(
            placesMap.value,
            roomIndex,
            room.room_id,
            placeNumber,
          )

          return {
            key: `${room.room_id}-${roomIndex}-${placeNumber}`,
            roomId: room.room_id,
            roomIndex,
            placeNumber,
            placeId: assignment?.id ?? null,
            status: placeStatus(assignment),
            occupied: Boolean(assignment),
          }
        }),
      }
    })
  }),
)

watch(
  () => props.booking?.code,
  (code) => {
    if (!code) {
      loadRequestId += 1
      isLoading.value = false
      selectingKey.value = null
      loadError.value = ''
      placeRooms.value = []
      placesMap.value = {}
      return
    }

    void loadPlaces(code)
  },
  { immediate: true },
)

async function loadPlaces(code: string, options: { silent?: boolean } = {}) {
  const requestId = ++loadRequestId
  if (!options.silent) {
    isLoading.value = true
    loadError.value = ''
    placeRooms.value = []
    placesMap.value = {}
  }

  try {
    const response = await bookings.places(code)

    if (requestId !== loadRequestId) {
      return
    }

    if (!response.success || !response.data?.rooms) {
      loadError.value = response.message || 'Не удалось загрузить койко-места'
      notifications.error(loadError.value, 'Ошибка', notifyOptions)
      return
    }

    placeRooms.value = Array.isArray(response.data.rooms) ? response.data.rooms : []
    placesMap.value = (response.data.places && !Array.isArray(response.data.places))
      ? response.data.places
      : {}
    loadError.value = ''
  }
  catch (error) {
    if (requestId !== loadRequestId) {
      return
    }

    loadError.value = error instanceof Error
      ? error.message
      : 'Не удалось загрузить койко-места'
    notifications.error(loadError.value, 'Ошибка', notifyOptions)
  }
  finally {
    if (requestId === loadRequestId) {
      isLoading.value = false
    }
  }
}

async function selectPlace(place: PlaceRow) {
  const code = props.booking?.code
  if (!code || place.occupied || selectingKey.value) {
    return
  }

  selectingKey.value = place.key

  try {
    const response = await bookings.selectPlace(code, {
      room_id: place.roomId,
      place_number: place.placeNumber,
      room_index: place.roomIndex,
    })

    if (!response.success) {
      notifications.error(response.message || 'Не удалось выбрать место', 'Ошибка', notifyOptions)
      return
    }

    notifications.success(response.message || 'Место выбрано', 'Успех', notifyOptions)
    await loadPlaces(code, { silent: true })
  }
  catch (error) {
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || 'Не удалось выбрать место', 'Ошибка', notifyOptions)
  }
  finally {
    selectingKey.value = null
  }
}

async function cancelPlace(place: PlaceRow) {
  const code = props.booking?.code
  if (!code || !place.placeId || selectingKey.value) {
    return
  }

  selectingKey.value = place.key

  try {
    const response = await bookings.cancelSelectPlace(code, place.placeId)

    if (!response.success) {
      notifications.error(response.message || 'Не удалось отменить выбор места', 'Ошибка', notifyOptions)
      return
    }

    notifications.success(response.message || 'Выбор места отменён', 'Успех', notifyOptions)
    await loadPlaces(code, { silent: true })
  }
  catch (error) {
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || 'Не удалось отменить выбор места', 'Ошибка', notifyOptions)
  }
  finally {
    selectingKey.value = null
  }
}

function close() {
  emit('close')
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    close()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    close()
  }
}

function roomType(room: BookingPlaceRoom) {
  return `${room.number}-Х МЕСТНЫЙ`
}

function roomName(room: BookingPlaceRoom, roomIndex: number, roomsCount: number) {
  const title = room.title || 'Номер'
  return roomsCount > 1 ? `${title} №${roomIndex}` : title
}

function nestedRecord(
  source: Record<string, unknown> | undefined,
  key: number,
): Record<string, unknown> | undefined {
  if (!source) {
    return undefined
  }

  const value = source[String(key)] ?? source[key as unknown as string]
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined
  }

  return value as Record<string, unknown>
}

function getPlaceAssignment(
  map: BookingPlacesMap,
  roomIndex: number,
  roomId: number,
  placeNumber: number,
): BookingPlaceAssignment | null {
  const byRoom = nestedRecord(
    nestedRecord(map as unknown as Record<string, unknown>, roomIndex),
    roomId,
  )
  if (!byRoom) {
    return null
  }

  const list = byRoom[String(placeNumber)] ?? byRoom[placeNumber as unknown as string]
  if (!Array.isArray(list) || !list.length) {
    return null
  }

  return list[0] as BookingPlaceAssignment
}

function placeStatus(assignment: BookingPlaceAssignment | null) {
  if (!assignment?.user) {
    return assignment ? 'занято' : 'свободно'
  }

  const fullName = [assignment.user.first_name, assignment.user.last_name]
    .filter(Boolean)
    .join(' ')
    .trim()

  return fullName || assignment.user.user_name || 'занято'
}
</script>

<template>
  <Teleport to="body">
    <Transition name="bed-selection-modal">
      <div
        v-if="booking"
        class="bed-selection-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bed-selection-modal-title"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <div class="bed-selection-modal__card">
          <header class="bed-selection-modal__header">
            <h2 id="bed-selection-modal-title" class="bed-selection-modal__title">
              Выбор койко-места
            </h2>
            <CommonModalCloseButton @click="close" />
          </header>

          <div class="bed-selection-modal__body">
            <div v-if="isLoading" class="bed-selection-modal__loading">
              <CommonSpinner size="md" label="Загрузка койко-мест" />
            </div>

            <div v-else-if="loadError" class="bed-selection-modal__empty">
              {{ loadError }}
            </div>

            <div v-else-if="rooms.length" class="bed-selection-modal__rooms">
              <section
                v-for="room in rooms"
                :key="room.key"
                class="bed-selection-modal__room"
              >
                <h3 class="bed-selection-modal__room-type">
                  {{ room.typeLabel }}
                </h3>
                <div class="bed-selection-modal__room-name">
                  {{ room.nameLabel }}
                </div>

                <div class="bed-selection-modal__places">
                  <div
                    v-for="place in room.places"
                    :key="place.key"
                    class="bed-selection-modal__place"
                  >
                    <span>место {{ place.placeNumber }}</span>
                    <span
                      :class="{
                        'bed-selection-modal__status--occupied': place.occupied,
                      }"
                    >{{ place.status }}</span>
                    <button
                      v-if="place.occupied"
                      type="button"
                      class="bed-selection-modal__cancel"
                      :disabled="Boolean(selectingKey)"
                      :aria-busy="selectingKey === place.key"
                      @click="cancelPlace(place)"
                    >
                      <CommonSpinner
                        v-if="selectingKey === place.key"
                        variant="ring"
                        :size="16"
                        color="var(--wh-white)"
                        label="Отмена выбора места"
                      />
                      <span v-else>Отменить</span>
                    </button>
                    <button
                      v-else
                      type="button"
                      class="bed-selection-modal__select"
                      :disabled="Boolean(selectingKey)"
                      :aria-busy="selectingKey === place.key"
                      @click="selectPlace(place)"
                    >
                      <CommonSpinner
                        v-if="selectingKey === place.key"
                        variant="ring"
                        :size="16"
                        color="var(--wh-white)"
                        label="Выбор места"
                      />
                      <span v-else>Выбрать</span>
                    </button>
                  </div>
                </div>
              </section>
            </div>

            <div v-else class="bed-selection-modal__empty">
              Койко-места не найдены
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.bed-selection-modal {
  position: fixed;
  inset: 0;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  isolation: isolate;
}

.bed-selection-modal::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: rgba(17, 24, 39, 0.5);
  pointer-events: none;
}

.bed-selection-modal__card {
  width: min(100%, 800px);
  max-height: min(90vh, 760px);
  overflow: auto;
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
}

.bed-selection-modal__header {
  position: relative;
  padding: 18px 48px 18px 16px;
  border-bottom: 1px solid var(--wh-gray-200);
}

.bed-selection-modal__title {
  margin: 0;
  color: #1d3557;
  font-size: 1.25rem;
  font-weight: 500;
  line-height: 1.3;
}

.bed-selection-modal__body {
  padding: 16px;
}

.bed-selection-modal__loading {
  display: flex;
  justify-content: center;
  padding: 48px 16px;
}

.bed-selection-modal__rooms {
  padding: 16px;
  border: 1px solid var(--wh-gray-200);
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(17, 24, 39, 0.12);
}

.bed-selection-modal__room + .bed-selection-modal__room {
  margin-top: 24px;
}

.bed-selection-modal__room-type {
  margin: 0 0 12px;
  color: #1d3557;
  font-size: 1.2rem;
  font-weight: 500;
  text-align: center;
}

.bed-selection-modal__room-name {
  margin-bottom: 8px;
  color: #1d3557;
  font-size: 1rem;
}

.bed-selection-modal__places {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.bed-selection-modal__place {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  align-items: center;
  gap: 16px;
  min-height: 40px;
  padding: 4px 8px;
  border: 1px solid var(--wh-gray-200);
  border-radius: 5px;
  color: var(--wh-gray-600);
  font-size: 0.9rem;
}

.bed-selection-modal__status--occupied {
  color: #198754;
  font-weight: 600;
}

.bed-selection-modal__select,
.bed-selection-modal__cancel {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 92px;
  min-height: 32px;
  padding: 6px 10px;
  border: none;
  border-radius: 4px;
  color: var(--wh-white);
  font-size: 0.9rem;
  cursor: pointer;
}

.bed-selection-modal__select {
  background: var(--wh-green);
}

.bed-selection-modal__cancel {
  background: #dc3545;
}

.bed-selection-modal__select:disabled,
.bed-selection-modal__cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.bed-selection-modal__empty {
  padding: 32px 16px;
  color: var(--wh-gray-600);
  text-align: center;
}

.bed-selection-modal-enter-active,
.bed-selection-modal-leave-active {
  transition: opacity 0.2s ease;
}

.bed-selection-modal-enter-from,
.bed-selection-modal-leave-to {
  opacity: 0;
}

@media (--wh-tablet) {
  .bed-selection-modal {
    padding: 8px;
  }

  .bed-selection-modal__place {
    grid-template-columns: 1fr auto;
  }

  .bed-selection-modal__place span:nth-child(2) {
    display: none;
  }
}
</style>
