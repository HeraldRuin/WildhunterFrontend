import {
  useApiClient,
  useAuthApi,
  useConfigApi,
  useHomeApi,
  useLocationApi,
  useHotelsApi,
  useMediaApi,
  useRoomsApi,
  useAnimalsApi,
  useBookingsApi,
  useReviewsApi,
  useRolesApi,
  useSearchApi,
  useServicesApi,
  useNewsletterApi,
  useContactApi,
  useUserApi,
  useWeaponsApi,
  useNotificationsApi,
  useSettingsApi,
} from '~/api'

export function useApi() {
  const client = useApiClient()
  const config = useConfigApi()
  const home = useHomeApi()
  const auth = useAuthApi()
  const search = useSearchApi()
  const location = useLocationApi()
  const hotels = useHotelsApi()
  const media = useMediaApi()
  const rooms = useRoomsApi()
  const animals = useAnimalsApi()
  const bookings = useBookingsApi()
  const roles = useRolesApi()
  const reviews = useReviewsApi()
  const services = useServicesApi()
  const newsletter = useNewsletterApi()
  const contact = useContactApi()
  const user = useUserApi()
  const weapons = useWeaponsApi()
  const notifications = useNotificationsApi()
  const settings = useSettingsApi()

  return {
    ...client,
    config,
    home,
    auth,
    search,
    location,
    hotels,
    media,
    rooms,
    animals,
    bookings,
    roles,
    reviews,
    services,
    newsletter,
    contact,
    user,
    weapons,
    notifications,
    settings,
  }
}
