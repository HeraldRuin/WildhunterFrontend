export interface AuthUser {
  id: number
  first_name: string
  last_name: string
  email: string
  avatar: string | null
  role?: string | null
  role_name?: string | null
  created_at?: string | null
}

export interface AuthSession {
  token: string
  token_type?: string
  user?: AuthUser | null
}

export interface AuthSuccessResponse {
  success: true
  message?: string
  token: string
  token_type: string
  expires_in_minutes?: number | null
  user: AuthUser
}
