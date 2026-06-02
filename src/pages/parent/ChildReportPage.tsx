import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BackButton } from '@/components/common/BackButton'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { PageContainer } from '@/components/common/PageContainer'
import { PageActions } from '@/components/common/PageActions'
import { PageHeader } from '@/components/common/PageHeader'
import { PageSkeleton } from '@/components/common/PageSkeleton'
import { ParentValueCard } from '@/components/parent/ParentValueCard'
import { UpgradePromptCard } from '@/components/parent/UpgradePromptCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useChildReportQuery } from '@/hooks/parent/useChildReportQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { trackEvent } from '@/services/analytics/analyticsClient'

export function ChildReportPage() {
  const { t } = useTranslation('parent')
  const { childId } = useParams()
  const reportQuery = useChildReportQuery(childId)
  const reportState = reportQuery.data
  const report = reportState?.report

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
                { label: childId ?? t('child'), to: childId ? `/parent/children/${childId}` : undefined },
                { label: t('weeklyReport') },
              ]}
            />
            <PageHeader
              className="mb-0"
              title={t('weeklyReport')}
              description={t('reportDescription')}
            />
          </div>
          <PageActions
            primary={
              childId && (
                <Button asChild>
                  <Link to={`/parent/children/${childId}/monthly-report`}>{t('monthlyReport')}</Link>
                </Button>
              )
            }
            secondary={childId && <BackButton label={t('childSummary')} to={`/parent/children/${childId}`} />}
          />
        </div>
        {reportQuery.isLoading && <PageSkeleton rows={4} />}
        {reportQuery.isError && <p className="text-sm text-destructive">{t('loadReportFailed')}</p>}
        {reportState?.status === 'missing' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">No weekly report yet</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              {reportState.message ?? 'No weekly report is available yet.'}
            </CardContent>
          </Card>
        )}
        {(reportState?.status === 'available' || reportState?.status === 'pending' || reportState?.status === 'failed') && report && (
          <div className="report-surface space-y-6 rounded-lg border border-border/70 p-4 shadow-[var(--platform-shadow-soft)] sm:p-6">
            <Card className="border-primary/15 bg-card/90">
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="editorial-heading text-2xl">Weekly report</CardTitle>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                      {report.summary || reportState.message || 'Report details are being prepared.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={reportState.status === 'failed' ? 'destructive' : reportState.status === 'pending' ? 'outline' : 'secondary'}>
                      {formatReportStatus(report.reportStatus, reportState.status)}
                    </Badge>
                    {report.emailStatus && (
                      <Badge variant={report.emailStatus === 'failed' ? 'destructive' : 'outline'}>
                        Email {formatEmailStatus(report.emailStatus)}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                  <div>
                    <p className="font-medium text-foreground">Week</p>
                    <p>{formatWeekRange(report.weekStart, report.weekEnd)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Generated</p>
                    <p>{report.generatedAt ? formatDateTime(report.generatedAt) : 'Pending'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Report ID</p>
                    <p className="break-all">{report.reportId}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="grid gap-4 md:grid-cols-3">
              <ReportMetric label="Questions" value={String(report.stats?.questionsAsked ?? report.usageCount)} description="Asked this report week" />
              <ReportMetric label="Practice" value={String(report.stats?.practiceLessonsCompleted ?? 0)} description="Completed practice lessons" />
              <ReportMetric label="Teacher help" value={String(report.stats?.teacherHelpRequests ?? report.teacherResolved)} description="Support requests recorded" />
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weak topics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {getWeakTopics(report).length === 0 && (
                  <p className="text-sm text-muted-foreground">No weak topics were flagged.</p>
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
                <CardTitle className="text-lg">Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {getRecommendations(report).length === 0 && (
                  <p className="text-sm text-muted-foreground">No recommendations are available yet.</p>
                )}
                {getRecommendations(report).map((recommendation) => (
                  <p key={recommendation} className="rounded-md border p-3 text-sm leading-6 text-muted-foreground">
                    {recommendation}
                  </p>
                ))}
              </CardContent>
            </Card>
            {((report.strengths ?? []).length > 0 || report.teacherNote || reportState.status === 'pending' || reportState.status === 'failed' || report.emailStatus === 'failed') && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Report notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                  {(report.strengths ?? []).map((strength) => (
                    <p key={strength}>{strength}</p>
                  ))}
                  {report.teacherNote && <p>{report.teacherNote}</p>}
                  {report.emailStatus === 'failed' && (
                    <p>The report is available here, but the email delivery did not complete.</p>
                  )}
                  {reportState.status === 'pending' && (
                    <p>{reportState.message || 'Weekly report generation is still in progress.'}</p>
                  )}
                  {reportState.status === 'failed' && (
                    <p>{reportState.message || 'Report generation failed.'}</p>
                  )}
                </CardContent>
              </Card>
            )}
            <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
              <ParentValueCard />
              <UpgradePromptCard source="parent_report" />
            </div>
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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString()
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString()
}

function formatWeekRange(start: string, end?: string | null) {
  return end ? `${formatDate(start)} - ${formatDate(end)}` : formatDate(start)
}

function formatReportStatus(status: string | null | undefined, stateStatus: string) {
  if (stateStatus === 'failed') return 'Generation failed'
  if (stateStatus === 'pending') return 'Generation pending'
  if (status === 'email_failed') return 'Generated'
  if (status === 'email_sent') return 'Generated'
  if (status === 'generated') return 'Generated'
  return 'Report available'
}

function formatEmailStatus(status: string) {
  if (status === 'sent') return 'sent'
  if (status === 'failed') return 'failed'
  if (status === 'pending') return 'pending'
  return status.replace(/_/g, ' ')
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
