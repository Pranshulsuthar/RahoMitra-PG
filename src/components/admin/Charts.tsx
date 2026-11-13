import { useId } from 'react'

export interface ChartDatum {
  label: string
  value: number
}

const AXIS = '#E5E0D2'
const LABEL = '#8B928D'
const FOREST = '#173D32'
const GOLD = '#C49A52'

interface BarChartProps {
  data: ChartDatum[]
  height?: number
  color?: string
  valuePrefix?: string
  valueSuffix?: string
  /** Fixed axis maximum (e.g. 100 for percentages). Defaults to the data max. */
  maxValue?: number
  ariaLabel: string
}

/** Lightweight SVG bar chart — no external chart dependency. */
export function BarChart({
  data,
  height = 220,
  color = FOREST,
  valuePrefix = '',
  valueSuffix = '',
  maxValue,
  ariaLabel,
}: BarChartProps) {
  const gradientId = useId()
  const dataMax = Math.max(...data.map((d) => d.value), 1)
  const max = maxValue && maxValue > 0 ? maxValue : dataMax
  const width = 640
  const padX = 34
  const padTop = 22
  const padBottom = 30
  const chartH = height - padTop - padBottom
  const slot = (width - padX * 2) / data.length
  const maxBarW = data.length <= 2 ? 88 : 46
  const barW = Math.min(maxBarW, Math.max(slot * 0.55, 26))

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label={ariaLabel}
    >
      {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
        const y = padTop + chartH - chartH * tick
        return (
          <g key={tick}>
            <line x1={padX} x2={width - padX} y1={y} y2={y} stroke={AXIS} strokeDasharray="3 5" />
            <text x={padX - 8} y={y + 3.5} textAnchor="end" fontSize="10" fill={LABEL}>
              {valuePrefix}
              {Math.round(max * tick)}
              {valueSuffix}
            </text>
          </g>
        )
      })}
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.92" />
          <stop offset="100%" stopColor={color} stopOpacity="0.55" />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const barH = (d.value / max) * chartH
        const x = padX + slot * i + (slot - barW) / 2
        const y = padTop + chartH - barH
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(barH, 2)}
              rx={7}
              fill={`url(#${gradientId})`}
            >
              <title>{`${d.label}: ${valuePrefix}${d.value}${valueSuffix}`}</title>
            </rect>
            <text
              x={x + barW / 2}
              y={y - 7}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill={FOREST}
            >
              {valuePrefix}
              {d.value}
              {valueSuffix}
            </text>
            <text x={x + barW / 2} y={height - 9} textAnchor="middle" fontSize="11" fill={LABEL}>
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

interface LineChartProps {
  data: ChartDatum[]
  height?: number
  color?: string
  valuePrefix?: string
  ariaLabel: string
}

/** Lightweight SVG area+line trend chart. */
export function LineChart({
  data,
  height = 220,
  color = GOLD,
  valuePrefix = '',
  ariaLabel,
}: LineChartProps) {
  const gradientId = useId()
  const width = 640
  const padX = 40
  const padTop = 22
  const padBottom = 30
  const chartH = height - padTop - padBottom
  const max = Math.max(...data.map((d) => d.value), 1)
  const step = data.length > 1 ? (width - padX * 2) / (data.length - 1) : 0

  const points = data.map((d, i) => ({
    x: padX + step * i,
    y: padTop + chartH - (d.value / max) * chartH,
    ...d,
  }))
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const area = `${path} L${points[points.length - 1]?.x ?? padX},${padTop + chartH} L${padX},${padTop + chartH} Z`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label={ariaLabel}
    >
      {[0, 0.5, 1].map((tick) => {
        const y = padTop + chartH - chartH * tick
        return (
          <g key={tick}>
            <line x1={padX} x2={width - padX} y1={y} y2={y} stroke={AXIS} strokeDasharray="3 5" />
            <text x={padX - 8} y={y + 3.5} textAnchor="end" fontSize="10" fill={LABEL}>
              {valuePrefix}
              {Math.round(max * tick)}
            </text>
          </g>
        )
      })}
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r="5" fill="#FFFFFF" stroke={color} strokeWidth="2.5">
            <title>{`${p.label}: ${valuePrefix}${p.value}`}</title>
          </circle>
          <text x={p.x} y={height - 9} textAnchor="middle" fontSize="11" fill={LABEL}>
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

interface DonutChartProps {
  data: Array<ChartDatum & { color: string }>
  size?: number
  centerLabel?: string
  ariaLabel: string
}

/** Lightweight SVG donut chart with legend. */
export function DonutChart({ data, size = 170, centerLabel, ariaLabel }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1
  const radius = 60
  const stroke = 22
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-6">
      <svg
        width={size}
        height={size}
        viewBox="0 0 160 160"
        role="img"
        aria-label={ariaLabel}
        className="shrink-0"
      >
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#F5F1E7" strokeWidth={stroke} />
        {data.map((d) => {
          const fraction = d.value / total
          const dash = fraction * circumference
          const el = (
            <circle
              key={d.label}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 80 80)"
              strokeLinecap="butt"
            >
              <title>{`${d.label}: ${d.value} (${Math.round(fraction * 100)}%)`}</title>
            </circle>
          )
          offset += dash
          return el
        })}
        <text x="80" y="76" textAnchor="middle" fontSize="24" fontWeight="700" fill="#252A27">
          {total}
        </text>
        <text x="80" y="96" textAnchor="middle" fontSize="10" fill="#8B928D">
          {centerLabel ?? 'TOTAL'}
        </text>
      </svg>
      <ul className="min-w-0 space-y-2.5">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2.5 whitespace-nowrap text-sm text-ink-soft">
            <span
              className="h-3 w-3 shrink-0 rounded-[4px]"
              style={{ backgroundColor: d.color }}
              aria-hidden
            />
            <span className="font-semibold text-ink">{d.label}</span>
            <span className="text-ink-mute">
              {d.value} · {Math.round((d.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
