import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('pricing')
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
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
          actions={<Badge variant="secondary">{t('badge')}</Badge>}
          titleClassName="editorial-heading editorial-title-shell text-4xl leading-tight md:text-6xl"
        />

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="overflow-hidden">
            <div className="relative h-56 bg-[#152238]">
              <img
                src="https://images.pexels.com/photos/9240630/pexels-photo-9240630.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Family reviewing online learning together at home"
                className="absolute inset-0 h-full w-full object-cover opacity-76"
              />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(217_45%_15%_/_0.72),transparent_58%)]" />
              <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/15 bg-white/90 p-4 text-[#152238] backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b08a4a]">
                  {t('supportLevel')}
                </p>
                <p className="mt-2 text-sm leading-6">
                  {t('supportLevelBody')}
                </p>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-xl">{t('valueTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>{t('valueBody')}</p>
              <p>{t('checkoutBody')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{t('pilotTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>{t('pilotBody')}</p>
              <p>{t('pilotDetail')}</p>
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
