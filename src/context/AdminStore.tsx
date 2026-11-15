import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ACTIVITIES,
  ADVERTISEMENTS,
  APPLICATIONS,
  FEATURED_REQUESTS,
  NOTIFICATIONS,
  OWNERS,
  PAYMENTS,
  PLATFORM_SETTINGS,
  PLATFORM_TICKETS,
  PLANS,
  STUDENTS,
  SUBSCRIPTIONS,
  SUPPORT_STAFF,
  TICKETS,
  ADMIN_PGS,
} from '../data/adminData'
import type {
  ActivityItem,
  AdminPg,
  AdminToast,
  Advertisement,
  ApplicationStatus,
  FeaturedRequest,
  FeaturedRequestStatus,
  FeaturedListingStatus,
  NotificationCategory,
  NotificationAudience,
  OwnerApplication,
  OwnerRecord,
  OwnerStatus,
  PaymentRecord,
  PgStatus,
  PlanRecord,
  PlatformNotification,
  PlatformSettings,
  PlatformTicket,
  PlatformTicketStatus,
  StudentRecord,
  SubscriptionRecord,
  SubscriptionStatus,
  SupportTicket,
  TicketPriority,
  TicketStatus,
} from '../types/admin'

/**
 * Single in-memory demo store for the Super Admin panel (shared with the
 * owner console from Section 08 so subscription changes appear on both sides).
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

  /* Section 08 — platform collections */
  featuredRequests: FeaturedRequest[]
  advertisements: Advertisement[]
  settings: PlatformSettings
  platformTickets: PlatformTicket[]
  supportStaff: readonly string[]

  setPgStatus: (id: string, status: PgStatus, note?: string) => void
  setApplicationStatus: (id: string, status: ApplicationStatus, reason?: string) => void
  setOwnerStatus: (id: string, status: OwnerStatus) => void
  setStudentMembership: (id: string, membership: 'ACTIVE' | 'INACTIVE') => void
  updatePlan: (id: string, patch: Partial<PlanRecord>) => void
  createPlan: (plan: Omit<PlanRecord, 'id'>) => void
  /** Deletes a plan only when no non-terminal subscription depends on it. */
  deletePlan: (id: string) => { ok: boolean; reason?: string }
  planSubscriberCount: (planId: string) => number
  setSubscriptionStatus: (id: string, status: SubscriptionStatus) => void
  changeSubscriptionPlan: (id: string, planId: string) => void
  extendSubscription: (id: string, days: number) => void
  /** Suspend / reactivate without touching the underlying status. */
  setSubscriptionSuspended: (id: string, suspended: boolean) => void
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

  /* Section 08 — featured listings */
  submitFeaturedRequest: (input: {
    pgId: string
    pgName: string
    ownerName: string
    tier: FeaturedRequest['tier']
    amount: number
  }) => void
  decideFeaturedRequest: (
    id: string,
    decision: 'APPROVED' | 'REJECTED',
    options?: { durationMonths?: number; reason?: string },
  ) => void
  setFeaturedListingStatus: (id: string, status: FeaturedListingStatus) => void

  /* Section 08 — advertisements */
  createAdvertisement: (input: Omit<Advertisement, 'id' | 'createdOn'>) => void
  updateAdvertisement: (id: string, patch: Partial<Advertisement>) => void
  setAdvertisementStatus: (id: string, status: Advertisement['status']) => void
  deleteAdvertisement: (id: string) => void

  /* Section 08 — settings */
  saveSettings: (patch: Partial<PlatformSettings>) => void
  resetSettings: () => void

  /* Section 08 — platform support */
  assignPlatformTicket: (id: string, staff: string | null) => void
  setPlatformTicketPriority: (id: string, priority: TicketPriority) => void
  addPlatformTicketReply: (id: string, text: string, role: 'Admin' | 'User') => void
  setPlatformTicketStatus: (id: string, status: PlatformTicketStatus) => void

  /** Activity feed used by both Section 03 widgets and the Section 08 log. */
  logActivity: (
    text: string,
    kind: ActivityItem['kind'],
    extra?: Partial<Pick<ActivityItem, 'admin' | 'action' | 'entity' | 'description' | 'at'>>,
  ) => void

  pushToast: (message: string, tone?: AdminToast['tone']) => void
  dismissToast: (id: number) => void
}

