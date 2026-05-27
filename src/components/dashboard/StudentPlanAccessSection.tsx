import { CreditCard, ShieldCheck } from 'lucide-react'
import { PlanUsageCard } from '@/components/billing/PlanUsageCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useBillingPlansQuery } from '@/hooks/billing/useBillingPlansQuery'
import { useBillingUsageQuery } from '@/hooks/billing/useBillingUsageQuery'
import { useSubscriptionQuery } from '@/hooks/billing/useSubscriptionQuery'
import { getSubscriptionPlanLabel } from '@/lib/displayLabels'
import type { SubscriptionPlan } from '@/types/billing'

export function StudentPlanAccessSection() {
  const usageQuery = useBillingUsageQuery()
  const plansQuery = useBillingPlansQuery()
  const subscriptionQuery = useSubscriptionQuery()
  const subscriptionPlan = subscriptionQuery.data?.plan
  const selectedPlanId: SubscriptionPlan = subscriptionPlan && subscriptionPlan !== 'free_trial'
    ? subscriptionPlan
    : 'family'
  const selectedPlan = plansQuery.data?.items.find((plan) => plan.id === selectedPlanId)

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      {usageQuery.data ? (
        <PlanUsageCard usage={usageQuery.data} />
      ) : (
        <Card className="border-border/70 bg-card/90 shadow-[var(--platform-shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">Usage quota</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            Usage quota will appear here once learning activity is available.
          </CardContent>
        </Card>
      )}

      <Card className="border-border/70 bg-card/90 shadow-[var(--platform-shadow-card)]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] text-primary">
              <CreditCard className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="brand-section-kicker">Family access</p>
              <CardTitle className="text-xl">Selected plan</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
          <p>
            {selectedPlan
              ? `${selectedPlan.name}: ${selectedPlan.currency} ${selectedPlan.priceMonthly}/mo. ${selectedPlan.audience}`
              : `${getSubscriptionPlanLabel(selectedPlanId)} details are loading.`}
          </p>
          <div className="rounded-md border border-border/70 bg-[hsl(var(--platform-surface-app))] p-4">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <p>
                Plan limits explain how much Learning Chat, file upload, and teacher support access is available
                for this student during the current period.
              </p>
            </div>
          </div>
          <p>
            Payment details stay with the parent billing account. Students can see learning access, but do not manage
            card details or invoices.
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
