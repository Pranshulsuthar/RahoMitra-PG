import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ADMISSION_CODES,
  ADMISSION_REQUESTS,
  DEMO_OWNER_ID,
  DEMO_OWNER_PROFILE,
  OWNER_ACTIVITIES,
  OWNER_NOTIFICATIONS,
  OWNER_PROPERTIES,
  OWNER_ROOMS,
  OWNER_STAFF,
  OWNER_STUDENTS,
} from '../data/ownerData'
import type {
  AdmissionCode,
  AdmissionRequest,
  BedStatus,
  MembershipStatus,
  OwnerActivity,
  OwnerNotification,
  OwnerProfile,
  OwnerProperty,
  OwnerRoom,
  OwnerStudent,
  OwnerToast,
  PropertyStatus,
  RoomType,
  StaffMember,
} from '../types/owner'
import { roomOccupancy } from '../types/owner'

/**
 * ---------------------------------------------------------------------------
 * SECTION 04 — single in-memory demo store for the PG Owner Dashboard.
 * Every mutation is local React state only — nothing is persisted or sent
 * anywhere. Reload the page to restore the original demo dataset.
 *
 * Multi-tenant rule: only records whose property IDs belong to the demo
 * owner are ever exposed — property-level filtering happens here so a future
 * backend swap only touches this file.
 * ---------------------------------------------------------------------------
 */

const TODAY = '2026-05-14'

export const DEMO_OWNER_PROPERTY_IDS = OWNER_PROPERTIES.map((p) => p.id)

export interface PropertyInput {
  name: string
  type: OwnerProperty['type']
  description: string
  city: string
  address: string
  locality: string
  contactPhone: string
  contactEmail: string
  securityDeposit: number
  facilities: string[]
  food: OwnerProperty['food']
  rules: string[]
  coverImage: string
  gallery: string[]
}

export interface RoomInput {
  propertyId: string
  number: string
  floor: number
  type: RoomType
  rent: number
  capacity: number
}

interface OwnerStoreValue {
  /* data (already scoped to the demo owner) */
  owner: OwnerProfile
  properties: OwnerProperty[]
  rooms: OwnerRoom[]
  students: OwnerStudent[]
  codes: AdmissionCode[]
  requests: AdmissionRequest[]
  staff: StaffMember[]
  notifications: OwnerNotification[]
  activities: OwnerActivity[]
  toasts: OwnerToast[]

  /* property switcher */
  selectedPropertyId: string // 'ALL' | property id
  selectProperty: (id: string) => void
  /** Properties in scope for the current switcher selection. */
  scopedProperties: OwnerProperty[]
  scopedPropertyIds: string[]

  /* property CRUD */
  addProperty: (input: PropertyInput) => void
  updateProperty: (id: string, patch: Partial<OwnerProperty>) => void
  setPropertyStatus: (id: string, status: PropertyStatus) => void

  /* room + bed CRUD */
  addRoom: (input: RoomInput) => void
  updateRoom: (id: string, patch: { number: string; floor: number; type: RoomType; rent: number }) => void
  deleteRoom: (id: string) => void
  addBed: (roomId: string) => void
  setBedStatus: (bedId: string, status: BedStatus) => void

  /* students */
  setMembership: (studentId: string, status: MembershipStatus) => void

  /* admissions */
  generateCode: (input: { propertyId: string; roomPreference: string; expiresInDays: number }) => string
  revokeCode: (codeId: string) => void
  simulateIncomingRequest: (codeId: string) => void
  decideRequest: (requestId: string, decision: 'APPROVED' | 'REJECTED', reason?: string) => void

  /* staff */
  addStaff: (input: { propertyId: string; name: string; email: string; mobile: string; role: string }) => void
  updateStaff: (id: string, patch: { name: string; email: string; mobile: string; role: string; propertyId: string }) => void
  removeStaff: (id: string) => void

  /* account */
  updateProfile: (patch: Partial<OwnerProfile>) => void
  markNotificationRead: (id: string, read: boolean) => void
  markAllNotificationsRead: () => void
  /** Section 07 — dismiss a single demo notification from the bell. */
  removeNotification: (id: string) => void

  pushToast: (message: string, tone?: OwnerToast['tone']) => void
  dismissToast: (id: number) => void
}

const OwnerStoreContext = createContext<OwnerStoreValue | null>(null)

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

const BED_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const

