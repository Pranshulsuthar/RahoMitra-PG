import { Phone, MessageCircle, Info } from 'lucide-react'
import type { OwnerContact } from '../../types'

/**
 * Owner contact panel.
 *
 * Call / WhatsApp actions are rendered ONLY when real contact details exist.
 * With demo data (contact === null) a transparent placeholder notice is shown
 * instead — no phone numbers or wa.me links are ever invented.
 */
export function OwnerContactPanel({ contact }: { contact: OwnerContact | null }) {
  const phone = contact?.phone?.trim()
  const whatsapp = contact?.whatsapp?.trim()

  if (!phone && !whatsapp) {
    return (
      <div className="rounded-2xl border border-dashed border-gold/50 bg-gold-soft/40 p-4">
        <p className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-soft">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
          <span>
            <strong className="font-semibold text-ink">Owner contact not published yet.</strong>{' '}
            Verified phone and WhatsApp details will appear here once the PG owner shares them with
            RahoMitra. Until then, please use the enquiry options on the Contact page.
          </span>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {phone && (
        <a
          href={`tel:${phone}`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-forest-light"
        >
          <Phone className="h-4 w-4" aria-hidden />
          Call Owner
        </a>
      )}
      {whatsapp && (
        <a
          href={`https://wa.me/${whatsapp.replace(/[^\d]/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-forest/25 bg-white px-5 py-3 text-sm font-semibold text-forest transition-colors hover:bg-forest hover:text-ivory"
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          WhatsApp Owner
        </a>
      )}
    </div>
  )
}
