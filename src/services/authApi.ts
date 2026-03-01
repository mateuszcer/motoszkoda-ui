import type { AuthApi, AuthResult, User } from '../domain/auth-types'

const STORAGE_KEY = 'autoceny_auth_token'
const latencyMs = 250

interface StoredUser {
  id: string
  name: string
  email: string
  password: string
  createdAt: string
}

const usersDb: StoredUser[] = [
  {
    id: 'user_demo',
    name: 'Jan Kowalski',
    email: 'jan@example.com',
    password: 'password123',
    createdAt: '2025-01-15T10:00:00.000Z',
  },
]

const tokenToUserId = new Map<string, string>()

const simulateLatency = async <T>(value: T): Promise<T> => {
  await new Promise((resolve) => {
    window.setTimeout(resolve, latencyMs)
  })
  return value
}

const generateToken = (): string => {
  return `tok_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

const toPublicUser = (stored: StoredUser): User => ({
  id: stored.id,
  name: stored.name,
  email: stored.email,
  createdAt: stored.createdAt,
})

const api: AuthApi = {
  async login(email: string, password: string): Promise<AuthResult> {
    const found = usersDb.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    )
    if (!found) {
      await simulateLatency(null)
      throw new Error('Invalid email or password')
    }

    const token = generateToken()
    tokenToUserId.set(token, found.id)
    localStorage.setItem(STORAGE_KEY, token)

    return simulateLatency({ user: toPublicUser(found), token })
  },

  async register(name: string, email: string, password: string): Promise<AuthResult> {
    const exists = usersDb.some((u) => u.email.toLowerCase() === email.toLowerCase())
    if (exists) {
      await simulateLatency(null)
      throw new Error('Email already registered')
    }

    const newUser: StoredUser = {
      id: `user_${Date.now().toString(36)}`,
      name,
      email: email.toLowerCase(),
      password,
      createdAt: new Date().toISOString(),
    }
    usersDb.push(newUser)

    const token = generateToken()
    tokenToUserId.set(token, newUser.id)
    localStorage.setItem(STORAGE_KEY, token)

    return simulateLatency({ user: toPublicUser(newUser), token })
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem(STORAGE_KEY)
    if (token) {
      tokenToUserId.delete(token)
    }
    localStorage.removeItem(STORAGE_KEY)
    await simulateLatency(undefined)
  },

  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem(STORAGE_KEY)
    if (!token) {
      return simulateLatency(null)
    }

    const userId = tokenToUserId.get(token)
    if (!userId) {
      localStorage.removeItem(STORAGE_KEY)
      return simulateLatency(null)
    }

    const found = usersDb.find((u) => u.id === userId)
    if (!found) {
      localStorage.removeItem(STORAGE_KEY)
      return simulateLatency(null)
    }

    return simulateLatency(toPublicUser(found))
  },
}

export const authApi: AuthApi = api
