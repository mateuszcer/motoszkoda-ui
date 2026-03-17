import type { ApiErrorResponse, RefreshTokenResponse } from '../domain/apiTypes'
import type { StoredSession } from '../domain/auth-types'

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

// ── Refresh Token Orchestrator ──────────────────────────────────────

let refreshPromise: Promise<boolean> | null = null

async function doRefresh(): Promise<boolean> {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return false

    const session = JSON.parse(raw) as StoredSession
    if (!session.refreshToken) return false

    const response = await fetch(buildUrl('/api/auth/token/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    })

    if (!response.ok) return false

    const data = (await response.json()) as RefreshTokenResponse
    const updated: StoredSession = {
      ...session,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + data.expiresIn * 1000,
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated))
    return true
  } catch {
    return false
  }
}

export function attemptTokenRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

// ── Proactive Refresh Timer ─────────────────────────────────────────

const PROACTIVE_REFRESH_BUFFER_MS = 60_000

let proactiveTimer: ReturnType<typeof setTimeout> | null = null

export function scheduleProactiveRefresh(): void {
  cancelProactiveRefresh()

  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return

    const session = JSON.parse(raw) as StoredSession
    if (!session.refreshToken) return

    const delay = session.expiresAt - Date.now() - PROACTIVE_REFRESH_BUFFER_MS
    if (delay <= 0) {
      // Already within the buffer — refresh immediately
      void attemptTokenRefresh().then((ok) => {
        if (ok) {
          scheduleProactiveRefresh()
        } else {
          onUnauthorized?.()
        }
      })
      return
    }

    proactiveTimer = setTimeout(() => {
      void attemptTokenRefresh().then((ok) => {
        if (ok) {
          scheduleProactiveRefresh()
        } else {
          onUnauthorized?.()
        }
      })
    }, delay)
  } catch {
    // corrupt session — ignore
  }
}

export function cancelProactiveRefresh(): void {
  if (proactiveTimer !== null) {
    clearTimeout(proactiveTimer)
    proactiveTimer = null
  }
}

// ── Response handling ───────────────────────────────────────────────

function parseErrorResponse(response: Response, body: ApiErrorResponse | undefined): ApiError {
  const retryAfterRaw = response.headers.get('Retry-After')
  const retryAfterSeconds = retryAfterRaw ? parseInt(retryAfterRaw, 10) : undefined

  return new ApiError(
    response.status,
    body?.code ?? `HTTP_${response.status}`,
    body?.details,
    body?.correlationId,
    Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : undefined,
  )
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T
  }

  if (!response.ok) {
    let body: ApiErrorResponse | undefined
    try {
      body = (await response.json()) as ApiErrorResponse
    } catch {
      // non-JSON error body
    }

    throw parseErrorResponse(response, body)
  }

  return (await response.json()) as T
}

// ── Request execution with retry-on-401 ─────────────────────────────

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

interface FetchArgs {
  method: string
  path: string
  auth: boolean
  body?: unknown
  params?: Record<string, string | number | undefined>
}

async function executeRequest<T>(args: FetchArgs): Promise<T> {
  const { method, path, auth, body, params } = args
  const hasBody = body !== undefined

  const response = await fetch(buildUrl(path, params), {
    method,
    headers: buildHeaders(auth, hasBody),
    body: hasBody ? JSON.stringify(body) : undefined,
  })

  if (response.status === 401 && auth) {
    const refreshed = await attemptTokenRefresh()
    if (refreshed) {
      // Retry once with new token
      const retry = await fetch(buildUrl(path, params), {
        method,
        headers: buildHeaders(auth, hasBody),
        body: hasBody ? JSON.stringify(body) : undefined,
      })
      return handleResponse<T>(retry)
    }
    onUnauthorized?.()
  }

  return handleResponse<T>(response)
}

// ── Cache ───────────────────────────────────────────────────────────

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
    return executeRequest<T>({ method: 'GET', path, auth, params })
  },

  async post<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const { auth = true, body } = opts
    return executeRequest<T>({ method: 'POST', path, auth, body })
  },

  async put<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const { auth = true, body } = opts
    return executeRequest<T>({ method: 'PUT', path, auth, body })
  },

  async patch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const { auth = true, body } = opts
    return executeRequest<T>({ method: 'PATCH', path, auth, body })
  },

  async delete<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const { auth = true } = opts
    return executeRequest<T>({ method: 'DELETE', path, auth })
  },
}
