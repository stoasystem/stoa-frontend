import { useEffect, useMemo, useState } from 'react'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
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

function stringifyIntervention(value: Record<string, unknown>, t: TFunction) {
  const label = value.studentId || value.topicId || value.publicId || value.reason || t('admin:learningOps.interventionFallback')
  const reason = value.reason || value.suggestedAction || value.priorityReason || value.type
    || t('admin:learningOps.interventionReasonFallback')
  return { label: String(label), reason: String(reason) }
}

export function LearningOperationsDashboardPage() {
  const { t } = useTranslation('admin')
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
  // Two different answers share this panel: a summary, and "your account may
  // read the analytics but not export them". Neither is an empty panel.
  const exportDenied = exportQuery.data?.permissionDenied === true
  const exportSummary = exportQuery.data?.summary

  const summaryTiles = useMemo(() => [
    {
      label: t('learningOps.signals'),
      value: valueFromRecord(analytics?.summary, 'totalSignals'),
      detail: t('learningOps.sampledRows', { count: analytics?.sampleSize ?? 0 }),
    },
    {
      label: t('learningOps.assignmentStarts'),
      value: valueFromRecord(analytics?.summary, 'assignmentStarts'),
      detail: t('learningOps.practiceStarted'),
    },
    {
      label: t('learningOps.completions'),
      value: valueFromRecord(analytics?.summary, 'assignmentCompletions') + valueFromRecord(analytics?.summary, 'lessonCompletions'),
      detail: t('learningOps.completionsDetail'),
    },
    {
      label: t('learningOps.sequencingCoverage'),
      value: valueFromRecord(analytics?.sequencingCoverage, 'coveredTopics'),
      detail: t('learningOps.uncoveredTopics', {
        count: valueFromRecord(analytics?.sequencingCoverage, 'uncoveredTopics'),
      }),
    },
  ], [analytics, t])

  const refreshAll = () => {
    void analyticsQuery.refetch()
    void readinessQuery.refetch()
    void exportQuery.refetch()
  }

  return (
    <DashboardLayout>
      <PageContainer size="wide" className="p-0">
        <PageHeader
          eyebrow={t('learningOps.eyebrow')}
          title={t('learningOps.title')}
          description={t('learningOps.description')}
          actions={(
            <Button variant="outline" onClick={refreshAll}>
              <RefreshCw className="h-4 w-4" />
              {t('learningOps.refresh')}
            </Button>
          )}
        />

        <Card>
          <CardContent className="grid gap-3 pt-6 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="ops-subject">{t('learningOps.subjectFilter')}</Label>
              <Input
                id="ops-subject"
                value={subjectInput}
                placeholder="math"
                onChange={(event) => setSubjectInput(event.target.value)}
              />
            </div>
            <Button onClick={() => setSubjectId(subjectInput.trim())}>
              <BarChart3 className="h-4 w-4" />
              {t('learningOps.applyFilter')}
            </Button>
          </CardContent>
        </Card>

        {analyticsQuery.isLoading && <LoadingState message={t('learningOps.loading')} />}
        {analyticsQuery.error && <ErrorState title={t('learningOps.failed')} message={analyticsQuery.error.message} />}

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
                    {t('learningOps.qualityHotspots')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analytics.qualityHotspots.length === 0 && (
                    <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                      {t('learningOps.noHotspots')}
                    </p>
                  )}
                  {analytics.qualityHotspots.map((hotspot) => (
                    <div key={`${hotspot.publicId}-${hotspot.versionId}`} className="grid gap-3 rounded-md border p-4 md:grid-cols-[1fr_auto]">
                      <div>
                        <p className="font-semibold">{hotspot.publicId}</p>
                        <p className="text-sm text-muted-foreground">
                          {hotspot.subjectId || t('learningOps.subjectPending')} / {hotspot.topicId || t('learningOps.topicPending')} / {hotspot.contentType}
                        </p>
                      </div>
                      <div className="grid min-w-44 grid-cols-2 gap-2 text-sm">
                        <span>{t('learningOps.priority', { score: hotspot.priorityScore })}</span>
                        <span>{t('learningOps.wrong', { count: hotspot.wrongAnswers })}</span>
                        <span>{t('learningOps.starts', { count: hotspot.assignmentStarts })}</span>
                        <span>{t('learningOps.done', { count: hotspot.assignmentCompletions })}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Activity className="h-5 w-5" />
                    {t('learningOps.interventions')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analytics.interventions.length === 0 && (
                    <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                      {t('learningOps.noInterventions')}
                    </p>
                  )}
                  {analytics.interventions.map((item, index) => {
                    const intervention = stringifyIntervention(item, t)
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
                {t('learningOps.warehouseReadiness')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {readinessQuery.isLoading && <LoadingState message={t('learningOps.loadingReadiness')} />}
              {readinessQuery.error && <ErrorState title={t('learningOps.readinessFailed')} message={readinessQuery.error.message} />}
              {readiness && (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <InlineMetric label={t('learningOps.state')} value={readiness.state} />
                    <InlineMetric
                      label={t('learningOps.exportAllowed')}
                      value={readiness.exportAllowed ? t('learningOps.yes') : t('learningOps.no')}
                    />
                    <InlineMetric
                      label={t('learningOps.liveWarehouse')}
                      value={readiness.liveWarehouseConfigured ? t('learningOps.configured') : t('learningOps.notConfigured')}
                    />
                  </div>
                  {readiness.liveWarehouseConfigured === false && (
                    <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                      {t('learningOps.noLiveWarehouse')}
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
              <CardTitle className="text-xl">{t('learningOps.exportSummary')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {exportQuery.isLoading && <LoadingState message={t('learningOps.loadingExport')} />}
              {exportQuery.error && <ErrorState title={t('learningOps.exportFailed')} message={exportQuery.error.message} />}
              {exportDenied && (
                <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  {/* The grant is a capability id, the same in every language. */}
                  {t('learningOps.exportDenied', { grant: 'curriculum_analytics_exporter' })}
                </p>
              )}
              {exportSummary && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <InlineMetric label={t('learningOps.rows')} value={exportSummary.count} />
                  <InlineMetric label={t('learningOps.schema')} value={exportSummary.schemaVersion} />
                  <InlineMetric
                    label={t('learningOps.piiRemoved')}
                    value={exportSummary.privacy?.piiRemoved ? t('learningOps.yes') : t('learningOps.check')}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </DashboardLayout>
  )
}
