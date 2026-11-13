import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export interface Crumb {
  label: string
  to?: string
}

/** Consistent inner-page header band with breadcrumbs. */
export function PageHeader({
  title,
  subtitle,
  crumbs,
}: {
  title: string
  subtitle?: string
  crumbs: Crumb[]
}) {
  return (
    <header className="border-b border-line bg-ivory">
      <div className="page-container py-10 sm:py-14">
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-ink-soft">
            {crumbs.map((crumb, index) => {
              const isLast = index === crumbs.length - 1
              return (
                <li key={crumb.label} className="flex items-center gap-1.5">
                  {crumb.to && !isLast ? (
                    <Link to={crumb.to} className="transition-colors hover:text-forest">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={isLast ? 'text-forest' : undefined}>{crumb.label}</span>
                  )}
                  {!isLast && <ChevronRight className="h-3.5 w-3.5 text-ink-mute" aria-hidden />}
                </li>
              )
            })}
          </ol>
        </nav>
        <h1 className="max-w-3xl text-[2rem] leading-[1.15] sm:text-[2.75rem]">{title}</h1>
        {subtitle && (
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-soft">{subtitle}</p>
        )}
      </div>
    </header>
  )
}
