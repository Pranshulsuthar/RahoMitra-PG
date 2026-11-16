import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronDown,
  Clock,
  LifeBuoy,
  Mail,
  Megaphone,
  MessageSquareWarning,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { fetchStudentAccommodation, type StudentAccommodation } from '../../api/student'
import { CONTACT_DETAILS, STUDENT_FAQS } from '../../utils/constants'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { cn } from '../../utils/cn'

/** /student/support — FAQ + owner and platform contact info. */
export function StudentSupport() {
  useDocumentTitle('Help & Support')

  const [openFaq, setOpenFaq] = useState<string | null>(STUDENT_FAQS[0]?.id ?? null)
  const [liveAccommodation, setLiveAccommodation] = useState<StudentAccommodation | null>(null)

  useEffect(() => {
    fetchStudentAccommodation()
      .then((acc) => setLiveAccommodation(acc))
      .catch(() => setLiveAccommodation(null))
  }, [])

  return (
    <>
      <AdminPageHeader
        title="Help & Support"
        description="Frequently asked questions, owner contact information, and platform support channels."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* ---------------------------------------------------------- FAQ */}
        <section className="min-w-0 rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <h2 className="mb-1 flex items-center gap-2.5 text-base sm:text-lg">
            <LifeBuoy className="h-4.5 w-4.5 text-gold-dark" aria-hidden />
            Frequently asked questions
          </h2>
          <p className="mb-4 text-[12.5px] text-ink-mute">
            Common questions about your PG stay, rent, and facilities.
          </p>

          <ul className="space-y-3">
            {STUDENT_FAQS.map((faq) => {
              const open = openFaq === faq.id
              return (
                <li
                  key={faq.id}
                  className={cn(
                    'overflow-hidden rounded-2xl border transition-colors',
                    open ? 'border-gold/50 bg-gold-soft/30' : 'border-line bg-ivory/30',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : faq.id)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                  >
                    <span className="text-[14px] font-bold text-ink">{faq.question}</span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 shrink-0 text-ink-mute transition-transform duration-200',
                        open && 'rotate-180 text-gold-dark',
                      )}
                      aria-hidden
                    />
                  </button>
                  {open && (
                    <p className="fade-scale-in px-4 pb-4 text-[13.5px] leading-relaxed text-ink-soft">
                      {faq.answer}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        </section>

        {/* ------------------------------------------------ side column */}
        <aside className="space-y-5">
          {/* PG owner contact */}
          <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
            <h2 className="mb-1 flex items-center gap-2.5 text-base sm:text-lg">
              <UserRound className="h-4.5 w-4.5 text-gold-dark" aria-hidden />
              {liveAccommodation ? `${liveAccommodation.property.name} Contact` : 'PG Contact'}
            </h2>
            <p className="mb-4 text-[12.5px] text-ink-mute">
              {liveAccommodation ? 'Direct contact details for your accommodation' : 'Not currently enrolled in a PG'}
            </p>
            <ul className="space-y-3 text-[13px]">
              <li className="flex items-center gap-3 rounded-xl border border-line bg-ivory/40 px-3.5 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-forest-soft text-forest">
                  <Phone className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10.5px] font-bold uppercase tracking-wider text-ink-mute">
                    Owner Phone
                  </span>
                  <span className="block truncate font-semibold text-ink">
                    {liveAccommodation?.property.contactPhone || 'Contact manager via Messages'}
                  </span>
                </span>
              </li>
              <li className="flex items-center gap-3 rounded-xl border border-line bg-ivory/40 px-3.5 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-forest-soft text-forest">
                  <Mail className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10.5px] font-bold uppercase tracking-wider text-ink-mute">
                    Owner Email / In-App
                  </span>
                  <span className="block truncate font-semibold text-ink">
                    {liveAccommodation?.property.contactEmail || 'Available via Messages tab'}
                  </span>
                </span>
              </li>
            </ul>
          </section>

          {/* Support information */}
          <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
            <h2 className="mb-4 flex items-center gap-2.5 text-base sm:text-lg">
              <Clock className="h-4.5 w-4.5 text-gold-dark" aria-hidden />
              RahoMitra Helpdesk
            </h2>
            <ul className="space-y-2.5 text-[13px] text-ink-soft">
              <li className="flex gap-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest" aria-hidden />
                Email: {CONTACT_DETAILS.email}
              </li>
              <li className="flex gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-forest" aria-hidden />
                Support hours: 10:00 AM – 7:00 PM, Monday to Saturday.
              </li>
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-forest" aria-hidden />
                Phone: {CONTACT_DETAILS.phone}
              </li>
            </ul>
          </section>

          {/* Direct Actions */}
          <section className="rounded-3xl border border-dashed border-gold/60 bg-gold-soft/40 p-5 sm:p-6">
            <h2 className="mb-1 flex items-center gap-2.5 text-base sm:text-lg">
              <Megaphone className="h-4.5 w-4.5 text-gold-dark" aria-hidden />
              Quick Resolution
            </h2>
            <p className="mb-4 text-[12.5px] leading-relaxed text-gold-dark">
              Reach your PG owner or submit a maintenance issue directly.
            </p>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/student/complaints"
                  className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3.5 hover:border-gold transition-colors"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <MessageSquareWarning className="h-4.5 w-4.5 shrink-0 text-forest" aria-hidden />
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-bold text-ink">
                        Submit a Complaint
                      </span>
                      <span className="block text-[11.5px] text-ink-mute">Maintenance, Wi-Fi, food issues</span>
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-forest-soft px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-forest">
                    Open
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/student/messages"
                  className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3.5 hover:border-gold transition-colors"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <LifeBuoy className="h-4.5 w-4.5 shrink-0 text-forest" aria-hidden />
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-bold text-ink">
                        Chat with Owner
                      </span>
                      <span className="block text-[11.5px] text-ink-mute">Direct 1:1 conversation</span>
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-forest-soft px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-forest">
                    Chat
                  </span>
                </Link>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </>
  )
}
