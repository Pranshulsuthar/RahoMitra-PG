import { BedDouble, PencilLine, Plus, Trash2 } from 'lucide-react'
import type { OwnerRoom, RoomBed } from '../../types/owner'
import { ROOM_TYPE_LABELS, roomOccupancy } from '../../types/owner'
import { cn } from '../../utils/cn'
import { BedLegend } from './BedStatusIndicator'

const NEXT_STATUS = {
  AVAILABLE: 'MAINTENANCE',
  MAINTENANCE: 'OCCUPIED',
  OCCUPIED: 'AVAILABLE',
} as const

const BED_TILE = {
  AVAILABLE: 'border-forest/40 bg-forest-soft text-forest hover:bg-forest hover:text-ivory',
  OCCUPIED: 'border-line bg-ivory-deep/60 text-ink-soft hover:border-ink/40',
  MAINTENANCE: 'border-gold/50 bg-gold-soft text-gold-dark hover:bg-gold hover:text-forest-dark',
} as const

interface RoomCardProps {
  room: OwnerRoom
  onEdit: (room: OwnerRoom) => void
  onDelete: (room: OwnerRoom) => void
  onAddBed: (room: OwnerRoom) => void
  onBedStatusChange: (bed: RoomBed, status: RoomBed['status']) => void
}

/** Room card with a visual bed occupancy layout (click a bed to change state). */
export function RoomCard({ room, onEdit, onDelete, onAddBed, onBedStatusChange }: RoomCardProps) {
  const occ = roomOccupancy(room)
  const pct = occ.capacity > 0 ? Math.round((occ.occupied / occ.capacity) * 100) : 0

  const occBadge =
    occ.label === 'FULL'
      ? 'border-danger/30 bg-danger-soft text-danger'
      : occ.label === 'VACANT'
        ? 'border-forest/30 bg-forest-soft text-forest'
        : occ.label === 'MAINTENANCE'
          ? 'border-gold/40 bg-gold-soft text-gold-dark'
          : 'border-line bg-ivory text-ink-soft'

  return (
    <article className="flex flex-col rounded-3xl border border-line bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-card-hover">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-soft text-forest">
              <BedDouble className="h-4.5 w-4.5" aria-hidden />
            </span>
            <h2 className="text-lg">Room {room.number}</h2>
            <span
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]',
                occBadge,
              )}
            >
              {occ.label}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-ink-mute">
            Floor {room.floor} · {ROOM_TYPE_LABELS[room.type]} ·{' '}
            <span className="font-semibold text-ink-soft">₹{room.rent}/month</span> · demo
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            onClick={() => onEdit(room)}
            aria-label={`Edit room ${room.number}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-soft transition-colors hover:border-forest hover:text-forest"
          >
            <PencilLine className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => onDelete(room)}
            aria-label={`Delete room ${room.number}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-soft transition-colors hover:border-danger hover:text-danger"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>

      {/* Occupancy bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] font-semibold text-ink-soft">
          <span>
            {occ.occupied}/{occ.capacity} beds occupied
          </span>
          <span>{pct}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-ivory-deep">
          <div
            className="h-full rounded-full bg-forest transition-all duration-500"
            style={{ width: `${pct}%` }}
            aria-hidden
          />
        </div>
      </div>

      {/* Visual bed layout */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {room.beds.map((bed) => (
          <button
            key={bed.id}
            type="button"
            onClick={() => onBedStatusChange(bed, NEXT_STATUS[bed.status])}
            title={`Bed ${bed.label} — ${bed.status.toLowerCase()} (click to cycle status)`}
            className={cn(
              'flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition-colors',
              BED_TILE[bed.status],
            )}
          >
            <span>Bed {bed.label}</span>
            <span className="text-[9.5px] font-bold uppercase tracking-wider opacity-80">
              {bed.status === 'MAINTENANCE' ? 'Maint.' : bed.status.slice(0, 5)}
            </span>
          </button>
        ))}
        {occ.available === 0 && occ.capacity > 0 && (
          <p className="col-span-full rounded-xl border border-dashed border-danger/40 bg-danger-soft/50 px-3 py-2 text-center text-[11px] font-semibold text-danger">
            No free beds in this room (demo capacity)
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3.5">
        <BedLegend />
        <button
          type="button"
          onClick={() => onAddBed(room)}
          className="inline-flex items-center gap-1.5 rounded-full border border-forest/25 px-3.5 py-1.5 text-[11.5px] font-bold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Add bed
        </button>
      </div>
    </article>
  )
}
