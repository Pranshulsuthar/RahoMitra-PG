import { useMemo, useState } from 'react'
import { BarChart3, CalendarRange, RotateCcw } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdminStore } from '../../context/AdminStore'
import {
  getLastNMonths,
  computeMonthlyCounts,
  computeMonthlyRevenue,
  computePlanDistribution,
  computeApprovalRatio,
} from '../../utils/adminAnalytics'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { BarChart, DonutChart, LineChart } from '../../components/admin/Charts'
import { StatCard } from '../../components/admin/StatCard'
import { formatINR } from '../../utils/format'

function getDefaultFrom(): string {
  const d = new Date()
  d.setMonth(d.getMonth() - 5)
  d.setDate(1)
  return d.toISOString().slice(0, 10)
}

function getDefaultTo(): string {
  return new Date().toISOString().slice(0, 10)
}

/** /admin/reports — platform reports & analytics with date filters. */
export function Reports() {
  useDocumentTitle('Reports & Analytics')

  const { pgs, owners, students, subscriptions, applications, payments, plans } = useAdminStore()

  const [from, setFrom] = useState(getDefaultFrom)
  const [to, setTo] = useState(getDefaultTo)
  const [applied, setApplied] = useState({ from: getDefaultFrom(), to: getDefaultTo() })

  const rangeError = applied.from > applied.to ? 'The start date must be before the end date.' : null

  const monthLabels = useMemo(() => getLastNMonths(6), [])

  const filteredPgs = useMemo(
    () => pgs.filter((p) => !p.registeredOn || (p.registeredOn >= applied.from && p.registeredOn <= applied.to)),
    [pgs, applied],
  )
  const filteredOwners = useMemo(
    () => owners.filter((o) => !o.joinedOn || (o.joinedOn >= applied.from && o.joinedOn <= applied.to)),
    [owners, applied],
  )
  const filteredStudents = useMemo(
    () => students.filter((s) => !s.joinedOn || (s.joinedOn >= applied.from && s.joinedOn <= applied.to)),
    [students, applied],
  )
  const filteredPayments = useMemo(
    () => payments.filter((p) => !p.paidOn || (p.paidOn >= applied.from && p.paidOn <= applied.to)),
    [payments, applied],
  )

  const totalPgs = filteredPgs.length
  const totalOwners = filteredOwners.length
  const totalStudents = filteredStudents.length
  const totalRevenue = filteredPayments.reduce((a, b) => a + (b.amount || 0), 0)

  const planDistribution = useMemo(() => computePlanDistribution(subscriptions, plans), [subscriptions, plans])
  const approvalRatio = useMemo(() => computeApprovalRatio(applications), [applications])

  const approvedCount = applications.filter((a) => a.status === 'APPROVED').length
  const avgApproval = applications.length > 0 ? Math.round((approvedCount / applications.length) * 100) : 0

  const pgTrendData = useMemo(() => {
    const counts = computeMonthlyCounts(filteredPgs, 'registeredOn', monthLabels)
    return monthLabels.map((m, i) => ({ label: m, value: counts[i] }))
  }, [filteredPgs, monthLabels])

  const ownerTrendData = useMemo(() => {
    const counts = computeMonthlyCounts(filteredOwners, 'joinedOn', monthLabels)
    return monthLabels.map((m, i) => ({ label: m, value: counts[i] }))
  }, [filteredOwners, monthLabels])

  const studentTrendData = useMemo(() => {
    const counts = computeMonthlyCounts(filteredStudents, 'joinedOn', monthLabels)
    return monthLabels.map((m, i) => ({ label: m, value: counts[i] }))
  }, [filteredStudents, monthLabels])

  const revenueTrendData = useMemo(() => {
    const rev = computeMonthlyRevenue(filteredPayments, monthLabels)
    return monthLabels.map((m, i) => ({ label: m, value: rev[i] }))
  }, [filteredPayments, monthLabels])

  const reset = () => {
    const dFrom = getDefaultFrom()
    const dTo = getDefaultTo()
    setFrom(dFrom)
    setTo(dTo)
    setApplied({ from: dFrom, to: dTo })
  }

  const apply = () => setApplied({ from, to })

  return (
    <>
      <AdminPageHeader
        title="Reports & Analytics"
        description="Platform reports covering PG registrations, owner and student sign-ups, plan distribution, subscription revenue and application outcomes."
        actions={
          <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-card">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-mute">
                From
              </span>
              <input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="form-input rounded-xl px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-mute">
                To
              </span>
              <input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="form-input rounded-xl px-3 py-2 text-sm"
              />
            </label>
            <button
              type="button"
              onClick={apply}
              className="inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-forest-light"
            >
              <CalendarRange className="h-4 w-4" aria-hidden />
              Apply
            </button>
            <button
              type="button"
              onClick={reset}
              aria-label="Reset date filters"
              className="inline-flex items-center gap-2 rounded-xl border border-line px-3.5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-forest hover:text-forest"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
            </button>
          </div>
        }
      />

      {rangeError && (
        <div className="mb-6 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">
          {rangeError}
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="PG registrations" value={totalPgs} icon={BarChart3} hint="In selected range" />
        <StatCard label="Owner registrations" value={totalOwners} icon={BarChart3} tone="gold" hint="In selected range" />
        <StatCard label="Student registrations" value={totalStudents} icon={BarChart3} tone="ink" hint="In selected range" />
        <StatCard label="Subscription revenue" value={formatINR(totalRevenue)} icon={BarChart3} tone="forest" hint="Total revenue" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="mb-4">
            <h2 className="text-base sm:text-lg">PG registration trend</h2>
            <p className="mt-0.5 text-xs text-ink-mute">New listings per month</p>
          </div>
          <LineChart
            data={pgTrendData}
            color="#173D32"
            ariaLabel="Line chart of PG registrations over the selected range"
          />
        </section>

        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="mb-4">
            <h2 className="text-base sm:text-lg">Owner registrations</h2>
            <p className="mt-0.5 text-xs text-ink-mute">New owner sign-ups per month</p>
          </div>
          <BarChart
            data={ownerTrendData}
            color="#C49A52"
            ariaLabel="Bar chart of owner registrations over the selected range"
          />
        </section>

        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="mb-4">
            <h2 className="text-base sm:text-lg">Student registrations</h2>
            <p className="mt-0.5 text-xs text-ink-mute">New student sign-ups per month</p>
          </div>
          <BarChart
            data={studentTrendData}
            color="#1F5143"
            ariaLabel="Bar chart of student registrations over the selected range"
          />
        </section>

        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="mb-4">
            <h2 className="text-base sm:text-lg">Monthly subscription revenue</h2>
            <p className="mt-0.5 text-xs text-ink-mute">RahoMitra subscription revenue</p>
          </div>
          <LineChart
            data={revenueTrendData}
            color="#C49A52"
            valuePrefix="₹"
            ariaLabel="Line chart of monthly subscription revenue over the selected range"
          />
        </section>

        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="mb-4">
            <h2 className="text-base sm:text-lg">Subscription plan distribution</h2>
            <p className="mt-0.5 text-xs text-ink-mute">Subscriptions by plan</p>
          </div>
          <DonutChart
            data={planDistribution}
            centerLabel="SUBS"
            ariaLabel="Donut chart of subscription plan distribution"
          />
        </section>

        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="mb-4">
            <h2 className="text-base sm:text-lg">Application approval ratio</h2>
            <p className="mt-0.5 text-xs text-ink-mute">
              Overall approval rate: {avgApproval}%
            </p>
          </div>
          <DonutChart
            data={approvalRatio}
            centerLabel="APPS"
            ariaLabel="Donut chart of owner application approval ratio"
          />
        </section>
      </div>
    </>
  )
}
