import type { BookingInvitationUpdatedPayload } from '~/composables/useBookingStatusChannel'
import type {
  BookingHistoryItem,
  BookingInvitationParticipant,
  CollectionModalState,
  CollectionParticipant,
  CollectionParticipantStatus,
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

function invitationStatusRaw(status: string | number | undefined): string {
  return String(status ?? '').trim().toLowerCase()
}

function isDeclinedInvitationStatus(status: string | number | undefined): boolean {
  const raw = invitationStatusRaw(status)

  return raw === '1'
    || raw === 'declined'
    || raw === 'rejected'
    || raw.includes('declined')
    || raw.includes('отклон')
}

function isAcceptedInvitationStatus(status: string | number | undefined): boolean {
  const raw = invitationStatusRaw(status)

  return raw === 'accepted' || raw === 'confirmed'
}

function participantStatusFromInvitation(
  invitation: BookingInvitationParticipant,
): CollectionParticipantStatus {
  if (isDeclinedInvitationStatus(invitation.status)) {
    return 'declined'
  }

  if (invitation.isAccepted || isAcceptedInvitationStatus(invitation.status)) {
    return 'confirmed'
  }

  return 'pending'
}

function participantStatusFromPayload(
  payload: BookingInvitationUpdatedPayload,
): CollectionParticipantStatus {
  if (payload.action === 'declined' || isDeclinedInvitationStatus(payload.status)) {
    return 'declined'
  }

  switch (payload.action) {
    case 'accepted':
      return 'confirmed'
    case 'declined':
      return 'declined'
    default: {
      const _exhaustive: never = payload.action
      return _exhaustive
    }
  }
}

function invitationMatchesPayload(
  participant: CollectionParticipant,
  payload: BookingInvitationUpdatedPayload,
) {
  if (payload.invitation_id && participant.invitationId === payload.invitation_id) {
    return true
  }

  if (payload.hunter_id && participant.id === payload.hunter_id) {
    return true
  }

  return false
}

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
  const slotsTotal = booking.hunt?.hunters && booking.hunt.hunters > 0
    ? booking.hunt.hunters
    : (collected?.total ?? 3)
  const confirmedCount = Math.min(
    collected?.current ?? 1,
    slotsTotal,
    MOCK_PARTICIPANTS.length,
  )
  const invitedParticipants: CollectionParticipant[] = (booking.collectionInvitations ?? [])
    .map(invitation => ({
      id: invitation.hunterId,
      invitationId: invitation.invitationId,
      name: invitation.name,
      email: invitation.email,
      status: participantStatusFromInvitation(invitation),
    }))
    .filter(participant => participant.status !== 'declined')

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

  function applyInvitationUpdate(payload: BookingInvitationUpdatedPayload) {
    if (!state.value || state.value.bookingId !== payload.booking_id) {
      return
    }

    const participantIndex = state.value.participants.findIndex(participant =>
      invitationMatchesPayload(participant, payload),
    )

    if (participantIndex < 0) {
      return
    }

    const current = state.value.participants[participantIndex]
    if (!current) {
      return
    }

    const nextStatus = participantStatusFromPayload(payload)

    if (nextStatus === 'declined') {
      state.value = {
        ...state.value,
        participants: state.value.participants.filter((_, index) => index !== participantIndex),
      }
      return
    }

    state.value = {
      ...state.value,
      participants: state.value.participants.map((participant, index) =>
        index === participantIndex
          ? {
              ...participant,
              invitationId: current.invitationId ?? payload.invitation_id,
              status: nextStatus,
            }
          : participant,
      ),
    }
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
    applyInvitationUpdate,
  }
}
