import { useTranslation } from 'react-i18next'
import { CalendarDays, CreditCard } from 'lucide-react'
import { SubscriptionBadge } from '@/components/billing/SubscriptionBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSubscriptionPlanLabel } from '@/lib/displayLabels'
import { formatDate } from '@/lib/formatDateTime'
import type { SubscriptionPlan, SubscriptionStatus } from '@/types/user'

type BillingSummaryCardProps = {
  plan: SubscriptionPlan
  status: SubscriptionStatus
  currentPeriodEnd?: string
}

export function BillingSummaryCard({ plan, status, currentPeriodEnd }: BillingSummaryCardProps) {
  const { t } = useTranslation('billing')

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">{t('summary.title')}</CardTitle>
          <SubscriptionBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex items-start gap-3">
          <CreditCard className="mt-0.5 h-4 w-4 text-primary" />
          <div>
            <p className="font-medium">{getSubscriptionPlanLabel(plan, t)}</p>
            <p className="text-muted-foreground">{t('summary.planBody')}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-0.5 h-4 w-4 text-primary" />
          <div>
            <p className="font-medium">{t('summary.currentPeriod')}</p>
            <p className="text-muted-foreground">
              {currentPeriodEnd ? formatDate(currentPeriodEnd) : t('summary.noPeriod')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
