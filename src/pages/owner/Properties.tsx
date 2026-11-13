import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Building2, Filter, Plus } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { aggregateRooms, useOwnerStore } from '../../context/OwnerStore'
import type { PropertyInput } from '../../context/OwnerStore'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { SearchInput, FilterSelect } from '../../components/admin/Filters'
import { Modal } from '../../components/admin/Modal'
import { PropertyCard } from '../../components/owner/PropertyCard'
import { FormInput, FormSelect, FormTextarea } from '../../components/owner/FormInput'
import { EmptyState } from '../../components/common/EmptyState'
import { Button } from '../../components/common/Button'
import type { FoodOption, PgType, PropertyStatus } from '../../types/owner'
import { PG_TYPE_LABELS, FOOD_LABELS } from '../../types/owner'

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
]

const EMPTY_FORM: PropertyInput = {
  name: '',
  type: 'BOYS',
  description: '',
  city: 'Jaipur',
  address: '',
  locality: '',
  contactPhone: '98765 43099',
  contactEmail: 'demo@rahomitra.demo',
  securityDeposit: 10000,
  facilities: [],
  food: 'INCLUDED',
  rules: [],
  coverImage: IMAGE_POOL[0],
  gallery: IMAGE_POOL.slice(0, 3),
}

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'ALL', label: 'Any status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PAUSED', label: 'Paused' },
]

const TYPE_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Any PG type' },
  ...Object.entries(PG_TYPE_LABELS).map(([value, label]) => ({ value, label })),
]

