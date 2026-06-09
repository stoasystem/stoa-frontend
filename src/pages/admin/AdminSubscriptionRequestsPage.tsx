import { type FormEvent, useMemo, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, CreditCard, Search, XCircle } from 'lucide-react'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  useAdminSubscriptionRequestQuery,
  useAdminSubscriptionBillingDetailQuery,
  useAdminSubscriptionBillingQuery,
  useAdminSubscriptionRequestsQuery,
  useApplySubscriptionRequestMutation,
  useUpdateSubscriptionRequestMutation,
} from '@/hooks/admin/useAdminSubscriptionRequests'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import type {
  SubscriptionRequest,
  SubscriptionRequestFilters,
  SubscriptionRequestStatus,
  SubscriptionTier,
  SubscriptionBilling,
} from '@/types/subscriptionOperations'

type FilterDraft = {
  status: SubscriptionRequestStatus | ''
  requestedTier: SubscriptionTier | ''
  parentId: string
}

const statusOptions: { label: string; value: SubscriptionRequestStatus | '' }[] = [
  { label: 'Any status', value: '' },
  { label: 'Requested', value: 'requested' },
  { label: 'In review', value: 'in_review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Applied', value: 'applied' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Cancelled', value: 'cancelled' },
]

const tierOptions: { label: string; value: SubscriptionTier | '' }[] = [
  { label: 'Any tier', value: '' },
  { label: 'Free', value: 'free' },
  { label: 'Standard', value: 'standard' },
  { label: 'Premium', value: 'premium' },
]

export function AdminSubscriptionRequestsPage() {
  const [draft, setDraft] = useState<FilterDraft>({ status: 'requested', requestedTier: '', parentId: '' })
  const [filters, setFilters] = useState<SubscriptionRequestFilters>({ status: 'requested', limit: 50 })
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [adminNote, setAdminNote] = useState('Manual subscription review')
  const [effectiveAt, setEffectiveAt] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [selectedBillingParentId, setSelectedBillingParentId] = useState<string | null>(null)
  const requestsQuery = useAdminSubscriptionRequestsQuery(filters)
  const selectedQuery = useAdminSubscriptionRequestQuery(selectedRequestId)
  const billingQuery = useAdminSubscriptionBillingQuery({ limit: 50 })
  const selectedBillingQuery = useAdminSubscriptionBillingDetailQuery(selectedBillingParentId)
  const updateMutation = useUpdateSubscriptionRequestMutation()
  const applyMutation = useApplySubscriptionRequestMutation()
  const rows = requestsQuery.data?.items ?? []
  const billingRows = billingQuery.data?.items ?? []
  const selectedRequest = selectedQuery.data ?? rows.find((row) => row.requestId === selectedRequestId) ?? rows[0]
  const selectedBilling =
    selectedBillingQuery.data ??
    billingRows.find((row) => row.parentId === selectedBillingParentId) ??
    billingRows[0]

  const queueStats = useMemo(() => {
    const open = rows.filter((row) => ['requested', 'in_review', 'approved'].includes(row.status)).length
    const approved = rows.filter((row) => row.status === 'approved').length
    const terminal = rows.filter((row) => ['applied', 'rejected', 'cancelled'].includes(row.status)).length
    return { open, approved, terminal }
  }, [rows])

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFilters({
      status: draft.status || undefined,
      requestedTier: draft.requestedTier || undefined,
      parentId: draft.parentId || undefined,
      limit: 50,
    })
    setSelectedRequestId(null)
    setMessage(null)
  }

  function transition(status: SubscriptionRequestStatus) {
    if (!selectedRequest) return
    setMessage(null)
    updateMutation.mutate(
      {
        requestId: selectedRequest.requestId,
        status,
        adminNote: adminNote || undefined,
        effectiveAt: effectiveAt || undefined,
      },
      {
        onSuccess: (request) => {
          setSelectedRequestId(request.requestId)
          setMessage(`Request ${formatStatus(request.status)}.`)
        },
        onError: (error) => setMessage(error.message),
      },
    )
  }

  function applySelected() {
    if (!selectedRequest) return
    setMessage(null)
    applyMutation.mutate(
      {
        requestId: selectedRequest.requestId,
        adminNote: adminNote || undefined,
        effectiveAt: effectiveAt || undefined,
      },
      {
        onSuccess: (request) => {
          setSelectedRequestId(request.requestId)
          setMessage(`Applied ${formatTier(request.requestedTier)} to ${request.parentId}.`)
        },
        onError: (error) => setMessage(error.message),
      },
    )
  }

  return (
    <DashboardLayout>
      <PageContainer className="space-y-6 p-0">
        <PageHeader
          eyebrow="Manual billing"
          title="Subscription requests"
          description="Review parent plan intents and apply approved tier changes."
          actions={<Badge variant="secondary">Stripe/TWINT deferred</Badge>}
        />

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Open requests" value={queueStats.open} />
          <MetricCard label="Ready to apply" value={queueStats.approved} />
          <MetricCard label="Provider records" value={billingRows.length} />
        </section>

        <form onSubmit={applyFilters} className="grid gap-3 rounded-md border border-border/70 bg-card p-4 md:grid-cols-[1fr_1fr_1.2fr_auto]">
          <label className="space-y-2 text-sm font-medium text-foreground">
            Status
            <select
              value={draft.status}
              onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as FilterDraft['status'] }))}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {statusOptions.map((option) => (
                <option key={option.value || 'any'} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-foreground">
            Tier
            <select
              value={draft.requestedTier}
              onChange={(event) => setDraft((current) => ({ ...current, requestedTier: event.target.value as FilterDraft['requestedTier'] }))}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {tierOptions.map((option) => (
                <option key={option.value || 'any'} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-foreground">
            Parent ID
            <Input
              value={draft.parentId}
              onChange={(event) => setDraft((current) => ({ ...current, parentId: event.target.value }))}
              placeholder="parent-..."
            />
          </label>
          <Button type="submit" className="self-end">
            <Search className="mr-2 h-4 w-4" aria-hidden="true" />
            Filter
          </Button>
        </form>

        {requestsQuery.isError && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Subscription requests are unavailable.
          </p>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(25rem,0.95fr)]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Request queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {requestsQuery.isLoading && <p className="text-sm text-muted-foreground">Loading requests...</p>}
              {!requestsQuery.isLoading && rows.length === 0 && (
                <p className="text-sm text-muted-foreground">No subscription requests match these filters.</p>
              )}
              {rows.map((request) => (
                <button
                  key={request.requestId}
                  type="button"
                  onClick={() => setSelectedRequestId(request.requestId)}
                  className={`w-full rounded-md border p-4 text-left transition hover:bg-muted/50 ${
                    selectedRequest?.requestId === request.requestId ? 'border-primary bg-[hsl(var(--stoa-brand-burgundy-soft))]' : 'border-border/70'
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {requestIcon(request)}
                        <p className="font-semibold text-foreground">
                          {formatRequestType(request.requestType)} to {formatTier(request.requestedTier)}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{request.parentId}</p>
                    </div>
                    <Badge variant={request.status === 'approved' ? 'secondary' : 'outline'}>
                      {formatStatus(request.status)}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>Current: {formatTier(request.currentTier)}</span>
                    <span>Created: {formatDate(request.createdAt)}</span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="brand-rule">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-base">Request detail</CardTitle>
                  {selectedRequest && (
                    <p className="mt-2 text-sm text-muted-foreground">{selectedRequest.requestId}</p>
                  )}
                </div>
                {selectedRequest && <Badge variant="secondary">{formatStatus(selectedRequest.status)}</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {!selectedRequest && <p className="text-sm text-muted-foreground">Select a request to review.</p>}
              {selectedRequest && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DetailItem label="Parent" value={selectedRequest.parentId} />
                    <DetailItem label="Intent" value={`${formatRequestType(selectedRequest.requestType)} to ${formatTier(selectedRequest.requestedTier)}`} />
                    <DetailItem label="Current tier" value={formatTier(selectedRequest.currentTier)} />
                    <DetailItem label="Created" value={formatDate(selectedRequest.createdAt)} />
                  </div>
                  {selectedRequest.parentNote && (
                    <div className="rounded-md border border-border/70 p-3 text-sm text-muted-foreground">
                      {selectedRequest.parentNote}
                    </div>
                  )}
                  <div className="grid gap-3">
                    <label className="space-y-2 text-sm font-medium text-foreground">
                      Admin note
                      <Textarea
                        value={adminNote}
                        onChange={(event) => setAdminNote(event.target.value)}
                        rows={3}
                      />
                    </label>
                    <label className="space-y-2 text-sm font-medium text-foreground">
                      Effective date
                      <Input
                        value={effectiveAt}
                        onChange={(event) => setEffectiveAt(event.target.value)}
                        placeholder="2026-06-08 or leave blank"
                      />
                    </label>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button type="button" variant="outline" onClick={() => transition('in_review')} disabled={updateMutation.isPending}>
                      Mark in review
                    </Button>
                    <Button type="button" variant="outline" onClick={() => transition('approved')} disabled={updateMutation.isPending}>
                      Approve
                    </Button>
                    <Button type="button" variant="outline" onClick={() => transition('rejected')} disabled={updateMutation.isPending}>
                      Reject
                    </Button>
                    <Button type="button" variant="outline" onClick={() => transition('cancelled')} disabled={updateMutation.isPending}>
                      Cancel
                    </Button>
                    <Button type="button" className="sm:col-span-2" onClick={applySelected} disabled={selectedRequest.status !== 'approved' || applyMutation.isPending}>
                      Apply approved tier
                    </Button>
                  </div>
                  {message && <p className="text-sm text-muted-foreground">{message}</p>}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">Lifecycle</p>
                    <div className="space-y-2">
                      {selectedRequest.history.map((event) => (
                        <div key={event.eventId} className="rounded-md border border-border/70 p-3 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium text-foreground">{formatStatus(event.eventType)}</span>
                            <span className="text-muted-foreground">{formatDate(event.eventAt)}</span>
                          </div>
                          {event.note && <p className="mt-2 text-muted-foreground">{event.note}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="brand-rule">
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base">Provider billing visibility</CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  Stripe/TWINT readiness state, webhook event summaries, and manual override context.
                </p>
              </div>
              <Badge variant="outline">Provider-managed vs manual</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {billingQuery.isError && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                Provider billing records are unavailable.
              </p>
            )}
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.75fr)]">
              <div className="grid gap-3">
                {billingQuery.isLoading && <p className="text-sm text-muted-foreground">Loading provider billing...</p>}
                {!billingQuery.isLoading && billingRows.length === 0 && (
                  <p className="text-sm text-muted-foreground">No provider billing records are available yet.</p>
                )}
                {billingRows.map((billing) => (
                  <button
                    key={billing.parentId}
                    type="button"
                    onClick={() => setSelectedBillingParentId(billing.parentId)}
                    className={`w-full rounded-md border p-4 text-left transition hover:bg-muted/50 ${
                      selectedBilling?.parentId === billing.parentId ? 'border-primary bg-[hsl(var(--stoa-brand-burgundy-soft))]' : 'border-border/70'
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-primary" aria-hidden="true" />
                          <p className="font-semibold text-foreground">{billing.parentId}</p>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatTier(billing.subscriptionTier)} / {billing.mode}
                        </p>
                      </div>
                      <Badge variant={billing.status === 'active' ? 'secondary' : 'outline'}>
                        {formatStatus(billing.status)}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
              <ProviderBillingDetail billing={selectedBilling} />
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    </DashboardLayout>
  )
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/70 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

function ProviderBillingDetail({ billing }: { billing?: SubscriptionBilling }) {
  if (!billing) {
    return (
      <div className="rounded-md border border-border/70 p-4 text-sm text-muted-foreground">
        Select a provider billing record to inspect status and recent events.
      </div>
    )
  }
  return (
    <div className="rounded-md border border-border/70 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold text-foreground">{billing.parentId}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {billing.provider ?? 'Manual'} / {billing.mode}
          </p>
        </div>
        <Badge variant={billing.status === 'active' ? 'secondary' : 'outline'}>{formatStatus(billing.status)}</Badge>
      </div>
      <div className="mt-4 grid gap-2 text-sm">
        <DetailItem label="Provider subscription" value={billing.providerSubscriptionId ?? 'None'} />
        <DetailItem label="Checkout session" value={billing.checkoutSessionId ?? 'None'} />
        <DetailItem label="Manual override" value={billing.manualOverrideSource ?? 'None'} />
        <DetailItem label="Last provider event" value={billing.lastProviderEventType ? formatStatus(billing.lastProviderEventType) : 'None'} />
      </div>
      <div className="mt-4 space-y-2">
        <p className="text-sm font-semibold text-foreground">Recent billing events</p>
        {(billing.events ?? []).slice(0, 4).map((event) => (
          <div key={event.eventId} className="rounded-md border border-border/70 p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-foreground">{formatStatus(event.eventType)}</span>
              <span className="text-muted-foreground">{formatDate(event.eventAt)}</span>
            </div>
            {event.providerEventId && (
              <p className="mt-1 text-muted-foreground">{event.providerEventId}</p>
            )}
          </div>
        ))}
        {(billing.events ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No billing events recorded yet.</p>
        )}
      </div>
    </div>
  )
}

function requestIcon(request: SubscriptionRequest) {
  if (request.requestType === 'upgrade') return <ArrowUpCircle className="h-4 w-4 text-emerald-600" aria-hidden="true" />
  if (request.requestType === 'downgrade') return <ArrowDownCircle className="h-4 w-4 text-amber-600" aria-hidden="true" />
  return <XCircle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
}

function formatTier(tier: string) {
  return tier.replace('_', ' ').replace(/^\w/, (letter) => letter.toUpperCase())
}

function formatStatus(status: string) {
  return status.replace(/[_.]/g, ' ').replace(/^\w/, (letter: string) => letter.toUpperCase())
}

function formatRequestType(type: string) {
  if (type === 'upgrade') return 'Upgrade'
  if (type === 'downgrade') return 'Downgrade'
  return 'Cancel'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}
