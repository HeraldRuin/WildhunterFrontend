import type { ApiErrorResponse } from '~/types/api'
import type { AuthSession } from '~/types/auth'

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
      user: response.user,
    }, remember)

    return { success: true as const }
  }

  function loginWithSession(session: AuthSession, remember = true) {
    authToken.setSession(session, remember)
  }

  async function logout() {
    try {
      if (authToken.token.value) {
        await auth.logout()
      }
    } catch {
      // Даже если сервер недоступен, очищаем локальную сессию.
    } finally {
      authToken.clearSession()
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
