import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  UserRound,
} from 'lucide-react'
import { useStudentStore } from '../../context/StudentStore'
import { useCommunicationStore } from '../../context/CommunicationStore'
import { DEMO_STUDENT_ID } from '../../data/communicationData'
import { cn } from '../../utils/cn'
import { ConfirmDialog } from '../admin/ConfirmDialog'
import type { StudentNotice } from '../../types/student'
import type { CommNotification } from '../../types/communication'

const TITLES: Array<[string, string, string]> = [
  ['/student/dashboard', 'Student Dashboard', 'Your PG life at a glance'],
  ['/student/accommodation', 'My Accommodation', 'Your current PG details'],
  ['/student/room', 'My Room', 'Room, bed and occupancy'],
  ['/student/notices', 'Notices', 'PG notice board'],
  ['/student/messages', 'Messages', 'Private chat with your PG owner'],
  ['/student/complaints', 'My Complaints', 'Raise and track PG complaints'],
  ['/student/billing', 'My Bills', 'Invoices and payment history'],
  ['/student/profile', 'My Profile', 'Your account details'],
  ['/student/support', 'Help & Support', 'FAQs and contact information'],
  ['/student/settings', 'Settings', 'Preferences and account options'],
]

interface StudentTopbarProps {
  collapsed: boolean
  onOpenMobile: () => void
  onToggleCollapse: () => void
}

