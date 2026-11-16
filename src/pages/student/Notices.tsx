import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  BookOpen,
  CheckCheck,
  Droplets,
  Eye,
  Flame,
  Mail,
  Megaphone,
  Receipt,
  ShieldCheck,
  UtensilsCrossed,
  Wrench,
  X,
  Zap,
} from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAuth } from '../../context/AuthContext'
import { useStudentStore } from '../../context/StudentStore'
import { useCommunicationStore } from '../../context/CommunicationStore'
import { fetchStudentAccommodation, type StudentAccommodation } from '../../api/student'
import { NOTICE_CATEGORY_LABELS } from '../../types/student'
import type { NoticeCategory } from '../../types/student'
import { ANNOUNCEMENT_CATEGORY_LABELS, fmtDate } from '../../types/communication'
import type { Announcement, AnnouncementCategory } from '../../types/communication'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { Modal } from '../../components/admin/Modal'
import { SearchInput, FilterSelect } from '../../components/admin/Filters'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { EmptyState } from '../../components/common/EmptyState'
import { Button } from '../../components/common/Button'
import { cn } from '../../utils/cn'

/* ------------------------------------------------------- icon / colour maps */

const NOTICE_META: Record<
  NoticeCategory,
  { icon: typeof Megaphone; classes: string; badge: string }
> = {
  GENERAL: { icon: BookOpen, classes: 'bg-ivory text-ink-soft', badge: 'bg-ivory-deep/60 text-ink-soft border-line' },
  MAINTENANCE: { icon: Wrench, classes: 'bg-gold-soft text-gold-dark', badge: 'bg-gold-soft text-gold-dark border-gold/40' },
  FOOD: { icon: Mail, classes: 'bg-forest-soft text-forest', badge: 'bg-forest-soft text-forest border-forest/25' },
  ELECTRICITY: { icon: Zap, classes: 'bg-gold-soft text-gold-dark', badge: 'bg-gold-soft text-gold-dark border-gold/40' },
  WATER: { icon: Droplets, classes: 'bg-forest-soft text-forest', badge: 'bg-forest-soft text-forest border-forest/25' },
  IMPORTANT: { icon: AlertTriangle, classes: 'bg-danger-soft text-danger', badge: 'bg-danger-soft text-danger border-danger/30' },
}

const ANNOUNCEMENT_META: Record<
  AnnouncementCategory,
  { icon: typeof Megaphone; classes: string; badge: string }
> = {
  GENERAL: { icon: Bell, classes: 'bg-ivory text-ink-soft', badge: 'bg-ivory-deep/60 text-ink-soft border-line' },
  MAINTENANCE: { icon: Wrench, classes: 'bg-gold-soft text-gold-dark', badge: 'bg-gold-soft text-gold-dark border-gold/40' },
  ELECTRICITY_WATER: { icon: Zap, classes: 'bg-gold-soft text-gold-dark', badge: 'bg-gold-soft text-gold-dark border-gold/40' },
  FOOD_MESS: { icon: UtensilsCrossed, classes: 'bg-forest-soft text-forest', badge: 'bg-forest-soft text-forest border-forest/25' },
  RENT_REMINDER: { icon: Receipt, classes: 'bg-danger-soft text-danger', badge: 'bg-danger-soft text-danger border-danger/30' },
  RULES: { icon: ShieldCheck, classes: 'bg-ivory text-ink-soft', badge: 'bg-ivory-deep/60 text-ink-soft border-line' },
  EMERGENCY: { icon: Flame, classes: 'bg-danger-soft text-danger', badge: 'bg-danger-soft text-danger border-danger/30' },
}

/* ------------------------------------------------------------ unified items */

type BoardItem =
  | {
      kind: 'NOTICE'
      id: string
      title: string
      description: string
      date: string
      category: string
      read: boolean
      meta: { icon: typeof Megaphone; classes: string; badge: string }
      label: string
    }
  | {
      kind: 'ANNOUNCEMENT'
      id: string
      title: string
      description: string
      date: string
      category: string
      read: boolean
      meta: { icon: typeof Megaphone; classes: string; badge: string }
      label: string
      priority: Announcement['priority']
      expiresOn: string
      full: Announcement
    }

const CATEGORY_OPTIONS = [
  { value: 'ALL', label: 'All categories' },
  ...(Object.keys(NOTICE_CATEGORY_LABELS) as NoticeCategory[]).map((key) => ({
    value: `N:${key}`,
    label: NOTICE_CATEGORY_LABELS[key],
  })),
  ...(Object.keys(ANNOUNCEMENT_CATEGORY_LABELS) as AnnouncementCategory[]).map((key) => ({
    value: `A:${key}`,
    label: ANNOUNCEMENT_CATEGORY_LABELS[key],
  })),
]

