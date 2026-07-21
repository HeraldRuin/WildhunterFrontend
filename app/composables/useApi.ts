import {
  useApiClient,
  useAuthApi,
  useConfigApi,
  useHomeApi,
  useLocationApi,
  useAnimalsApi,
  useReviewsApi,
  useRolesApi,
  useSearchApi,
  useServicesApi,
} from '~/api'

export function useApi() {
  const client = useApiClient()
  const config = useConfigApi()
  const home = useHomeApi()
  const auth = useAuthApi()
  const search = useSearchApi()
  const location = useLocationApi()
  const animals = useAnimalsApi()
  const roles = useRolesApi()
  const reviews = useReviewsApi()
  const services = useServicesApi()

  return {
    ...client,
    config,
    home,
    auth,
    search,
    location,
    animals,
    roles,
    reviews,
    services,
  }
}
