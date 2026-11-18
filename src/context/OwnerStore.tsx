import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  fetchOwnerDashboard,
  apiCreateProperty,
  apiUpdateProperty,
  apiSetPropertyStatus,
  apiCreateRoom,
  apiUpdateRoom,
  apiDeleteRoom,
  apiAddBed,
  apiSetBedStatus,
  apiSetStudentMembership,
  apiAddStaff,
  apiUpdateStaff,
  apiRemoveStaff,
  apiGenerateAdmissionCode,
  apiRevokeAdmissionCode,
  apiDecideAdmissionRequest,
  apiUpdateProfile,
  apiMarkNotificationRead,
  apiMarkAllNotificationsRead,
  apiRemoveNotification,
  type PropertyInput,
  type RoomInput,
} from '../api/owner'
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
import type { PlanRecord, SubscriptionRecord } from '../types/admin'
import { roomOccupancy } from '../types/owner'
import { useAuth } from './AuthContext'

export type { PropertyInput, RoomInput }

const DEFAULT_OWNER_PROFILE: OwnerProfile = {
  id: '',
  name: '',
  email: '',
  mobile: '',
  bio: '',
  city: '',
  joinedOn: new Date().toISOString().slice(0, 10),
  verified: false,
}

interface OwnerStoreValue {
  /* data */
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
  plans: PlanRecord[]
  subscription: SubscriptionRecord | null
  refresh: () => Promise<void>

  /* property switcher */
  selectedPropertyId: string // 'ALL' | property id
  selectProperty: (id: string) => void
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
  decideRequest: (requestId: string, decision: 'APPROVED' | 'REJECTED', reason?: string) => void

  /* staff */
  addStaff: (input: { propertyId: string; name: string; email: string; mobile: string; role: string }) => void
  updateStaff: (id: string, patch: { name: string; email: string; mobile: string; role: string; propertyId: string }) => void
  removeStaff: (id: string) => void

  /* account */
  updateProfile: (patch: Partial<OwnerProfile>) => void
  markNotificationRead: (id: string, read: boolean) => void
  markAllNotificationsRead: () => void
  removeNotification: (id: string) => void

  pushToast: (message: string, tone?: OwnerToast['tone']) => void
  dismissToast: (id: number) => void
}

const OwnerStoreContext = createContext<OwnerStoreValue | null>(null)

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

