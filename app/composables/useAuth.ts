import type { ApiErrorResponse } from '~/types/api'
import type { AuthSession, AuthUser } from '~/types/auth'
import {
  extractCreatedAt,
  extractRoleCode,
  extractRoleName,
  resolveAvatarUrl,
  unwrapProfilePayload,
} from '~/utils/user'

function normalizeAuthUser(user: AuthUser | undefined, uploadsOrigin = '') {
  if (!user) {
    return undefined
  }

  const source = unwrapProfilePayload(user)

  return {
    ...user,
    first_name: String(source.first_name ?? user.first_name ?? ''),
    last_name: String(source.last_name ?? user.last_name ?? ''),
    email: String(source.email ?? user.email ?? ''),
    avatar: resolveAvatarUrl(source, [user.avatar], uploadsOrigin),
    role: user.role ?? extractRoleCode(source) ?? null,
    role_name: user.role_name ?? extractRoleName(source) ?? null,
    created_at: user.created_at ?? extractCreatedAt(source) ?? null,
  }
}

export function useAuth() {
  const config = useRuntimeConfig()
  const authToken = useAuthToken()
  const { auth } = useApi()
  const uploadsOrigin = new URL(config.public.apiBase as string).origin

  async function login(email: string, password: string, remember = false) {
    try {
      const response = await auth.login({
        email: email.trim(),
        password,
      })

      if (!response.success) {
        const error = response as ApiErrorResponse
        return {
          success: false as const,
          message: error.message || 'Не удалось войти',
          errors: error.errors,
        }
      }

      const normalizedUser = normalizeAuthUser(response.user, uploadsOrigin)
      const { invalidateProfileCache, loadProfile } = useProfile()
      const { setCurrentPassword } = useCurrentPassword()

      authToken.setSession({
        token: response.token,
        token_type: response.token_type,
        user: normalizedUser,
      }, remember)

      setCurrentPassword(password)

      if (normalizedUser?.id) {
        invalidateProfileCache(normalizedUser.id)
        await loadProfile(true)
      }

      return { success: true as const }
    } catch (error) {
      // $fetch throws on 4xx; API body is on error.data
      const data = (error as { data?: ApiErrorResponse }).data
      return {
        success: false as const,
        message: data?.message || 'Не удалось войти',
        errors: data?.errors,
      }
    }
  }

  function loginWithSession(session: AuthSession, remember = true) {
    const normalizedUser = normalizeAuthUser(session.user ?? undefined, uploadsOrigin)

    authToken.setSession({
      ...session,
      user: normalizedUser,
    }, remember)

    if (normalizedUser?.id) {
      const { invalidateProfileCache, loadProfile } = useProfile()
      invalidateProfileCache(normalizedUser.id)
      void loadProfile(true)
    }
  }

  async function logout() {
    const { resetProfile } = useProfile()
    const { clearCurrentPassword } = useCurrentPassword()

    try {
      if (authToken.token.value) {
        await auth.logout()
      }
    } catch {
      // Даже если сервер недоступен, очищаем локальную сессию.
    } finally {
      authToken.clearSession()
      resetProfile()
      clearCurrentPassword()
    }
  }

  return {
    token: authToken.token,
    user: authToken.user,
    isAuthenticated: authToken.isAuthenticated,
    authorizationHeader: authToken.authorizationHeader,
    login,
    loginWithSession,
    logout,
  }
}
