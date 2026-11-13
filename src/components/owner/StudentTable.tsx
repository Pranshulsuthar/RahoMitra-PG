import type { ReactNode } from 'react'
import { Eye } from 'lucide-react'
import type { OwnerProperty, OwnerRoom, OwnerStudent } from '../../types/owner'
import { DataTable } from '../admin/DataTable'
import type { Column } from '../admin/DataTable'
import { StatusBadge } from '../admin/StatusBadge'

interface StudentTableProps {
  students: OwnerStudent[]
  rooms: OwnerRoom[]
  properties: OwnerProperty[]
  toolbar?: ReactNode
  onView: (student: OwnerStudent) => void
}

/** Student records table scoped to the owner's own properties. */
export function StudentTable({ students, rooms, properties, toolbar, onView }: StudentTableProps) {
  const columns: Array<Column<OwnerStudent>> = [
    {
      key: 'name',
      header: 'Student',
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
      className: 'hidden md:table-cell',
      render: (s) => <span className="whitespace-nowrap">{s.mobile}</span>,
    },
    {
      key: 'property',
      header: 'Associated PG',
      sortValue: (s) => properties.find((p) => p.id === s.propertyId)?.name ?? '',
      className: 'hidden lg:table-cell',
      render: (s) => (
        <span className="font-semibold text-ink-soft">
          {properties.find((p) => p.id === s.propertyId)?.name ?? '—'}
        </span>
      ),
    },
    {
      key: 'room',
      header: 'Room / Bed',
      sortValue: (s) => rooms.find((r) => r.id === s.roomId)?.number ?? 'zz',
      render: (s) => {
        const room = rooms.find((r) => r.id === s.roomId)
        const bed = room?.beds.find((b) => b.id === s.bedId)
        return room ? (
          <span className="whitespace-nowrap">
            Room {room.number} · Bed {bed?.label ?? '—'}
          </span>
        ) : (
          <span className="text-ink-mute">Not allocated</span>
        )
      },
    },
    {
      key: 'admission',
      header: 'Admission date',
      sortValue: (s) => s.admissionDate,
      className: 'hidden xl:table-cell',
      render: (s) => <span className="whitespace-nowrap">{s.admissionDate}</span>,
    },
    {
      key: 'membership',
      header: 'Membership',
      sortValue: (s) => s.membership,
      render: (s) => <StatusBadge status={s.membership} />,
    },
    {
      key: 'actions',
      header: 'Action',
      className: 'text-right',
      render: (s) => (
        <button
          type="button"
          onClick={() => onView(s)}
          className="inline-flex items-center gap-1.5 rounded-full border border-forest/25 px-3.5 py-1.5 text-[11.5px] font-bold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
        >
          <Eye className="h-3.5 w-3.5" aria-hidden />
          View
        </button>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={students}
      rowKey={(s) => s.id}
      pageSize={8}
      toolbar={toolbar}
      emptyTitle="No students found"
      emptyDescription="No demo students match the current search or filters for your properties."
    />
  )
}
