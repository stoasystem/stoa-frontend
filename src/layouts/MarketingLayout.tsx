import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-background/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="font-semibold tracking-tight">
            STOA
          </Link>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link className="transition-colors hover:text-foreground" to="/">
              Home
            </Link>
            <Link className="transition-colors hover:text-foreground" to="/login">
              Login
            </Link>
            <Link className="transition-colors hover:text-foreground" to="/chat">
              Chat
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
