import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ACTIVITIES,
  APPLICATIONS,
  NOTIFICATIONS,
  OWNERS,
  PAYMENTS,
  PLANS,
  STUDENTS,
  SUBSCRIPTIONS,
  TICKETS,
  ADMIN_PGS,
} from '../data/adminData'
import type {
  ActivityItem,
  AdminPg,
  AdminToast,
  ApplicationStatus,
  NotificationCategory,
  NotificationAudience,
  OwnerApplication,
  OwnerRecord,
  OwnerStatus,
  PaymentRecord,
  PgStatus,
  PlanRecord,
  PlatformNotification,
  StudentRecord,
  SubscriptionRecord,
  SubscriptionStatus,
  SupportTicket,
  TicketStatus,
} from '../types/admin'

/**
 * Single in-memory demo store for the Super Admin panel.
 * Every mutation is local React state only — nothing is persisted or sent
 * anywhere. Reload the page to restore the original demo dataset.
 */
interface AdminStoreValue {
  pgs: AdminPg[]
  applications: OwnerApplication[]
  owners: OwnerRecord[]
  students: StudentRecord[]
  plans: PlanRecord[]
  subscriptions: SubscriptionRecord[]
  payments: PaymentRecord[]
  tickets: SupportTicket[]
  notifications: PlatformNotification[]
  activities: ActivityItem[]
  toasts: AdminToast[]

  setPgStatus: (id: string, status: PgStatus, note?: string) => void
  setApplicationStatus: (id: string, status: ApplicationStatus, reason?: string) => void
  setOwnerStatus: (id: string, status: OwnerStatus) => void
  setStudentMembership: (id: string, membership: 'ACTIVE' | 'INACTIVE') => void
  updatePlan: (id: string, patch: Partial<PlanRecord>) => void
  createPlan: (plan: Omit<PlanRecord, 'id'>) => void
  setSubscriptionStatus: (id: string, status: SubscriptionStatus) => void
  changeSubscriptionPlan: (id: string, planId: string) => void
  extendSubscription: (id: string, days: number) => void
  setTicketStatus: (id: string, status: TicketStatus) => void
  addTicketNote: (id: string, text: string) => void
  markNotificationRead: (id: string, read: boolean) => void
  markAllNotificationsRead: () => void
  addNotification: (input: {
    title: string
    message: string
    category: NotificationCategory
    audience: NotificationAudience
  }) => void

  pushToast: (message: string, tone?: AdminToast['tone']) => void
  dismissToast: (id: number) => void
}

const AdminStoreContext = createContext<AdminStoreValue | null>(null)

