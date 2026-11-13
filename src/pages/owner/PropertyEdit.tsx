import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Eye, Save } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useOwnerStore } from '../../context/OwnerStore'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { FormInput, FormSelect, FormTextarea } from '../../components/owner/FormInput'
import { Button } from '../../components/common/Button'
import { Modal } from '../../components/admin/Modal'
import { EmptyState } from '../../components/common/EmptyState'
import { FOOD_LABELS, PG_TYPE_LABELS } from '../../types/owner'
import type { FoodOption, OwnerProperty, PgType, PropertyStatus } from '../../types/owner'

const FACILITY_OPTIONS = [
  'Air Conditioning',
  'High-speed WiFi',
  'Mess / Meals',
  'Laundry Service',
  'Daily Housekeeping',
  'Power Backup',
  'CCTV Security',
  'Parking',
  'Study Table',
  'Attached Bathroom',
]

const IMAGE_POOL = [
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
]

/** /owner/properties/:id/edit — edit listing with a live Explore-page preview. */
export function PropertyEdit() {
  const { id = '' } = useParams()
  const { properties, updateProperty, pushToast } = useOwnerStore()
  const property = properties.find((p) => p.id === id)

  useDocumentTitle(property ? `Edit ${property.name}` : 'Edit Property')

  const [form, setForm] = useState<OwnerProperty | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    if (property) setForm({ ...property, facilities: [...property.facilities], rules: [...property.rules], gallery: [...property.gallery] })
  }, [property])

  if (!property || !form) {
    return (
      <EmptyState
        title="Property not found"
        description="This demo property does not exist — reload to restore the original demo dataset."
        action={
          <Link to="/owner/properties" className="rounded-full bg-forest px-5 py-2.5 text-sm font-bold text-ivory hover:bg-forest-light">
            Back to properties
          </Link>
        }
      />
    )
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!form.name.trim()) next.name = 'PG name is required.'
    if (!form.description.trim()) next.description = 'Description is required.'
    if (!form.address.trim()) next.address = 'Address is required.'
    if (!form.locality.trim()) next.locality = 'Locality is required.'
    if (!form.city.trim()) next.city = 'City is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const save = () => {
    if (!validate()) return
    const { id: _id, ownerId: _ownerId, listedOn: _listedOn, ...patch } = form
    void _id
    void _ownerId
    void _listedOn
    updateProperty(property.id, patch)
    pushToast('Listing updated — Explore preview refreshed (demo).')
  }

  const set = <K extends keyof OwnerProperty>(key: K, value: OwnerProperty[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))

  return (
    <>
      <Link
        to={`/owner/properties/${property.id}`}
        className="mb-4 inline-flex items-center gap-2 text-[13px] font-bold text-forest transition-colors hover:text-gold-dark"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to property details
      </Link>

      <AdminPageHeader
        title={`Edit ${property.name}`}
        description="Update listing details below and watch the live Explore-page preview update as you type."
        actions={
          <>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-forest/25 bg-white px-5 py-2.5 text-sm font-semibold text-forest transition-all hover:border-forest hover:bg-forest hover:text-ivory"
            >
              <Eye className="h-4 w-4" aria-hidden />
              Full preview
            </button>
            <button
              type="button"
              onClick={save}
              className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory shadow-[0_10px_24px_-14px_rgba(23,61,50,0.9)] transition-all hover:bg-forest-light"
            >
              <Save className="h-4 w-4" aria-hidden />
              Save changes
            </button>
          </>
        }
      />

      <DemoBanner message="edits are written to local React state only — no backend, storage or real listing is involved." />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        {/* ------------------------------------------------------ edit form */}
        <div className="space-y-6">
          <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
            <h2 className="mb-4 text-base sm:text-lg">Basic details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                id="edit-name"
                label="Property Name"
                required
                value={form.name}
                onChange={(v) => set('name', v)}
                error={errors.name}
                className="sm:col-span-2"
              />
              <FormSelect
                id="edit-type"
                label="PG Type"
                value={form.type}
                onChange={(v) => set('type', v as PgType)}
                options={Object.entries(PG_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              />
              <FormSelect
                id="edit-food"
                label="Food Options"
                value={form.food}
                onChange={(v) => set('food', v as FoodOption)}
                options={Object.entries(FOOD_LABELS).map(([value, label]) => ({ value, label }))}
              />
              <FormSelect
                id="edit-status"
                label="Listing Visibility"
                value={form.status}
                onChange={(v) => set('status', v as PropertyStatus)}
                options={[
                  { value: 'ACTIVE', label: 'Active (visible)' },
                  { value: 'PENDING', label: 'Pending review' },
                  { value: 'DRAFT', label: 'Draft (hidden)' },
                  { value: 'PAUSED', label: 'Paused (hidden)' },
                ]}
                hint="Controls how the listing appears in this demo."
              />
              <FormInput
                id="edit-deposit"
                label="Security Deposit (₹)"
                type="number"
                min={0}
                value={String(form.securityDeposit)}
                onChange={(v) => set('securityDeposit', Number(v) || 0)}
              />
              <FormTextarea
                id="edit-description"
                label="Description"
                required
                rows={4}
                maxLength={600}
                value={form.description}
                onChange={(v) => set('description', v)}
                error={errors.description}
                className="sm:col-span-2"
              />
            </div>
          </section>

          <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
            <h2 className="mb-4 text-base sm:text-lg">Address & contact</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                id="edit-address"
                label="Complete Address"
                required
                value={form.address}
                onChange={(v) => set('address', v)}
                error={errors.address}
                className="sm:col-span-2"
              />
              <FormInput
                id="edit-locality"
                label="Locality"
                required
                value={form.locality}
                onChange={(v) => set('locality', v)}
                error={errors.locality}
              />
              <FormInput
                id="edit-city"
                label="City"
                required
                value={form.city}
                onChange={(v) => set('city', v)}
                error={errors.city}
              />
              <FormInput
                id="edit-phone"
                label="Contact Phone (demo)"
                value={form.contactPhone}
                onChange={(v) => set('contactPhone', v)}
                hint="Fictional placeholder — never a real number."
              />
              <FormInput
                id="edit-email"
                label="Contact Email (demo)"
                type="email"
                value={form.contactEmail}
                onChange={(v) => set('contactEmail', v)}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
            <h2 className="mb-4 text-base sm:text-lg">Amenities & rules</h2>
            <p className="form-label">Facilities / Amenities</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {FACILITY_OPTIONS.map((facility) => {
                const active = form.facilities.includes(facility)
                return (
                  <button
                    key={facility}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      set(
                        'facilities',
                        active
                          ? form.facilities.filter((f) => f !== facility)
                          : [...form.facilities, facility],
                      )
                    }
                    className={
                      active
                        ? 'rounded-full border border-forest bg-forest px-3.5 py-1.5 text-[12px] font-bold text-ivory'
                        : 'rounded-full border border-line bg-white px-3.5 py-1.5 text-[12px] font-bold text-ink-soft transition-colors hover:border-forest hover:text-forest'
                    }
                  >
                    {facility}
                  </button>
                )
              })}
            </div>

            <p className="form-label mt-5">Property Rules</p>
            <div className="mt-2 space-y-2">
              {form.rules.map((rule, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    value={rule}
                    aria-label={`Rule ${index + 1}`}
                    onChange={(event) =>
                      set(
                        'rules',
                        form.rules.map((r, i) => (i === index ? event.target.value : r)),
                      )
                    }
                    className="form-input"
                  />
                  <button
                    type="button"
                    onClick={() => set('rules', form.rules.filter((_, i) => i !== index))}
                    className="rounded-xl border border-danger/35 px-3.5 text-sm font-bold text-danger hover:bg-danger hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => set('rules', [...form.rules, ''])}
                className="rounded-full border border-forest/25 px-4 py-2 text-xs font-bold text-forest hover:bg-forest hover:text-ivory"
              >
                + Add rule
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
            <h2 className="mb-1 text-base sm:text-lg">Logo & images</h2>
            <p className="mb-4 text-[12.5px] text-ink-mute">
              Pick from the sample photo pool — frontend demo only, no real upload happens.
            </p>
            <p className="form-label">Cover image</p>
            <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-6">
              {IMAGE_POOL.map((src) => (
                <button
                  key={src}
                  type="button"
                  aria-pressed={form.coverImage === src}
                  onClick={() => set('coverImage', src)}
                  className={
                    form.coverImage === src
                      ? 'overflow-hidden rounded-xl ring-2 ring-forest ring-offset-2'
                      : 'overflow-hidden rounded-xl ring-1 ring-line transition-shadow hover:ring-gold'
                  }
                >
                  <img src={src} alt="Cover option (demo)" className="h-16 w-full object-cover" />
                </button>
              ))}
            </div>
            <p className="form-label mt-5">Gallery images</p>
            <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-6">
              {IMAGE_POOL.map((src) => {
                const active = form.gallery.includes(src)
                return (
                  <button
                    key={src}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      set(
                        'gallery',
                        active ? form.gallery.filter((g) => g !== src) : [...form.gallery, src],
                      )
                    }
                    className={
                      active
                        ? 'relative overflow-hidden rounded-xl ring-2 ring-forest ring-offset-2'
                        : 'relative overflow-hidden rounded-xl ring-1 ring-line transition-shadow hover:ring-gold'
                    }
                  >
                    <img src={src} alt="Gallery option (demo)" className="h-16 w-full object-cover" />
                    <span
                      className={
                        active
                          ? 'absolute right-1 top-1 rounded-full bg-forest px-1.5 py-0.5 text-[9px] font-bold text-ivory'
                          : 'absolute right-1 top-1 rounded-full bg-white/85 px-1.5 py-0.5 text-[9px] font-bold text-ink-mute'
                      }
                    >
                      {active ? '✓' : '+'}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setForm({ ...property, facilities: [...property.facilities], rules: [...property.rules], gallery: [...property.gallery] })}>
              Reset
            </Button>
            <Button variant="primary" onClick={save}>
              <Save className="h-4 w-4" aria-hidden />
              Save changes
            </Button>
          </div>
        </div>

        {/* --------------------------------------------------- live preview */}
        <aside className="h-fit xl:sticky xl:top-24">
          <div className="rounded-3xl border border-line bg-white p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base">
                <Eye className="h-4 w-4 text-gold-dark" aria-hidden />
                Explore preview
              </h2>
              <span className="rounded-full bg-gold-soft px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider text-gold-dark">
                Live
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-line">
              <div className="relative h-36">
                <img src={form.coverImage} alt="Cover preview" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/75 to-transparent" aria-hidden />
                <div className="absolute bottom-3 left-3.5 right-3.5">
                  <div className="mb-1.5 flex gap-1.5">
                    <span className="rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ink">
                      {PG_TYPE_LABELS[form.type]}
                    </span>
                    <span className="rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ink">
                      Demo
                    </span>
                  </div>
                  <p className="truncate text-[15px] font-bold text-white drop-shadow">
                    {form.name || 'Untitled PG'}
                  </p>
                  <p className="truncate text-[11px] text-white/85">
                    {form.locality || 'Locality'}, {form.city}
                  </p>
                </div>
              </div>
              <div className="p-3.5">
                <p className="line-clamp-3 text-[12px] leading-relaxed text-ink-soft">
                  {form.description || 'No description yet.'}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {form.facilities.slice(0, 4).map((facility) => (
                    <span key={facility} className="rounded-full bg-ivory px-2 py-0.5 text-[10px] font-semibold text-ink-soft">
                      {facility}
                    </span>
                  ))}
                  {form.facilities.length > 4 && (
                    <span className="rounded-full bg-ivory px-2 py-0.5 text-[10px] font-semibold text-ink-mute">
                      +{form.facilities.length - 4}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                  <span className="text-[11px] text-ink-mute">
                    {FOOD_LABELS[form.food]}
                  </span>
                  <span className="text-[13px] font-bold text-forest">
                    ₹{form.securityDeposit.toLocaleString('en-IN')} deposit
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-ink-mute">
              This is how the card could appear on the public Explore PG page — preview only,
              nothing is published.
            </p>
          </div>
        </aside>
      </div>

      {/* Full preview modal */}
      <Modal open={previewOpen} title="Explore page preview" subtitle="Simulated public appearance — demo only." onClose={() => setPreviewOpen(false)} size="lg">
        <div className="overflow-hidden rounded-2xl border border-line">
          <div className="relative h-56">
            <img src={form.coverImage} alt="Cover preview" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" aria-hidden />
            <div className="absolute bottom-5 left-5 right-5">
              <div className="mb-2 flex gap-2">
                <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink">
                  {PG_TYPE_LABELS[form.type]}
                </span>
                <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink">
                  {form.status}
                </span>
              </div>
              <h3 className="text-2xl text-white drop-shadow">{form.name || 'Untitled PG'}</h3>
              <p className="text-sm text-white/85">
                {form.locality}, {form.city}
              </p>
            </div>
          </div>
          <div className="space-y-3 p-5">
            <p className="text-sm leading-relaxed text-ink-soft">{form.description}</p>
            <p className="text-[13px] text-ink-soft">{form.address}</p>
            <div className="flex flex-wrap gap-2">
              {form.facilities.map((facility) => (
                <span key={facility} className="rounded-full bg-ivory px-3 py-1 text-[11.5px] font-semibold text-ink-soft">
                  {facility}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 border-t border-line pt-3 text-center">
              {form.gallery.slice(0, 3).map((src) => (
                <img key={src} src={src} alt="Gallery preview" className="h-24 w-full rounded-xl object-cover" />
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
