import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Bell, CheckCheck, ChevronRight, X } from 'lucide-react'
import { cn } from '../../utils/cn'

/** Normalised notification row shared by admin, owner and student bells. */
export interface BellItem {
  id: string
  title: string
  body: string
  /** Raw date string — the component appends the demo suffix. */
  date: string
  read: boolean
  /** Small source chip, e.g. "Notice", "Message", "SUBSCRIPTION". */
  chip: string
  /** Where "Open page" should take the user. */
  to?: string
}

interface BellDropdownProps {
  items: BellItem[]
  onMarkAll: () => void
  onMarkRead: (id: string) => void
  onDismiss?: (id: string) => void
  /** "Open page" in the message detail — parent handles navigation + close. */
  onOpen: (item: BellItem) => void
  footer?: ReactNode
  emptyText?: string
}

/**
 * Premium notification bell dropdown (Sections 01–08, all three roles).
 *
 * - Forest gradient header with an unread count and a gold "Mark all read" pill.
 * - Rows expand into an inline message detail (read in place, no navigation).
 * - Unread rows get a gold left bar, ivory wash and a dot marker.
 * - Gold-accented footer link with an arrow affordance.
 */
export function BellDropdown({
  items,
  onMarkAll,
  onMarkRead,
  onDismiss,
  onOpen,
  footer,
  emptyText = "You're all caught up",
}: BellDropdownProps) {
  const [openId, setOpenId] = useState<string | null>(null)

  const unread = items.filter((i) => !i.read).length
  const active = useMemo(
    () => (openId ? (items.find((i) => i.id === openId) ?? null) : null),
    [items, openId],
  )

  const openItem = (item: BellItem) => {
    if (!item.read) onMarkRead(item.id)
    setOpenId(item.id)
  }

  const dismissActive = () => {
    if (!active) return
    onDismiss?.(active.id)
    setOpenId(null)
  }

  return (
    <div className="fade-scale-in absolute right-0 top-[calc(100%+0.6rem)] z-40 w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-white shadow-pop">
      {active ? (
        /* -------------------------------------------------- message detail */
        <div className="fade-scale-in">
          <div className="flex items-center justify-between gap-2 border-b border-line bg-gradient-to-r from-forest to-forest-light px-3 py-2.5">
            <button
              type="button"
              onClick={() => setOpenId(null)}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ivory transition-colors hover:bg-white/10"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              All notifications
            </button>
            {onDismiss && (
              <button
                type="button"
                onClick={dismissActive}
                aria-label="Clear this notification"
                className="rounded-full p-1.5 text-ivory/80 transition-colors hover:bg-white/10 hover:text-gold"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>

          <div className="px-4 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-gold-soft px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider text-gold-dark">
                {active.chip}
              </span>
              <span className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-mute">
                {active.date} · demo
              </span>
              {active.read && (
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-forest">
                  <CheckCheck className="h-3.5 w-3.5" aria-hidden />
                  Read
                </span>
              )}
            </div>
            <h4 className="mt-3 text-sm font-bold leading-snug text-ink">{active.title}</h4>
            <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-line text-[12.5px] leading-relaxed text-ink-mute">
              {active.body}
            </p>
          </div>

          <div className="flex items-center gap-2 border-t border-line bg-ivory/60 px-4 py-3">
            {active.to && (
              <button
                type="button"
                onClick={() => onOpen(active)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-forest px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-ivory transition-colors hover:bg-forest-dark"
              >
                Open page
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpenId(null)}
              className="inline-flex items-center justify-center rounded-full border border-line bg-white px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-ink transition-colors hover:bg-ivory"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        /* ----------------------------------------------------- list view */
        <>
          <div className="flex items-center justify-between border-b border-line bg-gradient-to-r from-forest to-forest-light px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-gold">
                <Bell className="h-4 w-4" aria-hidden />
              </span>
              <div className="leading-tight">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ivory">
                  Notifications
                </p>
                <p className="text-[10.5px] text-ivory/70">
                  {unread > 0 ? `${unread} unread` : 'All read'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onMarkAll}
              disabled={unread === 0}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gold/60 bg-gold/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gold transition-colors hover:bg-gold hover:text-forest-dark disabled:pointer-events-none disabled:opacity-40"
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden />
              Mark all read
            </button>
          </div>

          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <li className="flex flex-col items-center gap-2 px-6 py-8 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-soft text-forest">
                  <CheckCheck className="h-5 w-5" aria-hidden />
                </span>
                <p className="text-[12.5px] font-semibold text-ink">{emptyText}</p>
                <p className="text-[11px] text-ink-mute">
                  Nothing new right now.
                </p>
              </li>
            )}
            {items.map((item) => (
              <li
                key={item.id}
                className={cn(
                  'group relative border-b border-line/70 last:border-0',
                  !item.read && 'bg-gold-soft/40',
                )}
              >
                {!item.read && (
                  <span className="absolute left-0 top-0 h-full w-[3px] bg-gold" aria-hidden />
                )}
                <div className="flex items-start">
                  <button
                    type="button"
                    onClick={() => openItem(item)}
                    aria-label={`Read notification: ${item.title}`}
                    className="flex min-w-0 flex-1 items-start gap-3 py-3.5 pl-4 pr-2 text-left transition-colors hover:bg-ivory/60"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            'truncate text-[13px] text-ink',
                            item.read ? 'font-medium' : 'font-bold',
                          )}
                        >
                          {item.title}
                        </span>
                        {!item.read && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                        )}
                      </span>
                      <span className="mt-0.5 block line-clamp-2 text-[11.5px] leading-snug text-ink-mute">
                        {item.body}
                      </span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-line bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ink-soft">
                          {item.chip}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-mute/80">
                          {item.date}
                        </span>
                      </span>
                    </span>
                    <ChevronRight
                      className="mt-1 h-4 w-4 shrink-0 text-ink-mute opacity-0 transition group-hover:opacity-100"
                      aria-hidden
                    />
                  </button>
                  {onDismiss && (
                    <button
                      type="button"
                      onClick={() => onDismiss(item.id)}
                      aria-label={`Clear notification: ${item.title}`}
                      className="mr-2 mt-3 shrink-0 rounded-full p-1 text-ink-mute opacity-0 transition hover:bg-danger-soft hover:text-danger focus:opacity-100 group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {footer && (
            <div className="border-t border-line bg-ivory/60 px-4 py-3 text-center">{footer}</div>
          )}
        </>
      )}
    </div>
  )
}