const READ_OPTIONS = [
  { value: 'ALL', label: 'Any status' },
  { value: 'UNREAD', label: 'Unread only' },
  { value: 'READ', label: 'Read only' },
]

/**
 * /student/notices — the student's notice board. It unions the original
 * StudentStore notices with owner announcements relevant to the student's PG.
 */
export function Notices() {
  useDocumentTitle('Notices')

  const { user } = useAuth()
  const currentStudentId = user?.id || ''
  const todayIso = new Date().toISOString().slice(0, 10)

  const { notices, markNoticeRead, markAllNoticesRead, pushToast } = useStudentStore()
  const { announcements, markAnnouncementRead, markAllNotificationsRead } =
    useCommunicationStore()

  const [liveAccommodation, setLiveAccommodation] = useState<StudentAccommodation | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('ALL')
  const [readFilter, setReadFilter] = useState('ALL')
  const [detail, setDetail] = useState<BoardItem | null>(null)

  useEffect(() => {
    fetchStudentAccommodation()
      .then((acc) => setLiveAccommodation(acc))
      .catch(() => setLiveAccommodation(null))
  }, [])

  const propertyId = liveAccommodation?.property.id || ''
  const propertyName = liveAccommodation?.property.name || 'My PG'

  /* announcements visible to THIS student only */
  const myAnnouncements = useMemo(
    () =>
      announcements.filter(
        (a) =>
          a.published &&
          (!propertyId || a.propertyId === propertyId) &&
          (a.audience === 'ALL' || (currentStudentId && a.audienceStudentIds.includes(currentStudentId))) &&
          (!a.expiresOn || a.expiresOn >= todayIso),
      ),
    [announcements, propertyId, currentStudentId, todayIso],
  )

  const items = useMemo<BoardItem[]>(() => {
    const noticeItems: BoardItem[] = notices.map((n) => ({
      kind: 'NOTICE',
      id: n.id,
      title: n.title,
      description: n.description,
      date: n.date,
      category: `N:${n.category}`,
      read: n.read,
      meta: NOTICE_META[n.category] || NOTICE_META.GENERAL,
      label: NOTICE_CATEGORY_LABELS[n.category] || n.category,
    }))

    const announcementItems: BoardItem[] = myAnnouncements.map((a) => ({
      kind: 'ANNOUNCEMENT',
      id: a.id,
      title: a.title,
      description: a.message,
      date: a.publishedOn,
      category: `A:${a.category}`,
      read: currentStudentId ? a.readBy.includes(currentStudentId) : false,
      meta: ANNOUNCEMENT_META[a.category] || ANNOUNCEMENT_META.GENERAL,
      label: ANNOUNCEMENT_CATEGORY_LABELS[a.category] || a.category,
      priority: a.priority,
      expiresOn: a.expiresOn,
      full: a,
    }))

    return [...noticeItems, ...announcementItems].sort((a, b) =>
      a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
    )
  }, [notices, myAnnouncements, currentStudentId])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      if (category !== 'ALL' && item.category !== category) return false
      if (readFilter === 'READ' && !item.read) return false
      if (readFilter === 'UNREAD' && item.read) return false
      if (q.length > 0) {
        const haystack = `${item.title} ${item.description} ${item.label}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [items, query, category, readFilter])

  const unreadCount = items.filter((i) => !i.read).length
  const hasFilters = query.trim().length > 0 || category !== 'ALL' || readFilter !== 'ALL'

  const markRead = (item: BoardItem, read: boolean) => {
    if (item.kind === 'NOTICE') markNoticeRead(item.id, read)
    else if (currentStudentId) markAnnouncementRead(item.id, currentStudentId)
    if (read) pushToast('Notice marked as read.', 'info')
  }

  const markAll = () => {
    markAllNoticesRead()
    if (currentStudentId) {
      myAnnouncements.forEach((a) => markAnnouncementRead(a.id, currentStudentId))
      markAllNotificationsRead('STUDENT', currentStudentId)
    }
    pushToast('All notices marked as read.', 'info')
  }

  return (
    <>
      <AdminPageHeader
        title="Notices"
        description="Your PG notice board — announcements, rule updates and community notices."
        actions={
          <Button variant="outline" onClick={markAll} disabled={unreadCount === 0}>
            <CheckCheck className="h-4 w-4" aria-hidden />
            Mark all read
          </Button>
        }
      />

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
          unread · {filtered.length} shown
        </span>
      </div>

      {/* -------------------------------------------------------- list */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No notices found"
          description={
            hasFilters
              ? 'No notices match your search or filters. Try clearing them.'
              : 'No notices posted yet — check back later.'
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
          {filtered.map((item) => {
            const Icon = item.meta.icon
            return (
              <li
                key={`${item.kind}-${item.id}`}
                className={cn(
                  'rounded-3xl border bg-white p-5 shadow-card transition-all',
                  item.read ? 'border-line opacity-80' : 'border-gold/50 shadow-card-hover',
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3.5">
                    <span
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                        item.meta.classes,
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="text-[15px] font-bold text-ink">{item.title}</h2>
                        {!item.read && (
                          <span className="flex items-center gap-1.5 rounded-full bg-gold px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-forest-dark">
                            <span className="h-1.5 w-1.5 rounded-full bg-forest-dark" aria-hidden />
                            Unread
                          </span>
                        )}
                        {item.kind === 'ANNOUNCEMENT' && (
                          <StatusBadge status={item.priority} />
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11.5px] text-ink-mute">
                        <span
                          className={cn(
                            'inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]',
                            item.meta.badge,
                          )}
                        >
                          {item.label}
                        </span>
                        <span>
                          {item.kind === 'ANNOUNCEMENT' ? 'Published' : 'Posted'} {fmtDate(item.date)}
                        </span>
                        <span aria-hidden>·</span>
                        <span>{item.read ? 'Read' : 'Unread'}</span>
                        {item.kind === 'ANNOUNCEMENT' && item.expiresOn && (
                          <>
                            <span aria-hidden>·</span>
                            <span>Expires {fmtDate(item.expiresOn)}</span>
                          </>
                        )}
                        {item.kind === 'ANNOUNCEMENT' && (
                          <>
                            <span aria-hidden>·</span>
                            <span>{propertyName}</span>
                          </>
                        )}
                      </div>
                      <p className="mt-2.5 max-w-3xl text-[13.5px] leading-relaxed text-ink-soft">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {item.kind === 'ANNOUNCEMENT' && (
                      <Button variant="outline" size="sm" onClick={() => setDetail(item)}>
                        <Eye size={14} /> Details
                      </Button>
                    )}
                    {item.read ? (
                      item.kind === 'NOTICE' ? (
                        <Button variant="ghost" size="sm" onClick={() => markRead(item, false)}>
                          Mark unread
                        </Button>
                      ) : null
                    ) : (
                      <Button variant="gold" size="sm" onClick={() => markRead(item, true)}>
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

      {/* ------------------------------------------------ announcement detail */}
      <Modal
        open={detail !== null}
        title={detail?.title ?? ''}
        subtitle={
          detail
            ? `${detail.label} · ${fmtDate(detail.date)} · ${propertyName}`
            : ''
        }
        onClose={() => setDetail(null)}
        size="lg"
        footer={
          <>
            <Button variant="outline" size="md" onClick={() => setDetail(null)}>
              <X size={14} /> Close
            </Button>
            {detail && !detail.read && (
              <Button
                variant="gold"
                size="md"
                onClick={() => {
                  markRead(detail, true)
                  setDetail(null)
                }}
              >
                <CheckCheck size={15} /> Mark as Read
              </Button>
            )}
          </>
        }
      >
        {detail && (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]',
                  detail.meta.badge,
                )}
              >
                {detail.label}
              </span>
              {detail.kind === 'ANNOUNCEMENT' && <StatusBadge status={detail.priority} />}
              <span
                className={cn(
                  'inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]',
                  detail.read
                    ? 'border-forest/25 bg-forest-soft text-forest'
                    : 'border-gold/40 bg-gold-soft text-gold-dark',
                )}
              >
                {detail.read ? 'Read' : 'Unread'}
              </span>
            </div>

            <p className="mt-4 whitespace-pre-wrap rounded-2xl border border-line bg-ivory/50 p-4 text-sm leading-relaxed text-ink">
              {detail.description}
            </p>

            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <DetailRow label="Published" value={fmtDate(detail.date)} />
              <DetailRow
                label="Expiry"
                value={detail.kind === 'ANNOUNCEMENT' && detail.expiresOn ? fmtDate(detail.expiresOn) : 'No expiry'}
              />
              <DetailRow label="PG" value={propertyName} />
              <DetailRow
                label="Audience"
                value={
                  detail.kind === 'ANNOUNCEMENT'
                    ? detail.full.audience === 'ALL'
                      ? 'All residents of this PG'
                      : `${detail.full.audienceStudentIds.length} selected resident(s)`
                    : 'All residents'
                }
              />
            </dl>
          </div>
        )}
      </Modal>
    </>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-3.5 py-2.5">
      <dt className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-mute">{label}</dt>
      <dd className="mt-1 text-[13px] font-semibold text-ink">{value}</dd>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-3.5 py-2.5">
      <dt className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-mute">{label}</dt>
      <dd className="mt-1 text-[13px] font-semibold text-ink">{value}</dd>
    </div>
  )
}
