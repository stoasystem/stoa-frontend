import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BillingSummaryCard } from '@/components/billing/BillingSummaryCard'
import { PlanCard } from '@/components/billing/PlanCard'
import { UpgradeButton } from '@/components/billing/UpgradeButton'
import { pricingPlans } from '@/components/pricing/pricingPlans'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useSubscriptionQuery } from '@/hooks/billing/useSubscriptionQuery'
import { enableMockCheckout, enablePayment } from '@/lib/env'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import type { SubscriptionPlan } from '@/types/user'

function isSubscriptionPlan(plan: string | null): plan is SubscriptionPlan {
  return ['free_trial', 'student', 'family', 'tutor_supported'].includes(plan ?? '')
}

export function BillingPage() {
  const [searchParams] = useSearchParams()
  const requestedPlan = searchParams.get('plan')
  const selectedPlan = isSubscriptionPlan(requestedPlan) ? requestedPlan : 'family'
  const subscriptionQuery = useSubscriptionQuery()
  const subscription = subscriptionQuery.data ?? {
    plan: 'free_trial' as SubscriptionPlan,
    status: 'trial' as const,
    currentPeriodEnd: '2026-06-30T00:00:00Z',
  }
  const plan = useMemo(
    () => pricingPlans.find((item) => item.id === selectedPlan) ?? pricingPlans[2],
    [selectedPlan],
  )

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
                <UpgradeButton plan={selectedPlan}>Start checkout</UpgradeButton>
                <Button asChild variant="outline">
                  <Link to="/support">Contact support</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="grid gap-6 lg:grid-cols-[22rem_1fr]">
          <PlanCard plan={plan} featured onSelect={() => undefined} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Subscription rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
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
      </PageContainer>
    </DashboardLayout>
  )
}
