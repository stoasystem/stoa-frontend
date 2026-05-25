import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { pricingPlans } from '@/components/pricing/pricingPlans'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { showCheckoutPreview } from '@/lib/env'
import { trackEvent } from '@/services/analytics/analyticsClient'

export function VirtualCheckoutPage() {
  const { t } = useTranslation('billing')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const plan = pricingPlans.find((item) => item.id === searchParams.get('plan')) ?? pricingPlans[2]
  const price = plan.priceMonthly === 0 ? `${plan.currency} 0` : `${plan.currency} ${plan.priceMonthly}/mo`
  const planName = t(`plans.${plan.id}.name`, { defaultValue: plan.name })

  if (!showCheckoutPreview) {
    return (
      <DashboardLayout>
        <PageContainer className="p-0">
          <PageHeader
            eyebrow="Checkout unavailable"
            title="Plan selection is being prepared"
            description="Please return to billing or contact STOA to continue."
          />
          <Card>
            <CardContent className="space-y-4 p-6 text-sm text-muted-foreground">
              <p>Online plan changes are not available right now.</p>
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
          eyebrow="Plan selection"
          title="Plan selection preview"
          description="Review the plan journey without entering payment details."
          actions={<Badge variant="secondary">No card required</Badge>}
        />
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
              <div>
                <CardTitle>{planName}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">{price}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              This preview is for reviewing the plan journey. Do not enter card numbers.
              Live payment collection will use a secure hosted checkout.
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
                Complete plan preview
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
