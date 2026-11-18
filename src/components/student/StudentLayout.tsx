import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { StudentStoreProvider, useStudentStore } from '../../context/StudentStore'
import { useCommunicationStore } from '../../context/CommunicationStore'
import { useAuth } from '../../context/AuthContext'
import { StudentSidebar } from './StudentSidebar'
import { StudentTopbar } from './StudentTopbar'
import { ToastStack } from '../common/ToastStack'

/** Auto-dismissing toast viewport for the student portal. */
function StudentToastViewport() {
  const { toasts, dismissToast } = useStudentStore()
  return <ToastStack toasts={toasts} onDismiss={dismissToast} />
}

/**
 * Shared shell for every /student route: collapsible sidebar (drawer on
 * mobile), topbar with notices + profile menus and the routed page content.
 */
function StudentShell() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const { unreadCount } = useStudentStore()
  const { conversations, announcements } = useCommunicationStore()

  const studentId = user?.id || ''
  const todayIso = new Date().toISOString().slice(0, 10)

  /* Section 07 — unread counts across notices + announcements + messages. */
  const myAnnouncementUnread = announcements.filter(
    (a) =>
      a.published &&
      (a.audience === 'ALL' || (studentId && a.audienceStudentIds.includes(studentId))) &&
      (a.expiresOn === '' || a.expiresOn >= todayIso) &&
      (!studentId || !a.readBy.includes(studentId)),
  ).length
  const combinedUnread = unreadCount + myAnnouncementUnread
  const unreadMessages =
    conversations.find((c) => c.studentId === studentId)?.studentUnread ?? 0

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F7F6F1]">
      <StudentSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        unreadNotices={combinedUnread}
        unreadMessages={unreadMessages}
      />
      <div
        className="flex min-h-screen flex-col transition-[padding] duration-300 ease-out lg:pl-[var(--sidebar-pad)]"
        style={{ '--sidebar-pad': collapsed ? '72px' : '248px' } as CSSProperties}
      >
        <StudentTopbar
          collapsed={collapsed}
          onOpenMobile={() => setMobileOpen(true)}
          onToggleCollapse={() => setCollapsed((v) => !v)}
        />
        <main key={pathname} className="page-enter flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto w-full max-w-[85rem]">
            <Outlet />
          </div>
        </main>
      </div>
      <StudentToastViewport />
    </div>
  )
}

export function StudentLayout() {
  return (
    <StudentStoreProvider>
      <StudentShell />
    </StudentStoreProvider>
  )
}
