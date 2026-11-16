import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import {
  apiClient,
  setAccessToken,
  setOnUnauthorizedCallback,
} from '../api/client'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  name?: string
  role: 'STUDENT' | 'OWNER' | 'ADMIN'
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED'
  mobile?: string
  city?: string
}

export type AuthRole = 'student' | 'owner' | 'admin'
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface LoginParams {
  email: string
  password: string
  role: AuthRole
  rememberMe?: boolean
}

interface AuthContextValue {
  user: AuthUser | null
  role: AuthRole | null
  status: AuthStatus
  login: (params: LoginParams) => Promise<AuthUser>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const BROADCAST_CHANNEL_NAME = 'rahomitra_auth_channel'

function normalizeRole(backendRole: string): AuthRole {
  const upper = backendRole.toUpperCase()
  if (upper === 'ADMIN') return 'admin'
  if (upper === 'OWNER') return 'owner'
  return 'student'
}

function normalizeAuthUser(user: AuthUser): AuthUser {
  return {
    ...user,
    name: user.name || user.fullName,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [role, setRole] = useState<AuthRole | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  const channelRef = useRef<BroadcastChannel | null>(null)

  // Clear auth state locally
  const clearAuth = useCallback(() => {
    setAccessToken(null)
    setUser(null)
    setRole(null)
    setStatus('unauthenticated')
  }, [])

  // Refresh user profile from backend
  const refreshUser = useCallback(async () => {
    try {
      const res = await apiClient.get<{ user: AuthUser }>('/auth/me')
      if (res.user) {
        setUser(normalizeAuthUser(res.user))
        setRole(normalizeRole(res.user.role))
        setStatus('authenticated')
      } else {
        clearAuth()
      }
    } catch {
      clearAuth()
    }
  }, [clearAuth])

  // Login handler
  const login = useCallback(
    async ({ email, password, role: loginRole, rememberMe }: LoginParams) => {
      const res = await apiClient.post<{
        user: AuthUser
        accessToken: string
      }>('/auth/login', {
        email,
        password,
        role: loginRole.toUpperCase(),
        rememberMe: Boolean(rememberMe),
      })

      const u = normalizeAuthUser(res.user)
      setAccessToken(res.accessToken)
      setUser(u)
      const mappedRole = normalizeRole(res.user.role)
      setRole(mappedRole)
      setStatus('authenticated')

      // Notify other browser tabs
      channelRef.current?.postMessage({
        type: 'LOGIN',
        user: u,
        role: mappedRole,
      })

      return u
    },
    []
  )

  // Logout handler
  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // Ignore network errors during logout to guarantee clean local state
    } finally {
      clearAuth()
      channelRef.current?.postMessage({ type: 'LOGOUT' })
    }
  }, [clearAuth])

  // Initial bootstrap: restore session silently from HttpOnly cookie
  useEffect(() => {
    let isMounted = true

    // Initialize cross-tab synchronization
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
      channelRef.current = channel

      channel.onmessage = (event) => {
        if (!isMounted) return
        if (event.data?.type === 'LOGOUT') {
          clearAuth()
        } else if (event.data?.type === 'LOGIN') {
          // Re-sync session in this tab
          bootstrapAuth()
        }
      }
    }

    // Set unauthenticated callback for the API client
    setOnUnauthorizedCallback(() => {
      if (isMounted) {
        clearAuth()
      }
    })

    async function bootstrapAuth() {
      try {
        const refreshRes = await apiClient.post<{ accessToken: string }>(
          '/auth/refresh',
          {},
          { skipAuthRefresh: true }
        )

        if (refreshRes?.accessToken) {
          setAccessToken(refreshRes.accessToken)
          const meRes = await apiClient.get<{ user: AuthUser }>(
            '/auth/me',
            { skipAuthRefresh: true }
          )

          if (isMounted && meRes.user) {
            setUser(normalizeAuthUser(meRes.user))
            setRole(normalizeRole(meRes.user.role))
            setStatus('authenticated')
            return
          }
        }
        if (isMounted) clearAuth()
      } catch {
        if (isMounted) clearAuth()
      }
    }

    bootstrapAuth()

    return () => {
      isMounted = false
      setOnUnauthorizedCallback(null)
      if (channelRef.current) {
        channelRef.current.close()
        channelRef.current = null
      }
    }
  }, [clearAuth])

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        status,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
