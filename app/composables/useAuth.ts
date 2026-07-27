import type { ApiErrorResponse } from '~/types/api'
import type { AuthSession, AuthUser } from '~/types/auth'
import { extractAvatarUrl, extractCreatedAt, extractRoleCode, extractRoleName } from '~/utils/user'

function normalizeAuthUser(user: AuthUser | undefined) {
  if (!user) {
    return undefined
  }

  const source = user as AuthUser & { avatar_url?: string | null }

  return {
    ...user,
    avatar: user.avatar ?? extractAvatarUrl(source) ?? source.avatar_url ?? null,
    role: user.role ?? extractRoleCode(source) ?? null,
    role_name: user.role_name ?? extractRoleName(source) ?? null,
    created_at: user.created_at ?? extractCreatedAt(source) ?? null,
  }
}

export function useAuth() {
  const authToken = useAuthToken()
  const { auth } = useApi()

  async function login(email: string, password: string, remember = false) {
    const response = await auth.login({
      email: email.trim(),
      password,
    })

    if (!response.success) {
      return {
        success: false as const,
        message: (response as ApiErrorResponse).message || 'Не удалось войти',
        errors: (response as ApiErrorResponse).errors,
      }
    }

    authToken.setSession({
      token: response.token,
      token_type: response.token_type,
      user: normalizeAuthUser(response.user),
    }, remember)

    return { success: true as const }
  }

  function loginWithSession(session: AuthSession, remember = true) {
    authToken.setSession(session, remember)
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
