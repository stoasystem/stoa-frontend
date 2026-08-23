import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Clock3, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  useCreateParentSubscriptionRequestMutation,
  useParentSubscriptionQuery,
  useParentSubscriptionRequestsQuery,
} from '@/hooks/parent/useParentSubscriptionOperations'
import type {
  SubscriptionBilling,
  SubscriptionPlanBenefits,
  SubscriptionRequest,
  SubscriptionRequestType,
  SubscriptionTier,
} from '@/types/subscriptionOperations'

const tierOrder: SubscriptionTier[] = ['free_trial', 'student', 'teacher_supported', 'family']

const tierTone: Record<SubscriptionTier, string> = {
  free_trial: 'border-border/70 bg-card',
  student: 'border-primary/30 bg-[hsl(var(--stoa-brand-burgundy-soft))]',
  teacher_supported: 'border-amber-400/50 bg-amber-50/80',
  family: 'border-emerald-400/50 bg-emerald-50/80',
}

export function ParentSubscriptionOperationsCard() {
  const subscriptionQuery = useParentSubscriptionQuery()
  const requestsQuery = useParentSubscriptionRequestsQuery()
  const createRequestMutation = useCreateParentSubscriptionRequestMutation()
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('student')
  const [note, setNote] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const subscription = subscriptionQuery.data
  const currentTier = subscription?.currentTier ?? 'free_trial'
  const plans = subscription?.plans
  const pendingRequest = subscription?.pendingRequest
  const billing = subscription?.billing
  const recentRequests = requestsQuery.data?.items ?? []
  const requestType = useMemo<SubscriptionRequestType>(() => {
    if (selectedTier === 'free_trial') return 'cancel'
    if (tierOrder.indexOf(selectedTier) > tierOrder.indexOf(currentTier)) return 'upgrade'
    return 'downgrade'
  }, [currentTier, selectedTier])

  function submitRequest() {
    setMessage(null)
    createRequestMutation.mutate(
      {
        requestType,
        requestedTier: selectedTier,
        parentNote: note || undefined,
      },
      {
        onSuccess: (request) => {
          setMessage(`Request ${request.status}: ${formatTier(request.requestedTier)}`)
          setNote('')
        },
        onError: (error) => {
          setMessage(error.message)
        },
      },
    )
  }

  if (subscriptionQuery.isLoading) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">Loading plan details...</CardContent>
      </Card>
    )
  }

  if (subscriptionQuery.isError) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-destructive">Subscription details are unavailable.</CardContent>
      </Card>
    )
  }

  return (
    <Card className="brand-rule overflow-hidden">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base">Subscription operations</CardTitle>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Current plan: <span className="font-semibold text-foreground">{formatTier(currentTier)}</span>
            </p>
          </div>
          <Badge variant={pendingRequest ? 'secondary' : 'outline'}>
            {pendingRequest ? formatStatus(pendingRequest.status) : 'No open request'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <ProviderBillingStatus billing={billing} />
        {pendingRequest && <PendingRequest request={pendingRequest} />}
        <div className="grid gap-3 md:grid-cols-3">
          {plans && tierOrder.map((tier) => {
            const benefits = plans[tier]
            if (!benefits) return null
            return (
              <PlanOption
                key={tier}
                tier={tier}
                benefits={benefits}
                currentTier={currentTier}
                selected={selectedTier === tier}
                disabled={Boolean(pendingRequest) || tier === currentTier}
                onSelect={() => setSelectedTier(tier)}
              />
            )
          })}
        </div>
        <div className="space-y-3">
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Add a note for STOA operations"
            disabled={Boolean(pendingRequest) || createRequestMutation.isPending}
            rows={3}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedTier === currentTier
                ? 'Choose a different plan to create a request.'
                : `Submit ${formatRequestType(requestType)} request for ${formatTier(selectedTier)}.`}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={submitRequest}
                disabled={Boolean(pendingRequest) || selectedTier === currentTier || createRequestMutation.isPending}
              >
                Submit request
              </Button>
              <Button asChild>
                <Link to="/billing">Open secure billing</Link>
              </Button>
            </div>
          </div>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </div>
        <RecentRequests requests={recentRequests} />
      </CardContent>
    </Card>
  )
}

