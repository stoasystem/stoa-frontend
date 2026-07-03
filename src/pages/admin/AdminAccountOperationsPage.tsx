import { type FormEvent, useState } from 'react'
import { AlertTriangle, CheckCircle2, Search, ShieldAlert, UserRound } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { describeIssueCode, formatStatus, supportStateTone } from '@/components/parent/accountOperationsView'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/services/api/httpClient'
import { useAdminParentAccountOperationsQuery } from '@/hooks/admin/useAdminAccountOperationsQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import type { AdminAccountOperations } from '@/types/adminAccountOperations'
import type { AccountOperationsChild, AccountOperationsUsage } from '@/types/parentAccountOperations'
import type { SubscriptionBillingEvent } from '@/types/subscriptionOperations'

export function AdminAccountOperationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const parentId = searchParams.get('parentId')?.trim() ?? ''
  const day = searchParams.get('day')?.trim() ?? ''
  const [draftParentId, setDraftParentId] = useState(parentId)
  const [draftDay, setDraftDay] = useState(day)
  const query = useAdminParentAccountOperationsQuery(parentId, day || undefined)

  function submitLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextParentId = draftParentId.trim()
    const nextDay = draftDay.trim()
    const next = new URLSearchParams()
    if (nextParentId) next.set('parentId', nextParentId)
    if (nextDay) next.set('day', nextDay)
    setSearchParams(next)
  }

  return (
    <DashboardLayout>
      <PageContainer className="space-y-6 p-0">
        <PageHeader
          eyebrow="Account operations"
          title="Parent support console"
          description="Inspect verification, billing, child access, entitlement, and usage state for one parent account."
          actions={<Button asChild variant="outline"><Link to="/admin/subscriptions">Subscription queue</Link></Button>}
        />

        <form onSubmit={submitLookup} className="grid gap-3 rounded-md border border-border/70 bg-card p-4 md:grid-cols-[minmax(0,1fr)_12rem_auto]">
          <label className="space-y-2 text-sm font-medium text-foreground">
            Parent ID
            <Input
              value={draftParentId}
              onChange={(event) => setDraftParentId(event.target.value)}
              placeholder="parent-1"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-foreground">
            Usage day
            <Input
              value={draftDay}
              onChange={(event) => setDraftDay(event.target.value)}
              placeholder="2026-07-03"
            />
          </label>
          <Button type="submit" className="self-end">
            <Search className="mr-2 h-4 w-4" aria-hidden="true" />
            Inspect
          </Button>
        </form>

        {!parentId && <EmptyLookup />}
        {parentId && query.isLoading && <LoadingPanel />}
        {parentId && query.isError && <ErrorPanel error={query.error} />}
        {query.data && <AdminAccountOperationsDetail data={query.data} />}
      </PageContainer>
    </DashboardLayout>
  )
}

function AdminAccountOperationsDetail({ data }: { data: AdminAccountOperations }) {
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
                  ? 'No account operations blockers or warnings are currently reported.'
                  : 'Review blockers and warnings before making support or billing decisions.'}
              </p>
            </div>
          </div>
          <Badge variant={state === 'ready' ? 'secondary' : 'outline'}>{data.parentId}</Badge>
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

      <div className="grid gap-4 lg:grid-cols-4">
        <FactCard title="Parent verification" value={formatStatus(data.parent.verification?.emailVerificationStatus)} detail={`${data.parent.name} / ${data.parent.email}`} />
        <FactCard title="Billing" value={formatStatus(data.billing.status)} detail={`${formatStatus(data.billing.subscriptionTier)} plan`} />
        <FactCard title="Children" value={String(data.children.length)} detail={data.children.length === 1 ? 'Linked child' : 'Linked children'} />
        <FactCard title="Usage rows" value={String(data.usage.length)} detail={data.usage.some((item) => item.unreconciled) ? 'Reconciliation pending' : 'Usage matched'} />
      </div>

      <BillingEvidence data={data} />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Child access and entitlement</h2>
        {data.children.length === 0 ? (
          <Card>
            <CardContent className="p-5 text-sm text-muted-foreground">No linked child account is visible for this parent.</CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {data.children.map((child) => (
              <ChildOperationsRow key={child.studentId} child={child} />
            ))}
          </div>
        )}
      </section>

      <UsageSummary usage={data.usage} />
    </>
  )
}

function BillingEvidence({ data }: { data: AdminAccountOperations }) {
  const billing = data.billing
  const events = billing.events ?? []
  return (
    <Card className="brand-rule">
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base">Billing evidence</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              Provider, manual override, readiness, and recent billing events used by account operations.
            </p>
          </div>
          <Badge variant={billing.status === 'active' ? 'secondary' : 'outline'}>{formatStatus(billing.mode)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(24rem,1.05fr)]">
        <div className="grid gap-3 sm:grid-cols-2">
          <DetailItem label="Provider" value={billing.provider ?? 'Manual'} />
          <DetailItem label="Requested tier" value={formatStatus(billing.requestedTier)} />
          <DetailItem label="Current period" value={formatPeriod(billing.currentPeriodStart, billing.currentPeriodEnd)} />
          <DetailItem label="Last event" value={billing.lastProviderEventType ? formatStatus(billing.lastProviderEventType) : 'None'} />
          <DetailItem label="Manual override" value={billing.manualOverrideSource ?? 'None'} />
          <DetailItem label="Cancel at period end" value={billing.cancelAtPeriodEnd ? 'Yes' : 'No'} />
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Recent billing events</p>
          {events.length === 0 && <p className="text-sm text-muted-foreground">No billing events recorded yet.</p>}
          {events.slice(0, 5).map((event) => (
            <BillingEventRow key={event.eventId} event={event} />
          ))}
        </div>
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

function UsageSummary({ usage }: { usage: AccountOperationsUsage[] }) {
  if (usage.length === 0) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">No usage summary is available for this parent and day.</CardContent>
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
                  <p className="mt-1 text-sm text-muted-foreground">{item.studentId} / {item.quotaPeriod}</p>
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

function FactCard({ title, value, detail }: { title: string; value: string; detail: string }) {
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

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/70 bg-background/80 p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
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

function BillingEventRow({ event }: { event: SubscriptionBillingEvent }) {
  return (
    <div className="rounded-md border border-border/70 p-3 text-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-medium text-foreground">{formatStatus(event.eventType)}</span>
        <span className="text-muted-foreground">{formatDate(event.eventAt)}</span>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <p className="text-muted-foreground">Status: {formatStatus(event.billingStatus)}</p>
        <p className="truncate text-muted-foreground">Provider event: {event.providerEventId ?? 'None'}</p>
      </div>
    </div>
  )
}

function EmptyLookup() {
  return (
    <Card>
      <CardContent className="p-5 text-sm text-muted-foreground">
        Enter a parent ID to inspect account operations, or open this view from a provider billing record in the subscription queue.
      </CardContent>
    </Card>
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

function ErrorPanel({ error }: { error: Error | null }) {
  const isMissingParent = error instanceof ApiError && error.status === 404
  return (
    <Card>
      <CardContent className="p-5 text-sm text-destructive" role="alert">
        {isMissingParent ? 'Parent account was not found.' : 'Admin account operations are unavailable. Please try again later.'}
      </CardContent>
    </Card>
  )
}

function formatPeriod(start?: string | null, end?: string | null) {
  if (!start && !end) return 'None'
  return `${start ? formatDate(start) : 'Unknown'} - ${end ? formatDate(end) : 'Unknown'}`
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
}
