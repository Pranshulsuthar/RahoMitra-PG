import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Image as ImageIcon, Megaphone, Pencil, Plus, Power, Trash2, Upload } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdminStore } from '../../context/AdminStore'
import type { AdCategory, AdPlacement, Advertisement } from '../../types/admin'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DataTable } from '../../components/admin/DataTable'
import type { Column } from '../../components/admin/DataTable'
import { FilterSelect, SearchInput } from '../../components/admin/Filters'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { Modal } from '../../components/admin/Modal'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { formatINR } from '../../utils/format'
import { cn } from '../../utils/cn'

const CATEGORIES: AdCategory[] = [
  'Tiffin Services',
  'Laundry Services',
  'Furniture',
  'Internet Services',
  'Local Transport',
  'Other Relevant Services',
]

const PLACEMENTS: AdPlacement[] = ['Explore Banner', 'Listing Card', 'Sidebar Rail', 'Home Footer']

interface AdFormState {
  businessName: string
  category: AdCategory
  title: string
  description: string
  destinationUrl: string
  imagePreview: string
  targetCity: string
  targetLocality: string
  placement: AdPlacement
  startOn: string
  endOn: string
  price: string
}

const EMPTY_FORM: AdFormState = {
  businessName: '',
  category: 'Tiffin Services',
  title: '',
  description: '',
  destinationUrl: '',
  imagePreview: '',
  targetCity: 'Jaipur',
  targetLocality: '',
  placement: 'Explore Banner',
  startOn: '2026-05-14',
  endOn: '2026-06-14',
  price: '2000',
}

