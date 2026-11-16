import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth, type AuthRole } from '../../context/AuthContext'

/** Validate that return URL is an internal relative path to prevent Open Redirect attacks */
export function getSafeReturnUrl(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null
  const trimmed = rawUrl.trim()

  // Must begin with single slash, not double slash (protocol-relative), and contain no protocol specifiers or backslashes
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null
  if (trimmed.includes('\\') || trimmed.includes(':')) return null

  return trimmed
}

export function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory">
      <div className="text-center">
        <div className="relative mx-auto mb-4 h-12 w-12">
          <div className="absolute inset-0 rounded-full border-4 border-gold-soft border-t-forest animate-spin" />
        </div>
        <p className="font-display text-lg font-medium text-forest">RahoMitra</p>
        <p className="mt-1 text-xs text-ink-soft">Securing session…</p>
      </div>
    </div>
  )
}

interface ProtectedRouteProps {
  allowedRole?: AuthRole
  children: ReactNode
}

export function ProtectedRoute({ allowedRole, children }: ProtectedRouteProps) {
  const { status, role } = useAuth()
  const location = useLocation()

  // 1. While auth status is loading, show blank/neutral loader so protected content never flashes
  if (status === 'loading') {
    return <AuthLoadingScreen />
  }

  // 2. Unauthenticated users are redirected to login with return path preserved
  if (status === 'unauthenticated') {
    const targetLogin = allowedRole ? `/login/${allowedRole}` : '/login/student'
    return <Navigate to={targetLogin} state={{ from: location }} replace />
  }

  // 3. Authenticated but wrong role: redirect to their corresponding dashboard
  if (allowedRole && role !== allowedRole) {
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />
    if (role === 'owner') return <Navigate to="/owner/dashboard" replace />
    return <Navigate to="/student/dashboard" replace />
  }

  return <>{children}</>
}

/** Route wrapper for login/signup pages: prevents flash and redirects logged-in users to their dashboard */
export function PublicAuthRoute({ children }: { children: ReactNode }) {
  const { status, role } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <AuthLoadingScreen />
  }

  if (status === 'authenticated') {
    const safeReturn = getSafeReturnUrl(
      (location.state as { from?: { pathname?: string } })?.from?.pathname
    )

    if (safeReturn) {
      return <Navigate to={safeReturn} replace />
    }

    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />
    if (role === 'owner') return <Navigate to="/owner/dashboard" replace />
    return <Navigate to="/student/dashboard" replace />
  }

  return <>{children}</>
}
