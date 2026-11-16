import { useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  Check,
  CreditCard,
  Crown,
  FileText,
  Layers,
  Receipt,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAuth } from '../../context/AuthContext'
import { useAdminStore } from '../../context/AdminStore'
import { useOwnerStore } from '../../context/OwnerStore'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { StatCard } from '../../components/admin/StatCard'
import { Modal } from '../../components/admin/Modal'
import { EmptyState } from '../../components/common/EmptyState'
import { cn } from '../../utils/cn'
import { formatINR } from '../../utils/format'

const STATUS_HELP: Record<string, string> = {
  ACTIVE: 'Your plan is live and all features are available.',
  TRIAL: 'Trial period — full access until it converts.',
  EXPIRING_SOON: 'Renew soon to avoid losing access to premium features.',
  EXPIRED: 'Renew your plan to restore full access.',
  CANCELLED: 'This subscription was cancelled.',
  PENDING: 'Payment is pending — access starts after confirmation.',
}

/** /owner/subscription — SaaS plan screen. */
export function OwnerSubscription() {
  useDocumentTitle('Subscription & Plans')

  const { user } = useAuth()
  const { plans, subscriptions, payments, changeSubscriptionPlan, pushToast } = useAdminStore()
  const { owner, properties } = useOwnerStore()

  const subscription = useMemo(
    () =>
      subscriptions.find(
        (s) =>
          (user?.email && s.ownerEmail === user.email) ||
          (owner?.email && s.ownerEmail === owner.email) ||
          (user?.name && s.ownerName === user.name) ||
          (owner?.name && s.ownerName === owner.name),
      ) ?? subscriptions[0],
    [subscriptions, user, owner],
  )
  const currentPlan = useMemo(
    () => plans.find((p) => p.id === subscription?.planId) ?? plans[0],
    [plans, subscription],
  )

  const [selecting, setSelecting] = useState<string | null>(null)
  const [detailPlan, setDetailPlan] = useState<string | null>(null)

  const usedProperties = properties.length
  const allowedProperties = currentPlan?.propertyLimit ?? 0
  const usagePct = allowedProperties > 0 ? Math.min(100, Math.round((usedProperties / allowedProperties) * 100)) : 0

  const ownerInvoices = useMemo(
    () =>
      payments
        .filter(
          (p) =>
            (user?.email && p.ownerEmail === user.email) ||
            (user?.name && p.ownerName === user.name) ||
            (owner?.name && p.ownerName === owner.name) ||
            (subscription && p.subscriptionId === subscription.id),
        )
        .sort((a, b) => b.paidOn.localeCompare(a.paidOn)),
    [payments, user, owner, subscription],
  )

  const planRank = (id: string) => plans.findIndex((p) => p.id === id)
  const currentIndex = currentPlan ? planRank(currentPlan.id) : -1

  const isUpgrade = (planId: string) => currentIndex >= 0 && planRank(planId) > currentIndex
  const isDowngrade = (planId: string) => currentIndex >= 0 && planRank(planId) < currentIndex

  const confirmChange = (planId: string) => {
    const plan = plans.find((p) => p.id === planId)
    if (!plan || plan.id === currentPlan?.id) return
    if (subscription?.id) {
      changeSubscriptionPlan(subscription.id, planId)
    }
    pushToast(`Plan changed to ${plan.name}.`)
    setSelecting(null)
  }

  const daysLeft = useMemo(() => {
    if (!subscription?.expiryOn) return 0
    const expiry = new Date(subscription.expiryOn).getTime()
    const now = Date.now()
    return Math.max(0, Math.ceil((expiry - now) / 86_400_000))
  }, [subscription])

  if (!subscription || !currentPlan) {
    return (
      <>
        <AdminPageHeader title="Subscription & Plans" description="Your SaaS plan, billing history and upgrades." />
        <EmptyState
          title="No subscription found"
          description="No active subscription plan is linked to this account yet."
          icon={<CreditCard className="h-6 w-6" aria-hidden />}
        />
      </>
    )
  }

  return (
    <>
      <AdminPageHeader
        title="Subscription & Plans"
        description="Manage your RahoMitra SaaS plan — property limits, features, invoices and renewals. Plan payments are separate from student rent."
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-bold text-ink-soft">
            <Receipt className="h-4 w-4 text-forest" aria-hidden />
            {subscription.id}
          </span>
        }
      />

      {/* --------------------------------------------------- current plan */}
      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-3xl border border-forest/30 bg-gradient-to-br from-forest to-forest-light p-5 text-ivory shadow-[0_18px_40px_-24px_rgba(23,61,50,0.9)] lg:col-span-2 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-gold">
                <Crown className="h-3.5 w-3.5" aria-hidden />
                Current plan
              </p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{currentPlan.name}</h2>
              <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-ivory/80">{currentPlan.tagline}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold tabular-nums">
                {formatINR(subscription.cycle === 'YEARLY' ? currentPlan.priceYearly : currentPlan.priceMonthly)}
              </p>
              <p className="text-[12px] text-ivory/70">
                per {subscription.cycle === 'YEARLY' ? 'year' : 'month'} · {subscription.cycle.toLowerCase()} billing
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full bg-ivory/15 px-3.5 py-1.5 text-[12px] font-bold backdrop-blur">
              <StatusBadge status={subscription.suspended ? 'PAUSED' : subscription.status} />
            </span>
            <span className="rounded-full bg-ivory/10 px-3.5 py-1.5 text-[12px] font-semibold">
              {subscription.pgName}
            </span>
            <span className="rounded-full bg-ivory/10 px-3.5 py-1.5 text-[12px] font-semibold">
              {subscription.id}
            </span>
          </div>

          <p className="mt-3 text-[12.5px] leading-relaxed text-ivory/75">
            {subscription.suspended
              ? 'This subscription is suspended — contact platform support to reactivate.'
              : (STATUS_HELP[subscription.status] ?? '')}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-ivory/10 p-3.5">
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-gold">Start date</p>
              <p className="mt-1 text-sm font-semibold tabular-nums">{subscription.startOn}</p>
            </div>
            <div className="rounded-2xl bg-ivory/10 p-3.5">
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-gold">Expiry date</p>
              <p className="mt-1 text-sm font-semibold tabular-nums">{subscription.expiryOn}</p>
            </div>
            <div className="rounded-2xl bg-ivory/10 p-3.5">
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-gold">Next renewal</p>
              <p className="mt-1 text-sm font-semibold tabular-nums">{subscription.expiryOn}</p>
            </div>
          </div>
        </section>

        {/* Property usage + renewal */}
        <div className="grid gap-5">
          <section className="rounded-3xl border border-line bg-white p-5 shadow-card">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">
              <Layers className="h-4 w-4 text-gold-dark" aria-hidden />
              Property usage
            </h3>
            <p className="mt-3 text-3xl font-bold tabular-nums text-ink">
              {usedProperties}
              <span className="text-lg text-ink-mute"> / {allowedProperties}</span>
            </p>
            <p className="text-[12.5px] text-ink-mute">properties used of your plan limit</p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-ivory">
              <div
                className={cn('h-full rounded-full transition-all', usagePct >= 100 ? 'bg-danger' : 'bg-forest')}
                style={{ width: `${usagePct}%` }}
                role="progressbar"
                aria-valuenow={usagePct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Property usage"
              />
            </div>
            <p className="mt-2.5 text-[12px] leading-relaxed text-ink-soft">
              {usagePct >= 100
                ? 'Limit reached — upgrade your plan to add more properties.'
                : `${allowedProperties - usedProperties} more ${allowedProperties - usedProperties === 1 ? 'property' : 'properties'} available on this plan.`}
            </p>
          </section>

          <section className="rounded-3xl border border-line bg-white p-5 shadow-card">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">
              <CalendarClock className="h-4 w-4 text-gold-dark" aria-hidden />
              Renewal info
            </h3>
            <ul className="mt-3 space-y-2 text-[13px] text-ink-soft">
              <li className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <span>Billing cycle</span>
                <span className="font-semibold text-ink">{subscription.cycle}</span>
              </li>
              <li className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <span>Days until expiry</span>
                <span className="font-semibold text-ink tabular-nums">{daysLeft} days</span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span>Auto-renew</span>
                <span className="font-semibold text-ink">Enabled</span>
              </li>
            </ul>
            <p className="mt-3 rounded-2xl border border-dashed border-gold/60 bg-gold-soft/50 px-3.5 py-2.5 text-[11.5px] leading-relaxed text-gold-dark">
              Plan payments are billed separately from student rent collected through your PG.
            </p>
          </section>
        </div>
      </div>

      {/* ------------------------------------------------- plan features */}
      <section className="mt-6 rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base sm:text-lg">
            <ShieldCheck className="h-5 w-5 text-gold-dark" aria-hidden />
            What&apos;s included in {currentPlan.name}
          </h2>
        </div>
        <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {currentPlan.featureToggles.map((feature) => (
            <li
              key={feature.key}
              className={cn(
                'flex items-start gap-2.5 rounded-2xl border px-3.5 py-3 text-[13px]',
                feature.enabled
                  ? 'border-forest/25 bg-forest-soft text-forest'
                  : 'border-line bg-ivory/40 text-ink-mute line-through decoration-ink-mute/60',
              )}
            >
              <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-white/70">
                <Check className="h-3 w-3" aria-hidden />
              </span>
              <span className="leading-snug">{feature.label}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* --------------------------------------------- comparison cards */}
      <section className="mt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base sm:text-lg">
            <Sparkles className="h-5 w-5 text-gold-dark" aria-hidden />
            Compare plans
          </h2>
          <p className="text-[11.5px] text-ink-mute">Select a plan to upgrade or downgrade.</p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan.id
            const upgrade = isUpgrade(plan.id)
            const downgrade = isDowngrade(plan.id)
            return (
              <article
                key={plan.id}
                className={cn(
                  'relative flex flex-col rounded-3xl border bg-white p-5 shadow-card transition-all',
                  isCurrent ? 'border-forest ring-2 ring-forest/30' : 'border-line hover:-translate-y-1 hover:border-gold/50',
                )}
              >
                {isCurrent && (
                  <span className="absolute -top-3 left-5 rounded-full bg-forest px-3.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-ivory">
                    Your plan
                  </span>
                )}
                <h3 className="mt-1 text-lg font-bold text-ink">{plan.name}</h3>
                <p className="mt-1 min-h-[2.75rem] text-[12.5px] leading-relaxed text-ink-mute">{plan.tagline}</p>

                <p className="mt-3 text-3xl font-bold tabular-nums text-forest">
                  {formatINR(plan.priceMonthly)}
                  <span className="text-sm font-semibold text-ink-mute">/mo</span>
                </p>
                <p className="text-[11.5px] text-ink-mute">
                  {formatINR(plan.priceYearly)}/year · up to {plan.propertyLimit} {plan.propertyLimit === 1 ? 'property' : 'properties'}
                </p>

                <ul className="mt-4 flex-1 space-y-2">
                  {plan.features.slice(0, 5).map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-[12.5px] leading-snug text-ink-soft">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest" aria-hidden />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailPlan(plan.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-forest/25 bg-white px-4 py-2.5 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
                  >
                    <FileText className="h-4 w-4" aria-hidden />
                    View details
                  </button>
                  {isCurrent ? (
                    <span className="inline-flex items-center justify-center gap-2 rounded-full bg-ivory px-4 py-2.5 text-sm font-bold text-ink-soft">
                      <Check className="h-4 w-4 text-forest" aria-hidden />
                      Currently active
                    </span>
                  ) : plan.status === 'DISABLED' ? (
                    <span className="inline-flex items-center justify-center rounded-full border border-line bg-ivory px-4 py-2.5 text-sm font-semibold text-ink-mute">
                      Unavailable
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelecting(plan.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-4 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-forest-light"
                    >
                      {upgrade ? (
                        <>
                          <ArrowUpRight className="h-4 w-4" aria-hidden />
                          Upgrade
                        </>
                      ) : downgrade ? (
                        <>
                          <ArrowDownRight className="h-4 w-4" aria-hidden />
                          Downgrade
                        </>
                      ) : (
                        'Switch to this plan'
                      )}
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* --------------------------------------- history + invoices */}
      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        {/* Subscription history */}
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base sm:text-lg">
            <Layers className="h-5 w-5 text-gold-dark" aria-hidden />
            Subscription history
          </h2>
          {subscription.events.length === 0 ? (
            <EmptyState
              title="No history yet"
              description="Plan changes and renewals will appear here."
              icon={<Layers className="h-6 w-6" aria-hidden />}
            />
          ) : (
            <ol className="relative space-y-4 border-l-2 border-line pl-5">
              {subscription.events.map((event) => (
                <li key={event.id} className="relative">
                  <span className="absolute -left-[1.72rem] top-1 h-3 w-3 rounded-full border-2 border-white bg-forest" aria-hidden />
                  <p className="text-[13.5px] font-semibold leading-snug text-ink">{event.text}</p>
                  <p className="text-[11.5px] text-ink-mute tabular-nums">{event.on}</p>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Invoices */}
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base sm:text-lg">
              <Receipt className="h-5 w-5 text-gold-dark" aria-hidden />
              Invoices & payments
            </h2>
            <span className="rounded-full bg-ivory px-3 py-1 text-[11px] font-bold text-ink-soft">plan only</span>
          </div>
          {ownerInvoices.length === 0 ? (
            <EmptyState
              title="No invoices yet"
              description="Your plan payments will show up here."
              icon={<Receipt className="h-6 w-6" aria-hidden />}
            />
          ) : (
            <ul className="space-y-3">
              {ownerInvoices.map((invoice) => {
                const plan = plans.find((p) => p.id === invoice.planId)
                return (
                  <li
                    key={invoice.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-ivory/40 px-4 py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-bold text-ink">{invoice.id}</p>
                      <p className="text-[11.5px] text-ink-mute">
                        {plan?.name ?? invoice.planId} · {invoice.paidOn} · {invoice.method}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold tabular-nums text-forest">{formatINR(invoice.amount)}</p>
                      <StatusBadge status={invoice.status} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          <p className="mt-4 rounded-2xl border border-dashed border-gold/60 bg-gold-soft/50 px-4 py-3 text-[11.5px] leading-relaxed text-gold-dark">
            These are SaaS plan payments only — student rent invoices live on your Billing screen and are tracked
            separately.
          </p>
        </section>
      </div>

      {/* ------------------------------------------------- stats strip */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Plan amount" value={formatINR(subscription.amount)} icon={CreditCard} tone="forest" hint={subscription.cycle} />
        <StatCard label="Properties used" value={`${usedProperties}/${allowedProperties}`} icon={Layers} tone="gold" hint="Plan limit" />
        <StatCard label="Days remaining" value={daysLeft} icon={CalendarClock} tone={daysLeft <= 7 ? 'danger' : 'ink'} hint="Until expiry" />
        <StatCard label="Invoices" value={ownerInvoices.length} icon={Receipt} tone="ink" hint="Payment records" />
      </div>

      {/* ------------------------------------------ change plan confirm */}
      <Modal
        open={selecting !== null}
        title={selecting && isUpgrade(selecting) ? 'Upgrade plan?' : 'Change plan?'}
        subtitle="Confirm to update your subscription plan."
        onClose={() => setSelecting(null)}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setSelecting(null)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-forest/25 bg-white px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => selecting && confirmChange(selecting)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-forest-light"
            >
              Confirm change
            </button>
          </>
        }
      >
        {selecting && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-line bg-ivory/40 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">From</p>
              <p className="mt-1 text-sm font-bold text-ink">
                {currentPlan.name} · {formatINR(subscription.amount)}/{subscription.cycle === 'YEARLY' ? 'yr' : 'mo'}
              </p>
            </div>
            <div className="rounded-2xl border border-forest/30 bg-forest-soft p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-forest">To</p>
              {(() => {
                const plan = plans.find((p) => p.id === selecting)
                if (!plan) return null
                return (
                  <>
                    <p className="mt-1 text-sm font-bold text-ink">
                      {plan.name} · {formatINR(plan.priceMonthly)}/mo · up to {plan.propertyLimit} properties
                    </p>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">{plan.tagline}</p>
                  </>
                )
              })()}
            </div>
            <p className="text-[13px] leading-relaxed text-ink-soft">
              Your new plan will take effect immediately.
            </p>
          </div>
        )}
      </Modal>

      {/* ----------------------------------------------- plan detail modal */}
      <Modal
        open={detailPlan !== null}
        title={plans.find((p) => p.id === detailPlan)?.name ?? 'Plan details'}
        subtitle="Full feature list for this plan."
        onClose={() => setDetailPlan(null)}
        size="md"
        footer={
          <button
            type="button"
            onClick={() => setDetailPlan(null)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-forest/25 bg-white px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
          >
            Close
          </button>
        }
      >
        {detailPlan && (
          <div className="space-y-4">
            {(() => {
              const plan = plans.find((p) => p.id === detailPlan)
              if (!plan) return null
              return (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-line bg-ivory/40 p-3.5 text-center">
                      <p className="text-[10.5px] font-bold uppercase tracking-wider text-ink-mute">Monthly</p>
                      <p className="mt-1 text-lg font-bold tabular-nums text-forest">{formatINR(plan.priceMonthly)}</p>
                    </div>
                    <div className="rounded-2xl border border-line bg-ivory/40 p-3.5 text-center">
                      <p className="text-[10.5px] font-bold uppercase tracking-wider text-ink-mute">Yearly</p>
                      <p className="mt-1 text-lg font-bold tabular-nums text-forest">{formatINR(plan.priceYearly)}</p>
                    </div>
                    <div className="rounded-2xl border border-line bg-ivory/40 p-3.5 text-center">
                      <p className="text-[10.5px] font-bold uppercase tracking-wider text-ink-mute">Properties</p>
                      <p className="mt-1 text-lg font-bold tabular-nums text-forest">{plan.propertyLimit}</p>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {plan.featureToggles.map((feature) => (
                      <li key={feature.key} className="flex items-start gap-2.5 text-[13px] text-ink-soft">
                        <span
                          className={cn(
                            'mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full',
                            feature.enabled ? 'bg-forest text-ivory' : 'bg-ivory text-ink-mute',
                          )}
                        >
                          <Check className="h-3 w-3" aria-hidden />
                        </span>
                        <span className={feature.enabled ? '' : 'text-ink-mute'}>{feature.label}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )
            })()}
          </div>
        )}
      </Modal>
    </>
  )
}

