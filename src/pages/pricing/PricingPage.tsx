import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FeatureComparison } from '@/components/pricing/FeatureComparison'
import { PricingFAQ } from '@/components/pricing/PricingFAQ'
import { PlanCard } from '@/components/billing/PlanCard'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useBillingPlansQuery } from '@/hooks/billing/useBillingPlansQuery'
import { trackEvent } from '@/services/analytics/analyticsClient'
import type { SubscriptionPlan } from '@/types/billing'

export function PricingPage() {
  const navigate = useNavigate()
  const plansQuery = useBillingPlansQuery()
  const pricingPlans = plansQuery.data?.items ?? []

  useEffect(() => {
    trackEvent('pricing_page_viewed')
  }, [])

  function selectPlan(plan: SubscriptionPlan) {
    trackEvent('pricing_plan_selected', { plan })
    navigate(`/billing?plan=${plan}`)
  }

  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="Launch pricing validation"
        title="Pricing"
        description="Clear subscription options for launch validation. Real payment collection stays behind backend-created hosted checkout sessions."
        actions={<Badge variant="secondary">Virtual checkout ready</Badge>}
      />

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">What STOA is selling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              STOA combines AI homework guidance, parent-visible learning signals, and tutor
              support escalation. Phase 10 validates whether parents understand that value before
              the real payment backend is enabled.
            </p>
            <p>
              The checkout path can run in virtual mode for demos and E2E tests. Production card
              collection must use a hosted provider page created by the backend.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Pilot promise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>Start with a free trial, validate family interest, then enable payment when ready.</p>
            <p>Plans and access rules are visible now so product, QA, and parent feedback align.</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {pricingPlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            featured={plan.recommended}
            onSelect={selectPlan}
          />
        ))}
      </section>

      <FeatureComparison />
      <PricingFAQ />
    </PageContainer>
  )
}
