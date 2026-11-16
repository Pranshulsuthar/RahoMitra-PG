import { useCallback, useEffect, useState } from 'react'
import { fetchPGs } from '../api/pg'
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
 * Search / filter / sort state for the Explore page, powered by real backend PG API.
 */
export function usePGFilters(initial: InitialFilters = {}) {
  const [filters, setFilters] = useState<PGFilterState>({
    ...DEFAULT_FILTERS,
    ...initial,
    categories: initial.categories ?? [],
  })

  const [results, setResults] = useState<PG[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const facilities: string[] = []
    if (filters.ac) facilities.push('ac')
    if (filters.wifi) facilities.push('wifi')
    if (filters.food) facilities.push('food')
    if (filters.laundry) facilities.push('laundry')

    try {
      const res = await fetchPGs({
        category: filters.categories.length > 0 ? filters.categories : undefined,
        locality: filters.locality.trim() || undefined,
        sort: filters.sort,
        facilities: facilities.length > 0 ? facilities : undefined,
        sharing: filters.sharing,
        minRent: filters.minRent,
        maxRent: filters.maxRent,
        page: 1,
        limit: 50,
      })
      setResults(res.data)
      setTotal(res.meta.total)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch PG listings'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    let active = true
    const timer = setTimeout(() => {
      if (active) {
        refetch()
      }
    }, 150)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [refetch])

  const activeFilterCount = countActiveFilters(filters)

  return {
    filters,
    setFilter,
    toggleCategory,
    clearFilters,
    resetAll,
    results,
    isLoading,
    error,
    refetch,
    activeFilterCount,
    total,
  }
}
