import type { PG } from '../../types'
import { PGCard } from './PGCard'
import { cn } from '../../utils/cn'

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="h-52 animate-pulse bg-ivory-dark" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-2/3 animate-pulse rounded bg-ivory-dark" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-ivory-dark" />
        <div className="h-8 w-full animate-pulse rounded bg-ivory-dark" />
        <div className="h-9 w-full animate-pulse rounded bg-ivory-dark" />
      </div>
    </div>
  )
}

export function PGGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3" aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  )
}

export function PGGrid({ listings, isLoading }: { listings: PG[]; isLoading?: boolean }) {
  if (isLoading) return <PGGridSkeleton count={6} />
  return (
    <div className={cn('grid gap-6 sm:grid-cols-2 xl:grid-cols-3')}>
      {listings.map((pg) => (
        <PGCard key={pg.id} pg={pg} />
      ))}
    </div>
  )
}
