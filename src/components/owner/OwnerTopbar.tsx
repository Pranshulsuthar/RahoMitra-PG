import { useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  UserRound,
} from 'lucide-react'
import { useOwnerStore } from '../../context/OwnerStore'
import { cn } from '../../utils/cn'
import { ConfirmDialog } from '../admin/ConfirmDialog'
import { PropertySwitcher } from './PropertySwitcher'

const TITLES: Array<[string, string, string]> = [
  ['/owner/dashboard', 'Owner Dashboard', 'Your properties at a glance'],
  ['/owner/properties', 'My PG Properties', 'Manage your PG listings'],
  ['/owner/rooms', 'Room Management', 'Rooms, beds and occupancy'],
  ['/owner/students', 'Student Management', 'Students living in your PGs'],
  ['/owner/admissions', 'Admission Management', 'Codes, requests and approvals'],
  ['/owner/staff', 'Staff Management', 'Your on-ground team'],
  ['/owner/availability', 'Availability', 'Live bed availability across properties'],
  ['/owner/profile', 'Owner Profile', 'Your account details'],
  ['/owner/settings', 'Settings', 'Preferences and account options'],
]

interface OwnerTopbarProps {
  collapsed: boolean
  onOpenMobile: () => void
  onToggleCollapse: () => void
}

