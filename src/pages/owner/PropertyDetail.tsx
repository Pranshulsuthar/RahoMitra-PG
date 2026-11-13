import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BedDouble,
  Building2,
  DoorOpen,
  Mail,
  MapPin,
  PencilLine,
  Phone,
  ShieldCheck,
  UtensilsCrossed,
} from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { aggregateRooms, useOwnerStore } from '../../context/OwnerStore'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { StatisticCard } from '../../components/owner/StatisticCard'
import { ROOM_TYPE_LABELS, roomOccupancy } from '../../types/owner'
import { EmptyState } from '../../components/common/EmptyState'

/** /owner/properties/:id — single property overview (rooms, beds, gallery). */
export function PropertyDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()

  const { properties, rooms, students, staff, setPropertyStatus } = useOwnerStore()
  const property = properties.find((p) => p.id === id)

  useDocumentTitle(property ? property.name : 'Property Details')

  const propertyRooms = useMemo(
    () => rooms.filter((r) => r.propertyId === id),
    [rooms, id],
  )
  const stats = useMemo(() => aggregateRooms(propertyRooms), [propertyRooms])
  const propertyStudents = useMemo(
    () => students.filter((s) => s.propertyId === id && s.membership === 'ACTIVE'),
    [students, id],
  )
  const propertyStaff = useMemo(() => staff.filter((s) => s.propertyId === id), [staff, id])

  if (!property) {
    return (
      <EmptyState
        title="Property not found"
        description="This demo property does not exist — it may have been removed in this session. Reload to restore the original demo dataset."
        icon={<Building2 className="h-6 w-6" aria-hidden />}
        action={
          <Link
            to="/owner/properties"
            className="rounded-full bg-forest px-5 py-2.5 text-sm font-bold text-ivory hover:bg-forest-light"
          >
            Back to properties
          </Link>
        }
      />
    )
  }

  const occupancyPct = stats.occupancyPct

  return (
    <>
      <button
        type="button"
        onClick={() => navigate('/owner/properties')}
        className="mb-4 inline-flex items-center gap-2 text-[13px] font-bold text-forest transition-colors hover:text-gold-dark"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        All properties
      </button>

      <AdminPageHeader
        title={property.name}
        description={`${property.locality}, ${property.city} · demo listing owned by this account.`}
        actions={
          <Link
            to={`/owner/properties/${property.id}/edit`}
            className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory transition-all hover:bg-forest-light"
          >
            <PencilLine className="h-4 w-4" aria-hidden />
            Edit listing
          </Link>
        }
      />

      <DemoBanner message="this property, its rooms, students and staff are fictional demo records held in local React state." />

      {/* Cover + meta */}
      <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
        <div className="relative h-56 sm:h-72">
          <img
            src={property.coverImage}
            alt={`${property.name} (demo photograph)`}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-transparent" aria-hidden />
          <div className="absolute bottom-5 left-6 right-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/30 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink">
                  {property.type.replace('_', '-').toLowerCase()}
                </span>
                <span className="rounded-full border border-white/30 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink">
                  Demo
                </span>
              </div>
              <h1 className="text-2xl text-white drop-shadow sm:text-3xl">{property.name}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-white/85">
                <MapPin className="h-4 w-4" aria-hidden />
                {property.address}
              </p>
            </div>
            <StatusBadge status={property.status} className="bg-white/95" />
          </div>
        </div>

        {/* Description + contact */}
        <div className="grid gap-6 p-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="text-base">About this property</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{property.description}</p>

            <div className="mt-4 flex flex-wrap gap-4 text-[13px] text-ink-soft">
              <span className="inline-flex items-center gap-2">
                <Phone className="h-4 w-4 text-gold-dark" aria-hidden />
                {property.contactPhone} (demo)
              </span>
              <span className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4 text-gold-dark" aria-hidden />
                {property.contactEmail}
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-gold-dark" aria-hidden />
                Deposit ₹{property.securityDeposit.toLocaleString('en-IN')}
              </span>
              <span className="inline-flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4 text-gold-dark" aria-hidden />
                {property.food === 'INCLUDED'
                  ? 'Food included'
                  : property.food === 'PAID'
                    ? 'Food paid separately'
                    : 'No food facility'}
              </span>
            </div>

            {property.facilities.length > 0 && (
              <>
                <h3 className="mt-5 text-sm font-bold text-ink">Facilities</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {property.facilities.map((facility) => (
                    <span
                      key={facility}
                      className="rounded-full border border-line bg-ivory/60 px-3 py-1 text-[12px] font-semibold text-ink-soft"
                    >
                      {facility}
                    </span>
                  ))}
                </div>
              </>
            )}

            {property.rules.length > 0 && (
              <>
                <h3 className="mt-5 text-sm font-bold text-ink">Property rules</h3>
                <ul className="mt-2 space-y-1.5 text-[13px] text-ink-soft">
                  {property.rules.map((rule, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="text-gold-dark" aria-hidden>•</span>
                      {rule}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Gallery */}
          <div>
            <h2 className="text-base">Gallery</h2>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {property.gallery.map((src) => (
                <img
                  key={src}
                  src={src}
                  alt={`${property.name} gallery (demo)`}
                  loading="lazy"
                  className="h-24 w-full rounded-xl object-cover"
                />
              ))}
            </div>
            <p className="mt-2 text-[11px] text-ink-mute">Sample photographs — demo only.</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatisticCard label="Rooms" value={stats.totalRooms} icon={Building2} tone="ink" />
        <StatisticCard label="Total Beds" value={stats.totalBeds} icon={BedDouble} tone="ink" />
        <StatisticCard label="Occupied" value={stats.occupied} icon={DoorOpen} tone="gold" />
        <StatisticCard label="Occupancy" value={`${occupancyPct}%`} icon={ShieldCheck} tone="forest" />
      </div>

      {/* Rooms */}
      <section className="mt-6 rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base sm:text-lg">Rooms in this property</h2>
          <Link to="/owner/rooms" className="text-[12px] font-bold text-forest hover:text-gold-dark">
            Manage rooms →
          </Link>
        </div>
        {propertyRooms.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-mute">
            No demo rooms yet — add rooms from Room Management.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {propertyRooms.map((room) => {
              const occ = roomOccupancy(room)
              return (
                <div key={room.id} className="rounded-2xl border border-line bg-ivory/40 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[15px] font-bold text-ink">Room {room.number}</h3>
                    <StatusBadge status={occ.label} />
                  </div>
                  <p className="mt-1 text-[12px] text-ink-mute">
                    Floor {room.floor} · {ROOM_TYPE_LABELS[room.type]} · ₹{room.rent}/month
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {room.beds.map((bed) => (
                      <span
                        key={bed.id}
                        className={
                          'rounded-lg border px-2 py-1 text-[10.5px] font-bold uppercase tracking-wide ' +
                          (bed.status === 'AVAILABLE'
                            ? 'border-forest/30 bg-forest-soft text-forest'
                            : bed.status === 'OCCUPIED'
                              ? 'border-line bg-ivory-deep/60 text-ink-soft'
                              : 'border-gold/50 bg-gold-soft text-gold-dark')
                        }
                      >
                        {bed.label} · {bed.status === 'MAINTENANCE' ? 'Maint.' : bed.status.slice(0, 5)}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-[11.5px] text-ink-mute">
                    {occ.occupied}/{occ.capacity} occupied · {occ.available} free
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Occupants + staff */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <h2 className="mb-4 text-base sm:text-lg">Active students ({propertyStudents.length})</h2>
          {propertyStudents.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-mute">No active demo students.</p>
          ) : (
            <ul className="space-y-2.5">
              {propertyStudents.map((student) => {
                const room = rooms.find((r) => r.id === student.roomId)
                const bed = room?.beds.find((b) => b.id === student.bedId)
                return (
                  <li
                    key={student.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-ivory/30 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-bold text-ink">{student.name}</p>
                      <p className="truncate text-[11.5px] text-ink-mute">
                        {room ? `Room ${room.number} · Bed ${bed?.label ?? '—'}` : 'Not allocated'} ·{' '}
                        {student.admissionDate}
                      </p>
                    </div>
                    <StatusBadge status={student.membership} />
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <h2 className="mb-4 text-base sm:text-lg">Staff ({propertyStaff.length})</h2>
          {propertyStaff.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-mute">No demo staff assigned.</p>
          ) : (
            <ul className="space-y-2.5">
              {propertyStaff.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-ivory/30 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-bold text-ink">{member.name}</p>
                    <p className="truncate text-[11.5px] text-ink-mute">
                      {member.role.replace('_', ' ').toLowerCase()} · {member.mobile} (demo)
                    </p>
                  </div>
                  <Link
                    to="/owner/staff"
                    className="rounded-full border border-forest/25 px-3.5 py-1.5 text-[11.5px] font-bold text-forest hover:bg-forest hover:text-ivory"
                  >
                    Manage
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Status control */}
      <section className="mt-6 rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
        <h2 className="text-base sm:text-lg">Listing visibility</h2>
        <p className="mt-1 text-[13px] text-ink-mute">
          Change the listing status in local demo state — nothing is published anywhere.
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {(['ACTIVE', 'PENDING', 'DRAFT', 'PAUSED'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setPropertyStatus(property.id, status)}
              className={
                property.status === status
                  ? 'rounded-full bg-forest px-5 py-2.5 text-[13px] font-bold text-ivory'
                  : 'rounded-full border border-line px-5 py-2.5 text-[13px] font-bold text-ink-soft transition-colors hover:border-forest hover:text-forest'
              }
            >
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </section>
    </>
  )
}
