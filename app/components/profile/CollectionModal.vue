<script setup lang="ts">
import type { UserSearchItem } from '~/api/user'
import type { CollectionParticipant, CollectionParticipantStatus } from '~/types/booking'
import { formatRemainingTimer } from '~/utils/bookingHistory'

type StatsPanelFilter = 'collected' | 'pending' | 'declined'

type CollectionInviteDraft = {
  inviteQueries: string[]
  selectedHunters: Array<UserSearchItem | null>
  visibleInviteFieldCount: number
}

const inviteDraftsByBookingCode = new Map<string, CollectionInviteDraft>()
let activeInviteBookingCode: string | null = null

const emit = defineEmits<{
  extended: []
  cancelled: []
  finished: []
  invited: [payload: { hunter: UserSearchItem }]
}>()

const {
  isOpen,
  isContentHidden,
  state,
  close,
  hide,
  reopen,
  markCollectionExtended,
  addParticipant,
  isDeclinedHunter,
  removeDeclinedParticipant,
  liveDeclinedParticipants,
} = useCollectionModal()
const { bookings: bookingsApi, user: userApi } = useApi()
const notifications = useNotifications()
const { open: openConfirmModal } = useConfirmModal()

useBodyScrollLock(isOpen)

const inviteQueries = ref<string[]>([])
const selectedHunters = ref<Array<UserSearchItem | null>>([])
const searchResults = ref<UserSearchItem[]>([])
const activeSearchIndex = ref<number | null>(null)
const isSearching = ref(false)
const searchError = ref('')
const timerNow = ref(Date.now())
const visibleInviteFieldCount = ref(4)
const INVITE_FIELDS_EXPAND_THRESHOLD = 5
const INITIAL_EXPANDED_INVITE_FIELDS = 4
let timerInterval: ReturnType<typeof setInterval> | undefined
let searchTimeout: ReturnType<typeof setTimeout> | undefined
let searchRequestId = 0

const canExtendCollection = computed(() => {
  const timerEndAt = state.value?.timerEndAt
  if (!timerEndAt) return state.value?.timerExpired ?? false

  const end = new Date(timerEndAt).getTime()
  return Number.isFinite(end) && end <= timerNow.value
})

const timerLabel = computed(() => {
  if (!state.value) return ''

  if (state.value.timerEndAt) {
    return formatRemainingTimer(state.value.timerEndAt, timerNow.value) || '00 мин 00 сек'
  }

  if (state.value.timerExpired) {
    return '00 мин 00 сек'
  }

  return ''
})

const occupiedParticipants = computed(() => {
  if (!state.value) return []

  return state.value.participants.filter(participant => participant.status !== 'declined')
})

const PARTICIPANT_STATUS_ORDER: Record<CollectionParticipantStatus, number> = {
  confirmed: 0,
  pending: 1,
  declined: 2,
}

const sortedOccupiedParticipants = computed(() => {
  return [...occupiedParticipants.value].sort((left, right) => {
    return PARTICIPANT_STATUS_ORDER[left.status] - PARTICIPANT_STATUS_ORDER[right.status]
  })
})

const canFinishCollection = computed(() => {
  if (!state.value) return false

  const required = state.value.slotsTotal
  const accepted = occupiedParticipants.value.filter(
    participant => participant.status === 'confirmed',
  ).length

  return accepted >= required
})

const emptySlotCount = computed(() => {
  if (!state.value) return 0

  return Math.max(
    0,
    state.value.slotsTotal
      - occupiedParticipants.value.length
      - liveDeclinedParticipants.value.length,
  )
})

const collectedCount = computed(() => {
  return occupiedParticipants.value.filter(
    participant => participant.status === 'confirmed',
  ).length
})

const pendingCount = computed(() => {
  return occupiedParticipants.value.filter(
    participant => participant.status === 'pending',
  ).length
})

const declinedCount = computed(() => liveDeclinedParticipants.value.length)

const activeStatsPanel = ref<StatsPanelFilter | null>(null)
const cardRef = ref<HTMLElement | null>(null)
const linkRowRef = ref<HTMLElement | null>(null)
const footerStatsWrapRef = ref<HTMLElement | null>(null)
const statsPanelRef = ref<HTMLElement | null>(null)
const statsPanelLayout = ref<Record<string, string>>({})
const STATS_PANEL_GAP = 8
let statsPanelResizeObserver: ResizeObserver | undefined

const confirmedParticipants = computed(() => {
  return sortedOccupiedParticipants.value.filter(
    participant => participant.status === 'confirmed',
  )
})

const pendingParticipants = computed(() => {
  return sortedOccupiedParticipants.value.filter(
    participant => participant.status === 'pending',
  )
})

const statsPanelParticipants = computed<CollectionParticipant[]>(() => {
  switch (activeStatsPanel.value) {
    case 'collected':
      return confirmedParticipants.value
    case 'pending':
      return pendingParticipants.value
    case 'declined':
      return [...liveDeclinedParticipants.value]
    default:
      return []
  }
})

const slotsTotal = computed(() => state.value?.slotsTotal ?? 0)

const usesExpandedInviteFields = computed(() => {
  return slotsTotal.value > INVITE_FIELDS_EXPAND_THRESHOLD
})

const targetInviteFieldCount = computed(() => {
  if (!usesExpandedInviteFields.value) {
    return emptySlotCount.value
  }

  return Math.min(emptySlotCount.value, visibleInviteFieldCount.value)
})

const canAddInviteField = computed(() => {
  return usesExpandedInviteFields.value
    && visibleInviteFieldCount.value < emptySlotCount.value
})

const pendingInviteHunters = computed(() => {
  const occupiedIds = new Set(
    occupiedParticipants.value
      .map(participant => participant.id)
      .filter((id): id is number => id != null),
  )
  const seen = new Set<number>()
  const hunters: UserSearchItem[] = []

  for (const hunter of selectedHunters.value) {
    if (!hunter || occupiedIds.has(hunter.id) || seen.has(hunter.id)) {
      continue
    }

    seen.add(hunter.id)
    hunters.push(hunter)
  }

  return hunters
})

