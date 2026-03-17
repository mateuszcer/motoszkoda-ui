import type { ApiErrorResponse } from '../domain/apiTypes'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'
const AUTH_STORAGE_KEY = 'autoceny_auth'

// Set by App.tsx on mount — called when a 401 is received
let onUnauthorized: (() => void) | null = null

export function setOnUnauthorized(callback: () => void): void {
  onUnauthorized = callback
}

export class ApiError extends Error {
  status: number
  code: string
  details: string[] | undefined
  correlationId: string | undefined
  retryAfterSeconds: number | undefined

  constructor(status: number, code: string, details?: string[], correlationId?: string, retryAfterSeconds?: number) {
    super(`[${code}] ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.correlationId = correlationId
    this.retryAfterSeconds = retryAfterSeconds
  }
}

function getAccessToken(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as { accessToken?: string }
    return session.accessToken ?? null
  } catch {
    return null
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T
  }

  if (!response.ok) {
    if (response.status === 401) {
      onUnauthorized?.()
    }

    const retryAfterRaw = response.headers.get('Retry-After')
    const retryAfterSeconds = retryAfterRaw ? parseInt(retryAfterRaw, 10) : undefined

    let body: ApiErrorResponse | undefined
    try {
      body = (await response.json()) as ApiErrorResponse
    } catch {
      // non-JSON error body
    }

    throw new ApiError(
      response.status,
      body?.code ?? `HTTP_${response.status}`,
      body?.details,
      body?.correlationId,
      Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : undefined,
    )
  }

  return (await response.json()) as T
}

interface RequestOptions {
  auth?: boolean
  body?: unknown
  params?: Record<string, string | number | undefined>
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  const url = new URL(path, BASE_URL)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value))
      }
    }
  }
  return url.toString()
}

function buildHeaders(auth: boolean, hasBody: boolean): HeadersInit {
  const headers: Record<string, string> = {}
  if (hasBody) {
    headers['Content-Type'] = 'application/json'
  }
  if (auth) {
    const token = getAccessToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }
  return headers
}

interface CachedEntry<T> {
  data: T
  expiresAt: number
}

const CACHE_PREFIX = 'autoceny_cache_'

export function clearApiCache(): void {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(CACHE_PREFIX)) {
      keys.push(key)
    }
  }
  for (const key of keys) {
    localStorage.removeItem(key)
  }
}

export async function cachedGet<T>(
  path: string,
  opts: RequestOptions & { ttlMs: number; cacheKey: string },
): Promise<T> {
  const { ttlMs, cacheKey, ...requestOpts } = opts
  const storageKey = CACHE_PREFIX + cacheKey

  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      const entry = JSON.parse(raw) as CachedEntry<T>
      if (entry.expiresAt > Date.now()) {
        return entry.data
      }
    }
  } catch {
    // corrupt cache — fall through to fetch
  }

  const data = await api.get<T>(path, requestOpts)

  try {
    const entry: CachedEntry<T> = { data, expiresAt: Date.now() + ttlMs }
    localStorage.setItem(storageKey, JSON.stringify(entry))
  } catch {
    // localStorage full or unavailable — still return data
  }

  return data
}

export const api = {
  async get<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const { auth = true, params } = opts
    const response = await fetch(buildUrl(path, params), {
      method: 'GET',
      headers: buildHeaders(auth, false),
    })
    return handleResponse<T>(response)
  },

  async post<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const { auth = true, body } = opts
    const response = await fetch(buildUrl(path), {
      method: 'POST',
      headers: buildHeaders(auth, body !== undefined),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    return handleResponse<T>(response)
  },

  async put<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const { auth = true, body } = opts
    const response = await fetch(buildUrl(path), {
      method: 'PUT',
      headers: buildHeaders(auth, body !== undefined),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    return handleResponse<T>(response)
  },

  async patch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const { auth = true, body } = opts
    const response = await fetch(buildUrl(path), {
      method: 'PATCH',
      headers: buildHeaders(auth, body !== undefined),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    return handleResponse<T>(response)
  },

  async delete<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const { auth = true } = opts
    const response = await fetch(buildUrl(path), {
      method: 'DELETE',
      headers: buildHeaders(auth, false),
    })
    return handleResponse<T>(response)
  },
}