/** Aggregate bed maths for any room set — reused by dashboard & availability. */
export function aggregateRooms(rooms: OwnerRoom[]) {
  let totalBeds = 0
  let occupied = 0
  let available = 0
  let maintenance = 0
  for (const room of rooms) {
    const o = roomOccupancy(room)
    totalBeds += o.capacity
    occupied += o.occupied
    available += o.available
    maintenance += o.maintenance
  }
  return {
    totalRooms: rooms.length,
    totalBeds,
    occupied,
    available,
    maintenance,
    occupancyPct: totalBeds > 0 ? Math.round((occupied / totalBeds) * 100) : 0,
  }
}

const SIMULATED_STUDENTS = [
  { name: 'Neha Tailor (demo)', email: 'student21@rahomitra.demo', mobile: '98765 43081' },
  { name: 'Gaurav Bhati (demo)', email: 'student22@rahomitra.demo', mobile: '98765 43082' },
  { name: 'Riya Dashora (demo)', email: 'student23@rahomitra.demo', mobile: '98765 43083' },
  { name: 'Aman Tanwar (demo)', email: 'student24@rahomitra.demo', mobile: '98765 43084' },
]

export function OwnerStoreProvider({ children }: { children: ReactNode }) {
  const [owner, setOwner] = useState<OwnerProfile>({ ...DEMO_OWNER_PROFILE })
  const [properties, setProperties] = useState<OwnerProperty[]>(OWNER_PROPERTIES)
  const [rooms, setRooms] = useState<OwnerRoom[]>(OWNER_ROOMS)
  const [students, setStudents] = useState<OwnerStudent[]>(OWNER_STUDENTS)
  const [codes, setCodes] = useState<AdmissionCode[]>(ADMISSION_CODES)
  const [requests, setRequests] = useState<AdmissionRequest[]>(ADMISSION_REQUESTS)
  const [staff, setStaff] = useState<StaffMember[]>(OWNER_STAFF)
  const [notifications, setNotifications] = useState<OwnerNotification[]>(OWNER_NOTIFICATIONS)
  const [activities, setActivities] = useState<OwnerActivity[]>(OWNER_ACTIVITIES)
  const [toasts, setToasts] = useState<OwnerToast[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('ALL')

  const toastId = useRef(0)

  const pushToast = useCallback((message: string, tone: OwnerToast['tone'] = 'success') => {
    const id = ++toastId.current
    setToasts((prev) => [...prev, { id, message, tone }])
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const logActivity = useCallback(
    (text: string, kind: OwnerActivity['kind'], propertyId: string | null = null) => {
      setActivities((prev) => [
        { id: uid('oa'), propertyId, text, time: 'just now', kind },
        ...prev,
      ])
    },
    [],
  )

  /* ------------------------------------------------------ switcher scope */

  const scopedProperties = useMemo(
    () =>
      selectedPropertyId === 'ALL'
        ? properties
        : properties.filter((p) => p.id === selectedPropertyId),
    [properties, selectedPropertyId],
  )

  const scopedPropertyIds = useMemo(
    () => scopedProperties.map((p) => p.id),
    [scopedProperties],
  )

  const selectProperty = useCallback(
    (id: string) => {
      if (id === 'ALL') {
        setSelectedPropertyId('ALL')
        return
      }
      // Isolation guard: an owner can only ever select their own properties.
      if (properties.some((p) => p.id === id)) setSelectedPropertyId(id)
    },
    [properties],
  )

  /* ------------------------------------------------------- property CRUD */

  const addProperty = useCallback(
    (input: PropertyInput) => {
      const id = uid('prop')
      setProperties((prev) => [
        ...prev,
        {
          ...input,
          id,
          ownerId: DEMO_OWNER_ID,
          status: 'DRAFT',
          listedOn: TODAY,
        },
      ])
      logActivity(`New property “${input.name}” created as DRAFT`, 'property', id)
      pushToast(`Property “${input.name}” created (demo draft).`)
    },
    [logActivity, pushToast],
  )

  const updateProperty = useCallback(
    (id: string, patch: Partial<OwnerProperty>) => {
      setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
      logActivity(`Listing details updated for “${patch.name ?? id}”`, 'property', id)
      pushToast('Property updated (demo — local state only).')
    },
    [logActivity, pushToast],
  )

  const setPropertyStatus = useCallback(
    (id: string, status: PropertyStatus) => {
      setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)))
      const name = properties.find((p) => p.id === id)?.name ?? id
      logActivity(`Property “${name}” marked ${status}`, 'property', id)
      pushToast(`“${name}” marked ${status} (demo).`)
    },
    [properties, logActivity, pushToast],
  )

  /* ---------------------------------------------------------- room CRUD */

  const addRoom = useCallback(
    (input: RoomInput) => {
      const property = properties.find((p) => p.id === input.propertyId)
      if (!property) {
        pushToast('Select a valid property for the room.', 'error')
        return
      }
      const duplicate = rooms.some(
        (r) => r.propertyId === input.propertyId && r.number.trim() === input.number.trim(),
      )
      if (duplicate) {
        pushToast(`Room number “${input.number}” already exists in ${property.name}.`, 'error')
        return
      }
      if (input.capacity < 1 || input.capacity > BED_LABELS.length) {
        pushToast('Room capacity must be between 1 and 8 beds.', 'error')
        return
      }
      const roomId = uid('room')
      const newRoom: OwnerRoom = {
        id: roomId,
        propertyId: input.propertyId,
        number: input.number.trim(),
        floor: input.floor,
        type: input.type,
        rent: input.rent,
        beds: BED_LABELS.slice(0, input.capacity).map((label) => ({
          id: `${roomId}-bed-${label}`,
          roomId,
          label,
          status: 'AVAILABLE' as BedStatus,
        })),
      }
      setRooms((prev) => [...prev, newRoom])
      logActivity(`Room ${newRoom.number} added to “${property.name}”`, 'room', property.id)
      pushToast(`Room ${newRoom.number} added with ${input.capacity} bed(s) (demo).`)
    },
    [properties, rooms, logActivity, pushToast],
  )

  const updateRoom = useCallback(
    (
      id: string,
      patch: { number: string; floor: number; type: RoomType; rent: number },
    ) => {
      setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
      pushToast(`Room ${patch.number} updated (demo).`)
    },
    [pushToast],
  )

  const deleteRoom = useCallback(
    (id: string) => {
      const room = rooms.find((r) => r.id === id)
      if (!room) return
      const allocated = students.filter(
        (s) => s.roomId === id && s.membership === 'ACTIVE',
      )
      if (allocated.length > 0) {
        pushToast(
          `Cannot delete room ${room.number} — ${allocated.length} active student(s) still allocated.`,
          'error',
        )
        return
      }
      setRooms((prev) => prev.filter((r) => r.id !== id))
      logActivity(`Room ${room.number} deleted`, 'room', room.propertyId)
      pushToast(`Room ${room.number} deleted (demo).`)
    },
    [rooms, students, logActivity, pushToast],
  )

  const addBed = useCallback(
    (roomId: string) => {
      const room = rooms.find((r) => r.id === roomId)
      if (!room) return
      if (room.beds.length >= BED_LABELS.length) {
        pushToast('Maximum 8 beds per room in this demo.', 'error')
        return
      }
      const label = BED_LABELS[room.beds.length]
      setRooms((prev) =>
        prev.map((r) =>
          r.id === roomId
            ? {
                ...r,
                beds: [...r.beds, { id: `${r.id}-bed-${label}`, roomId: r.id, label, status: 'AVAILABLE' }],
              }
            : r,
        ),
      )
      pushToast(`Bed ${label} added to room ${room.number} (demo).`)
    },
    [rooms, pushToast],
  )

  const setBedStatus = useCallback(
    (bedId: string, status: BedStatus) => {
      const room = rooms.find((r) => r.beds.some((b) => b.id === bedId))
      const bed = room?.beds.find((b) => b.id === bedId)
      if (!room || !bed) return

      // Capacity rule: a bed occupied by an active student cannot be freed
      // behind their back — end the membership first.
      if (bed.status === 'OCCUPIED' && status !== 'OCCUPIED') {
        const assigned = students.find((s) => s.bedId === bedId && s.membership === 'ACTIVE')
        if (assigned) {
          pushToast(
            `Bed ${bed.label} is allocated to ${assigned.name} — update their membership first.`,
            'error',
          )
          return
        }
      }

      setRooms((prev) =>
        prev.map((r) =>
          r.id === room.id
            ? { ...r, beds: r.beds.map((b) => (b.id === bedId ? { ...b, status } : b)) }
            : r,
        ),
      )
      pushToast(`Bed ${bed.label} in room ${room.number} set to ${status}.`, 'info')
    },
    [rooms, students, pushToast],
  )

  /* ---------------------------------------------------------- students */

  const setMembership = useCallback(
    (studentId: string, status: MembershipStatus) => {
      const student = students.find((s) => s.id === studentId)
      if (!student) return

      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, membership: status, roomId: status === 'INACTIVE' ? '' : s.roomId, bedId: status === 'INACTIVE' ? '' : s.bedId } : s)),
      )

      // Ending a membership releases the bed; capacity stays consistent.
      if (status === 'INACTIVE' && student.bedId) {
        setRooms((prev) =>
          prev.map((r) =>
            r.id === student.roomId
              ? {
                  ...r,
                  beds: r.beds.map((b) =>
                    b.id === student.bedId && b.status === 'OCCUPIED'
                      ? { ...b, status: 'AVAILABLE' }
                      : b,
                  ),
                }
              : r,
          ),
        )
      }

      logActivity(`Membership of “${student.name}” set to ${status}`, 'student', student.propertyId)
      pushToast(`${student.name} → ${status} (demo).`)
    },
    [students, logActivity, pushToast],
  )

  /* -------------------------------------------------------- admissions */

  const generateCode = useCallback(
    ({ propertyId, roomPreference, expiresInDays }: { propertyId: string; roomPreference: string; expiresInDays: number }) => {
      const property = properties.find((p) => p.id === propertyId)
      if (!property) {
        pushToast('Select a valid PG property first.', 'error')
        return ''
      }
      const prefix = property.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 4)
        .toUpperCase()
      let code = ''
      do {
        code = `ADM-${prefix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
      } while (codes.some((c) => c.code === code))

      const record: AdmissionCode = {
        id: uid('code'),
        propertyId,
        code,
        roomPreference,
        expiresOn: addDays(TODAY, expiresInDays),
        status: 'ACTIVE',
        createdOn: TODAY,
      }
      setCodes((prev) => [record, ...prev])
      logActivity(`Admission code ${code} generated for “${property.name}”`, 'admission', propertyId)
      pushToast(`Code ${code} generated — share it with the student (demo, not secure).`, 'info')
      return code
    },
    [properties, codes, logActivity, pushToast],
  )

  const revokeCode = useCallback(
    (codeId: string) => {
      setCodes((prev) => prev.map((c) => (c.id === codeId ? { ...c, status: 'REVOKED' } : c)))
      const code = codes.find((c) => c.id === codeId)?.code ?? codeId
      pushToast(`Code ${code} revoked (demo).`, 'info')
    },
    [codes, pushToast],
  )

  const simulateIncomingRequest = useCallback(
    (codeId: string) => {
      const code = codes.find((c) => c.id === codeId)
      if (!code || code.status !== 'ACTIVE') {
        pushToast('Only active codes can simulate an incoming request.', 'error')
        return
      }
      const profile = SIMULATED_STUDENTS[Math.floor(Math.random() * SIMULATED_STUDENTS.length)]
      const request: AdmissionRequest = {
        id: uid('req'),
        propertyId: code.propertyId,
        code: code.code,
        roomPreference: code.roomPreference,
        studentName: profile.name,
        studentEmail: profile.email,
        studentMobile: profile.mobile,
        requestedOn: TODAY,
        status: 'PENDING',
      }
      setRequests((prev) => [request, ...prev])
      const property = properties.find((p) => p.id === code.propertyId)
      logActivity(
        `Simulated request from “${profile.name}” for “${property?.name ?? code.propertyId}”`,
        'admission',
        code.propertyId,
      )
      pushToast(`Simulated admission request from ${profile.name} (demo).`, 'info')
    },
    [codes, properties, logActivity, pushToast],
  )

  const decideRequest = useCallback(
    (requestId: string, decision: 'APPROVED' | 'REJECTED', reason?: string) => {
      const request = requests.find((r) => r.id === requestId)
      if (!request || request.status !== 'PENDING') return

      const property = properties.find((p) => p.id === request.propertyId)
      if (!property) {
        pushToast('Property not found for this request.', 'error')
        return
      }

      if (decision === 'REJECTED') {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId
              ? { ...r, status: 'REJECTED', decidedOn: TODAY, reason: reason ?? 'Rejected (demo decision).' }
              : r,
          ),
        )
        logActivity(`Request from “${request.studentName}” rejected`, 'admission', property.id)
        pushToast(`Request from ${request.studentName} rejected (demo).`, 'info')
        return
      }

      // ---- APPROVAL: capacity check before any membership activation.
      const propertyRooms = rooms.filter((r) => r.propertyId === property.id)
      const preferred =
        request.roomPreference && propertyRooms.find((r) => r.id === request.roomPreference)
          ? propertyRooms.find((r) => r.id === request.roomPreference)!
          : null

      const candidates = preferred ? [preferred] : propertyRooms
      let targetRoom: OwnerRoom | undefined
      let targetBed
      for (const room of candidates) {
        const free = room.beds.find((b) => b.status === 'AVAILABLE')
        if (free) {
          targetRoom = room
          targetBed = free
          break
        }
      }

      if (!targetRoom || !targetBed) {
        pushToast(
          `Approval blocked — no available beds in ${property.name} (demo capacity check).`,
          'error',
        )
        return
      }

      // Allocate the bed.
      setRooms((prev) =>
        prev.map((r) =>
          r.id === targetRoom!.id
            ? {
                ...r,
                beds: r.beds.map((b) =>
                  b.id === targetBed!.id ? { ...b, status: 'OCCUPIED' as BedStatus } : b,
                ),
              }
            : r,
        ),
      )

      // Grant an active membership.
      setStudents((prev) => [
        ...prev,
        {
          id: uid('stu'),
          propertyId: property.id,
          roomId: targetRoom.id,
          bedId: targetBed.id,
          name: request.studentName,
          email: request.studentEmail,
          mobile: request.studentMobile,
          college: 'Not provided (demo)',
          city: property.city,
          admissionDate: TODAY,
          membership: 'ACTIVE',
        },
      ])

      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, status: 'APPROVED', decidedOn: TODAY } : r,
        ),
      )

      logActivity(
        `“${request.studentName}” approved — allocated room ${targetRoom.number} bed ${targetBed.label}`,
        'admission',
        property.id,
      )
      pushToast(
        `Approved — ${request.studentName} allocated room ${targetRoom.number}, bed ${targetBed.label}.`,
      )
    },
    [requests, properties, rooms, logActivity, pushToast],
  )

  /* ------------------------------------------------------------- staff */

  const addStaff = useCallback(
    (input: { propertyId: string; name: string; email: string; mobile: string; role: string }) => {
      const property = properties.find((p) => p.id === input.propertyId)
      if (!property) {
        pushToast('Select a valid PG property.', 'error')
        return
      }
      setStaff((prev) => [...prev, { ...input, id: uid('staff'), joinedOn: TODAY }])
      logActivity(`Staff member “${input.name}” added`, 'staff', input.propertyId)
      pushToast(`${input.name} added to ${property.name} (demo).`)
    },
    [properties, logActivity, pushToast],
  )

  const updateStaff = useCallback(
    (id: string, patch: { name: string; email: string; mobile: string; role: string; propertyId: string }) => {
      setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
      pushToast(`Staff record for ${patch.name} updated (demo).`)
    },
    [pushToast],
  )

  const removeStaff = useCallback(
    (id: string) => {
      const member = staff.find((s) => s.id === id)
      setStaff((prev) => prev.filter((s) => s.id !== id))
      if (member) {
        logActivity(`Staff member “${member.name}” removed`, 'staff', member.propertyId)
        pushToast(`${member.name} removed from staff (demo).`, 'info')
      }
    },
    [staff, logActivity, pushToast],
  )

  /* ----------------------------------------------------------- account */

  const updateProfile = useCallback(
    (patch: Partial<OwnerProfile>) => {
      setOwner((prev) => ({ ...prev, ...patch }))
      pushToast('Profile saved (demo — local state only).')
    },
    [pushToast],
  )

  const markNotificationRead = useCallback((id: string, read: boolean) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read } : n)))
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const value = useMemo<OwnerStoreValue>(
    () => ({
      owner,
      properties,
      rooms,
      students,
      codes,
      requests,
      staff,
      notifications,
      activities,
      toasts,
      selectedPropertyId,
      selectProperty,
      scopedProperties,
      scopedPropertyIds,
      addProperty,
      updateProperty,
      setPropertyStatus,
      addRoom,
      updateRoom,
      deleteRoom,
      addBed,
      setBedStatus,
      setMembership,
      generateCode,
      revokeCode,
      simulateIncomingRequest,
      decideRequest,
      addStaff,
      updateStaff,
      removeStaff,
      updateProfile,
      markNotificationRead,
      markAllNotificationsRead,
      removeNotification,
      pushToast,
      dismissToast,
    }),
    [
      owner,
      properties,
      rooms,
      students,
      codes,
      requests,
      staff,
      notifications,
      activities,
      toasts,
      selectedPropertyId,
      selectProperty,
      scopedProperties,
      scopedPropertyIds,
      addProperty,
      updateProperty,
      setPropertyStatus,
      addRoom,
      updateRoom,
      deleteRoom,
      addBed,
      setBedStatus,
      setMembership,
      generateCode,
      revokeCode,
      simulateIncomingRequest,
      decideRequest,
      addStaff,
      updateStaff,
      removeStaff,
      updateProfile,
      markNotificationRead,
      markAllNotificationsRead,
      removeNotification,
      pushToast,
      dismissToast,
    ],
  )

  return <OwnerStoreContext.Provider value={value}>{children}</OwnerStoreContext.Provider>
}

export function useOwnerStore(): OwnerStoreValue {
  const ctx = useContext(OwnerStoreContext)
  if (!ctx) throw new Error('useOwnerStore must be used inside <OwnerStoreProvider>')
  return ctx
}
