import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, ReceiptText, ShieldCheck } from 'lucide-react'
import { FeatureComparison } from '@/components/pricing/FeatureComparison'
import { PlanCard } from '@/components/billing/PlanCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useBillingPlansQuery } from '@/hooks/billing/useBillingPlansQuery'
import { MarketingLayout } from '@/layouts/MarketingLayout'
import { trackEvent } from '@/services/analytics/analyticsClient'
import type { SubscriptionPlan } from '@/types/billing'

const familyLearningImageUrl = new URL('../../../img/family-learning.jpeg', import.meta.url).href

type PricingStructurePlan = {
  id: string
  name: string
  price: string
  cadence: string
  fit: string
  access: string
}

export function PricingPage() {
  const { t } = useTranslation('pricing')
  const navigate = useNavigate()
  const plansQuery = useBillingPlansQuery()
  const pricingPlans = plansQuery.data?.items ?? []
  const pricingStructurePlans = t('priceStructure.plans', { returnObjects: true }) as PricingStructurePlan[]

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
                <h2 className="text-3xl font-semibold leading-tight text-foreground">
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
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-background/80 text-primary">
                    <ReceiptText className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-lg">{t('priceStructure.title')}</CardTitle>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      {t('priceStructure.description')}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {pricingStructurePlans.map((plan) => (
                  <div key={plan.id} className="rounded-md border bg-background/75 p-3">
                    <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <p className="font-semibold leading-5 text-foreground">{plan.name}</p>
                      <p className="text-sm font-semibold text-[hsl(var(--stoa-brand-burgundy))]">
                        {plan.price}
                        <span className="font-normal text-muted-foreground"> {plan.cadence}</span>
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-5 text-muted-foreground">{plan.fit}</p>
                    <p className="mt-2 text-xs font-medium uppercase leading-4 text-[hsl(var(--stoa-brand-burgundy))]">
                      {t('priceStructure.accessLabel')}
                    </p>
                    <p className="mt-1 text-sm leading-5 text-foreground">{plan.access}</p>
                  </div>
                ))}
                <p className="text-xs leading-5 text-muted-foreground">{t('priceStructure.note')}</p>
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
