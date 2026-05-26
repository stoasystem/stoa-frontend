import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { showCheckoutPreview } from '@/lib/env'
import { getSubscriptionPlanLabel } from '@/lib/displayLabels'

export function CheckoutResultPage({ status }: { status: 'success' | 'cancel' }) {
  const [searchParams] = useSearchParams()
  const plan = searchParams.get('plan') ?? 'family'
  const planLabel = getSubscriptionPlanLabel(plan)
  const success = status === 'success'
  const Icon = success ? CheckCircle2 : XCircle

  if (!showCheckoutPreview) {
    return (
      <DashboardLayout>
        <PageContainer className="p-0">
          <PageHeader
            eyebrow="Checkout unavailable"
            title="Plan selection is being prepared"
            description="Please return to billing or contact STOA to continue."
          />
          <Button asChild>
            <Link to="/billing">Return to billing</Link>
          </Button>
        </PageContainer>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          eyebrow="Checkout"
          title={success ? 'Plan review complete' : 'Plan selection canceled'}
          description="This page confirms the plan-selection outcome before payment collection is enabled."
        />
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Icon className={success ? 'h-5 w-5 text-primary' : 'h-5 w-5 text-muted-foreground'} />
              <CardTitle>{success ? 'Ready for subscription sync' : 'No plan changed'}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              Plan: <span className="font-medium text-foreground">{planLabel}</span>. In live payment mode,
              STOA services confirm the final subscription status.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/billing">Return to billing</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/pricing">Compare plans</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    </DashboardLayout>
  )
}
