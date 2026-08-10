import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

export interface BookingHistoryUpdatedPayload {
  action: 'added' | 'removed'
}

export function useBookingHistoryChannel(
  onHistoryUpdated: (payload: BookingHistoryUpdatedPayload) => void,
) {
  const config = useRuntimeConfig()
  const { authorizationHeader } = useAuthToken()
  let echo: Echo<'reverb'> | null = null
  let desiredUserId: number | null = null
  let subscribedUserId: number | null = null

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

  function subscribe(userId: number | null | undefined) {
    desiredUserId = userId ?? null

    if (subscribedUserId === desiredUserId) {
      return
    }

    const connection = createEcho()

    if (!connection) {
      return
    }

    if (subscribedUserId) {
      connection.leave(`booking-history.${subscribedUserId}`)
      subscribedUserId = null
    }

    if (!desiredUserId) {
      return
    }

    connection
      .private(`booking-history.${desiredUserId}`)
      .listen('.booking.history.updated', onHistoryUpdated)

    subscribedUserId = desiredUserId
  }

  function disconnect() {
    if (echo) {
      if (subscribedUserId) {
        echo.leave(`booking-history.${subscribedUserId}`)
      }

      echo.disconnect()
      echo = null
    }

    subscribedUserId = null
  }

  watch(authorizationHeader, () => {
    disconnect()
    subscribe(desiredUserId)
  })

  onBeforeUnmount(disconnect)

  return {
    subscribe,
    disconnect,
  }
}
