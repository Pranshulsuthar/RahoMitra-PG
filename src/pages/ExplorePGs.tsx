import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X } from 'lucide-react'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { usePGFilters } from '../hooks/usePGFilters'
import type { PGCategory } from '../types'
import { BUDGET_OPTIONS } from '../utils/constants'
import { PageHeader } from '../components/common/PageHeader'
import { EmptyState } from '../components/common/EmptyState'
import { Button } from '../components/common/Button'
import { PGFilters } from '../components/pg/PGFilters'
import { PGGrid } from '../components/pg/PGGrid'

const CATEGORY_VALUES: PGCategory[] = ['Boys', 'Girls', 'Co-living']

export function ExplorePGs() {
  useDocumentTitle('Explore PGs')
  const [searchParams] = useSearchParams()

  // Initial state is derived from the hero search query string.
  const initial = useMemo(() => {
    const locality = searchParams.get('locality') ?? ''
    const type = searchParams.get('type')
    const budgetIndex = searchParams.get('budget')
    const categories =
      type && (CATEGORY_VALUES as string[]).includes(type) ? [type as PGCategory] : []
    const budget = budgetIndex ? BUDGET_OPTIONS[Number(budgetIndex)] : undefined
    return {
      locality,
      categories,
      minRent: budget?.min ?? '',
      maxRent: budget?.max ?? '',
    }
  }, [searchParams])

  const {
    filters,
    setFilter,
    toggleCategory,
    clearFilters,
    results,
    isLoading,
    activeFilterCount,
    total,
  } = usePGFilters(initial)

  const [showMobileFilters, setShowMobileFilters] = useState(false)

  return (
    <>
      <PageHeader
        title="Explore PGs"
        subtitle="Search by locality, filter by PG type, budget and facilities, then shortlist the stays that fit you best. All listings on this build are illustrative demo data."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Explore PGs' }]}
      />

      <section className="bg-white py-10 sm:py-14">
        <div className="page-container">
          <div className="grid items-start gap-8 lg:grid-cols-[300px_1fr]">
            {/* Filters — sidebar on desktop, collapsible on mobile */}
            <div className={showMobileFilters ? 'block' : 'hidden lg:block'}>
              <PGFilters
                filters={filters}
                setFilter={setFilter}
                toggleCategory={toggleCategory}
                clearFilters={clearFilters}
                activeFilterCount={activeFilterCount}
              />
            </div>

            <div>
              {/* Toolbar */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-ink-soft" role="status" aria-live="polite">
                    {isLoading ? (
                      'Loading demo listings…'
                    ) : (
                      <>
                        <span className="font-semibold text-ink">{results.length}</span>{' '}
                        {results.length === 1 ? 'property' : 'properties'} found
                        <span className="text-ink-mute"> · {total} demo listings total</span>
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMobileFilters((value) => !value)}
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-xs font-semibold text-forest transition-colors hover:border-forest lg:hidden"
                    aria-expanded={showMobileFilters}
                  >
                    {showMobileFilters ? (
                      <X className="h-4 w-4" aria-hidden />
                    ) : (
                      <SlidersHorizontal className="h-4 w-4" aria-hidden />
                    )}
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[10px] font-bold text-forest-dark">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  <label className="sr-only" htmlFor="sort-by">
                    Sort by price
                  </label>
                  <select
                    id="sort-by"
                    className="form-input w-auto min-w-[190px] py-2.5 text-sm"
                    value={filters.sort}
                    onChange={(event) =>
                      setFilter('sort', event.target.value as typeof filters.sort)
                    }
                  >
                    <option value="default">Sort: Default</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {/* Results */}
              {isLoading ? (
                <PGGrid listings={[]} isLoading />
              ) : results.length === 0 ? (
                <EmptyState
                  title="No PGs match your filters"
                  description="Try widening your rent range, clearing a few facility filters, or searching a different locality."
                  action={
                    <Button variant="primary" onClick={clearFilters}>
                      Clear all filters
                    </Button>
                  }
                />
              ) : (
                <PGGrid listings={results} />
              )}

              <p className="mt-8 rounded-xl border border-dashed border-line bg-ivory/60 px-4 py-3 text-[12px] leading-relaxed text-ink-soft">
                <strong className="font-semibold text-ink">Note:</strong> all properties, prices and
                availability on this page are illustrative demo data created for interface
                demonstration. Contact details are intentionally not published for demo listings.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
