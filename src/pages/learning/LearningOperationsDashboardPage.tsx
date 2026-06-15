import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertCircle, BarChart3, Database, RefreshCw, Target } from 'lucide-react'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useCurriculumAnalyticsDashboardQuery,
  useWarehouseExportSummaryQuery,
  useWarehouseReadinessQuery,
} from '@/hooks/learning/useLearningOperationsQueries'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { trackEvent } from '@/services/analytics/analyticsClient'

function MetricTile({ label, value, detail }: { label: string, value: number | string, detail?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
      </CardContent>
    </Card>
  )
}

function InlineMetric({ label, value }: { label: string, value: number | string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function valueFromRecord(record: Record<string, number> | undefined, key: string) {
  return typeof record?.[key] === 'number' ? record[key] : 0
}

function stringifyIntervention(value: Record<string, unknown>) {
  const label = value.studentId || value.topicId || value.publicId || value.reason || 'Intervention candidate'
  const reason = value.reason || value.suggestedAction || value.priorityReason || value.type || 'Review current learning signals.'
  return { label: String(label), reason: String(reason) }
}

export function LearningOperationsDashboardPage() {
  const [subjectInput, setSubjectInput] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const analyticsQuery = useCurriculumAnalyticsDashboardQuery(subjectId)
  const readinessQuery = useWarehouseReadinessQuery()
  const exportQuery = useWarehouseExportSummaryQuery()

  useEffect(() => {
    trackEvent('learning_operations_dashboard_viewed', { subjectId: subjectId || 'all' })
  }, [subjectId])

  const analytics = analyticsQuery.data
  const readiness = readinessQuery.data
  const exportSummary = exportQuery.data

  const summaryTiles = useMemo(() => [
    {
      label: 'Signals',
      value: valueFromRecord(analytics?.summary, 'totalSignals'),
      detail: `${analytics?.sampleSize ?? 0} sampled rows`,
    },
    {
      label: 'Assignment starts',
      value: valueFromRecord(analytics?.summary, 'assignmentStarts'),
      detail: 'Practice work started',
    },
    {
      label: 'Completions',
      value: valueFromRecord(analytics?.summary, 'assignmentCompletions') + valueFromRecord(analytics?.summary, 'lessonCompletions'),
      detail: 'Assignment and lesson completions',
    },
    {
      label: 'Sequencing coverage',
      value: valueFromRecord(analytics?.sequencingCoverage, 'coveredTopics'),
      detail: `${valueFromRecord(analytics?.sequencingCoverage, 'uncoveredTopics')} uncovered topics`,
    },
  ], [analytics])

  const refreshAll = () => {
    void analyticsQuery.refetch()
    void readinessQuery.refetch()
    void exportQuery.refetch()
  }

  return (
    <DashboardLayout>
      <PageContainer size="wide" className="p-0">
        <PageHeader
          eyebrow="Learning operations"
          title="Operations dashboard"
          description="Inspect sequencing coverage, assignment outcomes, quality signals, interventions, and warehouse readiness from live backend contracts."
          actions={(
            <Button variant="outline" onClick={refreshAll}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          )}
        />

        <Card>
          <CardContent className="grid gap-3 pt-6 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="ops-subject">Subject filter</Label>
              <Input
                id="ops-subject"
                value={subjectInput}
                placeholder="math"
                onChange={(event) => setSubjectInput(event.target.value)}
              />
            </div>
            <Button onClick={() => setSubjectId(subjectInput.trim())}>
              <BarChart3 className="h-4 w-4" />
              Apply filter
            </Button>
          </CardContent>
        </Card>

        {analyticsQuery.isLoading && <LoadingState message="Loading learning operations dashboard..." />}
        {analyticsQuery.error && <ErrorState title="Dashboard failed" message={analyticsQuery.error.message} />}

        {analytics && (
          <>
            {analytics.emptyState && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="flex gap-3 pt-6 text-sm text-amber-950">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{analytics.emptyState}</p>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {summaryTiles.map((tile) => (
                <MetricTile key={tile.label} {...tile} />
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Target className="h-5 w-5" />
                    Quality hotspots
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analytics.qualityHotspots.length === 0 && (
                    <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                      No quality hotspots returned for this filter.
                    </p>
                  )}
                  {analytics.qualityHotspots.map((hotspot) => (
                    <div key={`${hotspot.publicId}-${hotspot.versionId}`} className="grid gap-3 rounded-md border p-4 md:grid-cols-[1fr_auto]">
                      <div>
                        <p className="font-semibold">{hotspot.publicId}</p>
                        <p className="text-sm text-muted-foreground">
                          {hotspot.subjectId || 'subject pending'} / {hotspot.topicId || 'topic pending'} / {hotspot.contentType}
                        </p>
                      </div>
                      <div className="grid min-w-44 grid-cols-2 gap-2 text-sm">
                        <span>Priority {hotspot.priorityScore}</span>
                        <span>{hotspot.wrongAnswers} wrong</span>
                        <span>{hotspot.assignmentStarts} starts</span>
                        <span>{hotspot.assignmentCompletions} done</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Activity className="h-5 w-5" />
                    Interventions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analytics.interventions.length === 0 && (
                    <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                      No intervention candidates returned.
                    </p>
                  )}
                  {analytics.interventions.map((item, index) => {
                    const intervention = stringifyIntervention(item)
                    return (
                      <div key={`${intervention.label}-${index}`} className="rounded-md border p-4">
                        <p className="font-semibold">{intervention.label}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{intervention.reason}</p>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Database className="h-5 w-5" />
                Warehouse readiness
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {readinessQuery.isLoading && <LoadingState message="Loading warehouse readiness..." />}
              {readinessQuery.error && <ErrorState title="Warehouse readiness failed" message={readinessQuery.error.message} />}
              {readiness && (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <InlineMetric label="State" value={readiness.state} />
                    <InlineMetric label="Export allowed" value={readiness.exportAllowed ? 'Yes' : 'No'} />
                    <InlineMetric label="Live warehouse" value={readiness.liveWarehouseConfigured ? 'Configured' : 'Not configured'} />
                  </div>
                  {readiness.liveWarehouseConfigured === false && (
                    <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                      No live warehouse is configured. This is expected for internal development and should stay explicit.
                    </p>
                  )}
                  {[...readiness.blockers, ...readiness.warnings].map((item) => (
                    <p key={item} className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">{item}</p>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Export summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {exportQuery.isLoading && <LoadingState message="Loading warehouse export summary..." />}
              {exportQuery.error && <ErrorState title="Warehouse export failed" message={exportQuery.error.message} />}
              {exportSummary && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <InlineMetric label="Rows" value={exportSummary.count} />
                  <InlineMetric label="Schema" value={exportSummary.schemaVersion} />
                  <InlineMetric label="PII removed" value={exportSummary.privacy?.piiRemoved ? 'Yes' : 'Check'} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </DashboardLayout>
  )
}
