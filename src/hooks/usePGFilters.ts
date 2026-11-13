import { useCallback, useEffect, useMemo, useState } from 'react'
import { PG_LISTINGS } from '../data/pgData'
import type { PG, PGCategory, RentSort, SharingOption } from '../types'

export interface PGFilterState {
  locality: string
  categories: PGCategory[]
  minRent: number | ''
  maxRent: number | ''
  ac: boolean
  wifi: boolean
  food: boolean
  laundry: boolean
  sharing: SharingOption | 'Any'
  sort: RentSort
}

export const DEFAULT_FILTERS: PGFilterState = {
  locality: '',
  categories: [],
  minRent: '',
  maxRent: '',
  ac: false,
  wifi: false,
  food: false,
  laundry: false,
  sharing: 'Any',
  sort: 'default',
}

export interface InitialFilters {
  locality?: string
  categories?: PGCategory[]
  minRent?: number | ''
  maxRent?: number | ''
}

function matchesFilters(pg: PG, filters: PGFilterState): boolean {
  const locality = filters.locality.trim().toLowerCase()
  if (locality) {
    const haystack = `${pg.name} ${pg.locality} ${pg.city}`.toLowerCase()
    if (!haystack.includes(locality)) return false
  }

  if (filters.categories.length > 0 && !filters.categories.includes(pg.category)) return false

  if (filters.minRent !== '' && pg.rent < filters.minRent) return false
  if (filters.maxRent !== '' && pg.rent > filters.maxRent) return false

  if (filters.ac && !pg.facilities.ac) return false
  if (filters.wifi && !pg.facilities.wifi) return false
  if (filters.food && !pg.facilities.food) return false
  if (filters.laundry && !pg.facilities.laundry) return false

  if (filters.sharing !== 'Any' && !pg.sharingOptions.includes(filters.sharing)) return false

  return true
}

function sortListings(listings: PG[], sort: RentSort): PG[] {
  const copy = [...listings]
  if (sort === 'price-asc') copy.sort((a, b) => a.rent - b.rent)
  if (sort === 'price-desc') copy.sort((a, b) => b.rent - a.rent)
  return copy
}

/** Number of non-default filter facets (used for the "Clear filters" badge). */
export function countActiveFilters(filters: PGFilterState): number {
  let count = 0
  if (filters.locality.trim()) count++
  count += filters.categories.length
  if (filters.minRent !== '' || filters.maxRent !== '') count++
  if (filters.ac) count++
  if (filters.wifi) count++
  if (filters.food) count++
  if (filters.laundry) count++
  if (filters.sharing !== 'Any') count++
  return count
}

export type SetFilterFn = <K extends keyof PGFilterState>(key: K, value: PGFilterState[K]) => void

/**
 * Search / filter / sort state for the Explore page, powered by local demo data.
 */
export function usePGFilters(initial: InitialFilters = {}) {
  const [filters, setFilters] = useState<PGFilterState>({
    ...DEFAULT_FILTERS,
    ...initial,
    categories: initial.categories ?? [],
  })

  // Brief loading state so the list has a proper loading UI on first render.
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 400)
    return () => window.clearTimeout(timer)
  }, [])

  const setFilter = useCallback(<K extends keyof PGFilterState>(key: K, value: PGFilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const toggleCategory = useCallback((category: PGCategory) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters((prev) => ({ ...DEFAULT_FILTERS, sort: prev.sort }))
  }, [])

  const resetAll = useCallback(() => setFilters(DEFAULT_FILTERS), [])

  const results = useMemo(
    () => sortListings(PG_LISTINGS.filter((pg) => matchesFilters(pg, filters)), filters.sort),
    [filters],
  )

  const activeFilterCount = countActiveFilters(filters)

  return {
    filters,
    setFilter,
    toggleCategory,
    clearFilters,
    resetAll,
    results,
    isLoading,
    activeFilterCount,
    total: PG_LISTINGS.length,
  }
}
