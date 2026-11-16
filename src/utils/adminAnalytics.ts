import type { AdminPg, OwnerApplication, OwnerRecord, PaymentRecord, PlanRecord, SubscriptionRecord } from '../types/admin'

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

/** Generate the last N months as labels ['Jun', 'Jul', 'Aug', ...] */
export function getLastNMonths(n = 6): string[] {
  const result: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push(MONTH_NAMES[d.getMonth()])
  }
  return result
}

function getMonthYearKey(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return MONTH_NAMES[d.getMonth()]
}

export function computeMonthlyCounts(
  items: Array<{ [key: string]: any }>,
  dateField: string,
  monthLabels: string[],
): number[] {
  const counts: Record<string, number> = {}
  monthLabels.forEach((m) => {
    counts[m] = 0
  })

  items.forEach((item) => {
    const val = item[dateField]
    const m = getMonthYearKey(val)
    if (m && counts[m] !== undefined) {
      counts[m]++
    }
  })

  return monthLabels.map((m) => counts[m])
}

export function computeMonthlyRevenue(
  payments: PaymentRecord[],
  monthLabels: string[],
): number[] {
  const revenue: Record<string, number> = {}
  monthLabels.forEach((m) => {
    revenue[m] = 0
  })

  payments.forEach((p) => {
    const m = getMonthYearKey(p.paidOn)
    if (m && revenue[m] !== undefined) {
      revenue[m] += p.amount || 0
    }
  })

  return monthLabels.map((m) => revenue[m])
}

const PLAN_COLORS = ['#173D32', '#C49A52', '#252A27', '#1F5143', '#8C7039']

export function computePlanDistribution(
  subscriptions: SubscriptionRecord[],
  plans: PlanRecord[],
): Array<{ label: string; value: number; color: string }> {
  if (plans.length === 0) return []
  return plans.map((p, idx) => ({
    label: p.name.toUpperCase(),
    value: subscriptions.filter((s) => s.planId === p.id).length,
    color: PLAN_COLORS[idx % PLAN_COLORS.length],
  }))
}

export function computeApprovalRatio(
  applications: OwnerApplication[],
): Array<{ label: string; value: number; color: string }> {
  const approved = applications.filter((a) => a.status === 'APPROVED').length
  const rejected = applications.filter((a) => a.status === 'REJECTED').length
  const pending = applications.filter((a) => a.status === 'PENDING').length

  return [
    { label: 'Approved', value: approved, color: '#1F5143' },
    { label: 'Rejected', value: rejected, color: '#B3402F' },
    { label: 'Pending', value: pending, color: '#C49A52' },
  ]
}