/** Professional top navigation for the owner console. */
export function OwnerTopbar({ collapsed, onOpenMobile, onToggleCollapse }: OwnerTopbarProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const {
    owner,
    properties,
    rooms,
    students,
    requests,
    notifications,
    markAllNotificationsRead,
    pushToast,
  } = useOwnerStore()

  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const [title, subtitle] = useMemo(() => {
    const match =
      TITLES.find(([path]) => pathname.startsWith(path)) ??
      (pathname.startsWith('/owner/properties/')
        ? (['Property Details', 'Preview and manage a single listing'] as [string, string])
        : null)
    return match ? [match[1], match[2]] : ['Owner Console', 'RahoMitra PG owner dashboard']
  }, [pathname])

  const unread = notifications.filter((n) => !n.read).length
  const pending = requests.filter((r) => r.status === 'PENDING').length

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    type Hit = { label: string; sub: string; to: string }
    const hits: Hit[] = []
    properties.forEach((p) => {
      if (p.name.toLowerCase().includes(q))
        hits.push({ label: p.name, sub: 'Your property', to: '/owner/properties' })
    })
    rooms.forEach((r) => {
      if (r.number.toLowerCase().includes(q))
        hits.push({ label: `Room ${r.number}`, sub: 'Room', to: '/owner/rooms' })
    })
    students.forEach((s) => {
      if (s.name.toLowerCase().includes(q))
        hits.push({ label: s.name, sub: 'Student', to: '/owner/students' })
    })
    return hits.slice(0, 6)
  }, [query, properties, rooms, students])

  const closeAll = () => {
    setSearchOpen(false)
    setBellOpen(false)
    setProfileOpen(false)
  }

  const initials = owner.name
    .replace(/\(demo\)/i, '')
    .trim()
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur-md">
      {(searchOpen || bellOpen || profileOpen) && (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          className="fixed inset-0 z-[29] cursor-default"
          onClick={closeAll}
        />
      )}

      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onOpenMobile}
          aria-label="Open navigation menu"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-forest transition-colors hover:bg-ivory lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden h-10 w-10 items-center justify-center rounded-xl border border-line text-forest transition-colors hover:bg-ivory lg:flex"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4.5 w-4.5" aria-hidden />
          ) : (
            <PanelLeftClose className="h-4.5 w-4.5" aria-hidden />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold leading-tight text-ink sm:text-xl">
            {title}
          </h1>
          <p className="hidden truncate text-[11.5px] text-ink-mute sm:block">{subtitle}</p>
        </div>

        {/* Multi-property switcher */}
        <div className="hidden md:block">
          <PropertySwitcher />
        </div>

        {/* Global search */}
        <div ref={searchRef} className="relative hidden lg:block">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            placeholder="Search PGs, rooms, students…"
            aria-label="Search your records"
            onChange={(event) => {
              setQuery(event.target.value)
              setSearchOpen(true)
            }}
            onFocus={() => setSearchOpen(true)}
            className="form-input w-52 rounded-full py-2.5 pl-10 text-sm transition-all duration-200 focus:w-64"
          />
          {searchOpen && query.trim().length >= 2 && (
            <div className="fade-scale-in absolute right-0 top-[calc(100%+0.6rem)] z-40 w-[19rem] overflow-hidden rounded-2xl border border-line bg-white shadow-pop">
              {results.length === 0 ? (
                <p className="px-4 py-4 text-sm text-ink-mute">
                  No demo records match “{query}”.
                </p>
              ) : (
                <ul>
                  {results.map((hit, i) => (
                    <li key={`${hit.label}-${i}`}>
                      <button
                        type="button"
                        onClick={() => {
                          navigate(hit.to)
                          setQuery('')
                          setSearchOpen(false)
                        }}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-ivory/70"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-ink">
                            {hit.label}
                          </span>
                          <span className="block text-[11px] text-ink-mute">{hit.sub}</span>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gold-dark">
                          Demo
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Demo mode pill */}
        <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-gold/50 bg-gold-soft px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gold-dark xl:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />
          Demo mode
        </span>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            aria-label={`Notifications (${unread} unread)`}
            onClick={() => {
              setBellOpen((v) => !v)
              setSearchOpen(false)
              setProfileOpen(false)
            }}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-line text-forest transition-colors hover:bg-ivory"
          >
            <Bell className="h-4.5 w-4.5" aria-hidden />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>
          {bellOpen && (
            <div className="fade-scale-in absolute right-0 top-[calc(100%+0.6rem)] z-40 w-[min(21rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-white shadow-pop">
              <div className="flex items-center justify-between border-b border-line bg-ivory/60 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
                  Notifications
                </p>
                <button
                  type="button"
                  onClick={() => {
                    markAllNotificationsRead()
                    pushToast('All demo notifications marked as read.', 'info')
                  }}
                  className="text-[11px] font-semibold text-forest hover:text-gold-dark"
                >
                  Mark all read
                </button>
              </div>
              <ul className="max-h-72 overflow-y-auto">
                {notifications.slice(0, 5).map((n) => (
                  <li
                    key={n.id}
                    className="flex gap-3 border-b border-line/70 px-4 py-3 last:border-0"
                  >
                    <span
                      className={cn(
                        'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                        n.read ? 'bg-line' : 'bg-gold',
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-ink">
                        {n.title}
                      </span>
                      <span className="mt-0.5 block line-clamp-2 text-[11.5px] leading-snug text-ink-mute">
                        {n.message}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="bg-ivory/60 px-4 py-2.5 text-center text-[11px] text-ink-mute">
                {pending > 0 ? (
                  <Link
                    to="/owner/admissions"
                    onClick={() => setBellOpen(false)}
                    className="font-bold uppercase tracking-wider text-forest hover:text-gold-dark"
                  >
                    {pending} pending admission request{pending > 1 ? 's' : ''} → review now
                  </Link>
                ) : (
                  'Demo notifications — nothing was sent to any device.'
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen((v) => !v)
              setSearchOpen(false)
              setBellOpen(false)
            }}
            aria-expanded={profileOpen}
            className="flex items-center gap-2.5 rounded-full border border-line py-1.5 pl-1.5 pr-3 transition-colors hover:bg-ivory"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-[12px] font-bold text-ivory"
              aria-hidden
            >
              {initials}
            </span>
            <span className="hidden text-left md:block">
              <span className="block text-[12.5px] font-bold leading-tight text-ink">
                {owner.name}
              </span>
              <span className="block text-[10px] leading-tight text-ink-mute">{owner.email}</span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-ink-mute" aria-hidden />
          </button>
          {profileOpen && (
            <div className="fade-scale-in absolute right-0 top-[calc(100%+0.6rem)] z-40 w-60 overflow-hidden rounded-2xl border border-line bg-white shadow-pop">
              <div className="flex items-center gap-3 border-b border-line bg-ivory/60 px-4 py-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-sm font-bold text-ivory">
                  {initials}
                </span>
                <span>
                  <span className="block text-sm font-bold text-ink">{owner.name}</span>
                  <span className="block text-[11px] text-ink-mute">{owner.email}</span>
                  <span className="mt-1 inline-block rounded-full bg-gold-soft px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold-dark">
                    Demo account
                  </span>
                </span>
              </div>
              <div className="p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false)
                    navigate('/owner/profile')
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-ivory hover:text-forest"
                >
                  <UserRound className="h-4 w-4" aria-hidden />
                  Owner Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false)
                    navigate('/owner/settings')
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-ivory hover:text-forest"
                >
                  <Settings className="h-4 w-4" aria-hidden />
                  Settings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false)
                    setLogoutOpen(true)
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger-soft"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: property switcher lives under the topbar row */}
      <div className="border-t border-line px-4 py-2 md:hidden">
        <PropertySwitcher />
      </div>

      <ConfirmDialog
        open={logoutOpen}
        title="Logout of Owner Console?"
        message="This ends the demo owner session and returns you to the PG Owner Login screen. No real session exists — this is a frontend-only demo."
        confirmLabel="Logout"
        danger
        onConfirm={() => {
          setLogoutOpen(false)
          navigate('/login/owner')
        }}
        onCancel={() => setLogoutOpen(false)}
      />
    </header>
  )
}
