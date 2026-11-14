import { BedDouble, DoorOpen, Info, Layers, Lock, Ruler, Users } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import {
  ROOM_FACILITIES,
  ROOMMATES,
  STUDENT_ADMISSION,
  STUDENT_ROOM,
} from '../../data/studentData'
import { roomOccupancy } from '../../types/owner'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { StatisticCard } from '../../components/owner/StatisticCard'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { cn } from '../../utils/cn'

const TYPE_LABEL: Record<string, string> = {
  SINGLE: 'Single Sharing',
  DOUBLE: 'Double Sharing',
  TRIPLE: 'Triple Sharing',
  FOUR: 'Four Sharing',
  CUSTOM: 'Custom Sharing',
}

/** Visual bed map — the demo student's bed is highlighted distinctly. */
function BedMap({ occupiedLabels }: { occupiedLabels: string[] }) {
  const allLabels = STUDENT_ROOM.beds.map((b) => b.label)
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {allLabels.map((label) => {
        const isMe = label === STUDENT_ADMISSION.bedLabel
        const occupied = occupiedLabels.includes(label)
        const roommate = ROOMMATES.find((m) => m.bedLabel === label)
        return (
          <div
            key={label}
            className={cn(
              'relative rounded-2xl border-2 px-4 py-4 transition-all',
              isMe
                ? 'border-gold bg-gold-soft/60 shadow-[0_10px_24px_-16px_rgba(196,154,82,0.9)]'
                : occupied
                  ? 'border-line bg-ivory/60'
                  : 'border-dashed border-forest/40 bg-forest-soft/40',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p
                  className={cn(
                    'flex items-center gap-2 text-[15px] font-bold',
                    isMe ? 'text-gold-dark' : 'text-ink',
                  )}
                >
                  <BedDouble className="h-4.5 w-4.5" aria-hidden />
                  Bed {label}
                </p>
                <p className="mt-1 text-[12.5px] text-ink-mute">
                  {isMe
                    ? 'Allocated to you (demo)'
                    : occupied
                      ? `Occupied by ${roommate?.name ?? 'another student (demo)'}`
                      : 'Available'}
                </p>
              </div>
              {isMe ? (
                <span className="shrink-0 rounded-full bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-forest-dark">
                  Your bed
                </span>
              ) : (
                <StatusBadge status={occupied ? 'OCCUPIED' : 'AVAILABLE'} />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** /student/room — read-only room info with a visual occupancy map. */
export function MyRoom() {
  useDocumentTitle('My Room')

  const occupancy = roomOccupancy(STUDENT_ROOM)
  const occupiedLabels = STUDENT_ROOM.beds
    .filter((b) => b.status === 'OCCUPIED')
    .map((b) => b.label)

  return (
    <>
      <AdminPageHeader
        title="My Room"
        description={`Room ${STUDENT_ROOM.number} at Shree Shyam Boys PG — allocation is managed by the PG owner and cannot be edited here.`}
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-forest/25 bg-white px-4 py-2.5 text-[13px] font-bold text-forest">
            <Lock className="h-4 w-4" aria-hidden />
            Allocation locked (demo)
          </span>
        }
      />

      <DemoBanner message="room facts, occupancy and bed statuses below are local illustrative demo records — they reset on reload." />

      {/* ------------------------------------------------------- stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-6">
        <StatisticCard
          label="Room Number"
          value={STUDENT_ROOM.number}
          icon={DoorOpen}
          tone="forest"
          hint={`Floor ${STUDENT_ROOM.floor}`}
        />
        <StatisticCard
          label="Floor"
          value={`${STUDENT_ROOM.floor}`}
          icon={Layers}
          tone="ink"
          hint="Second floor (demo)"
        />
        <StatisticCard
          label="Sharing Type"
          value={TYPE_LABEL[STUDENT_ROOM.type] ?? STUDENT_ROOM.type}
          icon={Users}
          tone="gold"
        />
        <StatisticCard
          label="My Bed"
          value={STUDENT_ADMISSION.bedLabel}
          icon={BedDouble}
          tone="forest"
          hint="Allocated bed (demo)"
        />
        <StatisticCard
          label="Monthly Rent"
          value={`₹${STUDENT_ROOM.rent.toLocaleString('en-IN')}`}
          icon={Ruler}
          tone="ink"
          hint="Per month · demo"
        />
        <StatisticCard
          label="Current Occupancy"
          value={`${occupancy.occupied}/${occupancy.capacity}`}
          icon={Users}
          tone={occupancy.occupied >= occupancy.capacity ? 'danger' : 'gold'}
          hint={`Capacity ${occupancy.capacity} beds`}
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* ------------------------------------------------ visual occupancy */}
        <section className="min-w-0 rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base sm:text-lg">Room occupancy</h2>
            <span className="rounded-full bg-ivory px-3 py-1 text-[11px] font-bold text-ink-soft">
              {occupancy.occupied} of {occupancy.capacity} beds occupied · demo
            </span>
          </div>
          <p className="mb-4 flex items-center gap-2 text-[12.5px] text-ink-mute">
            <Info className="h-3.5 w-3.5 shrink-0 text-gold-dark" aria-hidden />
            Visual representation of your shared room — read-only in this demo.
          </p>

          <BedMap occupiedLabels={occupiedLabels} />

          {/* Occupancy meter */}
          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-[11.5px] font-bold text-ink-soft">
              <span>Occupancy</span>
              <span>
                {occupancy.occupied}/{occupancy.capacity} beds
              </span>
            </div>
            <div
              className="h-3 w-full overflow-hidden rounded-full bg-ivory-deep"
              role="img"
              aria-label={`Room occupancy: ${occupancy.occupied} of ${occupancy.capacity} beds (demo data)`}
            >
              <div
                className="h-full rounded-full bg-forest transition-all duration-500"
                style={{
                  width: `${occupancy.capacity > 0 ? (occupancy.occupied / occupancy.capacity) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-dashed border-gold/60 bg-gold-soft/50 px-4 py-3 text-[12px] leading-relaxed text-gold-dark">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <p>
              Students cannot edit room allocation — contact the PG owner (Section 04) for any
              bed or room change requests.
            </p>
          </div>
        </section>

        {/* ------------------------------------------------- room facilities */}
        <aside className="space-y-5">
          <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
            <h2 className="mb-4 text-base sm:text-lg">Room facilities</h2>
            <ul className="grid gap-2.5">
              {ROOM_FACILITIES.map((facility) => (
                <li
                  key={facility}
                  className="flex items-center gap-2.5 rounded-xl border border-line bg-ivory/40 px-3.5 py-2.5 text-[13px] font-semibold text-ink"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-forest-soft text-forest">
                    <BedDouble className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  {facility}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[11.5px] leading-relaxed text-ink-mute">
              Facility list is a fixed demo subset of the PG’s amenities.
            </p>
          </section>

          <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
            <h2 className="mb-4 text-base sm:text-lg">Room details</h2>
            <dl className="space-y-2.5 text-[13px]">
              {[
                ['Room number', STUDENT_ROOM.number],
                ['Floor', `${STUDENT_ROOM.floor}`],
                ['Type', TYPE_LABEL[STUDENT_ROOM.type] ?? STUDENT_ROOM.type],
                ['Capacity', `${occupancy.capacity} beds`],
                ['Occupied', `${occupancy.occupied} beds`],
                ['Monthly rent', `₹${STUDENT_ROOM.rent.toLocaleString('en-IN')}`],
                ['My bed', STUDENT_ADMISSION.bedLabel],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-ivory/30 px-3.5 py-2.5"
                >
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">
                    {label}
                  </dt>
                  <dd className="truncate text-right font-semibold text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </aside>
      </div>
    </>
  )
}
