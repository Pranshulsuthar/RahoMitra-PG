import type { ReactNode } from 'react'

interface AdminPageHeaderProps {
  title: string
  description: string
  actions?: ReactNode
}

/** Consistent page heading used by every admin screen. */
export function AdminPageHeader({ title, description, actions }: AdminPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[1.6rem] sm:text-[1.75rem]">{title}</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-soft">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  )
}
