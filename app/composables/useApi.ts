import {
  useApiClient,
  useAuthApi,
  useConfigApi,
  useHomeApi,
  useLocationApi,
  useHotelsApi,
  useAnimalsApi,
  useBookingsApi,
  useReviewsApi,
  useRolesApi,
  useSearchApi,
  useServicesApi,
  useNewsletterApi,
  useUserApi,
  useWeaponsApi,
} from '~/api'

export function useApi() {
  const client = useApiClient()
  const config = useConfigApi()
  const home = useHomeApi()
  const auth = useAuthApi()
  const search = useSearchApi()
  const location = useLocationApi()
  const hotels = useHotelsApi()
  const animals = useAnimalsApi()
  const bookings = useBookingsApi()
  const roles = useRolesApi()
  const reviews = useReviewsApi()
  const services = useServicesApi()
  const newsletter = useNewsletterApi()
  const user = useUserApi()
  const weapons = useWeaponsApi()

  return {
    ...client,
    config,
    home,
    auth,
    search,
    location,
    hotels,
    animals,
    bookings,
    roles,
    reviews,
    services,
    newsletter,
    user,
    weapons,
  }
}
