import type { ReactNode } from 'react'
import { PaymentMethodReminderBanner } from '@/components/billing/PaymentMethodReminderBanner'
import { AppLayout } from '@/layouts/AppLayout'

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AppLayout>
      <div className="mx-auto w-full min-w-0 max-w-6xl">
        <PaymentMethodReminderBanner />
        {children}
      </div>
    </AppLayout>
  )
}
