import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  GraduationCap,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Receipt,
  Repeat,
  Settings,
  Users,
} from 'lucide-react'
import { cn } from '../../utils/cn'
import { ConfirmDialog } from './ConfirmDialog'

const NAV_SECTIONS: Array<{
  label: string
  items: Array<{ to: string; label: string; icon: typeof LayoutDashboard }>
}> = [
  {
    label: 'Overview',
    items: [{ to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Listings',
    items: [
      { to: '/admin/pgs', label: 'PG Management', icon: Building2 },
      { to: '/admin/applications', label: 'Owner Applications', icon: ClipboardList },
    ],
  },
  {
    label: 'People',
    items: [
      { to: '/admin/owners', label: 'Owner Management', icon: Users },
      { to: '/admin/students', label: 'Student Management', icon: GraduationCap },
    ],
  },
  {
    label: 'Revenue',
    items: [
      { to: '/admin/plans', label: 'Subscription Plans', icon: Layers },
      { to: '/admin/subscriptions', label: 'Subscriptions', icon: Repeat },
      { to: '/admin/payments', label: 'Payment Records', icon: Receipt },
    ],
  },
  {
    label: 'Engagement',
    items: [
      { to: '/admin/support', label: 'Complaints & Support', icon: LifeBuoy },
      { to: '/admin/notifications', label: 'Notifications', icon: Bell },
      { to: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'System',
    items: [{ to: '/admin/settings', label: 'Settings', icon: Settings }],
  },
]

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
  onToggleCollapse: () => void
}

/** Fixed navigation rail — collapsible on desktop, drawer on mobile. */
export function Sidebar({ collapsed, mobileOpen, onCloseMobile, onToggleCollapse }: SidebarProps) {
  const navigate = useNavigate()
  const [logoutOpen, setLogoutOpen] = useState(false)

  const rail = (
    <div
      className={cn(
        'flex h-full flex-col bg-forest text-ivory transition-[width,transform] duration-300 ease-out',
        'fixed inset-y-0 left-0 z-50 w-[264px] -translate-x-full lg:translate-x-0',
        collapsed && 'lg:w-[76px]',
        mobileOpen && 'translate-x-0',
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          'flex items-center gap-3 border-b border-white/10 px-5 py-5',
          collapsed && 'lg:justify-center lg:px-0',
        )}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm">
          <img src="/RahoMitra_logo.png" alt="" className="h-full w-full object-contain" />
        </span>
        <span className={cn('min-w-0', collapsed && 'lg:hidden')}>
          <span className="block truncate font-display text-lg font-semibold text-white">
            RahoMitra
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />
            Super Admin
          </span>
        </span>
      </div>

      {/* Demo mode indicator */}
      <div className={cn('px-5 pt-4', collapsed && 'lg:hidden')}>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-gold/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gold">
          Demo mode
        </span>
      </div>

      {/* Navigation */}
      <nav
        className="scrollbar-hidden mt-3 flex-1 overflow-y-auto px-3 pb-4"
        aria-label="Admin navigation"
      >
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-4">
            <p
              className={cn(
                'mb-1.5 px-3 text-[9.5px] font-bold uppercase tracking-[0.2em] text-ivory/45',
                collapsed && 'lg:hidden',
              )}
            >
              {section.label}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    title={collapsed ? item.label : undefined}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-all duration-200',
                        collapsed && 'lg:justify-center lg:px-0',
                        isActive
                          ? 'bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
                          : 'text-ivory/75 hover:bg-white/[0.07] hover:text-white',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={cn(
                            'absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gold transition-all duration-200',
                            isActive ? 'opacity-100' : 'opacity-0',
                          )}
                          aria-hidden
                        />
                        <item.icon
                          className={cn(
                            'h-[18px] w-[18px] shrink-0 transition-colors',
                            isActive ? 'text-gold' : 'text-ivory/70 group-hover:text-gold',
                          )}
                          aria-hidden
                        />
                        <span className={cn('truncate', collapsed && 'lg:hidden')}>
                          {item.label}
                        </span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer actions */}
      <div className="border-t border-white/10 px-3 py-4">
        <button
          type="button"
          onClick={onToggleCollapse}
          className={cn(
            'mb-1 hidden w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-ivory/70 transition-colors hover:bg-white/[0.07] hover:text-white lg:flex',
            collapsed && 'lg:justify-center lg:px-0',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span
            className={cn(
              'h-[18px] w-[18px] shrink-0 text-center leading-[18px] transition-transform duration-300',
              collapsed && 'rotate-180',
            )}
            aria-hidden
          >
            «
          </span>
          <span className={cn(collapsed && 'lg:hidden')}>Collapse</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setLogoutOpen(true)
            onCloseMobile()
          }}
          title={collapsed ? 'Logout' : undefined}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-ivory/75 transition-colors hover:bg-danger/20 hover:text-white',
            collapsed && 'lg:justify-center lg:px-0',
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden />
          <span className={cn(collapsed && 'lg:hidden')}>Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {rail}
      {/* Mobile backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-ink/50 backdrop-blur-[1px] transition-opacity duration-300 lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onCloseMobile}
        aria-hidden
      />
      <ConfirmDialog
        open={logoutOpen}
        title="Logout of Super Admin?"
        message={
          <>
            This ends the demo admin session and returns you to the Admin Login screen. No real
            session exists — this is a frontend-only demo.
          </>
        }
        confirmLabel="Logout"
        danger
        onConfirm={() => {
          setLogoutOpen(false)
          navigate('/login/admin')
        }}
        onCancel={() => setLogoutOpen(false)}
      />
    </>
  )
}
