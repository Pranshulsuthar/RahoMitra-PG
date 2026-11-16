import { useEffect, useState } from 'react'
import {
  Building2,
  CalendarCheck,
  CheckCircle2,
  ChefHat,
  Clock,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import {
  fetchOwnAdmissionRequests,
  fetchStudentAccommodation,
  type StudentAccommodation,
  type StudentAdmissionRequest,
} from '../../api/student'
import { JoinPGModal } from '../../components/student/JoinPGModal'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { cn } from '../../utils/cn'

const FOOD_LABEL: Record<string, string> = {
  INCLUDED: 'Included in rent',
  PAID: 'Paid separately',
  NOT_AVAILABLE: 'Not available',
}

export function MyAccommodation() {
  useDocumentTitle('My Accommodation')

  const [activeImage, setActiveImage] = useState(0)
  const [liveAccommodation, setLiveAccommodation] = useState<StudentAccommodation | null>(null)
  const [admissionRequests, setAdmissionRequests] = useState<StudentAdmissionRequest[]>([])
  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      setLoading(true)
      const [reqs, acc] = await Promise.allSettled([
        fetchOwnAdmissionRequests(),
        fetchStudentAccommodation(),
      ])
      if (reqs.status === 'fulfilled') setAdmissionRequests(reqs.value)
      if (acc.status === 'fulfilled') setLiveAccommodation(acc.value)
    } catch {
      // Ignored
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const pendingRequest = admissionRequests.find((r) => r.status === 'PENDING')

  const property = liveAccommodation
    ? {
        name: liveAccommodation.property.name,
        type: liveAccommodation.property.type,
        city: liveAccommodation.property.city,
        locality: liveAccommodation.property.locality,
        address: liveAccommodation.property.address,
        food: liveAccommodation.property.food,
        gallery:
          liveAccommodation.property.gallery?.length > 0
            ? liveAccommodation.property.gallery
            : [liveAccommodation.property.coverImage || '/placeholder-room.jpg'],
        facilities: liveAccommodation.property.facilities ?? [],
        rules: liveAccommodation.property.rules ?? [],
        description: `${liveAccommodation.property.name} located in ${liveAccommodation.property.locality}, ${liveAccommodation.property.city}.`,
        contactPhone: liveAccommodation.property.owner?.phone || 'Not provided',
        contactEmail: liveAccommodation.property.owner?.email || 'Not provided',
      }
    : null

  const room = liveAccommodation ? liveAccommodation.room : null
  const bedLabel = liveAccommodation ? liveAccommodation.bed.label : '—'
  const admissionDate = liveAccommodation?.admissionDate
    ? new Date(liveAccommodation.admissionDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—'

  const roommatesList = liveAccommodation
    ? liveAccommodation.roommates.map((m) => `${m.name} (bed ${m.bedLabel})`).join(', ') || 'None yet'
    : '—'

  return (
    <>
      <AdminPageHeader
        title="My Accommodation"
        description="Your current PG and room details."
        actions={
          <button
            type="button"
            onClick={() => setJoinModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory shadow-[0_10px_24px_-14px_rgba(23,61,50,0.9)] transition-all hover:bg-forest-light"
          >
            <KeyRound className="h-4 w-4" aria-hidden />
            Join PG with Code
          </button>
        }
      />

      {pendingRequest && (
        <div className="mb-6 rounded-2xl border border-gold/50 bg-gold-soft/40 p-4">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 text-gold-dark shrink-0" />
            <div>
              <p className="text-sm font-bold text-ink">
                Admission Request Pending Owner Approval
              </p>
              <p className="mt-0.5 text-xs text-ink-mute">
                You applied for <strong className="text-ink">{pendingRequest.propertyName}</strong> ({pendingRequest.propertyLocality}, {pendingRequest.propertyCity}) with code <strong className="font-mono text-ink">{pendingRequest.code}</strong>. The owner will review and assign your bed shortly.
              </p>
            </div>
          </div>
        </div>
      )}

      {!liveAccommodation && !loading && (
        <div className="rounded-3xl border border-dashed border-line bg-white p-12 text-center shadow-card">
          <Building2 className="mx-auto mb-4 h-12 w-12 text-forest" />
          <h2 className="font-display text-xl font-bold text-ink">No PG accommodation enrolled</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft leading-relaxed">
            You are not currently enrolled in any PG accommodation. When your PG owner issues an admission code, enter it below to access your room details.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setJoinModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-ivory shadow-card transition-colors hover:bg-forest-light"
            >
              <KeyRound className="h-4 w-4" />
              Join PG with Admission Code
            </button>
          </div>
        </div>
      )}

      {property && room && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          {/* --------------------------------------------------- main column */}
          <div className="min-w-0 space-y-6">
            {/* Gallery */}
            <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
              <div className="relative aspect-[16/9] w-full bg-ivory">
                <img
                  src={property.gallery[activeImage] || property.gallery[0]}
                  alt={`${property.name} — photo ${activeImage + 1}`}
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.src = '/image-placeholder.svg'
                  }}
                />
              </div>
              {property.gallery.length > 1 && (
                <div className="flex gap-2.5 p-3 overflow-x-auto">
                  {property.gallery.map((image, index) => (
                    <button
                      key={image + index}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      aria-label={`Show photo ${index + 1}`}
                      aria-pressed={index === activeImage}
                      className={cn(
                        'h-14 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all',
                        index === activeImage
                          ? 'border-gold shadow-sm'
                          : 'border-transparent opacity-70 hover:opacity-100',
                      )}
                    >
                      <img src={image} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Property details */}
            <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2.5 text-base sm:text-lg">
                    <Building2 className="h-4.5 w-4.5 text-gold-dark" aria-hidden />
                    {property.name}
                  </h2>
                  <p className="mt-1.5 text-[13px] text-ink-mute">
                    {property.type === 'BOYS' ? 'Boys PG' : property.type === 'GIRLS' ? 'Girls PG' : 'Co-living PG'} · {property.city} ·{' '}
                    {property.locality}
                  </p>
                </div>
                <StatusBadge status="ACTIVE" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-line bg-ivory/40 px-4 py-3.5">
                  <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-wider text-ink-mute">
                    <MapPin className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
                    Address
                  </p>
                  <p className="mt-1.5 text-[13.5px] font-semibold leading-snug text-ink">
                    {property.address}
                  </p>
                </div>
                <div className="rounded-2xl border border-line bg-ivory/40 px-4 py-3.5">
                  <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-wider text-ink-mute">
                    <UserRound className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
                    Owner / Management
                  </p>
                  <p className="mt-1.5 text-[13.5px] font-semibold text-ink">
                    {liveAccommodation?.property.owner.name || 'PG Owner'}
                  </p>
                  <p className="text-[11.5px] text-ink-mute">Manages {property.name}</p>
                </div>
                <div className="rounded-2xl border border-line bg-ivory/40 px-4 py-3.5">
                  <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-wider text-ink-mute">
                    <ChefHat className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
                    Food availability
                  </p>
                  <p className="mt-1.5 text-[13.5px] font-semibold text-ink">
                    {FOOD_LABEL[property.food] ?? property.food}
                  </p>
                  <p className="text-[11.5px] text-ink-mute">Standard daily meals</p>
                </div>
                <div className="rounded-2xl border border-line bg-ivory/40 px-4 py-3.5">
                  <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-wider text-ink-mute">
                    <CalendarCheck className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
                    My allocation
                  </p>
                  <p className="mt-1.5 text-[13.5px] font-semibold text-ink">
                    Room {room.number} · Bed {bedLabel}
                  </p>
                  <p className="text-[11.5px] text-ink-mute">
                    Admitted {admissionDate}
                  </p>
                </div>
              </div>

              {property.description && (
                <p className="mt-4 text-[12.5px] leading-relaxed text-ink-soft">
                  {property.description}
                </p>
              )}
            </section>

            {/* Facilities + rules */}
            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
                <h2 className="mb-4 text-base sm:text-lg">Facilities</h2>
                {property.facilities.length > 0 ? (
                  <ul className="grid gap-2.5 sm:grid-cols-2">
                    {property.facilities.map((facility) => (
                      <li
                        key={facility}
                        className="flex items-center gap-2.5 rounded-xl border border-line bg-ivory/40 px-3.5 py-2.5 text-[13px] font-semibold text-ink"
                      >
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-forest" aria-hidden />
                        {facility}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink-mute">No specific facilities listed.</p>
                )}
              </section>

              <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
                <h2 className="mb-4 text-base sm:text-lg">Property rules</h2>
                {property.rules.length > 0 ? (
                  <ol className="space-y-2.5">
                    {property.rules.map((rule, index) => (
                      <li key={rule} className="flex gap-3 text-[13px] leading-relaxed text-ink-soft">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-soft text-[10px] font-bold text-gold-dark">
                          {index + 1}
                        </span>
                        {rule}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-ink-mute">Standard community rules apply.</p>
                )}
              </section>
            </div>
          </div>

          {/* -------------------------------------------------- side column */}
          <aside className="space-y-5">
            {/* Accommodation details card */}
            <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
              <h2 className="mb-4 text-base sm:text-lg">Accommodation details</h2>
              <dl className="space-y-2.5 text-[13px]">
                {[
                  ['PG name', property.name],
                  ['Room number', room.number],
                  ['Floor', `${room.floor}`],
                  ['Sharing type', `${room.type} sharing`],
                  ['Bed number', bedLabel],
                  ['Monthly rent', `₹${room.rent.toLocaleString('en-IN')}`],
                  ['Membership', 'ACTIVE'],
                  ['Admission date', admissionDate],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-3 rounded-xl border border-line bg-ivory/30 px-3.5 py-2.5"
                  >
                    <dt className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">
                      {label}
                    </dt>
                    <dd className="truncate text-right font-semibold text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* Contact information */}
            <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
              <h2 className="mb-4 text-base sm:text-lg">Contact information</h2>
              <ul className="space-y-3 text-[13px]">
                <li className="flex items-center gap-3 rounded-xl border border-line bg-ivory/40 px-3.5 py-3">
                  <Phone className="h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-[10.5px] font-bold uppercase tracking-wider text-ink-mute">
                      Owner phone
                    </span>
                    <span className="block truncate font-semibold text-ink">
                      {property.contactPhone}
                    </span>
                  </span>
                </li>
                <li className="flex items-center gap-3 rounded-xl border border-line bg-ivory/40 px-3.5 py-3">
                  <Mail className="h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-[10.5px] font-bold uppercase tracking-wider text-ink-mute">
                      Owner email
                    </span>
                    <span className="block truncate font-semibold text-ink">
                      {property.contactEmail}
                    </span>
                  </span>
                </li>
                <li className="flex items-center gap-3 rounded-xl border border-line bg-ivory/40 px-3.5 py-3">
                  <UserRound className="h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-[10.5px] font-bold uppercase tracking-wider text-ink-mute">
                      Roommates
                    </span>
                    <span className="block truncate font-semibold text-ink">
                      {roommatesList}
                    </span>
                  </span>
                </li>
              </ul>
            </section>
          </aside>
        </div>
      )}

      <JoinPGModal
        open={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onSuccess={() => loadData()}
      />
    </>
  )
}