const canInviteAll = computed(() => {
  return pendingInviteHunters.value.length > 0 && !canExtendCollection.value
})

const collectionLinkAbsolute = computed(() => {
  const url = state.value?.collectionUrl
  if (!url) return ''

  if (!import.meta.client) return url

  try {
    return new URL(url, window.location.origin).toString()
  }
  catch {
    return url
  }
})

function hasInviteDraftContent(
  queries: string[],
  hunters: Array<UserSearchItem | null>,
) {
  return queries.some((query, index) => Boolean(query.trim()) || Boolean(hunters[index]))
}

function saveInviteDraft(bookingCode: string) {
  if (!hasInviteDraftContent(inviteQueries.value, selectedHunters.value)) {
    inviteDraftsByBookingCode.delete(bookingCode)
    return
  }

  inviteDraftsByBookingCode.set(bookingCode, {
    inviteQueries: [...inviteQueries.value],
    selectedHunters: selectedHunters.value.map(hunter =>
      hunter ? { ...hunter } : null,
    ),
    visibleInviteFieldCount: visibleInviteFieldCount.value,
  })
}

function restoreInviteDraft(bookingCode: string) {
  const draft = inviteDraftsByBookingCode.get(bookingCode)
  if (!draft) return false

  visibleInviteFieldCount.value = draft.visibleInviteFieldCount
  inviteQueries.value = [...draft.inviteQueries]
  selectedHunters.value = draft.selectedHunters.map(hunter =>
    hunter ? { ...hunter } : null,
  )
  syncInviteSlots(Math.max(draft.inviteQueries.length, targetInviteFieldCount.value))
  resetHunterSearch()
  return true
}

function clearInviteDraft(bookingCode: string | null | undefined) {
  if (!bookingCode) return
  inviteDraftsByBookingCode.delete(bookingCode)
}

watch(isOpen, (open) => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = undefined
  }

  if (!open) {
    if (activeInviteBookingCode) {
      saveInviteDraft(activeInviteBookingCode)
    }

    activeInviteBookingCode = null
    inviteQueries.value = []
    selectedHunters.value = []
    visibleInviteFieldCount.value = INITIAL_EXPANDED_INVITE_FIELDS
    activeStatsPanel.value = null
    resetHunterSearch()
    return
  }

  activeInviteBookingCode = state.value?.bookingCode ?? null
  timerNow.value = Date.now()
  timerInterval = setInterval(() => {
    timerNow.value = Date.now()
  }, 1_000)

  if (activeInviteBookingCode && restoreInviteDraft(activeInviteBookingCode)) {
    return
  }

  initializeInviteFields()
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  statsPanelResizeObserver?.disconnect()
})

watch(activeStatsPanel, (panel) => {
  if (panel) {
    updateStatsPanelLayout()
    return
  }

  statsPanelLayout.value = {}
  statsPanelResizeObserver?.disconnect()
  statsPanelResizeObserver = undefined
})

watch(emptySlotCount, () => {
  if (!isOpen.value) return
  syncInviteSlots()
})

watch(canExtendCollection, (expired) => {
  if (expired) {
    resetHunterSearch()
  }
})

function resetHunterSearch() {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
    searchTimeout = undefined
  }
  searchRequestId += 1
  searchResults.value = []
  activeSearchIndex.value = null
  isSearching.value = false
  searchError.value = ''
}

function initializeInviteFields() {
  visibleInviteFieldCount.value = usesExpandedInviteFields.value
    ? Math.min(emptySlotCount.value, INITIAL_EXPANDED_INVITE_FIELDS)
    : emptySlotCount.value
  syncInviteSlots()
}

function addInviteField() {
  if (!canAddInviteField.value || canExtendCollection.value) return

  visibleInviteFieldCount.value += 1
  inviteQueries.value = [...inviteQueries.value, '']
  selectedHunters.value = [...selectedHunters.value, null]
  resetHunterSearch()
}

function syncInviteSlots(count = targetInviteFieldCount.value) {
  if (usesExpandedInviteFields.value && visibleInviteFieldCount.value > emptySlotCount.value) {
    visibleInviteFieldCount.value = emptySlotCount.value
    count = emptySlotCount.value
  }

  const occupiedIds = new Set(
    occupiedParticipants.value
      .map(participant => participant.id)
      .filter((id): id is number => id != null),
  )

  const keptQueries: string[] = []
  const keptSelected: Array<UserSearchItem | null> = []

  for (let index = 0; index < inviteQueries.value.length; index += 1) {
    if (keptQueries.length >= count) break

    const selected = selectedHunters.value[index] ?? null
    if (selected && occupiedIds.has(selected.id)) {
      continue
    }

    keptQueries.push(inviteQueries.value[index] ?? '')
    keptSelected.push(selected)
  }

  while (keptQueries.length < count) {
    keptQueries.push('')
    keptSelected.push(null)
  }

  inviteQueries.value = keptQueries
  selectedHunters.value = keptSelected
  resetHunterSearch()
}

function resetInviteSlots() {
  syncInviteSlots()
}

function hunterName(hunter: UserSearchItem) {
  return [hunter.first_name, hunter.last_name].filter(Boolean).join(' ') || 'Имя не указано'
}

function hunterNickname(hunter: UserSearchItem) {
  return hunter.nik || hunter.user_name || ''
}

function hunterInputLabel(hunter: UserSearchItem) {
  return hunter.nik || hunter.user_name || hunterName(hunter)
}

function isSelectedHunterLocked(index: number) {
  const hunter = selectedHunters.value[index]
  if (!hunter) return false

  return inviteQueries.value[index]?.trim() === hunterInputLabel(hunter)
}

function handleInviteInput(index: number) {
  const selectedHunter = selectedHunters.value[index]
  const query = inviteQueries.value[index]?.trim() ?? ''

  if (selectedHunter && query === hunterInputLabel(selectedHunter)) {
    resetHunterSearch()
    return
  }

  selectedHunters.value[index] = null
  activeSearchIndex.value = index
  searchResults.value = []
  searchError.value = ''

  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  if (!query) {
    isSearching.value = false
    searchRequestId += 1
    return
  }

  searchTimeout = setTimeout(() => {
    void searchHunters(query, index)
  }, 300)
}

