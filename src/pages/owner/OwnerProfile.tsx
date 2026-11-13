import { useEffect, useState } from 'react'
import { Building2, Mail, MapPin, Phone, Save, UserRound } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useOwnerStore } from '../../context/OwnerStore'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { StatisticCard } from '../../components/owner/StatisticCard'
import { FormInput, FormTextarea } from '../../components/owner/FormInput'
import { Button } from '../../components/common/Button'

/** /owner/profile — owner profile editing in local demo state. */
export function OwnerProfile() {
  useDocumentTitle('Owner Profile')

  const { owner, properties, rooms, students, updateProfile } = useOwnerStore()

  const [form, setForm] = useState({ ...owner })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    setForm({ ...owner })
  }, [owner])

  const initials = owner.name
    .replace(/\(demo\)/i, '')
    .trim()
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const validate = () => {
    const next: Record<string, string> = {}
    if (!form.name.trim()) next.name = 'Owner name is required.'
    if (!form.email.trim()) next.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email.'
    if (!form.mobile.trim()) next.mobile = 'Mobile number is required.'
    if (!form.city.trim()) next.city = 'City is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const save = () => {
    if (!validate()) return
    updateProfile(form)
  }

  const activeStudents = students.filter((s) => s.membership === 'ACTIVE').length

  return (
    <>
      <AdminPageHeader
        title="Owner Profile"
        description="Your demo account details — every change stays in local React state for this session."
        actions={
          <Button variant="primary" onClick={save}>
            <Save className="h-4 w-4" aria-hidden />
            Save profile
          </Button>
        }
      />

      <DemoBanner message="this is a fictional demo owner profile — no real identity, contact detail or account exists behind it." />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatisticCard label="Properties" value={properties.length} icon={Building2} tone="forest" />
        <StatisticCard label="Rooms" value={rooms.length} icon={Building2} tone="ink" />
        <StatisticCard label="Active Students" value={activeStudents} icon={UserRound} tone="gold" />
        <StatisticCard label="Account" value="Demo" icon={UserRound} tone="ink" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        {/* Identity card */}
        <aside className="h-fit rounded-3xl border border-line bg-white p-6 shadow-card">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-forest text-3xl font-bold text-ivory ring-4 ring-gold/40">
              {initials}
            </span>
            <h2 className="mt-4 text-xl text-ink">{owner.name}</h2>
            <p className="mt-1 text-[13px] text-ink-mute">{owner.email}</p>
            <span className="mt-3 rounded-full bg-gold-soft px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gold-dark">
              Demo owner account
            </span>
          </div>

          <dl className="mt-6 space-y-3 text-[13px]">
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-ivory/40 px-4 py-3">
              <Phone className="h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
              <div className="min-w-0">
                <dt className="text-[10.5px] font-bold uppercase tracking-wider text-ink-mute">Mobile</dt>
                <dd className="truncate font-semibold text-ink">{owner.mobile} (demo)</dd>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-ivory/40 px-4 py-3">
              <MapPin className="h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
              <div className="min-w-0">
                <dt className="text-[10.5px] font-bold uppercase tracking-wider text-ink-mute">City</dt>
                <dd className="truncate font-semibold text-ink">{owner.city}</dd>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-ivory/40 px-4 py-3">
              <Mail className="h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
              <div className="min-w-0">
                <dt className="text-[10.5px] font-bold uppercase tracking-wider text-ink-mute">Email</dt>
                <dd className="truncate font-semibold text-ink">{owner.email}</dd>
              </div>
            </div>
          </dl>

          <p className="mt-5 text-[11.5px] leading-relaxed text-ink-mute">
            Profile image is rendered from your initials — image uploads are not part of this
            frontend-only demo.
          </p>
        </aside>

        {/* Edit form */}
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <h2 className="mb-4 text-base sm:text-lg">Edit profile</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              id="profile-name"
              label="Owner Name"
              required
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              error={errors.name}
              className="sm:col-span-2"
            />
            <FormInput
              id="profile-email"
              label="Email"
              required
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              error={errors.email}
              hint="Demo domain: @rahomitra.demo"
            />
            <FormInput
              id="profile-mobile"
              label="Mobile Number"
              required
              value={form.mobile}
              onChange={(v) => setForm({ ...form, mobile: v })}
              error={errors.mobile}
              hint="Fictional demo number."
            />
            <FormInput
              id="profile-city"
              label="City"
              required
              value={form.city}
              onChange={(v) => setForm({ ...form, city: v })}
              error={errors.city}
            />
            <FormTextarea
              id="profile-bio"
              label="Bio"
              rows={4}
              maxLength={300}
              value={form.bio}
              onChange={(v) => setForm({ ...form, bio: v })}
              className="sm:col-span-2"
            />
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setForm({ ...owner })
                setErrors({})
              }}
            >
              Reset
            </Button>
            <Button variant="primary" onClick={save}>
              <Save className="h-4 w-4" aria-hidden />
              Save profile
            </Button>
          </div>

          <p className="mt-4 text-[11.5px] leading-relaxed text-ink-mute">
            No password or security settings are changed here — real account security arrives with
            backend integration in a later section.
          </p>
        </section>
      </div>
    </>
  )
}
