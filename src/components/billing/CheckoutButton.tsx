import { CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCreateCheckoutSessionMutation } from '@/hooks/billing/useCreateCheckoutSessionMutation'
import type { SubscriptionPlan } from '@/types/billing'

export function CheckoutButton({ plan, label = 'Start checkout' }: { plan: SubscriptionPlan; label?: string }) {
  const checkoutMutation = useCreateCheckoutSessionMutation()

  return (
    <Button
      type="button"
      disabled={checkoutMutation.isPending}
      onClick={() => {
        if (checkoutMutation.isPending) return
        checkoutMutation.mutate(plan)
      }}
      className="gap-2"
    >
      <CreditCard className="h-4 w-4" />
      {checkoutMutation.isPending ? 'Starting...' : label}
    </Button>
  )
}
