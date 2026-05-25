import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { pricingPlans } from '@/components/pricing/pricingPlans'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { enableMockCheckout } from '@/lib/env'
import { trackEvent } from '@/services/analytics/analyticsClient'

export function VirtualCheckoutPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const plan = pricingPlans.find((item) => item.id === searchParams.get('plan')) ?? pricingPlans[2]
  const price = plan.priceMonthly === 0 ? `${plan.currency} 0` : `${plan.currency} ${plan.priceMonthly}/mo`

  if (!enableMockCheckout) {
    return (
      <DashboardLayout>
        <PageContainer className="p-0">
          <PageHeader
            eyebrow="Checkout unavailable"
            title="Virtual checkout is disabled"
            description="This environment is not configured for mock checkout demos."
          />
          <Card>
            <CardContent className="space-y-4 p-6 text-sm text-muted-foreground">
              <p>Use billing support or enable the mock checkout flag in a local demo environment.</p>
              <Button asChild>
                <Link to="/billing">Return to billing</Link>
              </Button>
            </CardContent>
          </Card>
        </PageContainer>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          eyebrow="Virtual checkout"
          title="Demo checkout"
          description="Test the launch payment journey without real payment data."
          actions={<Badge variant="secondary">No card required</Badge>}
        />
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
              <div>
                <CardTitle>{plan.name}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">{price}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              This is a virtual checkout for frontend demos and E2E tests. Do not enter real card
              numbers. Production payment must redirect to a backend-created hosted checkout URL.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => {
                  trackEvent('billing_virtual_checkout_completed', { plan: plan.id })
                  trackEvent('checkout_mock_completed', { plan: plan.id })
                  navigate(`/billing/checkout/success?plan=${plan.id}`)
                }}
              >
                Complete virtual checkout
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  trackEvent('billing_virtual_checkout_canceled', { plan: plan.id })
                  navigate(`/billing/checkout/cancel?plan=${plan.id}`)
                }}
              >
                Cancel checkout
              </Button>
              <Button asChild variant="ghost">
                <Link to="/billing">Back to billing</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    </DashboardLayout>
  )
}
