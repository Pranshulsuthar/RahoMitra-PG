import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { StudentStoreProvider, useStudentStore } from '../../context/StudentStore'
import { useCommunicationStore } from '../../context/CommunicationStore'
import { DEMO_STUDENT_ID } from '../../data/communicationData'
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
  const { unreadCount } = useStudentStore()
  const { conversations, announcements } = useCommunicationStore()

  /* Section 07 — unread counts across notices + announcements + messages. */
  const myAnnouncementUnread = announcements.filter(
    (a) =>
      a.published &&
      a.propertyId === 'pg-001' &&
      (a.audience === 'ALL' || a.audienceStudentIds.includes(DEMO_STUDENT_ID)) &&
      (a.expiresOn === '' || a.expiresOn >= '2026-05-14') &&
      !a.readBy.includes(DEMO_STUDENT_ID),
  ).length
  const combinedUnread = unreadCount + myAnnouncementUnread
  const unreadMessages =
    conversations.find((c) => c.studentId === DEMO_STUDENT_ID)?.studentUnread ?? 0

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
        style={{ '--sidebar-pad': collapsed ? '76px' : '264px' } as CSSProperties}
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
