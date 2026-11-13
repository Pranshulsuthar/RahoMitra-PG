import { useMemo, useState } from 'react'
import { BarChart3, CalendarRange, RotateCcw } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { MONTHS, SERIES, PLAN_DISTRIBUTION, APPROVAL_RATIO } from '../../data/adminData'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { BarChart, DonutChart, LineChart } from '../../components/admin/Charts'
import { StatCard } from '../../components/admin/StatCard'
import { EmptyState } from '../../components/common/EmptyState'
import { formatINR } from '../../utils/format'

const MONTH_DATES = ['2026-01-01', '2026-02-01', '2026-03-01', '2026-04-01']
const DEFAULT_FROM = '2026-01-01'
const DEFAULT_TO = '2026-04-30'

/** /admin/reports — illustrative analytics with working date filters (demo). */
export function Reports() {
  useDocumentTitle('Reports & Analytics')

  const [from, setFrom] = useState(DEFAULT_FROM)
  const [to, setTo] = useState(DEFAULT_TO)
  const [applied, setApplied] = useState({ from: DEFAULT_FROM, to: DEFAULT_TO })

  const rangeError =
    applied.from > applied.to ? 'The start date must be before the end date.' : null

  const indices = useMemo(() => {
    if (rangeError) return []
    return MONTH_DATES.map((_, i) => i).filter(
      (i) => MONTH_DATES[i] >= applied.from && MONTH_DATES[i] <= applied.to,
    )
  }, [applied, rangeError])

  const inRange = (series: readonly number[]) => indices.map((i) => series[i])

  const slice = (series: readonly number[]) => MONTHS.map((m, i) => ({ label: m, value: series[i] })).filter((_, i) => indices.includes(i))

  const totalPgs = inRange(SERIES.pgRegistrations).reduce((a, b) => a + b, 0)
  const totalOwners = inRange(SERIES.ownerRegistrations).reduce((a, b) => a + b, 0)
  const totalStudents = inRange(SERIES.studentRegistrations).reduce((a, b) => a + b, 0)
  const totalRevenue = inRange(SERIES.revenue).reduce((a, b) => a + b, 0)
  const avgApproval = Math.round((APPROVAL_RATIO[0].value / (APPROVAL_RATIO[0].value + APPROVAL_RATIO[1].value + APPROVAL_RATIO[2].value)) * 100)

  const reset = () => {
    setFrom(DEFAULT_FROM)
    setTo(DEFAULT_TO)
    setApplied({ from: DEFAULT_FROM, to: DEFAULT_TO })
  }

  const apply = () => setApplied({ from, to })

  return (
    <>
      <AdminPageHeader
        title="Reports & Analytics"
        description="Illustrative platform reports covering PG registrations, owner and student sign-ups, plan distribution, subscription revenue and application outcomes."
        actions={
          <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-card">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-mute">
                From
              </span>
              <input
                type="date"
                value={from}
                min={DEFAULT_FROM}
                max={DEFAULT_TO}
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
                min={DEFAULT_FROM}
                max={DEFAULT_TO}
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

      <DemoBanner message="every chart and figure below is generated from a fixed illustrative dataset — not live platform analytics." />

      {rangeError && (
        <div className="mb-6 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">
          {rangeError}
        </div>
      )}

      {!rangeError && indices.length === 0 ? (
        <EmptyState
          title="No data in this date range"
          description="The demo dataset covers January 2026 to April 2026. Choose a range inside that window."
          icon={<BarChart3 className="h-6 w-6" aria-hidden />}
        />
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="PG registrations" value={totalPgs} icon={BarChart3} hint="In selected range" />
            <StatCard label="Owner registrations" value={totalOwners} icon={BarChart3} tone="gold" hint="In selected range" />
            <StatCard label="Student registrations" value={totalStudents} icon={BarChart3} tone="ink" hint="In selected range" />
            <StatCard label="Subscription revenue" value={formatINR(totalRevenue)} icon={BarChart3} tone="forest" hint="Illustrative total" />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
              <div className="mb-4">
                <h2 className="text-base sm:text-lg">PG registration trend</h2>
                <p className="mt-0.5 text-xs text-ink-mute">New listings per month · demo data</p>
              </div>
              <LineChart
                data={slice(SERIES.pgRegistrations)}
                color="#173D32"
                ariaLabel="Line chart of PG registrations over the selected range (demo)"
              />
            </section>

            <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
              <div className="mb-4">
                <h2 className="text-base sm:text-lg">Owner registrations</h2>
                <p className="mt-0.5 text-xs text-ink-mute">New owner sign-ups per month · demo data</p>
              </div>
              <BarChart
                data={slice(SERIES.ownerRegistrations)}
                color="#C49A52"
                ariaLabel="Bar chart of owner registrations over the selected range (demo)"
              />
            </section>

            <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
              <div className="mb-4">
                <h2 className="text-base sm:text-lg">Student registrations</h2>
                <p className="mt-0.5 text-xs text-ink-mute">New student sign-ups per month · demo data</p>
              </div>
              <BarChart
                data={slice(SERIES.studentRegistrations)}
                color="#1F5143"
                ariaLabel="Bar chart of student registrations over the selected range (demo)"
              />
            </section>

            <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
              <div className="mb-4">
                <h2 className="text-base sm:text-lg">Monthly subscription revenue</h2>
                <p className="mt-0.5 text-xs text-ink-mute">RahoMitra SaaS revenue · illustrative ₹</p>
              </div>
              <LineChart
                data={slice(SERIES.revenue)}
                color="#C49A52"
                valuePrefix="₹"
                ariaLabel="Line chart of monthly subscription revenue over the selected range (demo)"
              />
            </section>

            <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
              <div className="mb-4">
                <h2 className="text-base sm:text-lg">Subscription plan distribution</h2>
                <p className="mt-0.5 text-xs text-ink-mute">Active demo subscriptions by plan</p>
              </div>
              <DonutChart
                data={PLAN_DISTRIBUTION}
                centerLabel="SUBS"
                ariaLabel="Donut chart of subscription plan distribution (demo)"
              />
            </section>

            <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
              <div className="mb-4">
                <h2 className="text-base sm:text-lg">Application approval ratio</h2>
                <p className="mt-0.5 text-xs text-ink-mute">
                  Overall approval rate: {avgApproval}% · demo data
                </p>
              </div>
              <DonutChart
                data={APPROVAL_RATIO}
                centerLabel="APPS"
                ariaLabel="Donut chart of owner application approval ratio (demo)"
              />
            </section>
          </div>

          <p className="mt-6 rounded-2xl border border-dashed border-gold/60 bg-gold-soft/50 px-4 py-3 text-[12px] leading-relaxed text-gold-dark">
            <strong className="font-bold uppercase tracking-wide">Demo data</strong> — date filters
            only re-slice the fixed sample dataset (Jan–Apr 2026). No analytics service is connected.
          </p>
        </>
      )}
    </>
  )
}
