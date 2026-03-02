import type { SigninResponse, SignupResponse } from '../domain/apiTypes'
import type { AuthApi, AuthResult, StoredSession, User } from '../domain/auth-types'
import { api } from './apiClient'

const AUTH_STORAGE_KEY = 'autoceny_auth'

function deriveNameFromEmail(email: string): string {
  return email.split('@')[0]
}

function storeSession(session: StoredSession): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

function clearSession(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

function signinToResult(res: SigninResponse): AuthResult {
  const user: User = {
    id: res.userId,
    name: deriveNameFromEmail(res.email),
    email: res.email,
    role: res.role,
    createdAt: new Date().toISOString(),
  }

  const session: StoredSession = {
    accessToken: res.accessToken,
    refreshToken: res.refreshToken,
    expiresAt: Date.now() + res.expiresIn * 1000,
    user,
  }
  storeSession(session)

  return { user, token: res.accessToken }
}

const authApiImpl: AuthApi = {
  async login(email: string, password: string, captchaToken?: string): Promise<AuthResult> {
    const res = await api.post<SigninResponse>('/api/auth/users/signin', {
      auth: false,
      body: { email, password, captchaToken: captchaToken ?? null },
    })
    return signinToResult(res)
  },

  async register(email: string, password: string, captchaToken?: string): Promise<AuthResult> {
    // Signup returns no token — we must sign in afterwards
    await api.post<SignupResponse>('/api/auth/users/signup', {
      auth: false,
      body: { email, password, captchaToken: captchaToken ?? null },
    })
    return authApiImpl.login(email, password)
  },

  async shopLogin(email: string, password: string, captchaToken?: string): Promise<AuthResult> {
    const res = await api.post<SigninResponse>('/api/auth/shops/signin', {
      auth: false,
      body: { email, password, captchaToken: captchaToken ?? null },
    })
    return signinToResult(res)
  },

  async shopRegister(email: string, password: string, captchaToken?: string): Promise<AuthResult> {
    await api.post<SignupResponse>('/api/auth/shops/signup', {
      auth: false,
      body: { email, password, captchaToken: captchaToken ?? null },
    })
    return authApiImpl.shopLogin(email, password)
  },

  async adminLogin(email: string, password: string, captchaToken?: string): Promise<AuthResult> {
    const res = await api.post<SigninResponse>('/api/auth/admin/signin', {
      auth: false,
      body: { email, password, captchaToken: captchaToken ?? null },
    })
    return signinToResult(res)
  },

  async logout(): Promise<void> {
    clearSession()
    await Promise.resolve()
  },

  restoreSession(): StoredSession | null {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY)
      if (!raw) return null

      const session = JSON.parse(raw) as StoredSession
      // If token expired, clear it
      if (session.expiresAt < Date.now()) {
        clearSession()
        return null
      }
      return session
    } catch {
      clearSession()
      return null
    }
  },
}

export const authApi: AuthApi = authApiImpl
