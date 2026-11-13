import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { PageHeader } from '../components/common/PageHeader'

/**
 * Placeholder legal page — this demo build does not collect or process data.
 */
export function PrivacyPolicy() {
  useDocumentTitle('Privacy Policy')

  return (
    <>
      <PageHeader
        title="Privacy Policy"
        subtitle="Last updated: demo build — this page is a placeholder and will be replaced with the final policy before launch."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Privacy Policy' }]}
      />
      <section className="bg-white py-12 sm:py-16">
        <div className="page-container max-w-3xl space-y-8 text-[15px] leading-relaxed text-ink-soft">
          <div className="rounded-2xl border border-dashed border-gold/50 bg-gold-soft/40 p-5 text-[13px] text-ink-soft">
            <strong className="font-semibold text-ink">Demo notice:</strong> RahoMitra is currently a
            frontend-only demonstration. No form on this website transmits, stores or processes
            personal data on a server.
          </div>

          <div>
            <h2 className="mb-2 text-xl text-ink">1. Information we collect</h2>
            <p>
              On the live product, RahoMitra may collect details you voluntarily provide — such as
              your name, email address, mobile number and property information when you submit a
              contact or owner registration form. On this demo build, entered data stays only in
              your browser and is discarded when you refresh or close the page.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-xl text-ink">2. How information is used</h2>
            <p>
              Collected information would be used to respond to enquiries, review owner
              applications before publishing listings, and improve the platform. We do not sell
              personal information to third parties.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-xl text-ink">3. Listing data</h2>
            <p>
              Property details published on RahoMitra are provided by PG owners and reviewed by our
              Super Admin. On this demo build, all listings are clearly marked as illustrative
              sample data.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-xl text-ink">4. Contact</h2>
            <p>
              For privacy-related questions, reach out through the contact details listed on the
              Contact page. Those details are placeholders on this demo build and will be updated
              before launch.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
