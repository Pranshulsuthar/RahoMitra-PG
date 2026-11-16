import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  MapPin,
  LayoutGrid,
  GitCompareArrows,
  PhoneCall,
  ShieldCheck,
  ArrowRight,
  Building2,
  KeyRound,
  Home as HomeIcon,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { HERO_IMAGE } from '../utils/constants'
import { fetchLocalities, fetchPGs } from '../api/pg'
import type { LocalityOption, PG } from '../types'
import { BUDGET_OPTIONS, LOCALITY_OPTIONS } from '../utils/constants'
import { IntroSplash, isIntroPlayed } from '../components/common/IntroSplash'
import { PGCard } from '../components/pg/PGCard'
import { SectionHeading } from '../components/common/SectionHeading'
import { ButtonLink } from '../components/common/Button'
import { ImageWithFallback } from '../components/common/ImageWithFallback'

const WHY_RAHOMITRA = [
  {
    icon: LayoutGrid,
    title: 'Explore multiple PGs',
    text: 'Browse a wide range of accommodations in one place instead of hopping between classifieds and word-of-mouth leads.',
  },
  {
    icon: GitCompareArrows,
    title: 'Compare facilities & rent',
    text: 'See rent, sharing options and amenities side by side so you can shortlist what genuinely fits your budget.',
  },
  {
    icon: PhoneCall,
    title: 'Connect directly with owners',
    text: 'Talk to the property owner yourself — no brokerage chain, no relayed messages, no middlemen.',
  },
  {
    icon: ShieldCheck,
    title: 'Transparent information',
    text: 'Rules, deposits, food availability and room types are displayed upfront, so there are no surprises on move-in day.',
  },
]

const STEPS = [
  {
    icon: Search,
    title: 'Explore PGs',
    text: 'Search by city, locality, PG type and budget.',
  },
  {
    icon: GitCompareArrows,
    title: 'Compare options',
    text: 'Shortlist by facilities, sharing type and rent.',
  },
  {
    icon: PhoneCall,
    title: 'Contact the owner',
    text: 'Reach out directly using the listed contact details.',
  },
  {
    icon: KeyRound,
    title: 'Visit & finalise offline',
    text: 'Tour the property and complete admission with the owner.',
  },
]

const POPULAR_LOCALITIES = ['Malviya Nagar', 'Vaishali Nagar', 'Mansarovar']

