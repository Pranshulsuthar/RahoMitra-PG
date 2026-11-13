import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Check, Layers, Pencil, Plus, Power, Tag } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdminStore } from '../../context/AdminStore'
import type { PlanRecord } from '../../types/admin'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { Modal } from '../../components/admin/Modal'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { formatINR } from '../../utils/format'
import { cn } from '../../utils/cn'

interface PlanFormState {
  name: string
  tagline: string
  priceMonthly: string
  priceYearly: string
  features: string
}

const EMPTY_FORM: PlanFormState = {
  name: '',
  tagline: '',
  priceMonthly: '',
  priceYearly: '',
  features: '',
}

/** /admin/plans — subscription plan management (illustrative pricing only). */
export function SubscriptionPlans() {
  useDocumentTitle('Subscription Plans')

  const { plans, updatePlan, createPlan, pushToast } = useAdminStore()

  const [cycle, setCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY')
  const [editing, setEditing] = useState<PlanRecord | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<PlanFormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof PlanFormState, string>>>({})
  const [toggling, setToggling] = useState<PlanRecord | null>(null)

  const openEdit = (plan: PlanRecord) => {
    setEditing(plan)
    setForm({
      name: plan.name,
      tagline: plan.tagline,
      priceMonthly: String(plan.priceMonthly),
      priceYearly: String(plan.priceYearly),
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

  const validate = (): boolean => {
    const next: typeof errors = {}
    if (form.name.trim().length < 3) next.name = 'Plan name must be at least 3 characters.'
    if (form.tagline.trim().length < 10) next.tagline = 'Add a short description (10+ characters).'
    const monthly = Number(form.priceMonthly)
    if (!Number.isFinite(monthly) || monthly <= 0) next.priceMonthly = 'Enter a valid monthly price.'
    const yearly = Number(form.priceYearly)
    if (!Number.isFinite(yearly) || yearly <= 0) next.priceYearly = 'Enter a valid yearly price.'
    if (form.features.split('\n').filter((f) => f.trim()).length === 0)
      next.features = 'Add at least one feature.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!validate()) return
    const payload = {
      name: form.name.trim().toUpperCase(),
      tagline: form.tagline.trim(),
      priceMonthly: Number(form.priceMonthly),
      priceYearly: Number(form.priceYearly),
      features: form.features
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean),
    }
    if (editing) {
      updatePlan(editing.id, payload)
      pushToast(`Plan “${payload.name}” updated (demo).`)
      setEditing(null)
    } else {
      createPlan({ ...payload, status: 'ENABLED' })
      pushToast(`Plan “${payload.name}” created (demo).`)
      setCreating(false)
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

  const field = (key: keyof PlanFormState) => ({
    value: form[key],
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: event.target.value }))
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    },
  })

  return (
    <>
      <AdminPageHeader
        title="Subscription Plans"
        description="Configure the owner subscription plans offered on RahoMitra. Pricing below is illustrative and not final."
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
        {plans.map((plan, index) => {
          const price = cycle === 'MONTHLY' ? plan.priceMonthly : plan.priceYearly
          const isPro = plan.id === 'pro'
          return (
            <article
              key={plan.id}
              className={cn(
                'relative flex flex-col overflow-hidden rounded-3xl border bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover',
                isPro ? 'border-gold/50' : 'border-line',
                plan.status === 'DISABLED' && 'opacity-75',
              )}
            >
              {isPro && (
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
                  isPro ? 'bg-gold-soft text-gold-dark' : 'bg-forest-soft text-forest',
                )}
              >
                {index === 0 ? <Layers className="h-6 w-6" aria-hidden /> : <Tag className="h-6 w-6" aria-hidden />}
              </span>

              <h2 className="mt-4 text-xl">{plan.name}</h2>
              <p className="mt-1.5 min-h-[2.5rem] text-[13px] leading-relaxed text-ink-soft">
                {plan.tagline}
              </p>

              <div className="mt-5 flex items-end gap-1.5">
                <span className="text-3xl font-bold tracking-tight text-ink">{formatINR(price)}</span>
                <span className="pb-1 text-sm text-ink-mute">/{cycle === 'MONTHLY' ? 'mo' : 'yr'}</span>
              </div>
              <p className="mt-1 text-[11px] text-ink-mute">
                Illustrative demo pricing · {cycle === 'MONTHLY' ? 'billed monthly' : 'billed yearly'}
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

              <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4">
                <StatusBadge status={plan.status} />
                <div className="flex gap-2">
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
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {/* --------------------------------------------------------- edit/create */}
      <Modal
        open={editing !== null || creating}
        title={editing ? `Edit ${editing.name}` : 'Create new plan'}
        subtitle="Changes are stored in local demo state only."
        onClose={() => {
          setEditing(null)
          setCreating(false)
        }}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setEditing(null)
                setCreating(false)
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-forest/25 bg-white px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="plan-form"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-forest-light"
            >
              {editing ? 'Save changes' : 'Create plan'}
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
              placeholder="e.g. PREMIUM PLAN"
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
                placeholder="e.g. 499"
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
                placeholder="e.g. 4990"
                {...field('priceYearly')}
              />
              {errors.priceYearly && (
                <span className="form-error" role="alert">
                  {errors.priceYearly}
                </span>
              )}
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

      <ConfirmDialog
        open={toggling !== null}
        title={toggling?.status === 'ENABLED' ? 'Disable this plan?' : 'Enable this plan?'}
        message={
          <>
            {toggling?.status === 'ENABLED' ? (
              <>
                Disabling <strong className="font-semibold text-ink">{toggling?.name}</strong> hides
                it from new sign-ups in this demo. Existing demo subscriptions are unaffected.
              </>
            ) : (
              <>
                Enabling <strong className="font-semibold text-ink">{toggling?.name}</strong> makes
                it available for new sign-ups in this demo.
              </>
            )}
          </>
        }
        confirmLabel={toggling?.status === 'ENABLED' ? 'Disable' : 'Enable'}
        danger={toggling?.status === 'ENABLED'}
        onConfirm={confirmToggle}
        onCancel={() => setToggling(null)}
      />
    </>
  )
}
