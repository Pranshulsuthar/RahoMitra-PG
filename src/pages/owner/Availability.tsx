import { useMemo, useState } from 'react'
import { BedDouble, LayoutGrid, Wrench } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { aggregateRooms, useOwnerStore } from '../../context/OwnerStore'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { SearchInput, FilterSelect } from '../../components/admin/Filters'
import { StatisticCard } from '../../components/owner/StatisticCard'
import { BedLegend, BED_STATUS_STYLES, BED_DOT_STYLES } from '../../components/owner/BedStatusIndicator'
import { EmptyState } from '../../components/common/EmptyState'
import { ROOM_TYPE_LABELS, roomOccupancy, BED_STATUS_LABELS } from '../../types/owner'
import type { BedStatus, RoomBed } from '../../types/owner'

const BED_STATUS_CYCLE: BedStatus[] = ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE']

const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Any status' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'OCCUPIED', label: 'Occupied' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
]

/** /owner/availability — visual availability management across properties. */
export function Availability() {
  useDocumentTitle('Availability')

  const { rooms, properties, scopedPropertyIds, selectedPropertyId, setBedStatus, pushToast } =
    useOwnerStore()

  const [query, setQuery] = useState('')
  const [roomFilter, setRoomFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const scopedRooms = useMemo(
    () => rooms.filter((r) => scopedPropertyIds.includes(r.propertyId)),
    [rooms, scopedPropertyIds],
  )

  const totals = useMemo(() => aggregateRooms(scopedRooms), [scopedRooms])

  const roomOptions = useMemo(
    () => [
      { value: 'ALL', label: 'Any room' },
      ...scopedRooms.map((r) => ({ value: r.id, label: `Room ${r.number}` })),
    ],
    [scopedRooms],
  )

  // Rooms that pass filters; bed-level status filter hides non-matching beds.
  const filteredRooms = useMemo(() => {
    const q = query.trim().toLowerCase()
    return scopedRooms.filter((room) => {
      if (roomFilter !== 'ALL' && room.id !== roomFilter) return false
      if (q) {
        const property = properties.find((p) => p.id === room.propertyId)
        if (!`room ${room.number} ${property?.name ?? ''}`.toLowerCase().includes(q)) return false
      }
      if (statusFilter !== 'ALL') {
        const hasMatchingBed = room.beds.some((b) => b.status === statusFilter)
        if (!hasMatchingBed) return false
      }
      return true
    })
  }, [scopedRooms, roomFilter, statusFilter, query, properties])

  const visibleBeds = (room: (typeof scopedRooms)[number]) =>
    statusFilter === 'ALL' ? room.beds : room.beds.filter((b) => b.status === statusFilter)

  const changeBed = (bed: RoomBed, roomNumber: string) => {
    const next = BED_STATUS_CYCLE[(BED_STATUS_CYCLE.indexOf(bed.status) + 1) % BED_STATUS_CYCLE.length]
    setBedStatus(bed.id, next)
    if (bed.status === 'OCCUPIED' && next !== 'OCCUPIED') {
      // store blocks this when a student is allocated — toast already explains
      return
    }
    pushToast(`Room ${roomNumber} bed ${bed.label} → ${BED_STATUS_LABELS[next]}`, 'info')
  }

  const scopeLabel =
    selectedPropertyId === 'ALL'
      ? 'all your properties'
      : (properties.find((p) => p.id === selectedPropertyId)?.name ?? 'the selected property')

  return (
    <>
      <AdminPageHeader
        title="Availability"
        description={`Visual bed availability across ${scopeLabel} — click any bed to cycle its status.`}
      />

      <DemoBanner message="availability reflects local demo records only — never real-world occupancy. Changes made here update the dashboard and property previews instantly." />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatisticCard label="Total Capacity" value={totals.totalBeds} icon={LayoutGrid} tone="ink" />
        <StatisticCard label="Occupied Beds" value={totals.occupied} icon={BedDouble} tone="gold" />
        <StatisticCard label="Available Beds" value={totals.available} icon={BedDouble} tone="forest" />
        <StatisticCard label="Maintenance Beds" value={totals.maintenance} icon={Wrench} tone="danger" />
      </div>

      {/* Occupancy summary bar */}
      <section className="mb-6 rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base sm:text-lg">Overall occupancy</h2>
          <span className="text-sm font-bold text-forest">{totals.occupancyPct}% occupied</span>
        </div>
        <div className="flex h-4 overflow-hidden rounded-full bg-ivory-deep">
          <div
            className="bg-forest transition-all duration-500"
            style={{ width: `${totals.occupancyPct}%` }}
            aria-hidden
          />
          <div
            className="bg-gold transition-all duration-500"
            style={{
              width: `${totals.totalBeds > 0 ? (totals.maintenance / totals.totalBeds) * 100 : 0}%`,
            }}
            aria-hidden
          />
        </div>
        <div className="mt-3">
          <BedLegend />
        </div>
      </section>

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-3xl border border-line bg-white p-4 shadow-card">
        <SearchInput value={query} onChange={setQuery} placeholder="Search rooms or PGs…" />
        <FilterSelect
          label="Room"
          value={roomFilter}
          onChange={setRoomFilter}
          options={roomOptions}
        />
        <FilterSelect
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_FILTER_OPTIONS}
        />
        <span className="ml-auto text-[12px] font-semibold text-ink-mute">
          {filteredRooms.length} of {scopedRooms.length} rooms
        </span>
      </div>

      {filteredRooms.length === 0 ? (
        <EmptyState
          title="No rooms match"
          description="Adjust the property, room or status filters — the demo dataset may be scoped to another property."
          icon={<LayoutGrid className="h-6 w-6" aria-hidden />}
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {filteredRooms.map((room) => {
            const occ = roomOccupancy(room)
            const property = properties.find((p) => p.id === room.propertyId)
            const beds = visibleBeds(room)
            return (
              <article
                key={room.id}
                className="rounded-3xl border border-line bg-white p-5 shadow-card transition-all hover:border-gold/40 hover:shadow-card-hover"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg text-ink">
                      Room {room.number}
                      <span className="ml-2 align-middle text-[11px] font-bold uppercase tracking-wider text-ink-mute">
                        {ROOM_TYPE_LABELS[room.type]}
                      </span>
                    </h3>
                    <p className="mt-0.5 text-[12px] text-ink-mute">
                      {property?.name ?? '—'} · Floor {room.floor} · ₹{room.rent}/month
                    </p>
                  </div>
                  <span
                    className={
                      'rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ' +
                      (occ.label === 'FULL'
                        ? 'border-danger/30 bg-danger-soft text-danger'
                        : occ.label === 'VACANT'
                          ? 'border-forest/30 bg-forest-soft text-forest'
                          : occ.label === 'MAINTENANCE'
                            ? 'border-gold/40 bg-gold-soft text-gold-dark'
                            : 'border-line bg-ivory text-ink-soft')
                    }
                  >
                    {occ.label}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {beds.map((bed) => (
                    <button
                      key={bed.id}
                      type="button"
                      onClick={() => changeBed(bed, room.number)}
                      title={`Bed ${bed.label}: ${BED_STATUS_LABELS[bed.status]} — click to change (demo)`}
                      className={
                        'flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-center transition-all hover:-translate-y-0.5 ' +
                        BED_STATUS_STYLES[bed.status]
                      }
                    >
                      <span className={('h-2.5 w-2.5 rounded-full ' + BED_DOT_STYLES[bed.status])} aria-hidden />
                      <span className="text-[12.5px] font-bold">Bed {bed.label}</span>
                      <span className="text-[9.5px] font-bold uppercase tracking-wider opacity-80">
                        {BED_STATUS_LABELS[bed.status]}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-line pt-3.5 text-[11.5px] font-semibold text-ink-soft">
                  <span>
                    {occ.occupied}/{occ.capacity} occupied · {occ.available} free ·{' '}
                    {occ.maintenance} maintenance
                  </span>
                  <span className="text-ink-mute">click a bed to change</span>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
