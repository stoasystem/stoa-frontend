import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { BillingOverview } from '@/types/billing'

type AllowanceRowProps = {
  beneficiaryId: string
  kind: 'input' | 'output'
  percentUsed: number
  remaining: number
}

function AllowanceRow({
  beneficiaryId,
  kind,
  percentUsed,
  remaining,
}: AllowanceRowProps) {
  const label = kind === 'input' ? 'Learning input' : 'Learning output'

  return (
    <div
      className="space-y-2"
      data-testid={`allowance-${kind}-${beneficiaryId}`}
    >
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-right text-muted-foreground">
          {formatPercent(percentUsed)} used · {remaining.toLocaleString()} tokens remaining
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={`${label} allowance used`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentUsed}
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${percentUsed}%` }}
        />
      </div>
    </div>
  )
}

export function PlanUsageCard({ usage }: { usage: BillingOverview }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Weekly allowance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {usage.allowanceWindow ? (
          <>
            {usage.beneficiaries.map((beneficiary, index) => (
              <section
                className="space-y-4 border-b border-border/70 pb-5 last:border-0 last:pb-0"
                key={beneficiary.studentId}
              >
                <p className="text-sm font-semibold text-foreground">
                  Student {index + 1} · {formatPlan(beneficiary.effectivePlan)}
                </p>
                <AllowanceRow
                  beneficiaryId={beneficiary.studentId}
                  kind="input"
                  percentUsed={usage.inputPercentUsed[beneficiary.studentId]}
                  remaining={usage.inputRemaining[beneficiary.studentId]}
                />
                <AllowanceRow
                  beneficiaryId={beneficiary.studentId}
                  kind="output"
                  percentUsed={usage.outputPercentUsed[beneficiary.studentId]}
                  remaining={usage.outputRemaining[beneficiary.studentId]}
                />
              </section>
            ))}

            <TeacherCases usage={usage} />

            <p
              className="text-xs leading-5 text-muted-foreground"
              data-testid="allowance-window"
            >
              Week {usage.allowanceWindow.weekIdentity}:{' '}
              {formatWindowDate(usage.allowanceWindow.localStart)} –{' '}
              {formatWindowDate(usage.allowanceWindow.localEnd)} (
              {usage.allowanceWindow.timezone})
            </p>
          </>
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">
            No active weekly allowance is available yet.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function TeacherCases({ usage }: { usage: BillingOverview }) {
  const support = usage.teacherCasesRemaining
  const remaining = support.remaining
    ?? Object.values(support.byBeneficiary)[0]
    ?? 0

  return (
    <div
      className="rounded-md border border-border/70 p-3 text-sm text-muted-foreground"
      data-testid="allowance-teacher-cases"
    >
      {remaining.toLocaleString()} of {support.limit.toLocaleString()} support cases remaining
      {support.scope === 'shared_family' ? ' · shared family allowance' : ''}
    </div>
  )
}

function formatPercent(value: number) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`
}

function formatPlan(value: string) {
  return value.replace(/_/g, ' ')
}

function formatWindowDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeZone: 'Europe/Zurich',
  }).format(new Date(value))
}
