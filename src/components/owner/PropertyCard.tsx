import { BedDouble, Building2, Eye, PencilLine } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { OwnerProperty } from '../../types/owner'
import { PG_TYPE_LABELS } from '../../types/owner'
import { StatusBadge } from '../admin/StatusBadge'
import { cn } from '../../utils/cn'

const TYPE_STYLES: Record<OwnerProperty['type'], string> = {
  BOYS: 'border-forest/25 bg-forest-soft text-forest',
  GIRLS: 'border-gold/40 bg-gold-soft text-gold-dark',
  CO_LIVING: 'border-ink/20 bg-ivory text-ink-soft',
}

export interface PropertyCardStats {
  rooms: number
  beds: number
  occupied: number
  available: number
}

/** Premium property card used on /owner/properties. */
export function PropertyCard({
  property,
  stats,
}: {
  property: OwnerProperty
  stats: PropertyCardStats
}) {
  const occupancyPct = stats.beds > 0 ? Math.round((stats.occupied / stats.beds) * 100) : 0

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-card-hover">
      {/* Cover */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={property.coverImage}
          alt={`${property.name} (demo photograph)`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent"
          aria-hidden
        />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span
            className={cn(
              'rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] backdrop-blur',
              TYPE_STYLES[property.type],
            )}
          >
            {PG_TYPE_LABELS[property.type]}
          </span>
          <span className="rounded-full border border-white/30 bg-white/85 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink">
            Demo
          </span>
        </div>
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg text-white drop-shadow">{property.name}</h2>
            <p className="truncate text-xs text-white/85">
              {property.locality} · {property.city}
            </p>
          </div>
          <StatusBadge status={property.status} className="shrink-0 bg-white/95" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 divide-x divide-line border-b border-line bg-ivory/40 text-center">
        {(
          [
            ['Rooms', stats.rooms],
            ['Beds', stats.beds],
            ['Occupied', stats.occupied],
            ['Available', stats.available],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="px-2 py-3">
            <p className="text-base font-bold leading-none text-ink">{value}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-ink-mute">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Occupancy bar */}
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between text-[11px] font-semibold text-ink-soft">
          <span className="inline-flex items-center gap-1.5">
            <BedDouble className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
            Occupancy
          </span>
          <span className="text-forest">{occupancyPct}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-ivory-deep">
          <div
            className="h-full rounded-full bg-forest transition-all duration-500"
            style={{ width: `${occupancyPct}%` }}
            aria-hidden
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2.5 px-5 pb-5">
        <Link
          to={`/owner/properties/${property.id}`}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-forest/25 px-4 py-2.5 text-xs font-bold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
        >
          <Eye className="h-3.5 w-3.5" aria-hidden />
          View details
        </Link>
        <Link
          to={`/owner/properties/${property.id}/edit`}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-forest px-4 py-2.5 text-xs font-bold text-ivory transition-colors hover:bg-forest-light"
        >
          <PencilLine className="h-3.5 w-3.5" aria-hidden />
          Edit listing
        </Link>
        <Link
          to={`/owner/properties/${property.id}`}
          aria-label={`Open ${property.name}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-ink-soft transition-colors hover:border-forest hover:text-forest lg:hidden"
        >
          <Building2 className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </article>
  )
}
