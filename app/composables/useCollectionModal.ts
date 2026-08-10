import type {
  BookingHistoryItem,
  CollectionModalState,
  CollectionParticipant,
} from '~/types/booking'

const isOpen = ref(false)
const isContentHidden = ref(false)
const state = ref<CollectionModalState | null>(null)

const MOCK_PARTICIPANTS: CollectionParticipant[] = [
  {
    id: 1,
    name: 'Анастасия Сластнова',
    email: 'lilli-5335@ya.ru',
    status: 'confirmed',
  },
  {
    id: 2,
    name: 'Иван Петров',
    email: 'ivan.petrov@example.com',
    status: 'confirmed',
  },
  {
    id: 3,
    name: 'Сергей Козлов',
    email: 's.kozlov@example.com',
    status: 'confirmed',
  },
]

function parseCollected(collected?: string): { current: number, total: number } | null {
  if (!collected) return null

  const match = collected.match(/(\d+)\s*\/\s*(\d+)/)
  if (!match) return null

  const current = Number(match[1])
  const total = Number(match[2])

  if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 0) {
    return null
  }

  return { current, total }
}

function buildMockState(booking: BookingHistoryItem): CollectionModalState {
  const collected = parseCollected(booking.status.collected)
  const slotsTotal = collected?.total ?? booking.hunt?.hunters ?? 3
  const confirmedCount = Math.min(
    collected?.current ?? 1,
    slotsTotal,
    MOCK_PARTICIPANTS.length,
  )
  const invitedParticipants: CollectionParticipant[] = (booking.collectionInvitations ?? [])
    .map(invitation => ({
      id: invitation.hunterId,
      name: invitation.name,
      email: invitation.email,
      status: invitation.isAccepted ? 'confirmed' : 'pending',
    }))

  return {
    bookingId: booking.id,
    bookingCode: booking.code,
    bookingNumber: booking.number,
    collectionUrl: booking.collectionUrl,
    timerEndAt: booking.status.timerEndAt,
    timerExpired: booking.status.timer === '00 мин 00 сек',
    slotsTotal,
    participants: invitedParticipants.length
      ? invitedParticipants
      : MOCK_PARTICIPANTS.slice(0, confirmedCount),
  }
}

export function useCollectionModal() {
  function open(booking: BookingHistoryItem) {
    state.value = buildMockState(booking)
    isContentHidden.value = false
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
    isContentHidden.value = false
    state.value = null
  }

  function hide() {
    isContentHidden.value = true
  }

  function reopen() {
    if (state.value) {
      isContentHidden.value = false
      isOpen.value = true
    }
  }

  function addParticipant(participant: CollectionParticipant) {
    if (!state.value) return

    const participantIndex = state.value.participants.findIndex(item => item.id === participant.id)

    if (participantIndex >= 0) {
      state.value.participants[participantIndex] = participant
      return
    }

    state.value.participants.push(participant)
  }

  return {
    isOpen: readonly(isOpen),
    isContentHidden: readonly(isContentHidden),
    state: readonly(state),
    open,
    close,
    hide,
    reopen,
    addParticipant,
  }
}
