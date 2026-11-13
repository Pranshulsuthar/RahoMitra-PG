import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BedDouble, Plus } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useOwnerStore } from '../../context/OwnerStore'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { SearchInput, FilterSelect } from '../../components/admin/Filters'
import { Modal } from '../../components/admin/Modal'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { RoomCard } from '../../components/owner/RoomCard'
import { FormInput, FormSelect } from '../../components/owner/FormInput'
import { EmptyState } from '../../components/common/EmptyState'
import { Button } from '../../components/common/Button'
import { StatisticCard } from '../../components/owner/StatisticCard'
import { aggregateRooms } from '../../context/OwnerStore'
import { ROOM_TYPE_LABELS, roomOccupancy } from '../../types/owner'
import type { OwnerRoom, RoomBed, RoomType } from '../../types/owner'

const TYPE_OPTIONS = [
  { value: 'ALL', label: 'Any room type' },
  ...Object.entries(ROOM_TYPE_LABELS).map(([value, label]) => ({ value, label })),
]

const OCCUPANCY_OPTIONS = [
  { value: 'ALL', label: 'Any occupancy' },
  { value: 'VACANT', label: 'Vacant' },
  { value: 'PARTIAL', label: 'Partially occupied' },
  { value: 'FULL', label: 'Full' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
]

interface RoomForm {
  propertyId: string
  number: string
  floor: string
  type: RoomType
  rent: string
  capacity: string
}

const emptyForm = (propertyId: string): RoomForm => ({
  propertyId,
  number: '',
  floor: '1',
  type: 'DOUBLE',
  rent: '9500',
  capacity: '2',
})

/** /owner/rooms — room & bed management with capacity guards. */
export function Rooms() {
  useDocumentTitle('Room Management')

  const {
    properties,
    rooms,
    scopedPropertyIds,
    selectedPropertyId,
    addRoom,
    updateRoom,
    deleteRoom,
    addBed,
    setBedStatus,
  } = useOwnerStore()

  const [searchParams, setSearchParams] = useSearchParams()

  const [query, setQuery] = useState('')
  const [floorFilter, setFloorFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [occupancyFilter, setOccupancyFilter] = useState('ALL')

  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<OwnerRoom | null>(null)
  const [deleting, setDeleting] = useState<OwnerRoom | null>(null)
  const [form, setForm] = useState<RoomForm>(emptyForm(scopedPropertyIds[0] ?? ''))
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setForm(emptyForm(selectedPropertyId !== 'ALL' ? selectedPropertyId : (scopedPropertyIds[0] ?? '')))
      setAddOpen(true)
      const next = new URLSearchParams(searchParams)
      next.delete('add')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams, selectedPropertyId, scopedPropertyIds])

  // Only the demo owner's own rooms, narrowed further by the switcher.
  const ownRooms = useMemo(
    () => rooms.filter((r) => scopedPropertyIds.includes(r.propertyId)),
    [rooms, scopedPropertyIds],
  )

  const floors = useMemo(() => {
    const set = new Set<number>()
    ownRooms.forEach((r) => set.add(r.floor))
    return ['ALL', ...Array.from(set).sort((a, b) => a - b).map(String)]
  }, [ownRooms])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ownRooms.filter((room) => {
      const occ = roomOccupancy(room)
      if (floorFilter !== 'ALL' && String(room.floor) !== floorFilter) return false
      if (typeFilter !== 'ALL' && room.type !== typeFilter) return false
      if (occupancyFilter !== 'ALL' && occ.label !== occupancyFilter) return false
      if (q) {
        const property = properties.find((p) => p.id === room.propertyId)
        const haystack = `room ${room.number} ${property?.name ?? ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [ownRooms, query, floorFilter, typeFilter, occupancyFilter, properties])

  const totals = useMemo(() => aggregateRooms(ownRooms), [ownRooms])

  const openAdd = () => {
    setForm(emptyForm(selectedPropertyId !== 'ALL' ? selectedPropertyId : (scopedPropertyIds[0] ?? '')))
    setErrors({})
    setAddOpen(true)
  }

  const openEdit = (room: OwnerRoom) => {
    setEditing(room)
    setForm({
      propertyId: room.propertyId,
      number: room.number,
      floor: String(room.floor),
      type: room.type,
      rent: String(room.rent),
      capacity: String(room.beds.length),
    })
    setErrors({})
  }

  const validate = (isEdit: boolean): boolean => {
    const next: Record<string, string> = {}
    if (!form.propertyId) next.propertyId = 'Select a PG property.'
    if (!form.number.trim()) next.number = 'Room number is required.'
    const floor = Number(form.floor)
    if (Number.isNaN(floor)) next.floor = 'Enter a valid floor number.'
    const rent = Number(form.rent)
    if (Number.isNaN(rent) || rent < 0) next.rent = 'Enter a valid monthly rent.'
    if (!isEdit) {
      const capacity = Number(form.capacity)
      if (Number.isNaN(capacity) || capacity < 1 || capacity > 8) {
        next.capacity = 'Capacity must be 1–8 beds (never more than available space).'
      }
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submitAdd = () => {
    if (!validate(false)) return
    addRoom({
      propertyId: form.propertyId,
      number: form.number.trim(),
      floor: Number(form.floor),
      type: form.type,
      rent: Number(form.rent),
      capacity: Number(form.capacity),
    })
    setAddOpen(false)
  }

  const submitEdit = () => {
    if (!editing || !validate(true)) return
    updateRoom(editing.id, {
      number: form.number.trim(),
      floor: Number(form.floor),
      type: form.type,
      rent: Number(form.rent),
    })
    setEditing(null)
  }

  const confirmDelete = () => {
    if (!deleting) return
    deleteRoom(deleting.id)
    setDeleting(null)
  }

  const handleBedStatus = (bed: RoomBed, status: RoomBed['status']) => {
    if (bed.status === status) return
    setBedStatus(bed.id, status)
  }

  const propertyOptions = properties
    .filter((p) => scopedPropertyIds.includes(p.id))
    .map((p) => ({ value: p.id, label: p.name }))

  return (
    <>
      <AdminPageHeader
        title="Room Management"
        description="Add, edit and remove rooms, manage beds and keep occupancy within capacity."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory shadow-[0_10px_24px_-14px_rgba(23,61,50,0.9)] transition-all hover:bg-forest-light"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add Room
          </button>
        }
      />

      <DemoBanner message="rooms, beds and their statuses are local demo records — capacity rules are enforced in the UI so students can never exceed free beds." />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatisticCard label="Rooms" value={totals.totalRooms} icon={BedDouble} tone="ink" />
        <StatisticCard label="Total Beds" value={totals.totalBeds} icon={BedDouble} tone="ink" />
        <StatisticCard label="Occupied" value={totals.occupied} icon={BedDouble} tone="gold" />
        <StatisticCard label="Free Beds" value={totals.available} icon={BedDouble} tone="forest" />
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-3xl border border-line bg-white p-4 shadow-card">
        <SearchInput value={query} onChange={setQuery} placeholder="Search rooms or PGs…" />
        <FilterSelect
          label="Floor"
          value={floorFilter}
          onChange={setFloorFilter}
          options={floors.map((f) => ({ value: f, label: f === 'ALL' ? 'Any floor' : `Floor ${f}` }))}
        />
        <FilterSelect label="Type" value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTIONS} />
        <FilterSelect label="Occupancy" value={occupancyFilter} onChange={setOccupancyFilter} options={OCCUPANCY_OPTIONS} />
        <span className="ml-auto text-[12px] font-semibold text-ink-mute">
          {filtered.length} of {ownRooms.length} rooms
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No rooms found"
          description="No demo rooms match the current filters for your properties. Adjust the filters or add a new room."
          icon={<BedDouble className="h-6 w-6" aria-hidden />}
          action={
            <button
              type="button"
              onClick={openAdd}
              className="rounded-full bg-forest px-5 py-2.5 text-sm font-bold text-ivory hover:bg-forest-light"
            >
              Add Room
            </button>
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onEdit={openEdit}
              onDelete={(r) => setDeleting(r)}
              onAddBed={(r) => addBed(r.id)}
              onBedStatusChange={(bed, status) => handleBedStatus(bed, status)}
            />
          ))}
        </div>
      )}

      {/* -------------------------------------------------------- Add room */}
      <Modal
        open={addOpen}
        title="Add Room"
        subtitle="New rooms start with all beds AVAILABLE — demo local state only."
        onClose={() => setAddOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submitAdd}>
              Add room
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormSelect
            id="room-property"
            label="PG Property"
            required
            value={form.propertyId}
            onChange={(v) => setForm({ ...form, propertyId: v })}
            options={propertyOptions}
            error={errors.propertyId}
            className="sm:col-span-2"
          />
          <FormInput
            id="room-number"
            label="Room Number"
            required
            value={form.number}
            onChange={(v) => setForm({ ...form, number: v })}
            placeholder="e.g. 105"
            error={errors.number}
          />
          <FormInput
            id="room-floor"
            label="Floor"
            type="number"
            value={form.floor}
            onChange={(v) => setForm({ ...form, floor: v })}
            error={errors.floor}
          />
          <FormSelect
            id="room-type"
            label="Room Type"
            value={form.type}
            onChange={(v) => setForm({ ...form, type: v as RoomType })}
            options={Object.entries(ROOM_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <FormInput
            id="room-rent"
            label="Monthly Rent (₹)"
            type="number"
            min={0}
            value={form.rent}
            onChange={(v) => setForm({ ...form, rent: v })}
            error={errors.rent}
          />
          <FormInput
            id="room-capacity"
            label="Total Capacity (beds)"
            type="number"
            min={1}
            max={8}
            value={form.capacity}
            onChange={(v) => setForm({ ...form, capacity: v })}
            error={errors.capacity}
            hint="1–8 beds — students can never exceed this."
            className="sm:col-span-2"
          />
        </div>
      </Modal>

      {/* ------------------------------------------------------- Edit room */}
      <Modal
        open={editing !== null}
        title={editing ? `Edit Room ${editing.number}` : 'Edit Room'}
        subtitle="Room capacity (bed count) is managed separately via the Add bed button."
        onClose={() => setEditing(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submitEdit}>
              Save room
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            id="edit-room-number"
            label="Room Number"
            required
            value={form.number}
            onChange={(v) => setForm({ ...form, number: v })}
            error={errors.number}
          />
          <FormInput
            id="edit-room-floor"
            label="Floor"
            type="number"
            value={form.floor}
            onChange={(v) => setForm({ ...form, floor: v })}
            error={errors.floor}
          />
          <FormSelect
            id="edit-room-type"
            label="Room Type"
            value={form.type}
            onChange={(v) => setForm({ ...form, type: v as RoomType })}
            options={Object.entries(ROOM_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <FormInput
            id="edit-room-rent"
            label="Monthly Rent (₹)"
            type="number"
            min={0}
            value={form.rent}
            onChange={(v) => setForm({ ...form, rent: v })}
            error={errors.rent}
          />
        </div>
        {editing && (
          <div className="mt-5 rounded-2xl border border-line bg-ivory/50 p-4">
            <p className="text-[12px] font-bold uppercase tracking-wider text-ink-mute">
              Current beds ({editing.beds.length})
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {editing.beds.map((bed) => (
                <span
                  key={bed.id}
                  className={
                    'rounded-lg border px-2.5 py-1 text-[11px] font-bold ' +
                    (bed.status === 'AVAILABLE'
                      ? 'border-forest/30 bg-forest-soft text-forest'
                      : bed.status === 'OCCUPIED'
                        ? 'border-line bg-ivory-deep/60 text-ink-soft'
                        : 'border-gold/50 bg-gold-soft text-gold-dark')
                  }
                >
                  Bed {bed.label} · {bed.status}
                </span>
              ))}
            </div>
            <p className="mt-2 text-[11.5px] text-ink-mute">
              Use “Add bed” on the room card to increase capacity (max 8).
            </p>
          </div>
        )}
      </Modal>

      {/* ----------------------------------------------------- Delete room */}
      <ConfirmDialog
        open={deleting !== null}
        title={`Delete Room ${deleting?.number ?? ''}?`}
        message={
          <>
            This removes the room and its beds from local demo state. If any active student is
            still allocated here, the deletion will be blocked.
          </>
        }
        confirmLabel="Delete room"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  )
}
