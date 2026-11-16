import { useMemo, useState } from 'react'
import { Inbox, PencilLine, Eye } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useOwnerStore } from '../../context/OwnerStore'
import { useCommunicationStore } from '../../context/CommunicationStore'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { FilterSelect, SearchInput } from '../../components/admin/Filters'
import { DataTable } from '../../components/admin/DataTable'
import type { Column } from '../../components/admin/DataTable'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { ComplaintDetailModal } from '../../components/communication/ComplaintDetailModal'
import {
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_STATUS_LABELS,
  PRIORITY_LABELS,
  fmtDate,
} from '../../types/communication'
import type {
  Complaint,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
} from '../../types/communication'

const OPEN_STATUSES: ComplaintStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'IN_PROGRESS',
]

/**
 * /owner/complaints — Section 07 complaint desk. Owners review tickets for
 * their own properties only, change priority / status, respond, resolve or
 * reject with a mandatory reason. Every change is written to the shared demo
 * store so the student sees it instantly.
 */
export function OwnerComplaints() {
  useDocumentTitle('Complaints')

  const { scopedPropertyIds } = useOwnerStore()
  const {
    complaints,
    updateComplaintStatus,
    setComplaintPriority,
    addComplaintComment,
    pushToast,
  } = useCommunicationStore()

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [propertyFilter, setPropertyFilter] = useState('ALL')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const ownComplaints = useMemo(
    () => complaints.filter((c) => scopedPropertyIds.includes(c.propertyId)),
    [complaints, scopedPropertyIds],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ownComplaints.filter((c) => {
      if (statusFilter === 'OPEN' && !OPEN_STATUSES.includes(c.status)) return false
      if (statusFilter !== 'ALL' && statusFilter !== 'OPEN' && c.status !== statusFilter) return false
      if (priorityFilter !== 'ALL' && c.priority !== priorityFilter) return false
      if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false
      if (propertyFilter !== 'ALL' && c.propertyId !== propertyFilter) return false
      if (
        q &&
        !`${c.id} ${c.studentName} ${c.subject} ${c.roomNumber} ${c.description}`.toLowerCase().includes(q)
      )
        return false
      return true
    })
  }, [ownComplaints, query, statusFilter, priorityFilter, categoryFilter, propertyFilter])

  const selected = complaints.find((c) => c.id === selectedId) ?? null

  const openCount = ownComplaints.filter((c) => OPEN_STATUSES.includes(c.status)).length

  const columns: Array<Column<Complaint>> = [
    {
      key: 'id',
      header: 'ID',
      render: (c) => (
        <span className="text-[12px] font-bold text-forest">{c.id}</span>
      ),
      sortValue: (c) => c.id,
    },
    {
      key: 'student',
      header: 'Student',
      render: (c) => (
        <span className="font-semibold text-ink">{c.studentName}</span>
      ),
      sortValue: (c) => c.studentName,
    },
    {
      key: 'pg',
      header: 'PG',
      render: (c) => (
        <span className="text-ink-soft">
          {c.propertyId === 'pg-001' ? 'Shree Shyam Boys PG' : 'Ashiana PG'}
        </span>
      ),
      sortValue: (c) => c.propertyId,
    },
    {
      key: 'room',
      header: 'Room',
      render: (c) => <span className="text-ink-soft">{c.roomNumber}</span>,
      sortValue: (c) => c.roomNumber,
    },
    {
      key: 'category',
      header: 'Category',
      render: (c) => (
        <span className="text-ink-soft">{COMPLAINT_CATEGORY_LABELS[c.category]}</span>
      ),
      sortValue: (c) => COMPLAINT_CATEGORY_LABELS[c.category],
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (c) => (
        <span className="line-clamp-2 max-w-[16rem] text-ink">{c.subject}</span>
      ),
      sortValue: (c) => c.subject,
    },
    {
      key: 'date',
      header: 'Date',
      render: (c) => <span className="text-ink-soft">{fmtDate(c.submittedOn)}</span>,
      sortValue: (c) => c.submittedOn,
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (c) => <StatusBadge status={c.priority} />,
      sortValue: (c) => ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].indexOf(c.priority),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => <StatusBadge status={c.status} />,
      sortValue: (c) => c.status,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (c) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSelectedId(c.id)}>
            <Eye size={14} /> View
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedId(c.id)}>
            <PencilLine size={14} /> Manage
          </Button>
        </div>
      ),
    },
  ]

  const statusOptions = [
    { value: 'ALL', label: 'All statuses' },
    { value: 'OPEN', label: 'Open only' },
    ...(Object.keys(COMPLAINT_STATUS_LABELS) as ComplaintStatus[]).map((value) => ({
      value,
      label: COMPLAINT_STATUS_LABELS[value],
    })),
  ]
  const priorityOptions = [
    { value: 'ALL', label: 'All priorities' },
    ...(Object.keys(PRIORITY_LABELS) as ComplaintPriority[]).map((value) => ({
      value,
      label: PRIORITY_LABELS[value],
    })),
  ]
  const categoryOptions = [
    { value: 'ALL', label: 'All categories' },
    ...(Object.keys(COMPLAINT_CATEGORY_LABELS) as ComplaintCategory[]).map((value) => ({
      value,
      label: COMPLAINT_CATEGORY_LABELS[value],
    })),
  ]
  const propertyOptions = [
    { value: 'ALL', label: 'All my properties' },
    ...scopedPropertyIds.map((id) => ({
      value: id,
      label: id === 'pg-001' ? 'Shree Shyam Boys PG' : 'Ashiana PG',
    })),
  ]

  const hasFilters =
    query !== '' ||
    statusFilter !== 'ALL' ||
    priorityFilter !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    propertyFilter !== 'ALL'

  const clearFilters = () => {
    setQuery('')
    setStatusFilter('ALL')
    setPriorityFilter('ALL')
    setCategoryFilter('ALL')
    setPropertyFilter('ALL')
  }

  return (
    <div>
      <AdminPageHeader
        title="Complaints"
        description={`${openCount} open of ${ownComplaints.length} complaints across your properties — respond, re-prioritise or resolve.`}
        actions={
          <Button variant="outline" size="md" onClick={() => setStatusFilter('OPEN')}>
            Show open only
          </Button>
        }
      />

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(c) => c.id}
        pageSize={8}
        emptyTitle="No complaints found"
        emptyDescription="No complaints match the current filters — try clearing a filter."
        toolbar={
          <div className="flex w-full flex-wrap items-end gap-3">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search ID, student, subject…"
            />
            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
            />
            <FilterSelect
              label="Priority"
              value={priorityFilter}
              onChange={setPriorityFilter}
              options={priorityOptions}
            />
            <FilterSelect
              label="Category"
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categoryOptions}
            />
            <FilterSelect
              label="PG"
              value={propertyFilter}
              onChange={setPropertyFilter}
              options={propertyOptions}
            />
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
            <span className="ml-auto text-[12px] font-semibold text-ink-mute">
              {filtered.length} of {ownComplaints.length}
            </span>
          </div>
        }
      />

      {filtered.length === 0 && ownComplaints.length === 0 && (
        <div className="mt-4">
          <EmptyState
            icon={<Inbox size={40} strokeWidth={1.4} />}
            title="No complaints yet"
            description="Tickets raised by your residents will land here."
          />
        </div>
      )}

      <ComplaintDetailModal
        complaint={selected}
        viewer="OWNER"
        viewerName="PG Management"
        onClose={() => setSelectedId(null)}
        onStatusChange={(status: ComplaintStatus, note: string) => {
          if (!selected) return
          updateComplaintStatus(selected.id, status, note)
          pushToast(
            status === 'REJECTED'
              ? `${selected.id} rejected — resident notified.`
              : `${selected.id} moved to ${COMPLAINT_STATUS_LABELS[status]}.`,
            status === 'REJECTED' ? 'error' : 'success',
          )
        }}
        onPriorityChange={(priority: ComplaintPriority) => {
          if (!selected) return
          setComplaintPriority(selected.id, priority)
        }}
        onComment={(body: string) => {
          if (!selected) return
          addComplaintComment(selected.id, 'OWNER', 'PG Management', body, 'Owner responded')
          pushToast('Response sent to the resident.', 'success')
        }}
      />
    </div>
  )
}
