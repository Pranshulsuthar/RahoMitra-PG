import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BedDouble,
  Building2,
  CalendarDays,
  ChevronRight,
  DoorOpen,
  GraduationCap,
  Megaphone,
  UserRound,
  Wallet,
} from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useStudentStore } from '../../context/StudentStore'
import {
  IMPORTANT_DATES,
  ROOMMATES,
  STUDENT_ACTIVITIES,
  STUDENT_ADMISSION,
  STUDENT_PROPERTY,
  STUDENT_ROOM,
} from '../../data/studentData'
import { roomOccupancy } from '../../types/owner'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { StatisticCard } from '../../components/owner/StatisticCard'
import { StatusBadge } from '../../components/admin/StatusBadge'

const ACTIVITY_ICONS = {
  notice: Megaphone,
  rent: Wallet,
  room: BedDouble,
  profile: UserRound,
  support: GraduationCap,
}

const QUICK_ACTIONS = [
  { to: '/student/room', label: 'View my room', icon: BedDouble },
  { to: '/student/accommodation', label: 'PG details', icon: Building2 },
  { to: '/student/notices', label: 'Notice board', icon: Megaphone },
  { to: '/student/profile', label: 'Edit profile', icon: UserRound },
  { to: '/student/support', label: 'Get help', icon: GraduationCap },
]

