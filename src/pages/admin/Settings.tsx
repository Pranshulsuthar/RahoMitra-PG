import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  Bell,
  Check,
  Eye,
  KeyRound,
  Palette,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdminStore } from '../../context/AdminStore'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { cn } from '../../utils/cn'

type TabId = 'profile' | 'platform' | 'notifications' | 'security' | 'appearance'

const TABS: Array<{ id: TabId; label: string; icon: typeof UserRound }> = [
  { id: 'profile', label: 'Admin Profile', icon: UserRound },
  { id: 'platform', label: 'Platform Information', icon: Sparkles },
  { id: 'notifications', label: 'Notification Preferences', icon: Bell },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'appearance', label: 'Appearance', icon: Palette },
]

/** /admin/settings — admin & platform configuration (local demo state). */
export function AdminSettings() {
  useDocumentTitle('Settings')

  const { pushToast } = useAdminStore()
  const [tab, setTab] = useState<TabId>('profile')

  // ---- Admin profile
  const [profile, setProfile] = useState({ name: 'Super Admin', city: 'Jaipur', bio: '' })
  const [profileErrors, setProfileErrors] = useState<{ name?: string; city?: string }>({})

  // ---- Platform information
  const [platform, setPlatform] = useState({
    name: 'RahoMitra',
    tagline: 'Aapke Rehne Ka Digital Saathi',
    supportEmail: 'support@rahomitra.demo',
    coverage: 'Jaipur (demo coverage)',
  })
  const [platformErrors, setPlatformErrors] = useState<{
    name?: string
    tagline?: string
    supportEmail?: string
  }>({})

  // ---- Notification preferences
  const [prefs, setPrefs] = useState({
    newApplications: true,
    urgentTickets: true,
    expiryAlerts: true,
    weeklyDigest: false,
    productUpdates: false,
  })

  // ---- Security (UI only)
  const [security, setSecurity] = useState({ current: '', next: '', confirm: '' })
  const [securityErrors, setSecurityErrors] = useState<{
    current?: string
    next?: string
    confirm?: string
  }>({})
  const [securityNotice, setSecurityNotice] = useState(false)

  // ---- Appearance (live preview)
  const [appearance, setAppearance] = useState({
    accent: 'forest',
    density: 'comfortable',
    rounded: 'full',
  })

  const saveProfile = (event: FormEvent) => {
    event.preventDefault()
    const next: typeof profileErrors = {}
    if (profile.name.trim().length < 2) next.name = 'Display name must be at least 2 characters.'
    if (profile.city.trim().length < 2) next.city = 'City is required.'
    setProfileErrors(next)
    if (Object.keys(next).length > 0) return
    pushToast('Admin profile saved (demo — local state only).')
  }

  const savePlatform = (event: FormEvent) => {
    event.preventDefault()
    const next: typeof platformErrors = {}
    if (platform.name.trim().length < 2) next.name = 'Platform name is required.'
    if (platform.tagline.trim().length < 5) next.tagline = 'Tagline must be at least 5 characters.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(platform.supportEmail))
      next.supportEmail = 'Enter a valid support email address.'
    setPlatformErrors(next)
    if (Object.keys(next).length > 0) return
    pushToast('Platform information saved (demo — local state only).')
  }

  const savePrefs = () => {
    pushToast('Notification preferences saved (demo — local state only).')
  }

  const submitSecurity = (event: FormEvent) => {
    event.preventDefault()
    const next: typeof securityErrors = {}
    if (!security.current) next.current = 'Enter your current demo password.'
    if (security.next.length < 8) next.next = 'New password must be at least 8 characters.'
    if (security.confirm !== security.next) next.confirm = 'Passwords do not match.'
    setSecurityErrors(next)
    if (Object.keys(next).length > 0) return
    setSecurityNotice(true)
    setSecurity({ current: '', next: '', confirm: '' })
    pushToast('Validation passed — no password was actually changed (demo).', 'info')
  }

  const accentClasses =
    appearance.accent === 'forest'
      ? 'bg-forest text-ivory'
      : appearance.accent === 'gold'
        ? 'bg-gold text-forest-dark'
        : 'bg-ink text-ivory'

  const densityClass = appearance.density === 'compact' ? 'px-3 py-1.5' : 'px-4 py-3'

  return (
    <>
      <AdminPageHeader
        title="Settings"
        description="Configure the admin profile, platform details, notification preferences, security UI and appearance. Every form stores changes in local demo state only."
      />

      <DemoBanner message="settings save to in-memory demo state — refreshing the page restores the defaults." />

      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        {/* Tab rail */}
        <nav className="h-fit rounded-3xl border border-line bg-white p-2.5 shadow-card" aria-label="Settings sections">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-colors',
                tab === item.id
                  ? 'bg-forest text-ivory shadow-[0_10px_24px_-16px_rgba(23,61,50,0.9)]'
                  : 'text-ink-soft hover:bg-ivory hover:text-forest',
              )}
              aria-current={tab === item.id ? 'page' : undefined}
            >
              <item.icon className="h-4.5 w-4.5" aria-hidden />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Panels */}
        <div className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-7">
          {/* --------------------------------------------------- profile */}
          {tab === 'profile' && (
            <form onSubmit={saveProfile} noValidate className="fade-scale-in max-w-xl space-y-5">
              <h2 className="flex items-center gap-2.5 text-lg">
                <UserRound className="h-5 w-5 text-gold-dark" aria-hidden />
                Admin Profile
              </h2>

              <div className="flex items-center gap-4 rounded-2xl border border-line bg-ivory/40 p-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-forest text-lg font-bold text-ivory">
                  SA
                </span>
                <div>
                  <p className="text-sm font-bold text-ink">Profile image placeholder</p>
                  <p className="text-[12px] text-ink-mute">
                    Avatar uploads arrive with backend integration (demo).
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="admin-name" className="form-label">
                  Display name<span className="ml-1 text-danger">*</span>
                </label>
                <input
                  id="admin-name"
                  className="form-input"
                  value={profile.name}
                  onChange={(event) => {
                    setProfile((prev) => ({ ...prev, name: event.target.value }))
                    setProfileErrors((prev) => ({ ...prev, name: undefined }))
                  }}
                  aria-invalid={profileErrors.name ? 'true' : undefined}
                />
                {profileErrors.name && (
                  <span className="form-error" role="alert">
                    {profileErrors.name}
                  </span>
                )}
              </div>

              <div>
                <label htmlFor="admin-email" className="form-label">
                  Admin email
                </label>
                <input
                  id="admin-email"
                  className="form-input bg-ivory/60 text-ink-mute"
                  value="admin@rahomitra.demo"
                  readOnly
                  disabled
                />
                <span className="mt-1.5 block text-[11px] text-ink-mute">
                  Demo credentials are fixed for this frontend-only build.
                </span>
              </div>

              <div>
                <label htmlFor="admin-city" className="form-label">
                  Operating city<span className="ml-1 text-danger">*</span>
                </label>
                <input
                  id="admin-city"
                  className="form-input"
                  value={profile.city}
                  onChange={(event) => {
                    setProfile((prev) => ({ ...prev, city: event.target.value }))
                    setProfileErrors((prev) => ({ ...prev, city: undefined }))
                  }}
                  aria-invalid={profileErrors.city ? 'true' : undefined}
                />
                {profileErrors.city && (
                  <span className="form-error" role="alert">
                    {profileErrors.city}
                  </span>
                )}
              </div>

              <div>
                <label htmlFor="admin-bio" className="form-label">
                  Short bio
                </label>
                <textarea
                  id="admin-bio"
                  rows={3}
                  maxLength={240}
                  className="form-input resize-y"
                  placeholder="Anything you'd like on the admin profile card…"
                  value={profile.bio}
                  onChange={(event) => setProfile((prev) => ({ ...prev, bio: event.target.value }))}
                />
                <span className="mt-1.5 block text-[11px] text-ink-mute">{profile.bio.length}/240</span>
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-forest-light"
              >
                <Save className="h-4 w-4" aria-hidden />
                Save profile
              </button>
            </form>
          )}

          {/* --------------------------------------------------- platform */}
          {tab === 'platform' && (
            <form onSubmit={savePlatform} noValidate className="fade-scale-in max-w-xl space-y-5">
              <h2 className="flex items-center gap-2.5 text-lg">
                <Sparkles className="h-5 w-5 text-gold-dark" aria-hidden />
                Platform Information
              </h2>

              <div>
                <label htmlFor="plat-name" className="form-label">
                  Platform name<span className="ml-1 text-danger">*</span>
                </label>
                <input
                  id="plat-name"
                  className="form-input"
                  value={platform.name}
                  onChange={(event) => {
                    setPlatform((prev) => ({ ...prev, name: event.target.value }))
                    setPlatformErrors((prev) => ({ ...prev, name: undefined }))
                  }}
                  aria-invalid={platformErrors.name ? 'true' : undefined}
                />
                {platformErrors.name && (
                  <span className="form-error" role="alert">
                    {platformErrors.name}
                  </span>
                )}
              </div>

              <div>
                <label htmlFor="plat-tagline" className="form-label">
                  Tagline<span className="ml-1 text-danger">*</span>
                </label>
                <input
                  id="plat-tagline"
                  className="form-input"
                  value={platform.tagline}
                  onChange={(event) => {
                    setPlatform((prev) => ({ ...prev, tagline: event.target.value }))
                    setPlatformErrors((prev) => ({ ...prev, tagline: undefined }))
                  }}
                  aria-invalid={platformErrors.tagline ? 'true' : undefined}
                />
                {platformErrors.tagline && (
                  <span className="form-error" role="alert">
                    {platformErrors.tagline}
                  </span>
                )}
              </div>

              <div>
                <label htmlFor="plat-support" className="form-label">
                  Support email<span className="ml-1 text-danger">*</span>
                </label>
                <input
                  id="plat-support"
                  type="email"
                  className="form-input"
                  value={platform.supportEmail}
                  onChange={(event) => {
                    setPlatform((prev) => ({ ...prev, supportEmail: event.target.value }))
                    setPlatformErrors((prev) => ({ ...prev, supportEmail: undefined }))
                  }}
                  aria-invalid={platformErrors.supportEmail ? 'true' : undefined}
                />
                {platformErrors.supportEmail && (
                  <span className="form-error" role="alert">
                    {platformErrors.supportEmail}
                  </span>
                )}
                <span className="mt-1.5 block text-[11px] text-ink-mute">
                  Use a fictional demo address — no mail is ever delivered from this build.
                </span>
              </div>

              <div>
                <label htmlFor="plat-coverage" className="form-label">
                  City coverage
                </label>
                <input
                  id="plat-coverage"
                  className="form-input"
                  value={platform.coverage}
                  onChange={(event) =>
                    setPlatform((prev) => ({ ...prev, coverage: event.target.value }))
                  }
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-forest-light"
              >
                <Save className="h-4 w-4" aria-hidden />
                Save platform info
              </button>
            </form>
          )}

          {/* --------------------------------------------- notifications */}
          {tab === 'notifications' && (
            <div className="fade-scale-in max-w-xl space-y-5">
              <h2 className="flex items-center gap-2.5 text-lg">
                <Bell className="h-5 w-5 text-gold-dark" aria-hidden />
                Notification Preferences
              </h2>
              <p className="text-sm leading-relaxed text-ink-soft">
                Choose which demo events would raise admin alerts in the live product. These
                preferences only persist for this session.
              </p>

              <ul className="space-y-3">
                {(
                  [
                    ['newApplications', 'New owner applications', 'Alert me when a new application is submitted.'],
                    ['urgentTickets', 'Urgent support tickets', 'Alert me when a URGENT ticket is raised.'],
                    ['expiryAlerts', 'Subscription expiry alerts', 'Alert me 7 days before a subscription expires.'],
                    ['weeklyDigest', 'Weekly digest email', 'A weekly summary of platform activity.'],
                    ['productUpdates', 'Product updates', 'News about RahoMitra feature releases.'],
                  ] as const
                ).map(([key, label, description]) => (
                  <li key={key}>
                    <label className="flex cursor-pointer items-start gap-3.5 rounded-2xl border border-line bg-white px-4 py-3.5 transition-colors hover:border-forest/40">
                      <input
                        type="checkbox"
                        checked={prefs[key]}
                        onChange={(event) =>
                          setPrefs((prev) => ({ ...prev, [key]: event.target.checked }))
                        }
                        className="mt-1 h-4 w-4 accent-[#173D32]"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-ink">{label}</span>
                        <span className="mt-0.5 block text-[12.5px] text-ink-mute">{description}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={savePrefs}
                className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-forest-light"
              >
                <Save className="h-4 w-4" aria-hidden />
                Save preferences
              </button>
            </div>
          )}

          {/* --------------------------------------------------- security */}
          {tab === 'security' && (
            <form onSubmit={submitSecurity} noValidate className="fade-scale-in max-w-xl space-y-5">
              <h2 className="flex items-center gap-2.5 text-lg">
                <KeyRound className="h-5 w-5 text-gold-dark" aria-hidden />
                Security
              </h2>

              <div className="flex items-start gap-3 rounded-2xl border border-dashed border-gold/60 bg-gold-soft/50 px-4 py-3 text-[12.5px] leading-relaxed text-gold-dark">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>
                  <strong className="font-bold uppercase tracking-wide">Demo mode</strong> — this
                  form validates input only. No password is stored, hashed or changed anywhere.
                </span>
              </div>

              <div>
                <label htmlFor="sec-current" className="form-label">
                  Current password<span className="ml-1 text-danger">*</span>
                </label>
                <input
                  id="sec-current"
                  type="password"
                  autoComplete="current-password"
                  className="form-input"
                  placeholder="••••••••"
                  value={security.current}
                  onChange={(event) => {
                    setSecurity((prev) => ({ ...prev, current: event.target.value }))
                    setSecurityErrors((prev) => ({ ...prev, current: undefined }))
                  }}
                  aria-invalid={securityErrors.current ? 'true' : undefined}
                />
                {securityErrors.current && (
                  <span className="form-error" role="alert">
                    {securityErrors.current}
                  </span>
                )}
              </div>

              <div>
                <label htmlFor="sec-new" className="form-label">
                  New password<span className="ml-1 text-danger">*</span>
                </label>
                <input
                  id="sec-new"
                  type="password"
                  autoComplete="new-password"
                  className="form-input"
                  placeholder="At least 8 characters"
                  value={security.next}
                  onChange={(event) => {
                    setSecurity((prev) => ({ ...prev, next: event.target.value }))
                    setSecurityErrors((prev) => ({ ...prev, next: undefined }))
                  }}
                  aria-invalid={securityErrors.next ? 'true' : undefined}
                />
                {securityErrors.next && (
                  <span className="form-error" role="alert">
                    {securityErrors.next}
                  </span>
                )}
              </div>

              <div>
                <label htmlFor="sec-confirm" className="form-label">
                  Confirm new password<span className="ml-1 text-danger">*</span>
                </label>
                <input
                  id="sec-confirm"
                  type="password"
                  autoComplete="new-password"
                  className="form-input"
                  placeholder="Re-enter the new password"
                  value={security.confirm}
                  onChange={(event) => {
                    setSecurity((prev) => ({ ...prev, confirm: event.target.value }))
                    setSecurityErrors((prev) => ({ ...prev, confirm: undefined }))
                  }}
                  aria-invalid={securityErrors.confirm ? 'true' : undefined}
                />
                {securityErrors.confirm && (
                  <span className="form-error" role="alert">
                    {securityErrors.confirm}
                  </span>
                )}
              </div>

              {securityNotice && (
                <div className="fade-scale-in flex items-start gap-3 rounded-2xl border border-forest/25 bg-forest-soft px-4 py-3.5 text-[13px] leading-relaxed text-forest">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>
                    Validation passed — but this is a frontend demo, so{' '}
                    <strong>no password was changed</strong>. Real account security arrives with
                    backend integration.
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-forest-light"
              >
                <Eye className="h-4 w-4" aria-hidden />
                Validate password change
              </button>
            </form>
          )}

          {/* ------------------------------------------------ appearance */}
          {tab === 'appearance' && (
            <div className="fade-scale-in max-w-xl space-y-6">
              <h2 className="flex items-center gap-2.5 text-lg">
                <Palette className="h-5 w-5 text-gold-dark" aria-hidden />
                Appearance Preferences
              </h2>

              <div>
                <span className="form-label">Accent colour</span>
                <div className="flex flex-wrap gap-3">
                  {(
                    [
                      ['forest', 'Forest Green'],
                      ['gold', 'Gold'],
                      ['ink', 'Dark'],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAppearance((prev) => ({ ...prev, accent: value }))}
                      className={
                        appearance.accent === value
                          ? 'flex items-center gap-2.5 rounded-full border-2 border-forest bg-forest-soft px-4 py-2.5 text-sm font-bold text-forest'
                          : 'flex items-center gap-2.5 rounded-full border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-forest/40'
                      }
                    >
                      <span
                        className={cn(
                          'h-4 w-4 rounded-full',
                          value === 'forest' && 'bg-forest',
                          value === 'gold' && 'bg-gold',
                          value === 'ink' && 'bg-ink',
                        )}
                        aria-hidden
                      />
                      {label}
                      {appearance.accent === value && <Check className="h-4 w-4" aria-hidden />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="form-label">Table density</span>
                <div className="flex rounded-full border border-line bg-white p-1">
                  {(
                    [
                      ['comfortable', 'Comfortable'],
                      ['compact', 'Compact'],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAppearance((prev) => ({ ...prev, density: value }))}
                      className={cn(
                        'flex-1 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors',
                        appearance.density === value
                          ? 'bg-forest text-ivory'
                          : 'text-ink-soft hover:text-forest',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="form-label">Button shape</span>
                <div className="flex rounded-full border border-line bg-white p-1">
                  {(
                    [
                      ['full', 'Pill'],
                      ['soft', 'Soft rounded'],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAppearance((prev) => ({ ...prev, rounded: value }))}
                      className={cn(
                        'flex-1 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors',
                        appearance.rounded === value
                          ? 'bg-forest text-ivory'
                          : 'text-ink-soft hover:text-forest',
                        appearance.rounded === 'full' || value === 'full'
                          ? 'rounded-full'
                          : 'rounded-xl',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live preview */}
              <div className="rounded-2xl border border-line bg-ivory/40 p-5">
                <p className="mb-3.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-mute">
                  <SettingsIcon className="h-3.5 w-3.5" aria-hidden />
                  Live preview
                </p>
                <div className="space-y-3">
                  <div className={cn('rounded-2xl border border-line bg-white', densityClass)}>
                    <p className="text-sm font-semibold text-ink">Sample table row</p>
                    <p className="text-[12px] text-ink-mute">
                      Density: {appearance.density} · Accent: {appearance.accent}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <span
                      className={cn(
                        'inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold',
                        accentClasses,
                        appearance.rounded === 'full' ? 'rounded-full' : 'rounded-xl',
                      )}
                    >
                      <Check className="h-4 w-4" aria-hidden />
                      Primary action
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-soft',
                        appearance.rounded === 'full' ? 'rounded-full' : 'rounded-xl',
                      )}
                    >
                      Secondary action
                    </span>
                  </div>
                </div>
              </div>

              <p className="rounded-2xl border border-dashed border-gold/60 bg-gold-soft/50 px-4 py-3 text-[12px] leading-relaxed text-gold-dark">
                Appearance choices preview instantly and persist for this session only — they are
                not written anywhere.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
