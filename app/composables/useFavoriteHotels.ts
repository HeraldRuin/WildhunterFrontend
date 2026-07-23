export function useFavoriteHotels() {
  const { services } = useApi()
  const { isAuthenticated } = useAuth()

  const favoriteHotelIds = useState<number[]>('favorite-hotel-ids', () => [])
  const isLoading = useState('favorite-hotels-loading', () => false)
  const isLoaded = useState('favorite-hotels-loaded', () => false)

  async function loadFavorites() {
    if (!import.meta.client || !isAuthenticated.value) {
      favoriteHotelIds.value = []
      isLoaded.value = false
      return
    }

    if (isLoading.value) {
      return
    }

    isLoading.value = true

    try {
      const response = await services.getFavorites('hotel')

      favoriteHotelIds.value = response.success && Array.isArray(response.data)
        ? response.data.map(item => item.service_id)
        : []
      isLoaded.value = true
    } catch {
      favoriteHotelIds.value = []
      isLoaded.value = false
    } finally {
      isLoading.value = false
    }
  }

  function isFavorite(hotelId: number) {
    return favoriteHotelIds.value.includes(hotelId)
  }

  function setFavorite(hotelId: number, value: boolean) {
    if (value) {
      if (!favoriteHotelIds.value.includes(hotelId)) {
        favoriteHotelIds.value = [...favoriteHotelIds.value, hotelId]
      }
      return
    }

    favoriteHotelIds.value = favoriteHotelIds.value.filter(id => id !== hotelId)
  }

  if (import.meta.client) {
    watch(isAuthenticated, (authenticated) => {
      isLoaded.value = false

      if (authenticated) {
        loadFavorites()
        return
      }

      favoriteHotelIds.value = []
    }, { immediate: true })
  }

  return {
    favoriteHotelIds,
    isLoading,
    isLoaded,
    isFavorite,
    setFavorite,
    loadFavorites,
  }
}