/** /owner/properties — manage every PG owned by the demo owner. */
export function Properties() {
  useDocumentTitle('My PG Properties')

  const {
    properties,
    rooms,
    scopedPropertyIds,
    selectedPropertyId,
    addProperty,
    setPropertyStatus,
  } = useOwnerStore()

  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [addOpen, setAddOpen] = useState(false)

  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setAddOpen(true)
      const next = new URLSearchParams(searchParams)
      next.delete('add')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const [form, setForm] = useState<PropertyInput>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Only ever the demo owner's own properties, further narrowed by the switcher.
  const ownProperties = useMemo(
    () => properties.filter((p) => scopedPropertyIds.includes(p.id)),
    [properties, scopedPropertyIds],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ownProperties.filter((p) => {
      if (typeFilter !== 'ALL' && p.type !== typeFilter) return false
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false
      if (q && !`${p.name} ${p.city} ${p.locality}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [ownProperties, query, typeFilter, statusFilter])

  const statsFor = (propertyId: string) => {
    const agg = aggregateRooms(rooms.filter((r) => r.propertyId === propertyId))
    return {
      rooms: agg.totalRooms,
      beds: agg.totalBeds,
      occupied: agg.occupied,
      available: agg.available,
    }
  }

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (!form.name.trim()) next.name = 'PG name is required.'
    if (!form.description.trim()) next.description = 'Description is required.'
    if (!form.city.trim()) next.city = 'City is required.'
    if (!form.address.trim()) next.address = 'Complete address is required.'
    if (!form.locality.trim()) next.locality = 'Locality is required.'
    if (!form.contactEmail.trim()) next.contactEmail = 'Contact email is required.'
    if (form.securityDeposit < 0) next.securityDeposit = 'Deposit cannot be negative.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = () => {
    if (!validate()) return
    addProperty(form)
    setForm(EMPTY_FORM)
    setErrors({})
    setAddOpen(false)
  }

  const toggleFacility = (facility: string) => {
    setForm((prev) => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter((f) => f !== facility)
        : [...prev.facilities, facility],
    }))
  }

  const addRule = () => {
    setForm((prev) => ({ ...prev, rules: [...prev.rules, ''] }))
  }
  const setRule = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      rules: prev.rules.map((r, i) => (i === index ? value : r)),
    }))
  }

  return (
    <>
      <AdminPageHeader
        title="My PG Properties"
        description="View, create and manage every PG listing owned by this demo account."
        actions={
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory shadow-[0_10px_24px_-14px_rgba(23,61,50,0.9)] transition-all hover:bg-forest-light"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add New PG
          </button>
        }
      />

      <DemoBanner message="these are fictional sample PGs owned by the demo owner — listings, stats and statuses are local demo state only." />

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-3xl border border-line bg-white p-4 shadow-card">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search by PG name, city or locality…"
        />
        <FilterSelect label="Type" value={typeFilter} onChange={setTypeFilter} options={TYPE_FILTER_OPTIONS} />
        <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
        <span className="ml-auto inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-mute">
          <Filter className="h-3.5 w-3.5" aria-hidden />
          {filtered.length} of {ownProperties.length} properties
          {selectedPropertyId !== 'ALL' && ' (switcher scope)'}
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No properties found"
          description="No demo PGs match the current search or filters. Clear the filters or add a new PG."
          icon={<Building2 className="h-6 w-6" aria-hidden />}
          action={
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setTypeFilter('ALL')
                setStatusFilter('ALL')
              }}
              className="rounded-full border border-forest/25 px-5 py-2.5 text-sm font-bold text-forest transition-colors hover:bg-forest hover:text-ivory"
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((property) => (
            <div key={property.id} className="flex flex-col gap-3">
              <PropertyCard property={property} stats={statsFor(property.id)} />
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-white px-4 py-3 shadow-card">
                <span className="text-[11.5px] font-bold uppercase tracking-wider text-ink-mute">
                  Listing status
                </span>
                <select
                  value={property.status}
                  aria-label={`Listing status for ${property.name}`}
                  onChange={(event) =>
                    setPropertyStatus(property.id, event.target.value as PropertyStatus)
                  }
                  className="form-input ml-auto w-auto rounded-full px-3 py-1.5 text-xs font-bold"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PAUSED">Paused</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ------------------------------------------------- Add PG modal */}
      <Modal
        open={addOpen}
        title="Add New PG"
        subtitle="Frontend demo — this form only writes to local React state; nothing is uploaded or saved."
        onClose={() => setAddOpen(false)}
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submit}>
              Create PG (demo)
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            id="pg-name"
            label="PG Name"
            required
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            placeholder="e.g. Sunrise Boys PG"
            error={errors.name}
            className="sm:col-span-2"
          />
          <FormSelect
            id="pg-type"
            label="PG Type"
            required
            value={form.type}
            onChange={(v) => setForm({ ...form, type: v as PgType })}
            options={Object.entries(PG_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <FormSelect
            id="pg-food"
            label="Food Availability"
            value={form.food}
            onChange={(v) => setForm({ ...form, food: v as FoodOption })}
            options={Object.entries(FOOD_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <FormTextarea
            id="pg-description"
            label="Description"
            required
            rows={3}
            maxLength={500}
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
            placeholder="Describe the property (demo text only)…"
            error={errors.description}
            className="sm:col-span-2"
          />
          <FormInput
            id="pg-city"
            label="City"
            required
            value={form.city}
            onChange={(v) => setForm({ ...form, city: v })}
            error={errors.city}
          />
          <FormInput
            id="pg-locality"
            label="Locality"
            required
            value={form.locality}
            onChange={(v) => setForm({ ...form, locality: v })}
            placeholder="e.g. Malviya Nagar"
            error={errors.locality}
          />
          <FormInput
            id="pg-address"
            label="Complete Address"
            required
            value={form.address}
            onChange={(v) => setForm({ ...form, address: v })}
            placeholder="House no., street, city, PIN"
            error={errors.address}
            className="sm:col-span-2"
          />
          <FormInput
            id="pg-phone"
            label="Contact Phone (demo)"
            value={form.contactPhone}
            onChange={(v) => setForm({ ...form, contactPhone: v })}
            hint="Fictional placeholder only — never a real number."
          />
          <FormInput
            id="pg-email"
            label="Contact Email (demo)"
            required
            type="email"
            value={form.contactEmail}
            onChange={(v) => setForm({ ...form, contactEmail: v })}
            error={errors.contactEmail}
            hint="Use the @rahomitra.demo domain."
          />
          <FormInput
            id="pg-deposit"
            label="Security Deposit (₹)"
            type="number"
            min={0}
            value={String(form.securityDeposit)}
            onChange={(v) => setForm({ ...form, securityDeposit: Number(v) || 0 })}
            error={errors.securityDeposit}
          />

          {/* Facilities */}
          <fieldset className="sm:col-span-2">
            <legend className="form-label">Facilities</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {FACILITY_OPTIONS.map((facility) => {
                const active = form.facilities.includes(facility)
                return (
                  <button
                    key={facility}
                    type="button"
                    onClick={() => toggleFacility(facility)}
                    aria-pressed={active}
                    className={
                      active
                        ? 'rounded-full border border-forest bg-forest px-3.5 py-1.5 text-[12px] font-bold text-ivory transition-colors'
                        : 'rounded-full border border-line bg-white px-3.5 py-1.5 text-[12px] font-bold text-ink-soft transition-colors hover:border-forest hover:text-forest'
                    }
                  >
                    {facility}
                  </button>
                )
              })}
            </div>
          </fieldset>

          {/* Rules */}
          <fieldset className="sm:col-span-2">
            <legend className="form-label">Property Rules</legend>
            <div className="mt-2 space-y-2">
              {form.rules.length === 0 && (
                <p className="text-[12px] text-ink-mute">No rules added yet.</p>
              )}
              {form.rules.map((rule, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    value={rule}
                    aria-label={`Rule ${index + 1}`}
                    onChange={(event) => setRule(index, event.target.value)}
                    placeholder="e.g. No smoking inside rooms"
                    className="form-input"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        rules: prev.rules.filter((_, i) => i !== index),
                      }))
                    }
                    className="rounded-xl border border-danger/35 px-3.5 text-sm font-bold text-danger transition-colors hover:bg-danger hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addRule}
                className="rounded-full border border-forest/25 px-4 py-2 text-xs font-bold text-forest transition-colors hover:bg-forest hover:text-ivory"
              >
                + Add rule
              </button>
            </div>
          </fieldset>

          {/* Cover image (pick from demo pool — no real upload) */}
          <div className="sm:col-span-2">
            <p className="form-label">Cover Image (demo selection — no real upload)</p>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {IMAGE_POOL.map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setForm({ ...form, coverImage: src })}
                  aria-pressed={form.coverImage === src}
                  className={
                    form.coverImage === src
                      ? 'overflow-hidden rounded-2xl ring-2 ring-forest ring-offset-2'
                      : 'overflow-hidden rounded-2xl ring-1 ring-line transition-shadow hover:ring-gold'
                  }
                >
                  <img src={src} alt="Demo cover option" className="h-20 w-full object-cover" />
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-ink-mute">
              Gallery images are pre-filled with sample photos for this demo.
            </p>
          </div>
        </div>
      </Modal>
    </>
  )
}
