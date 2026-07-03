import { AlertTriangle, CheckCircle2, ShieldAlert, UserRound } from 'lucide-react'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { describeIssueCode, formatStatus, supportStateTone } from '@/components/parent/accountOperationsView'
import { useParentAccountOperationsQuery } from '@/hooks/parent/useParentAccountOperationsQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import type { AccountOperationsChild, AccountOperationsUsage, ParentAccountOperations } from '@/types/parentAccountOperations'

export function ParentAccountOperationsPage() {
  const query = useParentAccountOperationsQuery()

  return (
    <DashboardLayout>
      <PageContainer className="space-y-6 p-0">
        <PageHeader
          eyebrow="Account operations"
          title="Family account status"
          description="Review billing, child access, verification, and usage state without exposing private learning content."
        />

        {query.isLoading && <LoadingPanel />}
        {query.isError && <ErrorPanel />}
        {query.data && <AccountOperationsContent data={query.data} />}
      </PageContainer>
    </DashboardLayout>
  )
}

function AccountOperationsContent({ data }: { data: ParentAccountOperations }) {
  const state = data.supportState.state
  const Icon = state === 'blocked' ? ShieldAlert : state === 'attention' ? AlertTriangle : CheckCircle2
  const issues = [...data.supportState.blockers, ...data.supportState.warnings]

  return (
    <>
      <section className={`rounded-lg border p-5 ${supportStateTone(state)}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <Icon className="mt-1 h-6 w-6 shrink-0" aria-hidden="true" />
            <div>
              <p className="brand-section-kicker">Support state</p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">{formatStatus(state)}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                {state === 'ready'
                  ? 'The parent account is operational.'
                  : 'Review these account items before relying on account operations status.'}
              </p>
            </div>
          </div>
          <Badge variant={state === 'ready' ? 'secondary' : 'outline'}>{issues.length} issue{issues.length === 1 ? '' : 's'}</Badge>
        </div>
        {issues.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {issues.map((issue) => (
              <Badge key={issue} variant={data.supportState.blockers.includes(issue) ? 'destructive' : 'outline'}>
                {describeIssueCode(issue)}
              </Badge>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <AccountFactCard title="Parent verification" value={formatStatus(data.parent.verification?.emailVerificationStatus)} detail={data.parent.email} />
        <AccountFactCard title="Billing" value={formatStatus(data.billing.status)} detail={`${formatStatus(data.billing.subscriptionTier)} plan`} />
        <AccountFactCard title="Linked children" value={String(data.children.length)} detail={data.children.length === 0 ? 'No child account linked' : 'Child account access visible'} />
      </div>

      {data.children.length === 0 ? (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            No child account is linked yet. Account operations will show usage and entitlement details after a child account is connected.
          </CardContent>
        </Card>
      ) : (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Child account operations</h2>
          <div className="grid gap-3">
            {data.children.map((child) => (
              <ChildOperationsRow key={child.studentId} child={child} />
            ))}
          </div>
        </section>
      )}

      <UsageSection usage={data.usage} />
    </>
  )
}

function AccountFactCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

function ChildOperationsRow({ child }: { child: AccountOperationsChild }) {
  const usage = child.usage
  const usageLabel = usage ? `${usage.consumed}/${usage.limit} used` : 'Usage unavailable'
  return (
    <Card>
      <CardContent className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1.1fr)_repeat(4,minmax(8rem,0.7fr))]">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] text-primary">
            <UserRound className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{child.profile.name || child.profile.email}</p>
            <p className="truncate text-sm text-muted-foreground">{child.profile.email}</p>
          </div>
        </div>
        <ChildMetric label="Binding" value={formatStatus(child.binding.status)} />
        <ChildMetric label="Verification" value={formatStatus(child.profile.verification?.emailVerificationStatus ?? child.verification?.emailVerificationStatus)} />
        <ChildMetric label="Plan" value={formatStatus(child.entitlement?.effectivePlan)} />
        <ChildMetric label="Usage" value={usageLabel} muted={Boolean(usage?.unreconciled)} />
      </CardContent>
    </Card>
  )
}

function ChildMetric({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="rounded-md border border-border/70 bg-background/80 p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${muted ? 'text-amber-700' : 'text-foreground'}`}>{value}</p>
    </div>
  )
}

function UsageSection({ usage }: { usage: AccountOperationsUsage[] }) {
  if (usage.length === 0) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">No usage summary is available yet.</CardContent>
      </Card>
    )
  }
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">Usage summary</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {usage.map((item) => (
          <Card key={`${item.studentId}-${item.quotaPeriod}-${item.action}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{formatStatus(item.action)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.quotaPeriod}</p>
                </div>
                <Badge variant={item.unreconciled ? 'outline' : 'secondary'}>
                  {item.unreconciled ? 'Reconciling' : 'Matched'}
                </Badge>
              </div>
              <p className="mt-4 text-2xl font-semibold text-foreground">{item.remaining} remaining</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.consumed} of {item.limit} used</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function LoadingPanel() {
  return (
    <Card aria-busy="true">
      <CardContent className="space-y-3 p-5">
        <div className="h-4 w-40 rounded bg-muted" />
        <div className="h-4 w-full max-w-xl rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
      </CardContent>
    </Card>
  )
}

function ErrorPanel() {
  return (
    <Card>
      <CardContent className="p-5 text-sm text-destructive" role="alert">
        Account operations are unavailable. Please try again later.
      </CardContent>
    </Card>
  )
}
