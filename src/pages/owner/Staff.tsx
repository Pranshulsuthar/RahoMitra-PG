import { useMemo, useState } from 'react'
import { Mail, Phone, UserCog, Plus, Trash2, PencilLine } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useOwnerStore } from '../../context/OwnerStore'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { SearchInput, FilterSelect } from '../../components/admin/Filters'
import { Modal } from '../../components/admin/Modal'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { DataTable } from '../../components/admin/DataTable'
import type { Column } from '../../components/admin/DataTable'
import { StatisticCard } from '../../components/owner/StatisticCard'
import { FormInput, FormSelect } from '../../components/owner/FormInput'
import { STAFF_ROLE_LABELS } from '../../types/owner'
import type { StaffMember, StaffRole } from '../../types/owner'

interface StaffForm {
  propertyId: string
  name: string
  email: string
  mobile: string
  role: StaffRole
}

const ROLE_OPTIONS = Object.entries(STAFF_ROLE_LABELS).map(([value, label]) => ({ value, label }))

/** /owner/staff — manage on-ground staff for the demo owner's properties. */
export function Staff() {
  useDocumentTitle('Staff Management')

  const {
    staff,
    properties,
    scopedPropertyIds,
    selectedPropertyId,
    addStaff,
    updateStaff,
    removeStaff,
  } = useOwnerStore()

  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<StaffMember | null>(null)
  const [removing, setRemoving] = useState<StaffMember | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState<StaffForm>({
    propertyId: scopedPropertyIds[0] ?? '',
    name: '',
    email: '',
    mobile: '',
    role: 'MANAGER',
  })

  const ownProperties = useMemo(
    () => properties.filter((p) => scopedPropertyIds.includes(p.id)),
    [properties, scopedPropertyIds],
  )

  const ownStaff = useMemo(
    () => staff.filter((s) => scopedPropertyIds.includes(s.propertyId)),
    [staff, scopedPropertyIds],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ownStaff.filter((member) => {
      if (roleFilter !== 'ALL' && member.role !== roleFilter) return false
      if (q && !`${member.name} ${member.email} ${member.mobile}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [ownStaff, query, roleFilter])

  const propertyOptions = ownProperties.map((p) => ({ value: p.id, label: p.name }))

  const openAdd = () => {
    setForm({
      propertyId: selectedPropertyId !== 'ALL' ? selectedPropertyId : (scopedPropertyIds[0] ?? ''),
      name: '',
      email: '',
      mobile: '',
      role: 'MANAGER',
    })
    setErrors({})
    setAddOpen(true)
  }

  const openEdit = (member: StaffMember) => {
    setEditing(member)
    setForm({
      propertyId: member.propertyId,
      name: member.name,
      email: member.email,
      mobile: member.mobile,
      role: member.role,
    })
    setErrors({})
  }

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (!form.propertyId) next.propertyId = 'Select a PG property.'
    if (!form.name.trim()) next.name = 'Full name is required.'
    if (!form.email.trim()) next.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email.'
    if (!form.mobile.trim()) next.mobile = 'Mobile number is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submitAdd = () => {
    if (!validate()) return
    addStaff(form)
    setAddOpen(false)
  }

  const submitEdit = () => {
    if (!editing || !validate()) return
    updateStaff(editing.id, form)
    setEditing(null)
  }

  const confirmRemove = () => {
    if (!removing) return
    removeStaff(removing.id)
    setRemoving(null)
  }

  const columns: Array<Column<StaffMember>> = [
    {
      key: 'name',
      header: 'Staff member',
      sortValue: (s) => s.name,
      render: (s) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-soft text-[11px] font-bold text-forest">
            {s.name
              .replace(/\(demo\)/i, '')
              .trim()
              .split(' ')
              .map((w) => w[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-ink">{s.name}</span>
            <span className="block truncate text-[11.5px] text-ink-mute">{s.email}</span>
          </span>
        </div>
      ),
    },
    {
      key: 'mobile',
      header: 'Mobile',
      sortValue: (s) => s.mobile,
      render: (s) => <span className="whitespace-nowrap">{s.mobile} (demo)</span>,
    },
    {
      key: 'role',
      header: 'Role',
      sortValue: (s) => s.role,
      render: (s) => (
        <span className="rounded-full border border-line bg-ivory px-3 py-1 text-[11.5px] font-bold text-ink-soft">
          {STAFF_ROLE_LABELS[s.role]}
        </span>
      ),
    },
    {
      key: 'property',
      header: 'Assigned PG',
      sortValue: (s) => properties.find((p) => p.id === s.propertyId)?.name ?? '',
      render: (s) => (
        <span className="font-semibold text-ink-soft">
          {properties.find((p) => p.id === s.propertyId)?.name ?? '—'}
        </span>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      sortValue: (s) => s.joinedOn,
      render: (s) => <span className="whitespace-nowrap">{s.joinedOn}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (s) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => openEdit(s)}
            aria-label={`Edit ${s.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-soft transition-colors hover:border-forest hover:text-forest"
          >
            <PencilLine className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setRemoving(s)}
            aria-label={`Remove ${s.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-soft transition-colors hover:border-danger hover:text-danger"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      ),
    },
  ]

  const roleCounts = Object.keys(STAFF_ROLE_LABELS).map((role) => ({
    role: role as StaffRole,
    count: ownStaff.filter((s) => s.role === role).length,
  }))

  return (
    <>
      <AdminPageHeader
        title="Staff Management"
        description="Add, edit and remove staff assigned to your demo PG properties."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory shadow-[0_10px_24px_-14px_rgba(23,61,50,0.9)] transition-all hover:bg-forest-light"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add Staff
          </button>
        }
      />

      <DemoBanner message="staff records are fictional demo data — no staff accounts, logins or permissions exist." />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatisticCard label="Total Staff" value={ownStaff.length} icon={UserCog} tone="ink" />
        {roleCounts.map((entry) => (
          <StatisticCard
            key={entry.role}
            label={STAFF_ROLE_LABELS[entry.role]}
            value={entry.count}
            icon={UserCog}
            tone="forest"
          />
        ))}
      </div>

      <div className="rounded-3xl border border-line bg-white p-4 shadow-card">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Search staff by name, email…" />
          <FilterSelect
            label="Role"
            value={roleFilter}
            onChange={setRoleFilter}
            options={[
              { value: 'ALL', label: 'Any role' },
              ...ROLE_OPTIONS,
            ]}
          />
          <span className="ml-auto text-[12px] font-semibold text-ink-mute">
            {filtered.length} of {ownStaff.length} staff
          </span>
        </div>
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(s) => s.id}
          pageSize={8}
          emptyTitle="No staff found"
          emptyDescription="No demo staff match the current search or role filter for your properties."
        />
      </div>

      {/* ------------------------------------------------------- Add staff */}
      <Modal
        open={addOpen}
        title="Add Staff"
        subtitle="Frontend demo — writes to local React state only; no staff account is created."
        onClose={() => setAddOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="rounded-full border border-forest/25 px-5 py-2.5 text-sm font-bold text-forest hover:bg-forest hover:text-ivory"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitAdd}
              className="rounded-full bg-forest px-5 py-2.5 text-sm font-bold text-ivory hover:bg-forest-light"
            >
              Add staff
            </button>
          </>
        }
      >
        <StaffFormFields form={form} setForm={setForm} errors={errors} propertyOptions={propertyOptions} />
      </Modal>

      {/* ------------------------------------------------------ Edit staff */}
      <Modal
        open={editing !== null}
        title={editing ? `Edit ${editing.name}` : 'Edit Staff'}
        subtitle="Update the record in local demo state."
        onClose={() => setEditing(null)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-full border border-forest/25 px-5 py-2.5 text-sm font-bold text-forest hover:bg-forest hover:text-ivory"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitEdit}
              className="rounded-full bg-forest px-5 py-2.5 text-sm font-bold text-ivory hover:bg-forest-light"
            >
              Save changes
            </button>
          </>
        }
      >
        <StaffFormFields form={form} setForm={setForm} errors={errors} propertyOptions={propertyOptions} />
      </Modal>

      {/* ---------------------------------------------------- Remove staff */}
      <ConfirmDialog
        open={removing !== null}
        title={`Remove ${removing?.name ?? 'staff'}?`}
        message={
          <>
            This removes the staff record from local demo state. No notification or account
            deletion happens — this is a frontend-only demo.
          </>
        }
        confirmLabel="Remove staff"
        danger
        onConfirm={confirmRemove}
        onCancel={() => setRemoving(null)}
      />

      {/* Contact hints */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3 text-[12px] text-ink-mute">
        <p className="flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-3">
          <Mail className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
          Emails use the @rahomitra.demo domain.
        </p>
        <p className="flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-3">
          <Phone className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
          Mobile numbers are fictional 98765 … demo values.
        </p>
        <p className="flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-3">
          <UserCog className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
          Roles carry no real permissions in this demo.
        </p>
      </div>
    </>
  )
}

function StaffFormFields({
  form,
  setForm,
  errors,
  propertyOptions,
}: {
  form: StaffForm
  setForm: (form: StaffForm) => void
  errors: Record<string, string>
  propertyOptions: Array<{ value: string; label: string }>
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormSelect
        id="staff-property"
        label="Assigned PG Property"
        required
        value={form.propertyId}
        onChange={(v) => setForm({ ...form, propertyId: v })}
        options={propertyOptions}
        error={errors.propertyId}
        className="sm:col-span-2"
      />
      <FormInput
        id="staff-name"
        label="Full Name"
        required
        value={form.name}
        onChange={(v) => setForm({ ...form, name: v })}
        placeholder="e.g. Ramesh Kumar (demo)"
        error={errors.name}
      />
      <FormSelect
        id="staff-role"
        label="Role"
        value={form.role}
        onChange={(v) => setForm({ ...form, role: v as StaffRole })}
        options={ROLE_OPTIONS}
      />
      <FormInput
        id="staff-email"
        label="Email"
        required
        type="email"
        value={form.email}
        onChange={(v) => setForm({ ...form, email: v })}
        placeholder="staff01@rahomitra.demo"
        error={errors.email}
      />
      <FormInput
        id="staff-mobile"
        label="Mobile Number"
        required
        value={form.mobile}
        onChange={(v) => setForm({ ...form, mobile: v })}
        placeholder="98765 43100"
        error={errors.mobile}
        hint="Fictional demo number only."
      />
    </div>
  )
}
