import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { StudentNotice, StudentProfile, StudentSettings } from '../types/student'
import type { ToastItem } from '../components/common/ToastStack'
import { useAuth } from './AuthContext'
import {
  fetchStudentNotices,
  fetchStudentProfile,
  fetchStudentSettings,
  updateStudentProfileApi,
  updateStudentSettingsApi,
  markAnnouncementReadApi,
} from '../api/communication'

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

  /* profile editing */
  updateProfile: (patch: Partial<StudentProfile>) => void

  /* notices */
  markNoticeRead: (id: string, read?: boolean) => void
  markAllNoticesRead: () => void
  removeNotice: (id: string) => void
  unreadCount: number

  /* settings */
  updateSettings: (patch: Partial<StudentSettings>) => void

  /* toasts */
  pushToast: (message: string, tone?: ToastItem['tone']) => void
  dismissToast: (id: number) => void
  refresh: () => Promise<void>
}

const StudentStoreContext = createContext<StudentStoreValue | null>(null)

const DEFAULT_STUDENT_PROFILE: StudentProfile = {
  name: '',
  email: '',
  mobile: '',
  college: '',
  city: '',
  emergencyContact: '',
}

export function StudentStoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<StudentProfile>(() => ({
    name: user?.fullName || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    college: '',
    city: user?.city || '',
    emergencyContact: '',
  }))
  const [notices, setNotices] = useState<StudentNotice[]>([])
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

  const refresh = useCallback(async () => {
    if (!user || user.role !== 'STUDENT') return
    try {
      const [prof, nots, sett] = await Promise.all([
        fetchStudentProfile().catch(() => null),
        fetchStudentNotices().catch(() => null),
        fetchStudentSettings().catch(() => null),
      ])
      if (prof) setProfile(prof)
      if (nots) setNotices(nots)
      if (sett) setSettings(sett)
    } catch {
      // Keep optimistic/seed state on error
    }
  }, [user])

  useEffect(() => {
    if (user && user.role === 'STUDENT') {
      void refresh()
    }
  }, [user, refresh])

  const updateProfile = useCallback(
    (patch: Partial<StudentProfile>) => {
      setProfile((prev) => ({ ...prev, ...patch }))
      if (user) {
        updateStudentProfileApi(patch)
          .then((updated) => {
            setProfile(updated)
            pushToast('Profile saved successfully.')
          })
          .catch((err) => {
            pushToast(err.message || 'Failed to update profile', 'error')
          })
      } else {
        pushToast('Profile saved successfully.')
      }
    },
    [user, pushToast],
  )

  const markNoticeRead = useCallback(
    (id: string, read = true) => {
      setNotices((prev) => prev.map((n) => (n.id === id ? { ...n, read } : n)))
      if (user && read) {
        markAnnouncementReadApi(id).catch(() => {})
      }
    },
    [user],
  )

  const markAllNoticesRead = useCallback(() => {
    setNotices((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const removeNotice = useCallback((id: string) => {
    setNotices((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const updateSettings = useCallback(
    (patch: Partial<StudentSettings>) => {
      setSettings((prev) => ({ ...prev, ...patch }))
      if (user) {
        updateStudentSettingsApi(patch)
          .then((updated) => {
            setSettings(updated)
            pushToast('Preferences updated.')
          })
          .catch((err) => {
            pushToast(err.message || 'Failed to update settings', 'error')
          })
      }
    },
    [user, pushToast],
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
      refresh,
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
      refresh,
    ],
  )

  return <StudentStoreContext.Provider value={value}>{children}</StudentStoreContext.Provider>
}

export function useStudentStore(): StudentStoreValue {
  const ctx = useContext(StudentStoreContext)
  if (!ctx) throw new Error('useStudentStore must be used inside <StudentStoreProvider>')
  return ctx
}
