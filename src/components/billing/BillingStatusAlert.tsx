import { Info } from 'lucide-react'
import { enablePayment, showCheckoutPreview } from '@/lib/env'

export function BillingStatusAlert() {
  return (
    <div className="flex gap-3 rounded-md border bg-card p-4 text-sm leading-6 text-muted-foreground">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <p>
        {enablePayment
          ? 'Payment is enabled. STOA will open a secure checkout when a plan is selected.'
          : showCheckoutPreview
            ? 'Payment is disabled and plan preview is available for review.'
            : 'Payment is disabled. Plan choices help validate family interest until live checkout is available.'}
      </p>
    </div>
  )
}
