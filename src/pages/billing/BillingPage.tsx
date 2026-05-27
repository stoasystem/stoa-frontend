import { useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CreditCard, HelpCircle, Settings, type LucideIcon } from 'lucide-react'
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-base">{t('billing:checkoutMode')}</CardTitle>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Choose a plan or update family payment settings from one place.
                  </p>
                </div>
                <Badge variant="secondary">{showCheckoutPreview ? 'Review mode' : 'Hosted payment'}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              <div className="grid gap-3 sm:grid-cols-2">
                <BillingActionCard
                  icon={CreditCard}
                  title={showCheckoutPreview ? 'Review checkout' : 'Start checkout'}
                  description={
                    showCheckoutPreview
                      ? t('billing:planSelectionReviewEnabled')
                      : t('billing:paymentEnabledBody')
                  }
                >
                  <CheckoutButton plan={selectedPlan} />
                </BillingActionCard>
                <BillingActionCard
                  icon={Settings}
                  title="Payment settings"
                  description={
                    enablePayment
                      ? 'Update saved payment method and invoice settings.'
                      : 'Review billing contact and payment setup status before live payments are enabled.'
                  }
                >
                  <ManageBillingButton />
                </BillingActionCard>
              </div>
              <div className="flex flex-col gap-3 rounded-md border border-border/70 bg-[hsl(var(--platform-surface-app))] p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <p className="min-w-0">
                    {enablePayment
                      ? 'Need help with a charge or invoice?'
                      : t('billing:paymentDisabledBody')}
                  </p>
                </div>
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

function BillingActionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-44 flex-col rounded-md border border-border/70 bg-[hsl(var(--platform-surface-app))] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] text-primary">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{title}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-auto pt-4 [&_button]:w-full [&_a]:w-full">{children}</div>
    </div>
  )
}
