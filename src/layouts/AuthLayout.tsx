import type { ReactNode } from 'react'
import { AppFooter } from '@/components/common/AppFooter'
import { MarketingHeader } from '@/layouts/MarketingLayout'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="premium-shell flex min-h-screen flex-col text-foreground">
      <MarketingHeader />
      <main className="grid flex-1 place-items-center px-5 py-10 sm:px-6">
        <div className="w-full max-w-5xl">
          {children}
        </div>
      </main>
      <AppFooter />
    </div>
  )
}
