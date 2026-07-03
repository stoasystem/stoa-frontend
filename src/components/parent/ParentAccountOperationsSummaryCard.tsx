import { ArrowRight, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useParentAccountOperationsQuery } from '@/hooks/parent/useParentAccountOperationsQuery'
import { describeIssueCode, formatStatus, supportStateTone } from '@/components/parent/accountOperationsView'

export function ParentAccountOperationsSummaryCard() {
  const query = useParentAccountOperationsQuery()
  const data = query.data
  const supportState = data?.supportState
  const state = supportState?.state ?? 'loading'
  const issueCount = (supportState?.blockers.length ?? 0) + (supportState?.warnings.length ?? 0)
  const Icon = state === 'blocked' ? ShieldAlert : state === 'attention' ? AlertTriangle : CheckCircle2

  return (
    <Card className="border-border/70 bg-card/95 shadow-[var(--platform-shadow-card)]">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Account operations</CardTitle>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Billing, child access, verification, and usage status in one place.
            </p>
          </div>
          <Badge variant={state === 'ready' ? 'secondary' : 'outline'}>{formatStatus(state)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {query.isLoading && (
          <div className="rounded-md border border-border/70 bg-background/80 p-3 text-sm text-muted-foreground" aria-busy="true">
            Loading account status...
          </div>
        )}
        {query.isError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
            Account operations are unavailable.
          </div>
        )}
        {data && (
          <div className={`rounded-md border p-3 ${supportStateTone(state)}`}>
            <div className="flex items-start gap-3">
              <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-medium text-foreground">
                  {state === 'ready' ? 'Account is ready' : `${issueCount} item${issueCount === 1 ? '' : 's'} need attention`}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {firstIssue(data.supportState) ?? `${data.children.length} linked child account${data.children.length === 1 ? '' : 's'} visible.`}
                </p>
              </div>
            </div>
          </div>
        )}
        <Button asChild variant="outline" className="w-full justify-between">
          <Link to="/parent/account-operations">
            View account operations
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function firstIssue(state: { blockers: string[]; warnings: string[] }) {
  const code = state.blockers[0] ?? state.warnings[0]
  return code ? describeIssueCode(code) : null
}
