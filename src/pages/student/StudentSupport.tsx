import { useState } from 'react'
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
import { SUPPORT_CONTACTS, STUDENT_FAQS } from '../../data/studentData'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { cn } from '../../utils/cn'

/** /student/support — FAQ + fictional contacts + pointers to future modules. */
export function StudentSupport() {
  useDocumentTitle('Help & Support')

  const [openFaq, setOpenFaq] = useState<string | null>(STUDENT_FAQS[0]?.id ?? null)

  return (
    <>
      <AdminPageHeader
        title="Help & Support"
        description="Frequently asked questions, your PG owner's demo contact details and where the future support modules will live."
      />

      <DemoBanner message="all contact details below are clearly fictional demo placeholders — no real inbox, phone line or support team exists behind this screen." />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* ---------------------------------------------------------- FAQ */}
        <section className="min-w-0 rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <h2 className="mb-1 flex items-center gap-2.5 text-base sm:text-lg">
            <LifeBuoy className="h-4.5 w-4.5 text-gold-dark" aria-hidden />
            Frequently asked questions
          </h2>
          <p className="mb-4 text-[12.5px] text-ink-mute">
            Quick answers for the demo student portal.
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
              PG Owner contact
            </h2>
            <p className="mb-4 text-[12.5px] text-ink-mute">Fictional demo contacts only.</p>
            <ul className="space-y-3 text-[13px]">
              {SUPPORT_CONTACTS.map((contact) => (
                <li
                  key={contact.label}
                  className="flex items-center gap-3 rounded-xl border border-line bg-ivory/40 px-3.5 py-3"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-forest-soft text-forest">
                    {contact.label.includes('email') ? (
                      <Mail className="h-4 w-4" aria-hidden />
                    ) : contact.label === 'RahoMitra support' ? (
                      <LifeBuoy className="h-4 w-4" aria-hidden />
                    ) : (
                      <Phone className="h-4 w-4" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10.5px] font-bold uppercase tracking-wider text-ink-mute">
                      {contact.label}
                    </span>
                    <span className="block truncate font-semibold text-ink">{contact.value}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Support information */}
          <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
            <h2 className="mb-4 flex items-center gap-2.5 text-base sm:text-lg">
              <Clock className="h-4.5 w-4.5 text-gold-dark" aria-hidden />
              Support information
            </h2>
            <ul className="space-y-2.5 text-[13px] text-ink-soft">
              <li className="flex gap-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest" aria-hidden />
                This build is frontend-only — no ticket is ever created or sent anywhere.
              </li>
              <li className="flex gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-forest" aria-hidden />
                Demo response window shown for illustration only: 10 AM–7 PM, Mon–Sat.
              </li>
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-forest" aria-hidden />
                Emails use the non-routable @rahomitra.demo domain — messages can never arrive.
              </li>
            </ul>
          </section>

          {/* Future module links */}
          <section className="rounded-3xl border border-dashed border-gold/60 bg-gold-soft/40 p-5 sm:p-6">
            <h2 className="mb-1 flex items-center gap-2.5 text-base sm:text-lg">
              <Megaphone className="h-4.5 w-4.5 text-gold-dark" aria-hidden />
              Coming in future sections
            </h2>
            <p className="mb-4 text-[12.5px] leading-relaxed text-gold-dark">
              These modules are planned and intentionally not built in Section 05.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3.5">
                <span className="flex min-w-0 items-center gap-3">
                  <MessageSquareWarning className="h-4.5 w-4.5 shrink-0 text-ink-mute" aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-bold text-ink">
                      Communication &amp; Complaints
                    </span>
                    <span className="block text-[11.5px] text-ink-mute">Chat + complaint raise</span>
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-ivory px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                  Section 07
                </span>
              </li>
              <li className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3.5">
                <span className="flex min-w-0 items-center gap-3">
                  <LifeBuoy className="h-4.5 w-4.5 shrink-0 text-ink-mute" aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-bold text-ink">
                      Support ticket desk
                    </span>
                    <span className="block text-[11.5px] text-ink-mute">
                      Full helpdesk workflow
                    </span>
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-ivory px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                  Coming soon
                </span>
              </li>
            </ul>
            <p className="mt-4 text-[11.5px] leading-relaxed text-gold-dark">
              For now, use the demo contacts above — or head back to your{' '}
              <Link
                to="/student/dashboard"
                className="font-bold underline underline-offset-2 hover:text-forest"
              >
                dashboard
              </Link>
              .
            </p>
          </section>
        </aside>
      </div>
    </>
  )
}
