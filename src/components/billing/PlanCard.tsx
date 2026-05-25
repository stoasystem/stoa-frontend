import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { RecommendedPlanBadge } from '@/components/pricing/RecommendedPlanBadge'
import type { BillingPlan, SubscriptionPlan } from '@/types/billing'

type PlanCardProps = {
  plan: BillingPlan
  featured?: boolean
  onSelect?: (plan: SubscriptionPlan) => void
}

export function PlanCard({ plan, featured, onSelect }: PlanCardProps) {
  const price = plan.priceMonthly === 0 ? `${plan.currency} 0` : `${plan.currency} ${plan.priceMonthly}/mo`

  return (
    <Card className={featured ? 'border-primary shadow-sm' : undefined}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-xl">{plan.name}</CardTitle>
          {plan.recommended && <RecommendedPlanBadge />}
        </div>
        <p className="text-3xl font-semibold text-foreground">{price}</p>
        <p className="text-sm leading-6 text-muted-foreground">{plan.audience}</p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 text-sm text-muted-foreground">
          {plan.features.map((feature) => (
            <li key={feature} className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          type="button"
          className="w-full"
          variant={featured ? 'default' : 'outline'}
          onClick={() => onSelect?.(plan.id)}
        >
          {plan.cta}
        </Button>
      </CardFooter>
    </Card>
  )
}
