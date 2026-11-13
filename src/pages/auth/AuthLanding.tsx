import { GraduationCap, Building2, ShieldCheck, Home, LockKeyhole } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { RoleSelectionCard } from '../../components/auth/RoleSelectionCard'

/** Authentication entry point — choose how you want to sign in. */
export function AuthLanding() {
  useDocumentTitle('Welcome to RahoMitra')

  return (
    <AuthLayout size="lg">
      <div className="page-enter mx-auto max-w-2xl">
        {/* --------------------------------------------------- status pill */}
        <p className="flex items-center justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-ivory/70 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-soft">
            <LockKeyhole className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
            Secure sign-in gateway · Demo mode
          </span>
        </p>

        {/* --------------------------------------------------------- header */}
        <header className="mt-6 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold-dark">
            Authentication
          </p>
          <h1 className="mt-3 text-[1.8rem] leading-tight sm:text-[2.15rem]">
            Choose how you&apos;d like to{' '}
            <span className="italic text-gold-dark">continue.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
            Every role has its own dedicated workspace — pick yours to reach the right sign-in
            screen.
          </p>
        </header>

        {/* -------------------------------------------------- role gateway */}
        <div className="mt-8 space-y-4">
          <RoleSelectionCard
            icon={GraduationCap}
            title="Student"
            description="Find your ideal accommodation and manage your PG experience."
            features={['Explore & compare PGs', 'Contact owners directly']}
            cta="Continue as Student"
            to="/login/student"
            tone="forest"
          />
          <RoleSelectionCard
            icon={Building2}
            title="PG Owner"
            description="Bring your PG online and manage your property efficiently."
            features={['List your PG in minutes', 'Track inquiries in one place']}
            cta="Continue as PG Owner"
            to="/login/owner"
            tone="gold"
          />
          <RoleSelectionCard
            icon={ShieldCheck}
            title="Super Admin"
            description="Restricted access to platform operations, revenue and support."
            features={['Moderation & approvals', 'Subscriptions & reports']}
            cta="Admin Login"
            to="/login/admin"
            tone="ink"
            restricted
          />
        </div>

        {/* -------------------------------------------------- signup strip */}
        <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-line bg-ivory/60 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">New to RahoMitra?</p>
            <p className="mt-0.5 text-[13px] text-ink-soft">
              Create your free account in under a minute.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2.5">
            <Link
              to="/signup/student"
              className="rounded-full bg-forest px-4 py-2.5 text-xs font-bold text-ivory transition-colors hover:bg-forest-light"
            >
              Student sign up
            </Link>
            <Link
              to="/signup/owner"
              className="rounded-full border border-forest/30 px-4 py-2.5 text-xs font-bold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
            >
              Owner sign up
            </Link>
          </div>
        </div>

        {/* -------------------------------------------------- back to home */}
        <p className="mt-7 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest transition-colors hover:text-gold-dark"
          >
            <Home className="h-4 w-4" aria-hidden />
            Back to homepage
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
