import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { ComponentType, ReactNode } from 'react'
import {
  MapPin,
  Wallet,
  ShieldCheck,
  UtensilsCrossed,
  ListChecks,
  CalendarCheck,
  ArrowRight,
  Compass,
  Info,
  Loader2,
} from 'lucide-react'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { fetchPGBySlug } from '../api/pg'
import type { PG } from '../types'
import { formatINR } from '../utils/format'
import { PageHeader } from '../components/common/PageHeader'
import { Badge, DemoBadge } from '../components/common/Badge'
import { ButtonLink } from '../components/common/Button'
import { EmptyState } from '../components/common/EmptyState'
import { Gallery } from '../components/pg/Gallery'
import { OwnerContactPanel } from '../components/pg/OwnerContactPanel'
import { availableFacilities } from '../components/pg/facilityMeta'

function SectionBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
      <h2 className="mb-4 flex items-center gap-2.5 text-lg">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-soft text-forest">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        {title}
      </h2>
      {children}
    </section>
  )
}

export function PGDetails() {
  const { slug = '' } = useParams()
  const [pg, setPg] = useState<PG | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProperty = async () => {
    if (!slug) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchPGBySlug(slug)
      setPg(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Property not found'
      setError(message)
      setPg(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProperty()
  }, [slug])

  useDocumentTitle(pg ? pg.name : isLoading ? 'Loading...' : 'Property not found')

  if (isLoading) {
    return (
      <section className="flex min-h-[400px] items-center justify-center bg-white py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-forest" />
          <p className="text-sm font-medium text-ink-soft">Loading property details…</p>
        </div>
      </section>
    )
  }

  if (!pg || error) {
    return (
      <section className="bg-white py-20">
        <div className="page-container">
          <EmptyState
            title="Property not found"
            description="This listing does not exist or is no longer active. It may have been removed, or the link may be incorrect."
            action={
              <ButtonLink to="/explore" variant="primary">
                <Compass className="h-4 w-4" aria-hidden />
                Browse active PGs
              </ButtonLink>
            }
          />
        </div>
      </section>
    )
  }

  const facilities = availableFacilities(pg.facilities)

  return (
    <>
      <PageHeader
        title={pg.name}
        subtitle={`${pg.category} PG · ${pg.locality}, ${pg.city} — demo listing with illustrative sample details.`}
        crumbs={[
          { label: 'Home', to: '/' },
          { label: 'Explore PGs', to: '/explore' },
          { label: pg.name },
        ]}
      />

      <section className="bg-white py-10 sm:py-14">
        <div className="page-container">
          {/* Title row */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Badge tone="forest">{pg.category} PG</Badge>
            <Badge tone="gold">Demo listing</Badge>
            <Badge tone="outline">{pg.sharingOptions.join(' / ')} sharing</Badge>
          </div>

          <div className="grid items-start gap-8 lg:grid-cols-[1.7fr_1fr]">
            {/* ------------------------------------------------ LEFT */}
            <div className="space-y-6">
              <Gallery images={pg.gallery} alt={pg.name} />

              <SectionBlock icon={ShieldCheck} title="About this property">
                <p className="text-[15px] leading-relaxed text-ink-soft">{pg.description}</p>
                <p className="mt-4 flex items-start gap-2 rounded-xl bg-gold-soft/50 px-4 py-3 text-[12px] leading-relaxed text-gold-dark">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  All information on this page — address, rent, deposit, rules and availability — is
                  illustrative demo data and not a verified real-world property.
                </p>
              </SectionBlock>

              <SectionBlock icon={Wallet} title="Rent & room types">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-line text-[11px] uppercase tracking-[0.12em] text-ink-mute">
                        <th scope="col" className="py-2.5 font-semibold">
                          Room type
                        </th>
                        <th scope="col" className="py-2.5 font-semibold">
                          Sharing
                        </th>
                        <th scope="col" className="py-2.5 text-right font-semibold">
                          Sample rent
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pg.roomTypes.map((room) => (
                        <tr key={room.label} className="border-b border-line/70 last:border-0">
                          <td className="py-3 font-medium text-ink">{room.label}</td>
                          <td className="py-3 text-ink-soft">{room.sharing}</td>
                          <td className="py-3 text-right font-semibold text-forest">
                            {formatINR(room.rent)}
                            <span className="text-xs font-normal text-ink-mute">/mo</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-ink-soft">
                  <span>
                    Starting rent:{' '}
                    <strong className="text-forest">{formatINR(pg.rent)}/month</strong>
                  </span>
                  <span>
                    Security deposit:{' '}
                    <strong className="text-forest">{formatINR(pg.securityDeposit)}</strong>
                  </span>
                  <span className="text-gold-dark">Sample pricing only</span>
                </div>
              </SectionBlock>

              <SectionBlock icon={ListChecks} title="Facilities & amenities">
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {facilities.map(({ key, label, icon: Icon }) => (
                    <li
                      key={key}
                      className="flex items-center gap-2.5 rounded-xl bg-ivory px-3.5 py-3 text-sm text-ink-soft"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-forest" aria-hidden />
                      {label}
                    </li>
                  ))}
                </ul>
              </SectionBlock>

              <div className="grid gap-6 sm:grid-cols-2">
                <SectionBlock icon={UtensilsCrossed} title="Food availability">
                  <p className="text-[15px] text-ink-soft">{pg.foodAvailability}</p>
                  <p className="mt-2 text-[12px] text-ink-mute">Demo information.</p>
                </SectionBlock>

                <SectionBlock icon={CalendarCheck} title="Availability">
                  <p className="text-[15px] leading-relaxed text-ink-soft">{pg.availabilityNote}</p>
                </SectionBlock>
              </div>

              <SectionBlock icon={ListChecks} title="Property rules">
                <ul className="space-y-2.5">
                  {pg.rules.map((rule) => (
                    <li key={rule} className="flex items-start gap-2.5 text-sm text-ink-soft">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                        aria-hidden
                      />
                      {rule}
                    </li>
                  ))}
                </ul>
              </SectionBlock>

              <SectionBlock icon={MapPin} title="Address (demo)">
                <p className="text-[15px] leading-relaxed text-ink-soft">
                  {pg.locality}, {pg.city}
                </p>
                <p className="mt-2 text-[12px] text-ink-mute">
                  Exact address is shared by the owner after a direct enquiry. The locality shown is
                  sample data.
                </p>
              </SectionBlock>
            </div>

            {/* ----------------------------------------------- RIGHT */}
            <aside className="lg:sticky lg:top-[92px]">
              <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
                <div className="flex items-end justify-between gap-3 border-b border-line pb-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-mute">
                      Monthly rent
                    </p>
                    <p className="mt-1 font-display text-3xl font-semibold text-forest">
                      {formatINR(pg.rent)}
                      <span className="text-sm font-normal text-ink-soft">/month</span>
                    </p>
                  </div>
                  <DemoBadge compact />
                </div>

                <dl className="space-y-3 border-b border-line py-4 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-soft">Security deposit</dt>
                    <dd className="font-semibold text-ink">{formatINR(pg.securityDeposit)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-soft">Category</dt>
                    <dd className="font-semibold text-ink">{pg.category} PG</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-soft">Sharing options</dt>
                    <dd className="font-semibold text-ink">{pg.sharingOptions.join(', ')}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-soft">Locality</dt>
                    <dd className="font-semibold text-ink">{pg.locality} (demo)</dd>
                  </div>
                </dl>

                <div className="pt-5">
                  <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-mute">
                    Contact the owner
                  </h2>
                  <OwnerContactPanel contact={pg.ownerContact} />
                </div>

                <div className="mt-5 rounded-xl bg-ivory px-4 py-3 text-[12px] leading-relaxed text-ink-soft">
                  RahoMitra does not take online bookings or payments. Visit the property, talk to
                  the owner directly and finalise admission offline.
                </div>

                <ButtonLink to={`/explore?type=${pg.category}`} variant="outline" fullWidth className="mt-4">
                  <ArrowRight className="h-4 w-4" aria-hidden />
                  Explore more {pg.category} PGs
                </ButtonLink>

                <Link
                  to="/contact"
                  className="mt-3 block text-center text-xs font-semibold text-forest underline-offset-4 hover:underline"
                >
                  Report an issue with this listing
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
