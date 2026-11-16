import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  ActivityItem,
  AdminPg,
  AdminToast,
  Advertisement,
  ApplicationStatus,
  FeaturedRequest,
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
import {
  fetchAdminApplications,
  decideAdminApplication,
  fetchAdminPgs,
  setAdminPgStatus,
  fetchAdminOwners,
  setAdminOwnerStatus,
  fetchAdminStudents,
  setAdminStudentMembership,
  fetchAdminPlans,
  createAdminPlan,
  updateAdminPlan,
  deleteAdminPlan,
  fetchAdminSubscriptions,
  updateAdminSubscription,
  fetchAdminPayments,
  fetchAdminFeaturedRequests,
  submitAdminFeaturedRequest,
  decideAdminFeaturedRequest,
  setAdminFeaturedListingStatus,
  fetchAdminAdvertisements,
  createAdminAdvertisement,
  updateAdminAdvertisement,
  setAdminAdvertisementStatus,
  deleteAdminAdvertisement,
  fetchAdminSettings,
  saveAdminSettings,
  resetAdminSettings,
  fetchAdminActivities,
  fetchAdminTickets,
  setAdminTicketStatus,
  setAdminTicketPriority,
  assignAdminTicket,
  addAdminTicketReply,
  fetchAdminNotifications,
  createAdminNotification,
} from '../api/admin'
import { useAuth } from './AuthContext'

export interface AdminStoreValue {
  loading: boolean
  refresh: () => Promise<void>
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
  resetSettings: () => PlatformSettings

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

const TODAY_ISO = new Date().toISOString().slice(0, 10)
const DEMO_ADMIN = 'Super Admin'

const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  platformName: 'RahoMitra',
  hindiName: 'रहोमित्र',
  tagline: 'Your Trusted PG Companion',
  description: 'A dedicated PG accommodation and tenant management platform for India.',
  supportEmail: 'support@rahomitra.com',
  supportPhone: '+91 80000 12345',
  currency: 'INR',
  country: 'India',
  timezone: 'Asia/Kolkata',
  logoPreview: '/RahoMitra_logo.png',
  faviconPreview: '/RahoMitra_logo.png',
  brandColors: {
    forest: '#173D32',
    ivory: '#F5F1E7',
    gold: '#C49A52',
    dark: '#252A27',
  },
  websiteTitle: 'RahoMitra — Find your perfect PG',
  footerDescription:
    'RahoMitra helps students discover PG accommodation and helps owners manage their properties.',
  trialDurationDays: 14,
  gracePeriodDays: 7,
  featuredPrice: 299,
  premiumFeaturedPrice: 499,
  adPriceBase: 999,
  notify: {
    newOwnerApplication: true,
    newPgApproval: true,
    newStudentRegistration: false,
    newComplaint: true,
    subscriptionExpiry: true,
    featuredRequest: true,
  },
  maintenanceMode: false,
  maintenanceMessage: 'Platform is currently undergoing scheduled maintenance.',
}

const PLATFORM_SETTINGS = DEFAULT_PLATFORM_SETTINGS

