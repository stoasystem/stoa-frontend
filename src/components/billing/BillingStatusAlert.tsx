import { Info } from 'lucide-react'
import { enableMockCheckout, enablePayment } from '@/lib/env'

export function BillingStatusAlert() {
  return (
    <div className="flex gap-3 rounded-md border bg-card p-4 text-sm leading-6 text-muted-foreground">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <p>
        {enablePayment
          ? 'Payment is enabled. Checkout URLs must still come from the backend contract.'
          : enableMockCheckout
            ? 'Payment is disabled and mock checkout is enabled for frontend demos.'
            : 'Payment is disabled. Plan CTAs collect intent until backend checkout is ready.'}
      </p>
    </div>
  )
}
