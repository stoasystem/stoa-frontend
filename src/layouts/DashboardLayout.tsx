import type { ReactNode } from 'react'
import { AppLayout } from '@/layouts/AppLayout'

// Card 007: payments and billing are frozen. This banner was the one place in
// the running app that rendered an actual amount (`CHF x/month`), on every
// dashboard page, so it is withdrawn. The component itself is kept.
// import { PaymentMethodReminderBanner } from '@/components/billing/PaymentMethodReminderBanner'

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AppLayout>
      <div className="mx-auto w-full min-w-0 max-w-6xl">
        {/* Card 007 (frozen): <PaymentMethodReminderBanner /> */}
        {children}
      </div>
    </AppLayout>
  )
}
