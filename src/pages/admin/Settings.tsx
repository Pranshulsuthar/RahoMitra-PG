import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  Bell,
  Briefcase,
  Check,
  Eye,
  History,
  KeyRound,
  Lock,
  Palette,
  RotateCcw,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wrench,
} from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdminStore } from '../../context/AdminStore'
import type { PlatformSettings } from '../../types/admin'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { Modal } from '../../components/admin/Modal'
import { cn } from '../../utils/cn'

type TabId = 'general' | 'branding' | 'business' | 'notifications' | 'security' | 'maintenance'

const TABS: Array<{ id: TabId; label: string; icon: typeof UserRound }> = [
  { id: 'general', label: 'A · General', icon: SettingsIcon },
  { id: 'branding', label: 'B · Branding', icon: Palette },
  { id: 'business', label: 'C · Business', icon: Briefcase },
  { id: 'notifications', label: 'D · Notifications', icon: Bell },
  { id: 'security', label: 'E · Security & Access', icon: ShieldCheck },
  { id: 'maintenance', label: 'F · Maintenance', icon: Wrench },
]

const NOTIFY_LABELS: Array<[keyof PlatformSettings['notify'], string, string]> = [
  ['newOwnerApplication', 'New Owner Application', 'Alert when a demo owner submits an application.'],
  ['newPgApproval', 'New PG Approval Request', 'Alert when a PG listing awaits approval.'],
  ['newStudentRegistration', 'New Student Registration', 'Alert when a new student account registers.'],
  ['newComplaint', 'New Complaint', 'Alert when a demo complaint is raised.'],
  ['subscriptionExpiry', 'Subscription Expiry', 'Alert 7 days before a subscription expires.'],
  ['featuredRequest', 'Featured Listing Request', 'Alert when an owner requests featured placement.'],
]

