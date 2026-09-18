import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { CreditCard, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStudentEntitlementQuery } from '@/hooks/student/useStudentEntitlementQuery'
import { getSubscriptionPlanLabel } from '@/lib/displayLabels'
import { formatDayAndMonth } from '@/lib/formatDateTime'
import type { SubscriptionPlan } from '@/types/billing'

function formatLimit(value: number | null | undefined, t: TFunction<'practice'>) {
  return typeof value === 'number'
    ? t('dashboard.plan.perDay', { count: value })
    : t('dashboard.plan.notLimited')
}

export function StudentPlanAccessSection() {
  const { t } = useTranslation('practice')
  // A student's plan comes from a parent's billing, which only a parent may
  // read. This asks the student's own entitlement instead.
  const entitlementQuery = useStudentEntitlementQuery()
  const entitlement = entitlementQuery.data

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <Card className="border-border/70 bg-card/90 shadow-[var(--platform-shadow-card)]">
        <CardHeader>
          <CardTitle className="text-base">{t('dashboard.planTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
          {entitlement ? (
            <>
              <Detail
                label={t('set.metricQuestions')}
                value={formatLimit(entitlement.dailyAiQuestionLimit, t)}
              />
              <Detail
                label={t('ui.chatMessages')}
                value={formatLimit(entitlement.dailyChatMessageLimit, t)}
              />
              {entitlement.freeTrialActive && (
                <Detail
                  label={t('ui.freeTrial')}
                  value={
                    entitlement.freeTrialEndsAt
                      ? t('dashboard.plan.trialEnds', {
                          date: formatDayAndMonth(entitlement.freeTrialEndsAt),
                        })
                      : t('dashboard.plan.trialActive')
                  }
                />
              )}
            </>
          ) : (
            <p>{t('progress.planLimits')}</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90 shadow-[var(--platform-shadow-card)]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] text-primary">
              <CreditCard className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="brand-section-kicker">{t('dashboard.familyAccess')}</p>
              <CardTitle className="text-xl">
                {entitlement
                  ? getSubscriptionPlanLabel(entitlement.effectivePlan as SubscriptionPlan, t)
                  : t('dashboard.plan.yourPlan')}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
          <div className="rounded-md border border-border/70 bg-[hsl(var(--platform-surface-app))] p-4">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <p>
                {entitlement?.newUsageAllowed === false
                  ? t('dashboard.plan.usagePaused')
                  : t('dashboard.plan.usageCovered')}
              </p>
            </div>
          </div>
          <p>{t('dashboard.plan.billingNote')}</p>
        </CardContent>
      </Card>
    </section>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border/70 bg-[hsl(var(--platform-surface-app))] p-3">
      <span className="text-xs font-semibold uppercase tracking-[0.08em]">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  )
}