/** /student/dashboard — premium student overview with clearly-labelled demo data. */
export function StudentDashboard() {
  useDocumentTitle('Student Dashboard')

  const { profile, notices, unreadCount } = useStudentStore()

  const occupancy = useMemo(() => roomOccupancy(STUDENT_ROOM), [])
  const recentNotices = useMemo(() => [...notices].slice(0, 4), [notices])
  const firstName = profile.name.trim().split(' ')[0]

  const initials = profile.name
    .trim()
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <>
      <AdminPageHeader
        title={`Welcome back, ${firstName}!`}
        description="Here's your PG life at a glance — room, rent, notices and important dates."
        actions={
          <>
            <Link
              to="/student/notices"
              className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory shadow-[0_10px_24px_-14px_rgba(23,61,50,0.9)] transition-all hover:bg-forest-light"
            >
              <Megaphone className="h-4 w-4" aria-hidden />
              Notices{unreadCount > 0 ? ` (${unreadCount})` : ''}
            </Link>
            <Link
              to="/student/room"
              className="inline-flex items-center gap-2 rounded-full border border-forest/25 bg-white px-5 py-2.5 text-sm font-semibold text-forest transition-all hover:border-forest hover:bg-forest hover:text-ivory"
            >
              <BedDouble className="h-4 w-4" aria-hidden />
              My Room
            </Link>
          </>
        }
      />

      <DemoBanner message="every figure below is computed from local illustrative demo data for your sample allocation in Shree Shyam Boys PG — nothing here is live platform data." />

      {/* ---------------------------------------------- welcome / profile */}
      <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-forest text-2xl font-bold text-ivory ring-4 ring-gold/40 sm:h-20 sm:w-20 sm:text-3xl">
              {initials}
            </span>
            <div className="min-w-0">
              <h2 className="text-xl text-ink sm:text-2xl">{profile.name}</h2>
              <p className="mt-0.5 truncate text-[13px] text-ink-mute">
                {profile.email} · {profile.college}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={STUDENT_ADMISSION.membership} />
                <span className="rounded-full bg-ivory px-3 py-1 text-[11px] font-bold text-ink-soft">
                  Demo student account
                </span>
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
            {[
              ['Current PG', STUDENT_PROPERTY.name],
              ['Room', `Room ${STUDENT_ROOM.number}`],
              ['Bed', `Bed ${STUDENT_ADMISSION.bedLabel}`],
              ['Admitted on', STUDENT_ADMISSION.admissionDate],
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
          value={`₹${STUDENT_ADMISSION.monthlyRent.toLocaleString('en-IN')}`}
          icon={Wallet}
          tone="forest"
          hint="Due by 5th · demo"
        />
        <StatisticCard
          label="Current Room"
          value={STUDENT_ROOM.number}
          icon={BedDouble}
          tone="ink"
          hint={`${STUDENT_ROOM.type} · Floor ${STUDENT_ROOM.floor}`}
        />
        <StatisticCard
          label="Membership Status"
          value={STUDENT_ADMISSION.membership}
          icon={GraduationCap}
          tone="gold"
          hint={`Since ${STUDENT_ADMISSION.admissionDate}`}
        />
        <StatisticCard
          label="Next Billing Date"
          value="01 Jun"
          icon={CalendarDays}
          tone="ink"
          hint={`${STUDENT_ADMISSION.nextBillingDate} · demo`}
        />
      </div>

      {/* ------------------------------------------- accommodation summary */}
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
              ['PG name', STUDENT_PROPERTY.name],
              ['Type', `${STUDENT_PROPERTY.type === 'BOYS' ? 'Boys' : 'Girls'} PG`],
              ['City', STUDENT_PROPERTY.city],
              ['Room · Bed', `${STUDENT_ROOM.number} · ${STUDENT_ADMISSION.bedLabel}`],
              ['Sharing', `${STUDENT_ROOM.type} sharing`],
              ['Occupancy', `${occupancy.occupied}/${occupancy.capacity} beds occupied`],
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
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base sm:text-lg">Recent notices</h2>
            <Link
              to="/student/notices"
              className="text-[12px] font-bold text-forest hover:text-gold-dark"
            >
              View all
            </Link>
          </div>
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
        </section>

        {/* Upcoming important dates */}
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <h2 className="mb-4 text-base sm:text-lg">Upcoming important dates</h2>
          <ul className="space-y-3">
            {IMPORTANT_DATES.map((item) => (
              <li key={item.id} className="flex gap-3">
                <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-forest-soft text-forest">
                  <span className="text-[10px] font-bold uppercase leading-none">
                    {new Date(`${item.date}T00:00:00`).toLocaleDateString('en-GB', {
                      month: 'short',
                    })}
                  </span>
                  <span className="text-sm font-bold leading-tight">
                    {new Date(`${item.date}T00:00:00`).getDate()}
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-bold text-ink">{item.label}</span>
                  <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-mute">
                    {item.note}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

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

      {/* -------------------------------------------- recent activity */}
      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6 xl:col-span-2">
          <h2 className="mb-4 text-base sm:text-lg">Recent activity</h2>
          <ul className="space-y-3.5">
            {STUDENT_ACTIVITIES.map((activity) => {
              const Icon = ACTIVITY_ICONS[activity.kind]
              return (
                <li key={activity.id} className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-forest-soft text-forest">
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] leading-snug text-ink-soft">
                      {activity.text}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-ink-mute">{activity.time}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        </section>

        {/* Roommates */}
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <h2 className="mb-1 text-base sm:text-lg">Your roommates</h2>
          <p className="mb-4 text-[12.5px] text-ink-mute">
            Sharing room {STUDENT_ROOM.number} · demo records
          </p>
          <ul className="space-y-3">
            <li className="flex items-center justify-between gap-3 rounded-2xl border border-gold/50 bg-gold-soft/50 px-3.5 py-3">
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-bold text-ink">{profile.name} (you)</p>
                <p className="text-[11.5px] text-ink-mute">
                  Bed {STUDENT_ADMISSION.bedLabel} · {profile.college}
                </p>
              </div>
              <DoorOpen className="h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
            </li>
            {ROOMMATES.map((mate) => (
              <li
                key={mate.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-ivory/30 px-3.5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-bold text-ink">{mate.name}</p>
                  <p className="text-[11.5px] text-ink-mute">
                    Bed {mate.bedLabel} · {mate.college}
                  </p>
                </div>
                <UserRound className="h-4 w-4 shrink-0 text-ink-mute" aria-hidden />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <p className="mt-6 flex items-center gap-2 text-[11.5px] text-ink-mute">
        <GraduationCap className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
        Frontend-only demo — all figures derive from local sample data and reset on reload.
      </p>
    </>
  )
}
