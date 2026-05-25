import { Button } from '@/components/ui/button'
import { trackEvent } from '@/services/analytics/analyticsClient'
import type { SubscriptionPlan } from '@/types/user'

export function PricingCTA({
  plan,
  label,
  onSelect,
}: {
  plan: SubscriptionPlan
  label: string
  onSelect: (plan: SubscriptionPlan) => void
}) {
  return (
    <Button
      type="button"
      onClick={() => {
        trackEvent('pricing_plan_selected', { plan })
        onSelect(plan)
      }}
    >
      {label}
    </Button>
  )
}
