import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BedDouble,
  Building2,
  ClipboardCheck,
  CreditCard,
  Crown,
  DoorOpen,
  GraduationCap,
  Layers,
  PencilLine,
  Plus,
  Star,
  UserRound,
  Users,
} from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAuth } from '../../context/AuthContext'
import { aggregateRooms, useOwnerStore } from '../../context/OwnerStore'
import { useAdminStore } from '../../context/AdminStore'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { StatisticCard } from '../../components/owner/StatisticCard'
import { BarChart, DonutChart } from '../../components/admin/Charts'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { EmptyState } from '../../components/common/EmptyState'
import { formatINR } from '../../utils/format'
import { cn } from '../../utils/cn'

const ACTIVITY_ICONS = {
  admission: ClipboardCheck,
  room: BedDouble,
  property: Building2,
  student: Users,
  staff: UserRound,
}

/** /owner/dashboard — owner overview connected to real store/API data. */
export function OwnerDashboard() {
  useDocumentTitle('Owner Dashboard')

  const {
    properties,
    rooms,
    students,
    requests,
    activities,
    scopedProperties,
    scopedPropertyIds,
    selectedPropertyId,
  } = useOwnerStore()

  const scopedRooms = useMemo(
    () => rooms.filter((r) => scopedPropertyIds.includes(r.propertyId)),
    [rooms, scopedPropertyIds],
  )
  const scopedStudents = useMemo(
    () => students.filter((s) => scopedPropertyIds.includes(s.propertyId)),
    [students, scopedPropertyIds],
  )
  const scopedRequests = useMemo(
    () => requests.filter((r) => scopedPropertyIds.includes(r.propertyId)),
    [requests, scopedPropertyIds],
  )
  const scopedActivities = useMemo(
    () =>
      activities.filter(
        (a) => a.propertyId === null || scopedPropertyIds.includes(a.propertyId),
      ),
    [activities, scopedPropertyIds],
  )

  const totals = useMemo(() => aggregateRooms(scopedRooms), [scopedRooms])

  const stats = useMemo(
    () => ({
      properties: scopedProperties.length,
      rooms: totals.totalRooms,
      beds: totals.totalBeds,
      occupied: totals.occupied,
      available: totals.available,
      activeStudents: scopedStudents.filter((s) => s.membership === 'ACTIVE').length,
      pendingRequests: scopedRequests.filter((r) => r.status === 'PENDING').length,
      occupancyPct: totals.occupancyPct,
    }),
    [scopedProperties, totals, scopedStudents, scopedRequests],
  )

  const occupancyData = useMemo(
    () =>
      scopedProperties.map((p) => {
        const agg = aggregateRooms(rooms.filter((r) => r.propertyId === p.id))
        return { label: p.name.replace(' PG', ''), value: agg.occupancyPct }
      }),
    [scopedProperties, rooms],
  )

  const recentRequests = useMemo(
    () => [...scopedRequests].sort((a, b) => b.requestedOn.localeCompare(a.requestedOn)).slice(0, 4),
    [scopedRequests],
  )
  const recentStudents = useMemo(
    () => [...scopedStudents].sort((a, b) => b.admissionDate.localeCompare(a.admissionDate)).slice(0, 5),
    [scopedStudents],
  )

  const scopeLabel =
    selectedPropertyId === 'ALL'
      ? 'all of your properties'
      : (scopedProperties[0]?.name ?? 'the selected property')

  /* ------------------------------------------- Section 08 — business overview */
  const { user } = useAuth()
  const { subscriptions, plans, payments, featuredRequests } = useAdminStore()

  const mySubscription = useMemo(
    () => subscriptions.find((s) => s.ownerEmail === user?.email || s.ownerName === user?.name) ?? subscriptions[0],
    [subscriptions, user],
  )
  const myPlan = useMemo(
    () => plans.find((p) => p.id === mySubscription?.planId) ?? plans[0],
    [plans, mySubscription],
  )
  const propertyLimit = myPlan?.propertyLimit ?? 0
  const usedProperties = properties.length
  const usagePct = propertyLimit > 0 ? Math.min(100, Math.round((usedProperties / propertyLimit) * 100)) : 0

  const myInvoices = useMemo(
    () =>
      payments
        .filter((p) => p.ownerEmail === user?.email || p.ownerName === user?.name)
        .sort((a, b) => b.paidOn.localeCompare(a.paidOn))
        .slice(0, 3),
    [payments, user],
  )

  const myFeatured = useMemo(
    () =>
      featuredRequests.filter(
        (f) => f.ownerEmail === user?.email || f.ownerName === user?.name,
      ),
    [featuredRequests, user],
  )
  const liveFeatured = myFeatured.find((f) => f.status === 'APPROVED' && f.listingStatus === 'ACTIVE')

  const planBenefits = useMemo(() => (myPlan?.featureToggles ?? []).filter((f) => f.enabled), [myPlan])

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description={`A comprehensive overview of rooms, beds, residents and admissions across ${scopeLabel}.`}
        actions={
          <>
            <Link
              to="/owner/properties"
              className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory shadow-[0_10px_24px_-14px_rgba(23,61,50,0.9)] transition-all hover:bg-forest-light"
            >
              <Building2 className="h-4 w-4" aria-hidden />
              Manage properties
            </Link>
            <Link
              to="/owner/admissions"
              className="inline-flex items-center gap-2 rounded-full border border-forest/25 bg-white px-5 py-2.5 text-sm font-semibold text-forest transition-all hover:border-forest hover:bg-forest hover:text-ivory"
            >
              <ClipboardCheck className="h-4 w-4" aria-hidden />
              Admissions
            </Link>
          </>
        }
      />

      {/* ------------------------------------------------------- stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 2xl:grid-cols-8">
        <StatisticCard label="Total Properties" value={stats.properties} icon={Building2} tone="forest" />
        <StatisticCard label="Total Rooms" value={stats.rooms} icon={Layers} tone="ink" />
        <StatisticCard label="Total Beds" value={stats.beds} icon={BedDouble} tone="ink" />
        <StatisticCard label="Occupied Beds" value={stats.occupied} icon={DoorOpen} tone="gold" />
        <StatisticCard label="Available Beds" value={stats.available} icon={BedDouble} tone="forest" />
        <StatisticCard label="Active Students" value={stats.activeStudents} icon={GraduationCap} tone="forest" />
        <StatisticCard
          label="Pending Requests"
          value={stats.pendingRequests}
          icon={ClipboardCheck}
          tone={stats.pendingRequests > 0 ? 'danger' : 'ink'}
        />
        <StatisticCard
          label="Occupancy"
          value={`${stats.occupancyPct}%`}
          icon={UserRound}
          tone="gold"
        />
      </div>

      {/* ----------------------------------------------------------- charts */}
      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card xl:col-span-2 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base sm:text-lg">Property-wise occupancy</h2>
            <span className="rounded-full bg-ivory px-3 py-1 text-[11px] font-bold text-ink-soft">
              % beds occupied
            </span>
          </div>
          {occupancyData.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-mute">No properties in scope.</p>
          ) : (
            <BarChart
              data={occupancyData}
              maxValue={100}
              valueSuffix="%"
              ariaLabel="Property-wise occupancy percentage"
            />
          )}
        </section>

        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base sm:text-lg">Room availability</h2>
            <span className="rounded-full bg-ivory px-3 py-1 text-[11px] font-bold text-ink-soft">
              beds
            </span>
          </div>
          <DonutChart
            data={[
              { label: 'Occupied', value: totals.occupied, color: '#173D32' },
              { label: 'Available', value: totals.available, color: '#C49A52' },
              { label: 'Maintenance', value: totals.maintenance, color: '#8B928D' },
            ]}
            centerLabel={`${totals.totalBeds} beds`}
            ariaLabel="Bed availability donut chart"
          />
        </section>
      </div>

      {/* ------------------------------------- Section 08 — business overview */}
      {mySubscription && myPlan && (
        <section className="mt-6 overflow-hidden rounded-3xl border border-line bg-white shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-ivory/50 px-5 py-4 sm:px-6">
            <h2 className="flex items-center gap-2 text-base sm:text-lg">
              <Crown className="h-5 w-5 text-gold-dark" aria-hidden />
              Business overview
            </h2>
            <Link
              to="/owner/subscription"
              className="inline-flex items-center gap-2 rounded-full border border-forest/25 bg-white px-4 py-2 text-xs font-bold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
            >
              <CreditCard className="h-3.5 w-3.5" aria-hidden />
              Manage subscription
            </Link>
          </div>

          <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-3">
            {/* Current plan + status + renewal */}
            <div className="rounded-3xl bg-gradient-to-br from-forest to-forest-light p-5 text-ivory">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-gold">
                <Crown className="h-3.5 w-3.5" aria-hidden />
                Current plan
              </p>
              <p className="mt-2 text-2xl font-bold">{myPlan.name}</p>
              <p className="mt-1 text-[12.5px] text-ivory/75">
                {formatINR(mySubscription.cycle === 'YEARLY' ? myPlan.priceYearly : myPlan.priceMonthly)} per{' '}
                {mySubscription.cycle === 'YEARLY' ? 'year' : 'month'}
              </p>

              <div className="mt-3.5 flex flex-wrap gap-2">
                <StatusBadge status={mySubscription.suspended ? 'PAUSED' : mySubscription.status} />
                <span className="rounded-full bg-ivory/10 px-3 py-1 text-[11.5px] font-semibold">
                  {mySubscription.id}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-ivory/10 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gold">Start</p>
                  <p className="mt-1 text-[13px] font-semibold tabular-nums">{mySubscription.startOn}</p>
                </div>
                <div className="rounded-2xl bg-ivory/10 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gold">Expiry</p>
                  <p className="mt-1 text-[13px] font-semibold tabular-nums">{mySubscription.expiryOn}</p>
                </div>
              </div>
              <p className="mt-3 text-[11.5px] leading-relaxed text-ivory/70">
                Plan payments are separate from the rent you collect from students.
              </p>
            </div>

            {/* Property usage + featured status */}
            <div className="grid gap-5">
              <div className="rounded-3xl border border-line bg-ivory/40 p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">
                  <Layers className="h-4 w-4 text-gold-dark" aria-hidden />
                  Property usage
                </h3>
                <p className="mt-2.5 text-3xl font-bold tabular-nums text-ink">
                  {usedProperties}
                  <span className="text-lg text-ink-mute"> / {propertyLimit}</span>
                </p>
                <p className="text-[12.5px] text-ink-mute">properties used of your plan limit</p>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white">
                  <div
                    className={cn('h-full rounded-full transition-all', usagePct >= 100 ? 'bg-danger' : 'bg-forest')}
                    style={{ width: `${usagePct}%` }}
                    role="progressbar"
                    aria-valuenow={usagePct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Property usage"
                  />
                </div>
                <p className="mt-2 text-[11.5px] text-ink-soft">
                  {usagePct >= 100
                    ? 'Limit reached — upgrade to add more properties.'
                    : `${propertyLimit - usedProperties} more available on ${myPlan.name}.`}
                </p>
              </div>

              <div className="rounded-3xl border border-line bg-ivory/40 p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">
                  <Star className="h-4 w-4 text-gold-dark" aria-hidden />
                  Featured status
                </h3>
                {liveFeatured ? (
                  <div className="mt-2.5">
                    <StatusBadge status={liveFeatured.tier} />
                    <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">
                      {liveFeatured.pgName} is live with the Featured badge on Explore until{' '}
                      <span className="font-semibold text-ink tabular-nums">{liveFeatured.endOn ?? '—'}</span>.
                    </p>
                  </div>
                ) : myFeatured.length > 0 ? (
                  <div className="mt-2.5">
                    <StatusBadge status={myFeatured[0].status} />
                    <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">
                      Your featured request for {myFeatured[0].pgName} is{' '}
                      {myFeatured[0].status === 'PENDING'
                        ? 'awaiting admin approval.'
                        : myFeatured[0].status === 'REJECTED'
                          ? `not approved — ${myFeatured[0].rejectReason ?? 'no reason recorded'}.`
                          : 'no longer active.'}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-soft">
                    No featured listing yet — approved Featured (₹299/mo) and Premium Featured (₹499/mo) placements
                    show a badge on Explore.
                  </p>
                )}
              </div>
            </div>

            {/* History, benefits, invoices */}
            <div className="grid gap-5">
              <div className="rounded-3xl border border-line bg-ivory/40 p-5">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">Plan history</h3>
                {mySubscription.events.length === 0 ? (
                  <p className="text-[12.5px] text-ink-mute">No history yet.</p>
                ) : (
                  <ol className="space-y-2.5 border-l-2 border-line pl-4">
                    {mySubscription.events.slice(0, 3).map((event) => (
                      <li key={event.id} className="relative">
                        <span
                          className="absolute -left-[1.47rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-forest"
                          aria-hidden
                        />
                        <p className="text-[12.5px] font-semibold leading-snug text-ink">{event.text}</p>
                        <p className="text-[11px] text-ink-mute tabular-nums">{event.on}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div className="rounded-3xl border border-line bg-ivory/40 p-5">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">
                  Plan benefits ({planBenefits.length})
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {planBenefits.slice(0, 6).map((benefit) => (
                    <li
                      key={benefit.key}
                      className="rounded-full border border-forest/25 bg-forest-soft px-3 py-1.5 text-[11.5px] font-semibold text-forest"
                    >
                      {benefit.label}
                    </li>
                  ))}
                  {planBenefits.length === 0 && (
                    <li className="text-[12.5px] text-ink-mute">No features recorded on this plan.</li>
                  )}
                </ul>
              </div>

              <div className="rounded-3xl border border-line bg-ivory/40 p-5">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">
                  Recent plan payments
                </h3>
                {myInvoices.length === 0 ? (
                  <p className="text-[12.5px] text-ink-mute">No payments recorded.</p>
                ) : (
                  <ul className="space-y-2">
                    {myInvoices.map((invoice) => (
                      <li
                        key={invoice.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-3.5 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[12.5px] font-bold text-ink">{invoice.id}</p>
                          <p className="text-[11px] text-ink-mute">
                            {invoice.paidOn} · {invoice.method}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[13px] font-bold tabular-nums text-forest">
                            {formatINR(invoice.amount)}
                          </p>
                          <StatusBadge status={invoice.status} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  to="/owner/subscription"
                  className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-bold text-forest hover:text-gold-dark"
                >
                  View all invoices
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ----------------------------------------------- quick actions */}
      <section className="mt-6 rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
        <h2 className="text-base sm:text-lg">Quick actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { to: '/owner/properties?add=1', label: 'Add New PG', icon: Plus },
            { to: '/owner/rooms?add=1', label: 'Add Room', icon: BedDouble },
            { to: '/owner/admissions', label: 'Generate Admission Code', icon: ClipboardCheck },
            { to: '/owner/students', label: 'View Students', icon: Users },
            { to: '/owner/properties', label: 'Manage Properties', icon: Building2 },
          ].map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-line bg-ivory/40 px-4 py-4 transition-all hover:border-gold/50 hover:bg-white hover:shadow-card"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-soft text-forest transition-colors group-hover:bg-forest group-hover:text-ivory">
                  <action.icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="text-[13px] font-bold leading-tight text-ink">{action.label}</span>
              </span>
              <ArrowRight className="h-4 w-4 text-ink-mute transition-transform group-hover:translate-x-1 group-hover:text-forest" aria-hidden />
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------------------------------- recent lists */}
      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        {/* Recent admission requests */}
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base sm:text-lg">Recent admission requests</h2>
            <Link to="/owner/admissions" className="text-[12px] font-bold text-forest hover:text-gold-dark">
              View all
            </Link>
          </div>
          {recentRequests.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-mute">No admission requests in scope.</p>
          ) : (
            <ul className="space-y-3">
              {recentRequests.map((req) => {
                const property = properties.find((p) => p.id === req.propertyId)
                return (
                  <li key={req.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-ivory/30 px-3.5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-bold text-ink">{req.studentName}</p>
                      <p className="truncate text-[11.5px] text-ink-mute">
                        {property?.name ?? '—'} · {req.requestedOn}
                      </p>
                    </div>
                    <StatusBadge status={req.status} />
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Recent students */}
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base sm:text-lg">Recent student registrations</h2>
            <Link to="/owner/students" className="text-[12px] font-bold text-forest hover:text-gold-dark">
              View all
            </Link>
          </div>
          {recentStudents.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-mute">No students in scope.</p>
          ) : (
            <ul className="space-y-3">
              {recentStudents.map((stu) => {
                const room = rooms.find((r) => r.id === stu.roomId)
                return (
                  <li key={stu.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-ivory/30 px-3.5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-bold text-ink">{stu.name}</p>
                      <p className="truncate text-[11.5px] text-ink-mute">
                        {room ? `Room ${room.number}` : 'Not allocated'} · {stu.admissionDate}
                      </p>
                    </div>
                    <StatusBadge status={stu.membership} />
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Recent activities */}
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <h2 className="mb-4 text-base sm:text-lg">Recent property activities</h2>
          {scopedActivities.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-mute">No activities in scope.</p>
          ) : (
            <ul className="space-y-3.5">
              {scopedActivities.slice(0, 6).map((activity) => {
                const Icon = ACTIVITY_ICONS[activity.kind]
                return (
                  <li key={activity.id} className="flex gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-forest-soft text-forest">
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] leading-snug text-ink-soft">{activity.text}</span>
                      <span className="mt-0.5 block text-[11px] text-ink-mute">{activity.time}</span>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Empty-state guard when a filter leaves nothing in scope */}
      {scopedProperties.length === 0 && (
        <div className="mt-6">
          <EmptyState
            title="No properties in scope"
            description="Switch the property selector in the topbar back to All Properties or add a new property to get started."
            icon={<PencilLine className="h-6 w-6" aria-hidden />}
            action={
              <Link to="/owner/properties?add=1" className="btn-primary">
                Add Property
              </Link>
            }
          />
        </div>
      )}
    </>
  )
}