function selectHunter(hunter: UserSearchItem, index: number) {
  selectedHunters.value[index] = hunter
  inviteQueries.value[index] = hunterInputLabel(hunter)
  resetHunterSearch()
}

function clearInviteField(index: number) {
  inviteQueries.value[index] = ''
  selectedHunters.value[index] = null

  if (activeSearchIndex.value === index) {
    resetHunterSearch()
  }
}

function clearDeclinedParticipant(participant: CollectionParticipant) {
  if (participant.id) {
    removeDeclinedParticipant(participant.id)
  }
}

async function searchHunters(query: string, index: number) {
  const bookingId = state.value?.bookingId
  if (!bookingId) return

  const requestId = ++searchRequestId
  isSearching.value = true

  try {
    const response = await userApi.searchHunters(query, bookingId)
    if (requestId !== searchRequestId || activeSearchIndex.value !== index) return

    if (!response.success || !('data' in response)) {
      searchError.value = response.message || 'Не удалось найти охотников'
      return
    }

    const data = response.data
    searchResults.value = Array.isArray(data)
      ? data
      : data.items ?? data.data ?? []
  }
  catch (error) {
    if (requestId !== searchRequestId) return

    const data = (error as { data?: { message?: string } }).data
    searchError.value = data?.message || 'Не удалось найти охотников'
  }
  finally {
    if (requestId === searchRequestId) {
      isSearching.value = false
    }
  }
}

function handleBackdropClick() {
  if (isContentHidden.value) return

  close()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    close()
  }
}

async function copyCollectionLink() {
  if (!import.meta.client) return

  const url = collectionLinkAbsolute.value
  if (!url) {
    notifications.error('Ссылка на сбор недоступна')
    return
  }

  try {
    await navigator.clipboard.writeText(url)
    notifications.success('Ссылка скопирована в буфер обмена')
  } catch {
    notifications.error('Не удалось скопировать ссылку')
  }
}

async function extendCollection() {
  const bookingCode = state.value?.bookingCode
  if (!bookingCode) return

  try {
    const response = await bookingsApi.extendCollection(bookingCode)

    if (response.success) {
      notifications.success(response.message || 'Сбор успешно продлён')
      markCollectionExtended()
      reopen()
      emit('extended')
      return
    }

    notifications.error(response.message || 'Не удалось продлить сбор')
  }
  catch (error) {
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || 'Не удалось продлить сбор')
    throw error
  }

  throw new Error('extend_collection_failed')
}

async function inviteHunter(hunter: UserSearchItem) {
  const bookingCode = state.value?.bookingCode
  if (!bookingCode) return

  try {
    const response = await bookingsApi.inviteHunter(bookingCode, hunter.id)

    if (response.success) {
      addParticipant({
        id: hunter.id,
        name: hunterName(hunter),
        email: hunter.email || undefined,
        status: 'pending',
      })
      resetInviteSlots()
      emit('invited', { hunter })
      notifications.success(response.message || 'Приглашение отправлено')
      reopen()
      return
    }

    notifications.error(response.message || 'Не удалось пригласить охотника')
  }
  catch (error) {
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || 'Не удалось пригласить охотника')
    throw error
  }

  throw new Error('invite_hunter_failed')
}

async function cancelCollection() {
  const bookingCode = state.value?.bookingCode
  if (!bookingCode) return

  try {
    const response = await bookingsApi.cancelCollection(bookingCode)

    if (response.success) {
      notifications.success(response.message || 'Сбор отменён')
      clearInviteDraft(bookingCode)
      close()
      emit('cancelled')
      return
    }

    notifications.error(response.message || 'Не удалось отменить сбор')
  }
  catch (error) {
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || 'Не удалось отменить сбор')
    throw error
  }

  throw new Error('cancel_collection_failed')
}

async function finishCollection() {
  const bookingCode = state.value?.bookingCode
  if (!bookingCode) return

  try {
    const response = await bookingsApi.finishCollection(bookingCode)

    if (response.success) {
      notifications.success(response.message || 'Сбор завершён')
      clearInviteDraft(bookingCode)
      close()
      emit('finished')
      return
    }

    notifications.error(response.message || 'Не удалось завершить сбор')
  }
  catch (error) {
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || 'Не удалось завершить сбор')
    throw error
  }

  throw new Error('finish_collection_failed')
}

function requestCollectionCancellation() {
  hide()
  openConfirmModal({
    title: 'Вы уверены, что хотите отменить сбор?',
    confirmLabel: 'Отменить сбор',
    onConfirm: cancelCollection,
    onCancel: () => {
      setTimeout(reopen, 200)
    },
    transparentBackdrop: true,
  })
}

function requestCollectionFinish() {
  if (!canFinishCollection.value) return

  hide()
  openConfirmModal({
    title: 'Вы уверены, что хотите завершить сбор?',
    confirmLabel: 'Завершить сбор',
    onConfirm: finishCollection,
    onCancel: () => {
      setTimeout(reopen, 200)
    },
    transparentBackdrop: true,
  })
}

function requestHunterInvitation(hunter: UserSearchItem) {
  hide()
  openConfirmModal({
    title: `Пригласить охотника ${hunterName(hunter)}?`,
    confirmLabel: 'Пригласить',
    onConfirm: () => inviteHunter(hunter),
    onCancel: () => {
      setTimeout(reopen, 200)
    },
    transparentBackdrop: true,
  })
}

