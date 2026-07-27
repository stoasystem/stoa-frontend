import { CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCreateCheckoutSessionMutation } from '@/hooks/billing/useCreateCheckoutSessionMutation'
import type { PurchasablePlan } from '@/types/billing'

export function CheckoutButton({
  plan,
  beneficiaryIds = [],
  label = 'Start checkout',
}: {
  plan: PurchasablePlan
  beneficiaryIds?: string[]
  label?: string
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
      className="gap-2"
    >
      <CreditCard className="h-4 w-4" />
      {checkoutMutation.isPending ? 'Starting...' : label}
    </Button>
  )
}