/** /admin/settings — Section 08 tabs A–F (local demo state only). */
export function AdminSettings() {
  useDocumentTitle('Settings')

  const { settings, saveSettings, resetSettings, activities, pushToast } = useAdminStore()
  const [tab, setTab] = useState<TabId>('general')

  /* Local draft — Save writes into the shared demo store. */
  const [draft, setDraft] = useState<PlatformSettings>({ ...settings })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [resetOpen, setResetOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [security, setSecurity] = useState({ current: '', next: '', confirm: '' })
  const [securityErrors, setSecurityErrors] = useState<Record<string, string | undefined>>({})
  const [securityNotice, setSecurityNotice] = useState(false)

  const patch = (updates: Partial<PlatformSettings>) => {
    setDraft((prev) => ({ ...prev, ...updates }))
    setErrors({})
  }

  const saveGeneral = (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (draft.platformName.trim().length < 2) next.platformName = 'Platform name is required.'
    if (draft.tagline.trim().length < 4) next.tagline = 'Tagline must be at least 4 characters.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.supportEmail))
      next.supportEmail = 'Enter a valid support email address.'
    if (draft.supportPhone.trim().length < 6) next.supportPhone = 'Support phone is required.'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    saveSettings({
      platformName: draft.platformName.trim(),
      hindiName: draft.hindiName.trim(),
      tagline: draft.tagline.trim(),
      description: draft.description.trim(),
      supportEmail: draft.supportEmail.trim(),
      supportPhone: draft.supportPhone.trim(),
      currency: draft.currency,
      country: draft.country,
      timezone: draft.timezone,
    })
    pushToast('General settings saved (demo — local state only).')
  }

  const saveBranding = (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (draft.websiteTitle.trim().length < 3) next.websiteTitle = 'Website title is required.'
    if (draft.footerDescription.trim().length < 10)
      next.footerDescription = 'Footer description must be at least 10 characters.'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    saveSettings({
      logoPreview: draft.logoPreview,
      faviconPreview: draft.faviconPreview,
      brandColors: draft.brandColors,
      websiteTitle: draft.websiteTitle.trim(),
      footerDescription: draft.footerDescription.trim(),
    })
    pushToast('Branding settings saved (demo — local state only).')
  }

  const saveBusiness = (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!(draft.trialDurationDays >= 0 && draft.trialDurationDays <= 90))
      next.trialDurationDays = 'Trial duration must be between 0 and 90 days.'
    if (!(draft.gracePeriodDays >= 0 && draft.gracePeriodDays <= 60))
      next.gracePeriodDays = 'Grace period must be between 0 and 60 days.'
    if (draft.featuredPrice <= 0) next.featuredPrice = 'Featured price must be positive.'
    if (draft.premiumFeaturedPrice <= 0) next.premiumFeaturedPrice = 'Premium price must be positive.'
    if (draft.adPriceBase <= 0) next.adPriceBase = 'Ad base price must be positive.'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    saveSettings({
      trialDurationDays: draft.trialDurationDays,
      gracePeriodDays: draft.gracePeriodDays,
      featuredPrice: draft.featuredPrice,
      premiumFeaturedPrice: draft.premiumFeaturedPrice,
      adPriceBase: draft.adPriceBase,
    })
    pushToast('Business settings saved (demo — local state only).')
  }

  const saveNotifications = () => {
    saveSettings({ notify: { ...draft.notify } })
    pushToast('Notification preferences saved (demo — local state only).')
  }

  const submitPassword = (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!security.current) next.current = 'Enter your current demo password.'
    if (security.next.length < 8) next.next = 'New password must be at least 8 characters.'
    if (security.confirm !== security.next) next.confirm = 'Passwords do not match.'
    setSecurityErrors(next)
    if (Object.keys(next).length > 0) return
    setSecurityNotice(true)
    setSecurity({ current: '', next: '', confirm: '' })
    pushToast('Validation passed — no password was actually changed (demo).', 'info')
  }

  const saveMaintenance = (event: FormEvent) => {
    event.preventDefault()
    if (draft.maintenanceMessage.trim().length < 10) {
      setErrors({ maintenanceMessage: 'Maintenance message must be at least 10 characters.' })
      return
    }
    saveSettings({
      maintenanceMode: draft.maintenanceMode,
      maintenanceMessage: draft.maintenanceMessage.trim(),
    })
    pushToast(
      draft.maintenanceMode
        ? 'Maintenance mode toggled ON (visual demo only — the site is NOT actually in maintenance).'
        : 'Maintenance mode toggled OFF (demo).',
      'info',
    )
  }

  const confirmReset = () => {
    const defaults = resetSettings()
    setDraft({
      ...defaults,
      brandColors: { ...defaults.brandColors },
      notify: { ...defaults.notify },
    })
    setErrors({})
    setResetOpen(false)
    pushToast('Demo settings restored to defaults.', 'info')
  }

  /* Re-sync the draft whenever the tab changes (settings may have reset). */
  const switchTab = (id: TabId) => {
    setTab(id)
    setErrors({})
  }

  const numberField = (
    key: 'trialDurationDays' | 'gracePeriodDays' | 'featuredPrice' | 'premiumFeaturedPrice' | 'adPriceBase',
    label: string,
    suffix?: string,
  ) => (
    <div>
      <label htmlFor={`biz-${key}`} className="form-label">
        {label}
        {suffix && <span className="ml-1 text-ink-mute">({suffix})</span>}
      </label>
      <input
        id={`biz-${key}`}
        type="number"
        min={0}
        className="form-input"
        value={draft[key]}
        onChange={(event) => patch({ [key]: Number(event.target.value) } as Partial<PlatformSettings>)}
        aria-invalid={errors[key] ? 'true' : undefined}
      />
      {errors[key] && (
        <span className="form-error" role="alert">
          {errors[key]}
        </span>
      )}
    </div>
  )

  return (
    <>
      <AdminPageHeader
        title="Settings"
        description="Platform configuration across six areas — General, Branding, Business, Notifications, Security & Access and Maintenance. Everything saves to local demo state."
        actions={
          <>
            <button
              type="button"
              onClick={() => {
                setDraft({ ...settings })
                setErrors({})
                pushToast('Unsaved changes discarded (demo).', 'info')
              }}
              className="inline-flex items-center gap-2 rounded-full border border-forest/25 bg-white px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Discard changes
            </button>
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-danger/40 bg-white px-5 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger hover:text-white"
            >
              <History className="h-4 w-4" aria-hidden />
              Reset demo settings
            </button>
          </>
        }
      />

      <DemoBanner message="settings save to in-memory demo state — refreshing the page restores the defaults. None of this controls a real deployed platform." />

      <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        {/* Tab rail */}
        <nav className="h-fit rounded-3xl border border-line bg-white p-2.5 shadow-card" aria-label="Settings sections">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => switchTab(item.id)}
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
          {/* -------------------------------------------------- A · General */}
          {tab === 'general' && (
            <form onSubmit={saveGeneral} noValidate className="fade-scale-in max-w-2xl space-y-5">
              <h2 className="flex items-center gap-2.5 text-lg">
                <SettingsIcon className="h-5 w-5 text-gold-dark" aria-hidden />
                General Settings
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="gen-name" className="form-label">
                    Platform name<span className="ml-1 text-danger">*</span>
                  </label>
                  <input
                    id="gen-name"
                    className="form-input"
                    value={draft.platformName}
                    onChange={(event) => patch({ platformName: event.target.value })}
                    aria-invalid={errors.platformName ? 'true' : undefined}
                  />
                  {errors.platformName && <span className="form-error" role="alert">{errors.platformName}</span>}
                </div>
                <div>
                  <label htmlFor="gen-hindi" className="form-label">
                    Hindi brand name
                  </label>
                  <input
                    id="gen-hindi"
                    className="form-input"
                    value={draft.hindiName}
                    onChange={(event) => patch({ hindiName: event.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="gen-tagline" className="form-label">
                  Tagline<span className="ml-1 text-danger">*</span>
                </label>
                <input
                  id="gen-tagline"
                  className="form-input"
                  value={draft.tagline}
                  onChange={(event) => patch({ tagline: event.target.value })}
                  aria-invalid={errors.tagline ? 'true' : undefined}
                />
                {errors.tagline && <span className="form-error" role="alert">{errors.tagline}</span>}
              </div>

              <div>
                <label htmlFor="gen-desc" className="form-label">
                  Platform description
                </label>
                <textarea
                  id="gen-desc"
                  rows={3}
                  className="form-input resize-y"
                  value={draft.description}
                  onChange={(event) => patch({ description: event.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="gen-email" className="form-label">
                    Support contact email (demo)<span className="ml-1 text-danger">*</span>
                  </label>
                  <input
                    id="gen-email"
                    type="email"
                    className="form-input"
                    value={draft.supportEmail}
                    onChange={(event) => patch({ supportEmail: event.target.value })}
                    aria-invalid={errors.supportEmail ? 'true' : undefined}
                  />
                  {errors.supportEmail && <span className="form-error" role="alert">{errors.supportEmail}</span>}
                </div>
                <div>
                  <label htmlFor="gen-phone" className="form-label">
                    Support phone (demo)<span className="ml-1 text-danger">*</span>
                  </label>
                  <input
                    id="gen-phone"
                    className="form-input"
                    value={draft.supportPhone}
                    onChange={(event) => patch({ supportPhone: event.target.value })}
                    aria-invalid={errors.supportPhone ? 'true' : undefined}
                  />
                  {errors.supportPhone && <span className="form-error" role="alert">{errors.supportPhone}</span>}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="gen-currency" className="form-label">
                    Default currency
                  </label>
                  <select
                    id="gen-currency"
                    className="form-input"
                    value={draft.currency}
                    onChange={(event) => patch({ currency: event.target.value })}
                  >
                    <option value="INR (₹)">INR (₹)</option>
                    <option value="USD ($)">USD ($)</option>
                    <option value="EUR (€)">EUR (€)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="gen-country" className="form-label">
                    Default country
                  </label>
                  <select
                    id="gen-country"
                    className="form-input"
                    value={draft.country}
                    onChange={(event) => patch({ country: event.target.value })}
                  >
                    <option value="India">India</option>
                    <option value="Nepal">Nepal</option>
                    <option value="Bhutan">Bhutan</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="gen-tz" className="form-label">
                    Default timezone
                  </label>
                  <select
                    id="gen-tz"
                    className="form-input"
                    value={draft.timezone}
                    onChange={(event) => patch({ timezone: event.target.value })}
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata</option>
                    <option value="Asia/Kathmandu">Asia/Kathmandu</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-forest-light"
              >
                <Save className="h-4 w-4" aria-hidden />
                Save general settings
              </button>
            </form>
          )}

          {/* ------------------------------------------------- B · Branding */}
          {tab === 'branding' && (
            <form onSubmit={saveBranding} noValidate className="fade-scale-in max-w-2xl space-y-5">
              <h2 className="flex items-center gap-2.5 text-lg">
                <Palette className="h-5 w-5 text-gold-dark" aria-hidden />
                Branding Settings
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-line bg-ivory/40 p-4">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">
                    Platform logo preview
                  </p>
                  <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-card">
                    <img src="/RahoMitra_logo.png" alt="Platform logo" className="h-16 w-16 object-contain" />
                  </span>
                  <p className="mt-2 text-[11.5px] text-ink-mute">
                    Logo swaps arrive with asset uploads (demo).
                  </p>
                </div>
                <div className="rounded-2xl border border-line bg-ivory/40 p-4">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">
                    Favicon preview
                  </p>
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-card">
                    <img src="/RahoMitra_logo.png" alt="Favicon" className="h-9 w-9 object-contain" />
                  </span>
                  <p className="mt-2 text-[11.5px] text-ink-mute">Shown in browser tabs (demo).</p>
                </div>
              </div>

              <div>
                <span className="form-label">Brand colours</span>
                <div className="grid gap-3 sm:grid-cols-4">
                  {(
                    [
                      ['forest', 'Forest Green'],
                      ['ivory', 'Ivory'],
                      ['gold', 'Gold'],
                      ['dark', 'Dark'],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="rounded-2xl border border-line bg-white p-3 text-center">
                      <span
                        className="mx-auto block h-10 w-10 rounded-xl border border-line"
                        style={{ backgroundColor: draft.brandColors[key] }}
                        aria-hidden
                      />
                      <p className="mt-2 text-[12px] font-bold text-ink">{label}</p>
                      <p className="font-mono text-[11px] text-ink-mute">{draft.brandColors[key]}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="brand-title" className="form-label">
                  Website title<span className="ml-1 text-danger">*</span>
                </label>
                <input
                  id="brand-title"
                  className="form-input"
                  value={draft.websiteTitle}
                  onChange={(event) => patch({ websiteTitle: event.target.value })}
                  aria-invalid={errors.websiteTitle ? 'true' : undefined}
                />
                {errors.websiteTitle && <span className="form-error" role="alert">{errors.websiteTitle}</span>}
              </div>

              <div>
                <label htmlFor="brand-footer" className="form-label">
                  Footer description<span className="ml-1 text-danger">*</span>
                </label>
                <textarea
                  id="brand-footer"
                  rows={3}
                  className="form-input resize-y"
                  value={draft.footerDescription}
                  onChange={(event) => patch({ footerDescription: event.target.value })}
                  aria-invalid={errors.footerDescription ? 'true' : undefined}
                />
                {errors.footerDescription && (
                  <span className="form-error" role="alert">{errors.footerDescription}</span>
                )}
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-forest-light"
              >
                <Save className="h-4 w-4" aria-hidden />
                Save branding
              </button>
            </form>
          )}

          {/* ------------------------------------------------- C · Business */}
          {tab === 'business' && (
            <form onSubmit={saveBusiness} noValidate className="fade-scale-in max-w-2xl space-y-5">
              <h2 className="flex items-center gap-2.5 text-lg">
                <Briefcase className="h-5 w-5 text-gold-dark" aria-hidden />
                Business Settings
              </h2>

              <div className="rounded-2xl border border-line bg-ivory/40 p-4">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">
                  Subscription plan configuration
                </p>
                <p className="text-[13px] leading-relaxed text-ink-soft">
                  Plan names, prices, billing durations and property limits are managed on the{' '}
                  <span className="font-semibold text-forest">Subscription Plans</span> screen. Prices
                  shown there are illustrative and not final commercial commitments.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {numberField('trialDurationDays', 'Trial duration', 'days')}
                {numberField('gracePeriodDays', 'Subscription grace period', 'days')}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {numberField('featuredPrice', 'Featured listing price', '₹/month')}
                {numberField('premiumFeaturedPrice', 'Premium featured price', '₹/month')}
                {numberField('adPriceBase', 'Advertising base price', '₹/campaign')}
              </div>

              <p className="rounded-2xl border border-dashed border-gold/60 bg-gold-soft/50 px-4 py-3 text-[12px] leading-relaxed text-gold-dark">
                These figures are proposed demo prices used by the featured and advertisement screens —
                no billing engine exists in this frontend-only build.
              </p>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-forest-light"
              >
                <Save className="h-4 w-4" aria-hidden />
                Save business settings
              </button>
            </form>
          )}

          {/* ------------------------------------------- D · Notifications */}
          {tab === 'notifications' && (
            <div className="fade-scale-in max-w-2xl space-y-5">
              <h2 className="flex items-center gap-2.5 text-lg">
                <Bell className="h-5 w-5 text-gold-dark" aria-hidden />
                Notification Settings
              </h2>
              <p className="text-sm leading-relaxed text-ink-soft">
                Toggle which demo events would raise admin alerts in the live product. Preferences
                persist in this session only — no email or SMS is ever sent.
              </p>

              <ul className="space-y-3">
                {NOTIFY_LABELS.map(([key, label, description]) => (
                  <li key={key}>
                    <label className="flex cursor-pointer items-start gap-3.5 rounded-2xl border border-line bg-white px-4 py-3.5 transition-colors hover:border-forest/40">
                      <input
                        type="checkbox"
                        checked={draft.notify[key]}
                        onChange={(event) =>
                          setDraft((prev) => ({
                            ...prev,
                            notify: { ...prev.notify, [key]: event.target.checked },
                          }))
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
                onClick={saveNotifications}
                className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-forest-light"
              >
                <Save className="h-4 w-4" aria-hidden />
                Save preferences
              </button>
            </div>
          )}

          {/* ---------------------------------------- E · Security & Access */}
          {tab === 'security' && (
            <div className="fade-scale-in max-w-2xl space-y-6">
              <h2 className="flex items-center gap-2.5 text-lg">
                <ShieldCheck className="h-5 w-5 text-gold-dark" aria-hidden />
                Security &amp; Access
              </h2>

              {/* Admin profile */}
              <div className="rounded-2xl border border-line bg-ivory/40 p-4">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">
                  Admin profile
                </p>
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-forest text-lg font-bold text-ivory">
                    SA
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink">Super Admin (demo)</p>
                    <p className="text-[12.5px] text-ink-soft">admin@rahomitra.demo</p>
                    <p className="text-[11.5px] text-ink-mute">Role: Super Admin · Session: demo</p>
                  </div>
                  <StatusBadge status="ACTIVE" className="ml-auto" />
                </div>
              </div>

              {/* Change password UI */}
              <button
                type="button"
                onClick={() => {
                  setSecurityNotice(false)
                  setPasswordOpen(true)
                }}
                className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-forest-light"
              >
                <KeyRound className="h-4 w-4" aria-hidden />
                Change password (demo)
              </button>

              {/* Session settings */}
              <div className="rounded-2xl border border-line bg-white p-4">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">
                  Session settings
                </p>
                <ul className="space-y-2 text-[13px] text-ink-soft">
                  <li className="flex items-center justify-between gap-3 border-b border-line pb-2">
                    <span>Session timeout</span>
                    <span className="font-semibold text-ink">30 minutes (demo)</span>
                  </li>
                  <li className="flex items-center justify-between gap-3 border-b border-line pb-2">
                    <span>Idle logout warning</span>
                    <span className="font-semibold text-ink">Enabled (demo)</span>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span>Concurrent sessions</span>
                    <span className="font-semibold text-ink">1 device (demo)</span>
                  </li>
                </ul>
              </div>

              {/* Roles overview */}
              <div className="rounded-2xl border border-line bg-white p-4">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">
                  Roles &amp; permissions overview
                </p>
                <div className="space-y-3">
                  {[
                    ['Super Admin', 'Full access: listings, owners, plans, billing, settings, reports.'],
                    ['Support Staff', 'Tickets, responses and status changes only (demo).'],
                    ['PG Owner', 'Own properties, students, billing, subscription and communication.'],
                    ['Student', 'Own profile, room, notices, complaints and billing.'],
                  ].map(([role, description]) => (
                    <div key={role} className="flex items-start gap-3">
                      <span className="mt-0.5 rounded-full border border-gold/40 bg-gold-soft px-2.5 py-0.5 text-[10.5px] font-bold uppercase text-gold-dark">
                        {role}
                      </span>
                      <span className="text-[13px] leading-relaxed text-ink-soft">{description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin activity log link */}
              <div className="rounded-2xl border border-line bg-white p-4">
                <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">
                  <History className="h-3.5 w-3.5" aria-hidden />
                  Admin activity log
                </p>
                <p className="text-[13px] leading-relaxed text-ink-soft">
                  The last demo action was:{' '}
                  <span className="font-semibold text-ink">{activities[0]?.action ?? activities[0]?.text ?? '—'}</span>
                  . Open{' '}
                  <a href="/admin/activity-logs" className="font-semibold text-forest underline-offset-2 hover:underline">
                    Activity Logs
                  </a>{' '}
                  for the full audit trail ({activities.length} entries).
                </p>
              </div>
            </div>
          )}

          {/* -------------------------------------------- F · Maintenance */}
          {tab === 'maintenance' && (
            <form onSubmit={saveMaintenance} noValidate className="fade-scale-in max-w-2xl space-y-5">
              <h2 className="flex items-center gap-2.5 text-lg">
                <Wrench className="h-5 w-5 text-gold-dark" aria-hidden />
                Maintenance Settings
              </h2>

              <label className="flex cursor-pointer items-start gap-3.5 rounded-2xl border border-line bg-white px-4 py-4 transition-colors hover:border-forest/40">
                <input
                  type="checkbox"
                  checked={draft.maintenanceMode}
                  onChange={(event) => patch({ maintenanceMode: event.target.checked })}
                  className="mt-1 h-4 w-4 accent-[#173D32]"
                />
                <span>
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                    Maintenance mode
                    <StatusBadge status={draft.maintenanceMode ? 'ACTIVE' : 'DISABLED'} />
                  </span>
                  <span className="mt-1 block text-[12.5px] leading-relaxed text-ink-mute">
                    Visual demo only — toggling this does NOT take any site offline. No real
                    maintenance mode exists in this frontend-only build.
                  </span>
                </span>
              </label>

              <div>
                <label htmlFor="maint-msg" className="form-label">
                  Maintenance message<span className="ml-1 text-danger">*</span>
                </label>
                <textarea
                  id="maint-msg"
                  rows={3}
                  className="form-input resize-y"
                  value={draft.maintenanceMessage}
                  onChange={(event) => patch({ maintenanceMessage: event.target.value })}
                  aria-invalid={errors.maintenanceMessage ? 'true' : undefined}
                />
                {errors.maintenanceMessage && (
                  <span className="form-error" role="alert">{errors.maintenanceMessage}</span>
                )}
              </div>

              <div className="rounded-2xl border border-dashed border-gold/60 bg-gold-soft/50 px-4 py-3 text-[12.5px] leading-relaxed text-gold-dark">
                <strong className="font-bold uppercase tracking-wide">Demo mode</strong> — these
                settings are illustrative only and do not claim to control a real deployed platform.
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-forest-light"
                >
                  <Save className="h-4 w-4" aria-hidden />
                  Save settings
                </button>
                <button
                  type="button"
                  onClick={() => setResetOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-danger/40 bg-white px-6 py-3 text-sm font-semibold text-danger transition-colors hover:bg-danger hover:text-white"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  Reset demo settings
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ------------------------------------------------ reset confirm */}
      <Modal
        open={resetOpen}
        title="Reset demo settings?"
        onClose={() => setResetOpen(false)}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setResetOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-forest/25 bg-white px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmReset}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-danger px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-danger/90"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Reset everything
            </button>
          </>
        }
      >
        <div className="flex items-start gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-danger-soft text-danger">
            <RotateCcw className="h-5 w-5" aria-hidden />
          </span>
          <p className="text-sm leading-relaxed text-ink-soft">
            Restore every setting on this screen to the original demo defaults? Unsaved edits will be
            lost. This only affects local demo state — nothing is stored on any server.
          </p>
        </div>
      </Modal>

      {/* --------------------------------------------- change password */}
      <Modal
        open={passwordOpen}
        title="Change password"
        subtitle="DEMO MODE — no password is stored, hashed or changed anywhere."
        onClose={() => setPasswordOpen(false)}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setPasswordOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-forest/25 bg-white px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="password-form"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-forest-light"
            >
              <Eye className="h-4 w-4" aria-hidden />
              Validate password change
            </button>
          </>
        }
      >
        <form id="password-form" onSubmit={submitPassword} noValidate className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl border border-dashed border-gold/60 bg-gold-soft/50 px-4 py-3 text-[12.5px] leading-relaxed text-gold-dark">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              This form validates input only. Real account security arrives with backend integration.
            </span>
          </div>

          <div>
            <label htmlFor="pw-current" className="form-label">
              Current password<span className="ml-1 text-danger">*</span>
            </label>
            <input
              id="pw-current"
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
            {securityErrors.current && <span className="form-error" role="alert">{securityErrors.current}</span>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pw-new" className="form-label">
                New password<span className="ml-1 text-danger">*</span>
              </label>
              <input
                id="pw-new"
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
              {securityErrors.next && <span className="form-error" role="alert">{securityErrors.next}</span>}
            </div>
            <div>
              <label htmlFor="pw-confirm" className="form-label">
                Confirm new password<span className="ml-1 text-danger">*</span>
              </label>
              <input
                id="pw-confirm"
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
                <span className="form-error" role="alert">{securityErrors.confirm}</span>
              )}
            </div>
          </div>

          {securityNotice && (
            <div className="fade-scale-in flex items-start gap-3 rounded-2xl border border-forest/25 bg-forest-soft px-4 py-3.5 text-[13px] leading-relaxed text-forest">
              <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>
                Validation passed — but this is a frontend demo, so{' '}
                <strong>no password was changed</strong>.
              </span>
            </div>
          )}
        </form>
      </Modal>

      <p className="mt-6 flex items-center gap-2 text-[11.5px] text-ink-mute">
        <Sparkles className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
        Frontend-only demo — settings live in memory and reset on reload.
      </p>
    </>
  )
}
