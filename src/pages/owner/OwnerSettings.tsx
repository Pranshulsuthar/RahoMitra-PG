import { useState } from 'react'
import {
  Bell,
  Building2,
  Check,
  Eye,
  ImagePlus,
  Moon,
  Palette,
  QrCode,
  Save,
  ShieldCheck,
  Sun,
  UserRound,
  Wallet,
  X,
} from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useOwnerStore } from '../../context/OwnerStore'
import { useBillingStore } from '../../context/BillingStore'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { Button } from '../../components/common/Button'
import { FormInput, FormTextarea } from '../../components/owner/FormInput'
import { cn } from '../../utils/cn'

const MAX_QR_BYTES = 5 * 1024 * 1024

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

/** /owner/settings — local preferences and account info (no real security APIs). */
export function OwnerSettings() {
  useDocumentTitle('Settings')

  const { owner, properties, pushToast } = useOwnerStore()
  const { paymentDetails, updatePaymentDetails, pushToast: pushBillingToast } = useBillingStore()

  const [payForm, setPayForm] = useState({
    upiId: paymentDetails.upiId,
    accountHolder: paymentDetails.accountHolder,
    instructions: paymentDetails.instructions,
  })
  const [qrError, setQrError] = useState<string | null>(null)

  const [prefs, setPrefs] = useState({
    emailAlerts: true,
    smsAlerts: false,
    newRequests: true,
    weeklySummary: true,
    darkMode: false,
    compactTables: false,
    showOccupancyOnDashboard: true,
    profileVisible: true,
  })

  const set = (key: keyof typeof prefs, value: boolean) =>
    setPrefs((prev) => ({ ...prev, [key]: value }))

  const saveAll = () => {
    pushToast('Preferences saved (demo — local state only).')
  }

  const savePaymentDetails = () => {
    updatePaymentDetails({
      upiId: payForm.upiId.trim(),
      accountHolder: payForm.accountHolder.trim(),
      instructions: payForm.instructions.trim(),
    })
    pushBillingToast('Payment details saved — students now see these on their invoices (demo).')
  }

  const handleQrFile = (file: File | undefined) => {
    if (!file) return
    setQrError(null)
    if (!file.type.startsWith('image/')) {
      setQrError('Please choose an image file (PNG or JPG).')
      return
    }
    if (file.size > MAX_QR_BYTES) {
      setQrError('Image must be 5MB or smaller.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      updatePaymentDetails({ qrImage: String(reader.result ?? '') })
      pushBillingToast('QR preview stored locally — it never leaves this browser (demo).')
    }
    reader.onerror = () => setQrError('Could not read that file — try another image.')
    reader.readAsDataURL(file)
  }

  return (
    <>
      <AdminPageHeader
        title="Settings"
        description="Profile, notification, appearance and account preferences — all local demo state."
        actions={
          <Button variant="primary" onClick={saveAll}>
            <Save className="h-4 w-4" aria-hidden />
            Save preferences
          </Button>
        }
      />

      <DemoBanner message="preference changes are stored in React state only and reset on reload — no real notifications, emails or account changes occur." />

      <div className="grid gap-6 xl:grid-cols-2">
        {/* -------------------------------------------------- notifications */}
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <h2 className="mb-1 flex items-center gap-2.5 text-base sm:text-lg">
            <Bell className="h-4.5 w-4.5 text-gold-dark" aria-hidden />
            Notification preferences
          </h2>
          <p className="mb-4 text-[12.5px] text-ink-mute">
            UI only — no real emails or SMS are ever sent from this frontend demo.
          </p>
          <div className="space-y-3">
            <ToggleRow
              icon={Bell}
              title="Email alerts"
              description="Simulate email alerts for new admission requests."
              checked={prefs.emailAlerts}
              onChange={(v) => set('emailAlerts', v)}
            />
            <ToggleRow
              icon={Bell}
              title="SMS alerts"
              description="Simulate SMS alerts for bed and room changes."
              checked={prefs.smsAlerts}
              onChange={(v) => set('smsAlerts', v)}
            />
            <ToggleRow
              icon={Bell}
              title="New admission requests"
              description="Show a notification when a demo request arrives."
              checked={prefs.newRequests}
              onChange={(v) => set('newRequests', v)}
            />
            <ToggleRow
              icon={Bell}
              title="Weekly occupancy summary"
              description="Simulated weekly digest of occupancy across your PGs."
              checked={prefs.weeklySummary}
              onChange={(v) => set('weeklySummary', v)}
            />
          </div>
        </section>

        {/* ----------------------------------------------------- appearance */}
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <h2 className="mb-1 flex items-center gap-2.5 text-base sm:text-lg">
            <Palette className="h-4.5 w-4.5 text-gold-dark" aria-hidden />
            Appearance preferences
          </h2>
          <p className="mb-4 text-[12.5px] text-ink-mute">
            Visual preferences for this demo session only.
          </p>
          <div className="space-y-3">
            <ToggleRow
              icon={Moon}
              title="Dark mode"
              description="Theme arrives with a later design-system pass — toggle is stored locally."
              checked={prefs.darkMode}
              onChange={(v) => set('darkMode', v)}
            />
            <ToggleRow
              icon={Eye}
              title="Compact tables"
              description="Tighter row spacing in data tables."
              checked={prefs.compactTables}
              onChange={(v) => set('compactTables', v)}
            />
            <ToggleRow
              icon={Sun}
              title="Show occupancy on dashboard"
              description="Display the occupancy percentage stat card."
              checked={prefs.showOccupancyOnDashboard}
              onChange={(v) => set('showOccupancyOnDashboard', v)}
            />
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-line bg-ivory/50 px-4 py-3 text-[11.5px] leading-relaxed text-ink-mute">
            <strong className="text-ink-soft">Preview:</strong> the dashboard keeps its RahoMitra
            Forest / Ivory / Gold theme regardless — this build ships one premium theme.
          </div>
        </section>

        {/* -------------------------------------------- profile preferences */}
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <h2 className="mb-1 flex items-center gap-2.5 text-base sm:text-lg">
            <UserRound className="h-4.5 w-4.5 text-gold-dark" aria-hidden />
            Profile preferences
          </h2>
          <p className="mb-4 text-[12.5px] text-ink-mute">
            Control how your owner profile appears inside this demo.
          </p>
          <div className="space-y-3">
            <ToggleRow
              icon={UserRound}
              title="Profile visible to students"
              description="Show the owner name on simulated admission confirmations."
              checked={prefs.profileVisible}
              onChange={(v) => set('profileVisible', v)}
            />
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-ivory/50 px-4 py-3.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-forest text-sm font-bold text-ivory">
              {owner.name
                .replace(/\(demo\)/i, '')
                .trim()
                .split(' ')
                .map((w) => w[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-bold text-ink">{owner.name}</p>
              <p className="truncate text-[11.5px] text-ink-mute">{owner.email}</p>
            </div>
          </div>
        </section>

        {/* -------------------------------------------- account information */}
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <h2 className="mb-1 flex items-center gap-2.5 text-base sm:text-lg">
            <ShieldCheck className="h-4.5 w-4.5 text-gold-dark" aria-hidden />
            Account information
          </h2>
          <p className="mb-4 text-[12.5px] text-ink-mute">
            Read-only demo account details — no password or security APIs exist here.
          </p>
          <dl className="space-y-2.5 text-[13px]">
            {[
              ['Owner ID', owner.id],
              ['Email', owner.email],
              ['Mobile', `${owner.mobile} (demo)`],
              ['City', owner.city],
              ['Properties managed', `${properties.length} (Shree Shyam Boys PG, Ashiana PG)`],
              ['Session', 'Frontend demo — resets on reload'],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-ivory/40 px-4 py-3"
              >
                <dt className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">
                  {label}
                </dt>
                <dd className="text-right font-semibold text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-dashed border-gold/60 bg-gold-soft/50 px-4 py-3 text-[12px] leading-relaxed text-gold-dark">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>
              Password changes, two-factor authentication and account deletion are intentionally
              not implemented — they belong to the backend-integrated release.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-soft px-3.5 py-1.5 text-[11.5px] font-bold text-forest">
              <Check className="h-3.5 w-3.5" aria-hidden />
              Demo mode active
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ivory px-3.5 py-1.5 text-[11.5px] font-bold text-ink-soft">
              <Building2 className="h-3.5 w-3.5" aria-hidden />
              {properties.length} properties in this account
            </span>
          </div>
        </section>

        {/* ---------------------------------------------- payment details */}
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6 xl:col-span-2">
          <h2 className="mb-1 flex items-center gap-2.5 text-base sm:text-lg">
            <Wallet className="h-4.5 w-4.5 text-gold-dark" aria-hidden />
            Payment Details
          </h2>
          <p className="mb-4 text-[12.5px] text-ink-mute">
            How students pay you directly (offline). These details appear on every student invoice
            in the “My Bills” screen — RahoMitra never collects rent itself.
          </p>

          <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                id="pay-upi"
                label="UPI ID"
                value={payForm.upiId}
                onChange={(v) => setPayForm((p) => ({ ...p, upiId: v }))}
                placeholder="yourname@okaxis"
                hint="Students see this on their invoice (demo)."
              />
              <FormInput
                id="pay-holder"
                label="Account Holder Name"
                value={payForm.accountHolder}
                onChange={(v) => setPayForm((p) => ({ ...p, accountHolder: v }))}
                placeholder="e.g. Rakesh Sharma (demo)"
              />
              <FormTextarea
                id="pay-instructions"
                label="Payment Instructions"
                rows={3}
                maxLength={400}
                value={payForm.instructions}
                onChange={(v) => setPayForm((p) => ({ ...p, instructions: v }))}
                placeholder="e.g. Pay via UPI or cash at the PG counter…"
                className="sm:col-span-2"
                hint="Shown to students on their invoice below the payment message."
              />
              <div className="sm:col-span-2">
                <Button variant="primary" onClick={savePaymentDetails}>
                  <Save className="h-4 w-4" aria-hidden />
                  Save payment details
                </Button>
              </div>
            </div>

            {/* QR preview */}
            <div className="flex w-full flex-col items-center rounded-2xl border border-line bg-ivory/40 px-5 py-4 lg:w-64">
              <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">
                <QrCode className="h-4 w-4 text-gold-dark" aria-hidden />
                UPI QR (local preview)
              </p>
              {paymentDetails.qrImage ? (
                <div className="relative">
                  <img
                    src={paymentDetails.qrImage}
                    alt="Owner UPI QR preview (demo)"
                    className="h-40 w-40 rounded-xl border border-line bg-white object-contain p-2"
                  />
                  <button
                    type="button"
                    aria-label="Remove QR image"
                    onClick={() => {
                      updatePaymentDetails({ qrImage: '' })
                      pushToast('QR preview removed (demo).', 'info')
                    }}
                    className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-white text-danger shadow-sm transition-colors hover:bg-danger-soft"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              ) : (
                <div className="flex h-40 w-40 flex-col items-center justify-center rounded-xl border border-dashed border-line bg-white text-center text-[11px] leading-snug text-ink-mute">
                  <ImagePlus className="mb-1.5 h-6 w-6" aria-hidden />
                  No QR uploaded yet
                </div>
              )}
              <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full border border-forest/25 px-4 py-2 text-[12px] font-bold text-forest transition-colors hover:bg-forest hover:text-ivory">
                <ImagePlus className="h-3.5 w-3.5" aria-hidden />
                Upload QR
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    handleQrFile(event.target.files?.[0])
                    event.target.value = ''
                  }}
                />
              </label>
              <p className="mt-2 text-center text-[10.5px] text-ink-mute">
                Stored as a local data-URL only — never uploaded (max 5MB).
              </p>
              {qrError && (
                <p role="alert" className="mt-2 text-[11.5px] font-semibold text-danger">
                  {qrError}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-dashed border-gold/60 bg-gold-soft/50 px-4 py-3 text-[12px] leading-relaxed text-gold-dark">
            <Wallet className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>
              Students pay you directly (UPI / cash / bank transfer). You record each receipt
              manually in <strong>Billing &amp; Payments → Record Payment</strong> — RahoMitra does
              not verify or process the transaction.
            </p>
          </div>
        </section>
      </div>
    </>
  )
}
