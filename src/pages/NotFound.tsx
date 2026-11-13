import { Compass, Home } from 'lucide-react'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { EmptyState } from '../components/common/EmptyState'
import { ButtonLink } from '../components/common/Button'

export function NotFound() {
  useDocumentTitle('Page not found')

  return (
    <section className="bg-white py-20">
      <div className="page-container max-w-2xl">
        <EmptyState
          title="404 — Page not found"
          description="The page you are looking for does not exist on this build. It may have been moved, or the link might be incorrect."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink to="/" variant="primary">
                <Home className="h-4 w-4" aria-hidden />
                Back to home
              </ButtonLink>
              <ButtonLink to="/explore" variant="outline">
                <Compass className="h-4 w-4" aria-hidden />
                Explore demo PGs
              </ButtonLink>
            </div>
          }
        />
      </div>
    </section>
  )
}
