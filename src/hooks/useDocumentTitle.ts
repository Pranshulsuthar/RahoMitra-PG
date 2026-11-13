import { useEffect } from 'react'
import { SITE } from '../utils/constants'

/** Sets a page title while the page is mounted. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previous = document.title
    document.title = title ? `${title} · ${SITE.name}` : `${SITE.name} — ${SITE.tagline}`
    return () => {
      document.title = previous
    }
  }, [title])
}
