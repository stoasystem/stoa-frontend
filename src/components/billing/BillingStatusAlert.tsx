import type { ReactNode } from 'react'
import { CircleAlert, Info } from 'lucide-react'
import { useBillingUsageQuery } from '@/hooks/billing/useBillingUsageQuery'

export function BillingStatusAlert() {
  const billing = useBillingUsageQuery()

  if (billing.isLoading) {
    return (
      <StatusFrame>
        Billing status is loading.
      </StatusFrame>
    )
  }

  if (billing.isError || !billing.data) {
    return (
      <StatusFrame error>
        Billing status is temporarily unavailable. Try again before changing a plan.
      </StatusFrame>
    )
  }

  return (
    <StatusFrame>
      {formatStatus(billing.data.status)} billing · Server-confirmed plan and payment
      state.
    </StatusFrame>
  )
}

function StatusFrame({
  children,
  error = false,
}: {
  children: ReactNode
  error?: boolean
}) {
  const Icon = error ? CircleAlert : Info

  return (
    <div
      className="flex gap-3 rounded-md border bg-card p-4 text-sm leading-6 text-muted-foreground"
      data-testid="billing-status-alert"
      role="status"
    >
      <Icon
        className={`mt-0.5 h-4 w-4 shrink-0 ${error ? 'text-destructive' : 'text-primary'}`}
        aria-hidden="true"
      />
      <p>{children}</p>
    </div>
  )
}

function formatStatus(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}
