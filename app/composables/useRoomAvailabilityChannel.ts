import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

export type RoomAvailabilityAction = 'created' | 'cancelled' | 'status_updated'

export interface RoomAvailabilityUpdatedPayload {
  hotel_id: number
  booking_id: number
  action: RoomAvailabilityAction
  status: string
  status_name: string
  start_date: string
  end_date: string
  room_ids: number[]
}

export function useRoomAvailabilityChannel(
  onAvailabilityUpdated: (payload: RoomAvailabilityUpdatedPayload) => void,
) {
  const config = useRuntimeConfig()
  const { authorizationHeader } = useAuthToken()
  let echo: Echo<'reverb'> | null = null
  let desiredHotelId: number | null = null
  let subscribedHotelId: number | null = null

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

  function subscribe(hotelId: number | null | undefined) {
    desiredHotelId = hotelId ?? null

    if (subscribedHotelId === desiredHotelId) {
      return
    }

    const connection = createEcho()

    if (!connection) {
      return
    }

    if (subscribedHotelId) {
      connection.leave(`hotel.${subscribedHotelId}.room-availability`)
      subscribedHotelId = null
    }

    if (!desiredHotelId) {
      return
    }

    connection
      .private(`hotel.${desiredHotelId}.room-availability`)
      .listen('.room.availability.updated', onAvailabilityUpdated)

    subscribedHotelId = desiredHotelId
  }

  function disconnect() {
    if (echo) {
      try {
        if (subscribedHotelId) {
          echo.leave(`hotel.${subscribedHotelId}.room-availability`)
        }

        echo.disconnect()
      }
      catch {
        // Обрыв WS не должен блокировать уход со страницы / выход.
      }

      echo = null
    }

    subscribedHotelId = null
  }

  watch(authorizationHeader, () => {
    disconnect()
    subscribe(desiredHotelId)
  })

  onBeforeUnmount(disconnect)

  return {
    subscribe,
    disconnect,
  }
}
