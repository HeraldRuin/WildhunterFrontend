import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

export interface BookingStatusUpdatedPayload {
  booking_id: number
  code: string
  status: string
  status_label: string
}

export function useBookingStatusChannel(
  onStatusUpdated: (payload: BookingStatusUpdatedPayload) => void,
) {
  const config = useRuntimeConfig()
  const { authorizationHeader } = useAuthToken()
  const desiredBookingIds = new Set<number>()
  const subscribedBookingIds = new Set<number>()
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

  function syncSubscriptions(bookingIds: number[]) {
    desiredBookingIds.clear()
    bookingIds.forEach(id => desiredBookingIds.add(id))

    const connection = createEcho()

    if (!connection) {
      return
    }

    for (const bookingId of subscribedBookingIds) {
      if (!desiredBookingIds.has(bookingId)) {
        connection.leave(`bookings.${bookingId}`)
        subscribedBookingIds.delete(bookingId)
      }
    }

    for (const bookingId of desiredBookingIds) {
      if (subscribedBookingIds.has(bookingId)) {
        continue
      }

      connection
        .private(`bookings.${bookingId}`)
        .listen('.booking.status.updated', onStatusUpdated)

      subscribedBookingIds.add(bookingId)
    }
  }

  function disconnect() {
    if (echo) {
      for (const bookingId of subscribedBookingIds) {
        echo.leave(`bookings.${bookingId}`)
      }

      echo.disconnect()
      echo = null
    }

    subscribedBookingIds.clear()
  }

  watch(authorizationHeader, () => {
    disconnect()
    syncSubscriptions([...desiredBookingIds])
  })

  onBeforeUnmount(disconnect)

  return {
    syncSubscriptions,
    disconnect,
  }
}
