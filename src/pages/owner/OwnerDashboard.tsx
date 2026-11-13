import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BedDouble,
  Building2,
  ClipboardCheck,
  DoorOpen,
  GraduationCap,
  Layers,
  PencilLine,
  Plus,
  UserRound,
  Users,
  Wrench,
} from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { aggregateRooms, useOwnerStore } from '../../context/OwnerStore'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { StatisticCard } from '../../components/owner/StatisticCard'
import { BarChart, DonutChart } from '../../components/admin/Charts'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { EmptyState } from '../../components/common/EmptyState'

const ACTIVITY_ICONS = {
  admission: ClipboardCheck,
  room: BedDouble,
  property: Building2,
  student: Users,
  staff: UserRound,
}

/** /owner/dashboard — premium owner overview with clearly-labelled demo data. */
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

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description={`A premium overview of rooms, beds, students and admissions across ${scopeLabel}.`}
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

      <DemoBanner message="every statistic below is computed from local illustrative demo data for your two sample PGs — nothing here is live platform data." />

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
              % beds occupied · demo
            </span>
          </div>
          {occupancyData.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-mute">No properties in scope.</p>
          ) : (
            <BarChart
              data={occupancyData}
              maxValue={100}
              valueSuffix="%"
              ariaLabel="Property-wise occupancy percentage (demo data)"
            />
          )}
        </section>

        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base sm:text-lg">Room availability</h2>
            <span className="rounded-full bg-ivory px-3 py-1 text-[11px] font-bold text-ink-soft">
              beds · demo
            </span>
          </div>
          <DonutChart
            data={[
              { label: 'Occupied', value: totals.occupied, color: '#173D32' },
              { label: 'Available', value: totals.available, color: '#C49A52' },
              { label: 'Maintenance', value: totals.maintenance, color: '#8B928D' },
            ]}
            centerLabel={`${totals.totalBeds} beds`}
            ariaLabel="Bed availability donut chart (demo data)"
          />
        </section>
      </div>

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
            <p className="py-8 text-center text-sm text-ink-mute">No demo requests in scope.</p>
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
            <p className="py-8 text-center text-sm text-ink-mute">No demo students in scope.</p>
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
            description="Switch the property selector in the topbar back to All Properties to see your demo records."
            icon={<PencilLine className="h-6 w-6" aria-hidden />}
          />
        </div>
      )}

      <p className="mt-6 flex items-center gap-2 text-[11.5px] text-ink-mute">
        <Wrench className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
        Frontend-only demo — all figures derive from local sample data and reset on reload.
      </p>
    </>
  )
}