async function inviteAllHunters() {
  const bookingCode = state.value?.bookingCode
  if (!bookingCode) return

  const hunters = pendingInviteHunters.value
  if (!hunters.length) return

  let invitedCount = 0

  for (const hunter of hunters) {
    try {
      const response = await bookingsApi.inviteHunter(bookingCode, hunter.id)

      if (!response.success) {
        notifications.error(response.message || `Не удалось пригласить ${hunterName(hunter)}`)
        break
      }

      addParticipant({
        id: hunter.id,
        name: hunterName(hunter),
        email: hunter.email || undefined,
        status: 'pending',
      })
      emit('invited', { hunter })
      invitedCount += 1
    }
    catch (error) {
      const data = (error as { data?: { message?: string } }).data
      notifications.error(data?.message || `Не удалось пригласить ${hunterName(hunter)}`)
      throw error
    }
  }

  resetInviteSlots()

  if (invitedCount === hunters.length) {
    notifications.success(
      invitedCount === 1
        ? 'Приглашение отправлено'
        : `Приглашения отправлены (${invitedCount})`,
    )
  }
  else if (invitedCount > 0) {
    notifications.success(`Отправлено приглашений: ${invitedCount} из ${hunters.length}`)
  }

  reopen()
}

function requestInviteAll() {
  if (!canInviteAll.value) return

  const hunters = pendingInviteHunters.value
  hide()
  openConfirmModal({
    title: hunters.length === 1
      ? `Пригласить охотника ${hunterName(hunters[0]!)}?`
      : `Пригласить всех выбранных охотников (${hunters.length})?`,
    confirmLabel: 'Пригласить',
    onConfirm: inviteAllHunters,
    onCancel: () => {
      setTimeout(reopen, 200)
    },
    transparentBackdrop: true,
  })
}

function requestCollectionExtension() {
  if (!canExtendCollection.value) return

  hide()
  openConfirmModal({
    title: 'Вы уверены, что хотите продлить сбор?',
    confirmLabel: 'Продлить',
    onConfirm: extendCollection,
    onCancel: () => {
      setTimeout(reopen, 200)
    },
    transparentBackdrop: true,
  })
}

function participantBadgeLabel(status: CollectionParticipantStatus) {
  switch (status) {
    case 'confirmed':
      return 'Подтвержден'
    case 'pending':
      return 'Ожидает подтверждения'
    case 'declined':
      return 'Отклонено'
    default: {
      const _exhaustive: never = status
      return _exhaustive
    }
  }
}

function participantBadgeClass(status: CollectionParticipantStatus) {
  switch (status) {
    case 'confirmed':
      return 'collection-modal__badge--confirmed'
    case 'pending':
      return 'collection-modal__badge--pending'
    case 'declined':
      return 'collection-modal__badge--declined'
    default: {
      const _exhaustive: never = status
      return _exhaustive
    }
  }
}

function toggleStatsPanel(filter: StatsPanelFilter) {
  activeStatsPanel.value = activeStatsPanel.value === filter ? null : filter
}

function handleCardClick(event: MouseEvent) {
  if (!activeStatsPanel.value) return

  const target = event.target
  if (!(target instanceof Node)) return

  if (
    statsPanelRef.value?.contains(target)
    || footerStatsWrapRef.value?.contains(target)
  ) {
    return
  }

  activeStatsPanel.value = null
}

