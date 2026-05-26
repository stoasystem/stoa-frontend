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

const familyLearningImageUrl = new URL('../../../img/family-learning.jpeg', import.meta.url).href

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
            <div className="brand-image-panel relative h-56">
              <img
                src={familyLearningImageUrl}
                alt="Family reviewing online learning together at home"
                className="absolute inset-0 h-full w-full object-cover opacity-76"
              />
              <div className="brand-image-overlay absolute inset-0" />
              <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-white/15 bg-white/90 p-4 text-[hsl(var(--stoa-brand-ink))] backdrop-blur">
                <p className="brand-section-kicker">
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
