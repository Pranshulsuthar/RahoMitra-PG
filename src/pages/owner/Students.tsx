import { useMemo, useState } from 'react'
import { GraduationCap, Mail, MapPin, Phone, CalendarDays, BedDouble } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useOwnerStore } from '../../context/OwnerStore'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { SearchInput, FilterSelect } from '../../components/admin/Filters'
import { Modal } from '../../components/admin/Modal'
import { StudentTable } from '../../components/owner/StudentTable'
import { StatisticCard } from '../../components/owner/StatisticCard'
import { StatusBadge } from '../../components/admin/StatusBadge'
import type { MembershipStatus, OwnerStudent } from '../../types/owner'

const MEMBERSHIP_OPTIONS = [
  { value: 'ALL', label: 'Any membership' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
]

/** /owner/students — student records scoped to the demo owner's properties. */
export function Students() {
  useDocumentTitle('Student Management')

  const { students, rooms, properties, scopedPropertyIds, setMembership } = useOwnerStore()

  const [query, setQuery] = useState('')
  const [membershipFilter, setMembershipFilter] = useState('ALL')
  const [viewing, setViewing] = useState<OwnerStudent | null>(null)

  const ownProperties = useMemo(
    () => properties.filter((p) => scopedPropertyIds.includes(p.id)),
    [properties, scopedPropertyIds],
  )

  const ownRooms = useMemo(
    () => rooms.filter((r) => scopedPropertyIds.includes(r.propertyId)),
    [rooms, scopedPropertyIds],
  )

  // Only the demo owner's students, further narrowed by the switcher scope.
  const ownStudents = useMemo(
    () => students.filter((s) => scopedPropertyIds.includes(s.propertyId)),
    [students, scopedPropertyIds],
  )

  const roomFilterOptions = useMemo(
    () => [
      { value: 'ALL', label: 'Any room' },
      ...ownRooms.map((r) => ({ value: r.id, label: `Room ${r.number}` })),
    ],
    [ownRooms],
  )

  const [roomFilter, setRoomFilter] = useState('ALL')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ownStudents.filter((student) => {
      if (membershipFilter !== 'ALL' && student.membership !== membershipFilter) return false
      if (roomFilter !== 'ALL' && student.roomId !== roomFilter) return false
      if (q) {
        const haystack = `${student.name} ${student.email} ${student.mobile} ${student.college}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [ownStudents, query, membershipFilter, roomFilter])

  const active = ownStudents.filter((s) => s.membership === 'ACTIVE').length
  const inactive = ownStudents.filter((s) => s.membership === 'INACTIVE').length

  const viewingRoom = viewing ? rooms.find((r) => r.id === viewing.roomId) : undefined
  const viewingBed = viewingRoom?.beds.find((b) => b.id === viewing?.bedId)
  const viewingProperty = viewing ? properties.find((p) => p.id === viewing.propertyId) : undefined

  return (
    <>
      <AdminPageHeader
        title="Student Management"
        description="Students staying across your demo PGs — search, filter, view profiles and manage memberships."
      />

      <DemoBanner message="all student names, emails, mobile numbers and colleges are clearly fictional demo records — no real identities are used." />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatisticCard label="Total Students" value={ownStudents.length} icon={GraduationCap} tone="ink" />
        <StatisticCard label="Active Memberships" value={active} icon={GraduationCap} tone="forest" />
        <StatisticCard label="Inactive" value={inactive} icon={GraduationCap} tone="gold" />
        <StatisticCard
          label="Properties In Scope"
          value={ownProperties.length}
          icon={BedDouble}
          tone="ink"
        />
      </div>

      <div className="rounded-3xl border border-line bg-white p-4 shadow-card">
        <StudentTable
          students={filtered}
          rooms={ownRooms}
          properties={ownProperties}
          onView={setViewing}
          toolbar={
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search name, email, mobile…"
              />
              <div className="flex flex-wrap items-center gap-3">
                <FilterSelect
                  label="Membership"
                  value={membershipFilter}
                  onChange={setMembershipFilter}
                  options={MEMBERSHIP_OPTIONS}
                />
                <FilterSelect
                  label="Room"
                  value={roomFilter}
                  onChange={setRoomFilter}
                  options={roomFilterOptions}
                />
              </div>
            </div>
          }
        />
      </div>

      {/* ------------------------------------------------- Student profile */}
      <Modal
        open={viewing !== null}
        title={viewing?.name ?? 'Student profile'}
        subtitle="Fictional demo record — local React state only."
        onClose={() => setViewing(null)}
        footer={
          viewing && (
            <>
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="rounded-full border border-forest/25 px-5 py-2.5 text-sm font-bold text-forest hover:bg-forest hover:text-ivory"
              >
                Close
              </button>
              <select
                value={viewing.membership}
                aria-label="Change membership status"
                onChange={(event) => {
                  setMembership(viewing.id, event.target.value as MembershipStatus)
                  setViewing({ ...viewing, membership: event.target.value as MembershipStatus })
                }}
                className="form-input w-auto rounded-full px-4 py-2.5 text-sm font-bold"
              >
                <option value="ACTIVE">Set ACTIVE</option>
                <option value="INACTIVE">Set INACTIVE (release bed)</option>
                <option value="PENDING">Set PENDING</option>
              </select>
            </>
          )
        }
      >
        {viewing && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 rounded-2xl border border-line bg-ivory/50 p-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-forest text-lg font-bold text-ivory">
                {viewing.name
                  .replace(/\(demo\)/i, '')
                  .trim()
                  .split(' ')
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="text-lg font-bold text-ink">{viewing.name}</p>
                <p className="text-[12.5px] text-ink-mute">{viewing.email}</p>
              </div>
              <StatusBadge status={viewing.membership} className="ml-auto shrink-0" />
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: Phone, label: 'Contact', value: `${viewing.mobile} (demo)` },
                { icon: Mail, label: 'Email', value: viewing.email },
                { icon: GraduationCap, label: 'College', value: viewing.college },
                { icon: MapPin, label: 'City', value: viewing.city },
                { icon: CalendarDays, label: 'Admission date', value: viewing.admissionDate },
                {
                  icon: BedDouble,
                  label: 'Room & bed allocation',
                  value: viewingRoom
                    ? `Room ${viewingRoom.number} · Bed ${viewingBed?.label ?? '—'}`
                    : 'Not allocated',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-3 rounded-2xl border border-line bg-white px-4 py-3"
                >
                  <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
                  <div className="min-w-0">
                    <dt className="text-[10.5px] font-bold uppercase tracking-wider text-ink-mute">
                      {item.label}
                    </dt>
                    <dd className="truncate text-[13.5px] font-semibold text-ink">{item.value}</dd>
                  </div>
                </div>
              ))}
            </dl>

            <div className="rounded-2xl border border-line bg-ivory/50 p-4 text-[12.5px] leading-relaxed text-ink-soft">
              <p className="font-bold text-ink">Admission details</p>
              <p className="mt-1">
                Associated PG: <strong>{viewingProperty?.name ?? '—'}</strong> · admitted on{' '}
                <strong>{viewing.admissionDate}</strong> · membership{' '}
                <strong>{viewing.membership}</strong>. Changing membership to INACTIVE releases the
                allocated bed back to availability (demo capacity rule).
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
