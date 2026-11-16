import { useMemo, useState } from 'react'
import { Building2, Download, FileText, GraduationCap, IndianRupee, Layers, Printer, Users } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdminStore } from '../../context/AdminStore'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DataTable } from '../../components/admin/DataTable'
import type { Column } from '../../components/admin/DataTable'
import { FilterSelect } from '../../components/admin/Filters'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { StatCard } from '../../components/admin/StatCard'
import { formatINR } from '../../utils/format'
import { cn } from '../../utils/cn'

type ReportGroup = 'owners' | 'properties' | 'students' | 'revenue' | 'subscriptions'

const GROUPS: Array<{ id: ReportGroup; label: string; icon: typeof Users }> = [
  { id: 'owners', label: 'Owner Reports', icon: Users },
  { id: 'properties', label: 'Property Reports', icon: Building2 },
  { id: 'students', label: 'Student Reports', icon: GraduationCap },
  { id: 'revenue', label: 'Revenue Reports', icon: IndianRupee },
  { id: 'subscriptions', label: 'Subscription Reports', icon: Layers },
]

interface OwnerRow {
  id: string
  name: string
  email: string
  city: string
  properties: number
  joined: string
  status: string
}
interface PropertyRow {
  id: string
  name: string
  owner: string
  city: string
  locality: string
  rent: number
  beds: number
  status: string
}
interface StudentRow {
  id: string
  name: string
  city: string
  pg: string
  rent: number
  status: string
}
interface RevenueRow {
  id: string
  source: string
  party: string
  amount: number
  date: string
  kind: string
}
interface SubscriptionRow {
  id: string
  ownerName: string
  planName: string
  amount: number
  startOn: string
  expiryOn: string
  city: string
  status: string
  suspended?: boolean
}

