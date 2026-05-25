import { CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('billing')
  const price = plan.priceMonthly === 0 ? `${plan.currency} 0` : `${plan.currency} ${plan.priceMonthly}/mo`
  const translatedFeatures = t(`plans.${plan.id}.features`, { returnObjects: true })
  const features = Array.isArray(translatedFeatures)
    ? translatedFeatures.filter((feature): feature is string => typeof feature === 'string')
    : plan.features

  return (
    <Card className={featured ? 'min-w-0 border-primary shadow-sm' : 'min-w-0'}>
      <CardHeader>
        <div className="flex min-w-0 items-start justify-between gap-3">
          <CardTitle className="min-w-0 break-words text-xl leading-7">
            {t(`plans.${plan.id}.name`, { defaultValue: plan.name })}
          </CardTitle>
          {plan.recommended && <RecommendedPlanBadge />}
        </div>
        <p className="text-3xl font-semibold text-foreground">{price}</p>
        <p className="text-sm leading-6 text-muted-foreground">
          {t(`plans.${plan.id}.audience`, { defaultValue: plan.audience })}
        </p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 text-sm text-muted-foreground">
          {features.map((feature) => (
            <li key={feature} className="flex min-w-0 gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0 break-words leading-5">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          type="button"
          className="h-auto min-h-10 w-full whitespace-normal py-2 text-center leading-5"
          variant={featured ? 'default' : 'outline'}
          onClick={() => onSelect?.(plan.id)}
        >
          {t(`plans.${plan.id}.cta`, { defaultValue: plan.cta })}
        </Button>
      </CardFooter>
    </Card>
  )
}
