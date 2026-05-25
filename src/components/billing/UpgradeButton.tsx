import { Button } from '@/components/ui/button'
import { useCreateCheckoutSessionMutation } from '@/hooks/billing/useCreateCheckoutSessionMutation'
import type { SubscriptionPlan } from '@/types/user'

export function UpgradeButton({
  plan,
  children = 'Upgrade',
}: {
  plan: SubscriptionPlan
  children?: string
}) {
  const checkoutMutation = useCreateCheckoutSessionMutation()

  return (
    <Button
      type="button"
      disabled={checkoutMutation.isPending}
      onClick={() => checkoutMutation.mutate(plan)}
    >
      {checkoutMutation.isPending ? 'Starting checkout...' : children}
    </Button>
  )
}
