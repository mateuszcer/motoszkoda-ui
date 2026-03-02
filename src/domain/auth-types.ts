import type { ApiRole } from './apiTypes'

export interface User {
  id: string
  name: string
  email: string
  role: ApiRole
  avatarUrl?: string
  createdAt: string
}

export interface AuthResult {
  user: User
  token: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
}

export interface StoredSession {
  accessToken: string
  refreshToken: string
  expiresAt: number // epoch ms
  user: User
}

export interface AuthApi {
  login(email: string, password: string, captchaToken?: string): Promise<AuthResult>
  register(email: string, password: string, captchaToken?: string): Promise<AuthResult>
  shopLogin(email: string, password: string, captchaToken?: string): Promise<AuthResult>
  shopRegister(email: string, password: string, captchaToken?: string): Promise<AuthResult>
  logout(): Promise<void>
  restoreSession(): StoredSession | null
}
