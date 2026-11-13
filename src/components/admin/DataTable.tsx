import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import { cn } from '../../utils/cn'
import { EmptyState } from '../common/EmptyState'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  /** Enables click-to-sort on this column. */
  sortValue?: (row: T) => string | number
  className?: string
}

interface DataTableProps<T> {
  columns: Array<Column<T>>
  rows: T[]
  rowKey: (row: T) => string
  pageSize?: number
  emptyTitle?: string
  emptyDescription?: string
  toolbar?: ReactNode
}

type SortState = { key: string; dir: 'asc' | 'desc' } | null

/** Data table with built-in sorting, pagination and an empty state. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  pageSize = 8,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting the search or filters — all data shown here is demo data.',
  toolbar,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>(null)
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sortValue) return rows
    const factor = sort.dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a)
      const bv = col.sortValue!(b)
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor
      return String(av).localeCompare(String(bv)) * factor
    })
  }, [rows, sort, columns])

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize)

  const toggleSort = (key: string) => {
    setPage(0)
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return null
    })
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
      {toolbar && (
        <div className="border-b border-line bg-ivory/50 px-5 py-4">{toolbar}</div>
      )}

      {pageRows.length === 0 ? (
        <div className="p-5">
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            icon={<Inbox className="h-6 w-6" aria-hidden />}
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-ivory/60">
                {columns.map((col) => {
                  const active = sort?.key === col.key
                  return (
                    <th
                      key={col.key}
                      scope="col"
                      className={cn('whitespace-nowrap px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-soft', col.className)}
                    >
                      {col.sortValue ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(col.key)}
                          className={cn(
                            'inline-flex items-center gap-1.5 transition-colors hover:text-forest',
                            active && 'text-forest',
                          )}
                        >
                          {col.header}
                          {active ? (
                            sort!.dir === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                            )
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden />
                          )}
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="border-b border-line/70 transition-colors last:border-0 hover:bg-ivory/40"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-5 py-4 text-sm text-ink-soft', col.className)}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sorted.length > pageSize && (
        <div className="flex flex-col gap-3 border-t border-line bg-ivory/40 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-mute">
            Showing {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, sorted.length)} of{' '}
            {sorted.length} records · demo data
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              aria-label="Previous page"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-ink-soft transition-colors hover:border-forest hover:text-forest disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <span className="px-1 text-xs font-semibold text-ink-soft">
              {safePage + 1} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              aria-label="Next page"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-ink-soft transition-colors hover:border-forest hover:text-forest disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