function updateStatsPanelLayout() {
  if (!activeStatsPanel.value) {
    return
  }

  nextTick(() => {
    const card = cardRef.value
    const linkRow = linkRowRef.value
    const wrap = footerStatsWrapRef.value
    if (!card || !linkRow || !wrap) {
      return
    }

    const cardRect = card.getBoundingClientRect()
    const linkRect = linkRow.getBoundingClientRect()
    const wrapRect = wrap.getBoundingClientRect()

    statsPanelLayout.value = {
      top: `${linkRect.bottom - cardRect.top + STATS_PANEL_GAP}px`,
      bottom: `${cardRect.bottom - wrapRect.top + STATS_PANEL_GAP}px`,
      left: `${wrapRect.left - cardRect.left}px`,
      width: `${wrapRect.width}px`,
    }

    statsPanelResizeObserver?.disconnect()
    statsPanelResizeObserver = new ResizeObserver(updateStatsPanelLayout)
    statsPanelResizeObserver.observe(card)
  })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="collection-modal">
      <div
        v-if="isOpen && state"
        class="collection-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="collection-modal-title"
        @keydown="handleKeydown"
      >
        <div
          class="collection-modal__backdrop"
          aria-hidden="true"
          @click="handleBackdropClick"
        />

        <div
          v-show="!isContentHidden"
          ref="cardRef"
          class="collection-modal__card"
          @click="handleCardClick"
        >
          <CommonModalCloseButton @click="close" />

          <header class="collection-modal__header">
            <h2 id="collection-modal-title" class="collection-modal__title">
              Открыт сбор для брони #{{ state.bookingNumber }}
            </h2>

            <div
              ref="linkRowRef"
              class="collection-modal__link-row"
            >
              <span class="collection-modal__link-label">
                Прямая ссылка на сбор
              </span>

              <div class="collection-modal__link-wrap">
                <span
                  class="collection-modal__link-tooltip"
                  role="tooltip"
                >
                  Прямая ссылка на сбор
                </span>

                <button
                  v-if="collectionLinkAbsolute"
                  type="button"
                  class="collection-modal__link-url"
                  @click="copyCollectionLink"
                >
                  {{ collectionLinkAbsolute }}
                </button>
              </div>
            </div>
          </header>

          <div class="collection-modal__body">
            <div
              v-for="(participant, index) in sortedOccupiedParticipants"
              :key="participant.id ?? participant.name"
              class="collection-modal__slot-row"
            >
              <span class="collection-modal__field-number">{{ index + 1 }}</span>

              <div class="collection-modal__slot-content">
                <div class="collection-modal__participant">
                  <div class="collection-modal__participant-info">
                    <div class="collection-modal__invite-input-selected-line">
                      <span class="collection-modal__participant-name">
                        {{ participant.name }}
                      </span>
                      <span
                        v-if="participant.email"
                        class="collection-modal__invite-input-email"
                      >
                        <svg
                          class="collection-modal__invite-input-email-icon"
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                          fill="none"
                          aria-hidden="true"
                        >
                          <rect
                            x="2"
                            y="3.5"
                            width="12"
                            height="9"
                            rx="1"
                            stroke="currentColor"
                            stroke-width="1.2"
                          />
                          <path
                            d="M2.5 4.5 8 9l5.5-4.5"
                            stroke="currentColor"
                            stroke-width="1.2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                        {{ participant.email }}
                      </span>
                    </div>
                  </div>

                  <span
                    class="collection-modal__badge"
                    :class="participantBadgeClass(participant.status)"
                  >
                    <svg
                      v-if="participant.status === 'confirmed'"
                      class="collection-modal__badge-icon"
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    {{ participantBadgeLabel(participant.status) }}
                  </span>
                </div>
              </div>
            </div>

            <div
              v-for="(participant, index) in liveDeclinedParticipants"
              :key="`declined-${participant.id ?? participant.name}`"
              class="collection-modal__slot-row"
            >
              <span class="collection-modal__field-number">
                {{ sortedOccupiedParticipants.length + index + 1 }}
              </span>

              <div class="collection-modal__slot-content">
                <div class="collection-modal__invite-input-wrap">
                  <div class="collection-modal__invite-input-box">
                    <div
                      v-if="participant.email"
                      class="collection-modal__invite-input collection-modal__invite-input--selected collection-modal__invite-input--with-clear collection-modal__invite-input--declined"
                    >
                      <div class="collection-modal__invite-input-selected-line">
                        <span class="collection-modal__invite-input-name">
                          {{ participant.name }}
                        </span>
                        <span class="collection-modal__invite-input-email">
                          <svg
                            class="collection-modal__invite-input-email-icon"
                            width="14"
                            height="14"
                            viewBox="0 0 16 16"
                            fill="none"
                            aria-hidden="true"
                          >
                            <rect
                              x="2"
                              y="3.5"
                              width="12"
                              height="9"
                              rx="1"
                              stroke="currentColor"
                              stroke-width="1.2"
                            />
                            <path
                              d="M2.5 4.5 8 9l5.5-4.5"
                              stroke="currentColor"
                              stroke-width="1.2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                          {{ participant.email }}
                        </span>
                        <span class="collection-modal__declined-label">
                          Отказался
                        </span>
                      </div>
                    </div>
                    <input
                      v-else
                      type="text"
                      class="collection-modal__invite-input collection-modal__invite-input--declined collection-modal__invite-input--with-clear"
                      :value="participant.name"
                      readonly
                      tabindex="-1"
                    >

                    <button
                      type="button"
                      class="collection-modal__invite-input-clear"
                      @click="clearDeclinedParticipant(participant)"
                    >
                      очистить
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-for="(_, index) in inviteQueries"
              :key="`invite-${index}`"
              class="collection-modal__slot-row"
            >
              <span class="collection-modal__field-number">
                {{ sortedOccupiedParticipants.length + liveDeclinedParticipants.length + index + 1 }}
              </span>

              <div class="collection-modal__slot-content">
                <div class="collection-modal__invite-control">
                  <div
                    class="collection-modal__invite-input-wrap"
                    :class="{ 'collection-modal__invite-input-wrap--timer-expired': canExtendCollection }"
                  >
                    <div class="collection-modal__invite-input-box">
                      <div
                        v-if="selectedHunters[index]?.email && isSelectedHunterLocked(index)"
                        class="collection-modal__invite-input collection-modal__invite-input--selected"
                        :class="{ 'collection-modal__invite-input--with-clear': Boolean(selectedHunters[index]) }"
                      >
                        <div class="collection-modal__invite-input-selected-line">
                          <span class="collection-modal__invite-input-name">
                            {{ hunterName(selectedHunters[index]!) }}
                          </span>
                          <span class="collection-modal__invite-input-email">
                            <svg
                              class="collection-modal__invite-input-email-icon"
                              width="14"
                              height="14"
                              viewBox="0 0 16 16"
                              fill="none"
                              aria-hidden="true"
                            >
                              <rect
                                x="2"
                                y="3.5"
                                width="12"
                                height="9"
                                rx="1"
                                stroke="currentColor"
                                stroke-width="1.2"
                              />
                              <path
                                d="M2.5 4.5 8 9l5.5-4.5"
                                stroke="currentColor"
                                stroke-width="1.2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                            </svg>
                            {{ selectedHunters[index]?.email }}
                          </span>
                          <span
                            v-if="isDeclinedHunter(selectedHunters[index]!.id)"
                            class="collection-modal__declined-label"
                          >
                            Отказался
                          </span>
                        </div>
                      </div>
                      <input
                        v-else
                        v-model="inviteQueries[index]"
                        type="text"
                        class="collection-modal__invite-input"
                        :class="{ 'collection-modal__invite-input--with-clear': Boolean(selectedHunters[index]) }"
                        placeholder="Ник / Имя / Фамилия / email / ID"
                        autocomplete="off"
                        :disabled="canExtendCollection"
                        @focus="handleInviteInput(index)"
                        @input="handleInviteInput(index)"
                      >

                      <button
                        v-if="selectedHunters[index]"
                        type="button"
                        class="collection-modal__invite-input-clear"
                        @click="clearInviteField(index)"
                      >
                        очистить
                      </button>
                    </div>

                    <span
                      v-if="canExtendCollection"
                      class="collection-modal__invite-input-tooltip"
                      role="tooltip"
                    >
                      Таймер закончен. Продлите сбор
                    </span>

                    <div
                      v-if="activeSearchIndex === index && inviteQueries[index]?.trim()"
                      class="collection-modal__search-results"
                    >
                      <div v-if="isSearching" class="collection-modal__search-message">
                        Поиск…
                      </div>
                      <div v-else-if="searchError" class="collection-modal__search-message collection-modal__search-message--error">
                        {{ searchError }}
                      </div>
                      <div v-else-if="!searchResults.length" class="collection-modal__search-message collection-modal__search-message--error">
                        Охотники не найдены
                      </div>
                      <div
                        v-for="hunter in searchResults"
                        v-else
                        :key="hunter.id"
                        class="collection-modal__search-result"
                        @click="selectHunter(hunter, index)"
                      >
                        <div class="collection-modal__search-result-info">
                          <div>
                            ID: {{ hunter.id }} (ник {{ hunterNickname(hunter) || 'не задан' }}) {{ hunterName(hunter) }}
                          </div>
                          <div v-if="hunter.email" class="collection-modal__search-result-email">
                            <svg
                              class="collection-modal__invite-input-email-icon"
                              width="14"
                              height="14"
                              viewBox="0 0 16 16"
                              fill="none"
                              aria-hidden="true"
                            >
                              <rect
                                x="2"
                                y="3.5"
                                width="12"
                                height="9"
                                rx="1"
                                stroke="currentColor"
                                stroke-width="1.2"
                              />
                              <path
                                d="M2.5 4.5 8 9l5.5-4.5"
                                stroke="currentColor"
                                stroke-width="1.2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                            </svg>
                            {{ hunter.email }}
                          </div>
                        </div>
                        <span
                          v-if="isDeclinedHunter(hunter.id)"
                          class="collection-modal__declined-label"
                        >
                          Отказался
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    v-if="selectedHunters[index]"
                    type="button"
                    class="collection-modal__invite-button"
                    @click="requestHunterInvitation(selectedHunters[index]!)"
                  >
                    Пригласить
                  </button>
                </div>
              </div>
            </div>

            <div
              v-if="inviteQueries.length > 0 || canAddInviteField"
              class="collection-modal__slot-row collection-modal__slot-row--actions"
            >
              <span class="collection-modal__field-number collection-modal__field-number--spacer" aria-hidden="true" />

              <div class="collection-modal__slot-content">
                <div class="collection-modal__invite-actions">
              <button
                v-if="canAddInviteField"
                type="button"
                class="collection-modal__add-field-btn"
                aria-label="Добавить поле для поиска"
                :disabled="canExtendCollection"
                @click="addInviteField"
              >
                +
              </button>

              <button
                type="button"
                class="collection-modal__invite-all-btn"
                :disabled="!canInviteAll"
                @click="requestInviteAll"
              >
                Пригласить всех
              </button>
                </div>
              </div>
            </div>
          </div>

          <footer class="collection-modal__footer">
            <div
              ref="footerStatsWrapRef"
              class="collection-modal__footer-stats-wrap"
            >
              <div class="collection-modal__footer-stats">
                <button
                  type="button"
                  class="collection-modal__footer-stat-link"
                  :class="{ 'collection-modal__footer-stat-link--active': activeStatsPanel === 'collected' }"
                  @click="toggleStatsPanel('collected')"
                >
                  Собрано {{ collectedCount }}/{{ slotsTotal }}
                </button>
                <button
                  type="button"
                  class="collection-modal__footer-stat-link"
                  :class="{ 'collection-modal__footer-stat-link--active': activeStatsPanel === 'pending' }"
                  @click="toggleStatsPanel('pending')"
                >
                  Не подтвержденные {{ pendingCount }}
                </button>
                <button
                  type="button"
                  class="collection-modal__footer-stat-link"
                  :class="{ 'collection-modal__footer-stat-link--active': activeStatsPanel === 'declined' }"
                  @click="toggleStatsPanel('declined')"
                >
                  Отклонили {{ declinedCount }}
                </button>
              </div>
            </div>

            <div class="collection-modal__footer-actions">
              <button
                type="button"
                class="collection-modal__btn collection-modal__btn--accent"
                :class="{ 'collection-modal__btn--timer': !canExtendCollection && Boolean(timerLabel) }"
                :disabled="!canExtendCollection"
                @click="requestCollectionExtension"
              >
                {{ canExtendCollection || !timerLabel ? 'Продлить сбор' : timerLabel }}
              </button>
              <button
                type="button"
                class="collection-modal__btn collection-modal__btn--danger"
                @click="requestCollectionCancellation"
              >
                Отменить сбор
              </button>
              <button
                type="button"
                class="collection-modal__btn"
                :disabled="!canFinishCollection"
                @click="requestCollectionFinish"
              >
                Завершить сбор
              </button>
              <button type="button" class="collection-modal__btn" disabled>
                Открытый сбор
              </button>
            </div>
          </footer>

          <div
            v-if="activeStatsPanel"
            ref="statsPanelRef"
            class="collection-modal__stats-panel"
            :style="statsPanelLayout"
          >
            <p
              v-if="!statsPanelParticipants.length"
              class="collection-modal__stats-panel-empty"
            >
              Список пуст
            </p>

            <template v-else>
              <div
                v-for="participant in statsPanelParticipants"
                :key="`stats-${participant.id ?? participant.name}`"
                class="collection-modal__stats-panel-item"
              >
                <div class="collection-modal__participant-info">
                  <div class="collection-modal__invite-input-selected-line">
                    <span class="collection-modal__participant-name">
                      {{ participant.name }}
                    </span>
                    <span
                      v-if="participant.email"
                      class="collection-modal__invite-input-email"
                    >
                      <svg
                        class="collection-modal__invite-input-email-icon"
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden="true"
                      >
                        <rect
                          x="2"
                          y="3.5"
                          width="12"
                          height="9"
                          rx="1"
                          stroke="currentColor"
                          stroke-width="1.2"
                        />
                        <path
                          d="M2.5 4.5 8 9l5.5-4.5"
                          stroke="currentColor"
                          stroke-width="1.2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                      {{ participant.email }}
                    </span>
                  </div>
                </div>

                <span
                  class="collection-modal__status-dot"
                  :class="`collection-modal__status-dot--${participant.status}`"
                  :aria-label="participantBadgeLabel(participant.status)"
                  :title="participantBadgeLabel(participant.status)"
                >
                  <svg
                    v-if="participant.status === 'confirmed'"
                    class="collection-modal__status-dot-icon"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <svg
                    v-else-if="participant.status === 'pending'"
                    class="collection-modal__status-dot-icon"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      cx="6"
                      cy="6"
                      r="4.5"
                      stroke="currentColor"
                      stroke-width="1.2"
                    />
                    <path
                      d="M6 3.5V6l1.8 1.2"
                      stroke="currentColor"
                      stroke-width="1.2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <svg
                    v-else
                    class="collection-modal__status-dot-icon"
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 2l6 6M8 2L2 8"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                    />
                  </svg>
                </span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.collection-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.collection-modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(17, 24, 39, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  cursor: pointer;
}

.collection-modal__card {
  position: relative;
  z-index: 1;
  width: min(100%, 1100px);
  padding: 28px 28px 24px;
  border: 1px solid var(--wh-gray-200);
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.collection-modal__header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 20px;
}

.collection-modal__title {
  margin: 0;
  padding-right: 96px;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.35;
  color: var(--wh-gray-900);
}

.collection-modal__link-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
  margin-top: 12px;
  padding: 10px 14px;
  border: 1px solid var(--wh-field-border);
  border-radius: 8px;
}

