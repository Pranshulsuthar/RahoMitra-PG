import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  DEMO_STUDENT_PROFILE,
  STUDENT_NOTICES,
} from '../data/studentData'
import type { StudentNotice, StudentProfile, StudentSettings } from '../types/student'
import type { ToastItem } from '../components/common/ToastStack'

/**
 * ---------------------------------------------------------------------------
 * SECTION 05 — single in-memory demo store for the Student Dashboard.
 * Every mutation is local React state only — nothing is persisted or sent
 * anywhere. Reload the page to restore the original demo dataset.
 * ---------------------------------------------------------------------------
 */

const DEFAULT_SETTINGS: StudentSettings = {
  languageEnglish: true,
  showProfileToOwner: true,
  noticeAlerts: true,
  rentReminders: true,
  emailDigest: false,
  compactCards: false,
  reduceMotion: false,
  darkMode: false,
}

interface StudentStoreValue {
  /* data */
  profile: StudentProfile
  notices: StudentNotice[]
  settings: StudentSettings
  toasts: ToastItem[]

  /* profile editing (local only) */
  updateProfile: (patch: Partial<StudentProfile>) => void

  /* notices */
  markNoticeRead: (id: string, read?: boolean) => void
  markAllNoticesRead: () => void
  /** Section 07 — dismiss a single demo notice from the bell. */
  removeNotice: (id: string) => void
  unreadCount: number

  /* settings */
  updateSettings: (patch: Partial<StudentSettings>) => void

  /* toasts */
  pushToast: (message: string, tone?: ToastItem['tone']) => void
  dismissToast: (id: number) => void
}

const StudentStoreContext = createContext<StudentStoreValue | null>(null)

export function StudentStoreProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<StudentProfile>({ ...DEMO_STUDENT_PROFILE })
  const [notices, setNotices] = useState<StudentNotice[]>(STUDENT_NOTICES)
  const [settings, setSettings] = useState<StudentSettings>({ ...DEFAULT_SETTINGS })
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toastId = useRef(0)

  const pushToast = useCallback((message: string, tone: ToastItem['tone'] = 'success') => {
    const id = ++toastId.current
    setToasts((prev) => [...prev, { id, message, tone }])
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const updateProfile = useCallback(
    (patch: Partial<StudentProfile>) => {
      setProfile((prev) => ({ ...prev, ...patch }))
      pushToast('Profile saved (demo — local state only).')
    },
    [pushToast],
  )

  const markNoticeRead = useCallback((id: string, read = true) => {
    setNotices((prev) => prev.map((n) => (n.id === id ? { ...n, read } : n)))
  }, [])

  const markAllNoticesRead = useCallback(() => {
    setNotices((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const removeNotice = useCallback((id: string) => {
    setNotices((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const updateSettings = useCallback(
    (patch: Partial<StudentSettings>) => {
      setSettings((prev) => ({ ...prev, ...patch }))
    },
    [],
  )

  const unreadCount = useMemo(() => notices.filter((n) => !n.read).length, [notices])

  const value = useMemo<StudentStoreValue>(
    () => ({
      profile,
      notices,
      settings,
      toasts,
      updateProfile,
      markNoticeRead,
      markAllNoticesRead,
      removeNotice,
      unreadCount,
      updateSettings,
      pushToast,
      dismissToast,
    }),
    [
      profile,
      notices,
      settings,
      toasts,
      updateProfile,
      markNoticeRead,
      markAllNoticesRead,
      removeNotice,
      unreadCount,
      updateSettings,
      pushToast,
      dismissToast,
    ],
  )

  return <StudentStoreContext.Provider value={value}>{children}</StudentStoreContext.Provider>
}

export function useStudentStore(): StudentStoreValue {
  const ctx = useContext(StudentStoreContext)
  if (!ctx) throw new Error('useStudentStore must be used inside <StudentStoreProvider>')
  return ctx
}
