import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BedDouble,
  Building2,
  CalendarDays,
  ChevronRight,
  Clock,
  GraduationCap,
  KeyRound,
  Megaphone,
  UserRound,
  Wallet,
} from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAuth } from '../../context/AuthContext'
import { useStudentStore } from '../../context/StudentStore'
import {
  fetchOwnAdmissionRequests,
  fetchStudentAccommodation,
  type StudentAccommodation,
  type StudentAdmissionRequest,
} from '../../api/student'
import { JoinPGModal } from '../../components/student/JoinPGModal'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { StatisticCard } from '../../components/owner/StatisticCard'
import { StatusBadge } from '../../components/admin/StatusBadge'

const QUICK_ACTIONS = [
  { to: '/student/room', label: 'View my room', icon: BedDouble },
  { to: '/student/accommodation', label: 'PG details', icon: Building2 },
  { to: '/student/notices', label: 'Notice board', icon: Megaphone },
  { to: '/student/profile', label: 'Edit profile', icon: UserRound },
  { to: '/student/support', label: 'Get help', icon: GraduationCap },
]

export function StudentDashboard() {
  useDocumentTitle('Student Dashboard')

  const { user } = useAuth()
  const { profile, notices, unreadCount } = useStudentStore()

  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const [admissionRequests, setAdmissionRequests] = useState<StudentAdmissionRequest[]>([])
  const [liveAccommodation, setLiveAccommodation] = useState<StudentAccommodation | null>(null)
  const [loading, setLoading] = useState(true)

  const loadLiveData = async () => {
    try {
      setLoading(true)
      const [reqs, acc] = await Promise.allSettled([
        fetchOwnAdmissionRequests(),
        fetchStudentAccommodation(),
      ])
      if (reqs.status === 'fulfilled') {
        setAdmissionRequests(reqs.value)
      }
      if (acc.status === 'fulfilled') {
        setLiveAccommodation(acc.value)
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLiveData()
  }, [])

  const currentPropertyName = liveAccommodation?.property.name ?? 'Not assigned'
  const currentRoomNumber = liveAccommodation?.room.number ? `Room ${liveAccommodation.room.number}` : '—'
  const currentBedLabel = liveAccommodation?.bed.label ? `Bed ${liveAccommodation.bed.label}` : '—'
  const currentAdmissionDate = liveAccommodation?.admissionDate
    ? new Date(liveAccommodation.admissionDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—'
  const currentRent = liveAccommodation?.room.rent ?? 0
  const currentMembership = liveAccommodation ? 'ACTIVE' : 'PENDING'

  const recentNotices = useMemo(() => [...notices].slice(0, 4), [notices])
  const displayName = user?.fullName || profile.name || 'Student'
  const firstName = displayName.trim().split(' ')[0]

  const initials = displayName
    .trim()
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const pendingRequest = admissionRequests.find((r) => r.status === 'PENDING')

  return (
    <>
      <AdminPageHeader
        title={`Welcome back, ${firstName}!`}
        description="Here's your PG life at a glance — room, rent, notices and important dates."
        actions={
          <>
            <button
              type="button"
              onClick={() => setJoinModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory shadow-[0_10px_24px_-14px_rgba(23,61,50,0.9)] transition-all hover:bg-forest-light"
            >
              <KeyRound className="h-4 w-4" aria-hidden />
              Join PG with Code
            </button>
            <Link
              to="/student/notices"
              className="inline-flex items-center gap-2 rounded-full border border-forest/25 bg-white px-5 py-2.5 text-sm font-semibold text-forest transition-all hover:border-forest hover:bg-forest hover:text-ivory"
            >
              <Megaphone className="h-4 w-4" aria-hidden />
              Notices{unreadCount > 0 ? ` (${unreadCount})` : ''}
            </Link>
          </>
        }
      />

      {pendingRequest && (
        <div className="mb-6 rounded-2xl border border-gold/50 bg-gold-soft/40 p-4">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 text-gold-dark shrink-0" />
            <div>
              <p className="text-sm font-bold text-ink">
                Admission Request Pending Owner Approval
              </p>
              <p className="mt-0.5 text-xs text-ink-mute">
                You submitted an admission request for <strong className="text-ink">{pendingRequest.propertyName}</strong> ({pendingRequest.propertyLocality}, {pendingRequest.propertyCity}) using code <strong className="font-mono text-ink">{pendingRequest.code}</strong>. You will be assigned a bed once approved by the owner.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------- welcome / profile */}
      <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-forest text-2xl font-bold text-ivory ring-4 ring-gold/40 sm:h-20 sm:w-20 sm:text-3xl">
              {initials || 'ST'}
            </span>
            <div className="min-w-0">
              <h2 className="text-xl text-ink sm:text-2xl">{displayName}</h2>
              <p className="mt-0.5 truncate text-[13px] text-ink-mute">
                {user?.email || profile.email} {user?.city ? `· ${user.city}` : profile.college ? `· ${profile.college}` : ''}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={currentMembership} />
              </div>
            </div>
          </div>

          <dl className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 2xl:w-auto 2xl:min-w-[580px]">
            {[
              ['Current PG', currentPropertyName],
              ['Room', currentRoomNumber],
              ['Bed', currentBedLabel],
              ['Admitted on', currentAdmissionDate],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-line bg-ivory/40 px-3.5 py-3"
              >
                <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-mute">
                  {label}
                </dt>
                <dd className="mt-1 truncate text-[13.5px] font-bold text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------------- stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatisticCard
          label="Monthly Rent"
          value={currentRent > 0 ? `₹${currentRent.toLocaleString('en-IN')}` : '—'}
          icon={Wallet}
          tone="forest"
          hint={liveAccommodation ? 'Active room rent' : 'Not enrolled'}
        />
        <StatisticCard
          label="Current Room"
          value={liveAccommodation ? liveAccommodation.room.number : '—'}
          icon={BedDouble}
          tone="ink"
          hint={liveAccommodation ? `${liveAccommodation.room.type} · Floor ${liveAccommodation.room.floor}` : 'No room allocated'}
        />
        <StatisticCard
          label="Membership Status"
          value={currentMembership}
          icon={GraduationCap}
          tone="gold"
          hint={liveAccommodation ? 'Active resident' : 'Pending enrollment'}
        />
        <StatisticCard
          label="Admitted Since"
          value={currentAdmissionDate}
          icon={CalendarDays}
          tone="ink"
          hint={liveAccommodation ? liveAccommodation.property.name : 'Join PG with code'}
        />
      </div>

      {/* ------------------------------------------- accommodation summary or empty state */}
      {!liveAccommodation && !loading && (
        <div className="mt-6 rounded-3xl border border-dashed border-forest/30 bg-ivory/60 p-8 text-center sm:p-10">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-forest" />
          <h3 className="font-display text-lg font-bold text-ink">No PG accommodation enrolled yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
            To see your room, roommates, notices and rent invoices, ask your PG owner for an admission code and enter it below.
          </p>
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => setJoinModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-ivory shadow-card transition-colors hover:bg-forest-light"
            >
              <KeyRound className="h-4 w-4" />
              Join PG with Admission Code
            </button>
          </div>
        </div>
      )}

      {liveAccommodation && (
        <div className="mt-6 grid gap-5 xl:grid-cols-3">
          <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base sm:text-lg">Accommodation summary</h2>
              <Link
                to="/student/accommodation"
                className="text-[12px] font-bold text-forest hover:text-gold-dark"
              >
                View all
              </Link>
            </div>
            <dl className="space-y-2.5 text-[13px]">
              {[
                ['PG name', liveAccommodation.property.name],
                ['Locality', `${liveAccommodation.property.locality}, ${liveAccommodation.property.city}`],
                ['Address', liveAccommodation.property.address || '—'],
                ['Room · Bed', `Room ${liveAccommodation.room.number} · Bed ${liveAccommodation.bed.label}`],
                ['Room Type', `${liveAccommodation.room.type} sharing`],
                ['Monthly Rent', `₹${liveAccommodation.room.rent.toLocaleString('en-IN')}`],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-ivory/30 px-3.5 py-2.5"
                >
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">
                    {label}
                  </dt>
                  <dd className="truncate text-right font-semibold text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            <Link
              to="/student/accommodation"
              className="mt-4 inline-flex items-center gap-2 text-[13px] font-bold text-forest hover:text-gold-dark"
            >
              Full PG details
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </section>

          {/* Recent notices */}
          <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6 xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base sm:text-lg">Recent notices</h2>
              <Link
                to="/student/notices"
                className="text-[12px] font-bold text-forest hover:text-gold-dark"
              >
                View all
              </Link>
            </div>
            {recentNotices.length > 0 ? (
              <ul className="space-y-3">
                {recentNotices.map((notice) => (
                  <li
                    key={notice.id}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-line bg-ivory/30 px-3.5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 truncate text-[13.5px] font-bold text-ink">
                        {!notice.read && (
                          <span
                            className="h-2 w-2 shrink-0 rounded-full bg-gold"
                            aria-label="Unread"
                            aria-hidden
                          />
                        )}
                        <span className="truncate">{notice.title}</span>
                      </p>
                      <p className="mt-1 text-[11.5px] text-ink-mute">
                        {notice.category} · {notice.date}
                      </p>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-ink-mute" aria-hidden />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-2xl border border-line bg-ivory/30 p-6 text-center text-sm text-ink-mute">
                No active announcements published yet.
              </div>
            )}
          </section>
        </div>
      )}

      {/* --------------------------------------------------- quick actions */}
      <section className="mt-6 rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
        <h2 className="text-base sm:text-lg">Quick actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-line bg-ivory/40 px-4 py-4 transition-all hover:border-gold/50 hover:bg-white hover:shadow-card"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-soft text-forest transition-colors group-hover:bg-forest group-hover:text-ivory">
                  <action.icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="text-[13px] font-bold leading-tight text-ink">
                  {action.label}
                </span>
              </span>
              <ArrowRight
                className="h-4 w-4 text-ink-mute transition-transform group-hover:translate-x-1 group-hover:text-forest"
                aria-hidden
              />
            </Link>
          ))}
        </div>
      </section>

      <JoinPGModal
        open={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onSuccess={() => {
          loadLiveData()
        }}
      />
    </>
  )
}
