import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

interface BookingServicesUpdatedPayload {
  booking_id: number
  code: string
}

export function useBookingServicesChannel(
  bookingId: Ref<number | null>,
  onUpdated: (payload: BookingServicesUpdatedPayload) => void,
) {
  const config = useRuntimeConfig()
  const { authorizationHeader } = useAuthToken()
  let echo: Echo<'reverb'> | null = null
  let subscribedBookingId: number | null = null

  function disconnect() {
    if (!echo) {
      subscribedBookingId = null
      return
    }

    try {
      if (subscribedBookingId != null) {
        echo.leave(`bookings.${subscribedBookingId}`)
      }

      echo.disconnect()
    }
    catch {
    }

    echo = null
    subscribedBookingId = null
  }

  function connect(id: number) {
    if (!import.meta.client) {
      return
    }

    const key = String(config.public.reverbKey || '')
    const authHeader = authorizationHeader.value

    if (!key || !authHeader) {
      return
    }

    if (echo && subscribedBookingId === id) {
      return
    }

    disconnect()

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

    echo
      .private(`bookings.${id}`)
      .listen('.booking.services.updated', onUpdated)

    subscribedBookingId = id
  }

  watch([bookingId, authorizationHeader], () => {
    const id = bookingId.value

    if (id == null) {
      disconnect()
      return
    }

    connect(id)
  }, { immediate: true })

  onBeforeUnmount(disconnect)
}
