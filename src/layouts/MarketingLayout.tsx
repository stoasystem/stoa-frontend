import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AppLogo } from '@/components/common/AppLogo'

export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-background/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="font-semibold tracking-tight">
            <AppLogo />
          </Link>
          <nav className="flex flex-wrap justify-end gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <Link className="transition-colors hover:text-foreground" to="/dashboard">
              Students
            </Link>
            <Link className="transition-colors hover:text-foreground" to="/tutor">
              Teachers
            </Link>
            <Link className="transition-colors hover:text-foreground" to="/for-parents">
              Parents
            </Link>
            <Link className="transition-colors hover:text-foreground" to="/pricing">
              Pricing
            </Link>
            <Link className="transition-colors hover:text-foreground" to="/login">
              Login
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t bg-background/90">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-4 px-6 py-6 text-sm text-muted-foreground">
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
      </footer>
    </div>
  )
}
