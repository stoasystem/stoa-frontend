import { type FormEvent, useMemo, useState } from 'react'
import { Eye, Mail, RefreshCw, RotateCcw, Search, Send } from 'lucide-react'
import { AdminUnavailableCard } from '@/components/admin/AdminUnavailableCard'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  useBulkResendReportEmailsMutation,
  useReportOperationDetailQuery,
  useReportOperationsQuery,
  useResendReportEmailMutation,
  useRetryReportGenerationMutation,
} from '@/hooks/admin/useAdminReportOperations'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import type {
  BulkReportResendItemResult,
  ReportOperationRow,
  ReportOperationTarget,
  ReportOperationsListFilters,
} from '@/services/admin/adminApi'

type FilterDraft = {
  status: string
  weekStart: string
  parentId: string
  studentId: string
}

const statusOptions = [
  { label: 'Any status', value: '' },
  { label: 'Generation failed', value: 'generation_failed' },
  { label: 'Email failed', value: 'email_failed' },
  { label: 'Email sent', value: 'email_sent' },
  { label: 'Generated', value: 'generated' },
]

export function AdminReportOperationsPage() {
  const [draft, setDraft] = useState<FilterDraft>({
    status: 'email_failed',
    weekStart: '',
    parentId: '',
    studentId: '',
  })
  const [filters, setFilters] = useState<ReportOperationsListFilters>({
    status: 'email_failed',
    limit: 25,
  })
  const [pageToken, setPageToken] = useState<string | null>(null)
  const [tokenHistory, setTokenHistory] = useState<(string | null)[]>([])
  const [selectedTarget, setSelectedTarget] = useState<ReportOperationTarget | null>(null)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [singleActionResult, setSingleActionResult] = useState<string | null>(null)
  const [bulkResults, setBulkResults] = useState<BulkReportResendItemResult[]>([])

  const activeFilters = useMemo(
    () => ({
      ...filters,
      nextToken: pageToken,
    }),
    [filters, pageToken],
  )
  const reportsQuery = useReportOperationsQuery(activeFilters)
  const detailQuery = useReportOperationDetailQuery(selectedTarget)
  const retryMutation = useRetryReportGenerationMutation()
  const resendMutation = useResendReportEmailMutation()
  const bulkResendMutation = useBulkResendReportEmailsMutation()

  const rows = reportsQuery.data?.items ?? []
  const detail = detailQuery.data ?? rows.find((row) => selectedTarget && targetKey(row) === targetKey(selectedTarget))
  const selectedBulkTargets = rows
    .filter((row) => selectedKeys.has(targetKey(row)) && row.actions.resend_email.enabled)
    .map(targetFromReport)

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFilters({
      status: draft.status || undefined,
      weekStart: draft.weekStart || undefined,
      parentId: draft.parentId || undefined,
      studentId: draft.studentId || undefined,
      limit: 25,
    })
    setPageToken(null)
    setTokenHistory([])
    setSelectedKeys(new Set())
    setBulkResults([])
  }

  function resetFilters() {
    const nextDraft = { status: 'email_failed', weekStart: '', parentId: '', studentId: '' }
    setDraft(nextDraft)
    setFilters({ status: 'email_failed', limit: 25 })
    setPageToken(null)
    setTokenHistory([])
    setSelectedKeys(new Set())
    setBulkResults([])
  }

  function goNextPage() {
    if (!reportsQuery.data?.next_token) return
    setTokenHistory((history) => [...history, pageToken])
    setPageToken(reportsQuery.data.next_token)
    setSelectedKeys(new Set())
  }

  function goPreviousPage() {
    setTokenHistory((history) => {
      const previous = history[history.length - 1] ?? null
      setPageToken(previous)
      return history.slice(0, -1)
    })
    setSelectedKeys(new Set())
  }

  function toggleSelection(row: ReportOperationRow) {
    const key = targetKey(row)
    setSelectedKeys((current) => {
      const next = new Set(current)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  function retrySelectedReport() {
    if (!detail) return
    retryMutation.mutate(targetFromReport(detail), {
      onSuccess: (result) => {
        setSingleActionResult(`Retry ${result.operation_result}: ${result.status}`)
      },
      onError: (error) => {
        setSingleActionResult(error.message)
      },
    })
  }

  function resendSelectedReport() {
    if (!detail) return
    resendMutation.mutate(targetFromReport(detail), {
      onSuccess: (result) => {
        setSingleActionResult(`Resend ${result.operation_result}: ${result.status}`)
      },
      onError: (error) => {
        setSingleActionResult(error.message)
      },
    })
  }

  function resendSelectedBulk() {
    if (selectedBulkTargets.length === 0) return
    bulkResendMutation.mutate(selectedBulkTargets, {
      onSuccess: (result) => {
        setBulkResults(result.results)
        setSelectedKeys(new Set())
      },
      onError: (error) => {
        setSingleActionResult(error.message)
      },
    })
  }

  return (
    <DashboardLayout>
      <PageContainer className="p-0" size="wide">
        <PageHeader
          eyebrow="Admin operations"
          title="Report operations"
          description="Triage weekly report generation and delivery recovery from the admin backend."
          actions={
            <Button
              type="button"
              variant="outline"
              onClick={() => void reportsQuery.refetch()}
              disabled={reportsQuery.isFetching}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          }
        />

        <form className="rounded-md border bg-card/70 p-4" onSubmit={applyFilters}>
          <div className="grid gap-3 md:grid-cols-[minmax(150px,0.8fr),repeat(3,minmax(150px,1fr)),auto]">
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Status
              <select
                value={draft.status}
                onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}
                className="h-10 w-full rounded-md border border-border/90 bg-card/75 px-3 text-sm normal-case tracking-normal text-foreground focus-visible:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Week start
              <Input
                type="date"
                value={draft.weekStart}
                onChange={(event) => setDraft((current) => ({ ...current, weekStart: event.target.value }))}
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Parent ID
              <Input
                value={draft.parentId}
                onChange={(event) => setDraft((current) => ({ ...current, parentId: event.target.value }))}
                placeholder="parent id"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Student ID
              <Input
                value={draft.studentId}
                onChange={(event) => setDraft((current) => ({ ...current, studentId: event.target.value }))}
                placeholder="student id"
              />
            </label>
            <div className="flex items-end gap-2">
              <Button type="submit">
                <Search className="h-4 w-4" />
                Filter
              </Button>
              <Button type="button" variant="outline" onClick={resetFilters}>
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </form>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr),360px]">
          <section className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                {reportsQuery.isFetching ? 'Loading reports' : `${reportsQuery.data?.count ?? 0} reports`}
                {reportsQuery.data?.access_pattern && (
                  <span className="ml-2 rounded-md border px-2 py-1 text-xs">
                    {reportsQuery.data.access_pattern}
                  </span>
                )}
              </div>
              <Button
                type="button"
                onClick={resendSelectedBulk}
                disabled={selectedBulkTargets.length === 0 || bulkResendMutation.isPending}
              >
                <Send className="h-4 w-4" />
                Resend selected ({selectedBulkTargets.length})
              </Button>
            </div>

            <div className="overflow-x-auto rounded-md border bg-card">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b bg-muted/45 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="w-10 px-3 py-3">Pick</th>
                    <th className="px-3 py-3">Report</th>
                    <th className="px-3 py-3">Student</th>
                    <th className="px-3 py-3">Week</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Delivery</th>
                    <th className="px-3 py-3">Last operation</th>
                    <th className="px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reportsQuery.isLoading && (
                    <tr>
                      <td className="px-3 py-8 text-muted-foreground" colSpan={8}>
                        Loading report operations.
                      </td>
                    </tr>
                  )}
                  {!reportsQuery.isLoading && rows.length === 0 && (
                    <tr>
                      <td className="px-3 py-8 text-muted-foreground" colSpan={8}>
                        No reports match current filters.
                      </td>
                    </tr>
                  )}
                  {rows.map((row) => {
                    const key = targetKey(row)
                    const resendEnabled = row.actions.resend_email.enabled
                    return (
                      <tr key={key} className="border-b last:border-0">
                        <td className="px-3 py-3 align-top">
                          <input
                            type="checkbox"
                            aria-label={`Select ${row.report_id}`}
                            checked={selectedKeys.has(key)}
                            disabled={!resendEnabled}
                            onChange={() => toggleSelection(row)}
                            className="h-4 w-4 rounded border-border"
                          />
                        </td>
                        <td className="max-w-[220px] px-3 py-3 align-top">
                          <p className="truncate font-medium">{row.report_id}</p>
                          <p className="truncate text-xs text-muted-foreground">{row.parent_id}</p>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <p className="font-medium">{row.student_name || row.student_id}</p>
                          <p className="text-xs text-muted-foreground">{row.student_id}</p>
                        </td>
                        <td className="px-3 py-3 align-top">{row.week_start}</td>
                        <td className="px-3 py-3 align-top">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="px-3 py-3 align-top">
                          <StatusBadge status={row.email_status} />
                        </td>
                        <td className="px-3 py-3 align-top">
                          <p>{row.operations.last_operation || 'None'}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.operations.last_operation_result || 'No result'}
                          </p>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTarget(targetFromReport(row))
                              setSingleActionResult(null)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-3">
              <Button type="button" variant="outline" disabled={tokenHistory.length === 0} onClick={goPreviousPage}>
                Previous
              </Button>
              <p className="text-xs text-muted-foreground">
                Page {tokenHistory.length + 1}
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={!reportsQuery.data?.next_token}
                onClick={goNextPage}
              >
                Next
              </Button>
            </div>
          </section>

          <aside className="min-w-0 space-y-4">
            <ReportDetailPanel
              report={detail}
              isLoading={detailQuery.isLoading}
              onRetry={retrySelectedReport}
              onResend={resendSelectedReport}
              retryPending={retryMutation.isPending}
              resendPending={resendMutation.isPending}
              actionResult={singleActionResult}
            />
            {bulkResults.length > 0 && <BulkResultPanel results={bulkResults} />}
          </aside>
        </div>

        {reportsQuery.isError && (
          <AdminUnavailableCard
            title="Report operations unavailable"
            description="We could not load report operations right now. Please try again in a moment."
          />
        )}
      </PageContainer>
    </DashboardLayout>
  )
}

function ReportDetailPanel({
  report,
  isLoading,
  onRetry,
  onResend,
  retryPending,
  resendPending,
  actionResult,
}: {
  report?: ReportOperationRow
  isLoading: boolean
  onRetry: () => void
  onResend: () => void
  retryPending: boolean
  resendPending: boolean
  actionResult: string | null
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">Loading report detail.</CardContent>
      </Card>
    )
  }

  if (!report) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">Select a report to inspect operations.</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="p-4 pb-3">
        <CardTitle className="text-base">Report detail</CardTitle>
        <p className="break-words text-xs text-muted-foreground">{report.report_id}</p>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <DetailItem label="Status" value={report.status} />
          <DetailItem label="Email" value={report.email_status} />
          <DetailItem label="Student" value={report.student_name || report.student_id} />
          <DetailItem label="Week" value={report.week_start} />
        </div>
        <div className="rounded-md border p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Artifacts</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant={report.artifacts.json_available ? 'secondary' : 'outline'}>JSON metadata</Badge>
            <Badge variant={report.artifacts.html_available ? 'secondary' : 'outline'}>HTML available</Badge>
          </div>
        </div>
        <div className="space-y-2">
          <DetailItem label="Generation error" value={report.generation.generation_error_message} />
          <DetailItem label="Delivery error" value={report.delivery.email_error_message} />
          <DetailItem label="Last operator" value={report.operations.last_operation_by} />
          <DetailItem label="Last updated" value={formatDate(report.operations.updated_at)} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            onClick={onRetry}
            disabled={!report.actions.retry_generation.enabled || retryPending}
            title={report.actions.retry_generation.reason ?? undefined}
          >
            <RotateCcw className="h-4 w-4" />
            Retry
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onResend}
            disabled={!report.actions.resend_email.enabled || resendPending}
            title={report.actions.resend_email.reason ?? undefined}
          >
            <Mail className="h-4 w-4" />
            Resend
          </Button>
        </div>
        {actionResult && (
          <div className="rounded-md border bg-muted/35 px-3 py-2 text-xs text-muted-foreground">
            {actionResult}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function BulkResultPanel({ results }: { results: BulkReportResendItemResult[] }) {
  return (
    <Card>
      <CardHeader className="p-4 pb-3">
        <CardTitle className="text-base">Bulk resend results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-0">
        {results.map((result) => (
          <div
            key={targetKey(result)}
            className="flex items-start justify-between gap-3 rounded-md border px-3 py-2 text-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{result.student_id}</p>
              <p className="text-xs text-muted-foreground">{result.detail || result.status || result.week_start}</p>
            </div>
            <StatusBadge status={result.result} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm">{value || 'Unavailable'}</p>
    </div>
  )
}

function StatusBadge({ status }: { status?: string | null }) {
  const normalized = status || 'unknown'
  const variant = normalized.includes('failed') ? 'destructive' : normalized.includes('sent') ? 'secondary' : 'outline'
  return <Badge variant={variant}>{normalized.replace(/_/g, ' ')}</Badge>
}

function targetFromReport(report: ReportOperationRow): ReportOperationTarget {
  return {
    parent_id: report.parent_id,
    student_id: report.student_id,
    week_start: report.week_start,
  }
}

function targetKey(target: ReportOperationTarget) {
  return `${target.parent_id}:${target.student_id}:${target.week_start}`
}

function formatDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

export default AdminReportOperationsPage
