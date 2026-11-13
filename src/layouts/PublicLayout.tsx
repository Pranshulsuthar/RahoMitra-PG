import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Info } from 'lucide-react'
import { Navbar } from '../components/navbar/Navbar'
import { Footer } from '../components/footer/Footer'
import { DEMO_NOTICE } from '../utils/constants'

/** Scrolls to the top on every route change (client-side navigation). */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])
  return null
}

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />

      {/* Persistent honesty notice: this build runs on demo data only. */}
      <div className="bg-forest-dark text-ivory/85">
        <div className="page-container flex items-center justify-center gap-2 py-2 text-center text-[11px] sm:text-[12px]">
          <Info className="h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
          <span>{DEMO_NOTICE}</span>
        </div>
      </div>

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
