import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  CreditCard,
  GraduationCap,
  Layers,
  LifeBuoy,
  Receipt,
  Star,
  Users,
} from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdminStore } from '../../context/AdminStore'
import { MONTHS, SERIES, PLAN_DISTRIBUTION } from '../../data/adminData'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { StatCard } from '../../components/admin/StatCard'
import { BarChart, DonutChart, LineChart } from '../../components/admin/Charts'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { formatINR } from '../../utils/format'

const ACTIVITY_ICONS: Record<string, typeof Users> = {
  pg: Building2,
  owner: Users,
  student: GraduationCap,
  subscription: Layers,
  support: LifeBuoy,
  platform: Star,
}

/** /admin/platform — Section 08 SaaS platform overview (illustrative demo). */
export function PlatformOverview() {
  useDocumentTitle('Platform Overview')

  const { owners, pgs, students, subscriptions, payments, featuredRequests, platformTickets, activities, plans } =
    useAdminStore()

  const stats = useMemo(() => {
    const activeSubs = subscriptions.filter(
      (s) => s.status === 'ACTIVE' && !s.suspended,
    )
    const expiredSubs = subscriptions.filter((s) => s.status === 'EXPIRED')
    /* MRR = sum of monthly-equivalent value of active subscriptions (demo). */
    const mrr = activeSubs.reduce(
      (sum, s) => sum + (s.cycle === 'YEARLY' ? Math.round(s.amount / 12) : s.amount),
      0,
    )
    const featuredActive = featuredRequests.filter((r) => r.listingStatus === 'ACTIVE').length
    const openTickets = platformTickets.filter(
      (t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED',
    ).length
    return {
      totalOwners: owners.length,
      totalPgs: pgs.length,
      totalStudents: students.length,
      activeSubs: activeSubs.length,
      expiredSubs: expiredSubs.length,
      mrr,
      featuredActive,
      openTickets,
      totalTickets: platformTickets.length,
    }
  }, [owners, pgs, students, subscriptions, featuredRequests, platformTickets])

  const revenueData = useMemo(
    () => MONTHS.map((m, i) => ({ label: m, value: SERIES.revenue[i] })),
    [],
  )
  const ownerGrowthData = useMemo(
    () => MONTHS.map((m, i) => ({ label: m, value: SERIES.ownerRegistrations[i] })),
    [],
  )

  const recentPayments = useMemo(() => [...payments].slice(0, 5), [payments])
  const recentActivities = useMemo(() => activities.slice(0, 7), [activities])

  const planName = (id: string) => plans.find((p) => p.id === id)?.name ?? id.toUpperCase()

  return (
    <>
      <AdminPageHeader
        title="Platform Overview"
        description="SaaS health of the RahoMitra demo platform — owners, listings, students, subscriptions, recurring revenue and featured placements."
        actions={
          <>
            <Link
              to="/admin/subscriptions"
              className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory shadow-[0_10px_24px_-14px_rgba(23,61,50,0.9)] transition-all hover:bg-forest-light"
            >
              <Receipt className="h-4 w-4" aria-hidden />
              Subscriptions
            </Link>
            <Link
              to="/admin/platform-support"
              className="inline-flex items-center gap-2 rounded-full border border-forest/25 bg-white px-5 py-2.5 text-sm font-semibold text-forest transition-all hover:border-forest hover:bg-forest hover:text-ivory"
            >
              <LifeBuoy className="h-4 w-4" aria-hidden />
              Support inbox
            </Link>
          </>
        }
      />

      <DemoBanner message="every figure on this screen is computed from local illustrative demo records — not live business performance." />

      {/* ------------------------------------------------------- stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 2xl:grid-cols-8">
        <StatCard label="Registered Owners" value={stats.totalOwners} icon={Users} hint="Demo accounts" />
        <StatCard label="PG Properties" value={stats.totalPgs} icon={Building2} tone="ink" hint="Listings on record" />
        <StatCard label="Registered Students" value={stats.totalStudents} icon={GraduationCap} tone="gold" hint="Demo accounts" />
        <StatCard label="Active Subscriptions" value={stats.activeSubs} icon={Layers} hint="Paid demo plans" />
        <StatCard
          label="Expired Subscriptions"
          value={stats.expiredSubs}
          icon={CreditCard}
          tone="danger"
          hint="Needs renewal"
        />
        <StatCard label="Monthly Recurring Revenue" value={formatINR(stats.mrr)} icon={Receipt} tone="forest" hint="Illustrative MRR" />
        <StatCard label="Featured PG Listings" value={stats.featuredActive} icon={Star} tone="gold" hint="Approved + active" />
        <StatCard
          label="Platform Support Requests"
          value={stats.openTickets}
          icon={LifeBuoy}
          tone={stats.openTickets > 0 ? 'danger' : 'ink'}
          hint={`${stats.totalTickets} total demo tickets`}
        />
      </div>

      {/* ------------------------------------------------------------ charts */}
      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card xl:col-span-2 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base sm:text-lg">Monthly subscription revenue</h2>
            <span className="rounded-full bg-ivory px-3 py-1 text-[11px] font-bold text-ink-soft">
              ₹ · demo
            </span>
          </div>
          <LineChart
            data={revenueData}
            color="#C49A52"
            valuePrefix="₹"
            ariaLabel="Line chart of monthly subscription revenue (demo)"
          />
        </section>

        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base sm:text-lg">Subscription distribution</h2>
            <span className="rounded-full bg-ivory px-3 py-1 text-[11px] font-bold text-ink-soft">
              by plan · demo
            </span>
          </div>
          <DonutChart
            data={PLAN_DISTRIBUTION}
            centerLabel="SUBS"
            ariaLabel="Donut chart of subscription distribution by plan (demo)"
          />
        </section>

        <section className="rounded-3xl border border-line bg-white p-5 shadow-card xl:col-span-2 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base sm:text-lg">Owner registration growth</h2>
            <span className="rounded-full bg-ivory px-3 py-1 text-[11px] font-bold text-ink-soft">
              new owners / month · demo
            </span>
          </div>
          <BarChart
            data={ownerGrowthData}
            color="#173D32"
            ariaLabel="Bar chart of owner registration growth (demo)"
          />
        </section>
      </div>

      {/* --------------------------------------------------- activity + txn */}
      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base sm:text-lg">Recent platform activities</h2>
            <Link
              to="/admin/activity-logs"
              className="inline-flex items-center gap-1 text-xs font-bold text-forest transition-colors hover:text-gold-dark"
            >
              View log <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          <ul className="space-y-3.5">
            {recentActivities.map((activity) => {
              const Icon = ACTIVITY_ICONS[activity.kind] ?? Star
              return (
                <li key={activity.id} className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-forest-soft text-forest">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] leading-snug text-ink-soft">{activity.text}</span>
                    <span className="block text-[11px] text-ink-mute">{activity.time}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base sm:text-lg">Recent subscription transactions</h2>
            <Link
              to="/admin/payments"
              className="inline-flex items-center gap-1 text-xs font-bold text-forest transition-colors hover:text-gold-dark"
            >
              View all <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          <ul className="space-y-3">
            {recentPayments.map((payment) => (
              <li
                key={payment.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-ivory/40 px-4 py-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">{payment.pgName}</span>
                  <span className="block truncate text-[11.5px] text-ink-mute">
                    {payment.id} · {planName(payment.planId)} · {payment.paidOn}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2.5">
                  <span className="text-sm font-bold tabular-nums text-forest">{formatINR(payment.amount)}</span>
                  <StatusBadge status={payment.status} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <p className="mt-6 flex items-center gap-2 text-[11.5px] text-ink-mute">
        <Star className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
        Frontend-only demo — all figures derive from local sample data and reset on reload.
      </p>
    </>
  )
}
