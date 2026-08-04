import { Button } from '@/components/ui/button'
import { useCreateCheckoutSessionMutation } from '@/hooks/billing/useCreateCheckoutSessionMutation'
import type { PurchasablePlan } from '@/types/billing'

export function UpgradeButton({
  plan,
  beneficiaryIds = [],
  children = 'Upgrade',
}: {
  plan: PurchasablePlan
  beneficiaryIds?: string[]
  children?: string
}) {
  const checkoutMutation = useCreateCheckoutSessionMutation()

  return (
    <Button
      type="button"
      disabled={checkoutMutation.isPending}
      onClick={() => {
        if (checkoutMutation.isPending) return
        checkoutMutation.mutate({ plan, beneficiaryIds })
      }}
    >
      {checkoutMutation.isPending ? 'Starting checkout...' : children}
    </Button>
  )
}