const SUPPORT_STAFF = [
  'Anjali Verma',
  'Rohit Malhotra',
  'Kiran Joshi',
] as const

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const uid = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [pgs, setPgs] = useState<AdminPg[]>([])
  const [applications, setApplications] = useState<OwnerApplication[]>([])
  const [owners, setOwners] = useState<OwnerRecord[]>([])
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [plans, setPlans] = useState<PlanRecord[]>([])
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [notifications, setNotifications] = useState<PlatformNotification[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])

  /* Section 08 state */
  const [featuredRequests, setFeaturedRequests] = useState<FeaturedRequest[]>([])
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([])
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS)
  const [platformTickets, setPlatformTickets] = useState<PlatformTicket[]>([])

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

  /* ------------------------------------------------------------- Refresh / Initial Load */
  const refresh = useCallback(async () => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) return
    try {
      setLoading(true)

      if (user.role === 'ADMIN') {
        const [
          appsData,
          pgsData,
          ownersData,
          studentsData,
          plansData,
          subsData,
          paymentsData,
          featuredData,
          adsData,
          settingsData,
          actsData,
          ticketsData,
          notifsData,
        ] = await Promise.allSettled([
          fetchAdminApplications(),
          fetchAdminPgs(),
          fetchAdminOwners(),
          fetchAdminStudents(),
          fetchAdminPlans(),
          fetchAdminSubscriptions(),
          fetchAdminPayments(),
          fetchAdminFeaturedRequests(),
          fetchAdminAdvertisements(),
          fetchAdminSettings(),
          fetchAdminActivities(),
          fetchAdminTickets(),
          fetchAdminNotifications(),
        ])

        if (appsData.status === 'fulfilled') setApplications(appsData.value)
        if (pgsData.status === 'fulfilled') setPgs(pgsData.value)
        if (ownersData.status === 'fulfilled') setOwners(ownersData.value)
        if (studentsData.status === 'fulfilled') setStudents(studentsData.value)
        if (plansData.status === 'fulfilled') setPlans(plansData.value)
        if (subsData.status === 'fulfilled') setSubscriptions(subsData.value)
        if (paymentsData.status === 'fulfilled') setPayments(paymentsData.value)
        if (featuredData.status === 'fulfilled') setFeaturedRequests(featuredData.value)
        if (adsData.status === 'fulfilled') setAdvertisements(adsData.value)
        if (settingsData.status === 'fulfilled') setSettings(settingsData.value)
        if (actsData.status === 'fulfilled') setActivities(actsData.value)
        if (ticketsData.status === 'fulfilled') setPlatformTickets(ticketsData.value)
        if (notifsData.status === 'fulfilled') setNotifications(notifsData.value)
      } else if (user.role === 'OWNER') {
        // Owners can fetch public plans and featured requests
        const [plansData, featuredData] = await Promise.allSettled([
          fetchAdminPlans(),
          fetchAdminFeaturedRequests(),
        ])
        if (plansData.status === 'fulfilled') setPlans(plansData.value)
        if (featuredData.status === 'fulfilled') setFeaturedRequests(featuredData.value)
      }
    } catch {
      // Keep existing data on error
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user?.role === 'ADMIN' || user?.role === 'OWNER') {
      refresh()
    }
  }, [user?.role, refresh])

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
          admin: extra?.admin ?? (user?.fullName || DEMO_ADMIN),
          action: extra?.action ?? text,
          entity: extra?.entity ?? '—',
          description: extra?.description ?? text,
          at: extra?.at ?? `${TODAY_ISO} ${new Date().toTimeString().slice(0, 5)}`,
        },
        ...prev,
      ])
    },
    [user?.fullName],
  )

  const setPgStatus = useCallback(
    (id: string, status: PgStatus, note?: string) => {
      setPgs((prev) =>
        prev.map((pg) => (pg.id === id ? { ...pg, status, statusNote: note ?? pg.statusNote } : pg)),
      )
      const pg = pgs.find((p) => p.id === id)
      logActivity(`PG "${pg?.name ?? id}" marked ${status}`, 'pg', {
        action: 'PG status changed',
        entity: `${id} · ${pg?.name ?? ''}`,
        description: note ?? `Listing marked ${status} from PG Management.`,
      })
      setAdminPgStatus(id, status, note).catch((err: any) => {
        pushToast(err.message || 'Failed to update PG status', 'error')
        refresh()
      })
    },
    [pgs, logActivity, pushToast, refresh],
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
      logActivity(`Application from "${app?.ownerName ?? id}" marked ${status}`, 'owner', {
        action: `Owner application ${status.toLowerCase()}`,
        entity: `${id} · ${app?.pgName ?? ''}`,
        description: reason ?? `Application marked ${status}.`,
      })
      decideAdminApplication(id, status, reason).catch((err: any) => {
        pushToast(err.message || 'Failed to update application status', 'error')
        refresh()
      })
    },
    [applications, logActivity, pushToast, refresh],
  )

  const setOwnerStatus = useCallback(
    (id: string, status: OwnerStatus) => {
      setOwners((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
      const owner = owners.find((o) => o.id === id)
      logActivity(
        `Owner "${owner?.name ?? id}" ${status === 'SUSPENDED' ? 'suspended' : 'reactivated'}`,
        'owner',
        { action: 'Owner status changed', entity: `${id} · ${owner?.name ?? ''}` },
      )
      setAdminOwnerStatus(id, status).catch((err: any) => {
        pushToast(err.message || 'Failed to update owner status', 'error')
        refresh()
      })
    },
    [owners, logActivity, pushToast, refresh],
  )

  const setStudentMembership = useCallback(
    (id: string, membership: 'ACTIVE' | 'INACTIVE') => {
      setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, membership } : s)))
      setAdminStudentMembership(id, membership).catch((err: any) => {
        pushToast(err.message || 'Failed to update student membership', 'error')
        refresh()
      })
    },
    [pushToast, refresh],
  )

  const updatePlan = useCallback(
    (id: string, patch: Partial<PlanRecord>) => {
      setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
      const plan = plans.find((p) => p.id === id)
      logActivity(`Subscription plan "${plan?.name ?? id}" updated`, 'subscription', {
        action: 'Plan updated',
        entity: `${id} · ${plan?.name ?? ''}`,
        description: Object.keys(patch)
          .filter((k) => k !== 'featureToggles')
          .join(', ') + ' changed in the plan editor.',
      })
      updateAdminPlan(id, patch).catch((err: any) => {
        pushToast(err.message || 'Failed to update plan', 'error')
        refresh()
      })
    },
    [plans, logActivity, pushToast, refresh],
  )

  const createPlan = useCallback(
    (plan: Omit<PlanRecord, 'id'>) => {
      const tempId = `plan-${Date.now()}`
      setPlans((prev) => [...prev, { ...plan, id: tempId }])
      logActivity(`New subscription plan "${plan.name}" created`, 'subscription', {
        action: 'Plan created',
        entity: tempId,
        description: `${plan.name} at ₹${plan.priceMonthly}/month created from Subscription Plans.`,
      })
      createAdminPlan(plan)
        .then((created) => {
          setPlans((prev) => [...prev.filter((p) => p.id !== tempId), created])
        })
        .catch((err: any) => {
          pushToast(err.message || 'Failed to create plan', 'error')
          refresh()
        })
    },
    [logActivity, pushToast, refresh],
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
      logActivity(`Subscription plan "${plan?.name ?? id}" deleted`, 'subscription', {
        action: 'Plan deleted',
        entity: id,
        description: 'No active subscriptions depended on this plan.',
      })
      deleteAdminPlan(id).then((res) => {
        if (!res.ok) {
          pushToast(res.reason || 'Failed to delete plan', 'error')
          refresh()
        }
      })
      return { ok: true }
    },
    [subscriptions, plans, logActivity, pushToast, refresh],
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
                  { id: uid('evt'), on: TODAY_ISO, text: `Status set to ${status} by admin.` },
                  ...s.events,
                ],
              }
            : s,
        ),
      )
      const sub = subscriptions.find((s) => s.id === id)
      logActivity(`Subscription for "${sub?.pgName ?? id}" set to ${status}`, 'subscription', {
        action: 'Subscription status changed',
        entity: `${id} · ${sub?.pgName ?? ''}`,
        description: `Status changed to ${status}.`,
      })
      updateAdminSubscription(id, { status }).catch((err: any) => {
        pushToast(err.message || 'Failed to update subscription', 'error')
        refresh()
      })
    },
    [subscriptions, logActivity, pushToast, refresh],
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
                    text: `Plan changed to ${plan?.name ?? planId} by admin.`,
                  },
                  ...s.events,
                ],
              }
            : s,
        ),
      )
      const sub = subscriptions.find((s) => s.id === id)
      logActivity(
        `Subscription for "${sub?.pgName ?? id}" moved to ${plan?.name ?? planId}`,
        'subscription',
        { action: 'Plan changed', entity: `${id} · ${sub?.pgName ?? ''}` },
      )
      updateAdminSubscription(id, { planId }).catch((err: any) => {
        pushToast(err.message || 'Failed to change subscription plan', 'error')
        refresh()
      })
    },
    [subscriptions, plans, logActivity, pushToast, refresh],
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
              { id: uid('evt'), on: TODAY_ISO, text: `Expiry extended by ${days} days.` },
              ...s.events,
            ],
          }
        }),
      )
      const sub = subscriptions.find((s) => s.id === id)
      logActivity(
        `Subscription for "${sub?.pgName ?? id}" extended by ${days} days`,
        'subscription',
        { action: 'Subscription extended', entity: `${id} · ${sub?.pgName ?? ''}` },
      )
      updateAdminSubscription(id, { extendDays: days }).catch((err: any) => {
        pushToast(err.message || 'Failed to extend subscription', 'error')
        refresh()
      })
    },
    [subscriptions, logActivity, pushToast, refresh],
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
                      ? 'Subscription suspended by admin.'
                      : 'Subscription reactivated by admin.',
                  },
                  ...s.events,
                ],
              }
            : s,
        ),
      )
      const sub = subscriptions.find((s) => s.id === id)
      logActivity(
        `Subscription for "${sub?.pgName ?? id}" ${suspended ? 'suspended' : 'reactivated'}`,
        'subscription',
        { action: suspended ? 'Subscription suspended' : 'Subscription reactivated', entity: id },
      )
      updateAdminSubscription(id, { suspended }).catch((err: any) => {
        pushToast(err.message || 'Failed to update subscription', 'error')
        refresh()
      })
    },
    [subscriptions, logActivity, pushToast, refresh],
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
      const tempId = `ntf-${Date.now()}`
      setNotifications((prev) => [
        { id: tempId, ...input, sentOn: TODAY_ISO, read: false },
        ...prev,
      ])
      logActivity(`Announcement "${input.title}" recorded`, 'subscription')
      createAdminNotification(input)
        .then((created) => {
          setNotifications((prev) => [created, ...prev.filter((n) => n.id !== tempId)])
        })
        .catch((err: any) => {
          pushToast(err.message || 'Failed to send announcement', 'error')
          refresh()
        })
    },
    [logActivity, pushToast, refresh],
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
      const tempId = `FLT-${Date.now().toString().slice(-6)}`
      setFeaturedRequests((prev) => [
        {
          id: tempId,
          ...input,
          requestedOn: TODAY_ISO,
          status: 'PENDING',
          history: [
            { id: uid('fh'), on: TODAY_ISO, text: 'Owner submitted a featured request.' },
          ],
        },
        ...prev,
      ])
      logActivity(`Featured request ${tempId} submitted for "${input.pgName}"`, 'platform', {
        action: 'Featured listing requested',
        entity: `${tempId} · ${input.pgName}`,
        description: `${input.tier.replace('_', ' ')} placement requested at ₹${input.amount}/month.`,
      })
      submitAdminFeaturedRequest(input)
        .then((created) => {
          setFeaturedRequests((prev) => [created, ...prev.filter((r) => r.id !== tempId)])
        })
        .catch((err: any) => {
          pushToast(err.message || 'Failed to submit featured request', 'error')
          refresh()
        })
    },
    [logActivity, pushToast, refresh],
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
                { id: uid('fh'), on: TODAY_ISO, text: `Request rejected by Super Admin.` },
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
                text: `Approved for a ${months}-month featured run (${startOn} → ${endOn}).`,
              },
              ...r.history,
            ],
          }
        }),
      )
      logActivity(
        `Featured request ${id} for "${request?.pgName ?? ''}" ${decision.toLowerCase()}`,
        'platform',
        {
          action: decision === 'APPROVED' ? 'Featured listing approved' : 'Featured listing rejected',
          entity: `${id} · ${request?.pgName ?? ''}`,
          description:
            decision === 'APPROVED'
              ? `Promotion runs for ${months} month${months > 1 ? 's' : ''}.`
              : (options?.reason ?? 'Request rejected.'),
        },
      )
      decideAdminFeaturedRequest(id, decision, options).catch((err: any) => {
        pushToast(err.message || 'Failed to decide featured request', 'error')
        refresh()
      })
    },
    [featuredRequests, logActivity, pushToast, refresh],
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
                    text: `Listing ${status === 'ACTIVE' ? 'activated' : status === 'PAUSED' ? 'paused' : 'marked expired'} by admin.`,
                  },
                  ...r.history,
                ],
              }
            : r,
        ),
      )
      const request = featuredRequests.find((r) => r.id === id)
      logActivity(`Featured listing ${id} set to ${status}`, 'platform', {
        action: 'Featured listing status changed',
        entity: `${id} · ${request?.pgName ?? ''}`,
        description: `Admin set the featured listing to ${status}.`,
      })
      setAdminFeaturedListingStatus(id, status).catch((err: any) => {
        pushToast(err.message || 'Failed to update featured listing status', 'error')
        refresh()
      })
    },
    [featuredRequests, logActivity, pushToast, refresh],
  )

  /* --------------------------------------------- Section 08 — advertisements */

  const createAdvertisement = useCallback(
    (input: Omit<Advertisement, 'id' | 'createdOn'>) => {
      const tempId = `AD-${Date.now().toString().slice(-6)}`
      setAdvertisements((prev) => [{ ...input, id: tempId, createdOn: TODAY_ISO }, ...prev])
      logActivity(`Advertisement campaign ${tempId} created for "${input.businessName}"`, 'platform', {
        action: 'Advertisement created',
        entity: `${tempId} · ${input.businessName}`,
        description: `${input.category} campaign on ${input.placement} at ₹${input.price}.`,
      })
      createAdminAdvertisement(input)
        .then((created) => {
          setAdvertisements((prev) => [created, ...prev.filter((a) => a.id !== tempId)])
        })
        .catch((err: any) => {
          pushToast(err.message || 'Failed to create advertisement', 'error')
          refresh()
        })
    },
    [logActivity, pushToast, refresh],
  )

  const updateAdvertisement = useCallback(
    (id: string, patch: Partial<Advertisement>) => {
      setAdvertisements((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
      updateAdminAdvertisement(id, patch).catch((err: any) => {
        pushToast(err.message || 'Failed to update advertisement', 'error')
        refresh()
      })
    },
    [pushToast, refresh],
  )

  const setAdvertisementStatus = useCallback(
    (id: string, status: Advertisement['status']) => {
      setAdvertisements((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
      const ad = advertisements.find((a) => a.id === id)
      logActivity(`Advertisement ${id} marked ${status}`, 'platform', {
        action: 'Advertisement status changed',
        entity: `${id} · ${ad?.businessName ?? ''}`,
        description: `Campaign marked ${status}.`,
      })
      setAdminAdvertisementStatus(id, status).catch((err: any) => {
        pushToast(err.message || 'Failed to update advertisement status', 'error')
        refresh()
      })
    },
    [advertisements, logActivity, pushToast, refresh],
  )

  const deleteAdvertisement = useCallback(
    (id: string) => {
      const ad = advertisements.find((a) => a.id === id)
      setAdvertisements((prev) => prev.filter((a) => a.id !== id))
      logActivity(`Advertisement ${id} deleted`, 'platform', {
        action: 'Advertisement deleted',
        entity: id,
        description: `Campaign for "${ad?.businessName ?? ''}" removed.`,
      })
      deleteAdminAdvertisement(id).catch((err: any) => {
        pushToast(err.message || 'Failed to delete advertisement', 'error')
        refresh()
      })
    },
    [advertisements, logActivity, pushToast, refresh],
  )

  /* --------------------------------------------------- Section 08 — settings */

  const saveSettings = useCallback(
    (patch: Partial<PlatformSettings>) => {
      setSettings((prev) => ({ ...prev, ...patch }))
      logActivity('Platform settings updated', 'platform', {
        action: 'Settings updated',
        entity: 'admin/settings',
        description: `Changed: ${Object.keys(patch).join(', ')}.`,
      })
      saveAdminSettings(patch).catch((err: any) => {
        pushToast(err.message || 'Failed to save settings', 'error')
        refresh()
      })
    },
    [logActivity, pushToast, refresh],
  )

  const resetSettings = useCallback(() => {
    const defaults: PlatformSettings = {
      ...PLATFORM_SETTINGS,
      brandColors: { ...PLATFORM_SETTINGS.brandColors },
      notify: { ...PLATFORM_SETTINGS.notify },
    }
    setSettings(defaults)
    logActivity('Platform settings reset to defaults', 'platform', {
      action: 'Settings reset',
      entity: 'admin/settings',
      description: 'All settings restored to defaults.',
    })
    resetAdminSettings()
      .then((res) => setSettings(res))
      .catch((err: any) => {
        pushToast(err.message || 'Failed to reset settings', 'error')
        refresh()
      })
    return defaults
  }, [logActivity, pushToast, refresh])

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
                        author: user?.fullName || DEMO_ADMIN,
                        role: 'Admin' as const,
                        text: `Ticket assigned to ${staff}.`,
                        on: TODAY_ISO,
                      },
                    ]
                  : t.replies,
              }
            : t,
        ),
      )
      logActivity(`Support ticket ${id} ${staff ? `assigned to ${staff}` : 'unassigned'}`, 'support', {
        action: 'Ticket assigned',
        entity: id,
      })
      assignAdminTicket(id, staff).catch((err: any) => {
        pushToast(err.message || 'Failed to assign ticket', 'error')
        refresh()
      })
    },
    [user?.fullName, logActivity, pushToast, refresh],
  )

  const setPlatformTicketPriority = useCallback(
    (id: string, priority: TicketPriority) => {
      setPlatformTickets((prev) => prev.map((t) => (t.id === id ? { ...t, priority } : t)))
      logActivity(`Support ticket ${id} priority set to ${priority}`, 'support', {
        action: 'Priority changed',
        entity: id,
      })
      setAdminTicketPriority(id, priority).catch((err: any) => {
        pushToast(err.message || 'Failed to change ticket priority', 'error')
        refresh()
      })
    },
    [logActivity, pushToast, refresh],
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
                    author: role === 'Admin' ? (user?.fullName || DEMO_ADMIN) : t.submittedBy,
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
        logActivity(`Response added to support ticket ${id}`, 'support', {
          action: 'Response added',
          entity: id,
          description: text,
        })
      }
      addAdminTicketReply(id, text, role).catch((err: any) => {
        pushToast(err.message || 'Failed to send ticket reply', 'error')
        refresh()
      })
    },
    [user?.fullName, logActivity, pushToast, refresh],
  )

  const setPlatformTicketStatus = useCallback(
    (id: string, status: PlatformTicketStatus) => {
      setPlatformTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
      if (status === 'RESOLVED') {
        logActivity(`Support ticket ${id} marked resolved`, 'support', {
          action: 'Support ticket resolved',
          entity: id,
          description: 'Ticket resolved from the platform support console.',
        })
      }
      setAdminTicketStatus(id, status).catch((err: any) => {
        pushToast(err.message || 'Failed to set ticket status', 'error')
        refresh()
      })
    },
    [logActivity, pushToast, refresh],
  )

  const value = useMemo<AdminStoreValue>(
    () => ({
      loading,
      refresh,
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
      loading,
      refresh,
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
