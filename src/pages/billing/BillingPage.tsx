import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BillingStatusAlert } from '@/components/billing/BillingStatusAlert'
import { BillingSummaryCard } from '@/components/billing/BillingSummaryCard'
import { CheckoutButton } from '@/components/billing/CheckoutButton'
import { LockedFeatureCard } from '@/components/billing/LockedFeatureCard'
import { ManageBillingButton } from '@/components/billing/ManageBillingButton'
import { PlanUsageCard } from '@/components/billing/PlanUsageCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useBillingPlansQuery } from '@/hooks/billing/useBillingPlansQuery'
import { useBillingUsageQuery } from '@/hooks/billing/useBillingUsageQuery'
import { useFeatureAccessQuery } from '@/hooks/billing/useFeatureAccessQuery'
import { useSubscriptionQuery } from '@/hooks/billing/useSubscriptionQuery'
import { enablePayment, showCheckoutPreview } from '@/lib/env'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { trackEvent } from '@/services/analytics/analyticsClient'
import type { SubscriptionPlan } from '@/types/billing'

function isSubscriptionPlan(plan: string | null): plan is SubscriptionPlan {
  return ['free_trial', 'student', 'family', 'tutor_supported'].includes(plan ?? '')
}

export function BillingPage() {
  const { t } = useTranslation(['billing', 'common'])
  const [searchParams] = useSearchParams()
  const requestedPlan = searchParams.get('plan')
  const selectedPlan = isSubscriptionPlan(requestedPlan) ? requestedPlan : 'family'
  const plansQuery = useBillingPlansQuery()
  const usageQuery = useBillingUsageQuery()
  const featureAccessQuery = useFeatureAccessQuery()
  const subscriptionQuery = useSubscriptionQuery()
  const subscription = subscriptionQuery.data ?? {
    plan: 'free_trial' as SubscriptionPlan,
    status: 'trial' as const,
    currentPeriodEnd: '2026-06-30T00:00:00Z',
  }
  const plan = useMemo(
    () => plansQuery.data?.items.find((item) => item.id === selectedPlan),
    [plansQuery.data?.items, selectedPlan],
  )

  useEffect(() => {
    trackEvent('billing_page_viewed', { selectedPlan })
  }, [selectedPlan])

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          eyebrow={t('billing:title')}
          title={t('billing:subscription')}
          description={t('billing:description')}
          actions={<Badge variant="secondary">{enablePayment ? t('billing:paymentEnabled') : t('billing:paymentDisabled')}</Badge>}
        />

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <BillingSummaryCard
            plan={subscription.plan}
            status={subscription.status}
            currentPeriodEnd={subscription.currentPeriodEnd}
          />
          <Card className="brand-rule">
            <CardHeader>
              <CardTitle className="text-base">{t('billing:checkoutMode')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                {enablePayment
                  ? t('billing:paymentEnabledBody')
                  : t('billing:paymentDisabledBody')}
              </p>
              <p>
                {showCheckoutPreview
                  ? t('billing:mockCheckoutEnabled')
                  : t('billing:mockCheckoutDisabled')}
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <CheckoutButton plan={selectedPlan} />
                <ManageBillingButton />
                <Button asChild variant="outline">
                  <Link to="/support">{t('common:navigation.support')}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <BillingStatusAlert />

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          {usageQuery.data && <PlanUsageCard usage={usageQuery.data} />}
          {!usageQuery.isLoading && !usageQuery.data && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('billing:usage')}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Billing details are not available yet. Learning activity will appear here once the account is active.
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('billing:selectedPlan')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                {plan
                  ? `${plan.name}: ${plan.currency} ${plan.priceMonthly}/mo. ${plan.audience}`
                  : t('billing:planLoading')}
              </p>
              <p>{t('billing:limitsBody')}</p>
              <p>{t('billing:securityBody')}</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          {featureAccessQuery.data?.canRequestTeacherHelp === false && (
            <LockedFeatureCard
              feature="Teacher help"
              reason={featureAccessQuery.data.reason?.teacherHelp ?? t('billing:teacherUpgradeReason')}
            />
          )}
          {featureAccessQuery.data?.canUploadFiles === false && (
            <LockedFeatureCard
              feature="File uploads"
              reason={featureAccessQuery.data.reason?.fileUploads ?? t('billing:fileUploadReason')}
            />
          )}
          {featureAccessQuery.data?.canViewParentReports === false && (
            <LockedFeatureCard
              feature="Parent reports"
              reason={featureAccessQuery.data.reason?.parentReports ?? t('billing:parentReportReason')}
            />
          )}
        </section>
      </PageContainer>
    </DashboardLayout>
  )
}
