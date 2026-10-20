import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { BackButton } from '@/components/common/BackButton'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { PageContainer } from '@/components/common/PageContainer'
import { PageActions } from '@/components/common/PageActions'
import { PageHeader } from '@/components/common/PageHeader'
import { PageSkeleton } from '@/components/common/PageSkeleton'
import { ParentValueCard } from '@/components/parent/ParentValueCard'
// Card 007 (frozen): import { UpgradePromptCard } from '@/components/parent/UpgradePromptCard'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useChildLearningSummaryQuery } from '@/hooks/parent/useChildLearningSummaryQuery'
import { useChildReportQuery } from '@/hooks/parent/useChildReportQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { formatDate, formatDateTime } from '@/lib/formatDateTime'
import { trackEvent } from '@/services/analytics/analyticsClient'

export function ChildReportPage() {
  const { t } = useTranslation('parent')
  const { childId } = useParams()
  const reportQuery = useChildReportQuery(childId)
  const reportState = reportQuery.data
  const report = reportState?.report
  // The same query the child page reads, so the name is usually cached already.
  const childName = useChildLearningSummaryQuery(childId).data?.student.name
  // A pending or failed report carries placeholder zeros and empty lists, and an
  // email that was never due; only a finished report has results to show (#338).
  const isReady = reportState?.status === 'available'

  useEffect(() => {
    if (!report) return

    trackEvent('parent_report_viewed', {
      childId: report.studentId,
      reportId: report.reportId,
      periodLabel: report.weekStart,
    })
  }, [report])

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <Breadcrumbs
              items={[
                { label: t('dashboardTitle'), to: '/parent' },
                { label: childName || t('child'), to: childId ? `/parent/children/${childId}` : undefined },
                { label: t('weeklyReport') },
              ]}
            />
            <PageHeader
              className="mb-0"
              title={t('weeklyReport')}
              description={t('reportDescription')}
            />
          </div>
          {/*
            * The monthly report button comes back when /parent/children/:id/monthly-report
            * is a registered route; until then it would open the 404 page (#25).
            * primary={<Button asChild><Link to={`/parent/children/${childId}/monthly-report`}>{t('monthlyReport')}</Link></Button>}
          */}
          <PageActions
            secondary={childId && <BackButton label={t('childSummary')} to={`/parent/children/${childId}`} />}
          />
        </div>
        {reportQuery.isLoading && <PageSkeleton rows={4} />}
        {reportQuery.isError && <p className="text-sm text-destructive">{t('loadReportFailed')}</p>}
        {reportState?.status === 'missing' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('report.noReportTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              {/* The backend's `message` is English whatever the reader's language (#254). */}
              {t('report.noReportBody')}
            </CardContent>
          </Card>
        )}
        {(reportState?.status === 'available' || reportState?.status === 'pending' || reportState?.status === 'failed') && report && (
          <div className="report-surface space-y-6 rounded-lg border border-border/70 p-4 shadow-[var(--platform-shadow-soft)] sm:p-6">
            <Card className="border-primary/15 bg-card/90">
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="editorial-heading text-2xl">{t('weeklyReport')}</CardTitle>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                      {report.summary || t(reportState.status === 'failed' ? 'report.summaryUnavailable' : 'report.summaryFallback')}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={reportState.status === 'failed' ? 'destructive' : reportState.status === 'pending' ? 'outline' : 'secondary'}>
                      {formatReportStatus(report.reportStatus, reportState.status, t)}
                    </Badge>
                    {isReady && report.emailStatus && (
                      <Badge variant={report.emailStatus === 'failed' ? 'destructive' : 'outline'}>
                        {formatEmailBadge(report.emailStatus, t)}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                  <div>
                    <p className="font-medium text-foreground">{t('report.week')}</p>
                    <p>{formatWeekRange(report.weekStart, report.weekEnd)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t('report.generated')}</p>
                    <p>{report.generatedAt ? formatDateTime(report.generatedAt) : t('report.generatedPending')}</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t('report.reportId')}</p>
                    <p className="break-all">{report.reportId}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {isReady && (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <ReportMetric label={t('report.questions')} value={String(report.stats?.questionsAsked ?? report.usageCount)} description={t('report.questionsDescription')} />
                  <ReportMetric label={t('report.practice')} value={String(report.stats?.practiceLessonsCompleted ?? 0)} description={t('report.practiceDescription')} />
                  <ReportMetric label={t('report.teacherHelp')} value={String(report.stats?.teacherHelpRequests ?? report.teacherResolved)} description={t('report.teacherHelpDescription')} />
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('report.weakTopics')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {getWeakTopics(report).length === 0 && (
                      <p className="text-sm text-muted-foreground">{t('report.noWeakTopics')}</p>
                    )}
                    {getWeakTopics(report).map((topic) => (
                      <div key={topic.topic} className="rounded-md border p-3">
                        <p className="text-sm font-medium text-foreground">{topic.topic}</p>
                        {topic.note && <p className="mt-1 text-sm leading-6 text-muted-foreground">{topic.note}</p>}
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('report.recommendations')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {getRecommendations(report).length === 0 && (
                      <p className="text-sm text-muted-foreground">{t('report.noRecommendations')}</p>
                    )}
                    {getRecommendations(report).map((recommendation) => (
                      <p key={recommendation} className="rounded-md border p-3 text-sm leading-6 text-muted-foreground">
                        {recommendation}
                      </p>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
            {(!isReady || (report.strengths ?? []).length > 0 || report.teacherNote || report.emailStatus === 'failed') && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('report.notesTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                  {isReady && (report.strengths ?? []).map((strength) => (
                    <p key={strength}>{strength}</p>
                  ))}
                  {isReady && report.teacherNote && <p>{report.teacherNote}</p>}
                  {isReady && report.emailStatus === 'failed' && (
                    <p>{t('report.emailFailedNote')}</p>
                  )}
                  {reportState.status === 'pending' && (
                    <p>{t('report.pendingNote')}</p>
                  )}
                  {reportState.status === 'failed' && (
                    <p>{t('report.failedNote')}</p>
                  )}
                </CardContent>
              </Card>
            )}
            <ParentValueCard />
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}

function ReportMetric({
  label,
  value,
  description,
}: {
  label: string
  value: string
  description: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function formatWeekRange(start: string, end?: string | null) {
  return end ? `${formatDate(start)} - ${formatDate(end)}` : formatDate(start)
}

function formatReportStatus(
  status: string | null | undefined,
  stateStatus: string,
  t: TFunction,
) {
  if (stateStatus === 'failed') return t('report.status.failed')
  if (stateStatus === 'pending') return t('report.status.pending')
  if (status === 'email_failed') return t('report.status.generated')
  if (status === 'email_sent') return t('report.status.generated')
  if (status === 'generated') return t('report.status.generated')
  return t('report.status.available')
}

function formatEmailBadge(status: string, t: TFunction) {
  const known: Record<string, string> = {
    sent: 'report.emailStatus.sent',
    failed: 'report.emailStatus.failed',
    pending: 'report.emailStatus.pending',
    not_started: 'report.emailStatus.notStarted',
  }
  const key = known[status]
  // A status the page has no words for gets a neutral label, never the raw value (#338).
  return key ? t('report.emailBadge', { status: t(key) }) : t('report.emailBadgeUnknown')
}

function getRecommendations(report: {
  recommendationItems?: string[]
  recommendations?: string
}) {
  if (report.recommendationItems?.length) return report.recommendationItems
  return report.recommendations ? [report.recommendations] : []
}

function getWeakTopics(report: {
  weakTopics?: Array<{ topic: string; note: string }>
  weakKnowledgePoints?: string[]
}) {
  if (report.weakTopics?.length) return report.weakTopics
  return (report.weakKnowledgePoints ?? []).map((topic) => ({ topic, note: '' }))
}
