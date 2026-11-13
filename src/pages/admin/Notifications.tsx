import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Bell, CheckCheck, Mail, Megaphone, Send, Users } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdminStore } from '../../context/AdminStore'
import type { NotificationAudience, NotificationCategory, PlatformNotification } from '../../types/admin'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { FilterSelect, SearchInput } from '../../components/admin/Filters'
import { EmptyState } from '../../components/common/EmptyState'
import { cn } from '../../utils/cn'

const CATEGORY_STYLES: Record<NotificationCategory, string> = {
  PLATFORM: 'bg-forest-soft text-forest border-forest/25',
  SUBSCRIPTION: 'bg-gold-soft text-gold-dark border-gold/40',
  FEATURE: 'bg-ivory-deep/60 text-ink-soft border-line',
  MAINTENANCE: 'bg-danger-soft text-danger border-danger/30',
  SUPPORT: 'bg-ivory-deep/60 text-ink-soft border-line',
}

const AUDIENCE_LABELS: Record<NotificationAudience, string> = {
  ALL_OWNERS: 'All PG Owners',
  ALL_STUDENTS: 'All Students',
  SELECTED_OWNERS: 'Selected PG Owners',
}

interface ComposerState {
  title: string
  message: string
  category: NotificationCategory
  audience: NotificationAudience
}

const EMPTY_COMPOSER: ComposerState = {
  title: '',
  message: '',
  category: 'PLATFORM',
  audience: 'ALL_OWNERS',
}

