import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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
import { enableMockCheckout, enablePayment } from '@/lib/env'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { trackEvent } from '@/services/analytics/analyticsClient'
import type { SubscriptionPlan } from '@/types/billing'

function isSubscriptionPlan(plan: string | null): plan is SubscriptionPlan {
  return ['free_trial', 'student', 'family', 'tutor_supported'].includes(plan ?? '')
}

export function BillingPage() {
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
          eyebrow="Billing"
          title="Subscription"
          description="Review launch-ready subscription state and start a hosted or virtual checkout flow."
          actions={<Badge variant="secondary">{enablePayment ? 'Payment enabled' : 'Payment disabled'}</Badge>}
        />

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <BillingSummaryCard
            plan={subscription.plan}
            status={subscription.status}
            currentPeriodEnd={subscription.currentPeriodEnd}
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Checkout mode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                {enablePayment
                  ? 'Payment is enabled. The frontend will request a backend checkout session.'
                  : 'Payment is disabled. Use this page to capture interest and validate content.'}
              </p>
              <p>
                {enableMockCheckout
                  ? 'Mock checkout is enabled, so plan selection opens a virtual checkout for demos and tests.'
                  : 'Mock checkout is disabled. Real checkout requires a backend checkoutUrl response.'}
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <CheckoutButton plan={selectedPlan} />
                <ManageBillingButton />
                <Button asChild variant="outline">
                  <Link to="/support">Contact support</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <BillingStatusAlert />

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          {usageQuery.data && <PlanUsageCard usage={usageQuery.data} />}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Selected plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                {plan
                  ? `${plan.name}: ${plan.currency} ${plan.priceMonthly}/mo. ${plan.audience}`
                  : 'Plan details are loading from the billing plans contract.'}
              </p>
              <p>
                Frontend locked states and upgrade prompts are advisory. Backend APIs must enforce
                AI message quota, upload quota, teacher-help quota, and parent-report access.
              </p>
              <p>
                Stripe Checkout is the preferred real payment direction. The browser never receives
                card details or payment secrets.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          {featureAccessQuery.data?.canRequestTeacherHelp === false && (
            <LockedFeatureCard
              feature="Teacher help"
              reason={featureAccessQuery.data.reason?.teacherHelp ?? 'Upgrade to keep teacher support active.'}
            />
          )}
          {featureAccessQuery.data?.canUploadFiles === false && (
            <LockedFeatureCard
              feature="File uploads"
              reason={featureAccessQuery.data.reason?.fileUploads ?? 'File upload quota reached.'}
            />
          )}
          {featureAccessQuery.data?.canViewParentReports === false && (
            <LockedFeatureCard
              feature="Parent reports"
              reason={featureAccessQuery.data.reason?.parentReports ?? 'Family Plan is required for reports.'}
            />
          )}
        </section>
      </PageContainer>
    </DashboardLayout>
  )
}