export function Home() {
  useDocumentTitle('')
  const navigate = useNavigate()

  // Content reveals in sync with the logo-zoom intro (first load only).
  const introActive = !isIntroPlayed()
  const reveal = (delayMs: number) =>
    introActive ? { style: { animationDelay: `${delayMs}ms` } } : undefined

  const [locality, setLocality] = useState('')
  const [type, setType] = useState('All')
  const [budgetIndex, setBudgetIndex] = useState('0')
  const [localities, setLocalities] = useState<LocalityOption[]>(LOCALITY_OPTIONS)
  const [featuredListings, setFeaturedListings] = useState<PG[]>([])
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(false)

  useEffect(() => {
    // Fetch live localities for hero search autocomplete
    fetchLocalities()
      .then((locs) => {
        if (locs && locs.length > 0) {
          setLocalities(locs)
        }
      })
      .catch(() => {})

    // Fetch live approved & active properties
    setIsLoadingFeatured(true)
    fetchPGs({ limit: 4 })
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setFeaturedListings(res.data)
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoadingFeatured(false)
      })
  }, [])

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (locality.trim()) params.set('locality', locality.trim())
    if (type !== 'All') params.set('type', type)
    if (budgetIndex !== '0') params.set('budget', budgetIndex)
    navigate(`/explore${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const quickSearch = (place: string) => {
    navigate(`/explore?locality=${encodeURIComponent(place)}`)
  }

  return (
    <>
      {/* ---------------------------------------------------------- HERO */}
      <section className="relative isolate overflow-hidden bg-forest">
        <IntroSplash />
        <ImageWithFallback
          src={HERO_IMAGE}
          alt="Premium accommodation"
          loading="eager"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Lighter green wash — the photograph stays visible behind it */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-forest/95 via-forest/75 to-forest/30"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-forest-dark/70 via-transparent to-forest-dark/25"
          aria-hidden
        />

        <div className="page-container relative py-16 sm:py-24 lg:py-28">
          <div className="max-w-3xl">
            <span
              {...reveal(1150)}
              className="reveal inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/15 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-gold backdrop-blur-sm"
            >
              <HomeIcon className="h-3.5 w-3.5" aria-hidden />
              PG Discovery Platform
            </span>

            <h1
              {...reveal(1250)}
              className="reveal mt-6 text-[2.4rem] leading-[1.08] text-ivory drop-shadow-[0_2px_18px_rgba(15,43,35,0.45)] sm:text-6xl"
            >
              Find a Place That{' '}
              <span className="font-normal italic text-gold">Feels Like Home.</span>
            </h1>

            <p
              {...reveal(1400)}
              className="reveal mt-6 max-w-xl text-[15px] leading-relaxed text-ivory/85 sm:text-base"
            >
              Discover trusted PG accommodations, explore real facilities, compare rentals and
              connect directly with owners — everything you need to choose your next stay with
              confidence.
            </p>
          </div>

          {/* ---------------------------------------------------- SEARCH */}
          <form
            onSubmit={handleSearch}
            aria-label="Search PGs"
            {...reveal(1550)}
            className="reveal mt-12 max-w-5xl rounded-[28px] bg-white p-3 shadow-[0_40px_90px_-45px_rgba(15,43,35,0.95)] sm:p-4"
          >
            <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_auto]">
              <div>
                <label
                  htmlFor="hero-locality"
                  className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-gold-dark"
                >
                  City / Locality
                </label>
                <div className="relative">
                  <MapPin
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gold-dark"
                    aria-hidden
                  />
                  <input
                    id="hero-locality"
                    type="text"
                    list="locality-options"
                    value={locality}
                    onChange={(event) => setLocality(event.target.value)}
                    placeholder="e.g. Malviya Nagar, Jaipur"
                    className="form-input bg-ivory/70 pl-10"
                  />
                  <datalist id="locality-options">
                    {localities.map((option) => (
                      <option
                        key={`${option.city}-${option.locality}`}
                        value={`${option.locality}, ${option.city}`}
                      />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label
                  htmlFor="hero-type"
                  className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-gold-dark"
                >
                  PG Type
                </label>
                <select
                  id="hero-type"
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  className="form-input bg-ivory/70"
                >
                  <option value="All">All PG Types</option>
                  <option value="Boys">Boys PG</option>
                  <option value="Girls">Girls PG</option>
                  <option value="Co-living">Co-living</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="hero-budget"
                  className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-gold-dark"
                >
                  Budget Range
                </label>
                <select
                  id="hero-budget"
                  value={budgetIndex}
                  onChange={(event) => setBudgetIndex(event.target.value)}
                  className="form-input bg-ivory/70"
                >
                  {BUDGET_OPTIONS.map((option, index) => (
                    <option key={option.label} value={String(index)}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="inline-flex h-[46px] w-full items-center justify-center gap-2 rounded-full bg-gold px-8 text-sm font-bold text-forest-dark shadow-[0_14px_30px_-16px_rgba(196,154,82,0.9)] transition-all hover:bg-gold-dark hover:text-ivory lg:w-auto"
                >
                  <Search className="h-4 w-4" aria-hidden />
                  Search PGs
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line px-1 pt-3">
              <p className="text-[11px] text-ink-mute">
                Search verified properties by locality, budget, and sharing preferences.
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-mute">
                  Popular:
                </span>
                {POPULAR_LOCALITIES.map((place) => (
                  <button
                    key={place}
                    type="button"
                    onClick={() => quickSearch(place)}
                    className="rounded-full border border-line bg-ivory/70 px-3 py-1 text-[11px] font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
                  >
                    {place}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* ------------------------------------------------- FEATURED PGs */}
      <section className="bg-white py-16 sm:py-20" aria-labelledby="featured-heading">
        <div className="page-container">
          <SectionHeading
            eyebrow="Featured stays"
            title="Handpicked verified accommodations"
            description="Discover top-rated PG accommodations verified and active on the RahoMitra platform."
            className="mb-10"
          />

          <div className="grid gap-6 sm:grid-cols-2 lg:max-w-4xl lg:mx-auto">
            {isLoadingFeatured ? (
              <div className="col-span-full flex min-h-[220px] items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-forest" />
              </div>
            ) : featuredListings.length > 0 ? (
              featuredListings.map((pg) => <PGCard key={pg.id} pg={pg} />)
            ) : (
              <div className="col-span-full rounded-3xl border border-line bg-ivory/50 p-10 text-center">
                <Building2 className="mx-auto mb-3 h-10 w-10 text-gold-dark" />
                <h3 className="text-lg font-bold text-ink">No featured PGs listed yet</h3>
                <p className="mt-1 text-sm text-ink-soft">
                  New verified accommodations will appear here soon. Explore all active listings or register your property today.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <ButtonLink to="/explore" variant="outline" size="sm">
                    Browse All PGs
                  </ButtonLink>
                </div>
              </div>
            )}
          </div>

          {featuredListings.length > 0 && (
            <div className="mt-10 text-center">
              <ButtonLink to="/explore" variant="outline" size="lg">
                Explore all PGs
                <ArrowRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
            </div>
          )}
        </div>
      </section>

      {/* --------------------------------------------- WHY RAHOMITRA */}
      <section className="bg-ivory py-16 sm:py-20" aria-labelledby="why-heading">
        <div className="page-container">
          <SectionHeading
            eyebrow="Why choose us"
            title="Why Choose RahoMitra"
            description="Built for students who want clarity before commitment — and for owners who want their property seen by the right people."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_RAHOMITRA.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="group rounded-2xl border border-line bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-forest text-gold transition-colors group-hover:bg-forest-light">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="text-lg leading-snug">{title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ HOW IT WORKS */}
      <section className="bg-forest py-16 sm:py-20" aria-labelledby="how-heading">
        <div className="page-container">
          <SectionHeading
            eyebrow="Simple & straightforward"
            title="How It Works"
            description="From first search to final admission — four easy steps, entirely on your terms."
            tone="light"
          />
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, text }, index) => (
              <li
                key={title}
                className="relative rounded-2xl border border-ivory/10 bg-forest-dark/50 p-6 transition-colors hover:border-gold/40"
              >
                <span className="absolute right-5 top-4 font-display text-4xl font-semibold text-ivory/10">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-gold text-forest-dark">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="text-lg text-ivory">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ivory/65">{text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex items-center justify-center gap-2.5 text-sm text-ivory/70">
            <CheckCircle2 className="h-4 w-4 text-gold" aria-hidden />
            No online booking or payment — admission is always finalised offline with the owner.
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- OWNER CTA */}
      <section className="bg-ivory py-16 sm:py-20" aria-labelledby="owner-cta-heading">
        <div className="page-container">
          <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
            <div className="grid items-center gap-8 p-8 sm:p-10 lg:grid-cols-[1.5fr_1fr]">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold-soft text-gold-dark">
                  <Building2 className="h-6 w-6" aria-hidden />
                </div>
                <h2 id="owner-cta-heading" className="text-[1.75rem] leading-tight sm:text-3xl">
                  Own a PG? Bring Your Property Online with RahoMitra.
                </h2>
                <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-soft">
                  Reach thousands of students searching for accommodation every month. Create your
                  property profile, showcase your facilities and receive enquiries directly — our
                  Super Admin reviews every application before it goes live.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <ButtonLink to="/signup/owner" variant="gold" size="lg">
                    <Building2 className="h-4 w-4" aria-hidden />
                    List Your PG
                  </ButtonLink>
                  <Link
                    to="/about"
                    className="inline-flex items-center gap-2 rounded-full border border-forest/25 px-7 py-3.5 text-sm font-semibold text-forest transition-colors hover:bg-forest hover:text-ivory"
                  >
                    Learn more about us
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </div>

              <ul className="space-y-3 rounded-2xl bg-ivory p-6">
                {[
                  'Free property listing application',
                  'Reviewed by the RahoMitra Super Admin',
                  'Direct student enquiries — no brokerage',
                  'Your property, your rules, your pricing',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-ink-soft">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
