import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

export interface BookingStatusUpdatedPayload {
  booking_id: number
  code: string
  status: string
  status_label: string
}

export interface BookingGatheringCompletedPayload {
  booking_id: number
  code: string
  status: string
  status_label: string
  removed_hunter_ids: number[]
  removed_invitation_ids: number[]
}

export type BookingInvitationAction = 'accepted' | 'declined'

export interface BookingInvitationUpdatedPayload {
  booking_id: number
  code: string
  invitation_id: number
  hunter_id: number
  action: BookingInvitationAction
  status: BookingInvitationAction
  status_label: string
  is_accepted: boolean
}

export function useBookingStatusChannel(
  onStatusUpdated: (payload: BookingStatusUpdatedPayload) => void,
  onInvitationUpdated?: (payload: BookingInvitationUpdatedPayload) => void,
  onGatheringCompleted?: (payload: BookingGatheringCompletedPayload) => void,
) {
  const config = useRuntimeConfig()
  const { authorizationHeader } = useAuthToken()
  const desiredBookingIds = new Set<number>()
  const subscribedBookingIds = new Set<number>()
  const gatheringListenedIds = new Set<number>()
  let gatheringBookingId: number | null = null
  let echo: Echo<'reverb'> | null = null

  function createEcho(): Echo<'reverb'> | null {
    if (!import.meta.client || echo) {
      return echo
    }

    const key = String(config.public.reverbKey || '')
    const authHeader = authorizationHeader.value

    if (!key || !authHeader) {
      return null
    }

    const scheme = String(config.public.reverbScheme || 'http')
    const port = Number(config.public.reverbPort || (scheme === 'https' ? 443 : 80))

    echo = new Echo<'reverb'>({
      broadcaster: 'reverb',
      Pusher,
      key,
      wsHost: String(config.public.reverbHost),
      wsPort: port,
      wssPort: port,
      forceTLS: scheme === 'https',
      enabledTransports: ['ws', 'wss'],
      authEndpoint: String(config.public.broadcastAuthUrl),
      auth: {
        headers: {
          Accept: 'application/json',
          Authorization: authHeader,
        },
      },
    })

    return echo
  }

  function activeBookingIds() {
    const ids = new Set(desiredBookingIds)

    if (gatheringBookingId != null) {
      ids.add(gatheringBookingId)
    }

    return ids
  }

  function bindGatheringListener(bookingId: number) {
    if (!echo || !onGatheringCompleted) {
      return
    }

    const shouldListen = gatheringBookingId === bookingId
    const isListening = gatheringListenedIds.has(bookingId)

    if (shouldListen === isListening) {
      return
    }

    const channel = echo.private(`bookings.${bookingId}`)

    if (shouldListen) {
      channel.listen('.booking.gathering.completed', onGatheringCompleted)
      gatheringListenedIds.add(bookingId)
      return
    }

    channel.stopListening('.booking.gathering.completed', onGatheringCompleted)
    gatheringListenedIds.delete(bookingId)
  }

  function syncSubscriptions(bookingIds: number[]) {
    desiredBookingIds.clear()
    bookingIds.forEach(id => desiredBookingIds.add(id))

    const connection = createEcho()

    if (!connection) {
      return
    }

    const activeIds = activeBookingIds()

    for (const bookingId of [...subscribedBookingIds]) {
      if (!activeIds.has(bookingId)) {
        gatheringListenedIds.delete(bookingId)
        connection.leave(`bookings.${bookingId}`)
        subscribedBookingIds.delete(bookingId)
      }
    }

    for (const bookingId of activeIds) {
      if (!subscribedBookingIds.has(bookingId)) {
        const channel = connection
          .private(`bookings.${bookingId}`)
          .listen('.booking.status.updated', onStatusUpdated)

        if (onInvitationUpdated) {
          channel.listen('.booking.invitation.updated', onInvitationUpdated)
        }

        subscribedBookingIds.add(bookingId)
      }

      bindGatheringListener(bookingId)
    }
  }

  function setGatheringSubscription(bookingId: number | null) {
    if (gatheringBookingId === bookingId) {
      return
    }

    gatheringBookingId = bookingId
    syncSubscriptions([...desiredBookingIds])
  }

  function disconnect() {
    if (echo) {
      try {
        for (const bookingId of subscribedBookingIds) {
          echo.leave(`bookings.${bookingId}`)
        }

        echo.disconnect()
      }
      catch {
      }

      echo = null
    }

    subscribedBookingIds.clear()
    gatheringListenedIds.clear()
  }

  watch(authorizationHeader, () => {
    disconnect()
    syncSubscriptions([...desiredBookingIds])
  })

  onBeforeUnmount(disconnect)

  return {
    syncSubscriptions,
    setGatheringSubscription,
    disconnect,
  }
}
