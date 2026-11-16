import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle, RotateCcw, SlidersHorizontal, X } from 'lucide-react'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { usePGFilters } from '../hooks/usePGFilters'
import { useAdminStore } from '../context/AdminStore'
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
  const [searchParams, setSearchParams] = useSearchParams()

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
    error,
    refetch,
    activeFilterCount,
    total,
  } = usePGFilters(initial)

  // Keep URL query parameters in sync with active filters
  useEffect(() => {
    const nextParams = new URLSearchParams()
    if (filters.locality.trim()) nextParams.set('locality', filters.locality.trim())
    if (filters.categories.length === 1) nextParams.set('type', filters.categories[0])
    if (filters.minRent !== '') nextParams.set('minRent', String(filters.minRent))
    if (filters.maxRent !== '') nextParams.set('maxRent', String(filters.maxRent))
    if (filters.sharing !== 'Any') nextParams.set('sharing', filters.sharing)
    if (filters.sort !== 'default') nextParams.set('sort', filters.sort)
    if (filters.ac) nextParams.set('ac', 'true')
    if (filters.wifi) nextParams.set('wifi', 'true')
    if (filters.food) nextParams.set('food', 'true')
    if (filters.laundry) nextParams.set('laundry', 'true')

    setSearchParams(nextParams, { replace: true })
  }, [filters, setSearchParams])

  /* Section 08 — approved + active featured listings get a Featured badge. */
  const { featuredRequests } = useAdminStore()
  const featuredMap = useMemo(() => {
    const map = new Map<string, 'FEATURED' | 'PREMIUM_FEATURED'>()
    for (const request of featuredRequests) {
      if (request.status === 'APPROVED' && request.listingStatus === 'ACTIVE') {
        map.set(request.pgId, request.tier)
      }
    }
    return map
  }, [featuredRequests])

  const [showMobileFilters, setShowMobileFilters] = useState(false)

  return (
    <>
      <PageHeader
        title="Explore PGs"
        subtitle="Search by locality, filter by PG type, budget and facilities, then shortlist the stays that fit you best."
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
                      'Loading properties…'
                    ) : error ? (
                      <span className="text-rose-600 font-medium">Failed to load properties</span>
                    ) : (
                      <>
                        <span className="font-semibold text-ink">{results.length}</span>{' '}
                        {results.length === 1 ? 'property' : 'properties'} found
                        <span className="text-ink-mute"> · {total} verified properties</span>
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

              {/* Results, Loading, Error, and Empty States */}
              {isLoading ? (
                <PGGrid listings={[]} isLoading />
              ) : error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center">
                  <AlertCircle className="mx-auto h-10 w-10 text-rose-500" />
                  <h3 className="mt-3 text-base font-semibold text-rose-900">
                    Unable to load properties
                  </h3>
                  <p className="mt-1 text-sm text-rose-700">{error}</p>
                  <Button variant="primary" className="mt-4" onClick={() => refetch()}>
                    <RotateCcw className="h-4 w-4 mr-1.5" />
                    Try Again
                  </Button>
                </div>
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
                <PGGrid listings={results} featuredMap={featuredMap} />
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