function ProviderBillingStatus({
  billing,
}: {
  billing?: SubscriptionBilling
}) {
  const status = billing?.status ?? 'none'
  return (
    <div className="rounded-md border border-border/70 bg-[hsl(var(--platform-surface-app))] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Provider billing</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {billingStatusCopy(status, billing)}
          </p>
        </div>
        <Badge variant={status === 'active' ? 'secondary' : 'outline'}>{formatStatus(status)}</Badge>
      </div>
      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
        <BillingFact label="Mode" value={billing?.mode ?? 'manual'} />
        <BillingFact label="Managed tier" value={formatTier(billing?.subscriptionTier ?? 'free_trial')} />
        <BillingFact label="Last event" value={billing?.lastProviderEventType ? formatStatus(billing.lastProviderEventType) : 'None'} />
      </div>
    </div>
  )
}

function BillingFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/70 bg-background/80 p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  )
}

function PlanOption({
  tier,
  benefits,
  currentTier,
  selected,
  disabled,
  onSelect,
}: {
  tier: SubscriptionTier
  benefits: SubscriptionPlanBenefits
  currentTier: SubscriptionTier
  selected: boolean
  disabled: boolean
  onSelect: () => void
}) {
  const isCurrent = tier === currentTier
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`min-h-44 rounded-md border p-4 text-left transition ${tierTone[tier]} ${
        selected ? 'ring-2 ring-primary ring-offset-2' : ''
      } ${disabled && !isCurrent ? 'cursor-not-allowed opacity-60' : 'hover:-translate-y-0.5 hover:shadow-sm'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">{benefits.label}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
            {benefits.dailyAiQuestionLimit} AI questions/day
          </p>
        </div>
        {isCurrent && <Badge variant="secondary">Current</Badge>}
      </div>
      <div className="mt-4 space-y-2 text-sm leading-5 text-muted-foreground">
        <p>Teacher support: {formatBenefit(benefits.teacherSupport)}</p>
        <p>Weekly report: {formatBenefit(benefits.weeklyReport)}</p>
      </div>
    </button>
  )
}

function PendingRequest({ request }: { request: SubscriptionRequest }) {
  return (
    <div className="rounded-md border border-primary/30 bg-[hsl(var(--platform-surface-app))] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold text-foreground">
            {formatRequestType(request.requestType)} to {formatTier(request.requestedTier)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Submitted {formatDate(request.createdAt)}</p>
        </div>
        <Badge variant="secondary">{formatStatus(request.status)}</Badge>
      </div>
      {request.adminNote && <p className="mt-3 text-sm text-muted-foreground">{request.adminNote}</p>}
    </div>
  )
}

function RecentRequests({ requests }: { requests: SubscriptionRequest[] }) {
  const visible = requests.slice(0, 3)
  if (visible.length === 0) return null
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-foreground">Recent subscription requests</p>
      <div className="grid gap-2">
        {visible.map((request) => (
          <div key={request.requestId} className="flex items-center justify-between gap-3 rounded-md border border-border/70 p-3 text-sm">
            <div className="min-w-0">
              <p className="font-medium text-foreground">{formatTier(request.requestedTier)}</p>
              <p className="text-muted-foreground">{formatDate(request.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              {statusIcon(request.status)}
              <span className="text-muted-foreground">{formatStatus(request.status)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function statusIcon(status: string) {
  if (status === 'applied') return <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
  if (status === 'rejected' || status === 'cancelled') return <XCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
  return <Clock3 className="h-4 w-4 text-primary" aria-hidden="true" />
}

function formatTier(tier: string) {
  return tier.replace('_', ' ').replace(/^\w/, (letter) => letter.toUpperCase())
}

function formatStatus(status: string) {
  return status.replace(/[_.]/g, ' ').replace(/^\w/, (letter: string) => letter.toUpperCase())
}

function formatRequestType(type: SubscriptionRequestType) {
  if (type === 'upgrade') return 'upgrade'
  if (type === 'downgrade') return 'downgrade'
  return 'cancellation'
}

function formatBenefit(value: string) {
  return value.replace('_', ' ')
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function billingStatusCopy(status: string, billing?: SubscriptionBilling) {
  if (status === 'active') return `Provider-managed ${formatTier(billing?.subscriptionTier ?? 'free_trial')} subscription is active.`
  if (status === 'checkout_pending') return `Checkout is pending for ${formatTier(billing?.requestedTier ?? 'student')}.`
  if (status === 'payment_failed' || status === 'past_due') return 'Payment needs attention before the provider-managed subscription is healthy.'
  if (status === 'manual_override') return 'A STOA admin applied this plan manually; provider events will not override it automatically.'
  if (status === 'canceled') return 'Provider-managed subscription is canceled.'
  return 'No provider-managed billing is attached yet; manual subscription requests remain available.'
}