.collection-modal__link-label {
  flex-shrink: 0;
  font-size: 0.92rem;
  font-weight: 500;
  color: var(--wh-gray-900);
}

.collection-modal__link-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
}

.collection-modal__link-tooltip {
  display: none;
}

.collection-modal__link-url {
  margin: 0;
  min-width: 0;
  width: 100%;
  padding: 0;
  border: none;
  background: none;
  overflow-wrap: anywhere;
  word-break: break-all;
  text-align: left;
  font-size: 0.88rem;
  line-height: 1.4;
  color: #4aa3d9;
  cursor: pointer;
  transition: color 0.15s ease;
}

.collection-modal__link-url:hover {
  color: #2f8fc9;
  text-decoration: underline;
}

.collection-modal__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.collection-modal__slot-row {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  column-gap: 10px;
  align-items: start;
}

.collection-modal__slot-row > .collection-modal__field-number {
  align-self: start;
  justify-self: center;
  margin-top: 10px;
}

.collection-modal__slot-content {
  min-width: 0;
}

.collection-modal__field-number--spacer {
  visibility: hidden;
  pointer-events: none;
  margin-top: 0;
}

.collection-modal__participant {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  min-height: 48px;
  padding: 10px 14px;
  border-radius: 8px;
  background: var(--wh-gray-100);
}

