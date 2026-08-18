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
const declinedHunterKeys = new Set<string>()

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
  if (
    invitation.isDeclined
    || invitation.declinedAt
    || isDeclinedInvitationStatus(invitation.status)
    || isDeclinedInvitationStatus(invitation.action)
  ) {
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
  if (
    payload.invitation_id
    && participant.invitationId != null
    && Number(participant.invitationId) === Number(payload.invitation_id)
  ) {
    return true
  }

  if (
    payload.hunter_id
    && participant.id != null
    && Number(participant.id) === Number(payload.hunter_id)
  ) {
    return true
  }

  return false
}

function payloadMatchesOpenCollection(payload: BookingInvitationUpdatedPayload) {
  if (!state.value) return false

  return state.value.bookingId === payload.booking_id
    || Number(state.value.bookingNumber) === Number(payload.booking_id)
    || Boolean(payload.code && state.value.bookingCode === payload.code)
}

function declinedHunterKey(bookingId: number, hunterId: number) {
  return `${bookingId}:${hunterId}`
}

function rememberDeclinedHunter(bookingId: number, hunterId: number) {
  if (!bookingId || !hunterId) return
  declinedHunterKeys.add(declinedHunterKey(bookingId, hunterId))
}

function forgetDeclinedHunter(bookingId: number, hunterId: number) {
  if (!bookingId || !hunterId) return
  declinedHunterKeys.delete(declinedHunterKey(bookingId, hunterId))
}

function isRememberedDeclinedHunter(
  bookingId: number,
  bookingNumber: string,
  hunterId: number | undefined,
) {
  if (!hunterId) return false

  return declinedHunterKeys.has(declinedHunterKey(bookingId, hunterId))
    || declinedHunterKeys.has(declinedHunterKey(Number(bookingNumber), hunterId))
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
    .map((invitation) => {
      const declined = isRememberedDeclinedHunter(
        booking.id,
        booking.number,
        invitation.hunterId,
      )

      return {
        id: invitation.hunterId,
        invitationId: invitation.invitationId,
        name: invitation.name,
        email: invitation.email,
        status: declined ? 'declined' : participantStatusFromInvitation(invitation),
      }
    })

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

    if (participant.id) {
      forgetDeclinedHunter(state.value.bookingId, participant.id)
      forgetDeclinedHunter(Number(state.value.bookingNumber), participant.id)
    }

    const participantIndex = state.value.participants.findIndex(item => item.id === participant.id)

    if (participantIndex >= 0) {
      state.value.participants[participantIndex] = participant
      return
    }

    state.value.participants.push(participant)
  }

  function applyInvitationUpdate(payload: BookingInvitationUpdatedPayload) {
    const nextStatus = participantStatusFromPayload(payload)

    if (nextStatus === 'declined' && payload.hunter_id) {
      rememberDeclinedHunter(payload.booking_id, payload.hunter_id)
      if (state.value) {
        rememberDeclinedHunter(state.value.bookingId, payload.hunter_id)
        rememberDeclinedHunter(Number(state.value.bookingNumber), payload.hunter_id)
      }
    }

    if (!state.value || !payloadMatchesOpenCollection(payload)) {
      return
    }

    const collection = state.value
    const participantIndex = collection.participants.findIndex(participant =>
      invitationMatchesPayload(participant, payload),
    )

    if (participantIndex < 0) {
      return
    }

    const current = collection.participants[participantIndex]
    if (!current) {
      return
    }

    state.value = {
      ...collection,
      participants: collection.participants.map((participant, index) =>
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

  function isDeclinedHunter(hunterId: number) {
    if (!hunterId || !state.value) return false

    const declinedInParticipants = state.value.participants.some(
      participant => participant.id === hunterId && participant.status === 'declined',
    )

    if (declinedInParticipants) return true

    return isRememberedDeclinedHunter(
      state.value.bookingId,
      state.value.bookingNumber,
      hunterId,
    )
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
    isDeclinedHunter,
  }
}