const TODAY = new Date('2026-05-14T00:00:00')

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const [pgs, setPgs] = useState<AdminPg[]>(ADMIN_PGS)
  const [applications, setApplications] = useState<OwnerApplication[]>(APPLICATIONS)
  const [owners, setOwners] = useState<OwnerRecord[]>(OWNERS)
  const [students, setStudents] = useState<StudentRecord[]>(STUDENTS)
  const [plans, setPlans] = useState<PlanRecord[]>(PLANS)
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>(SUBSCRIPTIONS)
  const [payments] = useState<PaymentRecord[]>(PAYMENTS)
  const [tickets, setTickets] = useState<SupportTicket[]>(TICKETS)
  const [notifications, setNotifications] = useState<PlatformNotification[]>(NOTIFICATIONS)
  const [activities, setActivities] = useState<ActivityItem[]>(ACTIVITIES)

  const [toasts, setToasts] = useState<AdminToast[]>([])
  const toastId = useRef(0)

  const pushToast = useCallback((message: string, tone: AdminToast['tone'] = 'success') => {
    const id = ++toastId.current
    setToasts((prev) => [...prev, { id, message, tone }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3800)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const logActivity = useCallback((text: string, kind: ActivityItem['kind']) => {
    setActivities((prev) => [
      { id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text, time: 'just now', kind },
      ...prev,
    ])
  }, [])

  const setPgStatus = useCallback(
    (id: string, status: PgStatus, note?: string) => {
      setPgs((prev) =>
        prev.map((pg) => (pg.id === id ? { ...pg, status, statusNote: note ?? pg.statusNote } : pg)),
      )
      const pg = pgs.find((p) => p.id === id)
      logActivity(`PG "${pg?.name ?? id}" marked ${status} (demo)`, 'pg')
    },
    [pgs, logActivity],
  )

  const setApplicationStatus = useCallback(
    (id: string, status: ApplicationStatus, reason?: string) => {
      setApplications((prev) =>
        prev.map((app) =>
          app.id === id
            ? { ...app, status, rejectionReason: status === 'REJECTED' ? reason : undefined }
            : app,
        ),
      )
      const app = applications.find((a) => a.id === id)
      logActivity(
        `Application from "${app?.ownerName ?? id}" marked ${status} (demo)`,
        'owner',
      )
    },
    [applications, logActivity],
  )

  const setOwnerStatus = useCallback(
    (id: string, status: OwnerStatus) => {
      setOwners((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
      const owner = owners.find((o) => o.id === id)
      logActivity(`Owner "${owner?.name ?? id}" ${status === 'SUSPENDED' ? 'suspended' : 'reactivated'} (demo)`, 'owner')
    },
    [owners, logActivity],
  )

  const setStudentMembership = useCallback(
    (id: string, membership: 'ACTIVE' | 'INACTIVE') => {
      setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, membership } : s)))
    },
    [],
  )

  const updatePlan = useCallback((id: string, patch: Partial<PlanRecord>) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }, [])

  const createPlan = useCallback((plan: Omit<PlanRecord, 'id'>) => {
    setPlans((prev) => [...prev, { ...plan, id: `plan-${Date.now()}` }])
  }, [])

  const setSubscriptionStatus = useCallback(
    (id: string, status: SubscriptionStatus) => {
      setSubscriptions((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)))
      const sub = subscriptions.find((s) => s.id === id)
      logActivity(`Subscription for "${sub?.pgName ?? id}" set to ${status} (demo)`, 'subscription')
    },
    [subscriptions, logActivity],
  )

  const changeSubscriptionPlan = useCallback((id: string, planId: string) => {
    setSubscriptions((prev) => prev.map((s) => (s.id === id ? { ...s, planId } : s)))
  }, [])

  const extendSubscription = useCallback((id: string, days: number) => {
    setSubscriptions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s
        const base = s.expiryOn < TODAY.toISOString().slice(0, 10) ? TODAY.toISOString().slice(0, 10) : s.expiryOn
        return { ...s, expiryOn: addDays(base, days), status: 'ACTIVE' }
      }),
    )
  }, [])

  const setTicketStatus = useCallback((id: string, status: TicketStatus) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
  }, [])

  const addTicketNote = useCallback((id: string, text: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              notes: [
                ...t.notes,
                { id: `note-${Date.now()}`, text, on: TODAY.toISOString().slice(0, 10) },
              ],
            }
          : t,
      ),
    )
  }, [])

  const markNotificationRead = useCallback((id: string, read: boolean) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read } : n)))
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const addNotification = useCallback(
    (input: {
      title: string
      message: string
      category: NotificationCategory
      audience: NotificationAudience
    }) => {
      setNotifications((prev) => [
        {
          id: `ntf-${Date.now()}`,
          ...input,
          sentOn: TODAY.toISOString().slice(0, 10),
          read: false,
        },
        ...prev,
      ])
      logActivity(`Announcement "${input.title}" recorded (demo, nothing sent)`, 'subscription')
    },
    [logActivity],
  )

  const value = useMemo<AdminStoreValue>(
    () => ({
      pgs,
      applications,
      owners,
      students,
      plans,
      subscriptions,
      payments,
      tickets,
      notifications,
      activities,
      toasts,
      setPgStatus,
      setApplicationStatus,
      setOwnerStatus,
      setStudentMembership,
      updatePlan,
      createPlan,
      setSubscriptionStatus,
      changeSubscriptionPlan,
      extendSubscription,
      setTicketStatus,
      addTicketNote,
      markNotificationRead,
      markAllNotificationsRead,
      addNotification,
      pushToast,
      dismissToast,
    }),
    [
      pgs,
      applications,
      owners,
      students,
      plans,
      subscriptions,
      payments,
      tickets,
      notifications,
      activities,
      toasts,
      setPgStatus,
      setApplicationStatus,
      setOwnerStatus,
      setStudentMembership,
      updatePlan,
      createPlan,
      setSubscriptionStatus,
      changeSubscriptionPlan,
      extendSubscription,
      setTicketStatus,
      addTicketNote,
      markNotificationRead,
      markAllNotificationsRead,
      addNotification,
      pushToast,
      dismissToast,
    ],
  )

  return <AdminStoreContext.Provider value={value}>{children}</AdminStoreContext.Provider>
}

export function useAdminStore(): AdminStoreValue {
  const ctx = useContext(AdminStoreContext)
  if (!ctx) throw new Error('useAdminStore must be used inside <AdminStoreProvider>')
  return ctx
}
