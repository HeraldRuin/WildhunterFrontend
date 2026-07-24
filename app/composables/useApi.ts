import {
  useApiClient,
  useAuthApi,
  useConfigApi,
  useHomeApi,
  useLocationApi,
  useHotelsApi,
  useAnimalsApi,
  useReviewsApi,
  useRolesApi,
  useSearchApi,
  useServicesApi,
  useNewsletterApi,
  useUserApi,
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
  const roles = useRolesApi()
  const reviews = useReviewsApi()
  const services = useServicesApi()
  const newsletter = useNewsletterApi()
  const user = useUserApi()

  return {
    ...client,
    config,
    home,
    auth,
    search,
    location,
    hotels,
    animals,
    roles,
    reviews,
    services,
    newsletter,
    user,
  }
}
