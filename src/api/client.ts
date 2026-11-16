/**
 * RahoMitra API Client
 * Enterprise-grade fetch wrapper with in-memory access token management,
 * single-flight silent refresh on 401, timeout protection, CSRF headers, and typed errors.
 */

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')

export class ApiError extends Error {
  public readonly status: number
  public readonly code: string
  public readonly details?: unknown

  constructor(message: string, status: number, code = 'UNKNOWN_ERROR', details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

// In-memory access token storage (NEVER in localStorage/sessionStorage)
let inMemoryAccessToken: string | null = null

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken
}

// Global hook for auth context to react when refresh token expires
type AuthStateChangeCallback = () => void
let onUnauthorizedCallback: AuthStateChangeCallback | null = null

export function setOnUnauthorizedCallback(cb: AuthStateChangeCallback | null): void {
  onUnauthorizedCallback = cb
}

// Single-flight refresh token promise to prevent race conditions across concurrent requests
let singleFlightRefreshPromise: Promise<string | null> | null = null

async function doSilentRefresh(): Promise<string | null> {
  if (singleFlightRefreshPromise) {
    return singleFlightRefreshPromise
  }

  singleFlightRefreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
      })

      if (!res.ok) {
        setAccessToken(null)
        if (onUnauthorizedCallback) {
          onUnauthorizedCallback()
        }
        return null
      }

      const data = await res.json()
      const newToken = data.accessToken || null
      setAccessToken(newToken)
      return newToken
    } catch {
      setAccessToken(null)
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback()
      }
      return null
    } finally {
      singleFlightRefreshPromise = null
    }
  })()

  return singleFlightRefreshPromise
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number
  skipAuthRefresh?: boolean
}

export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { timeoutMs = 15000, skipAuthRefresh = false, ...fetchOptions } = options

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  const headers = new Headers(fetchOptions.headers || {})
  if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  headers.set('X-Requested-With', 'XMLHttpRequest')

  const token = getAccessToken()
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: 'include',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Handle 401 Unauthorized with single-flight silent refresh
    const isAuthEndpoint =
      endpoint.includes('/auth/login') ||
      endpoint.includes('/auth/refresh') ||
      endpoint.includes('/auth/signup') ||
      endpoint.includes('/auth/forgot-password') ||
      endpoint.includes('/auth/reset-password')

    if (response.status === 401 && !skipAuthRefresh && !isAuthEndpoint) {
      const newToken = await doSilentRefresh()
      if (newToken) {
        // Retry original request once with fresh access token
        return apiClient<T>(endpoint, {
          ...options,
          skipAuthRefresh: true,
          headers: {
            ...Object.fromEntries(headers.entries()),
            Authorization: `Bearer ${newToken}`,
          },
        })
      }
    }

    // Parse response
    const contentType = response.headers.get('content-type')
    const isJson = contentType && contentType.includes('application/json')
    const data = isJson ? await response.json() : null

    if (!response.ok) {
      const code = data?.error?.code || `HTTP_${response.status}`
      const message = data?.error?.message || response.statusText || 'An unexpected error occurred'
      const details = data?.error?.details
      throw new ApiError(message, response.status, code, details)
    }

    return (data as T) ?? ({} as T)
  } catch (err: unknown) {
    clearTimeout(timeoutId)
    if (err instanceof ApiError) {
      throw err
    }

    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('Request timed out. Please check your connection and try again.', 408, 'REQUEST_TIMEOUT')
    }

    // Network error / offline
    throw new ApiError(
      'Unable to connect to RahoMitra server. Please verify your connection or try again shortly.',
      0,
      'NETWORK_ERROR'
    )
  }
}

// Convenience REST methods
apiClient.get = <T = unknown>(endpoint: string, options?: RequestOptions) =>
  apiClient<T>(endpoint, { ...options, method: 'GET' })

apiClient.post = <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
  apiClient<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

apiClient.put = <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
  apiClient<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

apiClient.patch = <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
  apiClient<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

apiClient.delete = <T = unknown>(endpoint: string, options?: RequestOptions) =>
  apiClient<T>(endpoint, { ...options, method: 'DELETE' })
