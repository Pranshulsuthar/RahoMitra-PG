import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { OwnerStoreProvider } from '../../context/OwnerStore'
import { OwnerSidebar } from './OwnerSidebar'
import { OwnerTopbar } from './OwnerTopbar'
import { OwnerToastViewport } from './OwnerToastViewport'

/**
 * Shared shell for every /owner route: collapsible sidebar (drawer on
 * mobile), topbar with the property switcher and the routed page content.
 */
function OwnerShell() {
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F7F6F1]">
      <OwnerSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onToggleCollapse={() => setCollapsed((v) => !v)}
      />
      <div
        className="flex min-h-screen flex-col transition-[padding] duration-300 ease-out lg:pl-[var(--sidebar-pad)]"
        style={{ '--sidebar-pad': collapsed ? '76px' : '264px' } as CSSProperties}
      >
        <OwnerTopbar
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
      <OwnerToastViewport />
    </div>
  )
}

export function OwnerLayout() {
  return (
    <OwnerStoreProvider>
      <OwnerShell />
    </OwnerStoreProvider>
  )
}
