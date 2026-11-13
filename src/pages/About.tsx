import { Link } from 'react-router-dom'
import {
  Compass,
  Target,
  Eye,
  Users,
  Building2,
  ArrowRight,
  HeartHandshake,
  BadgeCheck,
  Layers,
} from 'lucide-react'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { PageHeader } from '../components/common/PageHeader'
import { SectionHeading } from '../components/common/SectionHeading'
import { ButtonLink } from '../components/common/Button'

const VALUES = [
  {
    icon: BadgeCheck,
    title: 'Transparency first',
    text: 'Rent, deposit, rules and facilities are shown upfront so students never walk into hidden surprises.',
  },
  {
    icon: HeartHandshake,
    title: 'Direct connections',
    text: 'Students speak with owners directly. No brokerage chain and no relayed messages in between.',
  },
  {
    icon: Layers,
    title: 'One platform, many properties',
    text: 'Independent PG owners manage multiple listings from the same place, keeping information consistent.',
  },
]

export function About() {
  useDocumentTitle('About Us')

  return (
    <>
      <PageHeader
        title="About RahoMitra"
        subtitle="Aapke Rehne Ka Digital Saathi — a platform built to make finding, comparing and choosing a PG simple, honest and stress-free."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'About Us' }]}
      />

      {/* What is RahoMitra */}
      <section className="bg-white py-16 sm:py-20">
        <div className="page-container grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-gold-dark">
              Who we are
            </span>
            <h2 className="mt-3 text-[1.75rem] leading-tight sm:text-3xl">
              What is RahoMitra?
            </h2>
            <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-ink-soft">
              <p>
                RahoMitra is a centralized PG discovery and management platform. Students use it to
                find accommodations, explore facilities, compare rental options and contact PG owners
                directly — all in one place.
              </p>
              <p>
                Multiple independent PG owners manage their properties through the same platform, so
                listings stay structured, comparable and easy to browse. Think of RahoMitra as the
                mutual friend you rely on when moving to a new city.
              </p>
              <p className="rounded-xl border border-dashed border-line bg-ivory/70 px-4 py-3 text-[13px] text-ink-soft">
                <strong className="font-semibold text-ink">Note:</strong> this website is currently a
                frontend demo. Listings, prices and availability shown are illustrative sample data.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="rounded-2xl border border-line bg-ivory/60 p-6 transition-colors hover:bg-ivory"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-forest text-gold">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="text-base leading-snug">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-ivory py-16 sm:py-20">
        <div className="page-container">
          <SectionHeading
            eyebrow="Our mission"
            title="Make finding a PG as simple as asking a friend"
            description="Searching for accommodation should not mean endless phone calls, unreliable classifieds and uncertain information. Our mission is to bring every detail a student needs onto one trustworthy platform — and to give owners an honest way to showcase what they offer."
          />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
              <div className="flex items-center gap-3 bg-forest px-6 py-4">
                <Users className="h-5 w-5 text-gold" aria-hidden />
                <h3 className="text-lg text-ivory">How it helps students</h3>
              </div>
              <ul className="space-y-3.5 p-6">
                {[
                  'Discover PGs across cities and localities from a single search.',
                  'Compare rent, sharing options and facilities side by side before deciding.',
                  'Read rules, deposits and food availability upfront — no hidden clauses.',
                  'Contact property owners directly and visit in person before committing.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-ink-soft">
                    <Compass className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
              <div className="flex items-center gap-3 bg-forest px-6 py-4">
                <Building2 className="h-5 w-5 text-gold" aria-hidden />
                <h3 className="text-lg text-ivory">How it helps PG owners</h3>
              </div>
              <ul className="space-y-3.5 p-6">
                {[
                  'Bring your property online without needing technical skills.',
                  'Present facilities, room types and pricing in a clean, structured format.',
                  'Reach students who are actively searching for accommodation.',
                  'Receive enquiries directly — every application is reviewed before publishing.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-ink-soft">
                    <Target className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="bg-forest py-16 sm:py-20">
        <div className="page-container max-w-4xl text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-forest-dark">
            <Eye className="h-6 w-6" aria-hidden />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-gold">
            Our vision
          </span>
          <h2 className="mt-3 text-[1.75rem] leading-tight text-ivory sm:text-3xl">
            The most trusted name in student accommodation discovery
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-ivory/75">
            We envision a platform where every student can move to a new city with confidence —
            knowing the place they choose is exactly as described — and where every honest PG owner
            has a fair, affordable way to be discovered.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <ButtonLink to="/explore" variant="gold" size="lg">
              Explore demo PGs
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
            <Link
              to="/signup/owner"
              className="inline-flex items-center gap-2 rounded-full border border-ivory/30 px-7 py-3.5 text-sm font-semibold text-ivory transition-colors hover:bg-ivory hover:text-forest"
            >
              <Building2 className="h-4 w-4" aria-hidden />
              List your PG
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