.collection-modal__field-number {
  flex-shrink: 0;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--wh-field-border);
  border-radius: 6px;
  color: var(--wh-black-text);
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1;
  text-align: center;
}

.collection-modal__invite-input-wrap {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
}

.collection-modal__participant-info {
  flex: 1 1 auto;
  min-width: min(100%, max-content);
}

.collection-modal__participant-name {
  flex-shrink: 0;
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1.3;
  color: var(--wh-gray-900);
}

.collection-modal__badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
}

.collection-modal__badge--confirmed {
  background: var(--wh-green);
  color: var(--wh-white);
}

.collection-modal__badge-icon {
  flex-shrink: 0;
}

.collection-modal__badge--pending {
  background: var(--wh-gray-600);
  color: var(--wh-white);
}

.collection-modal__badge--declined {
  background: var(--wh-field-error);
  color: var(--wh-white);
}

.collection-modal__invite-input {
  width: 100%;
  min-height: 48px;
  padding: 12px 14px;
  border: 1px solid var(--wh-field-border);
  border-radius: 8px;
  background: var(--wh-white);
  color: var(--wh-gray-900);
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.collection-modal__invite-input::placeholder {
  color: var(--wh-gray-400);
}

.collection-modal__invite-input:focus {
  border-color: var(--wh-field-border-active);
  box-shadow: 0 0 0 3px var(--wh-field-focus-ring);
}

.collection-modal__invite-input:disabled {
  background: var(--wh-gray-100);
  color: var(--wh-gray-500);
  cursor: not-allowed;
  pointer-events: none;
}

.collection-modal__invite-input--declined {
  background: var(--wh-white);
  color: var(--wh-gray-900);
  cursor: default;
}

.collection-modal__invite-input--with-clear {
  padding-right: 96px;
}

.collection-modal__invite-input--selected {
  display: flex;
  align-items: center;
  min-height: 48px;
  padding: 12px 14px;
}

.collection-modal__invite-input-selected-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  min-width: 0;
}

.collection-modal__invite-input-name {
  flex-shrink: 0;
  font-size: 0.95rem;
  line-height: 1.3;
  color: var(--wh-gray-900);
}

.collection-modal__invite-input-email {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  font-size: 0.75rem;
  line-height: 1.3;
  color: var(--wh-gray-600);
}

.collection-modal__invite-input-email-icon {
  flex-shrink: 0;
}

.collection-modal__invite-input-box {
  position: relative;
}

.collection-modal__invite-input-clear {
  position: absolute;
  top: 50%;
  right: 14px;
  z-index: 2;
  display: flex;
  align-items: center;
  height: min(48px, 100%);
  padding: 0;
  border: none;
  background: none;
  color: var(--wh-gray-600);
  font-size: 0.88rem;
  font-weight: 500;
  line-height: 1.2;
  cursor: pointer;
  transform: translateY(-50%);
  transition: color 0.15s ease;
}

.collection-modal__invite-input-clear:hover {
  color: var(--wh-orange-500);
}

.collection-modal__invite-input-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  z-index: 4;
  padding: 6px 10px;
  border-radius: 6px;
  background: var(--wh-orange-500);
  color: var(--wh-white);
  font-size: 0.82rem;
  font-weight: 500;
  line-height: 1.3;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transform: translateX(-50%);
  transition: opacity 0.15s ease, visibility 0.15s ease;
}

.collection-modal__invite-input-wrap--timer-expired:hover .collection-modal__invite-input-tooltip {
  opacity: 1;
  visibility: visible;
}

.collection-modal__invite-input-wrap--timer-expired {
  cursor: not-allowed;
}

.collection-modal__invite-control {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.collection-modal__selected-email {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  color: var(--wh-gray-600);
  font-size: 0.75rem;
}

.collection-modal__declined-label {
  flex-shrink: 0;
  color: var(--wh-field-error);
  font-weight: 600;
  white-space: nowrap;
}

.collection-modal__search-result:hover .collection-modal__declined-label {
  color: var(--wh-white);
}

.collection-modal__invite-button {
  flex: 0 0 auto;
  min-height: 48px;
  padding: 12px 14px;
  border: 1px solid var(--wh-field-border);
  border-radius: 8px;
  background: var(--wh-white);
  color: var(--wh-orange-500);
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
}

.collection-modal__invite-button:hover {
  border-color: #e8883a;
  background: #e8883a;
  color: var(--wh-white);
}

.collection-modal__add-field-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  min-height: 48px;
  padding: 0;
  border: 1px dashed var(--wh-field-border);
  border-radius: 8px;
  background: var(--wh-white);
  color: var(--wh-gray-600);
  font-size: 1.5rem;
  font-weight: 400;
  line-height: 1;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.collection-modal__invite-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 4px;
}

