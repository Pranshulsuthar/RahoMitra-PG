import type { ReactNode } from 'react'
import { SearchX } from 'lucide-react'

/** Friendly empty / no-results state. */
export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-ivory/60 px-6 py-16 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white text-forest shadow-card">
        {icon ?? <SearchX className="h-6 w-6" aria-hidden />}
      </div>
      <h3 className="text-xl">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
