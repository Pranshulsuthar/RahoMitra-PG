import { Link } from 'react-router-dom'
import { ArrowRight, MapPin } from 'lucide-react'
import type { PG } from '../../types'
import { formatINR } from '../../utils/format'
import { availableFacilities } from './facilityMeta'
import { Badge, DemoBadge } from '../common/Badge'
import { ImageWithFallback } from '../common/ImageWithFallback'

const categoryTone = {
  Boys: 'bg-forest text-ivory',
  Girls: 'bg-gold text-forest-dark',
  'Co-living': 'bg-white/95 text-forest',
} as const

/**
 * Listing card — the WHOLE card is a single link to the details page,
 * so users can tap anywhere to open the property.
 */
export function PGCard({ pg }: { pg: PG }) {
  const facilities = availableFacilities(pg.facilities).slice(0, 5)

  return (
    <Link
      to={`/pg/${pg.slug}`}
      aria-label={`View details of ${pg.name} (demo listing)`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-card-hover focus-visible:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold active:translate-y-0 active:scale-[0.99]"
    >
      <div className="relative h-52 overflow-hidden">
        <ImageWithFallback
          src={pg.coverImage}
          alt={`${pg.name} — demo property image`}
          className="transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <DemoBadge />
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] shadow-sm ${categoryTone[pg.category]}`}
          >
            {pg.category} PG
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg text-ink transition-colors group-hover:text-forest">
          {pg.name}
        </h3>

        <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-ink-soft">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-gold-dark" aria-hidden />
          <span className="truncate">
            {pg.locality}, {pg.city}
          </span>
          <span className="shrink-0 rounded bg-ivory px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-mute">
            Demo
          </span>
        </p>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="font-display text-2xl font-semibold text-forest">{formatINR(pg.rent)}</span>
          <span className="text-xs text-ink-soft">/month</span>
          <span className="ml-auto rounded-full bg-gold-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-dark">
            Sample rent
          </span>
        </div>

        <ul className="mt-4 flex flex-wrap gap-1.5">
          {facilities.map(({ key, label, icon: Icon }) => (
            <li
              key={key}
              className="inline-flex items-center gap-1 rounded-full bg-ivory px-2.5 py-1 text-[11px] font-medium text-ink-soft"
            >
              <Icon className="h-3 w-3 text-forest" aria-hidden />
              {label}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
          <Badge tone="outline">{pg.sharingOptions.join(' · ')}</Badge>
          {/* Visual affordance only — the whole card is already the link. */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-xs font-semibold text-ivory transition-colors group-hover:bg-forest-light">
            View Details
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  )
}