const AdminStoreContext = createContext<AdminStoreValue | null>(null)

const TODAY = new Date('2026-05-14T00:00:00')
const TODAY_ISO = TODAY.toISOString().slice(0, 10)
const DEMO_ADMIN = 'Super Admin (demo)'

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const uid = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

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

  /* Section 08 state */
  const [featuredRequests, setFeaturedRequests] = useState<FeaturedRequest[]>(FEATURED_REQUESTS)
  const [advertisements, setAdvertisements] = useState<Advertisement[]>(ADVERTISEMENTS)
  const [settings, setSettings] = useState<PlatformSettings>({ ...PLATFORM_SETTINGS })
  const [platformTickets, setPlatformTickets] = useState<PlatformTicket[]>(PLATFORM_TICKETS)

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

  const logActivity = useCallback(
    (
      text: string,
      kind: ActivityItem['kind'],
      extra?: Partial<Pick<ActivityItem, 'admin' | 'action' | 'entity' | 'description' | 'at'>>,
    ) => {
      setActivities((prev) => [
        {
          id: uid('act'),
          text,
          time: 'just now',
          kind,
          admin: extra?.admin ?? DEMO_ADMIN,
          action: extra?.action ?? text,
          entity: extra?.entity ?? '—',
          description: extra?.description ?? text,
          at: extra?.at ?? `${TODAY_ISO} ${new Date().toTimeString().slice(0, 5)}`,
        },
        ...prev,
      ])
    },
    [],
  )

  const setPgStatus = useCallback(
    (id: string, status: PgStatus, note?: string) => {
      setPgs((prev) =>
        prev.map((pg) => (pg.id === id ? { ...pg, status, statusNote: note ?? pg.statusNote } : pg)),
      )
      const pg = pgs.find((p) => p.id === id)
      logActivity(`PG "${pg?.name ?? id}" marked ${status} (demo)`, 'pg', {
        action: 'PG status changed',
        entity: `${id} · ${pg?.name ?? ''}`,
        description: note ?? `Listing marked ${status} from PG Management (demo).`,
      })
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
      logActivity(`Application from "${app?.ownerName ?? id}" marked ${status} (demo)`, 'owner', {
        action: `Owner application ${status.toLowerCase()}`,
        entity: `${id} · ${app?.pgName ?? ''}`,
        description: reason ?? `Application marked ${status} (demo action).`,
      })
    },
    [applications, logActivity],
  )

  const setOwnerStatus = useCallback(
    (id: string, status: OwnerStatus) => {
      setOwners((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
      const owner = owners.find((o) => o.id === id)
      logActivity(
        `Owner "${owner?.name ?? id}" ${status === 'SUSPENDED' ? 'suspended' : 'reactivated'} (demo)`,
        'owner',
        { action: 'Owner status changed', entity: `${id} · ${owner?.name ?? ''}` },
      )
    },
    [owners, logActivity],
  )

  const setStudentMembership = useCallback(
    (id: string, membership: 'ACTIVE' | 'INACTIVE') => {
      setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, membership } : s)))
    },
    [],
  )

  const updatePlan = useCallback(
    (id: string, patch: Partial<PlanRecord>) => {
      setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
      const plan = plans.find((p) => p.id === id)
      logActivity(`Subscription plan "${plan?.name ?? id}" updated (demo)`, 'subscription', {
        action: 'Plan updated',
        entity: `${id} · ${plan?.name ?? ''}`,
        description: Object.keys(patch)
          .filter((k) => k !== 'featureToggles')
          .join(', ') + ' changed in the plan editor (demo).',
      })
    },
    [plans, logActivity],
  )

  const createPlan = useCallback(
    (plan: Omit<PlanRecord, 'id'>) => {
      const id = `plan-${Date.now()}`
      setPlans((prev) => [...prev, { ...plan, id }])
      logActivity(`New subscription plan "${plan.name}" created (demo)`, 'subscription', {
        action: 'Plan created',
        entity: id,
        description: `${plan.name} at ₹${plan.priceMonthly}/month created from Subscription Plans (demo).`,
      })
    },
    [logActivity],
  )

  const planSubscriberCount = useCallback(
    (planId: string) =>
      subscriptions.filter(
        (s) => s.planId === planId && s.status !== 'CANCELLED' && s.status !== 'EXPIRED',
      ).length,
    [subscriptions],
  )

  const deletePlan = useCallback(
    (id: string) => {
      const dependents = subscriptions.filter(
        (s) => s.planId === id && s.status !== 'CANCELLED' && s.status !== 'EXPIRED',
      )
      if (dependents.length > 0) {
        return {
          ok: false,
          reason: `${dependents.length} active subscription${dependents.length > 1 ? 's' : ''} depend on this plan. Change or cancel them first.`,
        }
      }
      setPlans((prev) => prev.filter((p) => p.id !== id))
      const plan = plans.find((p) => p.id === id)
      logActivity(`Subscription plan "${plan?.name ?? id}" deleted (demo)`, 'subscription', {
        action: 'Plan deleted',
        entity: id,
        description: 'No active subscriptions depended on this plan (demo action).',
      })
      return { ok: true }
    },
    [subscriptions, plans, logActivity],
  )

  const setSubscriptionStatus = useCallback(
    (id: string, status: SubscriptionStatus) => {
      setSubscriptions((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                status,
                events: [
                  { id: uid('evt'), on: TODAY_ISO, text: `Status set to ${status} by admin (demo).` },
                  ...s.events,
                ],
              }
            : s,
        ),
      )
      const sub = subscriptions.find((s) => s.id === id)
      logActivity(`Subscription for "${sub?.pgName ?? id}" set to ${status} (demo)`, 'subscription', {
        action: 'Subscription status changed',
        entity: `${id} · ${sub?.pgName ?? ''}`,
        description: `Status changed to ${status} (demo action).`,
      })
    },
    [subscriptions, logActivity],
  )

  const changeSubscriptionPlan = useCallback(
    (id: string, planId: string) => {
      const plan = plans.find((p) => p.id === planId)
      setSubscriptions((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                planId,
                amount: plan ? (s.cycle === 'YEARLY' ? plan.priceYearly : plan.priceMonthly) : s.amount,
                events: [
                  {
                    id: uid('evt'),
                    on: TODAY_ISO,
                    text: `Plan changed to ${plan?.name ?? planId} by admin (demo).`,
                  },
                  ...s.events,
                ],
              }
            : s,
        ),
      )
      const sub = subscriptions.find((s) => s.id === id)
      logActivity(
        `Subscription for "${sub?.pgName ?? id}" moved to ${plan?.name ?? planId} (demo)`,
        'subscription',
        { action: 'Plan changed', entity: `${id} · ${sub?.pgName ?? ''}` },
      )
    },
    [subscriptions, plans, logActivity],
  )

  const extendSubscription = useCallback(
    (id: string, days: number) => {
      setSubscriptions((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s
          const base = s.expiryOn < TODAY_ISO ? TODAY_ISO : s.expiryOn
          return {
            ...s,
            expiryOn: addDays(base, days),
            status: s.status === 'TRIAL' || s.status === 'PENDING' ? s.status : 'ACTIVE',
            events: [
              { id: uid('evt'), on: TODAY_ISO, text: `Expiry extended by ${days} days (demo).` },
              ...s.events,
            ],
          }
        }),
      )
      const sub = subscriptions.find((s) => s.id === id)
      logActivity(
        `Subscription for "${sub?.pgName ?? id}" extended by ${days} days (demo)`,
        'subscription',
        { action: 'Subscription extended', entity: `${id} · ${sub?.pgName ?? ''}` },
      )
    },
    [subscriptions, logActivity],
  )

  const setSubscriptionSuspended = useCallback(
    (id: string, suspended: boolean) => {
      setSubscriptions((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                suspended,
                events: [
                  {
                    id: uid('evt'),
                    on: TODAY_ISO,
                    text: suspended
                      ? 'Subscription suspended by admin (demo).'
                      : 'Subscription reactivated by admin (demo).',
                  },
                  ...s.events,
                ],
              }
            : s,
        ),
      )
      const sub = subscriptions.find((s) => s.id === id)
      logActivity(
        `Subscription for "${sub?.pgName ?? id}" ${suspended ? 'suspended' : 'reactivated'} (demo)`,
        'subscription',
        { action: suspended ? 'Subscription suspended' : 'Subscription reactivated', entity: id },
      )
    },
    [subscriptions, logActivity],
  )

  const setTicketStatus = useCallback((id: string, status: TicketStatus) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
  }, [])

  const addTicketNote = useCallback((id: string, text: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              notes: [...t.notes, { id: `note-${Date.now()}`, text, on: TODAY_ISO }],
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
        { id: `ntf-${Date.now()}`, ...input, sentOn: TODAY_ISO, read: false },
        ...prev,
      ])
      logActivity(`Announcement "${input.title}" recorded (demo, nothing sent)`, 'subscription')
    },
    [logActivity],
  )

  /* ------------------------------------------------- Section 08 — featured */

  const submitFeaturedRequest = useCallback(
    (input: {
      pgId: string
      pgName: string
      ownerName: string
      tier: FeaturedRequest['tier']
      amount: number
    }) => {
      const id = `FLT-${Date.now().toString().slice(-6)}`
      setFeaturedRequests((prev) => [
        {
          id,
          ...input,
          requestedOn: TODAY_ISO,
          status: 'PENDING',
          history: [
            { id: uid('fh'), on: TODAY_ISO, text: 'Owner submitted a featured request (demo).' },
          ],
        },
        ...prev,
      ])
      logActivity(`Featured request ${id} submitted for "${input.pgName}" (demo)`, 'platform', {
        action: 'Featured listing requested',
        entity: `${id} · ${input.pgName}`,
        description: `${input.tier.replace('_', ' ')} placement requested at ₹${input.amount}/month (demo).`,
      })
    },
    [logActivity],
  )

  const decideFeaturedRequest = useCallback(
    (
      id: string,
      decision: 'APPROVED' | 'REJECTED',
      options?: { durationMonths?: number; reason?: string },
    ) => {
      const request = featuredRequests.find((r) => r.id === id)
      const months = options?.durationMonths ?? 1
      setFeaturedRequests((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r
          if (decision === 'REJECTED') {
            return {
              ...r,
              status: 'REJECTED',
              rejectReason: options?.reason,
              history: [
                { id: uid('fh'), on: TODAY_ISO, text: `Request rejected by Super Admin (demo).` },
                ...r.history,
              ],
            }
          }
          const startOn = TODAY_ISO
          const endOn = addDays(startOn, months * 30)
          return {
            ...r,
            status: 'APPROVED',
            durationMonths: months,
            startOn,
            endOn,
            listingStatus: 'ACTIVE',
            history: [
              {
                id: uid('fh'),
                on: TODAY_ISO,
                text: `Approved for a ${months}-month featured run (${startOn} → ${endOn}, demo).`,
              },
              ...r.history,
            ],
          }
        }),
      )
      logActivity(
        `Featured request ${id} for "${request?.pgName ?? ''}" ${decision.toLowerCase()} (demo)`,
        'platform',
        {
          action: decision === 'APPROVED' ? 'Featured listing approved' : 'Featured listing rejected',
          entity: `${id} · ${request?.pgName ?? ''}`,
          description:
            decision === 'APPROVED'
              ? `Promotion runs for ${months} month${months > 1 ? 's' : ''} (demo — no payment processed).`
              : (options?.reason ?? 'Request rejected (demo).'),
        },
      )
    },
    [featuredRequests, logActivity],
  )

  const setFeaturedListingStatus = useCallback(
    (id: string, status: FeaturedListingStatus) => {
      setFeaturedRequests((prev) =>
        prev.map((r) =>
          r.id === id && r.status === 'APPROVED'
            ? {
                ...r,
                listingStatus: status,
                history: [
                  {
                    id: uid('fh'),
                    on: TODAY_ISO,
                    text: `Listing ${status === 'ACTIVE' ? 'activated' : status === 'PAUSED' ? 'paused' : 'marked expired'} by admin (demo).`,
                  },
                  ...r.history,
                ],
              }
            : r,
        ),
      )
      const request = featuredRequests.find((r) => r.id === id)
      logActivity(`Featured listing ${id} set to ${status} (demo)`, 'platform', {
        action: 'Featured listing status changed',
        entity: `${id} · ${request?.pgName ?? ''}`,
        description: `Admin set the featured listing to ${status} (demo).`,
      })
    },
    [featuredRequests, logActivity],
  )

  /* --------------------------------------------- Section 08 — advertisements */

  const createAdvertisement = useCallback(
    (input: Omit<Advertisement, 'id' | 'createdOn'>) => {
      const id = `AD-${Date.now().toString().slice(-6)}`
      setAdvertisements((prev) => [{ ...input, id, createdOn: TODAY_ISO }, ...prev])
      logActivity(`Advertisement campaign ${id} created for "${input.businessName}" (demo)`, 'platform', {
        action: 'Advertisement created',
        entity: `${id} · ${input.businessName}`,
        description: `${input.category} campaign on ${input.placement} at ₹${input.price} (demo).`,
      })
    },
    [logActivity],
  )

  const updateAdvertisement = useCallback((id: string, patch: Partial<Advertisement>) => {
    setAdvertisements((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }, [])

  const setAdvertisementStatus = useCallback(
    (id: string, status: Advertisement['status']) => {
      setAdvertisements((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
      const ad = advertisements.find((a) => a.id === id)
      logActivity(`Advertisement ${id} marked ${status} (demo)`, 'platform', {
        action: 'Advertisement status changed',
        entity: `${id} · ${ad?.businessName ?? ''}`,
        description: `Campaign marked ${status} (demo).`,
      })
    },
    [advertisements, logActivity],
  )

  const deleteAdvertisement = useCallback(
    (id: string) => {
      const ad = advertisements.find((a) => a.id === id)
      setAdvertisements((prev) => prev.filter((a) => a.id !== id))
      logActivity(`Advertisement ${id} deleted (demo)`, 'platform', {
        action: 'Advertisement deleted',
        entity: id,
        description: `Campaign for "${ad?.businessName ?? ''}" removed (demo).`,
      })
    },
    [advertisements, logActivity],
  )

  /* --------------------------------------------------- Section 08 — settings */

  const saveSettings = useCallback(
    (patch: Partial<PlatformSettings>) => {
      setSettings((prev) => ({ ...prev, ...patch }))
      logActivity('Platform settings updated (demo)', 'platform', {
        action: 'Settings updated',
        entity: 'admin/settings',
        description: `Changed: ${Object.keys(patch).join(', ')} (saved to local demo state only).`,
      })
    },
    [logActivity],
  )

  const resetSettings = useCallback(() => {
    setSettings({ ...PLATFORM_SETTINGS })
    logActivity('Platform settings reset to demo defaults', 'platform', {
      action: 'Settings reset',
      entity: 'admin/settings',
      description: 'All settings restored to the original demo defaults.',
    })
  }, [logActivity])

  /* --------------------------------------------- Section 08 — platform support */

  const assignPlatformTicket = useCallback(
    (id: string, staff: string | null) => {
      setPlatformTickets((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                assignedTo: staff,
                replies: staff
                  ? [
                      ...t.replies,
                      {
                        id: uid('r'),
                        author: DEMO_ADMIN,
                        role: 'Admin' as const,
                        text: `Ticket assigned to ${staff} (demo).`,
                        on: TODAY_ISO,
                      },
                    ]
                  : t.replies,
              }
            : t,
        ),
      )
      logActivity(`Support ticket ${id} ${staff ? `assigned to ${staff}` : 'unassigned'} (demo)`, 'support', {
        action: 'Ticket assigned',
        entity: id,
      })
    },
    [logActivity],
  )

  const setPlatformTicketPriority = useCallback(
    (id: string, priority: TicketPriority) => {
      setPlatformTickets((prev) => prev.map((t) => (t.id === id ? { ...t, priority } : t)))
      logActivity(`Support ticket ${id} priority set to ${priority} (demo)`, 'support', {
        action: 'Priority changed',
        entity: id,
      })
    },
    [logActivity],
  )

  const addPlatformTicketReply = useCallback(
    (id: string, text: string, role: 'Admin' | 'User') => {
      setPlatformTickets((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                replies: [
                  ...t.replies,
                  {
                    id: uid('r'),
                    author: role === 'Admin' ? DEMO_ADMIN : t.submittedBy,
                    role,
                    text,
                    on: TODAY_ISO,
                  },
                ],
              }
            : t,
        ),
      )
      if (role === 'Admin') {
        logActivity(`Response added to support ticket ${id} (demo)`, 'support', {
          action: 'Response added',
          entity: id,
          description: text,
        })
      }
    },
    [logActivity],
  )

  const setPlatformTicketStatus = useCallback(
    (id: string, status: PlatformTicketStatus) => {
      setPlatformTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
      if (status === 'RESOLVED') {
        logActivity(`Support ticket ${id} marked resolved (demo)`, 'support', {
          action: 'Support ticket resolved',
          entity: id,
          description: 'Ticket resolved from the platform support console (demo).',
        })
      }
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
      featuredRequests,
      advertisements,
      settings,
      platformTickets,
      supportStaff: SUPPORT_STAFF,
      setPgStatus,
      setApplicationStatus,
      setOwnerStatus,
      setStudentMembership,
      updatePlan,
      createPlan,
      deletePlan,
      planSubscriberCount,
      setSubscriptionStatus,
      changeSubscriptionPlan,
      extendSubscription,
      setSubscriptionSuspended,
      setTicketStatus,
      addTicketNote,
      markNotificationRead,
      markAllNotificationsRead,
      addNotification,
      submitFeaturedRequest,
      decideFeaturedRequest,
      setFeaturedListingStatus,
      createAdvertisement,
      updateAdvertisement,
      setAdvertisementStatus,
      deleteAdvertisement,
      saveSettings,
      resetSettings,
      assignPlatformTicket,
      setPlatformTicketPriority,
      addPlatformTicketReply,
      setPlatformTicketStatus,
      logActivity,
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
      featuredRequests,
      advertisements,
      settings,
      platformTickets,
      setPgStatus,
      setApplicationStatus,
      setOwnerStatus,
      setStudentMembership,
      updatePlan,
      createPlan,
      deletePlan,
      planSubscriberCount,
      setSubscriptionStatus,
      changeSubscriptionPlan,
      extendSubscription,
      setSubscriptionSuspended,
      setTicketStatus,
      addTicketNote,
      markNotificationRead,
      markAllNotificationsRead,
      addNotification,
      submitFeaturedRequest,
      decideFeaturedRequest,
      setFeaturedListingStatus,
      createAdvertisement,
      updateAdvertisement,
      setAdvertisementStatus,
      deleteAdvertisement,
      saveSettings,
      resetSettings,
      assignPlatformTicket,
      setPlatformTicketPriority,
      addPlatformTicketReply,
      setPlatformTicketStatus,
      logActivity,
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
