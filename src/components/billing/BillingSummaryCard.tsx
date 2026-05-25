import { CalendarDays, CreditCard } from 'lucide-react'
import { SubscriptionBadge } from '@/components/billing/SubscriptionBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSubscriptionPlanLabel } from '@/lib/displayLabels'
import type { SubscriptionPlan, SubscriptionStatus } from '@/types/user'

type BillingSummaryCardProps = {
  plan: SubscriptionPlan
  status: SubscriptionStatus
  currentPeriodEnd?: string
}

export function BillingSummaryCard({ plan, status, currentPeriodEnd }: BillingSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Current subscription</CardTitle>
          <SubscriptionBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex items-start gap-3">
          <CreditCard className="mt-0.5 h-4 w-4 text-primary" />
          <div>
            <p className="font-medium">{getSubscriptionPlanLabel(plan)}</p>
            <p className="text-muted-foreground">
              Your plan shows the learning support currently available for this account.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-0.5 h-4 w-4 text-primary" />
          <div>
            <p className="font-medium">Current period</p>
            <p className="text-muted-foreground">
              {currentPeriodEnd
                ? new Date(currentPeriodEnd).toLocaleDateString()
                : 'No billing period returned yet.'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