/** Professional top navigation for the student portal. */
export function StudentTopbar({ collapsed, onOpenMobile, onToggleCollapse }: StudentTopbarProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { profile, notices, unreadCount, markNoticeRead, markAllNoticesRead, removeNotice, pushToast } =
    useStudentStore()
  const {
    roleNotifications,
    markNotificationRead: markCommRead,
    markAllNotificationsRead: markAllCommRead,
    clearNotification,
    announcements,
    markAnnouncementRead,
  } = useCommunicationStore()

  const [bellOpen, setBellOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)

  const [title, subtitle] = useMemo(() => {
    const match = TITLES.find(([path]) => pathname.startsWith(path))
    return match ? [match[1], match[2]] : ['Student Portal', 'RahoMitra student dashboard']
  }, [pathname])

  const initials = profile.name
    .trim()
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const closeAll = () => {
    setBellOpen(false)
    setProfileOpen(false)
  }

  /* Section 07 — unified bell: classic notices + Section 07 notifications
     (messages, complaints, responses, announcements). */
  const commNotes = roleNotifications('STUDENT', DEMO_STUDENT_ID)

  const bellRows = useMemo(() => {
    type Row = {
      id: string
      source: 'NOTICE' | 'COMM'
      title: string
      body: string
      date: string
      read: boolean
      to: string
    }
    const noticeRows: Row[] = notices.map((n: StudentNotice) => ({
      id: n.id,
      source: 'NOTICE',
      title: n.title,
      body: n.description,
      date: n.date,
      read: n.read,
      to: '/student/notices',
    }))
    const commRows: Row[] = commNotes.map((n: CommNotification) => ({
      id: n.id,
      source: 'COMM',
      title: n.title,
      body: n.body,
      date: `${n.date} ${n.at}`,
      read: n.read,
      to: n.to,
    }))
    return [...noticeRows, ...commRows]
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .slice(0, 7)
  }, [notices, commNotes])

  const bellUnread = unreadCount + commNotes.filter((n) => !n.read).length

  const openRow = (row: { id: string; source: string; to: string }) => {
    if (row.source === 'COMM') markCommRead(row.id)
    else markNoticeRead(row.id)
    setBellOpen(false)
    navigate(row.to)
  }

  const dismissRow = (row: { id: string; source: string }) => {
    if (row.source === 'COMM') clearNotification(row.id)
    else removeNotice(row.id)
    pushToast('Notification cleared (demo).', 'info')
  }

  const markAllBell = () => {
    markAllNoticesRead()
    markAllCommRead('STUDENT', DEMO_STUDENT_ID)
    announcements
      .filter(
        (a) =>
          a.published &&
          a.propertyId === 'pg-001' &&
          (a.audience === 'ALL' || a.audienceStudentIds.includes(DEMO_STUDENT_ID)) &&
          !a.readBy.includes(DEMO_STUDENT_ID),
      )
      .forEach((a) => markAnnouncementRead(a.id, DEMO_STUDENT_ID))
    pushToast('All demo notifications marked as read.', 'info')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur-md">
      {(bellOpen || profileOpen) && (
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

        {/* Demo mode pill */}
        <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-gold/50 bg-gold-soft px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gold-dark xl:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />
          Demo mode
        </span>

        {/* Notices bell */}
        <div className="relative">
          <button
            type="button"
            aria-label={`Notifications (${bellUnread} unread)`}
            onClick={() => {
              setBellOpen((v) => !v)
              setProfileOpen(false)
            }}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-line text-forest transition-colors hover:bg-ivory"
          >
            <Bell className="h-4.5 w-4.5" aria-hidden />
            {bellUnread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                {bellUnread}
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
                  onClick={markAllBell}
                  className="text-[11px] font-semibold text-forest hover:text-gold-dark"
                >
                  Mark all read
                </button>
              </div>
              <ul className="max-h-80 overflow-y-auto">
                {bellRows.length === 0 && (
                  <li className="px-4 py-6 text-center text-[12.5px] text-ink-mute">
                    You're all caught up — no demo notifications.
                  </li>
                )}
                {bellRows.map((n) => (
                  <li
                    key={`${n.source}-${n.id}`}
                    className="group border-b border-line/70 last:border-0"
                  >
                    <div className="flex items-start gap-1">
                      <button
                        type="button"
                        onClick={() => openRow(n)}
                        className="flex min-w-0 flex-1 gap-3 px-4 py-3 text-left transition-colors hover:bg-ivory/70"
                        aria-label={`Open notification: ${n.title}`}
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
                            {n.body}
                          </span>
                          <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-ink-mute/80">
                            {n.date} · demo
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => dismissRow(n)}
                        aria-label={`Clear notification: ${n.title}`}
                        className="mt-2 shrink-0 rounded-full p-1 text-ink-mute opacity-0 transition hover:bg-danger-soft hover:text-danger focus:opacity-100 group-hover:opacity-100"
                      >
                        ×
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="bg-ivory/60 px-4 py-2.5 text-center text-[11px] text-ink-mute">
                <Link
                  to="/student/notices"
                  onClick={() => setBellOpen(false)}
                  className="font-bold uppercase tracking-wider text-forest hover:text-gold-dark"
                >
                  Open notice board →
                </Link>
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
                {profile.name}
              </span>
              <span className="block text-[10px] leading-tight text-ink-mute">Student demo</span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-ink-mute" aria-hidden />
          </button>
          {profileOpen && (
            <div className="fade-scale-in absolute right-0 top-[calc(100%+0.6rem)] z-40 w-60 overflow-hidden rounded-2xl border border-line bg-white shadow-pop">
              <div className="flex items-center gap-3 border-b border-line bg-ivory/60 px-4 py-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-sm font-bold text-ivory">
                  {initials}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-ink">{profile.name}</span>
                  <span className="block truncate text-[11px] text-ink-mute">{profile.email}</span>
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
                    navigate('/student/profile')
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-ivory hover:text-forest"
                >
                  <UserRound className="h-4 w-4" aria-hidden />
                  My Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false)
                    navigate('/student/settings')
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

      <ConfirmDialog
        open={logoutOpen}
        title="Logout of Student Portal?"
        message="This ends the demo student session and returns you to the Student Login screen. No real session exists — this is a frontend-only demo."
        confirmLabel="Logout"
        danger
        onConfirm={() => {
          setLogoutOpen(false)
          navigate('/login/student')
        }}
        onCancel={() => setLogoutOpen(false)}
      />
    </header>
  )
}
