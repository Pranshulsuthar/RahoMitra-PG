import { useMemo, useState } from 'react'
import { CheckCheck, Megaphone, Mail, Wrench, Zap, Droplets, AlertTriangle, BookOpen } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useStudentStore } from '../../context/StudentStore'
import { NOTICE_CATEGORY_LABELS } from '../../types/student'
import type { NoticeCategory } from '../../types/student'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { SearchInput, FilterSelect } from '../../components/admin/Filters'
import { EmptyState } from '../../components/common/EmptyState'
import { Button } from '../../components/common/Button'
import { cn } from '../../utils/cn'

const CATEGORY_META: Record<
  NoticeCategory,
  { icon: typeof Megaphone; classes: string; badge: string }
> = {
  GENERAL: {
    icon: BookOpen,
    classes: 'bg-ivory text-ink-soft',
    badge: 'bg-ivory-deep/60 text-ink-soft border-line',
  },
  MAINTENANCE: {
    icon: Wrench,
    classes: 'bg-gold-soft text-gold-dark',
    badge: 'bg-gold-soft text-gold-dark border-gold/40',
  },
  FOOD: {
    icon: Mail,
    classes: 'bg-forest-soft text-forest',
    badge: 'bg-forest-soft text-forest border-forest/25',
  },
  ELECTRICITY: {
    icon: Zap,
    classes: 'bg-gold-soft text-gold-dark',
    badge: 'bg-gold-soft text-gold-dark border-gold/40',
  },
  WATER: {
    icon: Droplets,
    classes: 'bg-forest-soft text-forest',
    badge: 'bg-forest-soft text-forest border-forest/25',
  },
  IMPORTANT: {
    icon: AlertTriangle,
    classes: 'bg-danger-soft text-danger',
    badge: 'bg-danger-soft text-danger border-danger/30',
  },
}

const CATEGORY_OPTIONS = [
  { value: 'ALL', label: 'All categories' },
  ...((Object.keys(NOTICE_CATEGORY_LABELS) as NoticeCategory[]).map((key) => ({
    value: key,
    label: NOTICE_CATEGORY_LABELS[key],
  })) as Array<{ value: string; label: string }>),
]

const READ_OPTIONS = [
  { value: 'ALL', label: 'Any status' },
  { value: 'UNREAD', label: 'Unread only' },
  { value: 'READ', label: 'Read only' },
]

/** /student/notices — searchable, filterable local demo notice board. */
export function Notices() {
  useDocumentTitle('Notices')

  const { notices, unreadCount, markNoticeRead, markAllNoticesRead, pushToast } = useStudentStore()

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('ALL')
  const [readFilter, setReadFilter] = useState('ALL')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return notices.filter((notice) => {
      if (category !== 'ALL' && notice.category !== category) return false
      if (readFilter === 'READ' && !notice.read) return false
      if (readFilter === 'UNREAD' && notice.read) return false
      if (q.length > 0) {
        const haystack = `${notice.title} ${notice.description} ${notice.category}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [notices, query, category, readFilter])

  const hasFilters = query.trim().length > 0 || category !== 'ALL' || readFilter !== 'ALL'

  return (
    <>
      <AdminPageHeader
        title="Notices"
        description="Your PG notice board — search, filter by category and mark demo notices as read."
        actions={
          <Button
            variant="outline"
            onClick={() => {
              markAllNoticesRead()
              pushToast('All demo notices marked as read.', 'info')
            }}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="h-4 w-4" aria-hidden />
            Mark all read
          </Button>
        }
      />

      <DemoBanner message="all notices are local illustrative demo records — nothing was pushed from a server and nothing is delivered to any device." />

      {/* ------------------------------------------------------ toolbar */}
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search notices…"
            className="sm:w-64"
          />
          <div className="flex flex-wrap items-center gap-3">
            <FilterSelect
              label="Category"
              value={category}
              onChange={setCategory}
              options={CATEGORY_OPTIONS}
            />
            <FilterSelect
              label="Status"
              value={readFilter}
              onChange={setReadFilter}
              options={READ_OPTIONS}
            />
          </div>
        </div>
        <span className="flex items-center gap-2 text-[12.5px] font-bold text-ink-soft">
          <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-gold px-2 text-[12px] font-bold text-forest-dark">
            {unreadCount}
          </span>
          unread · {filtered.length} shown · demo
        </span>
      </div>

      {/* -------------------------------------------------------- list */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No notices found"
          description={
            hasFilters
              ? 'No demo notices match your search or filters. Try clearing them.'
              : 'No demo notices yet — check back later.'
          }
          icon={<Megaphone className="h-6 w-6" aria-hidden />}
          action={
            hasFilters ? (
              <Button
                variant="outline"
                onClick={() => {
                  setQuery('')
                  setCategory('ALL')
                  setReadFilter('ALL')
                }}
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-3.5">
          {filtered.map((notice) => {
            const meta = CATEGORY_META[notice.category]
            const Icon = meta.icon
            return (
              <li
                key={notice.id}
                className={cn(
                  'rounded-3xl border bg-white p-5 shadow-card transition-all',
                  notice.read ? 'border-line opacity-80' : 'border-gold/50 shadow-card-hover',
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3.5">
                    <span
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                        meta.classes,
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="text-[15px] font-bold text-ink">{notice.title}</h2>
                        {!notice.read && (
                          <span className="flex items-center gap-1.5 rounded-full bg-gold px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-forest-dark">
                            <span className="h-1.5 w-1.5 rounded-full bg-forest-dark" aria-hidden />
                            Unread
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11.5px] text-ink-mute">
                        <span
                          className={cn(
                            'inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]',
                            meta.badge,
                          )}
                        >
                          {NOTICE_CATEGORY_LABELS[notice.category]}
                        </span>
                        <span>Posted {notice.date}</span>
                        <span aria-hidden>·</span>
                        <span>{notice.read ? 'Read' : 'Unread'}</span>
                      </div>
                      <p className="mt-2.5 max-w-3xl text-[13.5px] leading-relaxed text-ink-soft">
                        {notice.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {notice.read ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markNoticeRead(notice.id, false)}
                      >
                        Mark unread
                      </Button>
                    ) : (
                      <Button
                        variant="gold"
                        size="sm"
                        onClick={() => {
                          markNoticeRead(notice.id)
                          pushToast('Notice marked as read (demo).', 'info')
                        }}
                      >
                        Mark as Read
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
