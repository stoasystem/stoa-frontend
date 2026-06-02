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
        {reportState?.status === 'available' && report && (
          <div className="report-surface space-y-6 rounded-lg border border-border/70 p-4 shadow-[var(--platform-shadow-soft)] sm:p-6">
            <Card className="border-primary/15 bg-card/90">
              <CardHeader>
                <CardTitle className="editorial-heading text-2xl">Weekly report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                  <div>
                    <p className="font-medium text-foreground">Week start</p>
                    <p>{formatDate(report.weekStart)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Student ID</p>
                    <p>{report.studentId}</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Report ID</p>
                    <p>{report.reportId}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="grid gap-4 md:grid-cols-3">
              <ReportMetric label="Usage" value={String(report.usageCount)} description="Recorded learning events" />
              <ReportMetric label="AI resolved" value={String(report.aiResolved)} description="Questions handled by AI" />
              <ReportMetric label="Teacher resolved" value={String(report.teacherResolved)} description="Teacher-supported items" />
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weak knowledge points</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.weakKnowledgePoints.length === 0 && (
                  <p className="text-sm text-muted-foreground">No weak knowledge points were flagged.</p>
                )}
                {report.weakKnowledgePoints.map((topic) => (
                  <p key={topic} className="text-sm">{topic}</p>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                {report.recommendations || 'No recommendations are available yet.'}
              </CardContent>
            </Card>
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
