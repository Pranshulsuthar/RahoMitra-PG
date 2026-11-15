import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileX2,
  GraduationCap,
  Layers,
  Megaphone,
  Plus,
  Star,
  UserCheck,
  Users,
} from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdminStore } from '../../context/AdminStore'
import { MONTHS, SERIES } from '../../data/adminData'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { StatCard } from '../../components/admin/StatCard'
import { BarChart, LineChart } from '../../components/admin/Charts'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { cn } from '../../utils/cn'

const ACTIVITY_ICONS = {
  pg: Building2,
  owner: UserCheck,
  student: GraduationCap,
  subscription: Layers,
  support: Clock,
  platform: Star,
}

/** /admin/dashboard — platform overview with clearly-labelled demo data. */
export function AdminDashboard() {
  useDocumentTitle('Admin Dashboard')

  const { pgs, applications, owners, students, subscriptions, activities } = useAdminStore()

  const stats = useMemo(() => {
    const approved = pgs.filter((p) => p.status === 'APPROVED').length
    const pendingApps = applications.filter((a) => a.status === 'PENDING').length
    return {
      totalPgs: pgs.length,
      pendingApps,
      approved,
      rejected: applications.filter((a) => a.status === 'REJECTED').length,
      totalOwners: owners.length,
      totalStudents: students.length,
      activeSubs: subscriptions.filter((s) => s.status === 'ACTIVE').length,
      expiringSubs: subscriptions.filter((s) => s.status === 'EXPIRING_SOON').length,
    }
  }, [pgs, applications, owners, students, subscriptions])

  const recentApplications = useMemo(
    () => [...applications].sort((a, b) => b.submittedOn.localeCompare(a.submittedOn)).slice(0, 5),
    [applications],
  )

  const recentPgs = useMemo(
    () => [...pgs].sort((a, b) => b.registeredOn.localeCompare(a.registeredOn)).slice(0, 4),
    [pgs],
  )

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="A high-level view of listings, applications, subscriptions and platform activity."
        actions={
          <>
            <Link
              to="/admin/applications"
              className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory shadow-[0_10px_24px_-14px_rgba(23,61,50,0.9)] transition-all hover:bg-forest-light"
            >
              <ClipboardList className="h-4 w-4" aria-hidden />
              Review applications
            </Link>
            <Link
              to="/admin/pgs"
              className="inline-flex items-center gap-2 rounded-full border border-forest/25 bg-white px-5 py-2.5 text-sm font-semibold text-forest transition-all hover:border-forest hover:bg-forest hover:text-ivory"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Moderate PGs
            </Link>
          </>
        }
      />

      <DemoBanner message="all statistics below are illustrative samples — not live platform metrics." />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-4">
        <StatCard label="Total PGs" value={stats.totalPgs} icon={Building2} tone="forest" hint="Registered listings" />
        <StatCard label="Pending Applications" value={stats.pendingApps} icon={Clock} tone="gold" hint="Awaiting review" trend="up" />
        <StatCard label="Approved PGs" value={stats.approved} icon={CheckCircle2} tone="forest" hint="Live on the platform" />
        <StatCard label="Rejected Applications" value={stats.rejected} icon={FileX2} tone="danger" hint="Closed submissions" trend="down" />
        <StatCard label="Total Owners" value={stats.totalOwners} icon={Users} tone="ink" hint="Registered PG owners" />
        <StatCard label="Total Students" value={stats.totalStudents} icon={GraduationCap} tone="ink" hint="Student accounts" />
        <StatCard label="Active Subscriptions" value={stats.activeSubs} icon={Layers} tone="forest" hint="Paying demo plans" trend="up" />
        <StatCard label="Expiring Subscriptions" value={stats.expiringSubs} icon={Clock} tone="gold" hint="Renewal window" />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg">PG registrations</h2>
              <p className="mt-0.5 text-xs text-ink-mute">New listings per month · demo data</p>
            </div>
            <span className="rounded-full bg-forest-soft px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-forest">
              2026
            </span>
          </div>
          <BarChart
            data={MONTHS.map((m, i) => ({ label: m, value: SERIES.pgRegistrations[i] }))}
            ariaLabel="Bar chart of monthly PG registrations (demo data)"
          />
        </section>

        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg">Monthly subscriptions</h2>
              <p className="mt-0.5 text-xs text-ink-mute">Active owner subscriptions · demo data</p>
            </div>
            <span className="rounded-full bg-gold-soft px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-dark">
              Trend
            </span>
          </div>
          <LineChart
            data={MONTHS.map((m, i) => ({ label: m, value: SERIES.monthlySubscriptions[i] }))}
            ariaLabel="Line chart of monthly active subscriptions (demo data)"
          />
        </section>
      </div>

      {/* Lists */}
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {/* Recent applications */}
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base sm:text-lg">Recent owner applications</h2>
            <Link
              to="/admin/applications"
              className="inline-flex items-center gap-1 text-xs font-bold text-forest transition-colors hover:text-gold-dark"
            >
              View all <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          <ul className="space-y-3">
            {recentApplications.map((app) => (
              <li
                key={app.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-ivory/40 px-4 py-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">{app.ownerName}</span>
                  <span className="block truncate text-[11.5px] text-ink-mute">
                    {app.pgName} · {app.submittedOn}
                  </span>
                </span>
                <StatusBadge status={app.status} />
              </li>
            ))}
          </ul>
        </section>

        {/* Recently added PGs */}
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base sm:text-lg">Recently added PGs</h2>
            <Link
              to="/admin/pgs"
              className="inline-flex items-center gap-1 text-xs font-bold text-forest transition-colors hover:text-gold-dark"
            >
              View all <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          <ul className="space-y-3">
            {recentPgs.map((pg) => (
              <li key={pg.id} className="flex items-center gap-3 rounded-2xl border border-line bg-ivory/40 px-4 py-3">
                <img
                  src={pg.coverImage}
                  alt=""
                  loading="lazy"
                  className="h-11 w-11 shrink-0 rounded-xl object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{pg.name}</span>
                  <span className="block text-[11.5px] text-ink-mute">
                    {pg.city} · {pg.registeredOn}
                  </span>
                </span>
                <StatusBadge status={pg.status} />
              </li>
            ))}
          </ul>
        </section>

        {/* Platform activity */}
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base sm:text-lg">Platform activities</h2>
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-mute">Demo feed</span>
          </div>
          <ul className="space-y-3.5">
            {activities.slice(0, 6).map((activity) => {
              const Icon = ACTIVITY_ICONS[activity.kind]
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
      </div>

      {/* Quick actions */}
      <section className="mt-6 rounded-3xl border border-line bg-forest p-5 text-ivory shadow-card sm:p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <Megaphone className="h-5 w-5 text-gold" aria-hidden />
          <h2 className="text-base text-white sm:text-lg">Quick actions</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { to: '/admin/applications', label: 'Review owner applications', icon: ClipboardList },
            { to: '/admin/pgs', label: 'Moderate PG listings', icon: Building2 },
            { to: '/admin/notifications', label: 'Compose announcement', icon: Bell },
            { to: '/admin/reports', label: 'Open reports & analytics', icon: BarChart3 },
          ].map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className={cn(
                'group flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3.5',
                'text-sm font-semibold text-ivory transition-all duration-200 hover:border-gold/60 hover:bg-white/15',
              )}
            >
              <span className="flex items-center gap-2.5">
                <action.icon className="h-4 w-4 text-gold" aria-hidden />
                {action.label}
              </span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
