import { useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Check, Layers, Pencil, Plus, Power, Trash2, Users } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdminStore } from '../../context/AdminStore'
import type { BillingCycle, PlanRecord } from '../../types/admin'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { Modal } from '../../components/admin/Modal'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { EmptyState } from '../../components/common/EmptyState'
import { formatINR } from '../../utils/format'
import { cn } from '../../utils/cn'

interface PlanFormState {
  name: string
  tagline: string
  priceMonthly: string
  priceYearly: string
  propertyLimit: string
  billing: BillingCycle
  features: string
}

const EMPTY_FORM: PlanFormState = {
  name: '',
  tagline: '',
  priceMonthly: '',
  priceYearly: '',
  propertyLimit: '1',
  billing: 'MONTHLY',
  features: '',
}

/** /admin/plans — subscription plan management (illustrative pricing only). */
export function SubscriptionPlans() {
  useDocumentTitle('Subscription Plans')

  const { plans, subscriptions, updatePlan, createPlan, deletePlan, planSubscriberCount, pushToast } =
    useAdminStore()

  const [cycle, setCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY')
  const [editing, setEditing] = useState<PlanRecord | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<PlanFormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof PlanFormState, string>>>({})
  const [toggling, setToggling] = useState<PlanRecord | null>(null)
  const [deleting, setDeleting] = useState<PlanRecord | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [subscribers, setSubscribers] = useState<PlanRecord | null>(null)

  const liveEditing = editing ? plans.find((p) => p.id === editing.id) ?? editing : null

  const openEdit = (plan: PlanRecord) => {
    setEditing(plan)
    setCreating(false)
    setForm({
      name: plan.name,
      tagline: plan.tagline,
      priceMonthly: String(plan.priceMonthly),
      priceYearly: String(plan.priceYearly),
      propertyLimit: String(plan.propertyLimit),
      billing: plan.billing,
      features: plan.features.join('\n'),
    })
    setErrors({})
  }

  const openCreate = () => {
    setEditing(null)
    setCreating(true)
    setForm(EMPTY_FORM)
    setErrors({})
  }

  const closeForm = () => {
    setEditing(null)
    setCreating(false)
  }

  const validate = (): boolean => {
    const next: typeof errors = {}
    if (form.name.trim().length < 3) next.name = 'Plan name must be at least 3 characters.'
    if (form.tagline.trim().length < 10) next.tagline = 'Add a short description (10+ characters).'
    const monthly = Number(form.priceMonthly)
    if (!Number.isFinite(monthly) || monthly <= 0) next.priceMonthly = 'Enter a valid monthly price.'
    const yearly = Number(form.priceYearly)
    if (!Number.isFinite(yearly) || yearly <= 0) next.priceYearly = 'Enter a valid yearly price.'
    const limit = Number(form.propertyLimit)
    if (!Number.isInteger(limit) || limit < 1) next.propertyLimit = 'Property limit must be at least 1.'
    if (form.features.split('\n').filter((f) => f.trim()).length === 0)
      next.features = 'Add at least one feature.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!validate()) return
    const featureList = form.features
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean)
    const payload = {
      name: form.name.trim().toUpperCase(),
      tagline: form.tagline.trim(),
      priceMonthly: Number(form.priceMonthly),
      priceYearly: Number(form.priceYearly),
      propertyLimit: Number(form.propertyLimit),
      billing: form.billing,
      features: featureList,
      featureToggles: featureList.map((label, index) => ({
        key: `feature-${index}`,
        label,
        enabled: true,
      })),
    }
    if (editing) {
      updatePlan(editing.id, payload)
      pushToast(`Plan “${payload.name}” updated (demo).`)
      closeForm()
    } else {
      createPlan({ ...payload, status: 'ENABLED' })
      pushToast(`Plan “${payload.name}” created (demo).`)
      closeForm()
    }
  }

  const confirmToggle = () => {
    if (!toggling) return
    const nextStatus = toggling.status === 'ENABLED' ? 'DISABLED' : 'ENABLED'
    updatePlan(toggling.id, { status: nextStatus })
    pushToast(
      nextStatus === 'ENABLED'
        ? `Plan “${toggling.name}” enabled (demo).`
        : `Plan “${toggling.name}” disabled (demo).`,
      nextStatus === 'ENABLED' ? 'success' : 'error',
    )
    setToggling(null)
  }

  const confirmDelete = () => {
    if (!deleting) return
    const result = deletePlan(deleting.id)
    if (result.ok) {
      pushToast(`Plan “${deleting.name}” deleted (demo).`, 'error')
      setDeleting(null)
      setDeleteError(null)
    } else {
      setDeleteError(result.reason ?? 'This plan cannot be deleted.')
    }
  }

  const toggleFeature = (plan: PlanRecord, key: string) => {
    const featureToggles = plan.featureToggles.map((t) =>
      t.key === key ? { ...t, enabled: !t.enabled } : t,
    )
    updatePlan(plan.id, { featureToggles })
    const label = plan.featureToggles.find((t) => t.key === key)?.label ?? 'feature'
    pushToast(
      `“${label}” ${featureToggles.find((t) => t.key === key)?.enabled ? 'enabled' : 'disabled'} on ${plan.name} (demo).`,
      'info',
    )
  }

  const field = (key: keyof PlanFormState) => ({
    value: key === 'billing' ? form.billing : form[key],
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: event.target.value }))
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    },
  })

  const subscriberRows = useMemo(
    () => (subscribers ? subscriptions.filter((s) => s.planId === subscribers.id) : []),
    [subscribers, subscriptions],
  )

  return (
    <>
      <AdminPageHeader
        title="Subscription Plans"
        description="Configure the SaaS plans offered to PG owners — name, price, billing duration, property limits, feature toggles, activation and deletion. Pricing is illustrative."
        actions={
          <>
            <div className="flex rounded-full border border-line bg-white p-1">
              {(['MONTHLY', 'YEARLY'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCycle(option)}
                  className={cn(
                    'rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors',
                    cycle === option ? 'bg-forest text-ivory' : 'text-ink-soft hover:text-forest',
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory shadow-[0_10px_24px_-14px_rgba(23,61,50,0.9)] transition-colors hover:bg-forest-light"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Create new plan
            </button>
          </>
        }
      />

      <DemoBanner message="plan features and prices are illustrative placeholders — they have not been finalised for launch." />

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const price = cycle === 'MONTHLY' ? plan.priceMonthly : plan.priceYearly
          const isPopular = plan.id === 'professional'
          const subs = planSubscriberCount(plan.id)
          return (
            <article
              key={plan.id}
              className={cn(
                'relative flex flex-col overflow-hidden rounded-3xl border bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover',
                isPopular ? 'border-gold/50' : 'border-line',
                plan.status === 'DISABLED' && 'opacity-75',
              )}
            >
              {isPopular && (
                <span className="absolute right-5 top-5 rounded-full bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-forest-dark">
                  Popular
                </span>
              )}
              {plan.custom && (
                <span className="absolute left-5 top-5 rounded-full bg-forest-soft px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-forest">
                  Custom
                </span>
              )}

              <span
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-2xl',
                  isPopular ? 'bg-gold-soft text-gold-dark' : 'bg-forest-soft text-forest',
                )}
              >
                <Layers className="h-6 w-6" aria-hidden />
              </span>

              <h2 className="mt-4 text-xl">{plan.name}</h2>
              <p className="mt-1.5 min-h-[2.5rem] text-[13px] leading-relaxed text-ink-soft">{plan.tagline}</p>

              <div className="mt-5 flex items-end gap-1.5">
                <span className="text-3xl font-bold tracking-tight text-ink">{formatINR(price)}</span>
                <span className="pb-1 text-sm text-ink-mute">/{cycle === 'MONTHLY' ? 'mo' : 'yr'}</span>
              </div>
              <p className="mt-1 text-[11px] text-ink-mute">
                Illustrative demo pricing · {plan.billing.toLowerCase()} billing ·{' '}
                <span className="font-semibold text-ink-soft">
                  up to {plan.propertyLimit} PG {plan.propertyLimit === 1 ? 'property' : 'properties'}
                </span>
              </p>

              <ul className="mt-5 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-ink-soft">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest-soft text-forest">
                      <Check className="h-3 w-3" aria-hidden />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {plan.featureToggles.slice(0, 6).map((toggle) => (
                  <button
                    key={toggle.key}
                    type="button"
                    onClick={() => toggleFeature(plan, toggle.key)}
                    title={`${toggle.enabled ? 'Enabled' : 'Disabled'} — click to toggle`}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-[10.5px] font-bold transition-colors',
                      toggle.enabled
                        ? 'border-forest/25 bg-forest-soft text-forest hover:border-forest'
                        : 'border-line bg-ivory text-ink-mute line-through hover:border-ink-mute',
                    )}
                  >
                    {toggle.label}
                  </button>
                ))}
                {plan.featureToggles.length > 6 && (
                  <span className="rounded-full border border-line bg-ivory px-2.5 py-1 text-[10.5px] font-bold text-ink-mute">
                    +{plan.featureToggles.length - 6} more
                  </span>
                )}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                <StatusBadge status={plan.status} />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSubscribers(plan)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-forest/25 bg-white px-3.5 py-1.5 text-xs font-bold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
                  >
                    <Users className="h-3.5 w-3.5" aria-hidden />
                    Subscribers · {subs}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(plan)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-forest/25 bg-white px-3.5 py-1.5 text-xs font-bold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setToggling(plan)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors',
                      plan.status === 'ENABLED'
                        ? 'border border-danger/40 bg-white text-danger hover:bg-danger hover:text-white'
                        : 'bg-forest text-ivory hover:bg-forest-light',
                    )}
                  >
                    <Power className="h-3.5 w-3.5" aria-hidden />
                    {plan.status === 'ENABLED' ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError(null)
                      setDeleting(plan)
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-danger/40 bg-white px-3.5 py-1.5 text-xs font-bold text-danger transition-colors hover:bg-danger hover:text-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {/* ------------------------------------------------ management table */}
      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base sm:text-lg">
            <Layers className="h-5 w-5 text-gold-dark" aria-hidden />
            Plan management table
          </h2>
          <span className="rounded-full bg-ivory px-3 py-1 text-[11px] font-bold text-ink-soft">
            {plans.length} plans · demo
          </span>
        </div>

        <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-ivory/60">
                  {['Plan ID', 'Plan Name', 'Monthly', 'Yearly', 'Billing', 'Property Limit', 'Subscribers', 'Status', 'Actions'].map(
                    (head) => (
                      <th
                        key={head}
                        scope="col"
                        className="whitespace-nowrap px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-soft"
                      >
                        {head}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr
                    key={plan.id}
                    className="border-b border-line/70 transition-colors last:border-0 hover:bg-ivory/40"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-ink-soft">{plan.id}</td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="block font-semibold text-ink">{plan.name}</span>
                      {plan.custom && (
                        <span className="text-[11px] font-bold uppercase tracking-wider text-forest">Custom</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold tabular-nums text-forest">
                      {formatINR(plan.priceMonthly)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 tabular-nums text-ink-soft">
                      {formatINR(plan.priceYearly)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-[12.5px] text-ink-soft">{plan.billing}</td>
                    <td className="whitespace-nowrap px-5 py-4 tabular-nums text-ink-soft">
                      {plan.propertyLimit} {plan.propertyLimit === 1 ? 'PG' : 'PGs'}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 tabular-nums text-ink-soft">
                      {planSubscriberCount(plan.id)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <StatusBadge status={plan.status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(plan)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-forest/25 bg-white px-3 py-1.5 text-xs font-bold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubscribers(plan)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-forest/25 bg-white px-3 py-1.5 text-xs font-bold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
                        >
                          <Users className="h-3.5 w-3.5" aria-hidden />
                          Subscribers
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- edit/create */}
      <Modal
        open={liveEditing !== null || creating}
        title={liveEditing ? `Edit ${liveEditing.name}` : 'Create new plan'}
        subtitle="Changes are stored in local demo state only."
        onClose={closeForm}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={closeForm}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-forest/25 bg-white px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="plan-form"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-forest-light"
            >
              {liveEditing ? 'Save changes' : 'Create plan'}
            </button>
          </>
        }
      >
        <form id="plan-form" onSubmit={submit} noValidate className="space-y-4">
          <div>
            <label htmlFor="plan-name" className="form-label">
              Plan name<span className="ml-1 text-danger">*</span>
            </label>
            <input
              id="plan-name"
              className="form-input"
              placeholder="e.g. ULTIMATE PLAN"
              {...field('name')}
            />
            {errors.name && (
              <span className="form-error" role="alert">
                {errors.name}
              </span>
            )}
          </div>

          <div>
            <label htmlFor="plan-tagline" className="form-label">
              Tagline<span className="ml-1 text-danger">*</span>
            </label>
            <textarea
              id="plan-tagline"
              rows={2}
              className="form-input resize-y"
              placeholder="One-line description of the plan"
              {...field('tagline')}
            />
            {errors.tagline && (
              <span className="form-error" role="alert">
                {errors.tagline}
              </span>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="plan-monthly" className="form-label">
                Monthly price (₹)<span className="ml-1 text-danger">*</span>
              </label>
              <input
                id="plan-monthly"
                type="number"
                min={1}
                className="form-input"
                placeholder="e.g. 299"
                {...field('priceMonthly')}
              />
              {errors.priceMonthly && (
                <span className="form-error" role="alert">
                  {errors.priceMonthly}
                </span>
              )}
            </div>
            <div>
              <label htmlFor="plan-yearly" className="form-label">
                Yearly price (₹)<span className="ml-1 text-danger">*</span>
              </label>
              <input
                id="plan-yearly"
                type="number"
                min={1}
                className="form-input"
                placeholder="e.g. 2990"
                {...field('priceYearly')}
              />
              {errors.priceYearly && (
                <span className="form-error" role="alert">
                  {errors.priceYearly}
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="plan-limit" className="form-label">
                Property limit<span className="ml-1 text-danger">*</span>
              </label>
              <input
                id="plan-limit"
                type="number"
                min={1}
                className="form-input"
                placeholder="e.g. 3"
                {...field('propertyLimit')}
              />
              {errors.propertyLimit && (
                <span className="form-error" role="alert">
                  {errors.propertyLimit}
                </span>
              )}
            </div>
            <div>
              <label htmlFor="plan-billing" className="form-label">
                Billing duration<span className="ml-1 text-danger">*</span>
              </label>
              <select
                id="plan-billing"
                className="form-input"
                value={form.billing}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, billing: event.target.value as BillingCycle }))
                }
              >
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="plan-features" className="form-label">
              Features (one per line)<span className="ml-1 text-danger">*</span>
            </label>
            <textarea
              id="plan-features"
              rows={5}
              className="form-input resize-y"
              placeholder={'Basic PG management\nStandard support'}
              {...field('features')}
            />
            <span className="mt-1.5 block text-[11px] text-ink-mute">
              Each line becomes an enable/disable toggle on the plan card after saving.
            </span>
            {errors.features && (
              <span className="form-error" role="alert">
                {errors.features}
              </span>
            )}
          </div>

          <p className="rounded-2xl border border-dashed border-gold/60 bg-gold-soft/50 px-4 py-3 text-[12px] leading-relaxed text-gold-dark">
            Illustrative pricing only — these values do not represent final RahoMitra plan pricing.
          </p>
        </form>
      </Modal>

      {/* ------------------------------------------------------ subscribers */}
      <Modal
        open={subscribers !== null}
        title={subscribers ? `${subscribers.name} subscribers` : 'Subscribers'}
        subtitle="Demo subscription records attached to this plan."
        onClose={() => setSubscribers(null)}
        size="md"
        footer={
          <button
            type="button"
            onClick={() => setSubscribers(null)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-forest/25 bg-white px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
          >
            Close
          </button>
        }
      >
        {subscriberRows.length === 0 ? (
          <EmptyState
            title="No subscribers yet"
            description="No demo subscription currently uses this plan."
            icon={<Users className="h-6 w-6" aria-hidden />}
          />
        ) : (
          <ul className="space-y-3">
            {subscriberRows.map((sub) => (
              <li
                key={sub.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-ivory/40 px-4 py-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">{sub.pgName}</span>
                  <span className="block truncate text-[11.5px] text-ink-mute">
                    {sub.id} · {sub.ownerName} · expires {sub.expiryOn}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-bold tabular-nums text-forest">{formatINR(sub.amount)}</span>
                  <StatusBadge status={sub.status} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <ConfirmDialog
        open={toggling !== null}
        title={toggling?.status === 'ENABLED' ? 'Disable this plan?' : 'Enable this plan?'}
        message={
          <>
            {toggling?.status === 'ENABLED' ? (
              <>
                Disabling <strong className="font-semibold text-ink">{toggling?.name}</strong> hides it
                from new sign-ups in this demo. Existing demo subscriptions are unaffected.
              </>
            ) : (
              <>
                Enabling <strong className="font-semibold text-ink">{toggling?.name}</strong> makes it
                available for new sign-ups in this demo.
              </>
            )}
          </>
        }
        confirmLabel={toggling?.status === 'ENABLED' ? 'Disable' : 'Enable'}
        danger={toggling?.status === 'ENABLED'}
        onConfirm={confirmToggle}
        onCancel={() => setToggling(null)}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this plan?"
        message={
          <>
            {deleteError ? (
              <span className="text-danger">{deleteError}</span>
            ) : (
              <>
                Permanently remove{' '}
                <strong className="font-semibold text-ink">{deleting?.name}</strong> from this demo
                session? Plans with active subscriptions cannot be deleted.
              </>
            )}
          </>
        }
        confirmLabel="Delete plan"
        danger
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleting(null)
          setDeleteError(null)
        }}
      />
    </>
  )
}
