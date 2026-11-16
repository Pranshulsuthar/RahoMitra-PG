import { useEffect, useState } from 'react'
import { BedDouble, DoorOpen, Lock, Ruler, Users, KeyRound } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { fetchStudentAccommodation, type StudentAccommodation } from '../../api/student'
import { ROOM_FACILITIES } from '../../utils/constants'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { StatisticCard } from '../../components/owner/StatisticCard'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { JoinPGModal } from '../../components/student/JoinPGModal'

const TYPE_LABEL: Record<string, string> = {
  SINGLE: 'Single Sharing',
  DOUBLE: 'Double Sharing',
  TRIPLE: 'Triple Sharing',
  FOUR: 'Four Sharing',
  CUSTOM: 'Custom Sharing',
}

export function MyRoom() {
  useDocumentTitle('My Room')

  const [accommodation, setAccommodation] = useState<StudentAccommodation | null>(null)
  const [loading, setLoading] = useState(true)
  const [joinModalOpen, setJoinModalOpen] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await fetchStudentAccommodation()
      setAccommodation(data)
    } catch {
      setAccommodation(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-ink-mute">Loading room details…</p>
      </div>
    )
  }

  if (!accommodation) {
    return (
      <>
        <AdminPageHeader
          title="My Room"
          description="Your assigned room, bed and roommate details."
          actions={
            <button
              type="button"
              onClick={() => setJoinModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory shadow-card transition-all hover:bg-forest-light"
            >
              <KeyRound className="h-4 w-4" />
              Join PG with Code
            </button>
          }
        />
        <div className="rounded-3xl border border-dashed border-line bg-white p-12 text-center shadow-card">
          <DoorOpen className="mx-auto mb-4 h-12 w-12 text-forest" />
          <h2 className="font-display text-xl font-bold text-ink">No room allocated yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft leading-relaxed">
            You do not have an active room allocation. If your owner gave you an admission code, join your PG to view your room and roommates.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setJoinModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-ivory shadow-card transition-colors hover:bg-forest-light"
            >
              <KeyRound className="h-4 w-4" />
              Join PG with Code
            </button>
          </div>
        </div>
        <JoinPGModal
          open={joinModalOpen}
          onClose={() => setJoinModalOpen(false)}
          onSuccess={() => loadData()}
        />
      </>
    )
  }

  const { room, bed, property, roommates } = accommodation
  const myBedLabel = bed.label
  const roommatesList = roommates || []

  return (
    <>
      <AdminPageHeader
        title="My Room"
        description={`Room ${room.number} at ${property.name} — managed by property owner.`}
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-forest/25 bg-white px-4 py-2 text-xs font-bold text-forest">
            <Lock className="h-3.5 w-3.5" aria-hidden />
            Allocated Bed {myBedLabel}
          </span>
        }
      />

      {/* ------------------------------------------------------- stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatisticCard
          label="Room Number"
          value={room.number}
          icon={DoorOpen}
          tone="forest"
          hint={`Floor ${room.floor}`}
        />
        <StatisticCard
          label="Sharing Type"
          value={TYPE_LABEL[room.type] ?? `${room.type} Sharing`}
          icon={Users}
          tone="gold"
          hint={`${property.name}`}
        />
        <StatisticCard
          label="My Bed"
          value={myBedLabel}
          icon={BedDouble}
          tone="forest"
          hint="Allocated bed"
        />
        <StatisticCard
          label="Monthly Rent"
          value={`₹${room.rent.toLocaleString('en-IN')}`}
          icon={Ruler}
          tone="ink"
          hint="Monthly charge"
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* ------------------------------------------------ visual occupancy */}
        <section className="min-w-0 rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base sm:text-lg">Room & Bed Allocation</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* My Bed */}
            <div className="relative rounded-2xl border-2 border-gold bg-gold-soft/60 px-4 py-4 shadow-[0_10px_24px_-16px_rgba(196,154,82,0.9)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[15px] font-bold text-gold-dark">
                    <BedDouble className="h-4.5 w-4.5" aria-hidden />
                    Bed {myBedLabel}
                  </p>
                  <p className="mt-1 text-[12.5px] text-ink-mute">
                    Allocated to you
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-forest-dark">
                  Your bed
                </span>
              </div>
            </div>

            {/* Roommates Beds */}
            {roommatesList.map((mate) => (
              <div key={mate.id} className="relative rounded-2xl border-2 border-line bg-ivory/60 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[15px] font-bold text-ink">
                      <BedDouble className="h-4.5 w-4.5" aria-hidden />
                      Bed {mate.bedLabel}
                    </p>
                    <p className="mt-1 text-[12.5px] text-ink-mute">
                      Occupied by {mate.name}
                    </p>
                  </div>
                  <StatusBadge status="OCCUPIED" />
                </div>
              </div>
            ))}
          </div>

          {/* Quick facilities strip */}
          <div className="mt-6 border-t border-line pt-5">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-mute">
              Room Amenities
            </h3>
            <ul className="flex flex-wrap gap-2">
              {ROOM_FACILITIES.map((facility) => (
                <li
                  key={facility}
                  className="rounded-full border border-line bg-ivory/50 px-3.5 py-1.5 text-xs font-semibold text-ink"
                >
                  {facility}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------------------------------------------------- roommates aside */}
        <aside className="space-y-5">
          <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
            <h2 className="mb-3 text-base sm:text-lg">Roommates</h2>
            {roommatesList.length > 0 ? (
              <ul className="space-y-3">
                {roommatesList.map((mate) => (
                  <li
                    key={mate.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-ivory/40 px-3.5 py-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-ink">{mate.name}</p>
                      <p className="text-xs text-ink-mute">Bed {mate.bedLabel}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-ink-mute">No other roommates registered in this room yet.</p>
            )}
          </section>

          <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
            <h2 className="mb-2 text-base sm:text-lg">Property Details</h2>
            <div className="space-y-2 text-xs text-ink-soft">
              <p><strong className="text-ink">PG:</strong> {property.name}</p>
              <p><strong className="text-ink">Locality:</strong> {property.locality}, {property.city}</p>
              <p><strong className="text-ink">Floor:</strong> {room.floor}</p>
            </div>
          </section>
        </aside>
      </div>

      <JoinPGModal
        open={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onSuccess={() => loadData()}
      />
    </>
  )
}
