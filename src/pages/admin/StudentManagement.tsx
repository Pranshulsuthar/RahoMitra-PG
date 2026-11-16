import { useMemo, useState } from 'react'
import { GraduationCap, Mail, MapPin, UserCheck, UserX } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdminStore } from '../../context/AdminStore'
import type { MembershipStatus, StudentRecord } from '../../types/admin'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DataTable } from '../../components/admin/DataTable'
import type { Column } from '../../components/admin/DataTable'
import { FilterSelect, SearchInput } from '../../components/admin/Filters'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { Modal } from '../../components/admin/Modal'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'

/** /admin/students — student account directory. */
export function StudentManagement() {
  useDocumentTitle('Student Management')

  const { students, pgs, setStudentMembership, pushToast } = useAdminStore()

  const [search, setSearch] = useState('')
  const [pgFilter, setPgFilter] = useState('ALL')
  const [membership, setMembership] = useState<'ALL' | MembershipStatus>('ALL')
  const [detail, setDetail] = useState<StudentRecord | null>(null)
  const [pending, setPending] = useState<{ student: StudentRecord; action: 'ACTIVATE' | 'DEACTIVATE' } | null>(
    null,
  )

  const pgOptions = useMemo(() => {
    const names = [...new Set(students.map((s) => s.pgName).filter((n) => n !== '—'))]
    return names
  }, [students])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return students.filter(
      (s) =>
        (!q ||
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.pgName.toLowerCase().includes(q)) &&
        (pgFilter === 'ALL' || s.pgName === pgFilter) &&
        (membership === 'ALL' || s.membership === membership),
    )
  }, [students, search, pgFilter, membership])

  const confirmAction = () => {
    if (!pending) return
    const next = pending.action === 'ACTIVATE' ? 'ACTIVE' : 'INACTIVE'
    setStudentMembership(pending.student.id, next)
    pushToast(
      next === 'ACTIVE'
        ? `Membership of “${pending.student.name}” activated.`
        : `Membership of “${pending.student.name}” deactivated.`,
      next === 'ACTIVE' ? 'success' : 'error',
    )
    setPending(null)
    setDetail(null)
  }

  const columns: Array<Column<StudentRecord>> = [
    {
      key: 'name',
      header: 'Student Name',
      sortValue: (s) => s.name,
      render: (s) => (
        <div>
          <span className="block font-semibold text-ink">{s.name}</span>
          <span className="block text-[11.5px] text-ink-mute">{s.email}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortValue: (s) => s.email,
      render: (s) => <span className="text-[12.5px] text-ink-soft">{s.email}</span>,
    },
    {
      key: 'pg',
      header: 'Associated PG',
      sortValue: (s) => s.pgName,
      render: (s) =>
        s.pgName === '—' ? (
          <span className="text-ink-mute">Not assigned</span>
        ) : (
          <span className="font-semibold text-ink">{s.pgName}</span>
        ),
    },
    { key: 'city', header: 'City', sortValue: (s) => s.city, render: (s) => s.city },
    {
      key: 'membership',
      header: 'Membership',
      sortValue: (s) => s.membership,
      render: (s) => <StatusBadge status={s.membership} />,
    },
    {
      key: 'registered',
      header: 'Registration Date',
      sortValue: (s) => s.registeredOn,
      render: (s) => <span className="whitespace-nowrap tabular-nums">{s.registeredOn}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (s) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setDetail(s)}
            className="inline-flex items-center gap-1.5 rounded-full border border-forest/25 bg-white px-3.5 py-1.5 text-xs font-bold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
          >
            View profile
          </button>
          {s.membership === 'ACTIVE' ? (
            <button
              type="button"
              onClick={() => setPending({ student: s, action: 'DEACTIVATE' })}
              className="inline-flex items-center gap-1.5 rounded-full border border-danger/40 bg-white px-3.5 py-1.5 text-xs font-bold text-danger transition-colors hover:bg-danger hover:text-white"
            >
              <UserX className="h-3.5 w-3.5" aria-hidden />
              Deactivate
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setPending({ student: s, action: 'ACTIVATE' })}
              className="inline-flex items-center gap-1.5 rounded-full bg-forest px-3.5 py-1.5 text-xs font-bold text-ivory transition-colors hover:bg-forest-light"
            >
              <UserCheck className="h-3.5 w-3.5" aria-hidden />
              Activate
            </button>
          )}
        </div>
      ),
    },
  ]

  const detailPg = detail?.pgId ? pgs.find((pg) => pg.id === detail.pgId) : undefined

  return (
    <>
      <AdminPageHeader
        title="Student Management"
        description="Search students, filter by PG or membership status, and view each student profile with their associated property."
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-bold text-ink-soft">
            <GraduationCap className="h-4 w-4 text-forest" aria-hidden />
            {filtered.length} of {students.length} students
          </span>
        }
      />

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(s) => s.id}
        pageSize={8}
        emptyTitle="No students match"
        emptyDescription="Try a different search term, PG or membership filter."
        toolbar={
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <SearchInput value={search} onChange={setSearch} placeholder="Search student, email or PG…" />
            <div className="flex flex-wrap items-center gap-3">
              <FilterSelect
                label="PG"
                value={pgFilter}
                onChange={setPgFilter}
                options={[
                  { value: 'ALL', label: 'All PGs' },
                  ...pgOptions.map((name) => ({ value: name, label: name })),
                ]}
              />
              <FilterSelect
                label="Membership"
                value={membership}
                onChange={(value) => setMembership(value as 'ALL' | MembershipStatus)}
                options={[
                  { value: 'ALL', label: 'All' },
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'INACTIVE', label: 'Inactive' },
                ]}
              />
            </div>
          </div>
        }
      />

      <Modal
        open={detail !== null}
        title="Student profile"
        subtitle={detail ? `${detail.id} · registered ${detail.registeredOn}` : undefined}
        onClose={() => setDetail(null)}
        size="md"
        footer={
          detail && (
            <>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-forest/25 bg-white px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
              >
                Close
              </button>
              {detail.membership === 'ACTIVE' ? (
                <button
                  type="button"
                  onClick={() => setPending({ student: detail, action: 'DEACTIVATE' })}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-danger px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-danger/90"
                >
                  <UserX className="h-4 w-4" aria-hidden />
                  Deactivate membership
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPending({ student: detail, action: 'ACTIVATE' })}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-forest-light"
                >
                  <UserCheck className="h-4 w-4" aria-hidden />
                  Activate membership
                </button>
              )}
            </>
          )
        }
      >
        {detail && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-forest-soft text-xl font-bold text-forest">
                {detail.name
                  .split(' ')
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join('')}
              </span>
              <div>
                <h3 className="text-lg">{detail.name}</h3>
                <p className="flex items-center gap-1.5 text-[13px] text-ink-soft">
                  <Mail className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
                  {detail.email}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[13px] text-ink-soft">
                  <MapPin className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
                  {detail.city}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <StatusBadge status={detail.membership} />
              <span className="text-xs text-ink-mute">Registered {detail.registeredOn}</span>
            </div>

            <div className="rounded-2xl border border-line bg-ivory/40 p-4">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">
                Associated PG
              </h3>
              {detailPg ? (
                <div className="flex items-center gap-3">
                  <img
                    src={detailPg.coverImage}
                    alt=""
                    loading="lazy"
                    className="h-14 w-14 shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{detailPg.name}</p>
                    <p className="text-[12px] text-ink-mute">
                      {detailPg.locality}, {detailPg.city}
                    </p>
                    <p className="text-[12px] text-ink-mute">Status: {detailPg.status}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-ink-mute">
                  This student has not been assigned to a PG yet.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={pending !== null}
        title={
          pending?.action === 'ACTIVATE'
            ? 'Activate membership?'
            : 'Deactivate membership?'
        }
        message={
          <>
            {pending?.action === 'ACTIVATE' ? (
              <>
                Activate the membership of{' '}
                <strong className="font-semibold text-ink">{pending?.student.name}</strong>?
              </>
            ) : (
              <>
                Deactivate the membership of{' '}
                <strong className="font-semibold text-ink">{pending?.student.name}</strong>? Their
                profile will show as inactive.
              </>
            )}
          </>
        }
        confirmLabel={pending?.action === 'ACTIVATE' ? 'Activate' : 'Deactivate'}
        danger={pending?.action === 'DEACTIVATE'}
        onConfirm={confirmAction}
        onCancel={() => setPending(null)}
      />
    </>
  )
}
