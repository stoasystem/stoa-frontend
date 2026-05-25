import type { ReactNode } from 'react'
import { MarketingHeader } from '@/layouts/MarketingLayout'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="premium-shell min-h-screen text-foreground">
      <MarketingHeader />
      <main className="grid min-h-[calc(100vh-4rem)] place-items-center px-5 py-10 sm:px-6">
        <div className="w-full max-w-4xl">
          {children}
        </div>
      </main>
    </div>
  )
}