.collection-modal__invite-all-btn {
  min-height: 48px;
  margin-left: auto;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  background: var(--wh-orange-500);
  color: var(--wh-white);
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  transition: background 0.15s ease;
}

.collection-modal__invite-all-btn:hover:not(:disabled) {
  background: var(--wh-orange-600);
}

.collection-modal__invite-all-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.collection-modal__add-field-btn:hover:not(:disabled) {
  border-color: #e8883a;
  background: #fff7ef;
  color: #e8883a;
}

.collection-modal__add-field-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.collection-modal__search-results {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 10;
  width: 100%;
  max-height: 230px;
  border: 1px solid var(--wh-field-border);
  border-radius: 4px;
  background: var(--wh-white);
  overflow-y: auto;
}

.collection-modal__search-result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--wh-gray-200);
  color: var(--wh-gray-900);
  font-size: 0.82rem;
  line-height: 1.35;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.collection-modal__search-result-info {
  min-width: 0;
}

.collection-modal__search-result:hover {
  background-color: #e8883a;
  color: var(--wh-white);
}

.collection-modal__search-result:last-child {
  border-bottom: none;
}

.collection-modal__search-result-email {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 3px;
  color: var(--wh-gray-600);
  font-size: 0.75rem;
}

.collection-modal__search-result:hover .collection-modal__search-result-email {
  color: var(--wh-white);
}

.collection-modal__search-message {
  padding: 12px;
  color: var(--wh-gray-600);
  font-size: 0.82rem;
}

.collection-modal__search-message--error {
  color: var(--wh-field-error);
}

.collection-modal__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px 10px;
}

.collection-modal__footer-stats-wrap {
  position: relative;
}

.collection-modal__footer-stats {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  padding: 10px 14px;
  border: 1px solid var(--wh-field-border);
  border-radius: 8px;
  color: var(--wh-gray-900);
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.2;
}

.collection-modal__footer-stat-link {
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  font: inherit;
  line-height: inherit;
  cursor: pointer;
  transition: color 0.15s ease;
}

.collection-modal__footer-stat-link:hover,
.collection-modal__footer-stat-link--active {
  color: var(--wh-orange-500);
}

.collection-modal__stats-panel {
  position: absolute;
  z-index: 3;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: auto;
  padding: 12px 14px;
  border: 1px solid var(--wh-orange-500);
  border-radius: 8px;
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
}

.collection-modal__stats-panel-empty {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  margin: 0;
  color: var(--wh-gray-600);
  font-size: 0.82rem;
  text-align: center;
}

.collection-modal__stats-panel-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0;
}

.collection-modal__stats-panel-item + .collection-modal__stats-panel-item {
  margin-top: 8px;
}

.collection-modal__status-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
}

.collection-modal__status-dot-icon {
  flex-shrink: 0;
}

.collection-modal__status-dot--confirmed {
  background: var(--wh-green);
  color: var(--wh-white);
}

.collection-modal__status-dot--pending {
  background: var(--wh-gray-400);
  color: var(--wh-white);
}

.collection-modal__status-dot--declined {
  background: var(--wh-field-error);
  color: var(--wh-white);
}

.collection-modal__footer-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  margin-left: auto;
}

.collection-modal__btn {
  min-height: 40px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  background: var(--wh-green);
  color: var(--wh-white);
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  transition: background 0.15s ease;
}

.collection-modal__btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--wh-green) 78%, white);
}

.collection-modal__btn--accent {
  background: var(--wh-green);
}

.collection-modal__btn--accent:hover:not(:disabled) {
  background: color-mix(in srgb, var(--wh-green) 78%, white);
}

.collection-modal__btn--timer {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.collection-modal__btn--danger {
  background: var(--wh-field-error);
}

.collection-modal__btn--danger:hover:not(:disabled) {
  background: color-mix(in srgb, var(--wh-field-error) 78%, black);
}

.collection-modal__btn:disabled {
  background: var(--wh-gray-400);
  color: var(--wh-gray-600);
  cursor: not-allowed;
  opacity: 0.7;
}

.collection-modal-enter-active,
.collection-modal-leave-active {
  transition: visibility 0.2s linear;
}

.collection-modal-enter-from,
.collection-modal-leave-to {
  visibility: visible;
}

.collection-modal-enter-from .collection-modal__card,
.collection-modal-leave-to .collection-modal__card {
  opacity: 0;
  transform: translateY(8px);
}

@media (--wh-tablet) {
  .collection-modal__card {
    padding: 22px 18px 18px;
  }

  .collection-modal__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .collection-modal__title {
    padding-right: 88px;
  }

  .collection-modal__footer {
    flex-direction: column;
    align-items: stretch;
  }

  .collection-modal__footer-actions {
    justify-content: stretch;
    margin-left: 0;
  }

  .collection-modal__btn {
    flex: 1 1 calc(50% - 10px);
  }
}

@media (--wh-mobile) {
  .collection-modal__header {
    align-items: stretch;
  }

  .collection-modal__link-label {
    display: none;
  }

  .collection-modal__link-row {
    align-self: stretch;
  }

  .collection-modal__link-tooltip {
    display: block;
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    z-index: 1;
    padding: 6px 10px;
    border-radius: 6px;
    background: var(--wh-gray-900);
    color: var(--wh-white);
    font-size: 0.82rem;
    font-weight: 500;
    line-height: 1.3;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    visibility: hidden;
    transform: translateX(-50%);
    transition: opacity 0.15s ease, visibility 0.15s ease;
  }

  .collection-modal__link-wrap:hover .collection-modal__link-tooltip,
  .collection-modal__link-wrap:focus-within .collection-modal__link-tooltip {
    opacity: 1;
    visibility: visible;
  }

  .collection-modal__btn {
    flex: 1 1 100%;
  }
}
</style>
