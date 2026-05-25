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
import { MarketingLayout } from '@/layouts/MarketingLayout'
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
    <MarketingLayout>
      <PageContainer size="wide">
        <PageHeader
          eyebrow="Plans for families"
          title="Pricing"
          description="Choose the level of homework support your family needs, from AI-guided practice to tutor-supported explanations."
          actions={<Badge variant="secondary">Safe checkout preview</Badge>}
        />

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="overflow-hidden">
            <div className="relative h-56 bg-[#152238]">
              <img
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80"
                alt="Family reviewing a learning plan on a laptop"
                className="absolute inset-0 h-full w-full object-cover opacity-76"
              />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(217_45%_15%_/_0.72),transparent_58%)]" />
              <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/15 bg-white/90 p-4 text-[#152238] backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b08a4a]">
                  Choose support level
                </p>
                <p className="mt-2 text-sm leading-6">
                  AI practice, parent reports, and teacher help sit in one family plan conversation.
                </p>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-xl">What STOA is selling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                STOA combines AI homework guidance, parent-visible learning signals, and tutor
                support escalation so students can get unstuck while families stay informed.
              </p>
              <p>
                During this demo, checkout shows the purchase path without charging a card. Live
                payment collection will use a secure hosted payment page.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Pilot promise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                Start with a free trial, see whether STOA fits your family routine, then choose a
                plan when ready.
              </p>
              <p>Each plan makes the student, parent, and tutor support level clear before checkout.</p>
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
    </MarketingLayout>
  )
}