/** /admin/platform-reports — platform report groups with CSV export + print. */
export function PlatformReports() {
  useDocumentTitle('Platform Reports')

  const { pgs, owners, students, subscriptions, plans, featuredRequests, pushToast } = useAdminStore()
  const [group, setGroup] = useState<ReportGroup>('owners')
  const [city, setCity] = useState('All cities')
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return d.toISOString().slice(0, 10)
  })
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10))

  const availableCities = useMemo(() => {
    const set = new Set<string>()
    pgs.forEach((p) => p.city && set.add(p.city))
    owners.forEach((o) => o.city && set.add(o.city))
    return ['All cities', ...Array.from(set).sort()]
  }, [pgs, owners])

  const cityMatch = (rowCity: string) => city === 'All cities' || rowCity === city
  const ownerCity = (ownerName: string) => owners.find((o) => o.name === ownerName)?.city ?? ''
  const planName = (planId: string) => plans.find((p) => p.id === planId)?.name ?? planId

  /* ---------------------------------------------- owner report rows */
  const ownerRows: OwnerRow[] = useMemo(
    () =>
      owners.filter((o) => cityMatch(o.city)).map((o) => ({
        id: o.id,
        name: o.name,
        email: o.email,
        city: o.city,
        properties: (o.pgIds || []).length,
        joined: o.joinedOn,
        status: o.status,
      })),
    [owners, city],
  )

  /* ------------------------------------------- property report rows */
  const propertyRows: PropertyRow[] = useMemo(
    () =>
      pgs.filter((p) => cityMatch(p.city)).map((p) => ({
        id: p.id,
        name: p.name,
        owner: p.ownerName,
        city: p.city,
        locality: p.locality,
        rent: p.rent,
        beds: (p.roomCategories || []).reduce((sum, r) => sum + (Number(r.sharing) || 0), 0),
        status: p.status,
      })),
    [pgs, city],
  )

  /* -------------------------------------------- student report rows */
  const studentRows: StudentRow[] = useMemo(() => {
    return students
      .filter((s) => {
        const pg = pgs.find((p) => p.id === s.pgId || p.name === s.pgName)
        const studentCity = pg?.city ?? ''
        return cityMatch(studentCity)
      })
      .map((s) => {
        const pg = pgs.find((p) => p.id === s.pgId || p.name === s.pgName)
        return {
          id: s.id,
          name: s.name,
          city: pg?.city ?? '—',
          pg: s.pgName || pg?.name || '—',
          rent: s.monthlyRent ?? 0,
          status: s.status || s.membership || 'ACTIVE',
        }
      })
  }, [students, pgs, city])

  /* ------------------------------------------- revenue report rows */
  const revenueRows: RevenueRow[] = useMemo(() => {
    const planRevenue: RevenueRow[] = subscriptions
      .filter((s) => s.status !== 'CANCELLED')
      .map((s) => ({
        id: `REV-${s.id}`,
        source: `Subscription · ${planName(s.planId)}`,
        party: s.ownerName,
        amount: s.amount,
        date: s.startOn,
        kind: 'Subscription',
      }))
    const featuredRevenue: RevenueRow[] = featuredRequests
      .filter((f) => f.status === 'APPROVED')
      .map((f) => ({
        id: `REV-FE-${f.id.slice(-3)}`,
        source: `Featured · ${f.tier === 'PREMIUM_FEATURED' ? 'Premium' : 'Standard'}`,
        party: f.ownerName,
        amount: f.tier === 'PREMIUM_FEATURED' ? 490 : 290,
        date: f.startOn ?? f.requestedOn,
        kind: 'Featured',
      }))
    return [...planRevenue, ...featuredRevenue]
      .filter((r) => cityMatch(ownerCity(r.party)))
      .filter((r) => r.date >= fromDate && r.date <= toDate)
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [subscriptions, featuredRequests, city, fromDate, toDate])

  /* -------------------------------------- subscription report rows */
  const subscriptionRows: SubscriptionRow[] = useMemo(
    () =>
      subscriptions
        .filter((s) => cityMatch(ownerCity(s.ownerName)))
        .map((s) => ({
          id: s.id,
          ownerName: s.ownerName,
          planName: planName(s.planId),
          amount: s.amount,
          startOn: s.startOn,
          expiryOn: s.expiryOn,
          city: ownerCity(s.ownerName),
          status: s.status,
          suspended: s.suspended,
        })),
    [subscriptions, plans, city],
  )

  const revenueTotal = revenueRows.reduce((sum, r) => sum + r.amount, 0)
  const activeSubs = subscriptions.filter((s) => s.status === 'ACTIVE').length

  /* ------------------------------------------------------- CSV export */
  const downloadCsv = (filename: string, rows: Array<Record<string, unknown>>) => {
    if (rows.length === 0) {
      pushToast('Nothing to export for the current filters.', 'info')
      return
    }
    const headers = Object.keys(rows[0])
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const csv = [headers.join(','), ...rows.map((row) => headers.map((h) => escape(row[h])).join(','))].join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
    pushToast(`${filename} exported.`)
  }

  const handlePrint = () => {
    pushToast('Opening print preview.', 'info')
    window.print()
  }

  /* -------------------------------------------------------- columns */
  const ownerColumns: Array<Column<OwnerRow>> = [
    { key: 'id', header: 'Owner ID', sortValue: (r) => r.id, render: (r) => <span className="font-mono text-xs text-ink-soft">{r.id}</span> },
    { key: 'name', header: 'Owner Name', sortValue: (r) => r.name, render: (r) => <span className="font-semibold text-ink">{r.name}</span> },
    { key: 'email', header: 'Email', sortValue: (r) => r.email, render: (r) => <span className="text-[12.5px] text-ink-soft">{r.email}</span> },
    { key: 'city', header: 'City', sortValue: (r) => r.city, render: (r) => r.city },
    { key: 'properties', header: 'Properties', sortValue: (r) => r.properties, render: (r) => <span className="tabular-nums">{r.properties}</span> },
    { key: 'joined', header: 'Joined', sortValue: (r) => r.joined, render: (r) => <span className="tabular-nums">{r.joined}</span> },
    { key: 'status', header: 'Status', sortValue: (r) => r.status, render: (r) => <StatusBadge status={r.status} /> },
  ]

  const propertyColumns: Array<Column<PropertyRow>> = [
    { key: 'id', header: 'Property ID', sortValue: (r) => r.id, render: (r) => <span className="font-mono text-xs text-ink-soft">{r.id}</span> },
    { key: 'name', header: 'PG Name', sortValue: (r) => r.name, render: (r) => <span className="font-semibold text-ink">{r.name}</span> },
    { key: 'owner', header: 'Owner', sortValue: (r) => r.owner, render: (r) => <span className="text-[12.5px] text-ink-soft">{r.owner}</span> },
    { key: 'city', header: 'City', sortValue: (r) => r.city, render: (r) => `${r.city} · ${r.locality}` },
    { key: 'rent', header: 'Avg Rent', sortValue: (r) => r.rent, render: (r) => <span className="font-semibold tabular-nums text-forest">{formatINR(r.rent)}</span> },
    { key: 'beds', header: 'Beds', sortValue: (r) => r.beds, render: (r) => <span className="tabular-nums">{r.beds}</span> },
    { key: 'status', header: 'Status', sortValue: (r) => r.status, render: (r) => <StatusBadge status={r.status} /> },
  ]

  const studentColumns: Array<Column<StudentRow>> = [
    { key: 'id', header: 'Student ID', sortValue: (r) => r.id, render: (r) => <span className="font-mono text-xs text-ink-soft">{r.id}</span> },
    { key: 'name', header: 'Student', sortValue: (r) => r.name, render: (r) => <span className="font-semibold text-ink">{r.name}</span> },
    { key: 'city', header: 'City', sortValue: (r) => r.city, render: (r) => r.city },
    { key: 'pg', header: 'PG', sortValue: (r) => r.pg, render: (r) => <span className="text-[12.5px] text-ink-soft">{r.pg}</span> },
    { key: 'rent', header: 'Monthly Rent', sortValue: (r) => r.rent, render: (r) => <span className="font-semibold tabular-nums text-forest">{formatINR(r.rent)}</span> },
    { key: 'status', header: 'Status', sortValue: (r) => r.status, render: (r) => <StatusBadge status={r.status} /> },
  ]

  const revenueColumns: Array<Column<RevenueRow>> = [
    { key: 'id', header: 'Record ID', sortValue: (r) => r.id, render: (r) => <span className="font-mono text-xs text-ink-soft">{r.id}</span> },
    { key: 'source', header: 'Source', sortValue: (r) => r.source, render: (r) => <span className="font-semibold text-ink">{r.source}</span> },
    { key: 'party', header: 'Party', sortValue: (r) => r.party, render: (r) => <span className="text-[12.5px] text-ink-soft">{r.party}</span> },
    { key: 'date', header: 'Date', sortValue: (r) => r.date, render: (r) => <span className="tabular-nums">{r.date}</span> },
    { key: 'amount', header: 'Amount', sortValue: (r) => r.amount, render: (r) => <span className="font-semibold tabular-nums text-forest">{formatINR(r.amount)}</span> },
    { key: 'kind', header: 'Type', sortValue: (r) => r.kind, render: (r) => <span className="text-[12px] text-ink-mute">{r.kind}</span> },
  ]

  const subscriptionColumns: Array<Column<SubscriptionRow>> = [
    { key: 'id', header: 'Subscription ID', sortValue: (r) => r.id, render: (r) => <span className="font-mono text-xs text-ink-soft">{r.id}</span> },
    { key: 'ownerName', header: 'Owner', sortValue: (r) => r.ownerName, render: (r) => <span className="font-semibold text-ink">{r.ownerName}</span> },
    { key: 'planName', header: 'Plan', sortValue: (r) => r.planName, render: (r) => r.planName },
    { key: 'amount', header: 'Amount', sortValue: (r) => r.amount, render: (r) => <span className="font-semibold tabular-nums text-forest">{formatINR(r.amount)}</span> },
    { key: 'startOn', header: 'Start', sortValue: (r) => r.startOn, render: (r) => <span className="tabular-nums">{r.startOn}</span> },
    { key: 'expiryOn', header: 'Expiry', sortValue: (r) => r.expiryOn, render: (r) => <span className="tabular-nums">{r.expiryOn}</span> },
    { key: 'city', header: 'City', sortValue: (r) => r.city, render: (r) => r.city },
    {
      key: 'status',
      header: 'Status',
      sortValue: (r) => r.status,
      render: (r) => (
        <span className="flex items-center gap-1.5">
          <StatusBadge status={r.status} />
          {r.suspended && <StatusBadge status="PAUSED" />}
        </span>
      ),
    },
  ]

  const csvRows = (rows: unknown[]): Array<Record<string, unknown>> =>
    rows as Array<Record<string, unknown>>

  const csvConfig: Record<ReportGroup, { filename: string; rows: Array<Record<string, unknown>> }> = {
    owners: { filename: 'rahomitra-owner-reports.csv', rows: csvRows(ownerRows) },
    properties: { filename: 'rahomitra-property-reports.csv', rows: csvRows(propertyRows) },
    students: { filename: 'rahomitra-student-reports.csv', rows: csvRows(studentRows) },
    revenue: { filename: 'rahomitra-revenue-reports.csv', rows: csvRows(revenueRows) },
    subscriptions: { filename: 'rahomitra-subscription-reports.csv', rows: csvRows(subscriptionRows) },
  }

  const emptyProps = {
    emptyTitle: 'No rows for these filters',
    emptyDescription: 'Try widening the date range or switching the city filter.',
  }

  return (
    <>
      <AdminPageHeader
        title="Platform Reports"
        description="Platform report groups for owners, properties, students, revenue and subscriptions — filter by city and date range, export CSV or print."
        actions={
          <>
            <button
              type="button"
              onClick={() => downloadCsv(csvConfig[group].filename, csvConfig[group].rows)}
              className="inline-flex items-center gap-2 rounded-full border border-forest/25 bg-white px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
            >
              <Download className="h-4 w-4" aria-hidden />
              Export CSV
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory shadow-[0_10px_24px_-14px_rgba(23,61,50,0.9)] transition-colors hover:bg-forest-light"
            >
              <Printer className="h-4 w-4" aria-hidden />
              Print
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Owners in report" value={ownerRows.length} icon={Users} hint="Filtered rows" />
        <StatCard label="Properties in report" value={propertyRows.length} icon={Building2} hint="Filtered rows" />
        <StatCard label="Active subscriptions" value={activeSubs} icon={Layers} tone="forest" hint="Platform-wide" />
        <StatCard
          label="Revenue in range"
          value={formatINR(revenueTotal)}
          icon={IndianRupee}
          tone="gold"
          hint={`${fromDate} → ${toDate}`}
        />
      </div>

      {/* Group switcher */}
      <div className="mt-6 flex flex-wrap gap-2.5">
        {GROUPS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setGroup(item.id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-4.5 py-2.5 text-sm font-bold transition-colors',
              group === item.id
                ? 'bg-forest text-ivory shadow-[0_10px_24px_-16px_rgba(23,61,50,0.9)]'
                : 'border border-line bg-white text-ink-soft hover:border-forest hover:text-forest',
            )}
          >
            <item.icon className="h-4 w-4" aria-hidden />
            {item.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-5 flex flex-col gap-3 rounded-3xl border border-line bg-white p-4 shadow-card xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="rep-from" className="form-label">
              From date
            </label>
            <input id="rep-from" type="date" className="form-input w-auto" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor="rep-to" className="form-label">
              To date
            </label>
            <input id="rep-to" type="date" className="form-input w-auto" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <FilterSelect
            label="City"
            value={city}
            onChange={setCity}
            options={availableCities.map((c) => ({ value: c, label: c }))}
          />
        </div>
        <p className="flex items-center gap-2 text-[11.5px] text-ink-mute">
          <FileText className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
          Date range applies to revenue rows; other groups are filtered by city.
        </p>
      </div>

      {/* Table */}
      <div className="mt-5" key={group}>
        {group === 'owners' && (
          <DataTable columns={ownerColumns} rows={ownerRows} rowKey={(r) => r.id} pageSize={8} {...emptyProps} />
        )}
        {group === 'properties' && (
          <DataTable columns={propertyColumns} rows={propertyRows} rowKey={(r) => r.id} pageSize={8} {...emptyProps} />
        )}
        {group === 'students' && (
          <DataTable columns={studentColumns} rows={studentRows} rowKey={(r) => r.id} pageSize={8} {...emptyProps} />
        )}
        {group === 'revenue' && (
          <DataTable columns={revenueColumns} rows={revenueRows} rowKey={(r) => r.id} pageSize={8} {...emptyProps} />
        )}
        {group === 'subscriptions' && (
          <DataTable columns={subscriptionColumns} rows={subscriptionRows} rowKey={(r) => r.id} pageSize={8} {...emptyProps} />
        )}
      </div>
    </>
  )
}
