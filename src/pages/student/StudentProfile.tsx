import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { GraduationCap, Mail, MapPin, Phone, Save, UserRound, X } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useStudentStore } from '../../context/StudentStore'
import { fetchStudentAccommodation, type StudentAccommodation } from '../../api/student'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { StatisticCard } from '../../components/owner/StatisticCard'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { FormInput } from '../../components/owner/FormInput'
import { Button } from '../../components/common/Button'

/** /student/profile — profile editing with save/cancel + toast. */
export function StudentProfile() {
  useDocumentTitle('My Profile')

  const { profile, updateProfile, pushToast } = useStudentStore()

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...profile })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [liveAccommodation, setLiveAccommodation] = useState<StudentAccommodation | null>(null)

  useEffect(() => {
    setForm({ ...profile })
  }, [profile])

  useEffect(() => {
    fetchStudentAccommodation()
      .then((acc) => setLiveAccommodation(acc))
      .catch(() => setLiveAccommodation(null))
  }, [])

  const initials = (profile.name || 'Student')
    .trim()
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const validate = () => {
    const next: Record<string, string> = {}
    if (!form.name.trim()) next.name = 'Full name is required.'
    if (!form.email.trim()) next.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email.'
    if (!form.mobile.trim()) next.mobile = 'Mobile number is required.'
    else if (form.mobile.replace(/[\s-]/g, '').length < 10)
      next.mobile = 'Enter a valid 10-digit mobile number.'
    if (!form.college.trim()) next.college = 'College / institution is required.'
    if (!form.city.trim()) next.city = 'City is required.'
    if (!form.emergencyContact.trim()) next.emergencyContact = 'Emergency contact is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const startEdit = () => {
    setForm({ ...profile })
    setErrors({})
    setEditing(true)
  }

  const cancelEdit = () => {
    setForm({ ...profile })
    setErrors({})
    setEditing(false)
    pushToast('Changes discarded.', 'info')
  }

  const save = (event?: FormEvent) => {
    event?.preventDefault()
    if (!validate()) return
    updateProfile(form)
    setEditing(false)
    pushToast('Profile updated successfully.', 'success')
  }

  return (
    <>
      <AdminPageHeader
        title="My Profile"
        description="Your student account details and contact information."
        actions={
          editing ? (
            <>
              <Button variant="outline" onClick={cancelEdit}>
                <X className="h-4 w-4" aria-hidden />
                Cancel Changes
              </Button>
              <Button variant="primary" onClick={() => save()}>
                <Save className="h-4 w-4" aria-hidden />
                Save Changes
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={startEdit}>
              <UserRound className="h-4 w-4" aria-hidden />
              Edit Profile
            </Button>
          )
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatisticCard
          label="Membership"
          value={liveAccommodation ? 'ACTIVE' : 'NOT ENROLLED'}
          icon={GraduationCap}
          tone="forest"
          hint={liveAccommodation ? `Since ${liveAccommodation.admissionDate}` : 'No active admission'}
        />
        <StatisticCard
          label="Current PG"
          value={liveAccommodation ? liveAccommodation.property.name : 'None'}
          icon={UserRound}
          tone="ink"
          hint={liveAccommodation ? `${liveAccommodation.property.locality}, ${liveAccommodation.property.city}` : 'Join a PG to get started'}
        />
        <StatisticCard
          label="Room · Bed"
          value={liveAccommodation ? `${liveAccommodation.room.roomNumber} · Bed ${liveAccommodation.bed.bedNumber}` : 'Unassigned'}
          icon={UserRound}
          tone="gold"
          hint={liveAccommodation ? `Floor ${liveAccommodation.room.floor}` : 'Pending admission'}
        />
        <StatisticCard label="Account" value="Student" icon={UserRound} tone="ink" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        {/* Identity card */}
        <aside className="h-fit rounded-3xl border border-line bg-white p-6 shadow-card">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-forest text-3xl font-bold text-ivory ring-4 ring-gold/40">
              {initials}
            </span>
            <h2 className="mt-4 text-xl text-ink">{profile.name}</h2>
            <p className="mt-1 text-[13px] text-ink-mute">{profile.email}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <StatusBadge status={liveAccommodation ? 'ACTIVE' : 'INACTIVE'} />
              <span className="rounded-full bg-forest-soft px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-forest">
                Student
              </span>
            </div>
          </div>

          <dl className="mt-6 space-y-3 text-[13px]">
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-ivory/40 px-4 py-3">
              <Phone className="h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
              <div className="min-w-0">
                <dt className="text-[10.5px] font-bold uppercase tracking-wider text-ink-mute">
                  Mobile
                </dt>
                <dd className="truncate font-semibold text-ink">{profile.mobile || 'Not provided'}</dd>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-ivory/40 px-4 py-3">
              <GraduationCap className="h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
              <div className="min-w-0">
                <dt className="text-[10.5px] font-bold uppercase tracking-wider text-ink-mute">
                  College
                </dt>
                <dd className="truncate font-semibold text-ink">{profile.college || 'Not provided'}</dd>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-ivory/40 px-4 py-3">
              <MapPin className="h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
              <div className="min-w-0">
                <dt className="text-[10.5px] font-bold uppercase tracking-wider text-ink-mute">
                  City
                </dt>
                <dd className="truncate font-semibold text-ink">{profile.city || 'Not provided'}</dd>
              </div>
            </div>
          </dl>

          <p className="mt-5 text-[11.5px] leading-relaxed text-ink-mute">
            Avatar is generated automatically from your initials.
          </p>
        </aside>

        {/* Edit form */}
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base sm:text-lg">{editing ? 'Edit profile' : 'Profile details'}</h2>
          </div>

          <form onSubmit={save} noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                id="student-name"
                label="Full Name"
                required
                disabled={!editing}
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                error={errors.name}
                className="sm:col-span-2"
              />
              <FormInput
                id="student-email"
                label="Email"
                required
                type="email"
                disabled={!editing}
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                error={errors.email}
              />
              <FormInput
                id="student-mobile"
                label="Mobile Number"
                required
                disabled={!editing}
                value={form.mobile}
                onChange={(v) => setForm({ ...form, mobile: v })}
                error={errors.mobile}
                hint="10-digit mobile number."
              />
              <FormInput
                id="student-college"
                label="College / Institution"
                required
                disabled={!editing}
                value={form.college}
                onChange={(v) => setForm({ ...form, college: v })}
                error={errors.college}
              />
              <FormInput
                id="student-city"
                label="City"
                required
                disabled={!editing}
                value={form.city}
                onChange={(v) => setForm({ ...form, city: v })}
                error={errors.city}
              />
              <FormInput
                id="student-emergency"
                label="Emergency Contact"
                required
                disabled={!editing}
                value={form.emergencyContact}
                onChange={(v) => setForm({ ...form, emergencyContact: v })}
                error={errors.emergencyContact}
                hint="Name and relationship of contact person."
                className="sm:col-span-2"
              />
            </div>

            {editing && (
              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <Button variant="outline" onClick={cancelEdit}>
                  <X className="h-4 w-4" aria-hidden />
                  Cancel Changes
                </Button>
                <Button variant="primary" type="submit">
                  <Save className="h-4 w-4" aria-hidden />
                  Save Changes
                </Button>
              </div>
            )}
          </form>

          <p className="mt-4 flex items-start gap-2 text-[11.5px] leading-relaxed text-ink-mute">
            <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-dark" aria-hidden />
            Contact information is shared with your PG management for emergency contact and official notifications.
          </p>
        </section>
      </div>
    </>
  )
}
