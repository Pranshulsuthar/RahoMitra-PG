import { useEffect, useRef, useState } from 'react'
import { Building2, ChevronDown, Layers } from 'lucide-react'
import { useOwnerStore } from '../../context/OwnerStore'
import { cn } from '../../utils/cn'

const STATUS_DOT: Record<string, string> = {
  ACTIVE: 'bg-forest',
  PENDING: 'bg-gold',
  DRAFT: 'bg-ink-mute',
  PAUSED: 'bg-danger',
}

/**
 * Topbar property switcher — every owner screen scopes its data to the
 * selected property ("All Properties" = the owner-wide overview).
 */
export function PropertySwitcher() {
  const { properties, selectedPropertyId, selectProperty } = useOwnerStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const selected =
    selectedPropertyId === 'ALL'
      ? null
      : (properties.find((p) => p.id === selectedPropertyId) ?? null)
  const label = selected ? selected.name : 'All Properties'
  const sub = selected
    ? `${selected.locality} · ${selected.city}`
    : `${properties.length} properties in this demo account`

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Property switcher — currently ${label}`}
        className="flex max-w-[13rem] items-center gap-2.5 rounded-full border border-line bg-white py-1.5 pl-2 pr-3 transition-colors hover:border-forest/40 hover:bg-ivory sm:max-w-[16rem]"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-soft text-forest">
          {selected ? (
            <Building2 className="h-4 w-4" aria-hidden />
          ) : (
            <Layers className="h-4 w-4" aria-hidden />
          )}
        </span>
        <span className="min-w-0 text-left">
          <span className="block truncate text-[12.5px] font-bold leading-tight text-ink">
            {label}
          </span>
          <span className="hidden truncate text-[10px] leading-tight text-ink-mute sm:block">
            {sub}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-ink-mute transition-transform duration-200',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div className="fade-scale-in absolute right-0 top-[calc(100%+0.6rem)] z-40 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-white shadow-pop">
          <p className="border-b border-line bg-ivory/60 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft">
            Switch property
          </p>
          <ul className="max-h-72 overflow-y-auto p-1.5">
            <li>
              <button
                type="button"
                onClick={() => {
                  selectProperty('ALL')
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-ivory',
                  selectedPropertyId === 'ALL' && 'bg-forest-soft',
                )}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ivory text-forest">
                  <Layers className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-bold text-ink">All Properties</span>
                  <span className="block text-[11px] text-ink-mute">
                    Owner-wide overview ({properties.length} PGs)
                  </span>
                </span>
              </button>
            </li>
            {properties.map((property) => (
              <li key={property.id}>
                <button
                  type="button"
                  onClick={() => {
                    selectProperty(property.id)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-ivory',
                    selectedPropertyId === property.id && 'bg-forest-soft',
                  )}
                >
                  <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-forest-soft text-forest">
                    <Building2 className="h-4 w-4" aria-hidden />
                    <span
                      className={cn(
                        'absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white',
                        STATUS_DOT[property.status] ?? 'bg-ink-mute',
                      )}
                      aria-hidden
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-bold text-ink">
                      {property.name}
                    </span>
                    <span className="block truncate text-[11px] text-ink-mute">
                      {property.locality} · {property.type.replace('_', '-').toLowerCase()} · demo
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="border-t border-line bg-ivory/50 px-4 py-2.5 text-[10.5px] leading-relaxed text-ink-mute">
            Only this demo owner&apos;s properties are listed — other owners&apos; data never
            appears here.
          </p>
        </div>
      )}
    </div>
  )
}
