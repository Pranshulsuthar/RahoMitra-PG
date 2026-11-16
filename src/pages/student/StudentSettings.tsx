import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Check,
  Eye,
  Languages,
  LogOut,
  Moon,
  Palette,
  Save,
  ShieldCheck,
  Sun,
  UserRound,
  Wallet,
} from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAuth } from '../../context/AuthContext'
import { useStudentStore } from '../../context/StudentStore'
import { fetchStudentAccommodation, type StudentAccommodation } from '../../api/student'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { StatisticCard } from '../../components/owner/StatisticCard'
import { Button } from '../../components/common/Button'
import { cn } from '../../utils/cn'

interface ToggleRowProps {
  icon: typeof Bell
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function ToggleRow({ icon: Icon, title, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-line bg-white px-4 py-3.5">
      <div className="flex min-w-0 gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-forest-soft text-forest">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[13.5px] font-bold text-ink">{title}</p>
          <p className="mt-0.5 text-[11.5px] leading-snug text-ink-mute">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
          checked ? 'bg-forest' : 'bg-ivory-deep',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200',
            checked ? 'left-[1.4rem]' : 'left-0.5',
          )}
          aria-hidden
        />
      </button>
    </div>
  )
}

/** /student/settings — account / notification / appearance prefs + logout. */
export function StudentSettings() {
  useDocumentTitle('Settings')

  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { profile, settings, updateSettings, pushToast } = useStudentStore()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [liveAccommodation, setLiveAccommodation] = useState<StudentAccommodation | null>(null)

  useEffect(() => {
    fetchStudentAccommodation()
      .then((acc) => setLiveAccommodation(acc))
      .catch(() => setLiveAccommodation(null))
  }, [])

  const initials = (profile.name || user?.name || 'Student')
    .trim()
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const saveAll = () => {
    pushToast('Preferences saved successfully.')
  }

  const handleLogout = async () => {
    setLogoutOpen(false)
    try {
      await logout()
    } finally {
      navigate('/login/student')
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Settings"
        description="Account, notification and appearance preferences."
        actions={
          <Button variant="primary" onClick={saveAll}>
            <Save className="h-4 w-4" aria-hidden />
            Save preferences
          </Button>
        }
      />

      {/* -------------------------------------------------- account summary */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatisticCard
          label="Account"
          value="Student"
          icon={ShieldCheck}
          tone="forest"
          hint="Active session"
        />
        <StatisticCard
          label="Membership"
          value={liveAccommodation ? 'ACTIVE' : 'NOT ENROLLED'}
          icon={UserRound}
          tone="gold"
          hint={liveAccommodation ? `Since ${liveAccommodation.admissionDate}` : 'No active admission'}
        />
        <StatisticCard
          label="Email Status"
          value="Verified"
          icon={Bell}
          tone="ink"
          hint={user?.email || profile.email}
        />
        <StatisticCard
          label="PG Accommodation"
          value={liveAccommodation ? liveAccommodation.property.name : 'None'}
          icon={Wallet}
          tone="ink"
          hint={liveAccommodation ? `Room ${liveAccommodation.room.roomNumber}` : 'Not assigned'}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* ------------------------------------------------------ account */}
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <h2 className="mb-1 flex items-center gap-2.5 text-base sm:text-lg">
            <UserRound className="h-4.5 w-4.5 text-gold-dark" aria-hidden />
            Account preferences
          </h2>
          <p className="mb-4 text-[12.5px] text-ink-mute">
            Signed in as {user?.email || profile.email}
          </p>
          <div className="space-y-3">
            <ToggleRow
              icon={Languages}
              title="English interface"
              description="Keep the portal language in English."
              checked={settings.languageEnglish}
              onChange={(v) => updateSettings({ languageEnglish: v })}
            />
            <ToggleRow
              icon={Eye}
              title="Show profile to PG owner"
              description="Let your PG owner view your contact and emergency details in the resident directory."
              checked={settings.showProfileToOwner}
              onChange={(v) => updateSettings({ showProfileToOwner: v })}
            />
          </div>
          <p className="mt-4 flex items-start gap-2 text-[11.5px] leading-relaxed text-ink-mute">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-dark" aria-hidden />
            Manage your personal profile and emergency contact information from the profile tab.
          </p>
        </section>

        {/* ------------------------------------------------- notifications */}
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <h2 className="mb-1 flex items-center gap-2.5 text-base sm:text-lg">
            <Bell className="h-4.5 w-4.5 text-gold-dark" aria-hidden />
            Notification preferences
          </h2>
          <p className="mb-4 text-[12.5px] text-ink-mute">
            Configure how and when you receive resident updates.
          </p>
          <div className="space-y-3">
            <ToggleRow
              icon={Bell}
              title="Notice alerts"
              description="Show a notification badge for new announcements and notices."
              checked={settings.noticeAlerts}
              onChange={(v) => updateSettings({ noticeAlerts: v })}
            />
            <ToggleRow
              icon={Wallet}
              title="Rent reminders"
              description="Highlight upcoming monthly rent and utility invoices."
              checked={settings.rentReminders}
              onChange={(v) => updateSettings({ rentReminders: v })}
            />
            <ToggleRow
              icon={Check}
              title="Weekly summary"
              description="Receive weekly summaries of announcements and community updates."
              checked={settings.emailDigest}
              onChange={(v) => updateSettings({ emailDigest: v })}
            />
          </div>
        </section>

        {/* --------------------------------------------------- appearance */}
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <h2 className="mb-1 flex items-center gap-2.5 text-base sm:text-lg">
            <Palette className="h-4.5 w-4.5 text-gold-dark" aria-hidden />
            Appearance preferences
          </h2>
          <p className="mb-4 text-[12.5px] text-ink-mute">
            Visual preferences for your student portal.
          </p>
          <div className="space-y-3">
            <ToggleRow
              icon={Sun}
              title="Compact cards"
              description="Display denser card layouts on dashboard overviews."
              checked={settings.compactCards}
              onChange={(v) => updateSettings({ compactCards: v })}
            />
            <ToggleRow
              icon={Moon}
              title="Reduce motion"
              description="Minimise interface animations and transitions."
              checked={settings.reduceMotion}
              onChange={(v) => updateSettings({ reduceMotion: v })}
            />
            <ToggleRow
              icon={Moon}
              title="Dark mode"
              description="Enable dark mode interface theme."
              checked={settings.darkMode}
              onChange={(v) => updateSettings({ darkMode: v })}
            />
          </div>
        </section>

        {/* -------------------------------------------------------- account */}
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <h2 className="mb-1 flex items-center gap-2.5 text-base sm:text-lg">
            <LogOut className="h-4.5 w-4.5 text-gold-dark" aria-hidden />
            Session
          </h2>
          <p className="mb-4 text-[12.5px] text-ink-mute">
            Manage your active session and sign out.
          </p>

          <div className="flex items-center gap-4 rounded-2xl border border-line bg-ivory/40 px-4 py-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-bold text-ivory ring-2 ring-gold/40">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-bold text-ink">{profile.name || user?.name || 'Student'}</p>
              <p className="truncate text-[12px] text-ink-mute">{user?.email || profile.email}</p>
            </div>
            <span className="ml-auto shrink-0 rounded-full bg-forest-soft px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-forest">
              Active
            </span>
          </div>

          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <Button variant="outline" onClick={() => navigate('/student/profile')}>
              Edit profile
            </Button>
            <Button variant="primary" onClick={() => setLogoutOpen(true)}>
              <LogOut className="h-4 w-4" aria-hidden />
              Logout
            </Button>
          </div>
        </section>
      </div>

      <p className="mt-6 flex items-center gap-2 text-[11.5px] text-ink-mute">
        <Check className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
        Preferences are saved for your account.
      </p>

      <ConfirmDialog
        open={logoutOpen}
        title="Logout of Student Portal?"
        message="Are you sure you want to end your current session? You will be redirected to the sign-in page."
        confirmLabel="Logout"
        danger
        onConfirm={handleLogout}
        onCancel={() => setLogoutOpen(false)}
      />
    </>
  )
}
