import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Clock, HelpCircle, Loader2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import {
  useCheckoutStatusQuery,
  useRecheckCheckoutMutation,
} from '@/hooks/billing/useCheckoutStatusQuery'
import type { CheckoutOutcome } from '@/types/billing'

function resolveCheckoutRef(searchParams: URLSearchParams): string | null {
  const fromParam = searchParams.get('checkoutRef')
  if (fromParam) return fromParam
  // Fallback: pick up ref stored before redirecting to Stripe
  return sessionStorage.getItem('stoa_checkout_ref')
}

function OutcomeContent({ outcome, plan }: { outcome: CheckoutOutcome; plan: string }) {
  switch (outcome) {
    case 'active':
      return (
        <>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <CardTitle>Plan activated</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Your <span className="font-medium text-foreground">{plan}</span> plan is now active. All
            features are available immediately.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <Button asChild>
              <Link to="/billing">View billing</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/dashboard">Go to dashboard</Link>
            </Button>
          </div>
        </>
      )
    case 'confirming':
      return (
        <>
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-yellow-500" />
            <CardTitle>Confirming payment…</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            We are waiting for payment confirmation from Stripe. This usually takes a few seconds.
            The page will update automatically.
          </p>
        </>
      )
    case 'not_completed':
      return (
        <>
          <div className="flex items-center gap-3">
            <XCircle className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Checkout not completed</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            The checkout session ended without a successful payment. No charge was made. You can
            start a new checkout from the pricing page.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <Button asChild>
              <Link to="/pricing">See plans</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/billing">Return to billing</Link>
            </Button>
          </div>
        </>
      )
    case 'support_needed':
      return (
        <>
          <div className="flex items-center gap-3">
            <HelpCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Attention needed</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            We could not automatically confirm your payment status. Please contact STOA support and
            we will resolve this promptly.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <Button asChild>
              <Link to="/support">Contact support</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/billing">Return to billing</Link>
            </Button>
          </div>
        </>
      )
  }
}

export function CheckoutResultPage() {
  const [searchParams] = useSearchParams()
  const [checkoutRef] = useState(() => resolveCheckoutRef(searchParams))

  const { data, isLoading, isError } = useCheckoutStatusQuery(checkoutRef)
  const recheck = useRecheckCheckoutMutation(checkoutRef)

  // Clear sessionStorage once we have a terminal result
  useEffect(() => {
    if (data && ['active', 'not_completed', 'support_needed'].includes(data.outcome)) {
      sessionStorage.removeItem('stoa_checkout_ref')
    }
  }, [data])

  if (!checkoutRef) {
    return (
      <DashboardLayout>
        <PageContainer className="p-0">
          <PageHeader
            eyebrow="Checkout"
            title="No checkout reference found"
            description="Return to billing to start a new checkout."
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
        <PageHeader eyebrow="Checkout" title="Checkout status" />
        <Card>
          <CardHeader>
            {isLoading && (
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <CardTitle>Checking payment status…</CardTitle>
              </div>
            )}
            {isError && (
              <div className="flex items-center gap-3">
                <HelpCircle className="h-5 w-5 text-destructive" />
                <CardTitle>Could not load status</CardTitle>
              </div>
            )}
            {data && <OutcomeContent outcome={data.outcome} plan={data.targetPlan} />}
          </CardHeader>
          <CardContent className="space-y-2">
            {data && data.outcome === 'confirming' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => recheck.mutate()}
                disabled={recheck.isPending}
              >
                {recheck.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Check now
              </Button>
            )}
            {isError && (
              <Button asChild variant="outline" size="sm">
                <Link to="/billing">Return to billing</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </DashboardLayout>
  )
}
