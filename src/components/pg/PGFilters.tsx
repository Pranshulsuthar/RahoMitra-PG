import type { ReactNode } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import type { PGCategory, SharingOption } from '../../types'
import type { PGFilterState, SetFilterFn } from '../../hooks/usePGFilters'
import { FACILITY_META } from './facilityMeta'
import type { FacilityMeta } from './facilityMeta'
import { cn } from '../../utils/cn'

const CATEGORIES: PGCategory[] = ['Boys', 'Girls', 'Co-living']
const SHARING_OPTIONS: Array<SharingOption | 'Any'> = ['Any', 'Single', 'Double', 'Triple']

/** Filter facets that map onto the boolean facilities of a listing. */
type FacetKey = 'ac' | 'wifi' | 'food' | 'laundry'
const FACET_KEYS = FACILITY_META.filter((f): f is FacilityMeta & { key: FacetKey } =>
  (['ac', 'wifi', 'food', 'laundry'] as string[]).includes(f.key),
)

interface PGFiltersProps {
  filters: PGFilterState
  setFilter: SetFilterFn
  toggleCategory: (category: PGCategory) => void
  clearFilters: () => void
  activeFilterCount: number
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-ink-mute">
      {children}
    </span>
  )
}

export function PGFilters({
  filters,
  setFilter,
  toggleCategory,
  clearFilters,
  activeFilterCount,
}: PGFiltersProps) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-card lg:sticky lg:top-[92px]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-sans text-sm font-bold uppercase tracking-[0.14em] text-ink">
          <SlidersHorizontal className="h-4 w-4 text-gold-dark" aria-hidden />
          Filters
          {activeFilterCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[10px] font-bold text-forest-dark">
              {activeFilterCount}
            </span>
          )}
        </h2>
        <button
          type="button"
          onClick={clearFilters}
          disabled={activeFilterCount === 0}
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
            activeFilterCount === 0
              ? 'cursor-not-allowed text-ink-mute'
              : 'text-danger hover:bg-danger-soft',
          )}
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          Clear filters
        </button>
      </div>

      <div className="space-y-6">
        {/* Locality search */}
        <div>
          <FieldLabel>Locality</FieldLabel>
          <input
            type="search"
            className="form-input"
            placeholder="e.g. Malviya Nagar"
            value={filters.locality}
            onChange={(event) => setFilter('locality', event.target.value)}
            aria-label="Search by locality"
          />
        </div>

        {/* Category */}
        <div>
          <FieldLabel>PG Type</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => {
              const active = filters.categories.includes(category)
              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleCategory(category)}
                  className={cn(
                    'rounded-full border px-3.5 py-2 text-xs font-semibold transition-all',
                    active
                      ? 'border-forest bg-forest text-ivory'
                      : 'border-line bg-white text-ink-soft hover:border-forest hover:text-forest',
                  )}
                >
                  {category}
                </button>
              )
            })}
          </div>
        </div>

        {/* Rent range */}
        <div>
          <FieldLabel>Monthly rent (₹)</FieldLabel>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              className="form-input"
              placeholder="Min"
              aria-label="Minimum rent"
              value={filters.minRent}
              onChange={(event) =>
                setFilter('minRent', event.target.value === '' ? '' : Number(event.target.value))
              }
            />
            <span className="text-ink-mute">–</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              className="form-input"
              placeholder="Max"
              aria-label="Maximum rent"
              value={filters.maxRent}
              onChange={(event) =>
                setFilter('maxRent', event.target.value === '' ? '' : Number(event.target.value))
              }
            />
          </div>
        </div>

        {/* Facilities */}
        <div>
          <FieldLabel>Facilities</FieldLabel>
          <ul className="space-y-2.5">
            {FACET_KEYS.map(({ key, label, icon: Icon }) => {
              const active = filters[key]
              return (
                <li key={key}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 text-sm text-ink-soft transition-colors hover:text-ink">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(event) => setFilter(key, event.target.checked)}
                      className="h-4 w-4 shrink-0 cursor-pointer accent-[#173D32]"
                    />
                    <Icon className="h-4 w-4 text-forest" aria-hidden />
                    <span>{label}</span>
                    {key === 'ac' && (
                      <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-ink-mute">
                        AC only
                      </span>
                    )}
                  </label>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Sharing */}
        <div>
          <FieldLabel>Room sharing</FieldLabel>
          <select
            className="form-input"
            value={filters.sharing}
            onChange={(event) => setFilter('sharing', event.target.value as SharingOption | 'Any')}
            aria-label="Room sharing option"
          >
            {SHARING_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === 'Any' ? 'Any sharing' : `${option} sharing`}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
