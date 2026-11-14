import { useState } from 'react'
import {
  Building2,
  CalendarCheck,
  CheckCircle2,
  ChefHat,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import {
  ROOMMATES,
  STUDENT_ADMISSION,
  STUDENT_PROPERTY,
  STUDENT_ROOM,
} from '../../data/studentData'
import { roomOccupancy } from '../../types/owner'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { cn } from '../../utils/cn'

const FOOD_LABEL: Record<string, string> = {
  INCLUDED: 'Included in rent',
  PAID: 'Paid separately',
  NOT_AVAILABLE: 'Not available',
}

/** /student/accommodation — the demo student's current PG details (read-only). */
export function MyAccommodation() {
  useDocumentTitle('My Accommodation')

  const [activeImage, setActiveImage] = useState(0)
  const occupancy = roomOccupancy(STUDENT_ROOM)
  const property = STUDENT_PROPERTY

  return (
    <>
      <AdminPageHeader
        title="My Accommodation"
        description="Your current PG details — a read-only demo record. Booking and contract actions are not part of this frontend-only build."
      />

      <DemoBanner message="this is an illustrative demo allocation in Shree Shyam Boys PG — address, contacts and gallery are fictional sample records." />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* --------------------------------------------------- main column */}
        <div className="min-w-0 space-y-6">
          {/* Gallery */}
          <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
            <div className="relative aspect-[16/9] w-full bg-ivory">
              <img
                src={property.gallery[activeImage]}
                alt={`${property.name} — photo ${activeImage + 1} (demo image)`}
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.src = '/image-placeholder.svg'
                }}
              />
              <span className="absolute left-4 top-4 rounded-full bg-ink/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                Demo gallery
              </span>
            </div>
            <div className="flex gap-2.5 p-3">
              {property.gallery.map((image, index) => (
                <button
                  key={image}
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
                  {property.type === 'BOYS' ? 'Boys PG' : 'Girls PG'} · {property.city} ·{' '}
                  {property.locality}
                </p>
              </div>
              <StatusBadge status={STUDENT_ADMISSION.membership} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-line bg-ivory/40 px-4 py-3.5">
                <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-wider text-ink-mute">
                  <MapPin className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
                  Address (illustrative demo)
                </p>
                <p className="mt-1.5 text-[13.5px] font-semibold leading-snug text-ink">
                  {property.address}
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-ivory/40 px-4 py-3.5">
                <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-wider text-ink-mute">
                  <UserRound className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
                  Owner name
                </p>
                <p className="mt-1.5 text-[13.5px] font-semibold text-ink">Demo Owner</p>
                <p className="text-[11.5px] text-ink-mute">Manages {property.name} (demo)</p>
              </div>
              <div className="rounded-2xl border border-line bg-ivory/40 px-4 py-3.5">
                <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-wider text-ink-mute">
                  <ChefHat className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
                  Food availability
                </p>
                <p className="mt-1.5 text-[13.5px] font-semibold text-ink">
                  {FOOD_LABEL[property.food] ?? property.food}
                </p>
                <p className="text-[11.5px] text-ink-mute">Mess timings 8 AM · 1 PM · 8 PM (demo)</p>
              </div>
              <div className="rounded-2xl border border-line bg-ivory/40 px-4 py-3.5">
                <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-wider text-ink-mute">
                  <CalendarCheck className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
                  My allocation
                </p>
                <p className="mt-1.5 text-[13.5px] font-semibold text-ink">
                  Room {STUDENT_ROOM.number} · Bed {STUDENT_ADMISSION.bedLabel}
                </p>
                <p className="text-[11.5px] text-ink-mute">
                  Admitted {STUDENT_ADMISSION.admissionDate} (demo)
                </p>
              </div>
            </div>

            <p className="mt-4 text-[12.5px] leading-relaxed text-ink-soft">
              {property.description}
            </p>
          </section>

          {/* Facilities + rules */}
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
              <h2 className="mb-4 text-base sm:text-lg">Facilities</h2>
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
            </section>

            <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
              <h2 className="mb-4 text-base sm:text-lg">Property rules</h2>
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
                ['Room number', STUDENT_ROOM.number],
                ['Floor', `${STUDENT_ROOM.floor}`],
                ['Sharing type', `${STUDENT_ROOM.type} sharing`],
                ['Bed number', STUDENT_ADMISSION.bedLabel],
                ['Monthly rent', `₹${STUDENT_ADMISSION.monthlyRent.toLocaleString('en-IN')}`],
                ['Security deposit', `₹${STUDENT_ADMISSION.securityDeposit.toLocaleString('en-IN')}`],
                ['Membership', STUDENT_ADMISSION.membership],
                ['Admission date', STUDENT_ADMISSION.admissionDate],
                ['Occupancy', `${occupancy.occupied}/${occupancy.capacity} beds`],
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
            <p className="mt-4 flex items-start gap-2 text-[11.5px] leading-relaxed text-ink-mute">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-dark" aria-hidden />
              Read-only demo card — allocation changes are handled by the PG owner in Section 04.
            </p>
          </section>

          {/* Contact information */}
          <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
            <h2 className="mb-4 text-base sm:text-lg">Contact information</h2>
            <ul className="space-y-3 text-[13px]">
              <li className="flex items-center gap-3 rounded-xl border border-line bg-ivory/40 px-3.5 py-3">
                <Phone className="h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-[10.5px] font-bold uppercase tracking-wider text-ink-mute">
                    PG phone (fictional)
                  </span>
                  <span className="block truncate font-semibold text-ink">
                    {property.contactPhone} (demo)
                  </span>
                </span>
              </li>
              <li className="flex items-center gap-3 rounded-xl border border-line bg-ivory/40 px-3.5 py-3">
                <Mail className="h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-[10.5px] font-bold uppercase tracking-wider text-ink-mute">
                    PG email (fictional)
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
                    Roommates (demo)
                  </span>
                  <span className="block truncate font-semibold text-ink">
                    {ROOMMATES.map((m) => `${m.name} (bed ${m.bedLabel})`).join(', ') || '—'}
                  </span>
                </span>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </>
  )
}
