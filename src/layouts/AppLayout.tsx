import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 border-r bg-background/90 p-4 md:block">
          <Link to="/" className="font-semibold tracking-tight">
            STOA
          </Link>
          <nav className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground">
            <Link className="rounded-md px-2 py-1.5 hover:bg-secondary hover:text-foreground" to="/dashboard">
              Dashboard
            </Link>
            <Link className="rounded-md px-2 py-1.5 hover:bg-secondary hover:text-foreground" to="/chat">
              Chat
            </Link>
          </nav>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
