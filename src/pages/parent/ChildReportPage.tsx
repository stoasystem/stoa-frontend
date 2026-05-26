import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BackButton } from '@/components/common/BackButton'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { PageContainer } from '@/components/common/PageContainer'
import { PageActions } from '@/components/common/PageActions'
import { PageHeader } from '@/components/common/PageHeader'
import { PageSkeleton } from '@/components/common/PageSkeleton'
import { ParentReportRecommendations } from '@/components/parent/ParentReportRecommendations'
import { ParentReportStats } from '@/components/parent/ParentReportStats'
import { ParentReportSubjects } from '@/components/parent/ParentReportSubjects'
import { ParentReportSummaryCard } from '@/components/parent/ParentReportSummaryCard'
import { LearningActivitySummary } from '@/components/parent/LearningActivitySummary'
import { ParentPracticeSummaryCard } from '@/components/parent/ParentPracticeSummaryCard'
import { ParentValueCard } from '@/components/parent/ParentValueCard'
import { UpgradePromptCard } from '@/components/parent/UpgradePromptCard'
import { Button } from '@/components/ui/button'
import { useChildReportQuery } from '@/hooks/parent/useChildReportQuery'
import { usePracticeParentSummaryQuery } from '@/hooks/practice/usePracticeParentSummaryQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { trackEvent } from '@/services/analytics/analyticsClient'

export function ChildReportPage() {
  const { t } = useTranslation('parent')
  const { childId } = useParams()
  const reportQuery = useChildReportQuery(childId)
  const practiceSummaryQuery = usePracticeParentSummaryQuery(childId)
  const report = reportQuery.data

  useEffect(() => {
    if (!report) return

    trackEvent('parent_report_viewed', {
      childId: report.student.id,
      reportId: report.id,
      periodLabel: report.period.label,
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
                { label: report?.student.name ?? t('child'), to: childId ? `/parent/children/${childId}` : undefined },
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
        {report && (
          <div className="report-surface space-y-6 rounded-lg border border-border/70 p-4 shadow-[var(--platform-shadow-soft)] sm:p-6">
            <ParentReportSummaryCard report={report} />
            <ParentReportStats stats={report.stats} />
            <LearningActivitySummary summary={practiceSummaryQuery.data} />
            {practiceSummaryQuery.data && (
              <ParentPracticeSummaryCard summary={practiceSummaryQuery.data} />
            )}
            <ParentReportSubjects subjects={report.topSubjects} weakTopics={report.weakTopics} />
            <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
              <ParentValueCard />
              <UpgradePromptCard source="parent_report" />
            </div>
            <ParentReportRecommendations recommendations={report.recommendations} />
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
