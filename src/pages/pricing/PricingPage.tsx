import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, ClipboardList, ShieldCheck } from 'lucide-react'
import { FeatureComparison } from '@/components/pricing/FeatureComparison'
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

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <Card className="overflow-hidden">
            <div className="grid min-w-0 lg:grid-cols-[0.88fr_1.12fr]">
              <div className="brand-image-panel relative min-h-72 overflow-hidden lg:min-h-full">
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
              <div className="p-6 md:p-8">
                <p className="brand-section-kicker text-[hsl(var(--stoa-brand-burgundy))]">
                  {t('badge')}
                </p>
                <h2 className="mt-3 text-3xl font-semibold leading-tight text-foreground">
                  {t('valueTitle')}
                </h2>
                <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
                  {t('valueBody')}
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[t('comparison.rows.0.0'), t('comparison.rows.2.0'), t('comparison.rows.4.0')].map((item) => (
                    <div key={item} className="rounded-md border bg-background/70 p-3">
                      <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                      <p className="mt-2 text-sm font-semibold leading-5 text-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
          <aside className="grid gap-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] text-[hsl(var(--stoa-brand-burgundy-strong))]">
                    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-lg">{t('pilotTitle')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p>{t('pilotBody')}</p>
                <p>{t('pilotDetail')}</p>
              </CardContent>
            </Card>
            <Card className="border-primary/20 bg-[hsl(var(--stoa-brand-burgundy-soft))]">
              <CardContent className="flex gap-3 p-5 text-sm leading-6 text-foreground">
                <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <p>{t('checkoutBody')}</p>
              </CardContent>
            </Card>
          </aside>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
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
      </PageContainer>
    </MarketingLayout>
  )
}
