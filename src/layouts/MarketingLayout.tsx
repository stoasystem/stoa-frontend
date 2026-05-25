import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AppLogo } from '@/components/common/AppLogo'
import { Button } from '@/components/ui/button'

export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="premium-shell min-h-screen text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background/88 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-6">
          <Link to="/" className="font-semibold tracking-tight">
            <AppLogo />
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <Link className="transition-colors hover:text-foreground" to="/how-it-works">
              How it works
            </Link>
            <Link className="transition-colors hover:text-foreground" to="/for-parents">
              Parents
            </Link>
            <Link className="transition-colors hover:text-foreground" to="/teacher-support">
              Tutors
            </Link>
            <Link className="transition-colors hover:text-foreground" to="/pricing">
              Pricing
            </Link>
            <Link className="transition-colors hover:text-foreground" to="/login">
              Login
            </Link>
            <Button asChild size="sm" className="premium-button-lift h-9 rounded-full px-4">
              <Link to="/login?next=/chat">Start Learning</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t bg-background/88">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-7 text-sm text-muted-foreground">
          <span>STOA Learning Platform</span>
          <div className="flex flex-wrap gap-4">
            <Link className="hover:text-foreground" to="/teacher-support">
              For Tutors
            </Link>
            <Link className="hover:text-foreground" to="/for-parents">
              For Parents
            </Link>
            <Link className="hover:text-foreground" to="/privacy">
              Privacy
            </Link>
            <Link className="hover:text-foreground" to="/terms">
              Terms
            </Link>
            <Link className="hover:text-foreground" to="/support">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