/** /admin/advertisements — platform ad campaign management. */
export function Advertisements() {
  useDocumentTitle('Advertisements')

  const { advertisements, createAdvertisement, updateAdvertisement, setAdvertisementStatus, deleteAdvertisement, pushToast } =
    useAdminStore()

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<'ALL' | AdCategory>('ALL')
  const [status, setStatus] = useState<'ALL' | Advertisement['status']>('ALL')
  const [form, setForm] = useState<AdFormState>(EMPTY_FORM)
  const [editing, setEditing] = useState<Advertisement | null>(null)
  const [creating, setCreating] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof AdFormState, string>>>({})
  const [toggling, setToggling] = useState<Advertisement | null>(null)
  const [deleting, setDeleting] = useState<Advertisement | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return advertisements.filter(
      (a) =>
        (!q ||
          a.businessName.toLowerCase().includes(q) ||
          a.title.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q)) &&
        (category === 'ALL' || a.category === category) &&
        (status === 'ALL' || a.status === status),
    )
  }, [advertisements, search, category, status])

  const openCreate = () => {
    setEditing(null)
    setCreating(true)
    setForm(EMPTY_FORM)
    setErrors({})
  }

  const openEdit = (ad: Advertisement) => {
    setEditing(ad)
    setCreating(false)
    setForm({
      businessName: ad.businessName,
      category: ad.category,
      title: ad.title,
      description: ad.description,
      destinationUrl: ad.destinationUrl,
      imagePreview: ad.imagePreview,
      targetCity: ad.targetCity,
      targetLocality: ad.targetLocality,
      placement: ad.placement,
      startOn: ad.startOn,
      endOn: ad.endOn,
      price: String(ad.price),
    })
    setErrors({})
  }

  const closeForm = () => {
    setEditing(null)
    setCreating(false)
  }

  /* Local-only image preview — object URLs never leave the browser. */
  const onPickImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, imagePreview: 'Please choose an image file.' }))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setForm((prev) => ({ ...prev, imagePreview: String(reader.result) }))
      setErrors((prev) => ({ ...prev, imagePreview: undefined }))
    }
    reader.readAsDataURL(file)
  }

  const validate = (): boolean => {
    const next: typeof errors = {}
    if (form.businessName.trim().length < 2) next.businessName = 'Business name is required.'
    if (form.title.trim().length < 4) next.title = 'Ad title must be at least 4 characters.'
    if (form.description.trim().length < 10) next.description = 'Add a short description (10+ characters).'
    if (!/^https?:\/\/.+/i.test(form.destinationUrl.trim()))
      next.destinationUrl = 'Enter a valid destination URL (https://…).'
    if (form.targetCity.trim().length < 2) next.targetCity = 'Target city is required.'
    const price = Number(form.price)
    if (!Number.isFinite(price) || price <= 0) next.price = 'Enter a valid advertising price.'
    if (!form.startOn) next.startOn = 'Campaign start date is required.'
    if (!form.endOn) next.endOn = 'Campaign end date is required.'
    if (form.startOn && form.endOn && form.endOn <= form.startOn)
      next.endOn = 'End date must be after the start date.'
    if (!form.imagePreview) next.imagePreview = 'Add an image (local preview only).'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!validate()) return
    const payload = {
      businessName: form.businessName.trim(),
      category: form.category,
      title: form.title.trim(),
      description: form.description.trim(),
      destinationUrl: form.destinationUrl.trim(),
      imagePreview: form.imagePreview,
      targetCity: form.targetCity.trim(),
      targetLocality: form.targetLocality.trim() || 'All localities',
      placement: form.placement,
      startOn: form.startOn,
      endOn: form.endOn,
      price: Number(form.price),
    }
    if (editing) {
      updateAdvertisement(editing.id, payload)
      pushToast(`Campaign ${editing.id} updated.`)
    } else {
      createAdvertisement({ ...payload, status: 'ACTIVE' })
      pushToast(`Campaign for “${payload.businessName}” created.`)
    }
    closeForm()
  }

  const confirmToggle = () => {
    if (!toggling) return
    const next = toggling.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    setAdvertisementStatus(toggling.id, next)
    pushToast(`Campaign ${toggling.id} ${next === 'ACTIVE' ? 'activated' : 'paused'}.`, next === 'ACTIVE' ? 'success' : 'error')
    setToggling(null)
  }

  const confirmDelete = () => {
    if (!deleting) return
    deleteAdvertisement(deleting.id)
    pushToast(`Campaign ${deleting.id} deleted.`, 'error')
    setDeleting(null)
  }

  const field = (key: keyof AdFormState) => ({
    value: form[key],
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [key]: event.target.value }))
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    },
  })

  const columns: Array<Column<Advertisement>> = [
    {
      key: 'id',
      header: 'Campaign ID',
      sortValue: (a) => a.id,
      render: (a) => <span className="whitespace-nowrap font-mono text-xs text-ink-soft">{a.id}</span>,
    },
    {
      key: 'business',
      header: 'Business Name',
      sortValue: (a) => a.businessName,
      render: (a) => (
        <div className="flex items-center gap-2.5">
          <img src={a.imagePreview} alt="" loading="lazy" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
          <span className="min-w-0">
            <span className="block truncate font-semibold text-ink">{a.businessName}</span>
            <span className="block truncate text-[11.5px] text-ink-mute">{a.title}</span>
          </span>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortValue: (a) => a.category,
      render: (a) => (
        <span className="whitespace-nowrap rounded-full border border-line bg-ivory px-2.5 py-0.5 text-[11px] font-semibold text-ink-soft">
          {a.category}
        </span>
      ),
    },
    {
      key: 'placement',
      header: 'Placement',
      sortValue: (a) => a.placement,
      render: (a) => (
        <div>
          <span className="block whitespace-nowrap">{a.placement}</span>
          <span className="block whitespace-nowrap text-[11px] text-ink-mute">
            {a.targetCity}
            {a.targetLocality ? ` · ${a.targetLocality}` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      sortValue: (a) => a.startOn,
      render: (a) => (
        <span className="whitespace-nowrap tabular-nums">
          {a.startOn} → {a.endOn}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      sortValue: (a) => a.price,
      render: (a) => (
        <span className="whitespace-nowrap font-semibold tabular-nums text-forest">{formatINR(a.price)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (a) => a.status,
      render: (a) => <StatusBadge status={a.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (a) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => openEdit(a)}
            className="inline-flex items-center gap-1.5 rounded-full border border-forest/25 bg-white px-3.5 py-1.5 text-xs font-bold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setToggling(a)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors',
              a.status === 'ACTIVE'
                ? 'border border-danger/40 bg-white text-danger hover:bg-danger hover:text-white'
                : 'bg-forest text-ivory hover:bg-forest-light',
            )}
          >
            <Power className="h-3.5 w-3.5" aria-hidden />
            {a.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </button>
          <button
            type="button"
            onClick={() => setDeleting(a)}
            className="inline-flex items-center gap-1.5 rounded-full border border-danger/40 bg-white px-3.5 py-1.5 text-xs font-bold text-danger transition-colors hover:bg-danger hover:text-white"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <AdminPageHeader
        title="Advertisements"
        description="Manage illustrative ad campaigns across the RahoMitra platform — category, placement, targeting, flight dates and price."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory shadow-[0_10px_24px_-14px_rgba(23,61,50,0.9)] transition-colors hover:bg-forest-light"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Create advertisement
          </button>
        }
      />

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(a) => a.id}
        pageSize={8}
        emptyTitle="No campaigns match"
        emptyDescription="Try clearing the search or selecting a different category or status."
        toolbar={
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <SearchInput value={search} onChange={setSearch} placeholder="Search campaigns…" />
            <div className="flex flex-wrap items-center gap-3">
              <FilterSelect
                label="Category"
                value={category}
                onChange={(value) => setCategory(value as 'ALL' | AdCategory)}
                options={[
                  { value: 'ALL', label: 'All categories' },
                  ...CATEGORIES.map((c) => ({ value: c, label: c })),
                ]}
              />
              <FilterSelect
                label="Status"
                value={status}
                onChange={(value) => setStatus(value as 'ALL' | Advertisement['status'])}
                options={[
                  { value: 'ALL', label: 'All statuses' },
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'PAUSED', label: 'Paused' },
                  { value: 'EXPIRED', label: 'Expired' },
                  { value: 'DRAFT', label: 'Draft' },
                ]}
              />
            </div>
          </div>
        }
      />

      {/* ------------------------------------------------------ create/edit */}
      <Modal
        open={creating || editing !== null}
        title={editing ? `Edit ${editing.id}` : 'Create advertisement'}
        subtitle="Configure ad creative, destination link, category and placement."
        onClose={closeForm}
        size="lg"
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
              form="ad-form"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-forest-light"
            >
              {editing ? 'Save changes' : 'Create campaign'}
            </button>
          </>
        }
      >
        <form id="ad-form" onSubmit={submit} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ad-business" className="form-label">
                Business name<span className="ml-1 text-danger">*</span>
              </label>
              <input id="ad-business" className="form-input" placeholder="e.g. Annapurna Tiffin Services" {...field('businessName')} />
              {errors.businessName && <span className="form-error" role="alert">{errors.businessName}</span>}
            </div>
            <div>
              <label htmlFor="ad-category" className="form-label">
                Category<span className="ml-1 text-danger">*</span>
              </label>
              <select id="ad-category" className="form-input" {...field('category')}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="ad-title" className="form-label">
              Advertisement title<span className="ml-1 text-danger">*</span>
            </label>
            <input id="ad-title" className="form-input" placeholder="e.g. Home-style tiffin from ₹2,499/month" {...field('title')} />
            {errors.title && <span className="form-error" role="alert">{errors.title}</span>}
          </div>

          <div>
            <label htmlFor="ad-description" className="form-label">
              Description<span className="ml-1 text-danger">*</span>
            </label>
            <textarea id="ad-description" rows={3} className="form-input resize-y" placeholder="Short ad copy…" {...field('description')} />
            {errors.description && <span className="form-error" role="alert">{errors.description}</span>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ad-url" className="form-label">
                Destination URL<span className="ml-1 text-danger">*</span>
              </label>
              <input id="ad-url" className="form-input" placeholder="https://example.com" {...field('destinationUrl')} />
              {errors.destinationUrl && <span className="form-error" role="alert">{errors.destinationUrl}</span>}
            </div>
            <div>
              <label htmlFor="ad-placement" className="form-label">
                Placement<span className="ml-1 text-danger">*</span>
              </label>
              <select id="ad-placement" className="form-input" {...field('placement')}>
                {PLACEMENTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ad-city" className="form-label">
                Target city<span className="ml-1 text-danger">*</span>
              </label>
              <input id="ad-city" className="form-input" {...field('targetCity')} />
              {errors.targetCity && <span className="form-error" role="alert">{errors.targetCity}</span>}
            </div>
            <div>
              <label htmlFor="ad-locality" className="form-label">
                Target locality
              </label>
              <input id="ad-locality" className="form-input" placeholder="e.g. Malviya Nagar" {...field('targetLocality')} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="ad-start" className="form-label">
                Start date<span className="ml-1 text-danger">*</span>
              </label>
              <input id="ad-start" type="date" className="form-input" {...field('startOn')} />
              {errors.startOn && <span className="form-error" role="alert">{errors.startOn}</span>}
            </div>
            <div>
              <label htmlFor="ad-end" className="form-label">
                End date<span className="ml-1 text-danger">*</span>
              </label>
              <input id="ad-end" type="date" className="form-input" {...field('endOn')} />
              {errors.endOn && <span className="form-error" role="alert">{errors.endOn}</span>}
            </div>
            <div>
              <label htmlFor="ad-price" className="form-label">
                Price (₹)<span className="ml-1 text-danger">*</span>
              </label>
              <input id="ad-price" type="number" min={1} className="form-input" {...field('price')} />
              {errors.price && <span className="form-error" role="alert">{errors.price}</span>}
            </div>
          </div>

          <div>
            <span className="form-label">
              Advertisement image<span className="ml-1 text-danger">*</span>
            </span>
            <div className="flex flex-wrap items-center gap-4">
              {form.imagePreview ? (
                <img
                  src={form.imagePreview}
                  alt="Ad preview"
                  className="h-24 w-36 rounded-xl border border-line object-cover"
                />
              ) : (
                <span className="flex h-24 w-36 items-center justify-center rounded-xl border border-dashed border-line bg-ivory/60 text-ink-mute">
                  <ImageIcon className="h-6 w-6" aria-hidden />
                </span>
              )}
              <div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-full border border-forest/25 bg-white px-4 py-2 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
                >
                  <Upload className="h-4 w-4" aria-hidden />
                  Choose image
                </button>
                <span className="mt-1.5 block text-[11px] text-ink-mute">
                  Choose a JPG, PNG or WebP image (max 5MB).
                </span>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onPickImage}
                className="hidden"
                aria-label="Choose advertisement image"
              />
            </div>
            {errors.imagePreview && <span className="form-error" role="alert">{errors.imagePreview}</span>}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={toggling !== null}
        title={toggling?.status === 'ACTIVE' ? 'Deactivate campaign?' : 'Activate campaign?'}
        message={
          <>
            {toggling?.status === 'ACTIVE' ? (
              <>
                Deactivate campaign <strong className="font-semibold text-ink">{toggling?.id}</strong> (
                {toggling?.businessName})?
              </>
            ) : (
              <>
                Activate campaign <strong className="font-semibold text-ink">{toggling?.id}</strong> (
                {toggling?.businessName})?
              </>
            )}
          </>
        }
        confirmLabel={toggling?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        danger={toggling?.status === 'ACTIVE'}
        onConfirm={confirmToggle}
        onCancel={() => setToggling(null)}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Delete campaign?"
        message={
          <>
            Permanently delete campaign{' '}
            <strong className="font-semibold text-ink">{deleting?.id}</strong> (
            {deleting?.businessName})?
          </>
        }
        confirmLabel="Delete campaign"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />

      {advertisements.length === 0 && (
        <p className="mt-6 flex items-center gap-2 text-[11.5px] text-ink-mute">
          <Megaphone className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
          No ad campaigns configured yet.
        </p>
      )}
    </>
  )
}
