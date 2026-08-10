export { useApiClient } from './client'
export { useConfigApi } from './config'
export { useHomeApi } from './home'
export { useAuthApi } from './auth'
export type {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  PasswordEmailPayload,
  PasswordResetPayload,
  PasswordResponse,
} from './auth'
export type { AuthSuccessResponse, AuthUser, AuthSession } from '~/types/auth'
export { useSearchApi } from './search'
export { useLocationApi, mapLocationOfferToItem } from './location'
export { useHotelsApi, mapHotelOfferToItem } from './hotels'
export { useAnimalsApi } from './animals'
export { useBookingsApi } from './bookings'
export { useRolesApi } from './roles'
export { useReviewsApi, mapServiceReviewToItem } from './reviews'
export { useServicesApi } from './services'
export type { FavoriteResponse, FavoriteServiceItem } from './services'
export { useNewsletterApi } from './newsletter'
export type { NewsletterSubscribePayload, NewsletterSubscribeResponse } from './newsletter'
export { useUserApi } from './user'
export type {
  ChangePasswordPayload,
  ChangePasswordResponse,
  CurrentPasswordResponse,
  UpdateUserPayload,
  UpdateUserResponse,
} from './user'
export { useWeaponsApi } from './weapons'
export type {
  WeaponsResponse,
  CalibersResponse,
  UserWeaponsResponse,
  SaveUserWeaponPayload,
  SaveUserWeaponResponse,
} from './weapons'
