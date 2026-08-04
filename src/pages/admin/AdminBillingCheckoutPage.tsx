import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CheckCircle2, Clock, HelpCircle, Loader2, RefreshCw, Search, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { getAdminCheckoutDetail, recheckAdminCheckout } from '@/services/admin/adminBillingApi'
import type { CheckoutOutcome } from '@/types/billing'

function outcomeBadge(outcome: CheckoutOutcome) {
  switch (outcome) {
    case 'active':
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Active
        </Badge>
      )
    case 'confirming':
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Confirming
        </Badge>
      )
    case 'not_completed':
      return (
        <Badge variant="secondary">
          <XCircle className="h-3 w-3 mr-1" />
          Not completed
        </Badge>
      )
    case 'support_needed':
      return (
        <Badge variant="destructive">
          <HelpCircle className="h-3 w-3 mr-1" />
          Support needed
        </Badge>
      )
  }
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start">
      <span className="text-xs text-muted-foreground w-40 shrink-0">{label}</span>
      <span className="text-sm font-medium break-all">{value}</span>
    </div>
  )
}

export function AdminBillingCheckoutPage() {
  const [inputRef, setInputRef] = useState('')
  const [activeRef, setActiveRef] = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-checkout', activeRef],
    queryFn: () => getAdminCheckoutDetail(activeRef!),
    enabled: Boolean(activeRef),
    retry: 1,
  })

  const recheck = useMutation({
    mutationFn: () => recheckAdminCheckout(activeRef!),
    onSuccess: () => refetch(),
  })

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = inputRef.trim()
    if (trimmed) setActiveRef(trimmed)
  }

  return (
    <DashboardLayout>
      <PageContainer className="p-0 space-y-6">
        <PageHeader
          eyebrow="Admin · Billing"
          title="Checkout recovery"
          description="Look up a checkout command by its reference ID and trigger a read-only provider recheck. No charges or mutations are performed."
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Look up checkout</CardTitle>
            <CardDescription>Enter the checkoutRef from the parent's billing view or support request.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="checkout-ref" className="sr-only">
                  Checkout reference
                </Label>
                <Input
                  id="checkout-ref"
                  placeholder="e.g. chk_01j8abc…"
                  value={inputRef}
                  onChange={(e) => setInputRef(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <Button type="submit" disabled={!inputRef.trim()}>
                <Search className="h-4 w-4 mr-2" />
                Look up
              </Button>
            </form>
          </CardContent>
        </Card>

        {activeRef && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">Checkout detail</CardTitle>
                <CardDescription className="font-mono text-xs mt-1">{activeRef}</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => recheck.mutate()}
                disabled={recheck.isPending || isLoading}
              >
                {recheck.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Recheck
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading…
                </div>
              )}
              {isError && (
                <p className="text-sm text-destructive">
                  Could not load checkout. Check the reference ID and try again.
                </p>
              )}
              {data && (
                <div className="space-y-2">
                  <DetailRow label="Outcome" value={outcomeBadge(data.outcome)} />
                  <DetailRow label="Target plan" value={data.targetPlan} />
                  <DetailRow
                    label="Effective plan"
                    value={data.effectivePlan ?? <span className="text-muted-foreground">—</span>}
                  />
                  <DetailRow
                    label="Beneficiaries"
                    value={data.beneficiaries.join(', ') || <span className="text-muted-foreground">—</span>}
                  />
                  <DetailRow label="Last rechecked" value={new Date(data.lastRecheckedAt).toLocaleString()} />
                  {data.commandState && (
                    <DetailRow label="Command state" value={<span className="font-mono text-xs">{data.commandState}</span>} />
                  )}
                  {data.billingState && (
                    <DetailRow label="Billing state" value={<span className="font-mono text-xs">{data.billingState}</span>} />
                  )}
                  <DetailRow
                    label="New checkout allowed"
                    value={data.newCheckoutAllowed ? 'Yes' : 'No'}
                  />
                  {data.safeActions.length > 0 && (
                    <DetailRow
                      label="Safe actions"
                      value={
                        <div className="flex flex-wrap gap-1">
                          {data.safeActions.map((a) => (
                            <Badge key={a} variant="outline" className="font-mono text-xs">
                              {a}
                            </Badge>
                          ))}
                        </div>
                      }
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