/** /admin/notifications — announcement composer + history (nothing is sent). */
export function Notifications() {
  useDocumentTitle('Notifications')

  const { notifications, owners, addNotification, markNotificationRead, markAllNotificationsRead, pushToast } =
    useAdminStore()

  const [composer, setComposer] = useState<ComposerState>(EMPTY_COMPOSER)
  const [errors, setErrors] = useState<{ title?: string; message?: string }>({})
  const [selectedOwners, setSelectedOwners] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<'ALL' | NotificationCategory>('ALL')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return notifications.filter(
      (n) =>
        (!q || n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q)) &&
        (category === 'ALL' || n.category === category) &&
        (!showUnreadOnly || !n.read),
    )
  }, [notifications, search, category, showUnreadOnly])

  const unread = notifications.filter((n) => !n.read).length

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const next: typeof errors = {}
    if (composer.title.trim().length < 4) next.title = 'Title must be at least 4 characters.'
    if (composer.message.trim().length < 10) next.message = 'Message must be at least 10 characters.'
    if (composer.audience === 'SELECTED_OWNERS' && selectedOwners.length === 0)
      next.message = 'Select at least one owner for this audience.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    addNotification({
      title: composer.title.trim(),
      message: composer.message.trim(),
      category: composer.category,
      audience: composer.audience,
    })
    pushToast('Announcement recorded in demo history — nothing was actually sent.', 'info')
    setComposer(EMPTY_COMPOSER)
    setSelectedOwners([])
  }

  const toggleOwner = (id: string) => {
    setSelectedOwners((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <>
      <AdminPageHeader
        title="Notifications"
        description="Compose platform announcements, choose an audience and review notification history. This build never sends real emails, SMS or push notifications."
        actions={
          <button
            type="button"
            onClick={() => {
              markAllNotificationsRead()
              pushToast('All demo notifications marked as read.', 'info')
            }}
            className="inline-flex items-center gap-2 rounded-full border border-forest/25 bg-white px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
          >
            <CheckCheck className="h-4 w-4" aria-hidden />
            Mark all read
          </button>
        }
      />

      <DemoBanner message="announcements stay in local demo state — no email, SMS or push notification is ever delivered." />

      <div className="grid gap-6 xl:grid-cols-[24rem_minmax(0,1fr)]">
        {/* ------------------------------------------------------- composer */}
        <section className="h-fit rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <h2 className="flex items-center gap-2.5 text-base sm:text-lg">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-soft text-gold-dark">
              <Megaphone className="h-4.5 w-4.5" aria-hidden />
            </span>
            Platform announcement
          </h2>
          <p className="mt-1.5 text-xs text-ink-mute">Frontend-only composer · demo mode</p>

          <form onSubmit={submit} noValidate className="mt-5 space-y-4">
            <div>
              <label htmlFor="ntf-title" className="form-label">
                Title<span className="ml-1 text-danger">*</span>
              </label>
              <input
                id="ntf-title"
                className="form-input"
                placeholder="e.g. Scheduled maintenance window"
                value={composer.title}
                onChange={(event) => {
                  setComposer((prev) => ({ ...prev, title: event.target.value }))
                  setErrors((prev) => ({ ...prev, title: undefined }))
                }}
                aria-invalid={errors.title ? 'true' : undefined}
              />
              {errors.title && (
                <span className="form-error" role="alert">
                  {errors.title}
                </span>
              )}
            </div>

            <div>
              <label htmlFor="ntf-message" className="form-label">
                Message<span className="ml-1 text-danger">*</span>
              </label>
              <textarea
                id="ntf-message"
                rows={4}
                maxLength={400}
                className="form-input resize-y"
                placeholder="Write the announcement message…"
                value={composer.message}
                onChange={(event) => {
                  setComposer((prev) => ({ ...prev, message: event.target.value }))
                  setErrors((prev) => ({ ...prev, message: undefined }))
                }}
                aria-invalid={errors.message ? 'true' : undefined}
              />
              {errors.message ? (
                <span className="form-error" role="alert">
                  {errors.message}
                </span>
              ) : (
                <span className="mt-1.5 block text-[11px] text-ink-mute">
                  {composer.message.length}/400 characters
                </span>
              )}
            </div>

            <div>
              <label htmlFor="ntf-category" className="form-label">
                Category
              </label>
              <select
                id="ntf-category"
                className="form-input"
                value={composer.category}
                onChange={(event) =>
                  setComposer((prev) => ({
                    ...prev,
                    category: event.target.value as NotificationCategory,
                  }))
                }
              >
                <option value="PLATFORM">Platform</option>
                <option value="SUBSCRIPTION">Subscription</option>
                <option value="FEATURE">Feature</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="SUPPORT">Support</option>
              </select>
            </div>

            <div>
              <span className="form-label">Audience</span>
              <div className="space-y-2">
                {(['ALL_OWNERS', 'ALL_STUDENTS', 'SELECTED_OWNERS'] as const).map((option) => (
                  <label
                    key={option}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-colors',
                      composer.audience === option
                        ? 'border-forest bg-forest-soft text-forest'
                        : 'border-line bg-white text-ink-soft hover:border-forest/40',
                    )}
                  >
                    <input
                      type="radio"
                      name="audience"
                      checked={composer.audience === option}
                      onChange={() => setComposer((prev) => ({ ...prev, audience: option }))}
                      className="h-4 w-4 accent-[#173D32]"
                    />
                    <Users className="h-4 w-4" aria-hidden />
                    {AUDIENCE_LABELS[option]}
                  </label>
                ))}
              </div>
            </div>

            {composer.audience === 'SELECTED_OWNERS' && (
              <div className="fade-scale-in rounded-2xl border border-line bg-ivory/40 p-3.5">
                <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-mute">
                  Select owners ({selectedOwners.length} selected)
                </p>
                <ul className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
                  {owners.map((owner) => (
                    <li key={owner.id}>
                      <label className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-white px-3 py-2 text-[13px] text-ink-soft transition-colors hover:bg-ivory">
                        <input
                          type="checkbox"
                          checked={selectedOwners.includes(owner.id)}
                          onChange={() => toggleOwner(owner.id)}
                          className="h-4 w-4 accent-[#173D32]"
                        />
                        <span className="min-w-0 flex-1 truncate">{owner.name}</span>
                        <span className="text-[10px] font-bold uppercase text-ink-mute">
                          {owner.planId}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-semibold text-ivory shadow-[0_10px_24px_-14px_rgba(23,61,50,0.9)] transition-colors hover:bg-forest-light"
            >
              <Send className="h-4 w-4" aria-hidden />
              Record announcement (demo)
            </button>
            <p className="text-center text-[11px] leading-relaxed text-ink-mute">
              Nothing leaves your browser — no emails, SMS or push notifications are sent.
            </p>
          </form>
        </section>

        {/* --------------------------------------------------------- history */}
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center gap-2.5 text-base sm:text-lg">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-soft text-forest">
                <Bell className="h-4.5 w-4.5" aria-hidden />
              </span>
              Notification history
              {unread > 0 && (
                <span className="rounded-full bg-danger px-2.5 py-0.5 text-[11px] font-bold text-white">
                  {unread} unread
                </span>
              )}
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search history…"
                className="sm:w-52"
              />
              <FilterSelect
                label="Category"
                value={category}
                onChange={(value) => setCategory(value as 'ALL' | NotificationCategory)}
                options={[
                  { value: 'ALL', label: 'All' },
                  { value: 'PLATFORM', label: 'Platform' },
                  { value: 'SUBSCRIPTION', label: 'Subscription' },
                  { value: 'FEATURE', label: 'Feature' },
                  { value: 'MAINTENANCE', label: 'Maintenance' },
                  { value: 'SUPPORT', label: 'Support' },
                ]}
              />
              <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-ink-soft">
                <input
                  type="checkbox"
                  checked={showUnreadOnly}
                  onChange={(event) => setShowUnreadOnly(event.target.checked)}
                  className="h-4 w-4 accent-[#173D32]"
                />
                Unread only
              </label>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="No notifications found"
              description="Try a different search term or category — or record a new announcement on the left."
              icon={<Mail className="h-6 w-6" aria-hidden />}
            />
          ) : (
            <ul className="space-y-3">
              {filtered.map((item: PlatformNotification) => (
                <li
                  key={item.id}
                  className={cn(
                    'flex items-start gap-3.5 rounded-2xl border px-4 py-3.5 transition-colors',
                    item.read ? 'border-line bg-white' : 'border-gold/40 bg-gold-soft/40',
                  )}
                >
                  <button
                    type="button"
                    aria-label={item.read ? 'Mark as unread' : 'Mark as read'}
                    onClick={() => markNotificationRead(item.id, !item.read)}
                    className={cn(
                      'mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full transition-transform hover:scale-125',
                      item.read ? 'bg-line' : 'bg-gold',
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-ink">{item.title}</span>
                      <span
                        className={cn(
                          'rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                          CATEGORY_STYLES[item.category],
                        )}
                      >
                        {item.category}
                      </span>
                      {!item.read && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-danger">
                          New
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-[13px] leading-relaxed text-ink-soft">
                      {item.message}
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-2.5 text-[11px] text-ink-mute">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" aria-hidden />
                        {AUDIENCE_LABELS[item.audience]}
                      </span>
                      <span>·</span>
                      <span>{item.sentOn}</span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                          item.read ? 'bg-ivory-deep/60 text-ink-mute' : 'bg-forest-soft text-forest',
                        )}
                      >
                        {item.read ? 'Read' : 'Unread'}
                      </span>
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
