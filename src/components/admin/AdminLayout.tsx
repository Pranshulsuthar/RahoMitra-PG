import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ToastViewport } from './ToastViewport'

/**
 * Shared shell for every /admin route: collapsible sidebar (drawer on
 * mobile), professional topbar and the routed page content.
 */
function AdminShell() {
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F7F6F1]">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onToggleCollapse={() => setCollapsed((v) => !v)}
      />
      <div
        className="flex min-h-screen flex-col transition-[padding] duration-300 ease-out lg:pl-[var(--sidebar-pad)]"
        style={{ '--sidebar-pad': collapsed ? '76px' : '264px' } as CSSProperties}
      >
        <Topbar
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
      <ToastViewport />
    </div>
  )
}

export function AdminLayout() {
  // Section 08 — AdminStoreProvider now lives at the App root so the owner
  // console can read the same plans / subscriptions / featured state.
  return <AdminShell />
}