export function OwnerStoreProvider({ children }: { children: ReactNode }) {
  const { role, status } = useAuth()

  const [owner, setOwner] = useState<OwnerProfile>(DEFAULT_OWNER_PROFILE)
  const [properties, setProperties] = useState<OwnerProperty[]>([])
  const [rooms, setRooms] = useState<OwnerRoom[]>([])
  const [students, setStudents] = useState<OwnerStudent[]>([])
  const [codes, setCodes] = useState<AdmissionCode[]>([])
  const [requests, setRequests] = useState<AdmissionRequest[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [notifications, setNotifications] = useState<OwnerNotification[]>([])
  const [activities, setActivities] = useState<OwnerActivity[]>([])
  const [toasts, setToasts] = useState<OwnerToast[]>([])
  const [plans, setPlans] = useState<PlanRecord[]>([])
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null)
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
        { id: `oa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, propertyId, text, time: 'just now', kind },
        ...prev,
      ])
    },
    [],
  )

  // Load real owner data from API when authenticated as owner
  const loadOwnerData = useCallback(async () => {
    if (status !== 'authenticated' || role !== 'owner') return

    try {
      const data = await fetchOwnerDashboard()
      setOwner(data.owner)
      setProperties(data.properties)
      setRooms(data.rooms)
      setStudents(data.students)
      setStaff(data.staff)
      setCodes(data.codes)
      setRequests(data.requests)
      setNotifications(data.notifications)
      setActivities(data.activities)
      setPlans(data.plans || [])
      setSubscription(data.subscription || null)
    } catch {
      // Graceful fallback to demo data if backend is offline or during initialization
    }
  }, [role, status])

  useEffect(() => {
    loadOwnerData()
  }, [loadOwnerData])

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
      if (properties.some((p) => p.id === id)) setSelectedPropertyId(id)
    },
    [properties],
  )

  /* ------------------------------------------------------- property CRUD */

  const addProperty = useCallback(
    async (input: PropertyInput) => {
      try {
        const created = await apiCreateProperty(input)
        setProperties((prev) => [created, ...prev])
        logActivity(`New property "${created.name}" created (Pending Admin Approval)`, 'property', created.id)
        pushToast(`Property "${created.name}" created (Pending Admin Approval).`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to create property'
        pushToast(msg, 'error')
      }
    },
    [logActivity, pushToast],
  )

  const updateProperty = useCallback(
    async (id: string, patch: Partial<OwnerProperty>) => {
      // Optimistic update
      setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
      try {
        const updated = await apiUpdateProperty(id, patch)
        setProperties((prev) => prev.map((p) => (p.id === id ? updated : p)))
        logActivity(`Listing details updated for "${patch.name ?? id}"`, 'property', id)
        pushToast('Property updated successfully.')
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update property'
        pushToast(msg, 'error')
        loadOwnerData()
      }
    },
    [loadOwnerData, logActivity, pushToast],
  )

  const setPropertyStatus = useCallback(
    async (id: string, newStatus: PropertyStatus) => {
      setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)))
      try {
        await apiSetPropertyStatus(id, newStatus)
        const name = properties.find((p) => p.id === id)?.name ?? id
        logActivity(`Property "${name}" marked ${newStatus}`, 'property', id)
        pushToast(`"${name}" marked ${newStatus}.`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update property status'
        pushToast(msg, 'error')
        loadOwnerData()
      }
    },
    [properties, loadOwnerData, logActivity, pushToast],
  )

  /* ---------------------------------------------------------- room CRUD */

  const addRoom = useCallback(
    async (input: RoomInput) => {
      try {
        const created = await apiCreateRoom(input)
        setRooms((prev) => [...prev, created])
        const propName = properties.find((p) => p.id === input.propertyId)?.name ?? 'property'
        logActivity(`Room ${created.number} added to "${propName}"`, 'room', input.propertyId)
        pushToast(`Room ${created.number} added with ${created.beds.length} bed(s).`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to add room'
        pushToast(msg, 'error')
      }
    },
    [properties, logActivity, pushToast],
  )

  const updateRoom = useCallback(
    async (
      id: string,
      patch: { number: string; floor: number; type: RoomType; rent: number },
    ) => {
      setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
      try {
        const updated = await apiUpdateRoom(id, patch)
        setRooms((prev) => prev.map((r) => (r.id === id ? updated : r)))
        pushToast(`Room ${patch.number} updated.`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update room'
        pushToast(msg, 'error')
        loadOwnerData()
      }
    },
    [loadOwnerData, pushToast],
  )

  const deleteRoom = useCallback(
    async (id: string) => {
      const room = rooms.find((r) => r.id === id)
      if (!room) return
      setRooms((prev) => prev.filter((r) => r.id !== id))
      try {
        await apiDeleteRoom(id)
        logActivity(`Room ${room.number} deleted`, 'room', room.propertyId)
        pushToast(`Room ${room.number} deleted.`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to delete room'
        pushToast(msg, 'error')
        loadOwnerData()
      }
    },
    [rooms, loadOwnerData, logActivity, pushToast],
  )

  const addBed = useCallback(
    async (roomId: string) => {
      const room = rooms.find((r) => r.id === roomId)
      if (!room) return
      try {
        const bed = await apiAddBed(roomId)
        setRooms((prev) =>
          prev.map((r) => (r.id === roomId ? { ...r, beds: [...r.beds, bed] } : r)),
        )
        pushToast(`Bed ${bed.label} added to room ${room.number}.`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to add bed'
        pushToast(msg, 'error')
      }
    },
    [rooms, pushToast],
  )

  const setBedStatus = useCallback(
    async (bedId: string, statusVal: BedStatus) => {
      const room = rooms.find((r) => r.beds.some((b) => b.id === bedId))
      const bed = room?.beds.find((b) => b.id === bedId)
      if (!room || !bed) return

      setRooms((prev) =>
        prev.map((r) =>
          r.id === room.id
            ? { ...r, beds: r.beds.map((b) => (b.id === bedId ? { ...b, status: statusVal } : b)) }
            : r,
        ),
      )
      try {
        await apiSetBedStatus(bedId, statusVal)
        pushToast(`Bed ${bed.label} in room ${room.number} set to ${statusVal}.`, 'info')
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to set bed status'
        pushToast(msg, 'error')
        loadOwnerData()
      }
    },
    [rooms, loadOwnerData, pushToast],
  )

  /* ---------------------------------------------------------- students */

  const setMembership = useCallback(
    async (studentId: string, membershipVal: MembershipStatus) => {
      const student = students.find((s) => s.id === studentId)
      if (!student) return

      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId
            ? {
                ...s,
                membership: membershipVal,
                roomId: membershipVal === 'INACTIVE' ? '' : s.roomId,
                bedId: membershipVal === 'INACTIVE' ? '' : s.bedId,
              }
            : s,
        ),
      )

      try {
        await apiSetStudentMembership(studentId, membershipVal)
        logActivity(`Membership of "${student.name}" set to ${membershipVal}`, 'student', student.propertyId)
        pushToast(`${student.name} → ${membershipVal}.`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update student membership'
        pushToast(msg, 'error')
        loadOwnerData()
      }
    },
    [students, loadOwnerData, logActivity, pushToast],
  )

  /* -------------------------------------------------------- admissions */

  const generateCode = useCallback(
    (input: { propertyId: string; roomPreference: string; expiresInDays: number }) => {
      const property = properties.find((p) => p.id === input.propertyId)
      if (!property) {
        pushToast('Select a valid PG property first.', 'error')
        return ''
      }

      const tempCode = `ADM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

      apiGenerateAdmissionCode(input)
        .then((created) => {
          setCodes((prev) => [created, ...prev])
          logActivity(`Admission code ${created.code} generated for "${property.name}"`, 'admission', input.propertyId)
          pushToast(`Code ${created.code} generated successfully.`, 'info')
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Failed to generate code'
          pushToast(msg, 'error')
        })

      return tempCode
    },
    [properties, logActivity, pushToast],
  )

  const revokeCode = useCallback(
    async (codeId: string) => {
      setCodes((prev) => prev.map((c) => (c.id === codeId ? { ...c, status: 'REVOKED' } : c)))
      try {
        await apiRevokeAdmissionCode(codeId)
        const code = codes.find((c) => c.id === codeId)?.code ?? codeId
        pushToast(`Code ${code} revoked.`, 'info')
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to revoke code'
        pushToast(msg, 'error')
        loadOwnerData()
      }
    },
    [codes, loadOwnerData, pushToast],
  )

  const decideRequest = useCallback(
    async (requestId: string, decision: 'APPROVED' | 'REJECTED', reason?: string) => {
      const request = requests.find((r) => r.id === requestId)
      if (!request || request.status !== 'PENDING') return

      try {
        await apiDecideAdmissionRequest(requestId, decision, reason)
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: decision, reason } : r)),
        )
        pushToast(`Request ${decision.toLowerCase()} successfully.`)
        loadOwnerData()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to decide request'
        pushToast(msg, 'error')
      }
    },
    [requests, loadOwnerData, pushToast],
  )

  /* ------------------------------------------------------------- staff */

  const addStaff = useCallback(
    async (input: { propertyId: string; name: string; email: string; mobile: string; role: string }) => {
      try {
        const created = await apiAddStaff(input)
        setStaff((prev) => [created, ...prev])
        logActivity(`Staff member "${created.name}" added`, 'staff', input.propertyId)
        pushToast(`${created.name} added to staff.`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to add staff'
        pushToast(msg, 'error')
      }
    },
    [logActivity, pushToast],
  )

  const updateStaff = useCallback(
    async (
      id: string,
      patch: { name: string; email: string; mobile: string; role: string; propertyId: string },
    ) => {
      try {
        const updated = await apiUpdateStaff(id, patch)
        setStaff((prev) => prev.map((s) => (s.id === id ? updated : s)))
        pushToast(`Staff record for ${patch.name} updated.`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update staff'
        pushToast(msg, 'error')
      }
    },
    [pushToast],
  )

  const removeStaff = useCallback(
    async (id: string) => {
      const member = staff.find((s) => s.id === id)
      setStaff((prev) => prev.filter((s) => s.id !== id))
      try {
        await apiRemoveStaff(id)
        if (member) {
          logActivity(`Staff member "${member.name}" removed`, 'staff', member.propertyId)
          pushToast(`${member.name} removed from staff.`, 'info')
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to remove staff'
        pushToast(msg, 'error')
        loadOwnerData()
      }
    },
    [staff, loadOwnerData, logActivity, pushToast],
  )

  /* ----------------------------------------------------------- account */

  const updateProfile = useCallback(
    async (patch: Partial<OwnerProfile>) => {
      try {
        const updated = await apiUpdateProfile(patch)
        setOwner(updated)
        pushToast('Profile updated successfully.')
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update profile'
        pushToast(msg, 'error')
      }
    },
    [pushToast],
  )

  const markNotificationRead = useCallback((id: string, read: boolean) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read } : n)))
    apiMarkNotificationRead(id, read).catch(() => {})
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    apiMarkAllNotificationsRead().catch(() => {})
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    apiRemoveNotification(id).catch(() => {})
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
      plans,
      subscription,
      refresh: loadOwnerData,
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
      plans,
      subscription,
      loadOwnerData,
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

export function useOwnerStore() {
  const ctx = useContext(OwnerStoreContext)
  if (!ctx) throw new Error('useOwnerStore must be used inside OwnerStoreProvider')
  return ctx
}
