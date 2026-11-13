import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { PageHeader } from '../components/common/PageHeader'

/** Placeholder terms page for the demo build. */
export function Terms() {
  useDocumentTitle('Terms & Conditions')

  return (
    <>
      <PageHeader
        title="Terms & Conditions"
        subtitle="Last updated: demo build — this page is a placeholder and will be replaced with the final terms before launch."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Terms & Conditions' }]}
      />
      <section className="bg-white py-12 sm:py-16">
        <div className="page-container max-w-3xl space-y-8 text-[15px] leading-relaxed text-ink-soft">
          <div className="rounded-2xl border border-dashed border-gold/50 bg-gold-soft/40 p-5 text-[13px] text-ink-soft">
            <strong className="font-semibold text-ink">Demo notice:</strong> this website is a
            frontend demonstration. Listings, prices and availability are illustrative sample data
            and do not constitute an offer to rent.
          </div>

          <div>
            <h2 className="mb-2 text-xl text-ink">1. Platform role</h2>
            <p>
              RahoMitra is a discovery platform that helps students find PG accommodations and
              connect with property owners. RahoMitra is not a party to any rental agreement
              between a student and a PG owner.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-xl text-ink">2. No online booking or payment</h2>
            <p>
              The platform does not process bookings, reservations or payments. Admission, deposits
              and rent are finalised directly between the student and the owner, offline.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-xl text-ink">3. Listing accuracy</h2>
            <p>
              Owners are responsible for the accuracy of their property information. Every listing
              on this demo build is clearly marked as sample data and should not be treated as a
              verified real-world property.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-xl text-ink">4. Owner applications</h2>
            <p>
              Applications submitted through the List Your PG form are reviewed by the RahoMitra
              Super Admin before a property can be published. Approval, modification or removal of
              a listing is at the platform&apos;s discretion.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
